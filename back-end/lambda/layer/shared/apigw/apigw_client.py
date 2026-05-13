"""
apigw_client.py

API Gateway WebSocket management client.
Provides a clean interface for posting messages back
to connected WebSocket clients via the API Gateway
Management API.

Handles stale connection cleanup automatically —
if a connectionId is no longer valid, it is removed
from the connection store and the error is swallowed
so broadcasting continues uninterrupted.

Usage:
    from shared.apigw.apigw_client import ApigwClient
    from shared.stores.connection_store import ConnectionStore

    client = ApigwClient(domain='abc123.execute-api.us-east-1.amazonaws.com', stage='prod')
    client.post(connection_id, payload)
    client.broadcast(store, payload, exclude='self-connection-id')
"""

import json
import boto3
from botocore.exceptions import ClientError
from shared.stores.connection_store import ConnectionStore


class ApigwClient:
    """
    Wraps the API Gateway Management API to provide
    clean message posting and broadcasting capabilities.

    Initialized with the domain and stage from the Lambda
    event request context so it always targets the correct
    API Gateway endpoint regardless of environment.
    """

    def __init__(self, domain: str, stage: str) -> None:
        """
        :param domain: The API Gateway domain name from the request context
        :param stage:  The API Gateway stage name from the request context
        """
        self._client = boto3.client(
            'apigatewaymanagementapi',
            endpoint_url=f'https://{domain}/{stage}'
        )

    def post(self, connection_id: str, payload: dict) -> None:
        """
        Posts a JSON message to a single connected WebSocket client.

        Silently ignores GoneException — the connection is stale
        and will be cleaned up by the TTL or next broadcast cycle.
        All other ClientErrors are re-raised for the caller to handle.

        :param connection_id: Target WebSocket connectionId
        :param payload:       Dictionary payload to serialize and send as JSON
        """
        try:
            self._client.post_to_connection(
                ConnectionId=connection_id,
                Data=json.dumps(payload)
            )
        except ClientError as e:
            if e.response['Error']['Code'] == 'GoneException':
                # Connection is stale — ignore and move on
                pass
            else:
                raise

    def broadcast(
        self,
        store: ConnectionStore,
        payload: dict,
        exclude: str = None
    ) -> None:
        """
        Broadcasts a JSON message to all active connections,
        optionally excluding a specific connectionId.

        Stale connections encountered during broadcast are
        removed from the connection store automatically to
        keep the registry clean without a separate cleanup job.

        :param store:   ConnectionStore instance for retrieving active connectionIds
        :param payload: Dictionary payload to serialize and broadcast as JSON
        :param exclude: Optional connectionId to exclude from broadcast —
                        typically the sender's own connectionId
        """
        connections = store.get_all()

        for connection in connections:
            connection_id = connection['connectionId']

            if connection_id == exclude:
                continue

            try:
                self._client.post_to_connection(
                    ConnectionId=connection_id,
                    Data=json.dumps(payload)
                )
            except ClientError as e:
                if e.response['Error']['Code'] == 'GoneException':
                    # Stale connection — remove from registry and continue
                    store.remove(connection_id)
                else:
                    raise
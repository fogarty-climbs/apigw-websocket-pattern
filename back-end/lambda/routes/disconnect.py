"""
disconnect.py

Handles the $disconnect route for the API Gateway WebSocket API.

Responsibilities:
    1. Fetch the connection details before removing
    2. Remove the connectionId from the connection registry
    3. Broadcast a leave event with display name to all remaining connections

Environment Variables:
    TABLE_NAME: DynamoDB connections table name
"""

import json
from shared.database.db_client import DbClient
from shared.database.adapters.dynamodb_adapter import DynamoAdapter
from shared.stores.connection_store import ConnectionStore
from shared.apigw.apigw_client import ApigwClient


def lambda_handler(event, context):
    connection_id = event['requestContext']['connectionId']
    domain = event['requestContext']['domainName']
    stage = event['requestContext']['stage']

    # Initialize clients
    db = DbClient(DynamoAdapter())
    store = ConnectionStore(db)
    apigw = ApigwClient(domain=domain, stage=stage)

    # Get display name before removing
    all_connections = store.get_all()
    connection = next(
        (c for c in all_connections if c['connectionId'] == connection_id),
        {'connectionId': connection_id, 'displayName': 'Anonymous'}
    )

    # Remove the connection from the registry
    store.remove(connection_id)

    # Broadcast leave event with display name to all remaining connections
    apigw.broadcast(store, {
        'type': 'leave',
        'connectionId': connection_id,
        'displayName': connection['displayName']
    })

    return {'statusCode': 200}
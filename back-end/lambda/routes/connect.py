"""
connect.py

Handles the $connect route for the API Gateway WebSocket API.

Responsibilities:
    1. Extract display name from query string parameters
    2. Store the incoming connectionId and display name in the connection registry
    3. Send the new connection the current list of active connections with display names
    4. Broadcast a join event with display name to all existing connections

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

    query_params = event.get('queryStringParameters') or {}
    display_name = query_params.get('displayName', 'Anonymous')

    db = DbClient(DynamoAdapter())
    store = ConnectionStore(db)
    apigw = ApigwClient(domain=domain, stage=stage)

    # Store the new connection first
    store.add(connection_id, display_name)

    # Now fetch the full list including the new joiner
    all_connections = store.get_all()

    # Send the new connection the complete connections list
    apigw.post(connection_id, {
        'type': 'connections',
        'connections': all_connections
    })

    # Broadcast join event to all existing connections excluding the new joiner
    apigw.broadcast(store, {
        'type': 'join',
        'connectionId': connection_id,
        'displayName': display_name
    }, exclude=connection_id)

    return {'statusCode': 200}
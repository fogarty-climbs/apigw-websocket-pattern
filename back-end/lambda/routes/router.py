"""
router.py

Handles the $default route for the API Gateway WebSocket API.
Routes incoming messages by type — either returning the current
connections list to the requester or broadcasting a chat message
to all other active connections.

Responsibilities:
    1. Parse the incoming message payload and determine type
    2. For 'connections' — return current connections list to requester
    3. For 'message' — broadcast to all other active connections
                       with the sender's display name

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

    # Parse incoming message body
    try:
        body = json.loads(event.get('body', '{}'))
        print('RECEIVED', body)
    except json.JSONDecodeError:
        return {'statusCode': 400}

    # Initialize clients
    db = DbClient(DynamoAdapter())
    store = ConnectionStore(db)
    apigw = ApigwClient(domain=domain, stage=stage)

    message_type = body.get('type')

    # Handle connections request — return full connections list to requester
    if message_type == 'connections':
        print(f'Handling connections request for {connection_id}')
        all_connections = store.get_all()
        print(f'Found {len(all_connections)} connections')
        apigw.post(connection_id, {
            'type': 'connections',
            'connections': all_connections,
            'selfConnectionId': connection_id
        })
        print(f'Posted connections to {connection_id}')
        return {'statusCode': 200}

    # Handle chat message — broadcast to all other connections
    if message_type == 'message':
        print(f'Handling message from {connection_id}')
        all_connections = store.get_all()
        sender = next(
            (c for c in all_connections if c['connectionId'] == connection_id),
            {'connectionId': connection_id, 'displayName': 'Anonymous'}
        )
        apigw.broadcast(store, {
            'type': 'message',
            'connectionId': connection_id,
            'displayName': sender['displayName'],
            'content': body.get('content', '')
        }, exclude=connection_id)
        return {'statusCode': 200}

    print(f'Unknown message type: {message_type}')
    return {'statusCode': 400}
"""
test_db_client.py

Integration test suite for the database abstraction layer.
Validates DbClient, DynamoAdapter, and ConnectionStore
against the live DynamoDB connections table.

Tests:
    - Adding a single connection
    - Retrieving all connections
    - Adding multiple connections
    - Removing a specific connection without affecting others
    - Cleanup

Usage:
    py test_db_client.py
"""

import os
import sys

path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../library'))
sys.path.insert(0, path)

from database.db_client import DbClient
from database.adapters.dynamodb_adapter import DynamoAdapter
from stores.connection_store import ConnectionStore

TABLE_NAME = os.environ.get('TABLE_NAME', 'apigw-websocket-pattern-connections-table')

TEST_CONNECTION_001 = 'test-connection-001'
TEST_CONNECTION_002 = 'test-connection-002'

passed = 0
failed = 0


def section(title: str) -> None:
    print(f'\n{"─" * 50}')
    print(f'  {title}')
    print(f'{"─" * 50}')


def success(message: str) -> None:
    global passed
    passed += 1
    print(f'  ✅ {message}')


def failure(message: str) -> None:
    global failed
    failed += 1
    print(f'  ❌ {message}')


def summary() -> None:
    print(f'\n{"═" * 50}')
    print(f'  Results: {passed} passed, {failed} failed')
    print(f'{"═" * 50}\n')
    if failed > 0:
        sys.exit(1)


def test_add_single_connection(store: ConnectionStore) -> None:
    section('Test: add single connection')
    store.add(TEST_CONNECTION_001)
    connections = store.get_all()
    if TEST_CONNECTION_001 in connections:
        success(f'Added {TEST_CONNECTION_001}')
    else:
        failure(f'Expected {TEST_CONNECTION_001} in connections')


def test_get_all(store: ConnectionStore) -> None:
    section('Test: get all connections')
    connections = store.get_all()
    print(f'  Connections: {connections}')
    if len(connections) >= 1:
        success(f'Retrieved {len(connections)} connection(s)')
    else:
        failure('Expected at least one connection')


def test_add_second_connection(store: ConnectionStore) -> None:
    section('Test: add second connection')
    store.add(TEST_CONNECTION_002)
    connections = store.get_all()
    print(f'  Connections: {connections}')
    if TEST_CONNECTION_002 in connections:
        success(f'Added {TEST_CONNECTION_002}')
    else:
        failure(f'Expected {TEST_CONNECTION_002} in connections')


def test_remove_specific_connection(store: ConnectionStore) -> None:
    section('Test: remove specific connection')
    store.remove(TEST_CONNECTION_001)
    connections = store.get_all()
    print(f'  Connections after remove: {connections}')
    if TEST_CONNECTION_001 not in connections:
        success(f'Removed {TEST_CONNECTION_001}')
    else:
        failure(f'Expected {TEST_CONNECTION_001} to be removed')
    if TEST_CONNECTION_002 in connections:
        success(f'{TEST_CONNECTION_002} unaffected by remove')
    else:
        failure(f'Expected {TEST_CONNECTION_002} to remain')


def cleanup(store: ConnectionStore) -> None:
    section('Cleanup')
    store.remove(TEST_CONNECTION_002)
    connections = store.get_all()
    if len(connections) == 0:
        success('Table clean')
    else:
        failure(f'Expected empty table, found: {connections}')


def run() -> None:
    print(f'\n{"═" * 50}')
    print(f'  DB Client Integration Test')
    print(f'  Table: {TABLE_NAME}')
    print(f'{"═" * 50}')

    db = DbClient(DynamoAdapter(table_name=TABLE_NAME))
    store = ConnectionStore(db)

    test_add_single_connection(store)
    test_get_all(store)
    test_add_second_connection(store)
    test_remove_specific_connection(store)
    cleanup(store)
    summary()


if __name__ == '__main__':
    run()
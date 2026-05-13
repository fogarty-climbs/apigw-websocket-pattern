"""
test_connection_store.py

Integration test suite for ConnectionStore.
Validates the domain-specific connection registry
against the live DynamoDB connections table.

Tests:
    - Adding a connection and verifying TTL is set
    - Verifying connectionId is stored correctly
    - Adding multiple connections
    - Removing a specific connection without affecting others
    - get_all returns only connectionIds not raw items
    - Cleanup

Usage:
    py test_connection_store.py
"""

import os
import sys
import time

path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../library'))
sys.path.insert(0, path)

from database.db_client import DbClient
from database.adapters.dynamodb_adapter import DynamoAdapter
from stores.connection_store import ConnectionStore

TABLE_NAME = os.environ.get('TABLE_NAME', 'apigw-websocket-pattern-connections-table')

TEST_CONNECTION_001 = 'test-cs-connection-001'
TEST_CONNECTION_002 = 'test-cs-connection-002'
TEST_CONNECTION_003 = 'test-cs-connection-003'

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


def test_add_sets_ttl(store: ConnectionStore, db: DbClient) -> None:
    section('Test: add sets TTL on connection')
    before = int(time.time())
    store.add(TEST_CONNECTION_001)
    after = int(time.time())

    items = db.get_all()
    item = next((i for i in items if i['connectionId'] == TEST_CONNECTION_001), None)

    if item is None:
        failure(f'Expected {TEST_CONNECTION_001} in table')
        return

    ttl = int(item.get('ttl', 0))
    expected_min = before + (60 * 60 * 24)
    expected_max = after + (60 * 60 * 24)

    if expected_min <= ttl <= expected_max:
        success(f'TTL set correctly: {ttl}')
    else:
        failure(f'TTL out of expected range: {ttl}')


def test_get_all_returns_connection_ids_only(store: ConnectionStore) -> None:
    section('Test: get_all returns connectionIds not raw items')
    store.add(TEST_CONNECTION_002)
    connections = store.get_all()
    print(f'  Connections: {connections}')

    if all(isinstance(c, str) for c in connections):
        success('get_all returns list of strings')
    else:
        failure('Expected list of strings')

    if TEST_CONNECTION_001 in connections and TEST_CONNECTION_002 in connections:
        success('Both connections present')
    else:
        failure('Expected both connections in get_all')


def test_add_multiple_connections(store: ConnectionStore) -> None:
    section('Test: add multiple connections')
    store.add(TEST_CONNECTION_003)
    connections = store.get_all()
    print(f'  Connections: {connections}')

    if len(connections) >= 3:
        success(f'{len(connections)} connections present')
    else:
        failure(f'Expected at least 3 connections, got {len(connections)}')


def test_remove_does_not_affect_others(store: ConnectionStore) -> None:
    section('Test: remove specific connection leaves others intact')
    store.remove(TEST_CONNECTION_002)
    connections = store.get_all()
    print(f'  Connections after remove: {connections}')

    if TEST_CONNECTION_002 not in connections:
        success(f'Removed {TEST_CONNECTION_002}')
    else:
        failure(f'Expected {TEST_CONNECTION_002} to be removed')

    if TEST_CONNECTION_001 in connections and TEST_CONNECTION_003 in connections:
        success('Remaining connections unaffected')
    else:
        failure('Expected remaining connections to be unaffected')


def cleanup(store: ConnectionStore) -> None:
    section('Cleanup')
    store.remove(TEST_CONNECTION_001)
    store.remove(TEST_CONNECTION_002)
    store.remove(TEST_CONNECTION_003)
    connections = store.get_all()
    if len(connections) == 0:
        success('Table clean')
    else:
        failure(f'Expected empty table, found: {connections}')


def run() -> None:
    print(f'\n{"═" * 50}')
    print(f'  ConnectionStore Integration Test')
    print(f'  Table: {TABLE_NAME}')
    print(f'{"═" * 50}')

    db = DbClient(DynamoAdapter(table_name=TABLE_NAME))
    store = ConnectionStore(db)

    test_add_sets_ttl(store, db)
    test_get_all_returns_connection_ids_only(store)
    test_add_multiple_connections(store)
    test_remove_does_not_affect_others(store)
    cleanup(store)
    summary()


if __name__ == '__main__':
    run()
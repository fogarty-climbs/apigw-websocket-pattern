"""
connection_store.py

Connection registry providing a clean, domain-specific
interface for managing active WebSocket connectionIds
and their associated display names.

Built on top of DbClient so the underlying storage
adapter can be swapped without touching this layer.

Usage:
    from shared.database.db_client import DbClient
    from shared.database.adapters.dynamodb_adapter import DynamoAdapter
    from shared.stores.connection_store import ConnectionStore

    db = DbClient(DynamoAdapter())
    store = ConnectionStore(db)

    store.add('abc123', 'Chris')
    store.remove('abc123')
    store.get_all()
"""

import time
from shared.database.db_client import DbClient

TTL_DURATION = 60 * 60 * 24


class ConnectionStore:
    """
    Domain-specific store for managing active WebSocket
    connectionIds and their associated display names.
    """

    def __init__(self, db: DbClient) -> None:
        """
        :param db: A configured DbClient instance
        """
        self._db = db

    def add(self, connection_id: str, display_name: str = 'Anonymous') -> None:
        """
        Registers a new active WebSocket connection with a display name.

        :param connection_id: The API Gateway WebSocket connectionId
        :param display_name:  The user's chosen display name
        """
        self._db.put({
            'connectionId': connection_id,
            'displayName': display_name,
            'ttl': int(time.time()) + TTL_DURATION
        })

    def remove(self, connection_id: str) -> None:
        """
        Removes a connectionId from the registry on disconnect.

        :param connection_id: The API Gateway WebSocket connectionId
        """
        self._db.delete({'connectionId': connection_id})

    def get_all(self) -> list[dict]:
        """
        Returns all active connections with their display names.

        :returns: List of dicts with connectionId and displayName
        """
        items = self._db.get_all()
        return [
            {
                'connectionId': item['connectionId'],
                'displayName': item.get('displayName', 'Anonymous')
            }
            for item in items
        ]
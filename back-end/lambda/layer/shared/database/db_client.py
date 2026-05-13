"""
db_client.py

Generic database client interface defining the contract
that any storage adapter must fulfill.

Provides a clean abstraction over the underlying database
implementation — swap DynamoDB for Redis, Aurora, or any
other store by providing a conforming adapter without
touching any business logic.

Usage:
    from database.db_client import DbClient
    from database.adapters.dynamodb_adapter import DynamoAdapter

    db = DbClient(DynamoAdapter())
    db.put({'connectionId': 'abc123'})
    db.delete({'connectionId': 'abc123'})
    db.get_all()
"""

from abc import ABC, abstractmethod


class DbAdapter(ABC):
    """
    Abstract base class defining the storage adapter interface.
    Any concrete adapter must implement all three methods.
    """

    @abstractmethod
    def put(self, item: dict) -> None:
        """
        Stores a single item in the underlying data store.

        :param item: Dictionary of attributes to store
        """
        pass

    @abstractmethod
    def delete(self, key: dict) -> None:
        """
        Removes a single item from the underlying data store.

        :param key: Dictionary representing the primary key of the item to remove
        """
        pass

    @abstractmethod
    def get_all(self) -> list[dict]:
        """
        Retrieves all items from the underlying data store.

        :returns: List of item dictionaries
        """
        pass


class DbClient:
    """
    Generic database client that delegates all operations
    to the provided adapter implementation.

    Consumers depend on this interface, never on a
    concrete adapter directly.
    """

    def __init__(self, adapter: DbAdapter) -> None:
        """
        :param adapter: A concrete DbAdapter implementation
        """
        self._adapter = adapter

    def put(self, item: dict) -> None:
        """
        Stores a single item via the adapter.

        :param item: Dictionary of attributes to store
        """
        self._adapter.put(item)

    def delete(self, key: dict) -> None:
        """
        Removes a single item via the adapter.

        :param key: Dictionary representing the primary key
        """
        self._adapter.delete(key)

    def get_all(self) -> list[dict]:
        """
        Retrieves all items via the adapter.

        :returns: List of item dictionaries
        """
        return self._adapter.get_all()
"""
dynamodb_adapter.py

DynamoDB implementation of the DbAdapter interface.
Provides a concrete storage backend using AWS DynamoDB.

Swap this adapter for any other DbAdapter implementation
without touching any business logic or consumer code.

Usage:
    from database.db_client import DbClient
    from database.adapters.dynamodb_adapter import DynamoAdapter

    db = DbClient(DynamoAdapter(table_name='my-table'))
"""

import os
import boto3
from shared.database.db_client import DbAdapter


# DynamoDB resource initialized once at module level
# for reuse across warm Lambda invocations.
dynamodb = boto3.resource('dynamodb')


class DynamoAdapter(DbAdapter):
    """
    Concrete DynamoDB adapter implementing the DbAdapter interface.
    Delegates all storage operations to a DynamoDB table.
    """

    def __init__(self, table_name: str = None) -> None:
        """
        :param table_name: DynamoDB table name. Defaults to the
                           TABLE_NAME environment variable if not provided.
        """
        self._table = dynamodb.Table(
            table_name or os.environ['TABLE_NAME']
        )

    def put(self, item: dict) -> None:
        """
        Stores a single item in the DynamoDB table.

        :param item: Dictionary of attributes to store.
                     Must include the table's primary key.
        """
        self._table.put_item(Item=item)

    def delete(self, key: dict) -> None:
        """
        Removes a single item from the DynamoDB table.

        :param key: Dictionary representing the primary key
                    of the item to remove.
        """
        self._table.delete_item(Key=key)

    def get_all(self) -> list[dict]:
        """
        Scans the DynamoDB table and returns all items.
        Handles pagination for large result sets.

        :returns: List of item dictionaries
        """
        response = self._table.scan()
        items = response.get('Items', [])

        # Handle pagination for large result sets
        while 'LastEvaluatedKey' in response:
            response = self._table.scan(
                ExclusiveStartKey=response['LastEvaluatedKey']
            )
            items.extend(response.get('Items', []))

        return items
# DynamoDB Connection Registry

## Table Name
`apigw-websocket-pattern-connections-table`

## Schema

| Attribute    | Type   | Role |
|-------------|--------|------|
| connectionId | String | Partition Key (PK) |

## Create via AWS CLI

```bash
aws dynamodb create-table \
  --table-name apigw-websocket-pattern-connections-table \
  --attribute-definitions \
      AttributeName=connectionId,AttributeType=S \
  --key-schema \
      AttributeName=connectionId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

## Create via JSON

```bash
aws dynamodb create-table \
  --cli-input-json file://dynamo/table.json
```

## Access Patterns

| Operation | Key | When |
|-----------|-----|------|
| PutItem | connectionId | On $connect |
| DeleteItem | connectionId | On $disconnect |
| Scan | — | On message route — fetch all active connections |
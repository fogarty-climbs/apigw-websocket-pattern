# API Gateway WebSocket API

## API Name
`apigw-websocket-pattern`

## Protocol
`WEBSOCKET`

## Route Selection Expression
`$request.body.type`

## Routes

| Route Key    | Integration | Description |
|-------------|-------------|-------------|
| $connect    | connect Lambda | Fires when a client establishes a WebSocket connection |
| $disconnect | disconnect Lambda | Fires when a client disconnects |
| $default    | router Lambda | Fires for all incoming messages |

## WebSocket URL Format
```
wss://{api-id}.execute-api.{region}.amazonaws.com/{stage}
```

## Message Payload Shape

### Client → Server (message)
```json
{
  "type": "message",
  "content": "Hello world"
}
```

### Server → Client (join)
```json
{
  "type": "join",
  "connectionId": "abc123"
}
```

### Server → Client (leave)
```json
{
  "type": "leave",
  "connectionId": "abc123"
}
```

### Server → Client (connections)
```json
{
  "type": "connections",
  "connectionIds": ["abc123", "def456"]
}
```

### Server → Client (message)
```json
{
  "type": "message",
  "connectionId": "abc123",
  "content": "Hello world"
}
```

## Full Setup via AWS CLI

```bash
# 1. Create the API
API_ID=$(aws apigatewayv2 create-api \
  --cli-input-json file://apigw/api.json \
  --query 'ApiId' \
  --output text \
  --region us-east-1)

# 2. Create Lambda integrations
# Note: replace {lambda_arn} with actual Lambda ARN from your deployment

CONNECT_INT_ID=$(aws apigatewayv2 create-integration \
  --api-id $API_ID \
  --integration-type AWS_PROXY \
  --integration-method POST \
  --integration-uri {connect_lambda_arn} \
  --content-handling-strategy CONVERT_TO_TEXT \
  --query 'IntegrationId' \
  --output text)

DISCONNECT_INT_ID=$(aws apigatewayv2 create-integration \
  --api-id $API_ID \
  --integration-type AWS_PROXY \
  --integration-method POST \
  --integration-uri {disconnect_lambda_arn} \
  --content-handling-strategy CONVERT_TO_TEXT \
  --query 'IntegrationId' \
  --output text)

ROUTER_INT_ID=$(aws apigatewayv2 create-integration \
  --api-id $API_ID \
  --integration-type AWS_PROXY \
  --integration-method POST \
  --integration-uri {router_lambda_arn} \
  --content-handling-strategy CONVERT_TO_TEXT \
  --query 'IntegrationId' \
  --output text)

# 3. Create routes
aws apigatewayv2 create-route \
  --api-id $API_ID \
  --cli-input-json file://apigw/routes/connect.json \
  --target integrations/$CONNECT_INT_ID

aws apigatewayv2 create-route \
  --api-id $API_ID \
  --cli-input-json file://apigw/routes/disconnect.json \
  --target integrations/$DISCONNECT_INT_ID

aws apigatewayv2 create-route \
  --api-id $API_ID \
  --cli-input-json file://apigw/routes/default.json \
  --target integrations/$ROUTER_INT_ID

# 4. Create stage
aws apigatewayv2 create-stage \
  --api-id $API_ID \
  --stage-name prod \
  --auto-deploy \
  --region us-east-1

# 5. Get WebSocket URL
echo "wss://$API_ID.execute-api.us-east-1.amazonaws.com/prod"
```
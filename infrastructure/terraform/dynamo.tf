# -------------------------------------------------------
# DynamoDB — Connection Registry
# Stores active WebSocket connectionIds.
# Cleaned up on disconnect by the disconnect Lambda.
# TTL attribute auto-expires stale connections.
# -------------------------------------------------------

resource "aws_dynamodb_table" "connections" {
  name         = "apigw-websocket-pattern-connections-table"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "connectionId"

  attribute {
    name = "connectionId"
    type = "S"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  tags = {
    Project = "apigw-websocket-pattern"
  }
}
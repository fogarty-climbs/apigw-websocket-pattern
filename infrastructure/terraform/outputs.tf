output "connections_table_name" {
  description = "DynamoDB connections table name"
  value       = aws_dynamodb_table.connections.name
}

output "connections_table_arn" {
  description = "DynamoDB connections table ARN"
  value       = aws_dynamodb_table.connections.arn
}

output "websocket_url" {
  description = "WebSocket endpoint URL for client connections"
  value       = "${aws_apigatewayv2_stage.prod.invoke_url}"
}
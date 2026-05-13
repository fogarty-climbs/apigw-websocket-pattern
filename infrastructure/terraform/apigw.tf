# -------------------------------------------------------
# API Gateway — WebSocket API
# Provides the WebSocket endpoint that clients connect to.
# Routes $connect, $disconnect, and $default to their
# respective Lambda functions.
# -------------------------------------------------------

resource "aws_apigatewayv2_api" "websocket" {
  name                       = "apigw-websocket-pattern"
  protocol_type              = "WEBSOCKET"
  route_selection_expression = "$request.body.type"

  tags = {
    Project = "apigw-websocket-pattern"
  }
}

# -------------------------------------------------------
# Lambda Permissions
# Allows API Gateway to invoke each Lambda function.
# -------------------------------------------------------

resource "aws_lambda_permission" "connect" {
  statement_id  = "AllowAPIGatewayConnect"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.connect.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.websocket.execution_arn}/*/*"
}

resource "aws_lambda_permission" "disconnect" {
  statement_id  = "AllowAPIGatewayDisconnect"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.disconnect.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.websocket.execution_arn}/*/*"
}

resource "aws_lambda_permission" "router" {
  statement_id  = "AllowAPIGatewayRouter"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.router.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.websocket.execution_arn}/*/*"
}

# -------------------------------------------------------
# Integrations
# Wires each Lambda to its API Gateway route.
# -------------------------------------------------------

resource "aws_apigatewayv2_integration" "connect" {
  api_id           = aws_apigatewayv2_api.websocket.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.connect.invoke_arn
}

resource "aws_apigatewayv2_integration" "disconnect" {
  api_id           = aws_apigatewayv2_api.websocket.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.disconnect.invoke_arn
}

resource "aws_apigatewayv2_integration" "router" {
  api_id                    = aws_apigatewayv2_api.websocket.id
  integration_type          = "AWS_PROXY"
  integration_uri           = aws_lambda_function.router.invoke_arn
  content_handling_strategy = "CONVERT_TO_TEXT"
  passthrough_behavior      = "WHEN_NO_MATCH"
}

# -------------------------------------------------------
# Routes
# $connect — fires when a client establishes a connection
# $disconnect — fires when a client disconnects
# $default — fires for all other incoming messages
# -------------------------------------------------------

resource "aws_apigatewayv2_route" "connect" {
  api_id    = aws_apigatewayv2_api.websocket.id
  route_key = "$connect"
  target    = "integrations/${aws_apigatewayv2_integration.connect.id}"
}

resource "aws_apigatewayv2_route" "disconnect" {
  api_id    = aws_apigatewayv2_api.websocket.id
  route_key = "$disconnect"
  target    = "integrations/${aws_apigatewayv2_integration.disconnect.id}"
}

resource "aws_apigatewayv2_route" "default" {
  api_id                              = aws_apigatewayv2_api.websocket.id
  route_key                           = "$default"
  target                              = "integrations/${aws_apigatewayv2_integration.router.id}"
  route_response_selection_expression = "$default"
}

resource "aws_apigatewayv2_route_response" "default" {
  api_id             = aws_apigatewayv2_api.websocket.id
  route_id           = aws_apigatewayv2_route.default.id
  route_response_key = "$default"
}

# -------------------------------------------------------
# Stage — Deployment stage for the WebSocket API
# -------------------------------------------------------

resource "aws_apigatewayv2_stage" "prod" {
  api_id      = aws_apigatewayv2_api.websocket.id
  name        = var.stage
  auto_deploy = true

  tags = {
    Project = "apigw-websocket-pattern"
  }
}
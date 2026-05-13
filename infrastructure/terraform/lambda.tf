# -------------------------------------------------------
# Lambda Layer — Shared Utilities
# Common DynamoDB client setup and response helpers
# shared across all three Lambda functions.
# -------------------------------------------------------

resource "aws_lambda_layer_version" "utils" {
  layer_name          = "apigw-websocket-pattern-utils"
  filename            = "${path.module}/../lambda/layer.zip"
  compatible_runtimes = ["python3.11"]

  description = "Shared DynamoDB client and response utilities"
}

# -------------------------------------------------------
# Lambda — Connect
# Fires on $connect route.
# Stores connectionId in DynamoDB, broadcasts join event
# to all existing connections, sends connections list
# to the new joiner.
# -------------------------------------------------------

resource "aws_lambda_function" "connect" {
  function_name    = "apigw-websocket-pattern-connect"
  role             = aws_iam_role.lambda_exec.arn
  runtime          = "python3.11"
  handler          = "connect.handler"
  filename         = "${path.module}/../lambda/connect.zip"
  source_code_hash = filebase64sha256("${path.module}/../lambda/connect.zip")
  layers = [aws_lambda_layer_version.utils.arn]

  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.connections.name
    }
  }

  tags = {
    Project = "apigw-websocket-pattern"
  }
}

# -------------------------------------------------------
# Lambda — Disconnect
# Fires on $disconnect route.
# Removes connectionId from DynamoDB, broadcasts leave
# event to all remaining connections.
# -------------------------------------------------------

resource "aws_lambda_function" "disconnect" {
  function_name    = "apigw-websocket-pattern-disconnect"
  role             = aws_iam_role.lambda_exec.arn
  runtime          = "python3.11"
  handler          = "disconnect.handler"
  filename         = "${path.module}/../lambda/disconnect.zip"
  source_code_hash = filebase64sha256("${path.module}/../lambda/disconnect.zip")
  layers = [aws_lambda_layer_version.utils.arn]

  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.connections.name
    }
  }

  tags = {
    Project = "apigw-websocket-pattern"
  }
}

# -------------------------------------------------------
# Lambda — Router
# Fires on $default route.
# Receives incoming message, broadcasts to all other
# active connectionIds in DynamoDB.
# -------------------------------------------------------

resource "aws_lambda_function" "router" {
  function_name    = "apigw-websocket-pattern-router"
  role             = aws_iam_role.lambda_exec.arn
  runtime          = "python3.11"
  handler          = "router.handler"
  filename         = "${path.module}/../lambda/router.zip"
  source_code_hash = filebase64sha256("${path.module}/../lambda/router.zip")
  layers = [aws_lambda_layer_version.utils.arn]

  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.connections.name
    }
  }

  tags = {
    Project = "apigw-websocket-pattern"
  }
}

# -------------------------------------------------------
# CloudWatch Log Groups
# -------------------------------------------------------

resource "aws_cloudwatch_log_group" "connect" {
  name              = "/aws/lambda/apigw-websocket-pattern-connect"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "disconnect" {
  name              = "/aws/lambda/apigw-websocket-pattern-disconnect"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "router" {
  name              = "/aws/lambda/apigw-websocket-pattern-router"
  retention_in_days = 7
}
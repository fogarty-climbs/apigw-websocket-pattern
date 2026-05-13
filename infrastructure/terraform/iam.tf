# -------------------------------------------------------
# IAM — Lambda Execution Role
# Grants Lambdas permission to:
# - Write logs to CloudWatch
# - Read/write the DynamoDB connections table
# - Post messages back to connected clients via API Gateway
# -------------------------------------------------------

resource "aws_iam_role" "lambda_exec" {
  name = "apigw-websocket-pattern-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Project = "apigw-websocket-pattern"
  }
}

resource "aws_iam_role_policy" "lambda_policy" {
  name = "apigw-websocket-pattern-lambda-policy"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "CloudWatchLogs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Sid    = "DynamoDB"
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:DeleteItem",
          "dynamodb:Scan",
          "dynamodb:GetItem"
        ]
        Resource = aws_dynamodb_table.connections.arn
      },
      {
        Sid    = "ApiGatewayManagement"
        Effect = "Allow"
        Action = [
          "execute-api:ManageConnections"
        ]
        Resource = "arn:aws:execute-api:${var.aws_region}:*:*/${var.stage}/POST/@connections/*"
      }
    ]
  })
}
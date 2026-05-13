"""
deploy.py

Publishes the Lambda layer zip to AWS and optionally
updates specified Lambda functions to use the new version.

Usage:
    py deploy.py

Prerequisites:
    - Run zip.py first to generate layer.zip
    - AWS credentials configured locally
"""

import os
import boto3

# Resolve paths relative to this script
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
LAYER_ZIP_PATH = os.path.join(SCRIPT_DIR, 'layer.zip')

# Layer configuration
LAYER_NAME = 'apigw-websocket-pattern'
REGION = 'us-east-1'

# Lambda functions to update with the new layer version
# Add function names here as the project grows
LAMBDA_FUNCTIONS = [
    'apigw-websocket-pattern-connect',
    'apigw-websocket-pattern-disconnect',
    'apigw-websocket-pattern-router',
]

# Initialize AWS client
lambda_client = boto3.client('lambda', region_name=REGION)


def publish_layer() -> int:
    print(f'Reading layer zip from {LAYER_ZIP_PATH}...')
    with open(LAYER_ZIP_PATH, 'rb') as f:
        layer_bytes = f.read()

    print(f'Publishing layer: {LAYER_NAME}...')
    response = lambda_client.publish_layer_version(
        LayerName=LAYER_NAME,
        Description='Shared database, store, and API Gateway utilities',
        Content={'ZipFile': layer_bytes},
        CompatibleRuntimes=['python3.11'],
    )

    version = response['Version']
    arn = response['LayerVersionArn']
    print(f'✅ Published layer version: {version}')
    print(f'   ARN: {arn}')
    return version, arn


def update_functions(layer_arn: str) -> None:
    if not LAMBDA_FUNCTIONS:
        print('No Lambda functions configured for update — skipping')
        return

    for function_name in LAMBDA_FUNCTIONS:
        try:
            print(f'Updating {function_name}...')

            # Get existing layers to preserve any others
            config = lambda_client.get_function_configuration(
                FunctionName=function_name
            )
            existing_layers = [
                layer['Arn'] for layer in config.get('Layers', [])
                if LAYER_NAME not in layer['Arn']
            ]

            # Apply updated layer alongside any existing ones
            lambda_client.update_function_configuration(
                FunctionName=function_name,
                Layers=existing_layers + [layer_arn]
            )
            print(f'✅ Updated {function_name}')
        except lambda_client.exceptions.ResourceNotFoundException:
            print(f'⚠️  Function not found: {function_name} — skipping')


def run() -> None:
    print(f'\n{"═" * 50}')
    print(f'  Lambda Layer Deploy')
    print(f'  Layer: {LAYER_NAME}')
    print(f'  Region: {REGION}')
    print(f'{"═" * 50}\n')

    if not os.path.exists(LAYER_ZIP_PATH):
        print(f'❌ layer.zip not found at {LAYER_ZIP_PATH}')
        print('   Run zip.py first to generate the zip')
        return

    version, arn = publish_layer()
    update_functions(arn)

    print(f'\n{"═" * 50}')
    print(f'  ✅ Deploy complete — layer version {version}')
    print(f'{"═" * 50}\n')


if __name__ == '__main__':
    run()
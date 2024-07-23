#!/bin/bash

# Set environment variables (replace with your details)
AWS_ACCOUNT_ID="<your_aws_account_id>"
AWS_REGION="<your_aws_region>"
ECR_REPOSITORY_NAME="<your_ecr_repository_name>"
LAMBDA_FUNCTION_NAME="<your_lambda_function_name>"
IMAGE_TAG="latest"  # Optional, specify a different tag if needed

# Login to AWS ECR Docker registry
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build the image locally (optional, remove if building elsewhere)
# Replace 'your_image_build_command' with your actual build command
    #docker build -t $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY_NAME:$IMAGE_TAG .your_image_build_command

# Tag the image for ECR
    #docker tag $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY_NAME:$IMAGE_TAG $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY_NAME:$IMAGE_TAG

# Push the image to ECR
    #docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY_NAME:$IMAGE_TAG

# Update the Lambda function with the new image
aws lambda update-function-code \
  --function-name $LAMBDA_FUNCTION_NAME \
  --image-uri $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY_NAME:$IMAGE_TAG

echo "Successfully deployed image to Lambda function!"

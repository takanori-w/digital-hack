#!/bin/bash
# ==============================================================================
# LifePlan Navigator - Docker Build and Push Script
# Builds Docker images and pushes to ECR
# ==============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$INFRA_DIR")"
DOCKER_DIR="$INFRA_DIR/docker"

# Default values
ENVIRONMENT="${ENVIRONMENT:-development}"
AWS_REGION="${AWS_REGION:-ap-northeast-1}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
PUSH_TO_ECR=false
BUILD_FRONTEND=true
BUILD_BACKEND=true
BUILD_WORKER=true

# Functions
log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

show_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Options:
    -e, --environment   Environment (development|staging|production)
    -t, --tag           Image tag (default: latest)
    -p, --push          Push images to ECR after building
    --frontend-only     Build only frontend
    --backend-only      Build only backend
    --worker-only       Build only worker
    -h, --help          Show this help message

Environment Variables:
    AWS_ACCOUNT_ID      AWS Account ID for ECR
    AWS_REGION          AWS Region (default: ap-northeast-1)
    IMAGE_TAG           Docker image tag (default: latest)

Examples:
    $0 -e development -t v1.0.0
    $0 -e production -t v1.0.0 -p
    $0 --backend-only -t latest
EOF
}

get_aws_account_id() {
    if [ -z "$AWS_ACCOUNT_ID" ]; then
        AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    fi
    log_info "AWS Account ID: $AWS_ACCOUNT_ID"
}

ecr_login() {
    log_info "Logging in to ECR..."
    aws ecr get-login-password --region "$AWS_REGION" | \
        docker login --username AWS --password-stdin \
        "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
}

create_ecr_repository() {
    local repo_name="$1"
    local full_repo_name="lifeplan-$repo_name"

    if ! aws ecr describe-repositories --repository-names "$full_repo_name" --region "$AWS_REGION" &> /dev/null; then
        log_info "Creating ECR repository: $full_repo_name"
        aws ecr create-repository \
            --repository-name "$full_repo_name" \
            --region "$AWS_REGION" \
            --image-scanning-configuration scanOnPush=true \
            --encryption-configuration encryptionType=AES256
    fi
}

build_frontend() {
    log_info "Building frontend image..."

    local image_name="lifeplan-frontend"
    local ecr_uri="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$image_name"

    # Build arguments based on environment
    local build_args=""
    case $ENVIRONMENT in
        production)
            build_args="--build-arg NEXT_PUBLIC_ENVIRONMENT=production"
            ;;
        staging)
            build_args="--build-arg NEXT_PUBLIC_ENVIRONMENT=staging"
            ;;
        *)
            build_args="--build-arg NEXT_PUBLIC_ENVIRONMENT=development"
            ;;
    esac

    docker build \
        -f "$DOCKER_DIR/Dockerfile.frontend" \
        -t "$image_name:$IMAGE_TAG" \
        -t "$image_name:latest" \
        $build_args \
        "$PROJECT_ROOT/app/frontend"

    if [ "$PUSH_TO_ECR" = true ]; then
        create_ecr_repository "frontend"
        docker tag "$image_name:$IMAGE_TAG" "$ecr_uri:$IMAGE_TAG"
        docker tag "$image_name:latest" "$ecr_uri:latest"
        docker push "$ecr_uri:$IMAGE_TAG"
        docker push "$ecr_uri:latest"
        log_info "Pushed frontend image to ECR: $ecr_uri:$IMAGE_TAG"
    fi
}

build_backend() {
    log_info "Building backend image..."

    local image_name="lifeplan-backend"
    local ecr_uri="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$image_name"

    docker build \
        -f "$DOCKER_DIR/Dockerfile.backend" \
        -t "$image_name:$IMAGE_TAG" \
        -t "$image_name:latest" \
        "$PROJECT_ROOT/app/backend"

    if [ "$PUSH_TO_ECR" = true ]; then
        create_ecr_repository "backend"
        docker tag "$image_name:$IMAGE_TAG" "$ecr_uri:$IMAGE_TAG"
        docker tag "$image_name:latest" "$ecr_uri:latest"
        docker push "$ecr_uri:$IMAGE_TAG"
        docker push "$ecr_uri:latest"
        log_info "Pushed backend image to ECR: $ecr_uri:$IMAGE_TAG"
    fi
}

build_worker() {
    log_info "Building worker image..."

    local image_name="lifeplan-worker"
    local ecr_uri="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$image_name"

    docker build \
        -f "$DOCKER_DIR/Dockerfile.worker" \
        -t "$image_name:$IMAGE_TAG" \
        -t "$image_name:latest" \
        "$PROJECT_ROOT/app/backend"

    if [ "$PUSH_TO_ECR" = true ]; then
        create_ecr_repository "worker"
        docker tag "$image_name:$IMAGE_TAG" "$ecr_uri:$IMAGE_TAG"
        docker tag "$image_name:latest" "$ecr_uri:latest"
        docker push "$ecr_uri:$IMAGE_TAG"
        docker push "$ecr_uri:latest"
        log_info "Pushed worker image to ECR: $ecr_uri:$IMAGE_TAG"
    fi
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -t|--tag)
            IMAGE_TAG="$2"
            shift 2
            ;;
        -p|--push)
            PUSH_TO_ECR=true
            shift
            ;;
        --frontend-only)
            BUILD_BACKEND=false
            BUILD_WORKER=false
            shift
            ;;
        --backend-only)
            BUILD_FRONTEND=false
            BUILD_WORKER=false
            shift
            ;;
        --worker-only)
            BUILD_FRONTEND=false
            BUILD_BACKEND=false
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Main execution
echo -e "${BLUE}"
echo "========================================"
echo "  LifePlan Navigator - Docker Build"
echo "========================================"
echo -e "${NC}"

log_info "Environment: $ENVIRONMENT"
log_info "Image Tag: $IMAGE_TAG"
log_info "Push to ECR: $PUSH_TO_ECR"

if [ "$PUSH_TO_ECR" = true ]; then
    get_aws_account_id
    ecr_login
fi

# Build images
if [ "$BUILD_FRONTEND" = true ]; then
    build_frontend
fi

if [ "$BUILD_BACKEND" = true ]; then
    build_backend
fi

if [ "$BUILD_WORKER" = true ]; then
    build_worker
fi

log_info "Build completed successfully!"

# Show built images
echo ""
log_info "Built images:"
docker images | grep lifeplan | head -10

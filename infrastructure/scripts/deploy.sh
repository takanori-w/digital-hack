#!/bin/bash
# ==============================================================================
# LifePlan Navigator - Deployment Script
# Deploys infrastructure and application to specified environment
# ==============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$INFRA_DIR")"

# Default values
ENVIRONMENT=""
ACTION=""
AUTO_APPROVE=false
DRY_RUN=false

# Functions
print_banner() {
    echo -e "${BLUE}"
    echo "========================================"
    echo "  LifePlan Navigator - Deployment Tool"
    echo "========================================"
    echo -e "${NC}"
}

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Options:
    -e, --environment   Environment to deploy (development|staging|production|dr)
    -a, --action        Action to perform (plan|apply|destroy|output)
    -y, --auto-approve  Auto-approve terraform changes
    -d, --dry-run       Show what would be done without executing
    -h, --help          Show this help message

Examples:
    $0 -e development -a plan
    $0 -e staging -a apply -y
    $0 -e production -a plan
    $0 -e production -a apply

Environment Variables:
    TF_VAR_domain_name           Domain name for the application
    TF_VAR_origin_verify_header  Secret header for CloudFront origin verification
EOF
}

validate_environment() {
    case $ENVIRONMENT in
        development|staging|production|dr)
            log_info "Environment: $ENVIRONMENT"
            ;;
        *)
            log_error "Invalid environment: $ENVIRONMENT"
            log_error "Valid environments: development, staging, production, dr"
            exit 1
            ;;
    esac
}

validate_action() {
    case $ACTION in
        plan|apply|destroy|output)
            log_info "Action: $ACTION"
            ;;
        *)
            log_error "Invalid action: $ACTION"
            log_error "Valid actions: plan, apply, destroy, output"
            exit 1
            ;;
    esac
}

check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check terraform
    if ! command -v terraform &> /dev/null; then
        log_error "terraform is not installed"
        exit 1
    fi
    log_info "Terraform version: $(terraform version -json | jq -r '.terraform_version')"

    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        log_error "aws cli is not installed"
        exit 1
    fi
    log_info "AWS CLI version: $(aws --version | cut -d' ' -f1)"

    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured or invalid"
        exit 1
    fi
    log_info "AWS Account: $(aws sts get-caller-identity --query Account --output text)"
}

terraform_init() {
    local tf_dir="$INFRA_DIR/terraform/environments/$ENVIRONMENT"

    log_info "Initializing Terraform in $tf_dir"

    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY-RUN] Would run: terraform init"
        return 0
    fi

    cd "$tf_dir"
    terraform init -upgrade
}

terraform_plan() {
    local tf_dir="$INFRA_DIR/terraform/environments/$ENVIRONMENT"

    log_info "Creating Terraform plan..."

    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY-RUN] Would run: terraform plan -out=tfplan"
        return 0
    fi

    cd "$tf_dir"
    terraform plan -out=tfplan

    log_info "Plan saved to: $tf_dir/tfplan"
}

terraform_apply() {
    local tf_dir="$INFRA_DIR/terraform/environments/$ENVIRONMENT"

    log_info "Applying Terraform changes..."

    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY-RUN] Would run: terraform apply"
        return 0
    fi

    cd "$tf_dir"

    if [ -f tfplan ]; then
        if [ "$AUTO_APPROVE" = true ]; then
            terraform apply tfplan
        else
            terraform apply tfplan
        fi
        rm -f tfplan
    else
        if [ "$AUTO_APPROVE" = true ]; then
            terraform apply -auto-approve
        else
            terraform apply
        fi
    fi

    log_info "Terraform apply completed"
}

terraform_destroy() {
    local tf_dir="$INFRA_DIR/terraform/environments/$ENVIRONMENT"

    log_warn "Destroying infrastructure in $ENVIRONMENT..."

    if [ "$ENVIRONMENT" = "production" ]; then
        log_error "Refusing to destroy production environment automatically"
        log_error "Please run 'terraform destroy' manually with proper approvals"
        exit 1
    fi

    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY-RUN] Would run: terraform destroy"
        return 0
    fi

    cd "$tf_dir"

    if [ "$AUTO_APPROVE" = true ]; then
        terraform destroy -auto-approve
    else
        terraform destroy
    fi

    log_info "Infrastructure destroyed"
}

terraform_output() {
    local tf_dir="$INFRA_DIR/terraform/environments/$ENVIRONMENT"

    log_info "Showing Terraform outputs..."

    cd "$tf_dir"
    terraform output -json
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -a|--action)
            ACTION="$2"
            shift 2
            ;;
        -y|--auto-approve)
            AUTO_APPROVE=true
            shift
            ;;
        -d|--dry-run)
            DRY_RUN=true
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
print_banner

if [ -z "$ENVIRONMENT" ] || [ -z "$ACTION" ]; then
    log_error "Environment and action are required"
    show_usage
    exit 1
fi

validate_environment
validate_action
check_prerequisites

# Execute action
case $ACTION in
    plan)
        terraform_init
        terraform_plan
        ;;
    apply)
        terraform_init
        terraform_apply
        ;;
    destroy)
        terraform_init
        terraform_destroy
        ;;
    output)
        terraform_output
        ;;
esac

log_info "Deployment script completed successfully"

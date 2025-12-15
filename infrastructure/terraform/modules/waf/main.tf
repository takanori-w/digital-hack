# ==============================================================================
# WAF Module - LifePlan Navigator
# OWASP Top 10 Protection, Rate Limiting, Managed Rules
# ==============================================================================

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# ------------------------------------------------------------------------------
# IP Set for Blocked IPs
# ------------------------------------------------------------------------------
resource "aws_wafv2_ip_set" "blocked_ips" {
  name               = "${var.project_name}-${var.environment}-blocked-ips"
  description        = "IP addresses blocked by CTI intelligence"
  scope              = var.waf_scope
  ip_address_version = "IPV4"
  addresses          = var.blocked_ip_addresses

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment}-blocked-ips"
  })
}

# ------------------------------------------------------------------------------
# Web ACL
# ------------------------------------------------------------------------------
resource "aws_wafv2_web_acl" "main" {
  name        = "${var.project_name}-${var.environment}-waf"
  description = "WAF Web ACL for ${var.project_name} ${var.environment}"
  scope       = var.waf_scope

  default_action {
    allow {}
  }

  # Rule 0: IP Blocklist (Custom)
  rule {
    name     = "IPBlocklist"
    priority = 0

    override_action {
      none {}
    }

    statement {
      ip_set_reference_statement {
        arn = aws_wafv2_ip_set.blocked_ips.arn
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}IPBlocklist"
      sampled_requests_enabled   = true
    }

    action {
      block {
        custom_response {
          response_code = 403
          custom_response_body_key = "blocked-ip"
        }
      }
    }
  }

  # Rule 1: AWS Managed IP Reputation List
  rule {
    name     = "AWSManagedRulesAmazonIpReputationList"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesAmazonIpReputationList"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}AWSIPReputation"
      sampled_requests_enabled   = true
    }
  }

  # Rule 2: AWS Managed Common Rule Set (CRS)
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"

        dynamic "rule_action_override" {
          for_each = var.crs_excluded_rules
          content {
            name = rule_action_override.value
            action_to_use {
              count {}
            }
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}AWSCRS"
      sampled_requests_enabled   = true
    }
  }

  # Rule 3: AWS Managed Known Bad Inputs Rule Set
  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 3

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}AWSKnownBadInputs"
      sampled_requests_enabled   = true
    }
  }

  # Rule 4: AWS Managed SQL Injection Rule Set
  rule {
    name     = "AWSManagedRulesSQLiRuleSet"
    priority = 4

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}AWSSQLi"
      sampled_requests_enabled   = true
    }
  }

  # Rule 5: Rate Limit Per IP
  rule {
    name     = "RateLimitPerIP"
    priority = 5

    action {
      block {
        custom_response {
          response_code = 429
          response_header {
            name  = "Retry-After"
            value = "300"
          }
          response_header {
            name  = "X-RateLimit-Limit"
            value = tostring(var.rate_limit_per_ip)
          }
          custom_response_body_key = "rate-limit-exceeded"
        }
      }
    }

    statement {
      rate_based_statement {
        limit              = var.rate_limit_per_ip
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}RateLimitPerIP"
      sampled_requests_enabled   = true
    }
  }

  # Rule 6: Login Rate Limit
  rule {
    name     = "LoginRateLimit"
    priority = 6

    action {
      block {
        custom_response {
          response_code = 429
          custom_response_body_key = "login-rate-limit"
        }
      }
    }

    statement {
      rate_based_statement {
        limit              = var.login_rate_limit
        aggregate_key_type = "IP"

        scope_down_statement {
          byte_match_statement {
            search_string = "/api/auth/login"
            field_to_match {
              uri_path {}
            }
            text_transformation {
              priority = 0
              type     = "LOWERCASE"
            }
            positional_constraint = "STARTS_WITH"
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}LoginRateLimit"
      sampled_requests_enabled   = true
    }
  }

  # Rule 7: Registration Rate Limit
  rule {
    name     = "RegistrationRateLimit"
    priority = 7

    action {
      block {
        custom_response {
          response_code = 429
          custom_response_body_key = "registration-rate-limit"
        }
      }
    }

    statement {
      rate_based_statement {
        limit              = var.registration_rate_limit
        aggregate_key_type = "IP"

        scope_down_statement {
          byte_match_statement {
            search_string = "/api/auth/register"
            field_to_match {
              uri_path {}
            }
            text_transformation {
              priority = 0
              type     = "LOWERCASE"
            }
            positional_constraint = "STARTS_WITH"
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}RegistrationRateLimit"
      sampled_requests_enabled   = true
    }
  }

  # Rule 8: Password Reset Rate Limit
  rule {
    name     = "PasswordResetRateLimit"
    priority = 8

    action {
      block {
        custom_response {
          response_code = 429
          custom_response_body_key = "password-reset-rate-limit"
        }
      }
    }

    statement {
      rate_based_statement {
        limit              = var.password_reset_rate_limit
        aggregate_key_type = "IP"

        scope_down_statement {
          byte_match_statement {
            search_string = "/api/auth/password-reset"
            field_to_match {
              uri_path {}
            }
            text_transformation {
              priority = 0
              type     = "LOWERCASE"
            }
            positional_constraint = "STARTS_WITH"
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}PasswordResetRateLimit"
      sampled_requests_enabled   = true
    }
  }

  # Rule 9: Geo Restriction (Optional)
  dynamic "rule" {
    for_each = var.enable_geo_restriction ? [1] : []
    content {
      name     = "GeoRestriction"
      priority = 9

      action {
        block {
          custom_response {
            response_code = 403
            custom_response_body_key = "geo-blocked"
          }
        }
      }

      statement {
        not_statement {
          statement {
            geo_match_statement {
              country_codes = var.allowed_countries
            }
          }
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "${var.project_name}GeoRestriction"
        sampled_requests_enabled   = true
      }
    }
  }

  # Custom Response Bodies
  custom_response_body {
    key          = "blocked-ip"
    content      = jsonencode({
      error   = "access_denied"
      message = "Your IP address has been blocked."
    })
    content_type = "APPLICATION_JSON"
  }

  custom_response_body {
    key          = "rate-limit-exceeded"
    content      = jsonencode({
      error       = "rate_limit_exceeded"
      message     = "Too many requests. Please retry later."
      retry_after = 300
    })
    content_type = "APPLICATION_JSON"
  }

  custom_response_body {
    key          = "login-rate-limit"
    content      = jsonencode({
      error   = "login_rate_limit_exceeded"
      message = "Too many login attempts. Please wait before trying again."
    })
    content_type = "APPLICATION_JSON"
  }

  custom_response_body {
    key          = "registration-rate-limit"
    content      = jsonencode({
      error   = "registration_rate_limit_exceeded"
      message = "Too many registration attempts. Please try again later."
    })
    content_type = "APPLICATION_JSON"
  }

  custom_response_body {
    key          = "password-reset-rate-limit"
    content      = jsonencode({
      error   = "password_reset_rate_limit_exceeded"
      message = "Too many password reset requests. Please try again later."
    })
    content_type = "APPLICATION_JSON"
  }

  custom_response_body {
    key          = "geo-blocked"
    content      = jsonencode({
      error   = "geo_restricted"
      message = "This service is not available in your region."
    })
    content_type = "APPLICATION_JSON"
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.project_name}${var.environment}WAF"
    sampled_requests_enabled   = true
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment}-waf"
  })
}

# ------------------------------------------------------------------------------
# WAF Logging
# ------------------------------------------------------------------------------
resource "aws_cloudwatch_log_group" "waf" {
  count             = var.enable_logging ? 1 : 0
  name              = "aws-waf-logs-${var.project_name}-${var.environment}"
  retention_in_days = var.log_retention_days

  tags = merge(var.common_tags, {
    Name = "aws-waf-logs-${var.project_name}-${var.environment}"
  })
}

resource "aws_wafv2_web_acl_logging_configuration" "main" {
  count                   = var.enable_logging ? 1 : 0
  log_destination_configs = [aws_cloudwatch_log_group.waf[0].arn]
  resource_arn            = aws_wafv2_web_acl.main.arn

  redacted_fields {
    single_header {
      name = "authorization"
    }
  }

  redacted_fields {
    single_header {
      name = "cookie"
    }
  }

  logging_filter {
    default_behavior = "KEEP"

    filter {
      behavior    = "KEEP"
      requirement = "MEETS_ANY"

      condition {
        action_condition {
          action = "BLOCK"
        }
      }

      condition {
        action_condition {
          action = "COUNT"
        }
      }
    }
  }
}

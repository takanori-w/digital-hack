-- LifePlan Navigator Database Schema
-- Security Compliance: SEC-013, GDPR Article 30
-- Version: 1.0.0

-- ===========================================
-- Audit Log Table
-- ===========================================
-- Stores all security audit events for compliance and forensics

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Event Information
    event_type VARCHAR(20) NOT NULL,  -- AUTH, DATA, SEC, ADMIN, SYS
    event_code VARCHAR(50) NOT NULL,
    event_name VARCHAR(100),
    event_description TEXT,

    -- Actor Information (who performed the action)
    actor_type VARCHAR(20) NOT NULL,  -- user, system, admin, anonymous
    actor_user_id VARCHAR(100),
    actor_username VARCHAR(255),
    actor_email_hash VARCHAR(64),  -- SHA256 hash for privacy
    actor_roles TEXT[],
    actor_session_id VARCHAR(100),
    actor_ip_address INET,
    actor_user_agent TEXT,
    actor_geo_location JSONB,

    -- Target Information (what was affected)
    target_type VARCHAR(50),
    target_id VARCHAR(100),
    target_name VARCHAR(255),
    target_owner_id VARCHAR(100),
    target_previous_state JSONB,
    target_new_state JSONB,
    target_affected_fields TEXT[],

    -- Request Information
    request_id VARCHAR(100),
    request_method VARCHAR(10),
    request_path VARCHAR(500),
    request_query JSONB,
    request_headers JSONB,
    request_body_sanitized JSONB,
    request_content_type VARCHAR(100),
    request_content_length INTEGER,

    -- Response Information
    response_status_code INTEGER,
    response_success BOOLEAN NOT NULL DEFAULT false,
    response_error_code VARCHAR(50),
    response_error_message TEXT,
    response_duration_ms INTEGER,
    response_data_size INTEGER,

    -- Context Information
    context_service VARCHAR(100),
    context_version VARCHAR(20),
    context_environment VARCHAR(20),
    context_hostname VARCHAR(255),
    context_trace_id VARCHAR(100),
    context_span_id VARCHAR(50),
    context_parent_span_id VARCHAR(50),
    context_correlation_id VARCHAR(100),

    -- Risk and Severity
    severity VARCHAR(20) NOT NULL DEFAULT 'INFO',  -- DEBUG, INFO, WARN, ERROR, CRITICAL
    risk_level VARCHAR(20),  -- LOW, MEDIUM, HIGH, CRITICAL

    -- Additional Metadata
    metadata JSONB,

    -- Indexing and Partitioning Support
    created_date DATE GENERATED ALWAYS AS (DATE(timestamp)) STORED
);

-- ===========================================
-- Indexes for Audit Logs
-- ===========================================

-- Primary lookup indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_date ON audit_logs(created_date);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_code ON audit_logs(event_code);

-- Actor indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_user_id ON audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_email_hash ON audit_logs(actor_email_hash);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_ip ON audit_logs(actor_ip_address);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_session ON audit_logs(actor_session_id);

-- Target indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_type_id ON audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_owner ON audit_logs(target_owner_id);

-- Security and compliance indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_risk_level ON audit_logs(risk_level);
CREATE INDEX IF NOT EXISTS idx_audit_logs_response_success ON audit_logs(response_success);

-- Tracing indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_trace_id ON audit_logs(context_trace_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_correlation ON audit_logs(context_correlation_id);

-- ===========================================
-- User Profile Table (with encryption markers)
-- ===========================================

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(100) UNIQUE NOT NULL,

    -- Basic Info
    email_encrypted TEXT NOT NULL,  -- Field-level encrypted
    email_hash VARCHAR(64) NOT NULL,  -- For searching
    name VARCHAR(255),

    -- Onboarding Data
    age_range VARCHAR(20),
    work_style VARCHAR(50),
    housing_status VARCHAR(50),
    region VARCHAR(100),
    family_composition JSONB,
    future_plans TEXT[],

    -- Preferences
    animal_avatar VARCHAR(50),
    notification_settings JSONB,

    -- Encrypted Sensitive Fields
    phone_encrypted TEXT,
    address_encrypted TEXT,

    -- Metadata
    onboarding_completed BOOLEAN DEFAULT false,
    onboarding_completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Soft delete for GDPR compliance
    deleted_at TIMESTAMPTZ,
    deletion_reason VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_email_hash ON user_profiles(email_hash);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- ===========================================
-- User Law Recommendations Table
-- ===========================================

CREATE TABLE IF NOT EXISTS user_law_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(100) NOT NULL REFERENCES user_profiles(user_id),

    -- Law Information
    law_id VARCHAR(100) NOT NULL,
    law_title TEXT NOT NULL,
    law_number VARCHAR(50),
    law_category VARCHAR(100),

    -- Recommendation Context
    trigger_event VARCHAR(100),  -- e.g., 'onboarding', 'life_event', 'search'
    relevance_score DECIMAL(5,4),
    matched_keywords TEXT[],

    -- User Interaction
    viewed_at TIMESTAMPTZ,
    saved BOOLEAN DEFAULT false,
    dismissed BOOLEAN DEFAULT false,

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_law_recommendations_user ON user_law_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_law_recommendations_law ON user_law_recommendations(law_id);

-- ===========================================
-- Sessions Table (backup for Redis)
-- ===========================================

CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,

    -- Session Data
    email VARCHAR(255),
    role VARCHAR(50),
    mfa_enabled BOOLEAN DEFAULT false,
    mfa_verified BOOLEAN DEFAULT false,

    -- Timing
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,

    -- Client Info
    user_agent TEXT,
    ip_address INET,

    -- Metadata
    metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- ===========================================
-- Trigger for updated_at
-- ===========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_law_recommendations_updated_at
    BEFORE UPDATE ON user_law_recommendations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- Partitioning for Audit Logs (Optional - Production)
-- ===========================================
-- For high-volume production, consider partitioning by month:
--
-- CREATE TABLE audit_logs_y2024m01 PARTITION OF audit_logs
--     FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- ===========================================
-- Data Retention Policy (GDPR Compliance)
-- ===========================================

-- Function to purge old audit logs (retention: 7 years for compliance)
CREATE OR REPLACE FUNCTION purge_old_audit_logs(retention_days INTEGER DEFAULT 2555)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM audit_logs
    WHERE timestamp < NOW() - (retention_days || ' days')::INTERVAL;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function for GDPR right to erasure
CREATE OR REPLACE FUNCTION gdpr_erase_user_data(target_user_id VARCHAR)
RETURNS VOID AS $$
BEGIN
    -- Mark profile as deleted (soft delete)
    UPDATE user_profiles
    SET deleted_at = NOW(),
        deletion_reason = 'GDPR_ERASURE_REQUEST',
        email_encrypted = 'REDACTED',
        phone_encrypted = NULL,
        address_encrypted = NULL,
        name = 'REDACTED',
        family_composition = NULL
    WHERE user_id = target_user_id;

    -- Anonymize audit logs (keep for compliance, anonymize PII)
    UPDATE audit_logs
    SET actor_user_id = 'REDACTED',
        actor_username = 'REDACTED',
        actor_email_hash = 'REDACTED',
        target_owner_id = CASE WHEN target_owner_id = target_user_id THEN 'REDACTED' ELSE target_owner_id END,
        metadata = metadata - 'email' - 'name' - 'phone' - 'address'
    WHERE actor_user_id = target_user_id OR target_owner_id = target_user_id;

    -- Delete law recommendations
    DELETE FROM user_law_recommendations WHERE user_id = target_user_id;

    -- Invalidate sessions
    DELETE FROM sessions WHERE user_id = target_user_id;
END;
$$ LANGUAGE plpgsql;

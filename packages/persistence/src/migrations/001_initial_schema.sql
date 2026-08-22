-- Northstar Regulated MCP Insurance Monorepo
-- PostgreSQL Schema Migration 001

CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(64) PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quote_sessions (
  session_id UUID PRIMARY KEY,
  correlation_id VARCHAR(128) NOT NULL,
  step VARCHAR(64) NOT NULL,
  payload JSONB NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_quote_sessions_expires_at ON quote_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_quote_sessions_correlation_id ON quote_sessions(correlation_id);

CREATE TABLE IF NOT EXISTS quote_history (
  quote_id UUID PRIMARY KEY,
  session_id UUID NOT NULL,
  rule_version VARCHAR(64) NOT NULL,
  input_snapshot JSONB NOT NULL,
  eligibility_snapshot JSONB NOT NULL,
  pricing_snapshot JSONB NOT NULL,
  quote_hash VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_quote_history_session_id ON quote_history(session_id);

CREATE TABLE IF NOT EXISTS audit_events (
  id BIGSERIAL,
  event_id UUID PRIMARY KEY,
  session_id UUID NOT NULL,
  correlation_id VARCHAR(128) NOT NULL,
  event_type VARCHAR(64) NOT NULL,
  actor VARCHAR(32) NOT NULL,
  rule_version VARCHAR(64),
  metadata JSONB,
  previous_hash VARCHAR(64) NOT NULL,
  current_hash VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_events_session_id ON audit_events(session_id, id ASC);

CREATE TABLE IF NOT EXISTS idempotency_records (
  idempotency_key VARCHAR(255) PRIMARY KEY,
  session_id UUID NOT NULL,
  operation VARCHAR(64) NOT NULL,
  request_fingerprint VARCHAR(128) NOT NULL,
  response_payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_idempotency_expires_at ON idempotency_records(expires_at);

CREATE TABLE IF NOT EXISTS waniwani_flow_state (
  flow_key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_waniwani_flow_state_expires ON waniwani_flow_state(expires_at);

INSERT INTO schema_migrations (version) VALUES ('001_initial_schema')
ON CONFLICT (version) DO NOTHING;

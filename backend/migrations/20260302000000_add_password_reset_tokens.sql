-- Password reset tokens (no email server required — token is returned in response
-- and would be delivered via email/SMS in a production deployment)
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    token      TEXT    PRIMARY KEY,
    user_id    TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT    NOT NULL,  -- ISO-8601, 15 minutes from creation
    used       INTEGER NOT NULL DEFAULT 0,
    created_at TEXT    DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_reset_tokens_user ON password_reset_tokens(user_id);

-- Account claims: maps a legacy anonymous localStorage user id to a real
-- Better Auth user. PRIMARY KEY on legacy_user_id enforces single-claim.

CREATE TABLE IF NOT EXISTS account_claims (
  legacy_user_id TEXT PRIMARY KEY,
  auth_user_id TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_account_claims_auth_user ON account_claims(auth_user_id);

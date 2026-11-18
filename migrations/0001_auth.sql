-- Phase 12.3: wallet-authentication storage (Cloudflare D1).
-- `consumeChallenge` in functions/api/auth/_auth.mjs deletes a nonce with a single atomic
-- "DELETE ... WHERE nonce = ? AND expires_at > ? RETURNING ..." statement, so a nonce is consumed
-- exactly once (replay- and race-safe) and expired challenges are never returned.

CREATE TABLE IF NOT EXISTS auth_challenges (
  nonce      TEXT PRIMARY KEY,
  address    TEXT NOT NULL,
  domain     TEXT NOT NULL,
  uri        TEXT NOT NULL,
  chain_id   INTEGER NOT NULL,
  issued_at  INTEGER NOT NULL,   -- epoch ms
  expires_at INTEGER NOT NULL    -- epoch ms
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  token_hash TEXT PRIMARY KEY,   -- keccak256(token); the raw token is never stored
  address    TEXT NOT NULL,
  created_at INTEGER NOT NULL,   -- epoch ms
  expires_at INTEGER NOT NULL    -- epoch ms
);

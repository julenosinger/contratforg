// Shared wallet-authentication core (Phase 12.3). Byte-identical on Cloudflare (functions/api/auth/_auth.mjs) and Vercel
// (api/auth/_auth.mjs); a test keeps them equal. Pure logic plus the SIWE (EIP-4361 subset) message, EIP-191 signature
// recovery (secp256k1 + keccak256 via the vendored @noble libraries), and the D1 store adapter. The platform handlers
// inject { host, uri, now, store, body } and convert the returned result into a Response.
import { secp256k1 } from '../../vendor/noble/secp256k1.mjs';
import { keccak_256 } from '../../vendor/noble/sha3.mjs';

// ===== AUTH CORE BEGIN =====
const AUTH_ADDR_RE = /^0x[0-9a-fA-F]{40}$/;
const AUTH_SIG_RE = /^0x[0-9a-fA-F]{130}$/;          // r (32B) + s (32B) + v (1B)
const AUTH_CHALLENGE_TTL_MS = 300000;                 // 5 minutes
const AUTH_SESSION_TTL_MS = 86400000;                 // 24 hours
const AUTH_COOKIE_NAME = 'cf_session';

const AUTH_ENC = new TextEncoder();
function authHexToBytes(hex) { return Uint8Array.from(hex.match(/.{2}/g).map((x) => parseInt(x, 16))); }
function authBytesToHex(b) { let s = ''; for (let i = 0; i < b.length; i++) s += b[i].toString(16).padStart(2, '0'); return s; }

function authValidAddress(a) { return typeof a === 'string' && AUTH_ADDR_RE.test(a); }
function authValidSignature(s) { return typeof s === 'string' && AUTH_SIG_RE.test(s); }

/* SIWE-compatible message (EIP-4361 subset). Domain, URI, nonce and timestamps are server-controlled. */
function authBuildMessage(address, domain, uri, chainId, nonce, issuedAtMs, expiresAtMs) {
  return domain + ' wants you to sign in with your Ethereum account:\n' + address + '\n\n'
    + 'Sign in to ContractForge.\n\n'
    + 'URI: ' + uri + '\n'
    + 'Version: 1\n'
    + 'Chain ID: ' + chainId + '\n'
    + 'Nonce: ' + nonce + '\n'
    + 'Issued At: ' + new Date(issuedAtMs).toISOString() + '\n'
    + 'Expiration Time: ' + new Date(expiresAtMs).toISOString();
}

/* The request Origin host must equal the deployment host. Never trust a domain the client sends. */
function authOriginOk(origin, host) {
  if (!origin || !host) return false;
  try { return new URL(origin).host === host; } catch (_) { return false; }
}

function authRandomHex(n, getRandomValues) {
  const b = new Uint8Array(n);
  getRandomValues(b);
  return authBytesToHex(b);
}

/* HttpOnly, Secure, SameSite=Lax session cookie. */
function authSessionCookie(name, token, expiresAtMs) {
  return name + '=' + token + '; HttpOnly; Secure; SameSite=Lax; Path=/; Expires=' + new Date(expiresAtMs).toUTCString();
}

function authExpired(expiresAtMs, nowMs) { return !Number.isFinite(expiresAtMs) || nowMs >= expiresAtMs; }

/* EIP-191 personal_sign hash: keccak256("\x19Ethereum Signed Message:\n" + len + message). */
function authMessageHash(message) {
  return keccak_256(AUTH_ENC.encode('\x19Ethereum Signed Message:\n' + message.length + message));
}

/* Recover the signer address (lowercase 0x) from a 65-byte EIP-191 signature, or null. Only v 27/28 (EOA) is accepted;
   contract-wallet (ERC-1271) signatures are not recoverable this way and are rejected. */
function authRecoverAddress(message, signatureHex) {
  try {
    const sig = signatureHex.slice(2);
    const rec = parseInt(sig.slice(128, 130), 16) - 27;
    if (rec !== 0 && rec !== 1) return null;
    const pub = secp256k1.Signature.fromCompact(authHexToBytes(sig.slice(0, 128))).addRecoveryBit(rec)
      .recoverPublicKey(authMessageHash(message)).toRawBytes(false);
    return '0x' + authBytesToHex(keccak_256(pub.slice(1)).slice(-20));
  } catch (_) { return null; }
}

/* Hash a session token for durable storage (the raw token is never stored). */
function authHashToken(token) { return authBytesToHex(keccak_256(AUTH_ENC.encode(token))); }

function authResult(status, json, headers) { return { status, json, headers: headers || {} }; }

/* D1 adapter. `db` is a D1 binding (prepare/bind/run/first). `consumeChallenge` is a single atomic statement so a nonce
   can be consumed exactly once (replay- and race-safe). */
function d1Store(db) {
  return {
    putChallenge: (c) => db.prepare(
      'INSERT INTO auth_challenges (nonce, address, domain, uri, chain_id, issued_at, expires_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)'
    ).bind(c.nonce, c.address, c.domain, c.uri, c.chainId, c.issuedAtMs, c.expiresAtMs).run().then(() => {}),
    consumeChallenge: (nonce, nowMs) => db.prepare(
      'DELETE FROM auth_challenges WHERE nonce = ?1 AND expires_at > ?2 RETURNING nonce, address, domain, uri, chain_id AS chainId, issued_at AS issuedAtMs, expires_at AS expiresAtMs'
    ).bind(nonce, nowMs).first(),
    putSession: (h, s) => db.prepare(
      'INSERT INTO auth_sessions (token_hash, address, created_at, expires_at) VALUES (?1, ?2, ?3, ?4)'
    ).bind(h, s.address, s.createdAtMs, s.expiresAtMs).run().then(() => {}),
    getSession: (h) => db.prepare(
      'SELECT address, created_at AS createdAtMs, expires_at AS expiresAtMs FROM auth_sessions WHERE token_hash = ?1'
    ).bind(h).first(),
    deleteSession: (h) => db.prepare('DELETE FROM auth_sessions WHERE token_hash = ?1').bind(h).run().then(() => {}),
  };
}

/* POST /api/auth/challenge — issue a single-use, server-bound SIWE challenge. ctx: { host, uri, now, store, body }. */
async function handleChallenge(ctx) {
  if (!authOriginOk(ctx.origin, ctx.host)) return authResult(403, { error: 'Forbidden' });
  if (!ctx.store) return authResult(503, { error: 'Authentication storage is not configured on this deployment.' });
  const body = ctx.body || {};
  const address = body.address;
  if (!authValidAddress(address)) return authResult(400, { error: 'Invalid address' });
  const chainId = (Number.isInteger(body.chainId) && body.chainId > 0) ? body.chainId : 1;

  const now = ctx.now;
  const nonce = authRandomHex(32, (b) => ctx.getRandomValues(b));
  const issuedAtMs = now;
  const expiresAtMs = now + AUTH_CHALLENGE_TTL_MS;
  const message = authBuildMessage(address, ctx.host, ctx.uri, chainId, nonce, issuedAtMs, expiresAtMs);

  await ctx.store.putChallenge({ nonce, address, domain: ctx.host, uri: ctx.uri, chainId, issuedAtMs, expiresAtMs });
  return authResult(200, { nonce, message, issuedAt: new Date(issuedAtMs).toISOString(), expiration: new Date(expiresAtMs).toISOString() });
}

/* POST /api/auth/verify — verify the signature, atomically consume the nonce, and issue a session. */
async function handleVerify(ctx) {
  if (!authOriginOk(ctx.origin, ctx.host)) return authResult(403, { error: 'Forbidden' });
  if (!ctx.store) return authResult(503, { error: 'Authentication storage is not configured on this deployment.' });
  const body = ctx.body || {};
  const address = body.address, signature = body.signature, nonce = body.nonce;
  if (!authValidAddress(address)) return authResult(400, { error: 'Invalid address' });
  if (!authValidSignature(signature)) return authResult(400, { error: 'Invalid signature' });
  if (typeof nonce !== 'string' || nonce.length < 16 || nonce.length > 128) return authResult(400, { error: 'Invalid nonce' });

  const challenge = await ctx.store.consumeChallenge(nonce, ctx.now);   // atomic single-use consume
  if (!challenge) return authResult(401, { error: 'Unknown, expired or already used challenge.' });
  if (challenge.address.toLowerCase() !== address.toLowerCase()) return authResult(401, { error: 'Address mismatch.' });

  const message = authBuildMessage(challenge.address, challenge.domain, challenge.uri, challenge.chainId, challenge.nonce, challenge.issuedAtMs, challenge.expiresAtMs);
  const recovered = authRecoverAddress(message, signature);
  if (!recovered || recovered.toLowerCase() !== address.toLowerCase()) return authResult(401, { error: 'Invalid signature.' });

  const token = authRandomHex(32, (b) => ctx.getRandomValues(b));
  const tokenHash = authHashToken(token);
  const createdAtMs = ctx.now;
  const expiresAtMs = ctx.now + AUTH_SESSION_TTL_MS;
  await ctx.store.putSession(tokenHash, { address: address.toLowerCase(), createdAtMs, expiresAtMs });

  return authResult(200, { expiresAt: new Date(expiresAtMs).toISOString() }, { 'set-cookie': authSessionCookie(AUTH_COOKIE_NAME, token, expiresAtMs) });
}
// ===== AUTH CORE END =====

export {
  AUTH_ADDR_RE, AUTH_SIG_RE, AUTH_CHALLENGE_TTL_MS, AUTH_SESSION_TTL_MS, AUTH_COOKIE_NAME,
  authValidAddress, authValidSignature, authBuildMessage, authOriginOk, authRandomHex, authSessionCookie, authExpired,
  authMessageHash, authRecoverAddress, authHashToken, authResult, d1Store, handleChallenge, handleVerify,
};

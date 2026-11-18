// Cloudflare Pages Function: POST /api/auth/challenge. Thin wrapper over the shared core (_auth.mjs).
import { handleChallenge, d1Store } from './_auth.mjs';

const json = (o, status = 200, extra = {}) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...extra } });

function resolveStore(env) {
  if (env && env.__authStore) return env.__authStore;      // test injection
  if (env && env.AUTH_DB) return d1Store(env.AUTH_DB);     // production D1
  return null;                                             // not configured -> 503
}

export async function onRequestPost({ request, env }) {
  const url = new URL(request.url);
  let body = null;
  try { body = await request.json(); } catch (_) { body = null; }
  const r = await handleChallenge({
    host: url.host, uri: url.origin, origin: request.headers.get('origin'),
    now: Date.now(), getRandomValues: (b) => crypto.getRandomValues(b), store: resolveStore(env), body,
  });
  return json(r.json, r.status, r.headers);
}

export async function onRequest() { return json({ error: 'Method not allowed' }, 405); }

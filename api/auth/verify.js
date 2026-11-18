// Vercel serverless function: POST /api/auth/verify. Thin wrapper over the shared core (_auth.mjs). Durable storage
// must be wired here for production (the shared core returns 503 until a store is set); tests inject a store.
let __store = null;

module.exports = async function handler(req, res) {
  const { handleVerify } = await import('./_auth.mjs');
  const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
  const uri = proto + '://' + host;
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (_) { body = null; } }
  const r = await handleVerify({
    host, uri, origin: req.headers.origin || null,
    now: Date.now(), getRandomValues: (b) => crypto.getRandomValues(b), store: __store, body,
  });
  res.setHeader('Cache-Control', 'no-store');
  for (const [k, v] of Object.entries(r.headers || {})) res.setHeader(k, v);
  return res.status(r.status).json(r.json);
};

module.exports.__setStore = (s) => { __store = s; };

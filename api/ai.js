// Vercel serverless function: forwards AI requests to Anthropic so the API key
// stays on the server. Set ANTHROPIC_API_KEY (and optionally AI_MODEL) in the
// Vercel project's Environment Variables.
const MAX_BODY = 60000;
const MAX_TOKENS = 4096;

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const origin = req.headers.origin;
  if (origin) {
    let ok = false;
    try { ok = new URL(origin).host === req.headers.host; } catch (_) {}
    if (!ok) return res.status(403).json({ error: 'Forbidden origin' });
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(503).json({ error: 'AI is not configured on this deployment. Set ANTHROPIC_API_KEY.' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (_) { body = null; } }
  if (!body || !Array.isArray(body.messages) || !body.messages.length) {
    return res.status(400).json({ error: 'Invalid request' });
  }
  if (JSON.stringify(body).length > MAX_BODY) return res.status(413).json({ error: 'Request too large' });

  const payload = {
    model: process.env.AI_MODEL || 'claude-sonnet-4-6',
    max_tokens: Math.min(Number(body.max_tokens) || 2000, MAX_TOKENS),
    messages: body.messages,
  };
  if (typeof body.system === 'string') payload.system = body.system;

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify(payload),
    });
    const data = await upstream.json().catch(() => ({ error: 'Invalid response from AI provider' }));
    return res.status(upstream.status).json(data);
  } catch (_) {
    return res.status(502).json({ error: 'Could not reach the AI provider' });
  }
};

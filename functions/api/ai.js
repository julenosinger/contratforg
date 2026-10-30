// Cloudflare Pages Function: forwards AI requests to Anthropic so the API key
// stays on the server. Set ANTHROPIC_API_KEY (as a secret) and optionally
// AI_MODEL in the Pages project settings.
const MAX_BODY = 60000;
const MAX_TOKENS = 4096;
const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get('origin');
  if (origin) {
    let ok = false;
    try { ok = new URL(origin).host === new URL(request.url).host; } catch (_) {}
    if (!ok) return json({ error: 'Forbidden origin' }, 403);
  }

  if (!env.ANTHROPIC_API_KEY) return json({ error: 'AI is not configured on this deployment. Set ANTHROPIC_API_KEY.' }, 503);

  const text = await request.text();
  if (text.length > MAX_BODY) return json({ error: 'Request too large' }, 413);
  let body;
  try { body = JSON.parse(text); } catch (_) { body = null; }
  if (!body || !Array.isArray(body.messages) || !body.messages.length) return json({ error: 'Invalid request' }, 400);

  const payload = {
    model: env.AI_MODEL || 'claude-sonnet-4-6',
    max_tokens: Math.min(Number(body.max_tokens) || 2000, MAX_TOKENS),
    messages: body.messages,
  };
  if (typeof body.system === 'string') payload.system = body.system;

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify(payload),
    });
    const data = await upstream.json().catch(() => ({ error: 'Invalid response from AI provider' }));
    return json(data, upstream.status);
  } catch (_) {
    return json({ error: 'Could not reach the AI provider' }, 502);
  }
}

export async function onRequest() {
  return json({ error: 'Method not allowed' }, 405);
}

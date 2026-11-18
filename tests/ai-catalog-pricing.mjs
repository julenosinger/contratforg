// Phase 12.2: AI model catalog & USDC pricing engine — pure functions, verified against BOTH platform builds (parity).
// All financial math is integer micro-USDC. No provider calls, no billing, no floats. Uses deterministic values.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) pass++; else { fail++; console.log('  FAIL  ' + m + (d === undefined ? '' : ' ' + JSON.stringify(d))); } };
const eq = (a, b, m) => ok(a === b, m + ' (got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b) + ')');

const vercel = require(path.join(root, 'api/ai.js'));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-catalog-'));
fs.writeFileSync(path.join(tmp, 'ai.mjs'), fs.readFileSync(path.join(root, 'functions/api/ai.js'), 'utf8'));
const cf = await import(pathToFileURL(path.join(tmp, 'ai.mjs')).href);
const V = vercel.__aiTest, C = cf.__aiTest;
ok(!!V && !!C, 'both platform modules expose __aiTest');

/* parity: the shared data is identical on both platforms (the shared core is byte-identical; verify value-level too) */
ok(JSON.stringify(V.AI_CATALOG) === JSON.stringify(C.AI_CATALOG), 'model catalog is identical on both platforms');
ok(JSON.stringify(V.AI_OPERATIONS) === JSON.stringify(C.AI_OPERATIONS), 'operation prices are identical on both platforms');
ok(JSON.stringify(V.AI_BILLING_TRANSITIONS) === JSON.stringify(C.AI_BILLING_TRANSITIONS), 'billing state machine is identical on both platforms');
ok(JSON.stringify(V.AI_PROVIDER_COST) === JSON.stringify(C.AI_PROVIDER_COST), 'provider cost table is identical on both platforms');

const builds = [['vercel', V], ['cloudflare', C]];
for (const [name, T] of builds) {
  const t = (m) => name + ': ' + m;

  /* ---- catalog lookup ---- */
  eq(T.aiCatalogEntry('anthropic', 'claude-sonnet-4-6') && T.aiCatalogEntry('anthropic', 'claude-sonnet-4-6').enabled, true, t('Anthropic default is in the catalog and enabled'));
  eq(T.aiCatalogEntry('anthropic', 'claude-sonnet-4-6').default, true, t('Anthropic default is marked default'));
  eq(T.aiCatalogEntry('openai', 'gpt-4o-mini') && T.aiCatalogEntry('openai', 'gpt-4o-mini').enabled, true, t('OpenAI default is enabled'));
  eq(T.aiCatalogEntry('openai', 'gpt-4o-mini').verified, false, t('OpenAI default is marked unverified'));
  eq(T.aiCatalogEntry('deepseek', 'deepseek-flash') && T.aiCatalogEntry('deepseek', 'deepseek-flash').enabled, true, t('DeepSeek default is enabled'));
  eq(T.aiCatalogEntry('deepseek', 'deepseek-reasoner').enabled, false, t('deprecated deepseek-reasoner is disabled'));
  eq(T.aiCatalogEntry('openai', 'no-such-model'), null, t('unknown model -> null'));

  /* ---- exact micro-USDC conversion (no floats) ---- */
  eq(T.aiUsdcToMicro('0.02'), 20000, t('0.02 USDC -> 20000 micro'));
  eq(T.aiUsdcToMicro('0.20'), 200000, t('0.20 USDC -> 200000 micro'));
  eq(T.aiUsdcToMicro('0.05'), 50000, t('0.05 USDC -> 50000 micro'));
  eq(T.aiUsdcToMicro('0.15'), 150000, t('0.15 USDC -> 150000 micro'));
  eq(T.aiUsdcToMicro('0.10'), 100000, t('0.10 USDC -> 100000 micro'));
  eq(T.aiUsdcToMicro(200000), 200000, t('integer micro passes through'));
  eq(T.aiUsdcToMicro(0), 0, t('zero is valid'));
  eq(T.aiUsdcToMicro('0'), 0, t('the string "0" -> 0'));
  eq(T.aiUsdcToMicro(-1), null, t('negative is rejected'));
  eq(T.aiUsdcToMicro('0.0000001'), null, t('more than 6 decimals is rejected'));
  eq(T.aiUsdcToMicro('abc'), null, t('non-numeric is rejected'));
  eq(T.aiUsdcToMicro('99999999999999999'), null, t('overflow is rejected'));
  eq(T.aiMicroToUsdc(200000), '0.200000', t('200000 micro -> "0.200000"'));
  eq(T.aiMicroToUsdc(20000), '0.020000', t('20000 micro -> "0.020000"'));
  eq(T.aiMicroToUsdc(150000), '0.150000', t('150000 micro -> "0.150000"'));
  eq(T.aiMicroToUsdc(-5), null, t('negative micro is rejected'));
  eq(T.aiMicroToUsdc(1.5), null, t('non-integer micro is rejected'));

  /* ---- token cost arithmetic ---- */
  eq(T.aiTokenCost(1000, 1000000), 1000, t('1000 tokens at 1 micro/token -> 1000 micro'));
  eq(T.aiTokenCost(0, 1000000), 0, t('0 tokens -> 0'));
  eq(T.aiTokenCost(100, 3000000), 300, t('100 tokens at 3 micro/token -> 300 micro'));
  eq(T.aiTokenCost(1, 1), 1, t('ceil: 1 token at 1 micro/M -> 1 micro (no free usage)'));
  eq(T.aiTokenCost(-5, 100), null, t('negative tokens rejected'));
  eq(T.aiTokenCost(100, -1), null, t('negative rate rejected'));
  eq(T.aiTokenCost(1e15, 1e15), null, t('overflow rejected'));

  /* ---- provider cost: input + output + cached, unknown when unverified ---- */
  const rates = { input: 1000000, output: 2000000, cachedInput: 500000 };
  eq(T.aiProviderCost('anthropic', { inputTokens: 100, outputTokens: 50 }, rates), 200, t('provider cost = input + output'));
  eq(T.aiProviderCost('anthropic', { inputTokens: 100, outputTokens: 50, cachedInputTokens: 80 }, rates), 240, t('cached input tokens are accounted separately'));
  eq(T.aiProviderCost('anthropic', { inputTokens: 100, outputTokens: 50 }, { input: null, output: null }), null, t('missing rates -> unknown (not zero)'));
  eq(T.aiProviderCost('anthropic', null), null, t('unverified production rates -> unknown (not zero)'));
  eq(T.aiProviderCost('anthropic', { inputTokens: -1, outputTokens: 0 }, rates), null, t('negative usage -> unknown'));
  eq(T.aiProviderCost('openai', { inputTokens: 10, outputTokens: 10 }, rates), 30, t('provider name selects the (injected) rate table'));

  /* ---- effective output-token cap (clamp semantics) ---- */
  eq(T.aiEffectiveOutputTokens('audit', { maxOutputTokens: 4096 }), 2000, t('audit output capped at 2000'));
  eq(T.aiEffectiveOutputTokens('chat', { maxOutputTokens: 4096 }), 4096, t('chat output capped at 4096'));
  eq(T.aiEffectiveOutputTokens('audit', { maxOutputTokens: 1000 }), 1000, t('a lower model cap wins'));

  /* ---- deterministic quotes ---- */
  const q = T.aiQuote('anthropic', 'claude-sonnet-4-6', 'review', { nowMs: 1000000, ttlMs: 60000 });
  ok(q.ok, t('a review quote is valid'));
  eq(q.priceMicro, 150000, t('review price = 150000 micro'));
  eq(q.maxChargeMicro, 150000, t('max charge equals the server price'));
  eq(q.pricingVersion, 1, t('pricing version 1'));
  eq(q.expiresAt, 1060000, t('expiry = now + ttl'));
  eq(q.operation, 'review', t('the operation is recorded'));
  eq(q.providerCostMicro, null, t('provider cost is unknown (unverified rates)'));
  const q2 = T.aiQuote('anthropic', 'claude-sonnet-4-6', 'review', { nowMs: 1000000, ttlMs: 60000 });
  eq(q2.priceMicro, q.priceMicro, t('quote price is deterministic'));
  eq(q2.maxChargeMicro, q.maxChargeMicro, t('quote max charge is deterministic'));
  ok(q2.quoteId !== q.quoteId, t('quote ids are unique'));
  eq(T.aiQuote('openai', 'gpt-4o-mini', 'tests', {}).priceMicro, 100000, t('tests price = 100000 micro'));
  eq(T.aiQuote('openai', 'gpt-4o-mini', 'generate', {}).priceMicro, 200000, t('generate price = 200000 micro'));
  eq(T.aiQuote('openai', 'gpt-4o-mini', 'question', {}).priceMicro, 20000, t('question price = 20000 micro'));
  eq(T.aiQuote('anthropic', 'claude-sonnet-4-6', 'bogus', {}).ok, false, t('unknown operation is rejected'));
  eq(T.aiQuote('openai', 'no-such-model', 'review', {}).ok, false, t('unknown model is rejected'));
  eq(T.aiQuote('deepseek', 'deepseek-reasoner', 'review', {}).ok, false, t('disabled model is rejected'));

  /* ---- action -> commercial operation mapping ---- */
  eq(T.AI_ACTION_OP.chat, 'question', t('chat maps to question'));
  eq(T.AI_ACTION_OP.audit, 'review', t('audit maps to review'));
  eq(T.AI_ACTION_OP.tests, 'tests', t('tests maps to tests'));
  eq(T.AI_ACTION_OP.generate, 'generate', t('generate maps to generate'));

  /* ---- operation prices (reference values, integer micro) ---- */
  eq(T.AI_OPERATIONS.question.priceMicro, 20000, t('question = 0.02 USDC'));
  eq(T.AI_OPERATIONS.generate.priceMicro, 200000, t('generate = 0.20 USDC'));
  eq(T.AI_OPERATIONS.correct.priceMicro, 50000, t('correct = 0.05 USDC'));
  eq(T.AI_OPERATIONS.review.priceMicro, 150000, t('review = 0.15 USDC'));
  eq(T.AI_OPERATIONS.tests.priceMicro, 100000, t('tests = 0.10 USDC'));

  /* ---- billing state machine (design only) ---- */
  eq(T.AI_BILLING_STATES.length, 10, t('10 billing states'));
  ok(T.aiCanTransition('quoted', 'authorized'), t('quoted -> authorized'));
  ok(T.aiCanTransition('authorized', 'reserved'), t('authorized -> reserved'));
  ok(T.aiCanTransition('reserved', 'executing'), t('reserved -> executing'));
  ok(T.aiCanTransition('executing', 'settled'), t('executing -> settled'));
  ok(T.aiCanTransition('executing', 'failed'), t('executing -> failed'));
  ok(T.aiCanTransition('executing', 'ambiguous'), t('executing -> ambiguous'));
  ok(T.aiCanTransition('settled', 'refunded'), t('settled -> refunded'));
  ok(!T.aiCanTransition('quoted', 'settled'), t('quoted -> settled is invalid'));
  ok(!T.aiCanTransition('settled', 'executing'), t('settled -> executing is invalid'));
  ok(!T.aiCanTransition('refunded', 'settled'), t('refunded is terminal'));
  ok(!T.aiCanTransition('expired', 'executing'), t('expired is terminal'));
}

fs.rmSync(tmp, { recursive: true, force: true });
console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);

// Phase 13.2: agent tool execution & secure deployment — deterministic security primitives, verified against both
// platform builds. Feature flags are disabled by default. No wallet or blockchain is exercised; all values are mocked.
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
const cfSrc = fs.readFileSync(path.join(root, 'functions/api/ai.js'), 'utf8');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-tools-'));
fs.writeFileSync(path.join(tmp, 'ai.mjs'), cfSrc);
const cf = await import(pathToFileURL(path.join(tmp, 'ai.mjs')).href);
const V = vercel.__aiTest, C = cf.__aiTest;
ok(!!V && !!C, 'both platform modules expose __aiTest');
ok(JSON.stringify(V.AGENT_TOOL_ACTIONS) === JSON.stringify(C.AGENT_TOOL_ACTIONS), 'the action allowlist is identical across platforms');
ok(JSON.stringify(V.AGENT_EXEC_TRANSITIONS) === JSON.stringify(C.AGENT_EXEC_TRANSITIONS), 'the execution state machine is identical across platforms');

for (const [name, T] of [['vercel', V], ['cloudflare', C]]) {
  const t = (m) => name + ': ' + m;

  /* feature flags are disabled by default */
  eq(T.AGENT_TOOL_EXECUTION_ENABLED, false, t('tool execution is disabled by default'));
  eq(T.AGENT_WALLET_DEPLOY_ENABLED, false, t('wallet deployment is disabled by default'));

  /* action allowlist */
  ok(T.agentValidateToolAction('compile_contract').ok, t('a known action is allowed'));
  ok(T.agentValidateToolAction('prepare_deployment').ok, t('deployment preparation is allowed'));
  eq(T.agentValidateToolAction('deploy_contract').ok, false, t('an unknown action is rejected'));
  eq(T.agentValidateToolAction('execute_shell').ok, false, t('a shell action is rejected'));
  eq(T.agentValidateToolAction('sign_transaction').ok, false, t('a signing action is rejected'));
  eq(T.agentValidateToolAction('move_funds').ok, false, t('a fund-movement action is rejected'));
  eq(T.agentValidateToolAction('compile_contract', { code: 'x'.repeat(5000) }).ok, false, t('overlarge params are rejected'));
  eq(T.agentValidateToolAction(null).ok, false, t('a null action is rejected'));

  /* execution state machine */
  ok(T.agentValidateTransition('created', 'interpreting'), t('created -> interpreting'));
  ok(T.agentValidateTransition('validating', 'awaiting_user_approval'), t('validating -> awaiting_user_approval'));
  ok(T.agentValidateTransition('awaiting_user_approval', 'awaiting_wallet_signature'), t('awaiting_user_approval -> awaiting_wallet_signature'));
  ok(T.agentValidateTransition('awaiting_wallet_signature', 'submitted'), t('awaiting_wallet_signature -> submitted'));
  ok(T.agentValidateTransition('submitted', 'confirming'), t('submitted -> confirming'));
  ok(T.agentValidateTransition('confirming', 'confirmed'), t('confirming -> confirmed'));
  ok(T.agentValidateTransition('confirmed', 'completed'), t('confirmed -> completed'));
  ok(!T.agentValidateTransition('created', 'submitted'), t('created -> submitted is invalid (skips approval)'));
  ok(!T.agentValidateTransition('planning', 'awaiting_wallet_signature'), t('planning -> awaiting_wallet_signature is invalid'));
  ok(!T.agentValidateTransition('awaiting_user_approval', 'confirmed'), t('awaiting_user_approval -> confirmed is invalid (skips wallet)'));
  ok(!T.agentValidateTransition('submitted', 'completed'), t('submitted -> completed is invalid (submission is not confirmation)'));
  ok(!T.agentValidateTransition('completed', 'submitted'), t('completed is terminal'));
  ok(!T.agentValidateTransition('rejected', 'executing'), t('rejected is terminal'));

  /* deployment intent: cryptographic (SHA-256), domain-separated, immutable */
  const intent = await T.agentBuildDeploymentIntent({
    walletAddress: '0x1111111111111111111111111111111111111111', contractId: 'c1',
    contractVersion: 'v1', sourceHash: 'abcdef1234567890', compilerVersion: '0.8.24', bytecodeHash: 'deadbeefdeadbeef',
    constructorArgs: ['0x00'], chainId: 5042, deploymentMode: 'create', destination: '', transactionDataHash: 'beef', value: '0', nonce: 'n1',
  });
  eq(intent.domain, 'ContractForge.DeploymentIntent', t('the intent carries the domain'));
  eq(intent.schemaVersion, 1, t('the intent carries the schema version'));
  eq(intent.intentHash.length, 64, t('the intent hash is a 256-bit hex digest'));
  eq(intent.constructorArgsHash.length, 64, t('the constructor args hash is a 256-bit hex digest'));
  ok(T.agentValidateDeploymentIntent(intent, 1700000000000).ok, t('a complete intent validates'));
  eq(await T.agentIntentChanged(intent), false, t('an unmodified intent does not change'));
  ok(await T.agentIntentChanged({ ...intent, transactionValue: '999' }), t('changing the value invalidates the intent'));
  ok(await T.agentIntentChanged({ ...intent, destination: '0x2222222222222222222222222222222222222222' }), t('changing the destination invalidates the intent'));
  ok(await T.agentIntentChanged({ ...intent, bytecodeHash: 'f'.repeat(64) }), t('changing the bytecode invalidates the intent'));
  ok(await T.agentIntentChanged({ ...intent, constructorArgsHash: 'e'.repeat(64) }), t('changing the constructor args invalidates the intent'));
  ok(await T.agentIntentChanged({ ...intent, transactionDataHash: 'cafe' }), t('changing the calldata invalidates the intent'));
  ok(await T.agentIntentChanged({ ...intent, chainId: 1 }), t('changing the chain id invalidates the intent'));
  ok(await T.agentIntentChanged({ ...intent, walletAddress: '0x3333333333333333333333333333333333333333' }), t('changing the wallet invalidates the intent'));
  eq(T.agentValidateDeploymentIntent({ ...intent, walletAddress: 'nope' }, 1700000000000).ok, false, t('an invalid wallet address is rejected'));
  eq(T.agentValidateDeploymentIntent({ ...intent, chainId: 0 }, 1700000000000).ok, false, t('an invalid chain id is rejected'));
  eq(T.agentValidateDeploymentIntent({ ...intent, domain: 'Evil.Domain' }, 1700000000000).ok, false, t('a wrong domain is rejected'));
  eq(T.agentValidateDeploymentIntent({ ...intent, schemaVersion: 2 }, 1700000000000).ok, false, t('an unsupported schema version is rejected'));
  eq(T.agentValidateDeploymentIntent({ ...intent, nonce: '' }, 1700000000000).ok, false, t('an invalid nonce is rejected'));
  eq(T.agentValidateDeploymentIntent({ ...intent, expiresAt: 1700000000000 }, 1700000000001).ok, false, t('an expired intent is rejected'));

  /* contract versioning */
  eq(T.agentContractVersionId('abcdef1234567890abcdef1234567890abcdef12'), 'abcdef1234567890abcdef1234567890abcdef12', t('a contract version id is the source hash'));
  eq(T.agentContractVersionId(''), '', t('an empty source hash yields no version'));

  /* network safety */
  eq(T.ARC_MAINNET_CHAIN_ID, 5042, t('Arc Mainnet chain id is 5042'));
  eq(T.ARC_TESTNET_CHAIN_ID, 5042002, t('Arc Testnet chain id is 5042002'));
  ok(T.agentNetworkMismatch(5042, 5042002), t('a Mainnet/Testnet mismatch is detected'));
  ok(!T.agentNetworkMismatch(5042, 5042), t('a matching chain id is not a mismatch'));

  /* correction loop bound */
  eq(T.AGENT_MAX_CORRECTIONS, 3, t('the correction limit is 3'));
  ok(T.agentCorrectionAllowed(0) && T.agentCorrectionAllowed(2), t('corrections 0..2 are allowed'));
  ok(!T.agentCorrectionAllowed(3) && !T.agentCorrectionAllowed(5), t('correction 3+ is refused'));

  /* security review gate */
  ok(!T.agentDeploymentBlocked({}).blocked, t('an empty state is not blocked'));
  eq(T.agentDeploymentBlocked({ compileStatus: 'failed' }).reason, 'compilation', t('a failed compilation blocks'));
  eq(T.agentDeploymentBlocked({ validParams: false }).reason, 'parameters', t('invalid parameters block'));
  eq(T.agentDeploymentBlocked({ supportedNetwork: false }).reason, 'network', t('an unsupported network blocks'));
  eq(T.agentDeploymentBlocked({ walletMismatch: true }).reason, 'wallet', t('a wallet mismatch blocks'));
  eq(T.agentDeploymentBlocked({ intentChanged: true }).reason, 'intent', t('a changed intent blocks'));
  eq(T.agentDeploymentBlocked({ criticalFinding: true }).reason, 'security', t('a critical finding blocks'));
  eq(T.agentDeploymentBlocked({ compileStatus: 'success' }).blocked, false, t('a successful compile alone is not blocked'));

  /* canonical serialization is key-order-independent */
  eq(T.agentCanonicalSerialize({ a: 1, b: 2 }), T.agentCanonicalSerialize({ b: 2, a: 1 }), t('canonical serialization is key-order independent'));
  eq(await T.agentHashStr('abc'), await T.agentHashStr('abc'), t('the hash is deterministic'));
  ok((await T.agentHashStr('abc')) !== (await T.agentHashStr('abd')), t('the hash changes when the input changes'));

  /* Phase 13.2.1 — trusted dispatcher and feature flags */
  eq(T.agentToolExecutionEnabled(() => undefined), false, t('the tool flag is false by default'));
  eq(T.agentToolExecutionEnabled(() => 'true'), true, t('the tool flag is env-driven'));
  eq(T.agentWalletDeployEnabled(() => undefined), false, t('the wallet deploy flag is false by default'));
  ok(!T.agentWalletDeployEnabled(() => 'false'), t('a false wallet flag stays false'));

  eq(T.agentDispatchTool('compile_contract', {}, { toolExecutionEnabled: false }).status, 'disabled', t('dispatch is disabled when the flag is off'));
  eq(T.agentDispatchTool('compile_contract', {}, { toolExecutionEnabled: true }).status, 'accepted', t('dispatch accepts an allowlisted action when enabled'));
  eq(T.agentDispatchTool('deploy_contract', {}, { toolExecutionEnabled: true }).status, 'rejected', t('dispatch rejects an unknown action'));
  eq(T.agentDispatchTool('execute_shell', {}, { toolExecutionEnabled: true }).status, 'rejected', t('dispatch rejects shell execution'));

  /* Phase 13.2.1 — tool result provenance (no fabricated success) */
  ok(T.agentValidateToolResult({ tool: 'compile_contract', status: 'completed', sourceHash: 'abcdef1234567890' }).ok, t('a completed compile with a source hash validates'));
  eq(T.agentValidateToolResult({ tool: 'compile_contract', status: 'completed' }).ok, false, t('a completed result without a source hash is rejected (no fabricated success)'));
  eq(T.agentValidateToolResult({ tool: 'compile_contract', status: 'maybe' }).ok, false, t('an unknown status is rejected'));
  eq(T.agentValidateToolResult({ tool: 'evil_tool', status: 'completed', sourceHash: 'abcdef1234567890' }).ok, false, t('an unknown tool is rejected'));
  ok(T.agentValidateToolResult({ tool: 'audit_contract', status: 'failed', error: 'x' }).ok, t('a failed result is valid (no fabricated success)'));
}

fs.rmSync(tmp, { recursive: true, force: true });
console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);

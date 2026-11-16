// Deterministic contract resolution (phase 11.1): never silently substitute another contract for the requested one.
// Tests resolveContract (pure) and compileSource (integration) for exact match, missing target, single/multiple
// deployable contracts, abstract/interface-only sources, and the AI multi-contract selector path.
import { loadApp } from './harness.mjs';

let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) pass++; else { fail++; console.log('  FAIL  ' + m + (d ? ' (' + d + ')' : '')); } };

const { ev, w } = loadApp();
const doc = w.document;
const resolve = (contractsJson, requested) => ev(`(() => {
  try { return { ok: resolveContract(${JSON.stringify(contractsJson)}, ${requested === undefined ? 'undefined' : JSON.stringify(requested)}) }; }
  catch (e) { return { err: String(e.message), ambiguous: !!e.ambiguous, deployable: e.deployable || [] }; }
})()`);
const art = (obj) => ({ evm: { bytecode: { object: obj } } });

/* A. exact match */
{
  const r = resolve({ A: art('0x6080'), B: art('0x6081') }, 'A');
  ok(r.ok === 'A', 'exact match selects the requested contract', JSON.stringify(r));
}
/* B. single unambiguous (no requested name) */
{
  const r = resolve({ A: art('0x6080') }, undefined);
  ok(r.ok === 'A', 'a single deployable contract is selected without a name', JSON.stringify(r));
}
/* C. multiple deployable, no requested name -> ambiguous */
{
  const r = resolve({ A: art('0x6080'), B: art('0x6081') }, undefined);
  ok(r.ambiguous === true && r.deployable.length === 2 && /A, B/.test(r.err), 'multiple deployable contracts require a pick', JSON.stringify(r));
}
/* D. requested target missing -> refused (no substitution) */
{
  const r = resolve({ A: art('0x6080'), B: art('0x6081') }, 'C');
  ok(/not found/.test(r.err) && !r.ok, 'a requested but missing contract is refused, never substituted', JSON.stringify(r));
}
/* E. abstract contract (empty bytecode) -> not deployable */
{
  const r = resolve({ A: art('') }, 'A');
  ok(/not deployable/.test(r.err), 'an abstract contract is not a deployable target', JSON.stringify(r));
}
/* E. interface-only source -> no deployable contract */
{
  const r = resolve({ I: art('') }, undefined);
  ok(/No deployable/.test(r.err), 'an interface-only source has no deployable contract', JSON.stringify(r));
}
/* E. abstract + one concrete -> the concrete is selected */
{
  const r = resolve({ A: art(''), B: art('0x6080') }, undefined);
  ok(r.ok === 'B', 'an abstract contract does not block the one concrete contract', JSON.stringify(r));
}
/* requested name is deployable but other deployable contracts exist -> exact match still wins (deterministic) */
{
  const r = resolve({ A: art('0x6080'), B: art('0x6081') }, 'A');
  ok(r.ok === 'A', 'an explicit requested name wins over ambiguity', JSON.stringify(r));
}

/* integration: compileSource refuses a multi-contract AI source without an explicit target */
{
  ev("ensureSolcLoaded = async () => {}; solcCompile = async () => JSON.stringify({ contracts: { 'Helper.sol': { Helper: { abi: [], evm: { bytecode: { object: '6080' } } }, Main: { abi: [], evm: { bytecode: { object: '6081' } } } } } });");
  ev("pendingSource = { name: 'Helper', code: 'contract Helper {} contract Main {}', template: 'ai', aiTargets: ['Helper', 'Main'] };");
  let err = '';
  try { await ev("compileSource('Helper', 'contract Helper {} contract Main {}')"); } catch (e) { err = String(e.message || e); }
  ok(/2 deployable contracts/.test(err) && /Helper, Main/.test(err), 'compileSource refuses a multi-contract AI source and names the contracts', err);
  // with an explicit target it resolves
  ev("ensureSolcLoaded = async () => {}; solcCompile = async () => JSON.stringify({ contracts: { 'Helper.sol': { Helper: { abi: [{ type: 'function', name: 'f' }], evm: { bytecode: { object: '6080' } } }, Main: { abi: [], evm: { bytecode: { object: '6081' } } } } } });");
  const compiled = await ev("compileSource('Helper', 'contract Helper {} contract Main {}', 'Main')");
  ok(compiled && compiled.target === 'Main' && compiled.bytecode === '0x6081', 'an explicit target resolves the intended contract', JSON.stringify(compiled && compiled.target));
}
/* integration: a single-contract AI source still resolves without a selector */
{
  ev("ensureSolcLoaded = async () => {}; solcCompile = async () => JSON.stringify({ contracts: { 'Main.sol': { Main: { abi: [], evm: { bytecode: { object: '6080' } } } } } });");
  ev("pendingSource = { name: 'Main', code: 'contract Main {}', template: 'ai', aiTargets: ['Main'] };");
  const compiled = await ev("compileSource('Main', 'contract Main {}')");
  ok(compiled && compiled.target === 'Main', 'a single-contract AI source resolves without a selector', JSON.stringify(compiled && compiled.target));
}

/* the selector dialog renders the deployable names and resolves the chosen one (or null on cancel) */
{
  const selected = ev("uiContractSelect(['Helper', 'Main'])");
  await new Promise((r) => setTimeout(r, 0));
  const dialog = () => doc.getElementById('contractSelect');
  ok(!!dialog() && dialog().querySelectorAll('.cs-item').length === 2, 'the selector renders the deployable contracts');
  ok(/Helper/.test(dialog().querySelector('.cs-item code').textContent), 'the selector lists the contract names');
  dialog().querySelectorAll('.cs-item')[1].click();
  ok((await selected) === 'Main', 'the selector resolves the chosen contract');
  const p2 = ev("uiContractSelect(['A'])");
  await new Promise((r) => setTimeout(r, 0));
  doc.getElementById('csCancel').click();
  ok((await p2) === null, 'the selector resolves null on cancel');
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);

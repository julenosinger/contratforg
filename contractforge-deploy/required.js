/* =====================================================================
   Required addresses. A generator never invents an address any more: when a field the contract needs is
   empty or wrong, the source is shown as a DRAFT, and compiling, copying, downloading and deploying are
   switched off (on every network) until the problem is fixed. The reason is shown next to the code.
   ===================================================================== */

/* Old stand-ins (0x...dEaD, 0x...bEEF, 0x...cAfE, in their 38 and 40 digit forms). They are never a real answer. */
const REQ_PLACEHOLDER_RE = /^0x0{34,36}(dead|beef|cafe)$/i;
const REQ_PLACEHOLDER_IN_CODE = /0x0{34,36}(dEaD|bEEF|cAfE)/i;
/* Shown inside a draft only, so the code still reads; the draft guard and the regex guard both refuse it. */
const REQ_DRAFT_ADDR = { a: '0x0000000000000000000000000000000000dEaD', b: '0x0000000000000000000000000000000000bEEF', c: '0x0000000000000000000000000000000000cAfE' };

/* '' when the value is acceptable, otherwise the reason. opts: { required, allowZero, notDeployer } */
function reqAddressProblem(value, opts){
  const o = opts || {};
  const v = String(value == null ? '' : value).trim();
  if(!v) return o.required ? 'is required' : '';
  if(!/^0x[0-9a-fA-F]{40}$/.test(v)) return 'must be an address: 0x followed by 40 hex characters';
  if(/^0x0{40}$/.test(v)) return o.allowZero ? '' : 'cannot be the zero address';
  if(REQ_PLACEHOLDER_RE.test(v)) return 'is a placeholder address, enter a real one';
  const mixed = /[a-f]/.test(v.slice(2)) && /[A-F]/.test(v.slice(2));
  if(mixed && typeof ethers !== 'undefined' && ethers.utils && ethers.utils.getAddress){
    try{ ethers.utils.getAddress(v); }catch(_){ return 'has a wrong checksum (check the capital letters)'; }
  }
  if(o.notDeployer && typeof account !== 'undefined' && account && v.toLowerCase() === String(account).toLowerCase()) return 'cannot be the wallet that deploys the contract';
  return '';
}

/* items: [{ label, value, required, allowZero, notDeployer }] -> ['Buyer is required', ...]; also flags repeats. */
function reqProblems(items, distinct){
  const out = [];
  (items || []).forEach(it => { const p = reqAddressProblem(it.value, it); if(p) out.push(it.label + ' ' + p); });
  if(distinct){
    const seen = {};
    (items || []).forEach(it => {
      const v = String(it.value || '').trim().toLowerCase();
      if(!v || reqAddressProblem(it.value, it)) return;
      if(seen[v]) out.push(it.label + ' and ' + seen[v] + ' must be different addresses'); else seen[v] = it.label;
    });
  }
  return out;
}

/* A token address that came out as the zero address means "this network has no default": it must be typed in
   (not needed when the token is chosen at deploy time in the portable modes). */
function reqTokenProblem(label, raw, resolved, netLabel){
  const typed = String(raw || '').trim();
  if(typed){ const p = reqAddressProblem(typed, { required: true }); return p ? label + ' ' + p : ''; }
  if(typeof isPortable === 'function' && isPortable()) return '';
  if(!resolved || /^0x0{40}$/.test(String(resolved))) return label + ' is required: ' + netLabel + ' has no default for it';
  return '';
}

function reqCurrentProblems(){
  return (typeof pendingSource !== 'undefined' && pendingSource && Array.isArray(pendingSource.problems)) ? pendingSource.problems : [];
}
/* '' or the sentence that explains why the current source cannot be used. */
function reqBlockReason(){
  const p = reqCurrentProblems();
  if(p.length) return 'Draft: ' + p.join('; ') + '.';
  if(typeof pendingSource !== 'undefined' && pendingSource && pendingSource.code && REQ_PLACEHOLDER_IN_CODE.test(pendingSource.code))
    return 'Draft: the source still contains a placeholder address (0x…dEaD, 0x…bEEF or 0x…cAfE). Fill in the required fields and generate again.';
  return '';
}

/* Greys out the buttons of the deploy section and tags the code panels. Called whenever the current contract changes. */
function reqApplyDraftState(){
  const why = reqBlockReason();
  const set = (id, on) => { const b = document.getElementById(id); if(!b) return; b.disabled = on; if(on) b.title = why; else b.removeAttribute('title'); };
  ['btnCompileDeploy', 'btnDownloadSol', 'btnCopySol'].forEach(id => set(id, !!why));
  const note = document.getElementById('draftReason');
  if(note){ note.style.display = why ? 'block' : 'none'; note.textContent = why; }
  document.querySelectorAll('.codepanel .codehead').forEach(h => {
    let tag = h.querySelector('.req-draft');
    if(why && !tag){ tag = document.createElement('span'); tag.className = 'req-draft'; tag.textContent = 'DRAFT'; tag.title = why; h.appendChild(tag); }
    if(!why && tag) tag.remove();
  });
}

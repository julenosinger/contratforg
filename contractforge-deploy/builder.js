/* ======================================================================
   BUILDER VIEW ENGINE (Phase 9.0) — the shared, read-only part of the contract builder screens.
   Loaded before app.js and depends on nothing at load time: it only reads page globals (NETWORKS, activeNetwork, pendingSource,
   loadDeployHistory, matInfo, MATURITY_LEVELS) when a module renders, and always behind a typeof check.

   A builder screen (Swap / AMM today; Treasury, Vault, MultiSend, Crosschain and the simple contracts later) registers ONE config
   object. The engine then keeps three things up to date from REAL state only:
     - a summary (rows the module describes),
     - a four-step progress list (Configuration, Code Generation, Review & Audit, Deployment) and three header steps,
     - the head of the generated-code panel (language, maturity, not-audited warning).
   It never writes a form field, never calls a generator, never compiles, never deploys and never changes pendingSource. It adds no
   state of its own: "what was generated and when" lives in two attributes on the code panel (data-sig, data-gen-at).

   Config (all functions run with the module's own values `v` = cfg.read()):
     key, section, codePanel, summary, progress, stages   ids of the module's elements
     prefix                                               CSS class prefix of the elements the engine creates ("swb" -> swb-row ...)
     isTemplate(tpl)                                      true for the pendingSource.template values this module produces
     read()                                               -> v  (module-owned: it knows its form)
     problems(v)                                          -> string[]  what is wrong with the configuration right now
     signature(v)                                         -> string    everything that changes the generated code (form + network + mode)
     summaryRows(v, row)                                  calls row(label, value, state, flag, mono) per summary line
     guidance(v)                                          optional: the module updates its own hints
     watch                                                optional: ids of containers whose children the page script redraws (the screen redraws after them)
     texts                                                optional overrides, see TEXTS below
   ====================================================================== */
const CFBuilder = (function(){
  'use strict';
  const modules = {};

  function el(tag, cls, text){
    const e = document.createElement(tag);
    if(cls) e.className = cls;
    if(text !== undefined) e.textContent = text;
    return e;
  }
  const net = () => (typeof NETWORKS !== 'undefined' && typeof activeNetwork !== 'undefined' && NETWORKS[activeNetwork]) || null;
  const buffer = () => (typeof pendingSource !== 'undefined' && pendingSource) || null;

  /* The wording of the four steps. A module may replace any of these functions; the defaults are the Swap / AMM texts. */
  const TEXTS = {
    configDone:   (v, ctx) => 'Parameters look valid for ' + (ctx.net ? ctx.net.label : 'the network') + '.',
    configIssue:  (v, ctx) => ctx.problems[0] + (ctx.problems.length > 1 ? ' (+' + (ctx.problems.length - 1) + ' more)' : ''),
    genTodo:      () => 'Press Generate contract to write the Solidity.',
    genDone:      (v, ctx) => ctx.gen.file + ', ' + ctx.gen.lines + ' lines generated.',
    genStaleForm: () => 'The form changed after this code was generated. Generate again.',
    genStaleBuf:  () => 'The deploy buffer now holds a different contract than this code. Generate again before deploying.',
    reviewLocked: () => 'Available once the code exists.',
    reviewTodo:   () => 'Not audited. Review the Solidity and run the AI Auditor or the Test Lab: results are not tracked here.',
    depDone:      (v, ctx) => 'Confirmed on ' + ((typeof NETWORKS !== 'undefined' && NETWORKS[ctx.dep.network]) ? NETWORKS[ctx.dep.network].label : ctx.dep.network) + ' at ' + ctx.dep.address,
    depTodo:      () => 'Nothing deployed yet. Deploy now opens Compile & Deploy.',
    // only used by a screen whose generator can write a DRAFT (cfg.draft): the code exists but the deploy page refuses it
    genDraft:     (v, ctx) => ctx.gen.file + ', ' + ctx.gen.lines + ' lines generated as a DRAFT: ' + ctx.draft.length + ' to fix before it can be deployed.',
    depBlocked:   (v, ctx) => 'Blocked until the draft is fixed: ' + ctx.draft[0] + (ctx.draft.length > 1 ? ' (+' + (ctx.draft.length - 1) + ' more)' : '')
  };

  /* Has the module's generator produced the code on screen, and is it still the code in the deploy buffer and still what the form says? */
  function genState(m, v){
    const panel = document.getElementById(m.codePanel);
    const pre = panel && panel.querySelector('pre');
    if(!pre) return { s: 'todo' };
    const fn = panel.querySelector('.filename');
    const info = { file: fn ? fn.textContent : '', lines: pre.textContent.split('\n').length };
    const buf = buffer();
    const inBuffer = !!(buf && buf.code === pre.textContent && m.isTemplate(buf.template || ''));
    if(!inBuffer) return { s: 'stale', why: 'buffer', ...info };
    if(panel.getAttribute('data-sig') !== m.signature(v)) return { s: 'stale', why: 'inputs', ...info };
    return { s: 'done', ...info };
  }

  /* A confirmed deployment: the app writes the history only after contract.deployed() resolved. It must be newer than this generation
     and carry the name of the contract in the buffer, so an older deployment never counts. */
  function deployed(m){
    const panel = document.getElementById(m.codePanel);
    const at = Number(panel && panel.getAttribute('data-gen-at'));
    const buf = buffer();
    if(!at || !buf || typeof loadDeployHistory !== 'function') return null;
    return loadDeployHistory().find(e => e && e.timestamp >= at && e.name === buf.name) || null;
  }

  function render(m){
    const sum = document.getElementById(m.summary);
    if(!sum) return;
    const v = m.read();
    const problems = m.problems(v);
    const gen = genState(m, v);
    const dep = deployed(m);
    // a generator that can write a draft (cfg.draft) lists what still blocks the deploy page; a screen without it never has a draft
    const draft = (typeof m.draft === 'function' && gen.s === 'done') ? (m.draft(v) || []) : [];
    const ctx = { net: net(), problems, gen, dep, draft };
    const T = Object.assign({}, TEXTS, m.texts || {});
    const p = m.prefix;
    if(m.guidance) m.guidance(v);

    sum.textContent = '';
    m.summaryRows(v, (label, value, state, flag, mono) => {
      const r = el('div', p + '-row'); r.setAttribute('data-state', state || 'ok');
      r.appendChild(el('dt', '', label));
      const dd = el('dd', mono ? 'mono' : '', value);
      if(flag) dd.appendChild(el('span', p + '-flag', flag));
      r.appendChild(dd); sum.appendChild(r);
    });

    const prog = document.getElementById(m.progress);
    prog.textContent = '';
    const step = (title, state, text) => {
      const li = el('li'); li.setAttribute('data-state', state);
      const mark = el('span', p + '-mark', state === 'done' ? '\u2713' : (state === 'attention' || state === 'stale' || state === 'draft' ? '!' : ''));
      mark.setAttribute('aria-hidden', 'true');
      const body = el('div'); body.appendChild(el('b', '', title)); body.appendChild(el('span', p + '-t', text));
      li.appendChild(mark); li.appendChild(body); prog.appendChild(li);
    };
    step('Configuration', problems.length ? 'attention' : 'done', problems.length ? T.configIssue(v, ctx) : T.configDone(v, ctx));
    step('Code Generation', gen.s === 'done' ? (draft.length ? 'draft' : 'done') : (gen.s === 'stale' ? 'stale' : 'todo'),
      gen.s === 'done' ? (draft.length ? T.genDraft(v, ctx) : T.genDone(v, ctx)) : gen.s === 'stale' ? (gen.why === 'inputs' ? T.genStaleForm(v, ctx) : T.genStaleBuf(v, ctx)) : T.genTodo(v, ctx));
    // Review & Audit never completes here: the app does not record which source an audit or a test run covered.
    step('Review & Audit', gen.s === 'todo' ? 'locked' : 'todo', gen.s === 'todo' ? T.reviewLocked(v, ctx) : T.reviewTodo(v, ctx));
    step('Deployment', dep ? 'done' : ((gen.s === 'todo' || draft.length) ? 'locked' : 'todo'), dep ? T.depDone(v, ctx) : (draft.length ? T.depBlocked(v, ctx) : T.depTodo(v, ctx)));

    const hs = { configure: problems.length ? 'current' : 'done', generate: gen.s === 'done' ? 'done' : (problems.length ? 'todo' : 'current'), deploy: dep ? 'done' : ((gen.s === 'done' && !draft.length) ? 'current' : 'todo') };
    document.querySelectorAll('#' + m.stages + ' li').forEach(li => {
      const s = hs[li.getAttribute('data-step')];
      li.setAttribute('data-state', s);
      if(s === 'current') li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
  }

  /* Adds language, maturity and the not-audited warning to the head of the code panel that showCode() just filled. The Solidity is not touched. */
  function decorateCode(m){
    const panel = document.getElementById(m.codePanel);
    const head = panel && panel.querySelector('.codehead');
    const p = m.prefix;
    if(!head || head.querySelector('.' + p + '-lang')) return;
    head.appendChild(el('span', p + '-lang', 'Solidity'));
    const buf = buffer();
    const tpl = buf ? buf.template : '';
    if(m.isTemplate(tpl || '') && typeof matInfo === 'function' && typeof MATURITY_LEVELS !== 'undefined'){
      const i = matInfo(tpl), L = MATURITY_LEVELS[i.level];
      if(L){
        const b = el('span', 'mat-badge mat-' + i.level + ' mat-small'); b.title = L.title + '. ' + i.reason;
        b.appendChild(el('span', '', L.icon)); b.appendChild(document.createTextNode(' ' + L.label));
        head.appendChild(b);
        if(i.level === 'experimental') head.appendChild(el('span', p + '-warn', 'Not audited'));
      }
    }
  }

  function onGenerated(m){
    const panel = document.getElementById(m.codePanel);
    if(!panel || !panel.querySelector('pre')) return;
    panel.setAttribute('data-sig', m.signature(m.read()));
    panel.setAttribute('data-gen-at', String(Date.now()));
    decorateCode(m);
    render(m);
  }

  /* One set of listeners and observers per module, however many times anything is redrawn. Safe to call again: it does nothing the second time. */
  function init(m){
    if(m.bound || typeof document === 'undefined') return;
    const sec = document.getElementById(m.section);
    if(!sec) return;
    m.bound = true;
    const draw = () => render(m);
    sec.addEventListener('input', draw);
    sec.addEventListener('change', draw);
    if(typeof MutationObserver !== 'function') return;
    const code = document.getElementById(m.codePanel);
    if(code) new MutationObserver(() => onGenerated(m)).observe(code, { childList: true });
    new MutationObserver(draw).observe(sec, { attributes: true, attributeFilter: ['style'] });                    // entering the section refreshes it
    const side = document.getElementById('sidenet');
    if(side) new MutationObserver(draw).observe(side, { childList: true, characterData: true, subtree: true });   // the active network changed
    (m.watch || []).forEach(id => {                                                                                // a screen whose form is drawn by script (Simple contracts)
      const el = document.getElementById(id);
      if(el) new MutationObserver(() => setTimeout(draw, 0)).observe(el, { childList: true });                     // after the page script has restored saved values too
    });
    const hist = document.getElementById('historyList');
    if(hist) new MutationObserver(draw).observe(hist, { childList: true });                                       // a deployment was recorded
  }

  function register(cfg){
    ['key', 'section', 'codePanel', 'summary', 'progress', 'stages', 'prefix', 'isTemplate', 'read', 'problems', 'signature', 'summaryRows'].forEach(k => {
      if(cfg[k] === undefined) throw new Error('CFBuilder.register: missing ' + k);
    });
    if(modules[cfg.key]) return modules[cfg.key];
    const m = Object.assign({ bound: false }, cfg);
    modules[cfg.key] = m;
    init(m);
    return m;
  }

  /* The Network row every builder shows. A mainnet carries the same warning everywhere; the text states only what the deploy path really does
     (the maturity confirmation and the typed network name), nothing about the contract itself. */
  function networkRow(row, net){
    row('Network', net ? net.label + ' (' + net.chainIdDec + ')' : 'Unknown', net ? 'ok' : 'bad',
      net && net.isMainnet ? 'Mainnet: real funds. Deploying asks for the maturity confirmation and the network name.' : '');
  }

  return {
    el, register, TEXTS, networkRow,
    render: (key) => { if(modules[key]) render(modules[key]); },
    renderAll: () => { Object.keys(modules).forEach(k => render(modules[k])); },
    decorateCode: (key) => { if(modules[key]) decorateCode(modules[key]); },
    genState: (key) => { const m = modules[key]; return m ? genState(m, m.read()) : null; },
    deployed: (key) => { const m = modules[key]; return m ? deployed(m) : null; },
    keys: () => Object.keys(modules)
  };
})();

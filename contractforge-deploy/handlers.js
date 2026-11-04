/* Event handlers without inline attributes.
   The Content-Security-Policy has no 'unsafe-inline' in script-src, so the browser refuses onclick="..." attributes. The markup carries
   data-onclick / data-onchange / data-oninput / data-onkeydown instead, with a call written exactly like the old attribute:
       data-onclick="genSimple('erc20')"      data-onclick="wizardPick('token', this)"      data-onchange="labSelectAccount()"
   This file runs those calls WITHOUT eval or new Function: the text is parsed (a function name and literal arguments only: strings, numbers,
   true / false / null, this, this.value, this.checked, this.id, this.name, event), the function must be one the app defines (native functions such as
   eval, setTimeout, alert or open are refused) and then it is called. Anything else is ignored with a message in the console.
   tests/csp.mjs checks that every data-on* value in the page and in the scripts can be parsed. */
(function(){
  'use strict';
  const EVENTS = ['click', 'change', 'input', 'keydown'];
  const NAME = /^[A-Za-z_$][\w$]*$/;
  const cache = new Map();

  function splitTop(src, sep){
    const out = []; let cur = '', q = '', esc = false;
    for(const c of src){
      if(esc){ cur += c; esc = false; continue; }
      if(q){ cur += c; if(c === '\\') esc = true; else if(c === q) q = ''; continue; }
      if(c === "'" || c === '"'){ q = c; cur += c; continue; }
      if(c === sep){ out.push(cur); cur = ''; continue; }
      cur += c;
    }
    if(q) throw new Error('unterminated string');
    out.push(cur);
    return out;
  }
  function parseArg(raw){
    const a = raw.trim();
    if(a === 'this') return { k: 'this' };
    if(a === 'event') return { k: 'event' };
    const tp = a.match(/^this\.(value|checked|id|name)$/);
    if(tp) return { k: 'prop', p: tp[1] };
    if(a === 'true') return { k: 'v', v: true };
    if(a === 'false') return { k: 'v', v: false };
    if(a === 'null') return { k: 'v', v: null };
    if(/^-?\d+(\.\d+)?$/.test(a)) return { k: 'v', v: Number(a) };
    const m = a.match(/^(['"])((?:\\.|(?!\1)[^\\])*)\1$/);
    if(m) return { k: 'v', v: m[2].replace(/\\(.)/g, '$1') };
    throw new Error('unsupported argument: ' + a);
  }
  function parse(expr){
    if(cache.has(expr)) return cache.get(expr);
    const calls = splitTop(expr, ';').map(s => s.trim()).filter(Boolean).map(stmt => {
      const m = stmt.match(/^([A-Za-z_$][\w$]*)\s*\(([\s\S]*)\)$/);
      if(!m) throw new Error('not a plain call: ' + stmt);
      const inner = m[2].trim();
      return { name: m[1], args: inner === '' ? [] : splitTop(inner, ',').map(parseArg) };
    });
    cache.set(expr, calls);
    return calls;
  }
  function isNative(f){ try { return /\[native code\]\s*\}\s*$/.test(Function.prototype.toString.call(f)); } catch(_) { return true; } }
  function run(el, ev, expr){
    let calls;
    try { calls = parse(expr); } catch(e){ console.error('handler not run (' + e.message + '):', expr); return; }
    for(const c of calls){
      const fn = NAME.test(c.name) ? window[c.name] : undefined;
      if(typeof fn !== 'function' || isNative(fn)){ console.error('handler not run (not a function of the app):', c.name); return; }
      const args = c.args.map(a => a.k === 'this' ? el : a.k === 'event' ? ev : a.k === 'prop' ? el[a.p] : a.v);
      try { fn.apply(el, args); } catch(e){ console.error(e); }
    }
  }
  function dispatch(ev){
    const attr = 'data-on' + ev.type;
    for(let el = ev.target instanceof Element ? ev.target : null; el && el !== document; el = el.parentElement){
      const expr = el.getAttribute(attr);
      if(expr) run(el, ev, expr);
      if(ev.cancelBubble) break;
    }
  }
  EVENTS.forEach(t => document.addEventListener(t, dispatch));
  window.__handlerParse = parse;      // used by tests/csp.mjs
})();

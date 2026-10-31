/* Compiles Solidity off the main thread so the page stays responsive.
   Protocol: postMessage({id,type:'load',urls:[...]}) then postMessage({id,type:'compile',input}).
   The compiler is fetched from the first address that works (a mirror is tried if the first is unreachable).
   Replies: {id,ok:true,output?} or {id,ok:false,error}. One worker per compiler version. */
let compileJson = null;

function hostOf(u){ try{ return new URL(u).host; }catch(_){ return String(u); } }

function whenReady(M){
  return new Promise((resolve,reject)=>{
    if(!M){ reject(new Error('solc module did not initialize')); return; }
    if(M.calledRun){ resolve(); return; }
    M.onRuntimeInitialized = resolve;
  });
}

self.onmessage = async (ev)=>{
  const { id, type, url, urls, input } = ev.data || {};
  try{
    if(type === 'load'){
      const list = Array.isArray(urls) && urls.length ? urls : [url];
      const failures = [];
      let loaded = false;
      for(const u of list){
        try{
          self.Module = undefined;
          importScripts(u);
          loaded = true;
          break;
        }catch(e){ failures.push(hostOf(u) + ': ' + String((e && e.message) || e)); }
      }
      if(!loaded) throw new Error('Could not download the compiler (' + failures.join(' | ') + ')');
      await whenReady(self.Module);
      compileJson = self.Module.cwrap('solidity_compile', 'string', ['string','number','number']);
      self.postMessage({ id, ok:true });
    } else if(type === 'compile'){
      if(!compileJson) throw new Error('Compiler is not loaded');
      self.postMessage({ id, ok:true, output: compileJson(input, 0, 0) });
    } else {
      throw new Error('Unknown message type');
    }
  }catch(e){
    self.postMessage({ id, ok:false, error: String((e && e.message) || e) });
  }
};

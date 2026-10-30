/* Compiles Solidity off the main thread so the page stays responsive.
   Protocol: postMessage({id,type:'load',url}) then postMessage({id,type:'compile',input}).
   Replies: {id,ok:true,output?} or {id,ok:false,error}. One worker per compiler version. */
let compileJson = null;

function whenReady(M){
  return new Promise((resolve,reject)=>{
    if(!M){ reject(new Error('solc module did not initialize')); return; }
    if(M.calledRun){ resolve(); return; }
    M.onRuntimeInitialized = resolve;
  });
}

self.onmessage = async (ev)=>{
  const { id, type, url, input } = ev.data || {};
  try{
    if(type === 'load'){
      self.Module = undefined;
      importScripts(url);
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

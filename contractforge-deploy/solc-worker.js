/* Compiles Solidity off the main thread so the page stays responsive.
   Protocol: postMessage({id,type:'load'}) then postMessage({id,type:'compile',input}).
   The compiler is a self-hosted same-origin file under vendor/ (no CDN). Before running it the worker fetches the
   file, checks its sha256 against vendor/MANIFEST.json with crypto.subtle, and refuses on any mismatch. There is no
   remote fallback: a failed check is an error, not a chance to download a different compiler.
   Replies: {id,ok:true,output?} or {id,ok:false,error}. */
let compileJson = null;

function whenReady(M){
  return new Promise((resolve,reject)=>{
    if(!M){ reject(new Error('solc module did not initialize')); return; }
    if(M.calledRun){ resolve(); return; }
    M.onRuntimeInitialized = resolve;
  });
}

async function sha256hex(buf){
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

self.onmessage = async (ev)=>{
  const { id, type, input } = ev.data || {};
  try{
    if(type === 'load'){
      const manifest = await (await fetch('vendor/MANIFEST.json')).json();
      const entry = manifest && manifest.solc;
      if(!entry || !entry.file || !entry.sha256) throw new Error('Compiler manifest is missing or incomplete');
      const resp = await fetch('vendor/' + entry.file);
      if(!resp.ok) throw new Error('Could not load the self-hosted compiler (' + resp.status + ')');
      const buf = await resp.arrayBuffer();
      const actual = await sha256hex(buf);
      if(actual !== entry.sha256) throw new Error('Compiler integrity check failed: the file does not match the manifest sha256. Refusing to run it.');
      self.Module = undefined;
      importScripts('vendor/' + entry.file);
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

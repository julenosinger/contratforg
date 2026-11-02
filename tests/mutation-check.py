# Guard mutation check: switches each new guard off in turn and runs the tests that must notice.
# Run from anywhere: python3 tests/mutation-check.py   (it restores each file with git checkout; commit your work first).
import subprocess, sys
import os
REPO=os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
M=[
 ('gate: experimental level no longer opens the dialog','contractforge-deploy/maturity.js',"  if(info.level === 'experimental'){\n    const ok = (typeof uiExperimentalGate","  if(false){\n    const ok = (typeof uiExperimentalGate",'ui.mjs'),
 ('gate: compileAndDeploy skips the gate','contractforge-deploy/app.js',"if(!(await matGate([activeNetwork], pendingSource))){","if(false){",'ui.mjs'),
 ('gate: multi-deploy skips the gate','contractforge-deploy/multideploy.js',"if(!(await matGate(mains, pendingSource))){","if(false){",'ui.mjs'),
 ('gate: deployCompiled stops checking the approval','contractforge-deploy/app.js',"if(NETWORKS[netKey].isMainnet && !matIsApproved(compiled.sourceHash, netKey)){","if(false){",'ui.mjs'),
 ('gate: unknown template counts as reviewed','contractforge-deploy/maturity.js',"MATURITY.imported;","MATURITY.treasury;",'maturity.mjs'),
 ('proxy (Vercel): a request without Origin passes','api/ai.js',"if (!origin || !host) return false;","if (!host) return false; if (!origin) return true;",'ai-proxy.mjs'),
 ('proxy (Cloudflare): a request without Origin passes','functions/api/ai.js',"if (!origin || !host) return false;","if (!host) return false; if (!origin) return true;",'ai-proxy.mjs'),
 ('proxy (Vercel): Sec-Fetch-Site ignored','api/ai.js',"if (fetchSite && fetchSite !== 'same-origin') return false;","",'ai-proxy.mjs'),
 ('proxy (Cloudflare): Sec-Fetch-Site ignored','functions/api/ai.js',"if (fetchSite && fetchSite !== 'same-origin') return false;","",'ai-proxy.mjs'),
 ('proxy (Vercel): rate limit off','api/ai.js',"if (!rl.ok) {","if (false) {",'ai-proxy.mjs'),
 ('proxy (Cloudflare): rate limit off','functions/api/ai.js',"if (!rl.ok)","if (false)",'ai-proxy.mjs'),
 ('proxy (Vercel): client system prompt honoured','api/ai.js',"  if (built.system) payload.system = built.system;","  if (built.system || (body && body.system)) payload.system = (body && body.system) || built.system;",'ai-proxy.mjs'),
 ('proxy (Cloudflare): client system prompt honoured','functions/api/ai.js',"  if (built.system) payload.system = built.system;","  if (built.system || (body && body.system)) payload.system = (body && body.system) || built.system;",'ai-proxy.mjs'),
 ('required: the placeholder is accepted by the validator','contractforge-deploy/required.js',"  if(REQ_PLACEHOLDER_RE.test(v)) return 'is a placeholder address, enter a real one';\n","",'ui.mjs'),
 ('required: the regex second layer never matches','contractforge-deploy/required.js',"const REQ_PLACEHOLDER_IN_CODE = /0x0{34,36}(dEaD|bEEF|cAfE)/i;","const REQ_PLACEHOLDER_IN_CODE = /(?!)/;",'ui.mjs'),
 ('required: a draft is never blocked','contractforge-deploy/required.js',"  if(p.length) return 'Draft: ' + p.join('; ') + '.';","  if(false) return '';",'ui.mjs'),
 ('wallet: the old default of 100 returns','contractforge-deploy/app.js',"const spendlimit= g('s_spendlimit').trim()||net.walletDailyDefault;","const spendlimit= g('s_spendlimit').trim()||'100';",'ui.mjs'),
]
bad=0
for name,f,old,new,test in M:
    path=REPO+'/'+f
    s=open(path,encoding='utf-8').read()
    if s.count(old)<1:
        print('SKIP (pattern count %d): %s'%(s.count(old),name)); bad+=1; continue
    open(path,'w',encoding='utf-8').write(s.replace(old,new))
    try:
        r=subprocess.run(['node',test],cwd=REPO+'/tests',capture_output=True,text=True,timeout=250)
        failed = r.returncode!=0
        print(('CAUGHT   ' if failed else 'NOT CAUGHT ')+name+'  ['+test+']')
        if not failed: bad+=1
    except subprocess.TimeoutExpired:
        print('CAUGHT (timeout) '+name)
    finally:
        subprocess.run(['git','checkout','--',f],cwd=REPO)
print('uncaught mutations:',bad)

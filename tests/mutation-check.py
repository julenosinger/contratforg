# Guard mutation check: switches each new guard off in turn and runs the tests that must notice.
# Run from anywhere: python3 tests/mutation-check.py   (it restores each file with git checkout; commit your work first).
import shutil, subprocess, sys
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
 # ---- phase 4: the NFT mint, the new events, the factory, the DAO and MultiSend (detected by the Foundry suites)
 ('nft: mint pays before it records the token (checks-effects-interactions undone)','contractforge-deploy/app.js',
  """        tokenId = ++totalSupply;
        _owners[tokenId] = msg.sender;
        _balances[msg.sender] += 1;
        emit Transfer(address(0), msg.sender, tokenId);
        emit Minted(msg.sender, tokenId);
        if (mintPrice > 0) {
            require(IERC20(usdc).transferFrom(msg.sender, owner, mintPrice), "USDC payment failed");
        }
""","""        if (mintPrice > 0) {
            require(IERC20(usdc).transferFrom(msg.sender, owner, mintPrice), "USDC payment failed");
        }
        tokenId = ++totalSupply;
        _owners[tokenId] = msg.sender;
        _balances[msg.sender] += 1;
        emit Transfer(address(0), msg.sender, tokenId);
        emit Minted(msg.sender, tokenId);
""",'forge'),
 ('nft: mint loses its reentrancy guard','contractforge-deploy/app.js',"function mint() external nonReentrant returns (uint256 tokenId) {","function mint() external returns (uint256 tokenId) {",'forge'),
 ('nft: setMintPrice stops emitting its event','contractforge-deploy/app.js',"        emit MintPriceUpdated(mintPrice, newPrice);\n","",'forge'),
 ('subscription: setPrice stops emitting its event','contractforge-deploy/app.js',"        emit PriceUpdated(pricePerPeriod, newPrice);\n","",'forge'),
 ('vault: setDepositCap stops emitting its event','contractforge-deploy/app.js',"        emit DepositCapUpdated(depositCap, newCap);\n","",'forge'),
 ('factory: createPair accepts a second pair for the same tokens','contractforge-deploy/app.js','        require(getPair[tokenX][tokenY] == address(0), "pair exists");\n',"",'forge'),
 ('dao: an executed proposal can be executed again','contractforge-deploy/app.js','        require(block.timestamp >= p.eta, "timelock active");\n        p.executed = true;\n','        require(block.timestamp >= p.eta, "timelock active");\n','forge'),
 ('dao: an account can vote twice','contractforge-deploy/app.js','        require(!p.hasVoted[msg.sender], "already voted");\n',"",'forge'),
 ('multisend: a token without code is accepted','contractforge-deploy/app.js','        require(token.code.length > 0, "token is not a contract");\n',"",'forge'),
 ('multisend: native payments lose their gas cap','contractforge-deploy/app.js',"{value: amounts[i], gas: NATIVE_TRANSFER_GAS}","{value: amounts[i]}",'forge'),
 ('dao: transferAdmin hands the role over at once (no accept step)','contractforge-deploy/app.js',"        pendingAdmin = newAdmin;\n        emit AdminTransferStarted(admin, newAdmin);","        admin = newAdmin;\n        emit AdminTransferStarted(admin, newAdmin);",'forge'),
 ('dao: renounce leaves a pending admin behind','contractforge-deploy/app.js',"        admin = address(0);\n        pendingAdmin = address(0);\n","        admin = address(0);\n",'forge'),
 ('dao: a voting period of zero is accepted again','contractforge-deploy/app.js','        require(VOTING_PERIOD >= 1, "voting period must be at least 1 block");\n',"",'forge'),
 ('dao: a pending admin can already cancel','contractforge-deploy/app.js','(admin != address(0) && msg.sender == admin), "not authorised");','(admin != address(0) && msg.sender == admin) || msg.sender == pendingAdmin, "not authorised");','forge'),
 ('nft: ownership can be offered to the zero address','contractforge-deploy/app.js','        require(newOwner != address(0), "new owner is the zero address");\n',"",'forge'),
 ('nft: anyone can accept the ownership','contractforge-deploy/app.js','        require(msg.sender == pendingOwner && msg.sender != address(0), "not pending owner");\n',"",'forge'),
 ('wallet: the check ignores the function (the whole target is open again)','contractforge-deploy/app.js',"if (_permAt[_permKey(key, target, selector)] != _sessionVersion[key]) revert CallNotAllowed(target, selector);","if (_permAt[_permKey(key, target, bytes4(0))] != _sessionVersion[key] && _permAt[_permKey(key, target, selector)] != _sessionVersion[key] && false) revert CallNotAllowed(target, selector);",'forge'),
 ('wallet: the blocked list stops applying to calls','contractforge-deploy/app.js',"if (selector == bytes4(0) || _isBlockedSelector(selector)) revert ForbiddenCall(selector);","if (selector == bytes4(0)) revert ForbiddenCall(selector);",'forge'),
 ('wallet: a blocked function can be granted','contractforge-deploy/app.js',"            if (sel != bytes4(0) && _isBlockedSelector(sel)) revert ForbiddenCall(sel);\n","",'forge'),
 ('nft: setBaseURI stops emitting its event','contractforge-deploy/app.js',"        emit BaseURIUpdated(baseURI, uri);\n","",'forge'),
 ('subscription: setBeneficiary stops emitting its event','contractforge-deploy/app.js',"        emit BeneficiaryUpdated(beneficiary, newBeneficiary);\n","",'forge'),
 ('factory: PairCreated stops indexing the tokens','contractforge-deploy/app.js',"event PairCreated(address indexed token0, address indexed token1, address pair);","event PairCreated(address token0, address token1, address pair);",'forge'),
 ('slither pin: a changed function no longer breaks its pin','tests/slither-check.mjs',"else if (!pinsOf(entry).includes(f.pin.hash)) {","else if (false) {",'slither-pin.mjs'),
 # ---- phase 5.5: the CSP and the innerHTML escape (detected by the Node suites)
 ('csp: script-src regains unsafe-inline','vercel.json',"script-src 'self' 'wasm-unsafe-eval'","script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'",'csp.mjs'),
 ('csp: script-src regains an external host','vercel.json',"script-src 'self' 'wasm-unsafe-eval'","script-src 'self' https://cdn.jsdelivr.net 'wasm-unsafe-eval'",'csp.mjs'),
 ('xss: an approved sink loses escapeHtml (contract bar name)','contractforge-deploy/ui.js',"Current contract</span><b>' + escapeHtml(pendingSource.name)","Current contract</span><b>' + pendingSource.name",'xss.mjs'),
 # ---- phase 6: the self-hosted compiler supply chain (detected by the Node suites)
 ('vendor: a byte of the compiler changes','contractforge-deploy/vendor/solc/soljson-v0.8.24+commit.e11b9ed9.js',"var Module = Module || {}","var Module = Module || {}x",'vendor.mjs'),
 ('vendor: the manifest hash diverges from the file','contractforge-deploy/vendor/MANIFEST.json','"sha256": "fb59b825b7d57f9de89cd9de2415b12aab1fcc7eb2573fd2bf5c9b969eacf4d9"','"sha256": "0000000000000000000000000000000000000000000000000000000000000000"','vendor.mjs'),
 ('worker: it fetches a remote compiler URL again','contractforge-deploy/solc-worker.js',"fetch('vendor/MANIFEST.json')","fetch('https://evil.example/MANIFEST.json')",'solc-loader.mjs'),
 # ---- phase 7: manifest cache and the owner rotation (headers.mjs, and the Foundry suites for the rotation)
 ('headers: the manifest becomes immutable again','contractforge-deploy/_headers',"Cache-Control: no-cache, must-revalidate","Cache-Control: public, max-age=31536000, immutable",'headers.mjs'),
 ('owner: a pending owner gets the role at once','contractforge-deploy/app.js',"        pendingOwner = newOwner;\n        emit OwnershipTransferStarted(owner, newOwner);","        owner = newOwner;\n        emit OwnershipTransferStarted(owner, newOwner);",'forge'),
 ('owner: anyone can accept the role','contractforge-deploy/app.js','require(msg.sender == pendingOwner && msg.sender != address(0), "not pending owner");','require(msg.sender != address(0), "not pending owner");','forge'),
 ('owner: renounce keeps the pending owner','contractforge-deploy/app.js',"        pendingOwner = address(0);\n        emit OwnershipTransferred(owner, address(0));","        emit OwnershipTransferred(owner, address(0));",'forge'),
 ('owner: the zero address can be offered the role','contractforge-deploy/app.js','require(newOwner != address(0) && newOwner != owner && newOwner != address(this), "invalid new owner");','require(newOwner != owner && newOwner != address(this), "invalid new owner");','forge'),
 # ---- phase 8: the AI chat (ai-proxy.mjs, xss.mjs, ui.mjs)
 ('chat: the renderer accepts any link','contractforge-deploy/chat-md.js','const LINK_RE = /^https?:\\/\\//i;','const LINK_RE = /./;','xss.mjs'),
 ('chat: an assistant-first conversation is accepted','api/ai.js','if (msgs[0].role !== \'user\' || msgs[msgs.length - 1].role !== \'user\') return bad(\'Invalid request\');','if (msgs[msgs.length - 1].role !== \'user\') return bad(\'Invalid request\');','ai-proxy.mjs'),
 ('chat: the client system prompt is honoured','api/ai.js','return { ok: true, system, messages: msgs.map((m) => ({ role: m.role, content: m.content })), maxTokens: AI_MAX_TOKENS.chat };','return { ok: true, system: p.system || system, messages: msgs.map((m) => ({ role: m.role, content: m.content })), maxTokens: AI_MAX_TOKENS.chat };','ai-proxy.mjs'),
 ('chat: Use adopts the code without the AI stamp','contractforge-deploy/app.js',"  const code = matStamp(String(rawCode || ''), 'ai');","  const code = String(rawCode || '');",'ui.mjs'),
 # ---- phase 7.1: native oracle, Foundry compile, chat normalisation
 ('oracle: the Emscripten build is accepted as native','tests/native-solc-version.mjs','if (/Emscripten/i.test(v)) return false;','if (/Emscripten/i.test(v)) return true;','native-solc-oracle.mjs'),
 ('foundry: a getter is used without parentheses again','tests/solidity/test/Erc20.t.sol','require(h.token().owner() != address(0), "owner became zero without a renounce");','require(h.token.owner() != address(0), "owner became zero without a renounce");','compile-foundry-tests.mjs'),
 ('chat: consecutive same-role messages are not merged','contractforge-deploy/app.js',"    if (last && last.role === m.role) last.content += '\\n\\n' + m.content;\n    else merged.push({ role: m.role, content: m.content });","    merged.push({ role: m.role, content: m.content });",'ui.mjs'),
 # ---- phase 11.1: deterministic contract resolution
 ('resolve: the first contract is silently chosen again','contractforge-deploy/app.js',"  const target = resolveContract(contracts, requested);","  const target = (requested && Object.prototype.hasOwnProperty.call(contracts, requested)) ? requested : Object.keys(contracts)[0];",'contract-resolution.mjs'),
 # ---- phase 11.1.1: deploy integrity (library linking, async guards)
 ('resolve: an unlinked library is deployed again','contractforge-deploy/app.js',"    const libs = unresolvedLibraries(c);\n    if (libs.length) throw libraryLinkError(requestedName, libs);\n    return requestedName;","    return requestedName;",'deploy-integrity.mjs'),
 ('async: a changed source no longer aborts the deploy','contractforge-deploy/app.js',"  if(op.sourceHash && pendingSource && pendingSource.code && matHash(pendingSource.code) !== op.sourceHash){","  if(false){",'deploy-integrity.mjs'),
 # ---- phase 11.1.2: concurrency lock, constructor compatibility, network transition
 ('lock: two deploys can overlap again','contractforge-deploy/app.js',"  if(deployInFlight){ logConsole('warn','A deployment is already in progress.'); return; }","  if(false){",'deploy-concurrency.mjs'),
 ('ctor: a value survives a type change again','contractforge-deploy/multichain.js',"    const match = prevAt && (prevAt.param || '') === name && canon(prevAt.type) === canon(inp.type);","    const match = prevAt && (prevAt.param || '') === name;",'deploy-concurrency.mjs'),
 ('net: a wrong chain no longer blocks signing','contractforge-deploy/multideploy.js',"  if(got !== want) throw new Error('The wallet is on '+(got === null ? 'an unknown chain' : 'chainId '+got)+' but '+NETWORKS[key].label+' needs chainId '+want+'.');","  // no chain check",'deploy-concurrency.mjs'),
 # ---- phase 11.1.3: gas integrity, bridge re-signing, fatal batch abort
 ('bridge: the second signature skips its identity check','contractforge-deploy/multideploy.js',"        await mdAssertReady(key, op);   // every independent signature re-validates wallet + chain identity","        // bridge identity check removed",'deploy-batch.mjs'),
 ('batch: an identity violation continues to the next network','contractforge-deploy/multideploy.js',"        if(e && e.fatal) throw e;   // identity violation: abort the whole batch, preserving already-confirmed results","        if(false){",'deploy-batch.mjs'),
 ('gas: a non-Arc chain presents USDC as its native gas','contractforge-deploy/app.js',"          : fmt+' USDC  /  '+nativeFmt+' '+net.gasSymbol;","          : fmt+' USDC  /  '+nativeFmt+' USDC';",'deploy-batch.mjs'),
 # ---- phase 11.1.4: authoritative wallet identity, truthful batch status
 ('identity: the authorized account is no longer verified','contractforge-deploy/app.js',"  if((op.account || '').toLowerCase() !== current.accounts[0]){","  if(false){",'deploy-final.mjs'),
 ('status: an aborted batch is reported as success','contractforge-deploy/multideploy.js',"  if(aborted) return 'aborted';","  if(false) return 'aborted';",'deploy-final.mjs'),
 # ---- phase 11.2: vault decimal integrity
 ('vault: the deposit cap reverts to hardcoded six decimals','contractforge-deploy/app.js',"  const capExpr = capS.isZero ? '0' : (capS.digits + ' * 10**uint256(asset.decimals())' + (capS.scale ? ' / 10**' + capS.scale : ''));","  const capExpr = capS.isZero ? '0' : (capS.digits + ' * 10**6' + (capS.scale ? ' / 10**' + capS.scale : ''));",'vault-decimals.mjs'),
 ('vault: the deposit cap ignores the assets already held','contractforge-deploy/app.js',"        if (depositCap > 0) require(assetsBefore + assets <= depositCap, \"exceeds deposit cap\");","        if (depositCap > 0) require(assets <= depositCap, \"exceeds deposit cap\");",'vault-decimals.mjs'),
]
if '--self-test' in sys.argv:
    # a harmless edit (a comment) that no test should notice: the run has to report it and exit 1
    M=[('self-test: a comment edit nobody tests','contractforge-deploy/maturity.js',"   Maturity of every generator, and the mainnet gate.","   Maturity of every generator, and the mainnet gate (edited by the self-test).",'maturity.mjs')]
if '--only' in sys.argv:
    key = sys.argv[sys.argv.index('--only') + 1]          # e.g. --only forge   or   --only 'nft:'
    M = [m for m in M if key in m[0] or key == m[4]]
bad=0
for name,f,old,new,test in M:
    if test == 'slither-pin.mjs' and not shutil.which('slither'):
        print('SKIP (slither not installed): '+name); continue
    path=REPO+'/'+f
    s=open(path,encoding='utf-8').read()
    if s.count(old)<1:
        print('SKIP (pattern count %d): %s'%(s.count(old),name)); bad+=1; continue
    open(path,'w',encoding='utf-8').write(s.replace(old,new))
    try:
        cmd = ['npm','run','test:portable'] if test == 'forge' else ['node',test]    # 'forge' regenerates every source and runs the Foundry suite
        r=subprocess.run(cmd,cwd=REPO+'/tests',capture_output=True,text=True,timeout=250)
        out = (r.stdout or '') + (r.stderr or '')
        failed = r.returncode!=0 and (test != 'forge' or '[FAIL' in out)    # for Foundry a compile error does not count: a test has to fail
        print(('CAUGHT   ' if failed else 'NOT CAUGHT ')+name+'  ['+test+']')
        if not failed: bad+=1
    except subprocess.TimeoutExpired:
        print('CAUGHT (timeout) '+name)
    finally:
        subprocess.run(['git','checkout','--',f],cwd=REPO)
# the Foundry mutations leave mutated generated sources behind (tests/solidity/src is not versioned): regenerate them
subprocess.run(['npm','run','dump'],cwd=REPO+'/tests',capture_output=True)
print('uncaught mutations:',bad)
sys.exit(1 if bad else 0)

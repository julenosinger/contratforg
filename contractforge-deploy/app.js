/* ======================================================================
   CONTRACTFORGE — engine
   ====================================================================== */

const NETWORKS = {

  /* ── MAINNETS ─────────────────────────────────────────────── */
  ethereum: {
    label:'Ethereum', chainIdHex:'0x1', chainIdDec:1, isMainnet:true,
    rpc:'https://eth.llamarpc.com', explorer:'https://etherscan.io',
    gasSymbol:'ETH', gasDecimals:18, walletDailyDefault:'0.1',
    usdc:'0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    eurc:'0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c',
    usdcDecimals:6,
    cctp:{ tokenMessenger:'0xBd3fa81B58Ba92a82136038B25aDec7066af3155', messageTransmitter:'0x0a992d191DEeC32aFe36203Ad87D7d289a738F81' },
    explorerApi:'https://api.etherscan.io/api',
  },
  polygon: {
    label:'Polygon', chainIdHex:'0x89', chainIdDec:137, isMainnet:true,
    rpc:'https://polygon.llamarpc.com', explorer:'https://polygonscan.com',
    gasSymbol:'POL', gasDecimals:18, walletDailyDefault:'100',
    usdc:'0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
    eurc:'',
    usdcDecimals:6,
    cctp:{ tokenMessenger:'0x9daF8c91AEFAE50b9c0E69629D3F6Ca40cA3B3FE', messageTransmitter:'0xF3be9355363857F3e001be68856A2f96b4C39Ba9' },
    explorerApi:'https://api.polygonscan.com/api',
  },
  base: {
    label:'Base', chainIdHex:'0x2105', chainIdDec:8453, isMainnet:true,
    rpc:'https://mainnet.base.org', explorer:'https://basescan.org',
    gasSymbol:'ETH', gasDecimals:18, walletDailyDefault:'0.1',
    usdc:'0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    eurc:'0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42',
    usdcDecimals:6,
    cctp:{ tokenMessenger:'0x1682Ae6375C4E4A97e4B583BC394c861A46D8962', messageTransmitter:'0xAD09780d193884d503182aD4588450C416D6F9D4' },
    explorerApi:'https://api.basescan.org/api',
  },
  arbitrum: {
    label:'Arbitrum One', chainIdHex:'0xa4b1', chainIdDec:42161, isMainnet:true,
    rpc:'https://arb1.arbitrum.io/rpc', explorer:'https://arbiscan.io',
    gasSymbol:'ETH', gasDecimals:18, walletDailyDefault:'0.1',
    usdc:'0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    eurc:'',
    usdcDecimals:6,
    cctp:{ tokenMessenger:'0x19330d10D9Cc8751218eaf51E8885D058642E08A', messageTransmitter:'0xC30362313FBBA5cf9163F0bb16a0e01f01A896ca' },
    explorerApi:'https://api.arbiscan.io/api',
  },
  optimism: {
    label:'Optimism', chainIdHex:'0xa', chainIdDec:10, isMainnet:true,
    rpc:'https://mainnet.optimism.io', explorer:'https://optimistic.etherscan.io',
    gasSymbol:'ETH', gasDecimals:18, walletDailyDefault:'0.1',
    usdc:'0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
    eurc:'',
    usdcDecimals:6,
    cctp:{ tokenMessenger:'0x2B4069517957735bE00ceE0fadAE88a26365528f', messageTransmitter:'0x4D41f22c5a0e5c74090899E5a8Fb597a8842b3e8' },
    explorerApi:'https://api-optimistic.etherscan.io/api',
  },
  avalanche: {
    label:'Avalanche C-Chain', chainIdHex:'0xa86a', chainIdDec:43114, isMainnet:true,
    rpc:'https://api.avax.network/ext/bc/C/rpc', explorer:'https://snowtrace.io',
    gasSymbol:'AVAX', gasDecimals:18, walletDailyDefault:'2',
    usdc:'0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
    eurc:'',
    usdcDecimals:6,
    cctp:{ tokenMessenger:'0x6B25532e1060CE10cc3B0A99e5683b91BFDe6982', messageTransmitter:'0x8186359aF5F57FbB40c6b14A588d2A59C0C29880' },
    explorerApi:'https://api.snowtrace.io/api',
  },
  bnb: {
    label:'BNB Chain', chainIdHex:'0x38', chainIdDec:56, isMainnet:true,
    rpc:'https://bsc-dataseed.binance.org', explorer:'https://bscscan.com',
    gasSymbol:'BNB', gasDecimals:18, walletDailyDefault:'0.1',
    usdc:'0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    eurc:'',
    usdcDecimals:18,
    cctp:{ tokenMessenger:'', messageTransmitter:'' },
    explorerApi:'https://api.bscscan.com/api',
  },
  robinhoodMain: {
    label:'Robinhood Chain', chainIdHex:'0xB61F', chainIdDec:46623, isMainnet:true,
    rpc:'https://rpc.chain.robinhood.com', explorer:'https://explorer.chain.robinhood.com',
    gasSymbol:'ETH', gasDecimals:18, walletDailyDefault:'0.1',
    usdc:'', eurc:'', usdcDecimals:6,
    cctp:{ tokenMessenger:'', messageTransmitter:'' },
    explorerApi:'',
  },
  arcMain: {
    label:'Arc Mainnet', chainIdHex:'0x13b2', chainIdDec:5042, isMainnet:true,
    rpc:'https://rpc.mainnet.arc.io', explorer:'https://explorer.arc.io',
    gasSymbol:'USDC', gasDecimals:18, walletDailyDefault:'100',
    usdc:'0x3600000000000000000000000000000000000000',
    eurc:'0xbEf5f6d51CB62b58e6A8f77868681825C6fe21c1',
    usdcDecimals:6,
    cctp:{ tokenMessenger:'', messageTransmitter:'' },
    explorerApi:'',
  },

  /* ── TESTNETS ─────────────────────────────────────────────── */
  arc: {
    label:'Arc Testnet', chainIdHex:'0x4cef52', chainIdDec:5042002, isMainnet:false,
    rpc:'https://rpc.testnet.arc.io', explorer:'https://explorer.testnet.arc.io',
    gasSymbol:'USDC', gasDecimals:18, walletDailyDefault:'100',
    usdc:'0x3600000000000000000000000000000000000000',
    eurc:'0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a',
    usdcDecimals:6,
    cctp:{ tokenMessenger:'', messageTransmitter:'' },
    explorerApi:'',
  },
  robinhood: {
    label:'Robinhood Testnet', chainIdHex:'0xB626', chainIdDec:46630, isMainnet:false,
    rpc:'https://rpc.testnet.chain.robinhood.com', explorer:'https://explorer.testnet.chain.robinhood.com',
    gasSymbol:'ETH', gasDecimals:18, walletDailyDefault:'0.1',
    usdc:'', eurc:'', usdcDecimals:6,
    cctp:{ tokenMessenger:'', messageTransmitter:'' },
    explorerApi:'',
  },
  sepolia: {
    label:'Ethereum Sepolia', chainIdHex:'0xaa36a7', chainIdDec:11155111, isMainnet:false,
    rpc:'https://rpc.sepolia.org', explorer:'https://sepolia.etherscan.io',
    gasSymbol:'ETH', gasDecimals:18, walletDailyDefault:'0.1',
    usdc:'0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    eurc:'0x08210F9170F89Ab7658F0B5E3fF39b0E03C594D4',
    usdcDecimals:6,
    cctp:{ tokenMessenger:'0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5', messageTransmitter:'0x7865fAfC2db2093669d92c0F33AeEF291086BEFD' },
    explorerApi:'https://api-sepolia.etherscan.io/api',
  },
  amoy: {
    label:'Polygon Amoy', chainIdHex:'0x13882', chainIdDec:80002, isMainnet:false,
    rpc:'https://rpc-amoy.polygon.technology', explorer:'https://amoy.polygonscan.com',
    gasSymbol:'POL', gasDecimals:18, walletDailyDefault:'100',
    usdc:'0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582', eurc:'',
    usdcDecimals:6,
    cctp:{ tokenMessenger:'0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5', messageTransmitter:'0x7865fAfC2db2093669d92c0F33AeEF291086BEFD' },
    explorerApi:'https://api-amoy.polygonscan.com/api',
  },
  basesep: {
    label:'Base Sepolia', chainIdHex:'0x14a34', chainIdDec:84532, isMainnet:false,
    rpc:'https://sepolia.base.org', explorer:'https://sepolia.basescan.org',
    gasSymbol:'ETH', gasDecimals:18, walletDailyDefault:'0.1',
    usdc:'0x036CbD53842c5426634e7929541eC2318f3dCF7e', eurc:'',
    usdcDecimals:6,
    cctp:{ tokenMessenger:'0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5', messageTransmitter:'0x7865fAfC2db2093669d92c0F33AeEF291086BEFD' },
    explorerApi:'https://api-sepolia.basescan.org/api',
  },
  arbsep: {
    label:'Arbitrum Sepolia', chainIdHex:'0x66eee', chainIdDec:421614, isMainnet:false,
    rpc:'https://sepolia-rollup.arbitrum.io/rpc', explorer:'https://sepolia.arbiscan.io',
    gasSymbol:'ETH', gasDecimals:18, walletDailyDefault:'0.1',
    usdc:'0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d', eurc:'',
    usdcDecimals:6,
    cctp:{ tokenMessenger:'0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5', messageTransmitter:'0x7865fAfC2db2093669d92c0F33AeEF291086BEFD' },
    explorerApi:'https://api-sepolia.arbiscan.io/api',
  },
  opsep: {
    label:'Optimism Sepolia', chainIdHex:'0xaa37dc', chainIdDec:11155420, isMainnet:false,
    rpc:'https://sepolia.optimism.io', explorer:'https://sepolia-optimism.etherscan.io',
    gasSymbol:'ETH', gasDecimals:18, walletDailyDefault:'0.1',
    usdc:'0x5fd84259d66Cd46123540766Be93DFE6D43130D7', eurc:'',
    usdcDecimals:6,
    cctp:{ tokenMessenger:'0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5', messageTransmitter:'0x7865fAfC2db2093669d92c0F33AeEF291086BEFD' },
    explorerApi:'https://api-sepolia-optimistic.etherscan.io/api',
  },
};

let activeNetwork = 'arcMain';
let provider=null, signer=null, account=null;
let pendingSource = { name:'', code:'' };

let netFilter = 'mainnet'; // 'testnet' | 'mainnet' | 'all'

/* ---------------- Network bar ---------------- */
function renderNetBar(){
  const bar = document.getElementById('netbar');
  if(!bar) return;
  bar.innerHTML = '';

  // Tab row
  const tabs = document.createElement('div');
  tabs.style.cssText = 'display:flex;gap:8px;margin-bottom:12px;width:100%;';
  ['testnet','mainnet','all'].forEach(f=>{
    const t = document.createElement('button');
    t.textContent = f==='all'?'All':f==='mainnet'?'Mainnets':'Testnets';
    t.style.cssText = `font-family:var(--mono);font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;
      padding:7px 14px;border-radius:var(--radius);cursor:pointer;border:1px solid;transition:.15s;
      ${f===netFilter
        ? 'background:var(--vault);border-color:var(--vault-2);color:var(--paper);'
        : 'background:transparent;border-color:#2A3A34;color:#7E8C86;'}`;
    t.onclick = (ev)=>{ ev.stopPropagation(); netFilter=f; renderNetBar(); };
    tabs.appendChild(t);
  });
  bar.appendChild(tabs);

  // Mainnet warning strip
  if(netFilter==='mainnet'||netFilter==='all'){
    const warn = document.createElement('div');
    warn.id = 'mainnetWarn';
    warn.style.cssText = 'display:flex;align-items:flex-start;gap:10px;background:#1A0D0D;border:1px solid #5C2020;border-radius:var(--radius);padding:12px 14px;margin-bottom:12px;';
    warn.innerHTML = `
      <span style="font-size:18px;flex-shrink:0;">⚠</span>
      <div>
        <div style="font-family:var(--mono);font-size:11.5px;font-weight:600;color:#E08A6B;margin-bottom:4px;">MAINNET — Real funds at risk</div>
        <div style="font-family:var(--mono);font-size:10.5px;color:#A06050;line-height:1.6;">
          Contracts deployed here use real ETH/USDC/POL. Audit your code thoroughly before deploying.
          ContractForge generates Solidity as-is — you are solely responsible for contract security.
          Always test on a testnet first.
        </div>
      </div>`;
    bar.appendChild(warn);
  }

  // Network buttons grouped
  const visible = Object.entries(NETWORKS).filter(([,n])=>{
    if(netFilter==='mainnet') return n.isMainnet;
    if(netFilter==='testnet') return !n.isMainnet;
    return true;
  });

  const grid = document.createElement('div');
  grid.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;';
  visible.forEach(([key,net])=>{
    const b = document.createElement('div');
    b.className = 'netbtn' + (key===activeNetwork?' active':'');
    if(net.isMainnet) b.style.cssText += ';border-color:#3A2A0A;';
    b.innerHTML = `<span class="chip" style="${net.isMainnet?'background:#C9A24B;':''}"></span>${net.label}
      ${net.isMainnet?'<span style="font-family:var(--mono);font-size:8px;letter-spacing:.1em;color:#C9A24B;margin-left:4px;">LIVE</span>':''}`;
    b.onclick = async (ev)=>{
      ev.stopPropagation();
      if(key === activeNetwork){ toggleNetPanel(false); return; }   // already active: close, no redundant confirmation
      if(net.isMainnet && !(await confirmMainnet(net.label))) return;   // cancelled: keep the panel open and the network unchanged
      activeNetwork = key;
      renderNetBar();
      updateSideNet();
      if(account) switchWalletNetwork();
      toggleNetPanel(false);   // a completed selection closes the panel exactly once
    };
    grid.appendChild(b);
  });
  bar.appendChild(grid);
}

/* Resolves true when the user agrees to switch to a mainnet (in-app dialog; falls back to confirm()).
   Passes the source network so the dialog can name where the user is staying. */
function confirmMainnet(label){
  if(typeof uiConfirmSwitch === 'function'){
    const key = Object.keys(NETWORKS).find(k=>NETWORKS[k].label===label);
    const src = NETWORKS[activeNetwork];
    return uiConfirmSwitch(label, (key && NETWORKS[key].gasSymbol) || 'ETH', src ? src.label : 'testnet');
  }
  return Promise.resolve(confirm(`⚠ Switch to ${label} (MAINNET)?\n\nThis network uses real funds. Any contract you deploy will consume real ${NETWORKS[Object.keys(NETWORKS).find(k=>NETWORKS[k].label===label)]?.gasSymbol||'ETH'}.\n\nProceed?`));
}

function updateSideNet(){
  const net = NETWORKS[activeNetwork];
  if(!net) return;
  document.getElementById('sidenet').textContent  = net.label;
  document.getElementById('sidechain').textContent = net.chainIdDec;
  document.getElementById('sidegas').textContent   = net.gasSymbol;

  // Show/hide mainnet badge on sidebar
  let badge = document.getElementById('sideMainnetBadge');
  if(!badge){
    badge = document.createElement('div');
    badge.id = 'sideMainnetBadge';
    badge.style.cssText = 'font-family:var(--mono);font-size:9px;letter-spacing:.15em;text-transform:uppercase;padding:3px 8px;border-radius:2px;margin-top:6px;display:none;';
    document.querySelector('.net-pill')?.appendChild(badge);
  }
  if(net.isMainnet){
    badge.style.display = 'block';
    badge.style.cssText += ';background:#2A1408;color:#C9A24B;border:1px solid #3A2A0A;';
    badge.textContent   = '⚠ MAINNET — real funds';
  } else {
    badge.style.display = 'none';
  }

  // Mainnet deploy banner
  const banner = document.getElementById('mainnetDeployBanner');
  if(banner){
    banner.style.display = net.isMainnet ? 'block' : 'none';
    const bannerNet = document.getElementById('mainnetBannerNet');
    const bannerGas = document.getElementById('mainnetBannerGas');
    if(bannerNet) bannerNet.textContent = net.label;
    if(bannerGas) bannerGas.textContent = net.gasSymbol;
  }

  if(typeof renderNetBanner === 'function') renderNetBanner();
  if(typeof renderCtorArgs === 'function') renderCtorArgs();
  if(typeof renderMultiDeployPanel === 'function') renderMultiDeployPanel();

  // Body mainnet mode class
  document.body.classList.toggle('mainnet-mode', !!net.isMainnet);
  const headMeta = document.querySelector('.head-meta');
  if(headMeta && net.isMainnet){
    headMeta.style.color = '#C9A24B';
  } else if(headMeta){
    headMeta.style.color = '';
  }
}

/* ─── Mainnet deploy confirmation ─────────────────────────────── */
/* Resolves true when the deployment may go ahead. Testnets need no extra step;
   on a mainnet the user reviews a summary and types the network name (falls back to confirm() without the UI). */
function mainnetDeployConfirm(details){
  const net = NETWORKS[activeNetwork];
  if(!net.isMainnet) return Promise.resolve(true);
  if(typeof uiConfirmMainnet === 'function') return uiConfirmMainnet(net, details || {});
  return Promise.resolve(confirm(`⚠ MAINNET DEPLOY on ${net.label}\n\nYou are about to deploy a smart contract using REAL ${net.gasSymbol}.\nThis action cannot be undone.\n\nHave you:\n✓ Audited the contract source?\n✓ Tested on a testnet?\n✓ Reviewed all constructor parameters?\n\nProceed with deployment?`));
}

/* ---------------- URL routing (Phase 11.5) ---------------- */
/* The single source of truth mapping URL paths to section ids. Every navigable section has a stable URL. */
const ROUTES = {
  '/': 'home',
  '/token-builder': 'simple',
  '/swap': 'swap',
  '/treasury': 'treasury',
  '/vault': 'vault',
  '/multisend': 'multisend',
  '/crosschain': 'crosschain',
  '/compile-deploy': 'deploy',
  '/ai-auditor': 'auditor',
  '/abi-playground': 'playground',
  '/test-lab': 'lab',
  '/deploy-history': 'history',
  '/gas-estimator': 'gas',
  '/verify': 'verify',
  '/share': 'share',
  '/contract-wizard': 'wizard',
  '/ai-solidity': 'nlai',
  '/analytics': 'analytics',
  '/test-generator': 'tests',
};
const SECTION_PATHS = Object.fromEntries(Object.entries(ROUTES).map(([p, s]) => [s, p]));
const SECTION_TITLES = {
  home: 'Home', simple: 'Token / Escrow / NFT', swap: 'Swap / AMM', treasury: 'Treasury',
  vault: 'Vault (ERC-4626)', multisend: 'MultiSend', crosschain: 'Crosschain (CCTP)', deploy: 'Compile & Deploy',
  auditor: 'AI Auditor', playground: 'ABI Playground', lab: 'Test Lab', history: 'Deploy History',
  gas: 'Gas Estimator', verify: 'Verify on Explorer', share: 'Share / Export', wizard: 'Contract Wizard',
  nlai: 'AI → Solidity', analytics: 'Analytics', tests: 'Test Generator',
};

/* Show exactly one section, mark its sidebar item active, and set the document title. Pure presentation; the AI
   workspace observer and the current-contract toolbar react to the section's own display, as before. */
function showSection(section){
  const target = document.getElementById('sec-' + section);
  if(!target) return false;
  document.querySelectorAll('main section.section').forEach(s => s.style.display = 'none');
  target.style.display = 'block';
  document.querySelectorAll('.nav-item').forEach(i => i.classList.toggle('active', i.dataset.section === section));
  if(typeof uiSyncCurrent === 'function') uiSyncCurrent();
  const title = SECTION_TITLES[section];
  document.title = (section !== 'home' && title) ? title + ' | ContractForge' : 'ContractForge — On-Chain Contract Foundry';
  return true;
}

/* Navigate to a section and reflect it in the URL via the History API. Reaching the same route does not push a
   redundant history entry. */
function navigateTo(section, opts){
  if(!showSection(section)) return;
  const path = SECTION_PATHS[section] || '/';
  const url = path + (window.location.hash || '');
  if(path === window.location.pathname){
    if(opts && opts.replace) history.replaceState(null, '', url);
    return;   // same route: no new history entry
  }
  if(opts && opts.replace) history.replaceState(null, '', url);
  else history.pushState(null, '', url);
}

/* Render the section for the current pathname; an unknown path falls back to Home (a controlled Not Found). */
function routeFromPath(){
  const path = window.location.pathname;
  showSection(ROUTES[path] || 'home');
}

/* Attach popstate (Back/Forward) and restore the section for the current URL on load. */
function initRouter(){
  window.addEventListener('popstate', routeFromPath);
  routeFromPath();
}

/* Sidebar navigation goes through the router. */
document.querySelectorAll('.nav-item').forEach(item=>{
  item.addEventListener('click',()=>{ navigateTo(item.dataset.section); });
});

/* ======================================================================
   WALLET — EVM connection (MetaMask / any injected provider)
   ====================================================================== */
async function connectWallet(){
  if(!window.ethereum){
    logConsole('err','No EVM wallet detected. Please install MetaMask or a compatible extension.');
    return;
  }
  try{
    provider = new ethers.providers.Web3Provider(window.ethereum, 'any');
    await provider.send('eth_requestAccounts', []);
    signer   = provider.getSigner();
    account  = await signer.getAddress();
    setWalletConnected(account);
    await switchWalletNetwork();
    await refreshBalance();
    registerWalletEvents();
    logConsole('ok','Wallet connected: '+account);
  }catch(e){
    logConsole('err','Connection failed: '+(e.message||e));
  }
}

function setWalletConnected(addr){
  const status = document.getElementById('walletStatus');
  const net    = NETWORKS[activeNetwork];
  const isMain = net?.isMainnet;
  status.classList.add('connected');
  status.innerHTML = `<span class="dot"></span> ${escapeHtml(addr.slice(0,6))}…${escapeHtml(addr.slice(-4))}
    <span style="color:${isMain?'#C9A24B':'#5C6B65'};font-size:10px;margin-left:6px;">
      ${isMain?'⚠ '+net.label+' MAINNET':net?.label||''}
    </span>`;
  document.getElementById('connectBtn').textContent = 'Connected';
  if(typeof pgRebindWallet === 'function'){ pgRebindWallet(); pgRenderContext(); }
}

function registerWalletEvents(){
  if(!window.ethereum || window.__evmListenersRegistered) return;
  window.__evmListenersRegistered = true;

  /* Account changed (user switches account in wallet) */
  window.ethereum.on('accountsChanged', async(accounts)=>{
    if(!accounts.length){
      // Disconnected
      account = null; signer = null; provider = null;
      const status = document.getElementById('walletStatus');
      status.classList.remove('connected');
      status.innerHTML = '<span class="dot"></span> Wallet disconnected';
      document.getElementById('connectBtn').textContent = 'Connect Wallet';
      document.getElementById('balanceBadge').textContent = '— '+NETWORKS[activeNetwork].gasSymbol;
      logConsole('warn','Wallet disconnected.');
      return;
    }
    provider = new ethers.providers.Web3Provider(window.ethereum, 'any');
    signer   = provider.getSigner();
    account  = accounts[0];
    setWalletConnected(account);
    await refreshBalance();
    logConsole('ok','Account changed: '+account);
  });

  /* Chain changed (user switches network in wallet) */
  window.ethereum.on('chainChanged', async(chainIdHex)=>{
    const chainId = parseInt(chainIdHex, 16);
    const match   = Object.keys(NETWORKS).find(k=> NETWORKS[k].chainIdDec === chainId);
    if(match){
      activeNetwork = match;
      renderNetBar();
      updateSideNet();
    }
    provider = new ethers.providers.Web3Provider(window.ethereum, 'any');
    signer   = provider.getSigner();
    if(account) setWalletConnected(account);
    await refreshBalance();
    const netLabel = match ? NETWORKS[match].label : 'chainId '+chainId;
    const isMain   = match ? NETWORKS[match].isMainnet : false;
    logConsole(isMain?'warn':'ok','Network changed → '+netLabel+(isMain?' (MAINNET — real funds)':''));
    if(isMain){
      // Flash a warning in the deploy console
      logConsole('warn','⚠ You are now on '+netLabel+'. Any deployment will use REAL funds.');
    }
  });
}

async function switchWalletNetwork(){
  if(!window.ethereum || !account) return;
  const net = NETWORKS[activeNetwork];
  try{
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: net.chainIdHex }]
    });
  }catch(switchErr){
    if(switchErr.code === 4902 || switchErr.code === -32603){
      // Chain not yet added to the wallet — add it automatically
      try{
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params:[{
            chainId:             net.chainIdHex,
            chainName:           net.label,
            nativeCurrency:      { name: net.gasSymbol, symbol: net.gasSymbol, decimals: 18 },
            rpcUrls:             [net.rpc],
            blockExplorerUrls:   net.explorer ? [net.explorer] : []
          }]
        });
        logConsole('ok','Network added to wallet: '+net.label);
      }catch(addErr){
        logConsole('err','Could not add network: '+(addErr.message||addErr));
      }
    } else if(switchErr.code === 4001){
      logConsole('warn','Network switch rejected by user.');
    } else {
      logConsole('warn','Network switch: '+(switchErr.message||switchErr));
    }
  }
  // Re-create provider after potential chain change
  provider = new ethers.providers.Web3Provider(window.ethereum, 'any');
  signer   = provider.getSigner();
  await refreshBalance();
}

const ERC20_BALANCE_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

async function refreshBalance(){
  if(!provider || !account) return;
  const net = NETWORKS[activeNetwork];
  try{
    // Native gas-token balance, formatted with this network's own gas decimals (never a fixed 18).
    const nativeBal = await provider.getBalance(account);
    const nativeFmt = parseFloat(ethers.utils.formatUnits(nativeBal, net.gasDecimals || 18)).toFixed(4);

    // Additionally show the ERC-20 USDC balance when its address is known.
    if(net.usdc && net.usdc !== ''){
      try{
        const usdc = new ethers.Contract(net.usdc, ERC20_BALANCE_ABI, provider);
        const dec  = await usdc.decimals();
        const bal  = await usdc.balanceOf(account);
        const fmt  = parseFloat(ethers.utils.formatUnits(bal, dec)).toFixed(2);
        // On Arc the native gas token is USDC, but it is a distinct pool from the ERC-20 USDC (different decimals):
        // show both, never substitute the ERC-20 balance for the native gas balance.
        document.getElementById('balanceBadge').textContent = net.gasSymbol==='USDC'
          ? nativeFmt+' '+net.gasSymbol+' (gas)  /  '+fmt+' USDC (ERC-20)'
          : fmt+' USDC  /  '+nativeFmt+' '+net.gasSymbol;
      }catch(_){
        document.getElementById('balanceBadge').textContent = nativeFmt+' '+net.gasSymbol;
      }
    } else {
      document.getElementById('balanceBadge').textContent = nativeFmt+' '+net.gasSymbol;
    }
  }catch(e){ /* silent on error */ }
}

/* ======================================================================
   CONSOLE LOG
   ====================================================================== */
/* type: ok | err | warn (needs attention) | step (progress). link: optional { href, text } shown after the message. */
function logConsole(type, msg, link){
  const c = document.getElementById('deployConsole');
  const line = document.createElement('div');
  line.className = 'line '+type;
  const time = new Date().toLocaleTimeString('en-US', {hour12:false});
  line.innerHTML = `<span class="t">[${time}]</span><span class="msg">${escapeHtml(msg)}</span>`;
  if(link && /^https:\/\//.test(link.href)){
    const a = document.createElement('a');
    a.href = link.href; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.className = 'log-link';
    a.textContent = link.text || link.href;
    line.querySelector('.msg').append(' ', a);
  }
  c.appendChild(line);
  c.scrollTop = c.scrollHeight;
}

/* ---------------- Helper: token addr resolution ---------------- */
function resolveToken(addrField, fallbackKey){
  const v = addrField.trim();
  if(v) return v;
  const net = NETWORKS[activeNetwork];
  return net[fallbackKey] || '0x0000000000000000000000000000000000000000';
}

/* ======================================================================
   SECTION 01 — SIMPLE CONTRACTS
   ====================================================================== */
const SIMPLE_TEMPLATES = [
  { id:'erc20',      name:'ERC-20 Token',           desc:'Standard fungible token with owner-controlled mint, optional cap, and burn.', tags:['ERC-20','Mint','Burn']},
  { id:'erc721',     name:'NFT Collection (ERC-721)',desc:'NFT collection with public/private mint, EIP-2981 royalties, and configurable baseURI.', tags:['ERC-721','Royalties']},
  { id:'escrow',     name:'Buyer/Seller Escrow',     desc:'Simple escrow with buyer-initiated release, arbiter dispute resolution, and refund timeout.', tags:['Escrow','Arbitration']},
  { id:'vesting',    name:'Linear Vesting',          desc:'Linear release of tokens to a beneficiary with configurable cliff.', tags:['Vesting','Cliff']},
  { id:'paywall',    name:'Paywall / Subscription',  desc:'Recurring stablecoin subscription with manual renewal and access period.', tags:['Subscription','USDC']},
  { id:'dao',        name:'DAO Governance',          desc:'Propose → vote → timelock execution. Token-weighted voting with quorum and delay.', tags:['DAO','Governance','Timelock'], isNew:true},
  { id:'smartwallet',name:'Smart Wallet (guardian recovery)', desc:'Wallet with guardian recovery, limited session keys and a daily spend limit for those keys.', tags:['Recovery','Session keys','Limits'], isNew:true},
  { id:'staking',    name:'Staking Rewards',         desc:'Stake ERC-20, earn rewards over time. Configurable APY, lock period, and emergency exit.', tags:['Staking','Rewards','DeFi'], isNew:true},
];

function renderSimpleGrid(){
  const grid=document.getElementById('simpleGrid');
  grid.innerHTML='';
  SIMPLE_TEMPLATES.forEach((t,i)=>{
    const card=document.createElement('div');
    card.className='tcard';
    card.dataset.id=t.id;
    card.innerHTML=`
      <div class="corner"></div>
      ${t.isNew?'<div class="new-badge">NEW</div>':''}
      <div class="idx">${String(i+1).padStart(2,'0')} / simple contract</div>
      <h3>${t.name}</h3>
      <p>${t.desc}</p>
      <div class="tagrow">${t.tags.map(tag=>`<span class="tag">${tag}</span>`).join('')}</div>
    `;
    card.onclick=()=>{
      document.querySelectorAll('#simpleGrid .tcard').forEach(c=>c.classList.remove('selected'));
      card.classList.add('selected');
      renderSimpleForm(t.id);
    };
    grid.appendChild(card);
  });
}

function renderSimpleForm(id){
  const panel=document.getElementById('simpleForm');
  const net = NETWORKS[activeNetwork];
  let html='';
  if(id==='erc20'){
    html=`
      <div class="field-grid">
        <div class="field"><label>Token name</label><input id="s_name" value="ArcDollar"/></div>
        <div class="field"><label>Symbol</label><input id="s_symbol" value="ARCD"/></div>
        <div class="field"><label>Decimals</label><input id="s_decimals" type="number" value="18"/></div>
        <div class="field"><label>Initial supply</label><input id="s_supply" type="number" value="1000000"/></div>
        <div class="field"><label>Max cap (0 = no limit)</label><input id="s_cap" type="number" value="0"/></div>
        <div class="field"><label>Allow burn</label>
          <select id="s_burn"><option value="yes">Yes</option><option value="no">No</option></select>
        </div>
      </div>
      <div class="btnrow">
        <button class="btn btn-primary" data-onclick="genSimple('erc20')">Generate contract</button>
        <button class="btn btn-ghost" data-onclick="deployFromBuffer('simple')">Deploy now</button>
      </div>`;
  } else if(id==='erc721'){
    html=`
      <div class="field-grid">
        <div class="field"><label>Collection name</label><input id="s_name" value="ArcOriginals"/></div>
        <div class="field"><label>Symbol</label><input id="s_symbol" value="ARCO"/></div>
        <div class="field"><label>Max supply</label><input id="s_supply" type="number" value="10000"/></div>
        <div class="field"><label>Mint price (USDC, 6 logical decimals)</label><input id="s_price" type="number" value="10"/></div>
        <div class="field"><label>Royalty (bps)</label><input id="s_royalty" type="number" value="500"/></div>
        <div class="field full"><label>Base URI</label><input id="s_baseuri" value="https://metadata.example.com/token/"/></div>
      </div>
      <div class="btnrow">
        <button class="btn btn-primary" data-onclick="genSimple('erc721')">Generate contract</button>
        <button class="btn btn-ghost" data-onclick="deployFromBuffer('simple')">Deploy now</button>
      </div>`;
  } else if(id==='escrow'){
    html=`
      <div class="field-grid">
        <div class="field"><label>Contract name</label><input id="s_name" value="ArcEscrow"/></div>
        <div class="field"><label>Buyer</label><input id="s_buyer" placeholder="0x..."/></div>
        <div class="field"><label>Seller</label><input id="s_seller" placeholder="0x..."/></div>
        <div class="field"><label>Arbiter</label><input id="s_arbiter" placeholder="0x..."/></div>
        <div class="field"><label>Token (USDC/EURC, empty = network USDC)</label><input id="s_token" placeholder="0x..."/></div>
        <div class="field"><label>Amount (in token units)</label><input id="s_amount" type="number" value="100"/></div>
        <div class="field"><label>Refund timeout (days)</label><input id="s_timeout" type="number" value="14"/></div>
      </div>
      <div class="btnrow">
        <button class="btn btn-primary" data-onclick="genSimple('escrow')">Generate contract</button>
        <button class="btn btn-ghost" data-onclick="deployFromBuffer('simple')">Deploy now</button>
      </div>`;
  } else if(id==='vesting'){
    html=`
      <div class="field-grid">
        <div class="field"><label>Contract name</label><input id="s_name" value="ArcVesting"/></div>
        <div class="field"><label>Token (empty = network USDC)</label><input id="s_token" placeholder="0x..."/></div>
        <div class="field"><label>Beneficiary</label><input id="s_beneficiary" placeholder="0x..."/></div>
        <div class="field"><label>Total amount (in token units)</label><input id="s_amount" type="number" value="120000"/></div>
        <div class="field"><label>Total duration (days)</label><input id="s_duration" type="number" value="365"/></div>
        <div class="field"><label>Cliff (days)</label><input id="s_cliff" type="number" value="90"/></div>
      </div>
      <div class="btnrow">
        <button class="btn btn-primary" data-onclick="genSimple('vesting')">Generate contract</button>
        <button class="btn btn-ghost" data-onclick="deployFromBuffer('simple')">Deploy now</button>
      </div>`;
  } else if(id==='paywall'){
    html=`
      <div class="field-grid">
        <div class="field"><label>Contract name</label><input id="s_name" value="ArcSubscription"/></div>
        <div class="field"><label>Payment token (empty = network USDC)</label><input id="s_token" placeholder="0x..."/></div>
        <div class="field"><label>Price per period (token units)</label><input id="s_amount" type="number" value="9"/></div>
        <div class="field"><label>Period duration (days)</label><input id="s_duration" type="number" value="30"/></div>
        <div class="field"><label>Payment beneficiary</label><input id="s_beneficiary" placeholder="0x..."/></div>
      </div>
      <div class="btnrow">
        <button class="btn btn-primary" data-onclick="genSimple('paywall')">Generate contract</button>
        <button class="btn btn-ghost" data-onclick="deployFromBuffer('simple')">Deploy now</button>
      </div>`;
  } else if(id==='dao'){
    html=`
      <div class="field-grid">
        <div class="field"><label>Contract name</label><input id="s_name" value="ArcDAO"/></div>
        <div class="field"><label>Governance token (address)</label><input id="s_token" placeholder="0x... ERC-20 voting token"/></div>
        <div class="field"><label>Quorum (% of total supply)</label><input id="s_quorum" type="number" value="4"/></div>
        <div class="field"><label>Voting period (blocks)</label><input id="s_voting" type="number" value="45818"/><div class="hint">~7 days at 13s/block</div></div>
        <div class="field"><label>Timelock delay (seconds)</label><input id="s_delay" type="number" value="172800"/><div class="hint">48 hours default</div></div>
        <div class="field"><label>Proposal threshold (tokens)</label><input id="s_threshold" type="number" value="1000"/></div>
      </div>
      <div class="btnrow">
        <button class="btn btn-primary" data-onclick="genSimple('dao')">Generate contract</button>
        <button class="btn btn-ghost" data-onclick="deployFromBuffer('simple')">Deploy now</button>
      </div>`;
  } else if(id==='smartwallet'){
    html=`
      <div class="field-grid">
        <div class="field"><label>Contract name</label><input id="s_name" value="ArcSmartWallet"/></div>
        <div class="field"><label>Guardian (recovery address)</label><input id="s_guardian" placeholder="0x..."/></div>
        <div class="field"><label>Longest session key validity (hours, max 720)</label><input id="s_session" type="number" min="1" max="720" step="1" value="24"/></div>
        <div class="field"><label>Recovery delay (days, 1 to 30)</label><input id="s_rdelay" type="number" min="1" max="30" step="1" value="2"/></div>
        <div class="field"><label>Daily spend limit for session keys (<span id="s_limit_unit">${net.gasSymbol}</span>)</label><input id="s_spendlimit" type="number" min="0" step="any" value="${net.walletDailyDefault}" placeholder="e.g. ${net.walletDailyDefault}"/></div>
      </div>
      <div class="btnrow">
        <button class="btn btn-primary" data-onclick="genSimple('smartwallet')">Generate contract</button>
        <button class="btn btn-ghost" data-onclick="deployFromBuffer('simple')">Deploy now</button>
      </div>`;
  } else if(id==='staking'){
    html=`
      <div class="field-grid">
        <div class="field"><label>Contract name</label><input id="s_name" value="ArcStaking"/></div>
        <div class="field"><label>Staking token (empty = network USDC)</label><input id="s_token" placeholder="0x..."/></div>
        <div class="field"><label>Reward token (empty = same as staking)</label><input id="s_reward" placeholder="0x... or leave empty"/></div>
        <div class="field"><label>APY (% per year)</label><input id="s_apy" type="number" value="12"/></div>
        <div class="field"><label>Lock period (days, 0 = no lock)</label><input id="s_lock" type="number" value="30"/></div>
        <div class="field"><label>Emergency exit fee (bps)</label><input id="s_exitfee" type="number" value="100"/><div class="hint">100 bps = 1% penalty for early exit</div></div>
      </div>
      <div class="btnrow">
        <button class="btn btn-primary" data-onclick="genSimple('staking')">Generate contract</button>
        <button class="btn btn-ghost" data-onclick="deployFromBuffer('simple')">Deploy now</button>
      </div>`;
  }
  panel.innerHTML = html;
}

function genSimple(id){
  const net=NETWORKS[activeNetwork];
  const g=(id)=>document.getElementById(id)?.value ?? '';
  let code='', name='', mcSpecs=[], mcProblems=[];

  if(id==='dao'){
    genSimpleDAO(); return;
  } else if(id==='smartwallet'){
    genSimpleSmartWallet(); return;
  } else if(id==='staking'){
    genSimpleStaking(); return;
  } else if(id==='erc20'){
    name=g('s_name').replace(/[^A-Za-z0-9]/g,'')||'ArcToken';
    const sym=g('s_symbol')||'ARC';
    const dec=g('s_decimals')||'18';
    const supply=g('s_supply')||'0';
    const cap=g('s_cap')||'0';
    const burn=g('s_burn')==='yes';
    code = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ${name} — ERC-20 Token
/// @notice Generated by ContractForge for ${net.label} (chainId ${net.chainIdDec})
contract ${name} {
    string public name = "${g('s_name')||name}";
    string public symbol = "${sym}";
    uint8  public decimals = ${dec};
    uint256 public totalSupply;
    uint256 public immutable cap = ${cap} * 10**${dec};
    address public owner;
    /// @notice The account offered the owner role by transferOwnership(); it has no powers until it calls acceptOwnership().
    address public pendingOwner;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Mint(address indexed to, uint256 amount);
    ${burn?'event Burn(address indexed from, uint256 amount);':''}
    event OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event OwnershipTransferCancelled(address indexed previousOwner, address indexed pendingOwner);

    modifier onlyOwner(){ require(msg.sender == owner, "not owner"); _; }

    constructor() {
        owner = msg.sender;
        uint256 initial = ${supply} * 10**${dec};
        if (initial > 0) {
            require(cap == 0 || initial <= cap, "exceeds cap");
            totalSupply = initial;
            balanceOf[msg.sender] = initial;
            emit Transfer(address(0), msg.sender, initial);
        }
    }

    /// @notice Offer the owner role (mint and burn) to newOwner; it takes effect when newOwner accepts.
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0) && newOwner != owner && newOwner != address(this), "invalid new owner");
        pendingOwner = newOwner;
        emit OwnershipTransferStarted(owner, newOwner);
    }

    /// @notice Take over the owner role after being offered it.
    function acceptOwnership() external {
        require(msg.sender == pendingOwner && msg.sender != address(0), "not pending owner");
        emit OwnershipTransferred(owner, msg.sender);
        owner = msg.sender;
        pendingOwner = address(0);
    }

    /// @notice The current owner cancels a pending transfer.
    function cancelOwnershipTransfer() external onlyOwner {
        emit OwnershipTransferCancelled(owner, pendingOwner);
        pendingOwner = address(0);
    }

    /// @notice Give up the owner role for good: minting stops and the supply is fixed. IRREVERSIBLE.
    function renounceOwnership() external onlyOwner {
        pendingOwner = address(0);
        emit OwnershipTransferred(owner, address(0));
        owner = address(0);
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        require(allowed >= amount, "allowance exceeded");
        if (allowed != type(uint256).max) allowance[from][msg.sender] = allowed - amount;
        _transfer(from, to, amount);
        return true;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "mint to zero address");
        require(cap == 0 || totalSupply + amount <= cap, "exceeds cap");
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
        emit Mint(to, amount);
    }

    ${burn? `function burn(uint256 amount) external {
        require(balanceOf[msg.sender] >= amount, "insufficient balance");
        balanceOf[msg.sender] -= amount;
        totalSupply -= amount;
        emit Transfer(msg.sender, address(0), amount);
        emit Burn(msg.sender, amount);
    }` : ''}

    function _transfer(address from, address to, uint256 amount) internal {
        require(to != address(0), "transfer to zero");
        require(balanceOf[from] >= amount, "insufficient balance");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
    }
}`;
  }

  else if(id==='erc721'){
    name=g('s_name').replace(/[^A-Za-z0-9]/g,'')||'ArcNFT';
    const sym=g('s_symbol')||'ARC';
    const supply=g('s_supply')||'10000';
    const price=g('s_price')||'0';
    const royalty=g('s_royalty')||'0';
    const baseuri=g('s_baseuri')||'';
    const usdc = net.usdc;
    if(!isPortable() && !/^0+(\.0+)?$/.test(String(price).trim()) && !usdc) mcProblems = ['Payment token: '+net.label+' has no default stablecoin, so set the mint price to 0 or use a portable mode'];
    mcSpecs = [
      { kind:'addr', name:'usdc', type:'address', value: usdc==='' ? '0x0000000000000000000000000000000000000000' : usdc, param:'usdc_', hint:'usdc', optional: /^0+(\.0+)?$/.test(String(price).trim()) },
      { kind:'scaled', name:'mintPrice', expr: price, tokenParam:'usdc_' }
    ];
    code = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

interface IERC721Receiver {
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) external returns (bytes4);
}

/// @title ${name} — NFT collection (ERC-721) with USDC-paid mint
/// @notice Generated by ContractForge for ${net.label} (chainId ${net.chainIdDec})
contract ${name} {
    string public name = "${g('s_name')||name}";
    string public symbol = "${sym}";
    string public baseURI = "${baseuri}";
    uint256 public constant MAX_SUPPLY = ${supply};
    uint256 public mintPrice = ${price} * 10**6; // USDC, 6 decimals
    uint96  public royaltyBps = ${royalty};
    address public owner;
    /// @notice The account offered the owner role by transferOwnership(); it has no powers until it calls acceptOwnership().
    address public pendingOwner;
    address public usdc = ${usdc==='' ? '0x0000000000000000000000000000000000000000' : usdc};
    uint256 public totalSupply;

    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _approved;
    mapping(address => mapping(address => bool)) public isApprovedForAll;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    event Minted(address indexed to, uint256 indexed tokenId);
    event MintPriceUpdated(uint256 oldPrice, uint256 newPrice);
    event BaseURIUpdated(string oldURI, string newURI);
    event OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    uint256 private _locked = 1;
    modifier nonReentrant(){ require(_locked == 1, "reentrant call"); _locked = 2; _; _locked = 1; }
    modifier onlyOwner(){ require(msg.sender == owner, "not owner"); _; }

    constructor() { owner = msg.sender; }

    /// @notice Offer the owner role (mint payments, royalties, price and base URI) to newOwner; it takes effect when newOwner accepts.
    ///         The owner can never be the zero address: the owner is also the payee, so there is no renounce.
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "new owner is the zero address");
        pendingOwner = newOwner;
        emit OwnershipTransferStarted(owner, newOwner);
    }

    /// @notice Take over the owner role after being offered it.
    function acceptOwnership() external {
        require(msg.sender == pendingOwner && msg.sender != address(0), "not pending owner");
        emit OwnershipTransferred(owner, msg.sender);
        owner = msg.sender;
        pendingOwner = address(0);
    }

    /// @notice ERC-165: ERC-721, ERC-721 metadata and ERC-2981 (royalties).
    function supportsInterface(bytes4 id) external pure returns (bool) {
        return id == 0x01ffc9a7 || id == 0x80ac58cd || id == 0x5b5e139f || id == 0x2a55205a;
    }

    function balanceOf(address account) external view returns (uint256) {
        require(account != address(0), "zero address");
        return _balances[account];
    }

    function getApproved(uint256 tokenId) external view returns (address) {
        ownerOf(tokenId);
        return _approved[tokenId];
    }

    function ownerOf(uint256 tokenId) public view returns (address tokenOwner) {
        tokenOwner = _owners[tokenId];
        require(tokenOwner != address(0), "nonexistent token");
    }

    function tokenURI(uint256 tokenId) external view returns (string memory) {
        ownerOf(tokenId);
        return string(abi.encodePacked(baseURI, _toString(tokenId)));
    }

    /// @notice EIP-2981 royalty info
    function royaltyInfo(uint256, uint256 salePrice) external view returns (address receiver, uint256 royaltyAmount) {
        return (owner, (salePrice * royaltyBps) / 10000);
    }

    /// @notice Mints the next token to the caller and pays the owner. Checks, then effects, then the payment last:
    ///         the supply and the owner are recorded before the payment token is called, and the function cannot be
    ///         re-entered, so a payment token that calls back can neither mint past MAX_SUPPLY nor reuse a token id.
    function mint() external nonReentrant returns (uint256 tokenId) {
        require(totalSupply < MAX_SUPPLY, "sold out");
        tokenId = ++totalSupply;
        _owners[tokenId] = msg.sender;
        _balances[msg.sender] += 1;
        emit Transfer(address(0), msg.sender, tokenId);
        emit Minted(msg.sender, tokenId);
        if (mintPrice > 0) {
            require(IERC20(usdc).transferFrom(msg.sender, owner, mintPrice), "USDC payment failed");
        }
    }

    function approve(address to, uint256 tokenId) external {
        address tokenOwner = ownerOf(tokenId);
        require(msg.sender == tokenOwner || isApprovedForAll[tokenOwner][msg.sender], "not token owner");
        require(to != tokenOwner, "approval to current owner");
        _approved[tokenId] = to;
        emit Approval(tokenOwner, to, tokenId);
    }

    function setApprovalForAll(address operator, bool approved) external {
        require(operator != msg.sender, "approve to caller");
        isApprovedForAll[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function transferFrom(address from, address to, uint256 tokenId) public {
        require(ownerOf(tokenId) == from, "wrong owner");
        require(to != address(0), "transfer to zero address");
        require(msg.sender == from || _approved[tokenId] == msg.sender || isApprovedForAll[from][msg.sender], "not authorized");
        _owners[tokenId] = to;
        _balances[from] -= 1;
        _balances[to] += 1;
        delete _approved[tokenId];
        emit Transfer(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) external {
        safeTransferFrom(from, to, tokenId, "");
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public {
        transferFrom(from, to, tokenId);
        if (to.code.length > 0) {
            require(IERC721Receiver(to).onERC721Received(msg.sender, from, tokenId, data) == IERC721Receiver.onERC721Received.selector, "unsafe recipient");
        }
    }

    function setMintPrice(uint256 newPrice) external onlyOwner {
        emit MintPriceUpdated(mintPrice, newPrice);
        mintPrice = newPrice;
    }
    function setBaseURI(string calldata uri) external onlyOwner {
        emit BaseURIUpdated(baseURI, uri);
        baseURI = uri;
    }

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value; uint256 digits;
        while (temp != 0) { digits++; temp /= 10; }
        bytes memory buffer = new bytes(digits);
        while (value != 0) { digits--; buffer[digits] = bytes1(uint8(48 + value % 10)); value /= 10; }
        return string(buffer);
    }
}`;
  }

  else if(id==='escrow'){
    name=g('s_name').replace(/[^A-Za-z0-9]/g,'')||'ArcEscrow';
    // an empty or wrong party makes this a draft (see required.js); the stand-ins only keep the draft readable
    const buyer=g('s_buyer').trim()||REQ_DRAFT_ADDR.a;
    const seller=g('s_seller').trim()||REQ_DRAFT_ADDR.b;
    const arbiter=g('s_arbiter').trim()||REQ_DRAFT_ADDR.c;
    const token=resolveToken(g('s_token'),'usdc');
    mcProblems = reqProblems([
      { label:'Buyer', value:g('s_buyer'), required:true }, { label:'Seller', value:g('s_seller'), required:true }, { label:'Arbiter', value:g('s_arbiter'), required:true }
    ], true).concat([reqTokenProblem('Token', g('s_token'), token, net.label)].filter(Boolean));
    const amount=g('s_amount')||'0';
    const timeout=g('s_timeout')||'14';
    mcSpecs = [
      { kind:'addr', name:'token', type:'IERC20', value:token, param:'token_', hint:'usdc', userSet:!!g('s_token').trim() },
      { kind:'scaled', name:'amount', expr:amount, tokenParam:'token_' }
    ];
    code = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function decimals() external view returns (uint8);
}

/// @title ${name} — Buyer/seller escrow with arbiter
/// @notice Generated by ContractForge for ${net.label} (chainId ${net.chainIdDec})
contract ${name} {
    address public buyer = ${buyer};
    address public seller = ${seller};
    address public arbiter = ${arbiter};
    IERC20 public token = IERC20(${token});
    uint256 public amount = ${amount} * 10**6; // assumes 6 decimals (USDC/EURC)
    uint256 public deadline;
    bool public funded;
    bool public released;
    bool public refunded;

    event Funded(uint256 amount);
    event Released(address to, uint256 amount);
    event Refunded(address to, uint256 amount);
    event Disputed(address by);

    constructor() {}

    /// @notice The buyer deposits the payment. The ${timeout}-day refund timeout starts now.
    function fund() external {
        require(msg.sender == buyer, "only buyer");
        require(!funded, "already funded");
        funded = true;
        deadline = block.timestamp + ${timeout} days;
        emit Funded(amount);
        require(token.transferFrom(buyer, address(this), amount), "transferFrom failed");
    }

    /// @notice Buyer confirms receipt — releases funds to the seller
    function release() external {
        require(msg.sender == buyer || msg.sender == arbiter, "not authorized");
        require(funded && !released && !refunded, "invalid state");
        released = true;
        require(token.transfer(seller, amount), "transfer failed");
        emit Released(seller, amount);
    }

    /// @notice Arbiter resolves the dispute in favor of the seller
    function resolveToSeller() external {
        require(msg.sender == arbiter, "only arbiter");
        require(funded && !released && !refunded, "invalid state");
        released = true;
        require(token.transfer(seller, amount), "transfer failed");
        emit Released(seller, amount);
    }

    /// @notice Arbiter resolves the dispute in favor of the buyer, or refund timeout has expired
    function resolveToBuyer() external {
        require(funded && !released && !refunded, "invalid state");
        require(msg.sender == arbiter || block.timestamp > deadline, "not authorized / not expired");
        refunded = true;
        require(token.transfer(buyer, amount), "transfer failed");
        emit Refunded(buyer, amount);
    }
}`;
  }

  else if(id==='vesting'){
    name=g('s_name').replace(/[^A-Za-z0-9]/g,'')||'ArcVesting';
    const token=resolveToken(g('s_token'),'usdc');
    const beneficiary=g('s_beneficiary').trim()||REQ_DRAFT_ADDR.b;
    mcProblems = reqProblems([{ label:'Beneficiary', value:g('s_beneficiary'), required:true }]).concat([reqTokenProblem('Token', g('s_token'), token, net.label)].filter(Boolean));
    const amount=g('s_amount')||'0';
    const duration=g('s_duration')||'365';
    const cliff=g('s_cliff')||'0';
    mcSpecs = [
      { kind:'addr', name:'token', type:'IERC20', value:token, param:'token_', hint:'usdc', userSet:!!g('s_token').trim() },
      { kind:'scaled', name:'totalAmount', expr:amount, tokenParam:'token_' }
    ];
    code = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

/// @title ${name} — Linear vesting with cliff
/// @notice Generated by ContractForge for ${net.label} (chainId ${net.chainIdDec})
contract ${name} {
    IERC20 public token = IERC20(${token});
    address public beneficiary = ${beneficiary};
    address public funder;
    uint256 public totalAmount = ${amount} * 10**6;
    uint256 public released;
    uint256 public start;
    uint256 public cliffDuration = ${cliff} days;
    uint256 public totalDuration = ${duration} days;
    bool public funded;

    event Funded(uint256 amount);
    event Released(uint256 amount);

    constructor() {
        funder = msg.sender;
    }

    /// @notice The deployer deposits the tokens. Vesting (and the cliff) start now, not at deployment.
    function fund() external {
        require(msg.sender == funder, "only funder");
        require(!funded, "already funded");
        funded = true;
        start = block.timestamp;
        emit Funded(totalAmount);
        require(token.transferFrom(funder, address(this), totalAmount), "transferFrom failed");
    }

    function vestedAmount() public view returns (uint256) {
        if (!funded) return 0;
        if (block.timestamp < start + cliffDuration) return 0;
        if (block.timestamp >= start + totalDuration) return totalAmount;
        return (totalAmount * (block.timestamp - start)) / totalDuration;
    }

    function releasable() public view returns (uint256) {
        return vestedAmount() - released;
    }

    function release() external {
        require(funded, "not funded");
        uint256 amount = releasable();
        require(amount > 0, "nothing to release");
        released += amount;
        require(token.transfer(beneficiary, amount), "transfer failed");
        emit Released(amount);
    }
}`;
  }

  else if(id==='paywall'){
    name=g('s_name').replace(/[^A-Za-z0-9]/g,'')||'ArcSubscription';
    const token=resolveToken(g('s_token'),'usdc');
    const amount=g('s_amount')||'0';
    const duration=g('s_duration')||'30';
    const beneficiary=g('s_beneficiary').trim()||REQ_DRAFT_ADDR.b;
    mcProblems = reqProblems([{ label:'Beneficiary', value:g('s_beneficiary'), required:true }]).concat([reqTokenProblem('Token', g('s_token'), token, net.label)].filter(Boolean));
    mcSpecs = [
      { kind:'addr', name:'token', type:'IERC20', value:token, param:'token_', hint:'usdc', userSet:!!g('s_token').trim() },
      { kind:'scaled', name:'pricePerPeriod', expr:amount, tokenParam:'token_' }
    ];
    code = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/// @title ${name} — Recurring stablecoin subscription
/// @notice Generated by ContractForge for ${net.label} (chainId ${net.chainIdDec})
contract ${name} {
    IERC20 public token = IERC20(${token});
    address public beneficiary = ${beneficiary};
    uint256 public pricePerPeriod = ${amount} * 10**6;
    uint256 public periodDuration = ${duration} days;
    address public owner;
    /// @notice The account offered the owner role by transferOwnership(); it has no powers until it calls acceptOwnership().
    address public pendingOwner;

    mapping(address => uint256) public accessUntil;

    event Subscribed(address indexed user, uint256 until);
    event PriceUpdated(uint256 oldPrice, uint256 newPrice);
    event BeneficiaryUpdated(address indexed oldBeneficiary, address indexed newBeneficiary);
    event OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event OwnershipTransferCancelled(address indexed previousOwner, address indexed pendingOwner);

    modifier onlyOwner(){ require(msg.sender == owner, "not owner"); _; }

    constructor() { owner = msg.sender; }

    /// @notice Offer the owner role (setPrice/setBeneficiary) to newOwner; it takes effect when newOwner accepts.
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0) && newOwner != owner && newOwner != address(this), "invalid new owner");
        pendingOwner = newOwner;
        emit OwnershipTransferStarted(owner, newOwner);
    }

    /// @notice Take over the owner role after being offered it.
    function acceptOwnership() external {
        require(msg.sender == pendingOwner && msg.sender != address(0), "not pending owner");
        emit OwnershipTransferred(owner, msg.sender);
        owner = msg.sender;
        pendingOwner = address(0);
    }

    /// @notice The current owner cancels a pending transfer.
    function cancelOwnershipTransfer() external onlyOwner {
        emit OwnershipTransferCancelled(owner, pendingOwner);
        pendingOwner = address(0);
    }

    function isActive(address user) external view returns (bool) {
        return accessUntil[user] >= block.timestamp;
    }

    /// @notice Pays for one period at the current price and extends access (cumulative if already active).
    ///         Prefer subscribeAtMost: it protects you if the price is raised just before your transaction.
    function subscribe() external {
        _subscribe(pricePerPeriod);
    }

    /// @notice Same as subscribe(), but reverts if the price is higher than maxPrice.
    function subscribeAtMost(uint256 maxPrice) external {
        require(pricePerPeriod <= maxPrice, "price too high");
        _subscribe(pricePerPeriod);
    }

    function _subscribe(uint256 price) private {
        uint256 base = accessUntil[msg.sender] > block.timestamp ? accessUntil[msg.sender] : block.timestamp;
        accessUntil[msg.sender] = base + periodDuration;
        emit Subscribed(msg.sender, accessUntil[msg.sender]);
        require(token.transferFrom(msg.sender, beneficiary, price), "payment failed");
    }

    function setPrice(uint256 newPrice) external onlyOwner {
        emit PriceUpdated(pricePerPeriod, newPrice);
        pricePerPeriod = newPrice;
    }
    function setBeneficiary(address newBeneficiary) external onlyOwner {
        require(newBeneficiary != address(0), "zero beneficiary");
        emit BeneficiaryUpdated(beneficiary, newBeneficiary);
        beneficiary = newBeneficiary;
    }
}`;
  }

  code = portabilize(code, mcSpecs);
  code = matStamp(code, id);
  showCode('simpleCode', name+'.sol', code);
  pendingSource = { name, code, template: id, problems: mcProblems };
  renderCtorArgs();
  document.getElementById('pendingContractLabel').value = name+'.sol  ('+NETWORKS[activeNetwork].label+')';
}

/* ======================================================================
   SECTION 02 — SWAP / AMM
   ====================================================================== */
/* Shared constant-product pair source. P0/P1 are the suffixes used for the two
   sides ('A','B' for the single-pair contract, '0','1' for factory pairs). */
function ammPairSource(o){
  const {contract, P0, P1, fee, title, notice, ctor, hasFactoryVar} = o;
  const t0=`token${P0}`, t1=`token${P1}`, r0=`reserve${P0}`, r1=`reserve${P1}`;
  const a0=`amount${P0}`, a1=`amount${P1}`;
  const a0d=`amount${P0}Desired`, a1d=`amount${P1}Desired`, a0m=`amount${P0}Min`, a1m=`amount${P1}Min`;
  const s01=`swap${P0}to${P1}`, s10=`swap${P1}to${P0}`;
  return `/// @title ${title}
${notice}/// @dev Constant-product (x*y=k) pool. ${fee} bps fee stays in the reserves for liquidity providers.
///      Safe-by-default: slippage limits and deadlines on every call, minimum liquidity locked on the
///      first deposit, deposits taken at the pool ratio (no donated excess), reentrancy guard, and
///      fee-on-transfer tokens are rejected (on the way in and on the way out). Liquidity shares are a
///      standard ERC-20 token, so they can be transferred and shown by wallets. Tokens sent to the pool
///      directly (not through these functions) are not tracked and cannot be recovered. Not for rebasing
///      tokens, and a pool is only as safe as the two tokens in it.
contract ${contract} {
    IERC20 public immutable ${t0};
    IERC20 public immutable ${t1};
    uint256 public ${r0};
    uint256 public ${r1};
    uint256 public constant FEE_BPS = ${fee};
    uint256 public constant MINIMUM_LIQUIDITY = 1000;
    uint256 public totalShares;
    mapping(address => uint256) public shares;
    mapping(address => mapping(address => uint256)) public allowance;
    string public constant name = "ContractForge LP";
    string public constant symbol = "CF-LP";
    uint8 public constant decimals = 18;
${hasFactoryVar?'    address public factory;\n':''}    uint256 private _locked = 1;

    event LiquidityAdded(address indexed provider, uint256 ${a0}, uint256 ${a1}, uint256 sharesMinted);
    event LiquidityRemoved(address indexed provider, uint256 ${a0}, uint256 ${a1}, uint256 sharesBurned);
    event Swap(address indexed user, address tokenIn, uint256 amountIn, uint256 amountOut);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    modifier nonReentrant() {
        require(_locked == 1, "reentrant call");
        _locked = 2;
        _;
        _locked = 1;
    }

    modifier ensure(uint256 deadline) {
        require(block.timestamp <= deadline, "expired");
        _;
    }

${ctor}

    /// @notice Add liquidity at the current pool ratio. Only the amounts actually needed are pulled.
    /// @param ${a0d} Max amount of ${t0} to deposit
    /// @param ${a1d} Max amount of ${t1} to deposit
    /// @param ${a0m} Revert if less than this ${t0} would be deposited
    /// @param ${a1m} Revert if less than this ${t1} would be deposited
    /// @param deadline Unix time after which the call reverts
    function addLiquidity(
        uint256 ${a0d},
        uint256 ${a1d},
        uint256 ${a0m},
        uint256 ${a1m},
        uint256 deadline
    ) external nonReentrant ensure(deadline) returns (uint256 ${a0}, uint256 ${a1}, uint256 mintedShares) {
        require(${a0d} > 0 && ${a1d} > 0, "zero amounts");

        if (totalShares == 0) {
            (${a0}, ${a1}) = (${a0d}, ${a1d});
        } else {
            uint256 ${a1}Optimal = (${a0d} * ${r1}) / ${r0};
            if (${a1}Optimal <= ${a1d}) {
                (${a0}, ${a1}) = (${a0d}, ${a1}Optimal);
            } else {
                uint256 ${a0}Optimal = (${a1d} * ${r0}) / ${r1};
                (${a0}, ${a1}) = (${a0}Optimal, ${a1d});
            }
        }
        require(${a0} >= ${a0m} && ${a1} >= ${a1m}, "slippage exceeded");

        if (totalShares == 0) {
            mintedShares = _sqrt(${a0} * ${a1});
            require(mintedShares > MINIMUM_LIQUIDITY, "insufficient initial liquidity");
            mintedShares -= MINIMUM_LIQUIDITY;
            totalShares = MINIMUM_LIQUIDITY;      // locked forever, keeps the pool from ever being empty
            shares[address(0)] = MINIMUM_LIQUIDITY;
            emit Transfer(address(0), address(0), MINIMUM_LIQUIDITY);
        } else {
            uint256 s0 = (${a0} * totalShares) / ${r0};
            uint256 s1 = (${a1} * totalShares) / ${r1};
            mintedShares = s0 < s1 ? s0 : s1;
        }
        require(mintedShares > 0, "insufficient liquidity minted");

        ${r0} += ${a0};
        ${r1} += ${a1};
        totalShares += mintedShares;
        shares[msg.sender] += mintedShares;

        emit Transfer(address(0), msg.sender, mintedShares);
        emit LiquidityAdded(msg.sender, ${a0}, ${a1}, mintedShares);
        _pull(${t0}, ${a0});
        _pull(${t1}, ${a1});
    }

    /// @notice Burn shares and receive the proportional amount of both tokens.
    function removeLiquidity(
        uint256 shareAmount,
        uint256 ${a0m},
        uint256 ${a1m},
        uint256 deadline
    ) external nonReentrant ensure(deadline) returns (uint256 ${a0}, uint256 ${a1}) {
        require(shareAmount > 0 && shares[msg.sender] >= shareAmount, "insufficient shares");
        ${a0} = (${r0} * shareAmount) / totalShares;
        ${a1} = (${r1} * shareAmount) / totalShares;
        require(${a0} > 0 && ${a1} > 0, "insufficient liquidity burned");
        require(${a0} >= ${a0m} && ${a1} >= ${a1m}, "slippage exceeded");

        shares[msg.sender] -= shareAmount;
        totalShares -= shareAmount;
        ${r0} -= ${a0};
        ${r1} -= ${a1};

        emit Transfer(msg.sender, address(0), shareAmount);
        emit LiquidityRemoved(msg.sender, ${a0}, ${a1}, shareAmount);
        _push(${t0}, msg.sender, ${a0});
        _push(${t1}, msg.sender, ${a1});
    }

    /// @notice Swap ${t0} -> ${t1}
    function ${s01}(uint256 amountIn, uint256 minAmountOut, uint256 deadline)
        external nonReentrant ensure(deadline) returns (uint256 amountOut)
    {
        require(amountIn > 0, "zero amount");
        amountOut = _quote(amountIn, ${r0}, ${r1});
        require(amountOut > 0, "insufficient output");
        require(amountOut >= minAmountOut, "slippage exceeded");

        ${r0} += amountIn;
        ${r1} -= amountOut;

        emit Swap(msg.sender, address(${t0}), amountIn, amountOut);
        _pull(${t0}, amountIn);
        _push(${t1}, msg.sender, amountOut);
    }

    /// @notice Swap ${t1} -> ${t0}
    function ${s10}(uint256 amountIn, uint256 minAmountOut, uint256 deadline)
        external nonReentrant ensure(deadline) returns (uint256 amountOut)
    {
        require(amountIn > 0, "zero amount");
        amountOut = _quote(amountIn, ${r1}, ${r0});
        require(amountOut > 0, "insufficient output");
        require(amountOut >= minAmountOut, "slippage exceeded");

        ${r1} += amountIn;
        ${r0} -= amountOut;

        emit Swap(msg.sender, address(${t1}), amountIn, amountOut);
        _pull(${t1}, amountIn);
        _push(${t0}, msg.sender, amountOut);
    }

    /* ---- Liquidity shares as a standard ERC-20 token ---- */

    function totalSupply() external view returns (uint256) { return totalShares; }

    function balanceOf(address account) external view returns (uint256) { return shares[account]; }

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transfer(address to, uint256 value) external returns (bool) {
        _transferShares(msg.sender, to, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            require(allowed >= value, "insufficient allowance");
            allowance[from][msg.sender] = allowed - value;
        }
        _transferShares(from, to, value);
        return true;
    }

    function _transferShares(address from, address to, uint256 value) private {
        require(to != address(0), "invalid recipient");
        require(shares[from] >= value, "insufficient shares");
        shares[from] -= value;
        shares[to] += value;
        emit Transfer(from, to, value);
    }

    /// @notice Expected output for an input amount at the current reserves (0 if the pool is empty).
    function getAmountOut(uint256 amountIn, bool ${P0.toLowerCase()==='a'?'aToB':'zeroToOne'}) external view returns (uint256) {
        return ${P0.toLowerCase()==='a'?'aToB':'zeroToOne'} ? _quote(amountIn, ${r0}, ${r1}) : _quote(amountIn, ${r1}, ${r0});
    }

    function _quote(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) private pure returns (uint256) {
        if (amountIn == 0 || reserveIn == 0 || reserveOut == 0) return 0;
        uint256 amountInWithFee = amountIn * (10000 - FEE_BPS);
        return (amountInWithFee * reserveOut) / (reserveIn * 10000 + amountInWithFee);
    }

    /// @dev Pull exactly \`amount\` from the caller; rejects tokens that take a fee on transfer.
    function _pull(IERC20 token, uint256 amount) private {
        uint256 balBefore = token.balanceOf(address(this));
        _call(address(token), abi.encodeCall(IERC20.transferFrom, (msg.sender, address(this), amount)));
        require(token.balanceOf(address(this)) - balBefore == amount, "unsupported token (fee on transfer)");
    }

    /// @dev Pay out exactly the amount: the recipient must receive it all and the pool must lose no more than it.
    ///      Reverts for tokens that tax or surcharge outgoing transfers.
    function _push(IERC20 token, address to, uint256 amount) private {
        uint256 toBefore = token.balanceOf(to);
        uint256 poolBefore = token.balanceOf(address(this));
        _call(address(token), abi.encodeCall(IERC20.transfer, (to, amount)));
        uint256 toAfter = token.balanceOf(to);
        uint256 poolAfter = token.balanceOf(address(this));
        require(
            toAfter >= toBefore && toAfter - toBefore == amount && poolBefore >= poolAfter && poolBefore - poolAfter == amount,
            "unsupported token (fee on transfer)"
        );
    }

    /// @dev Works with tokens that return nothing (e.g. USDT) as well as tokens that return a bool.
    function _call(address token, bytes memory data) private {
        (bool ok, bytes memory ret) = token.call(data);
        require(ok && (ret.length == 0 || abi.decode(ret, (bool))), "token transfer failed");
    }

    function _sqrt(uint256 y) private pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) { z = x; x = (y / x + x) / 2; }
        } else if (y != 0) { z = 1; }
    }
}`;
}

function genSwap(){
  const net=NETWORKS[activeNetwork];
  const name=(document.getElementById('swap_name').value||'ArcSwapAMM').replace(/[^A-Za-z0-9]/g,'');
  const tokenA=resolveToken(document.getElementById('swap_tokenA').value,'usdc');
  const tokenB=resolveToken(document.getElementById('swap_tokenB').value,'eurc');
  const fee=document.getElementById('swap_fee').value||'30';
  const kind=document.getElementById('swap_kind').value;
  const multi=document.getElementById('swap_multi').value;

  if(!/^\d+$/.test(String(fee).trim()) || Number(fee) >= 10000){
    alert('Pool fee must be a whole number of basis points below 10000 (30 = 0.30%).');
    return;
  }
  const ZERO='0x0000000000000000000000000000000000000000';
  const portable = isPortable();
  const needsTokens = !(kind==='amm' && multi==='factory');
  const tokA = portable ? 'tokenA_' : tokenA, tokB = portable ? 'tokenB_' : tokenB;
  if(needsTokens && !portable){
    const badToken = reqProblems([{ label:'Token A', value:document.getElementById('swap_tokenA').value }, { label:'Token B', value:document.getElementById('swap_tokenB').value }])[0];
    if(badToken){ alert(badToken+'.'); return; }
    if(tokenA===ZERO || tokenB===ZERO){
      alert('No default token for '+net.label+'. Enter the Token A and Token B addresses.');
      return;
    }
    if(tokenA.toLowerCase()===tokenB.toLowerCase()){
      alert('Token A and Token B must be different.');
      return;
    }
  }

  const ierc20 = `interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}`;

  let code;
  if(kind==='amm' && multi==='single'){
    code = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

${ierc20}

` + ammPairSource({
      contract:name, P0:'A', P1:'B', fee,
      title:`${name} — Constant-product AMM (x*y=k) for a single pair`,
      notice:`/// @notice Generated by ContractForge for ${net.label} (chainId ${net.chainIdDec})\n`,
      hasFactoryVar:false,
      ctor:`    constructor(${portable?'address tokenA_, address tokenB_':''}) {
        IERC20 a = IERC20(${tokA});
        IERC20 b = IERC20(${tokB});
        require(address(a) != address(b), "identical tokens");
        require(address(a).code.length > 0 && address(b).code.length > 0, "token is not a contract");
        tokenA = a;
        tokenB = b;
    }`
    });
  } else if(kind==='amm' && multi==='factory'){
    code = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

${ierc20}

` + ammPairSource({
      contract:`${name}Pair`, P0:'0', P1:'1', fee,
      title:`${name}Pair — individual constant-product pair`,
      notice:'',
      hasFactoryVar:true,
      ctor:`    constructor(address _token0, address _token1) {
        require(_token0 != address(0) && _token0 != _token1, "invalid tokens");
        require(_token0.code.length > 0 && _token1.code.length > 0, "token is not a contract");
        factory = msg.sender;
        token0 = IERC20(_token0);
        token1 = IERC20(_token1);
    }`
    }) + `

/// @title ${name}Factory — creates pairs on demand
/// @notice Generated by ContractForge for ${net.label} (chainId ${net.chainIdDec})
contract ${name}Factory {
    mapping(address => mapping(address => address)) public getPair;
    address[] public allPairs;

    event PairCreated(address indexed token0, address indexed token1, address pair);

    function createPair(address tokenX, address tokenY) external returns (address pair) {
        require(tokenX != tokenY, "identical tokens");
        require(tokenX != address(0) && tokenY != address(0), "zero address");
        require(getPair[tokenX][tokenY] == address(0), "pair exists");
        (address token0, address token1) = tokenX < tokenY ? (tokenX, tokenY) : (tokenY, tokenX);
        pair = address(new ${name}Pair(token0, token1));
        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair;
        allPairs.push(pair);
        emit PairCreated(token0, token1, pair);
    }

    function allPairsLength() external view returns (uint256) { return allPairs.length; }
}`;
  } else { // order-book / StableFX-style
    code = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

${ierc20}

/// @title ${name} — StableFX-style swap order book (PvP, no AMM)
/// @notice Generated by ContractForge for ${net.label} (chainId ${net.chainIdDec})
/// @dev Limit orders: maker deposits tokenA and sets an exchange rate, taker fills with tokenB.
///      The fee is paid in tokenB to feeCollector (the deployer). Prices cannot be changed after creation.
contract ${name} {
    IERC20 public immutable tokenA;
    IERC20 public immutable tokenB;
    uint256 public constant FEE_BPS = ${fee};
    address public feeCollector;
    uint256 private _locked = 1;

    struct Order {
        address maker;
        uint256 amountA;      // amount of tokenA offered
        uint256 priceB1e6;    // price: how much tokenB (1e6) per 1 tokenA (1e6)
        bool active;
    }

    Order[] public orders;

    event OrderCreated(uint256 indexed id, address indexed maker, uint256 amountA, uint256 priceB1e6);
    event OrderFilled(uint256 indexed id, address indexed taker, uint256 amountAFilled, uint256 amountBPaid);
    event OrderCancelled(uint256 indexed id);

    modifier nonReentrant() {
        require(_locked == 1, "reentrant call");
        _locked = 2;
        _;
        _locked = 1;
    }

    constructor(${portable?'address tokenA_, address tokenB_':''}) {
        IERC20 a = IERC20(${tokA});
        IERC20 b = IERC20(${tokB});
        require(address(a) != address(b), "identical tokens");
        require(address(a).code.length > 0 && address(b).code.length > 0, "token is not a contract");
        tokenA = a;
        tokenB = b;
        feeCollector = msg.sender;
    }

    function createOrder(uint256 amountA, uint256 priceB1e6) external nonReentrant returns (uint256 id) {
        require(amountA > 0 && priceB1e6 > 0, "invalid order");
        id = orders.length;
        orders.push(Order({ maker: msg.sender, amountA: amountA, priceB1e6: priceB1e6, active: true }));

        uint256 balBefore = tokenA.balanceOf(address(this));
        _call(address(tokenA), abi.encodeCall(IERC20.transferFrom, (msg.sender, address(this), amountA)));
        require(tokenA.balanceOf(address(this)) - balBefore == amountA, "unsupported token (fee on transfer)");
        emit OrderCreated(id, msg.sender, amountA, priceB1e6);
    }

    function fillOrder(uint256 id, uint256 amountAToFill) external nonReentrant {
        Order storage o = orders[id];
        require(o.active, "inactive order");
        require(amountAToFill > 0 && amountAToFill <= o.amountA, "invalid fill amount");

        // Round the price up so a fill can never be free or underpay the maker.
        uint256 amountB = (amountAToFill * o.priceB1e6 + 1e6 - 1) / 1e6;
        uint256 fee = FEE_BPS == 0 ? 0 : (amountB * FEE_BPS + 9999) / 10000;   // rounds up: splitting a fill cannot avoid the fee
        uint256 net = amountB - fee;
        address maker = o.maker;

        o.amountA -= amountAToFill;
        if (o.amountA == 0) o.active = false;

        _call(address(tokenB), abi.encodeCall(IERC20.transferFrom, (msg.sender, maker, net)));
        if (fee > 0) _call(address(tokenB), abi.encodeCall(IERC20.transferFrom, (msg.sender, feeCollector, fee)));
        _call(address(tokenA), abi.encodeCall(IERC20.transfer, (msg.sender, amountAToFill)));

        emit OrderFilled(id, msg.sender, amountAToFill, amountB);
    }

    function cancelOrder(uint256 id) external nonReentrant {
        Order storage o = orders[id];
        require(o.maker == msg.sender, "not maker");
        require(o.active, "inactive");
        uint256 refund = o.amountA;
        o.active = false;
        o.amountA = 0;
        _call(address(tokenA), abi.encodeCall(IERC20.transfer, (msg.sender, refund)));
        emit OrderCancelled(id);
    }

    function ordersLength() external view returns (uint256) { return orders.length; }

    /// @dev Works with tokens that return nothing (e.g. USDT) as well as tokens that return a bool.
    function _call(address token, bytes memory data) private {
        (bool ok, bytes memory ret) = token.call(data);
        require(ok && (ret.length == 0 || abi.decode(ret, (bool))), "token transfer failed");
    }
}`;
  }

  code = portabilize(code, []);
  if(portable && needsTokens){
    const fieldA = document.getElementById('swap_tokenA').value.trim(), fieldB = document.getElementById('swap_tokenB').value.trim();
    pendingCtorArgs = [
      { param:'tokenA_', type:'address', hint:'usdc', value: tokenA===ZERO ? '' : tokenA, userSet:!!fieldA, genNetwork:activeNetwork },
      { param:'tokenB_', type:'address', hint:'eurc', value: tokenB===ZERO ? '' : tokenB, userSet:!!fieldB, genNetwork:activeNetwork }
    ];
  }
  const filename = multi==='factory' && kind==='amm' ? name+'Factory.sol' : name+'.sol';
  const swapTemplate = kind==='amm' ? (multi==='factory' ? 'swap-amm-factory' : 'swap-amm-single') : 'swap-orderbook';
  code = matStamp(code, swapTemplate);
  showCode('swapCode', filename, code);
  pendingSource = { name: (multi==='factory' && kind==='amm')?name+'Factory':name, code, template: swapTemplate };
  renderCtorArgs();
  document.getElementById('pendingContractLabel').value = filename+'  ('+net.label+')';
}

/* ======================================================================
   SWAP / AMM BUILDER VIEW (section 02, Phase 8.5) — presentation only.
   Reads the form (swap_*), activeNetwork, multichainMode, pendingSource and the deploy history; writes none of them.
   genSwap() and the Deploy now button are untouched. Nothing here compiles, deploys, or reports a result that did not happen.
   ====================================================================== */
const SWB_PROTOCOLS = {
  amm:       { title: 'Constant-product AMM (x*y=k)', text: 'Liquidity pools. Providers add and remove liquidity and traders swap both ways. The swap fee stays in the pool for the liquidity providers.' },
  orderbook: { title: 'Order-book / limit swap (StableFX-style)', text: 'Peer-to-peer orders, no pools and no AMM. A maker posts Token A at a price in Token B and takers fill it, fully or in part. The fee is paid in Token B to the fee collector, which is the deployer.' }
};

function swbEl(tag, cls, text){
  const el = document.createElement(tag);
  if(cls) el.className = cls;
  if(text !== undefined) el.textContent = text;
  return el;
}

/* The form as genSwap() reads it, plus the app state it depends on. */
function swbRead(){
  const g = (id) => { const el = document.getElementById(id); return el ? String(el.value) : ''; };
  const net = (typeof NETWORKS !== 'undefined' && NETWORKS[activeNetwork]) || null;
  const kind = g('swap_kind') === 'orderbook' ? 'orderbook' : 'amm';
  const multi = g('swap_multi') === 'factory' ? 'factory' : 'single';
  const rawA = g('swap_tokenA').trim(), rawB = g('swap_tokenB').trim();
  const portable = typeof isPortable === 'function' ? isPortable() : false;
  return {
    net, kind, multi, portable,
    name: (g('swap_name') || 'ArcSwapAMM').replace(/[^A-Za-z0-9]/g, ''),
    rawA, rawB, rawName: g('swap_name'),
    tokenA: rawA || (net && net.usdc) || '', tokenB: rawB || (net && net.eurc) || '',
    fee: (g('swap_fee') || '30').trim(),
    needsTokens: !(kind === 'amm' && multi === 'factory'),
    mode: (typeof MC_MODES !== 'undefined' && typeof multichainMode !== 'undefined' && MC_MODES[multichainMode]) ? MC_MODES[multichainMode].label : ''
  };
}

/* The same checks genSwap() makes before it generates, without its alerts. */
function swbProblems(v){
  const out = [];
  if(!/^\d+$/.test(v.fee) || Number(v.fee) >= 10000) out.push('Pool fee must be a whole number of basis points below 10000');
  if(v.needsTokens && !v.portable){
    const bad = typeof reqProblems === 'function' ? reqProblems([{ label: 'Token A', value: v.rawA }, { label: 'Token B', value: v.rawB }]) : [];
    bad.forEach(p => out.push(p));
    if(!bad.length){
      if(!v.tokenA) out.push('Token A: no default for ' + (v.net ? v.net.label : 'this network') + ', enter an address');
      if(!v.tokenB) out.push('Token B: no default for ' + (v.net ? v.net.label : 'this network') + ', enter an address');
      if(v.tokenA && v.tokenB && v.tokenA.toLowerCase() === v.tokenB.toLowerCase()) out.push('Token A and Token B must be different');
    }
  }
  return out;
}

function swbSig(v){ return JSON.stringify([v.kind, v.multi, v.fee, v.rawA, v.rawB, v.rawName, typeof activeNetwork !== 'undefined' ? activeNetwork : '', v.mode]); }

function swbFeePercent(fee){
  if(!/^\d+$/.test(fee) || Number(fee) >= 10000) return null;
  return (Number(fee) / 100).toFixed(2) + '%';
}


/* The Swap / AMM screen is one config for the shared engine in builder.js. The engine keeps the summary, the progress and the code head
   in step with real state; everything specific to this tab (its fields, its checks, its wording) is below. */
const SWB_CONFIG = {
  key: 'swap', prefix: 'swb',
  section: 'sec-swap', codePanel: 'swapCode', summary: 'swbSummary', progress: 'swbProgress', stages: 'swbStages',
  isTemplate: (tpl) => /^swap-/.test(tpl || ''),
  read: () => swbRead(),
  problems: (v) => swbProblems(v),
  signature: (v) => swbSig(v),
  guidance(v){
    // hints that follow the real generator branches
    const proto = SWB_PROTOCOLS[v.kind];
    const box = document.getElementById('swbProto');
    box.textContent = '';
    box.appendChild(swbEl('b', '', proto.title)); box.appendChild(document.createTextNode(proto.text));
    const pct = swbFeePercent(v.fee);
    const pctEl = document.getElementById('swbFeePct');
    pctEl.textContent = pct ? '= ' + pct : 'invalid'; pctEl.setAttribute('data-bad', pct ? '0' : '1');
    document.getElementById('swbFeeHint').textContent = v.kind === 'amm'
      ? 'Charged on every swap and kept in the pool for liquidity providers. 30 bps = 0.30%, the Uniswap V2 default. Whole number below 10000.'
      : 'Charged in Token B on every fill and paid to the fee collector (the deployer). 30 bps = 0.30%. Whole number below 10000.';
    document.getElementById('swbMultiHint').textContent = v.kind === 'orderbook'
      ? 'Applies to the AMM only. An order book is always one contract, whatever is chosen here.'
      : (v.multi === 'factory' ? 'A factory contract creates pairs on demand with createPair(tokenX, tokenY).' : 'One contract for one pair of tokens.');
    const pairNote = document.getElementById('swbPairNote');
    pairNote.setAttribute('data-kind', 'info');
    if(v.kind === 'amm' && v.multi === 'factory') pairNote.textContent = 'A factory does not use these two fields: each pair is created later with createPair(tokenX, tokenY).';
    else if(v.portable) pairNote.textContent = 'Deployment Mode is ' + v.mode + ': the token addresses are set as constructor arguments when you deploy. Anything typed here is only a default.';
    else pairNote.textContent = 'Use ERC-20 token addresses on ' + (v.net ? v.net.label : 'the active network') + '. Token A and Token B must be different.';
  },
  summaryRows(v, row){
    const proto = SWB_PROTOCOLS[v.kind];
    const pct = swbFeePercent(v.fee);
    const tokenRow = (label, raw, shown) => {
      const bad = typeof reqProblems === 'function' && v.needsTokens && !v.portable ? reqProblems([{ label, value: raw }]) : [];
      if(!v.needsTokens) return row(label, 'Not used', 'ok', 'Pairs are created later by the factory');
      if(bad.length) return row(label, shown, 'bad', 'Not a valid address', true);
      if(!shown) return row(label, 'Not set', v.portable ? 'ok' : 'missing', v.portable ? 'Set at deploy time' : 'No default on this network', false);
      return row(label, shown, 'ok', raw ? '' : 'Network default', true);
    };
    row('Project', v.name || '(empty)', v.name ? 'ok' : 'bad', v.name ? '' : 'Enter a name');
    row('Protocol', proto.title, 'ok');
    tokenRow('Token A', v.rawA, v.tokenA);
    tokenRow('Token B', v.rawB, v.tokenB);
    row(v.kind === 'amm' ? 'Pool fee' : 'Fee', pct ? v.fee + ' bps (' + pct + ')' : (v.fee || '(empty)') + ' bps', pct ? 'ok' : 'bad', pct ? '' : 'Whole number below 10000');
    row('Pair support', v.kind === 'orderbook' ? 'Single contract (order book)' : (v.multi === 'factory' ? 'Factory (multiple pairs)' : 'Single pair'), 'ok');
    CFBuilder.networkRow(row, v.net);
    row('Deployment Mode', v.mode || 'Unknown', v.mode ? 'ok' : 'bad');
  }
};
const swbBuilder = CFBuilder.register(SWB_CONFIG);
function swbRender(){ CFBuilder.render('swap'); }


/* ======================================================================
   SECTION 03 — TREASURY
   ====================================================================== */
function genTreasury(){
  const net=NETWORKS[activeNetwork];
  const name=(document.getElementById('tre_name').value||'ArcTreasury').replace(/[^A-Za-z0-9]/g,'');
  const threshold=document.getElementById('tre_threshold').value||'1';
  const signersRaw=document.getElementById('tre_signers').value.split('\n').map(s=>s.trim()).filter(Boolean);
  const streaming=document.getElementById('tre_streaming').value==='yes';
  const signersArr = signersRaw.length ? signersRaw : [REQ_DRAFT_ADDR.a];   // a draft only: see required.js
  const treasuryProblems = reqProblems(signersRaw.map((a, i) => ({ label:'Signer '+(i+1), value:a, required:true })), true);
  if(!signersRaw.length) treasuryProblems.push('Signers are required: enter one address per line');
  else if(Number.isInteger(Number(threshold)) && Number(threshold) > signersRaw.length) treasuryProblems.push('The threshold ('+threshold+') is higher than the number of signers ('+signersRaw.length+')');

  const signersSolList = signersArr.map(a=>`        _addSigner(${a});`).join('\n');
  const T = String(threshold).trim();
  const gasAlias = (net.gasSymbol === 'USDC' && net.usdc) ? net.usdc : '0x0000000000000000000000000000000000000000';

  let code = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/// @title ${name} — Multisig Treasury${streaming?' with payment streaming':''}
/// @notice Generated by ContractForge for ${net.label} (chainId ${net.chainIdDec})
/// @dev Approval threshold: ${T} of ${signersArr.length} signers. Every outflow${streaming?', stream creation':''} and signer change is a proposal
///      that executes automatically once enough CURRENT signers have approved it (approvals from a signer
///      who was later replaced no longer count).${streaming?`
///      Stream totals are reserved: proposals cannot spend funds that are owed to stream recipients.`:''}
///      Where the gas token also has an ERC-20 address (USDC on Arc), that address is the same money as the native
///      balance, so payments and streams must use the native currency (token = address(0)) and the ERC-20 address is refused.
contract ${name} {
    address[] public signerList;
    mapping(address => bool) public isSigner;
    uint256 public constant threshold = ${T};
    /// @notice ERC-20 address that represents the same money as the native currency on this chain (address(0) if none).
    address public gasTokenAlias = ${gasAlias};

    enum Kind { Transfer, ${streaming?'Stream, CloseStream, ':''}ReplaceSigner }

    struct Proposal {
        Kind kind;
        address token;      // Transfer${streaming?' / Stream':''}: address(0) = native currency (gas token)
        address to;         // Transfer: recipient${streaming?' · Stream: recipient · CloseStream: where the vested, unpaid part goes':''} · ReplaceSigner: the new signer
        uint256 amount;     // Transfer: amount${streaming?' · Stream: total · CloseStream: the stream id':''}
        address oldSigner;  // ReplaceSigner only${streaming?`
        uint256 start;      // Stream only
        uint256 duration;   // Stream only`:''}
        bool executed;
        mapping(address => bool) approvedBy;
    }

    Proposal[] private _proposals;

    event ProposalCreated(uint256 indexed id, address token, address to, uint256 amount);
    event ProposalApproved(uint256 indexed id, address signer, uint256 totalApprovals);
    event ProposalExecuted(uint256 indexed id);
    event SignerReplaced(address indexed oldSigner, address indexed newSigner);
    event Deposit(address indexed from, address token, uint256 amount);${streaming?`
    event StreamCreated(uint256 indexed id, address recipient, address token, uint256 total, uint256 start, uint256 duration);
    event StreamWithdrawn(uint256 indexed id, uint256 amount);
    event StreamClosed(uint256 indexed id, address payoutTo, uint256 payout);`:''}

    modifier onlySigner() { require(isSigner[msg.sender], "not a signer"); _; }

    constructor() {
${signersSolList}
        require(threshold > 0 && threshold <= signerList.length, "invalid threshold");
    }

    function _addSigner(address signer) private {
        require(signer != address(0), "zero signer");
        require(!isSigner[signer], "duplicate signer");
        signerList.push(signer);
        isSigner[signer] = true;
    }

    receive() external payable { emit Deposit(msg.sender, address(0), msg.value); }

    function depositToken(address token, uint256 amount) external {
        _callToken(token, abi.encodeCall(IERC20.transferFrom, (msg.sender, address(this), amount)));
        emit Deposit(msg.sender, token, amount);
    }

    /// @notice Propose a payment (native currency when token is address(0)). The proposer counts as the first approval.
    function propose(address token, address to, uint256 amount) external onlySigner returns (uint256 id) {
        require(to != address(0), "zero recipient");
        require(amount > 0, "zero amount");
        require(token == address(0) || token != gasTokenAlias, "use native currency for this asset");
        id = _newProposal(Kind.Transfer);
        Proposal storage p = _proposals[id];
        p.token = token; p.to = to; p.amount = amount;
        emit ProposalCreated(id, token, to, amount);
        _approve(id);
    }

    /// @notice Propose replacing a signer (for example a lost or compromised key). Needs the normal threshold.
    function proposeReplaceSigner(address oldSigner, address newSigner) external onlySigner returns (uint256 id) {
        require(isSigner[oldSigner], "old signer unknown");
        require(newSigner != address(0) && !isSigner[newSigner], "invalid new signer");
        id = _newProposal(Kind.ReplaceSigner);
        Proposal storage p = _proposals[id];
        p.oldSigner = oldSigner; p.to = newSigner;
        emit ProposalCreated(id, address(0), newSigner, 0);
        _approve(id);
    }
${streaming?`
    /// @notice Propose a payment stream. Creating it needs the same approvals as any other outflow.
    function proposeStream(address recipient, address token, uint256 total, uint256 start, uint256 duration) external onlySigner returns (uint256 id) {
        require(recipient != address(0), "zero recipient");
        require(total > 0, "zero total");
        require(duration > 0, "invalid duration");
        require(token == address(0) || token != gasTokenAlias, "use native currency for this asset");
        id = _newProposal(Kind.Stream);
        Proposal storage p = _proposals[id];
        p.token = token; p.to = recipient; p.amount = total; p.start = start; p.duration = duration;
        emit ProposalCreated(id, token, recipient, total);
        _approve(id);
    }

    /// @notice Propose closing a stream, for example when its recipient can no longer receive payments.
    ///         The vested part that was not withdrawn yet is sent to payoutTo and the unvested part is released
    ///         back to the treasury's free balance. Needs the normal threshold.
    function proposeCloseStream(uint256 streamId, address payoutTo) external onlySigner returns (uint256 id) {
        require(streamId < streams.length && streams[streamId].active, "inactive stream");
        require(payoutTo != address(0), "zero payout address");
        id = _newProposal(Kind.CloseStream);
        Proposal storage p = _proposals[id];
        p.amount = streamId; p.to = payoutTo;
        emit ProposalCreated(id, streams[streamId].token, payoutTo, streamId);
        _approve(id);
    }
`:''}
    function approve(uint256 id) external onlySigner { _approve(id); }

    function _pay(address token, address to, uint256 amount) private {
        if (token == address(0)) {
            (bool ok, ) = to.call{value: amount}("");
            require(ok, "native transfer failed");
        } else {
            _callToken(token, abi.encodeCall(IERC20.transfer, (to, amount)));
        }
    }

    /// @dev Works with tokens that return nothing (e.g. USDT) as well as tokens that return a bool.
    function _callToken(address token, bytes memory data) private {
        (bool ok, bytes memory ret) = token.call(data);
        require(ok && (ret.length == 0 || abi.decode(ret, (bool))), "token transfer failed");
    }

    function _newProposal(Kind kind) private returns (uint256 id) {
        id = _proposals.length;
        _proposals.push();
        _proposals[id].kind = kind;
    }

    /// @notice Approvals that count: only from addresses that are signers right now.
    function approvalsOf(uint256 id) public view returns (uint256 n) {
        Proposal storage p = _proposals[id];
        for (uint256 i = 0; i < signerList.length; i++) {
            if (p.approvedBy[signerList[i]]) n++;
        }
    }

    function _approve(uint256 id) internal {
        require(id < _proposals.length, "unknown proposal");
        Proposal storage p = _proposals[id];
        require(!p.executed, "already executed");
        require(!p.approvedBy[msg.sender], "already approved");
        p.approvedBy[msg.sender] = true;
        uint256 count = approvalsOf(id);
        emit ProposalApproved(id, msg.sender, count);
        if (count >= threshold) _execute(id);
    }

    function _execute(uint256 id) internal {
        Proposal storage p = _proposals[id];
        require(!p.executed, "already executed");
        p.executed = true;
        if (p.kind == Kind.Transfer) {${streaming?`
            require(p.amount <= _free(p.token), "amount reserved for streams");`:''}
            if (p.token == address(0)) {
                (bool ok, ) = p.to.call{value: p.amount}("");
                require(ok, "native transfer failed");
            } else {
                _callToken(p.token, abi.encodeCall(IERC20.transfer, (p.to, p.amount)));
            }
        } else if (p.kind == Kind.ReplaceSigner) {
            require(isSigner[p.oldSigner] && !isSigner[p.to], "signer set changed");
            for (uint256 i = 0; i < signerList.length; i++) {
                if (signerList[i] == p.oldSigner) { signerList[i] = p.to; break; }
            }
            isSigner[p.oldSigner] = false;
            isSigner[p.to] = true;
            emit SignerReplaced(p.oldSigner, p.to);
        }${streaming?` else if (p.kind == Kind.Stream) {
            require(p.amount <= _free(p.token), "not enough unreserved funds");
            reserved[p.token] += p.amount;
            uint256 sid = streams.length;
            streams.push(Stream({ recipient: p.to, token: p.token, total: p.amount, withdrawn: 0, start: p.start, duration: p.duration, active: true }));
            emit StreamCreated(sid, p.to, p.token, p.amount, p.start, p.duration);
        } else if (p.kind == Kind.CloseStream) {
            Stream storage s = streams[p.amount];
            require(s.active, "inactive stream");
            uint256 vested = streamed(p.amount);
            reserved[s.token] -= (s.total - s.withdrawn); // release everything that was still owed
            uint256 payout = vested - s.withdrawn;
            s.total = vested; s.withdrawn = vested; s.active = false;
            if (payout > 0) _pay(s.token, p.to, payout);
            emit StreamClosed(p.amount, p.to, payout);
        }`:''}
        emit ProposalExecuted(id);
    }

    function signersLength() external view returns (uint256) { return signerList.length; }

    function proposalsLength() external view returns (uint256) { return _proposals.length; }

    function proposalInfo(uint256 id) external view returns (address token, address to, uint256 amount, uint256 approvals, bool executed) {
        Proposal storage p = _proposals[id];
        return (p.token, p.to, p.amount, approvalsOf(id), p.executed);
    }

    function proposalKind(uint256 id) external view returns (Kind) { return _proposals[id].kind; }
`;

  if(streaming){
    code += `
    // ---------------- Payment streaming (linear vesting) ----------------
    struct Stream {
        address recipient;
        address token; // address(0) = native
        uint256 total;
        uint256 withdrawn;
        uint256 start;
        uint256 duration;
        bool active;
    }
    Stream[] public streams;

    /// @notice Outstanding stream amounts per asset (address(0) = native). Proposals cannot spend these.
    mapping(address => uint256) public reserved;

    function _free(address token) internal view returns (uint256) {
        uint256 bal = token == address(0) ? address(this).balance : IERC20(token).balanceOf(address(this));
        uint256 held = reserved[token];
        return bal > held ? bal - held : 0;
    }

    function streamsLength() external view returns (uint256) { return streams.length; }

    function streamed(uint256 id) public view returns (uint256) {
        Stream storage s = streams[id];
        if (block.timestamp < s.start) return 0;
        uint256 elapsed = block.timestamp - s.start;
        if (elapsed >= s.duration) return s.total;
        return (s.total * elapsed) / s.duration;
    }

    function withdrawStream(uint256 id) external {
        Stream storage s = streams[id];
        require(s.active, "inactive stream");
        require(msg.sender == s.recipient, "not recipient");
        uint256 available = streamed(id) - s.withdrawn;
        require(available > 0, "nothing to withdraw");
        s.withdrawn += available;
        reserved[s.token] -= available;
        emit StreamWithdrawn(id, available);
        _pay(s.token, s.recipient, available);
    }
`;
  }

  code += `}`;

  code = portabilize(code, [
    { kind:'addr', name:'gasTokenAlias', type:'address', value:gasAlias, param:'gasTokenAlias_', hint:'gasAlias', check:false, allowZero:true, userSet:false }
  ]);
  code = matStamp(code, 'treasury');
  showCode('treasuryCode', name+'.sol', code);
  pendingSource = { name, code, template: 'treasury', problems: treasuryProblems };
  renderCtorArgs();
  document.getElementById('pendingContractLabel').value = name+'.sol  ('+net.label+')';
}

/* ======================================================================
   TREASURY BUILDER VIEW (section 03, Phase 9.1) — presentation only, on the shared engine in builder.js.
   Reads the form, activeNetwork, multichainMode and the deploy buffer; writes none of them. genTreasury() and Deploy now are untouched.
   Particularities of this tab: the generator never refuses, it writes a DRAFT (placeholder signer, pendingSource.problems) that the deploy page
   blocks; "Accepted tokens" (tre_tokens) is not read by the generator; the gas-token alias is a constructor argument in the portable modes.
   ====================================================================== */
const TRE_STREAMING = {
  yes: { title: 'Payment streaming enabled', text: 'Adds Stream and CloseStream proposals next to Transfer and ReplaceSigner: a linear payout to a recipient over time. Stream totals are reserved, so proposals cannot spend funds that are owed to stream recipients.' },
  no:  { title: 'Vault multisig only', text: 'Proposals can Transfer funds and ReplaceSigner. There are no streams.' }
};

function treRead(){
  const g = (id) => { const el = document.getElementById(id); return el ? String(el.value) : ''; };
  const net = (typeof NETWORKS !== 'undefined' && NETWORKS[activeNetwork]) || null;
  const signersRaw = g('tre_signers').split('\n').map(s => s.trim()).filter(Boolean);
  return {
    net, signersRaw,
    signersField: g('tre_signers'),
    rawName: g('tre_name'),
    name: (g('tre_name') || 'ArcTreasury').replace(/[^A-Za-z0-9]/g, ''),
    threshold: (g('tre_threshold') || '1'), thresholdField: g('tre_threshold'),
    streaming: g('tre_streaming') === 'yes',
    portable: typeof isPortable === 'function' ? isPortable() : false,
    mode: (typeof MC_MODES !== 'undefined' && typeof multichainMode !== 'undefined' && MC_MODES[multichainMode]) ? MC_MODES[multichainMode].label : '',
    alias: (net && net.gasSymbol === 'USDC' && net.usdc) ? net.usdc : ''     // the same rule as genTreasury()
  };
}

/* What genTreasury() puts in pendingSource.problems, plus the checks that decide whether the contract compiles and its constructor accepts the threshold. */
function treSignerProblems(v){
  const out = typeof reqProblems === 'function' ? reqProblems(v.signersRaw.map((a, i) => ({ label: 'Signer ' + (i + 1), value: a, required: true })), true) : [];
  if(!v.signersRaw.length) out.push('Signers are required: enter one address per line');
  else if(Number.isInteger(Number(v.threshold)) && Number(v.threshold) > v.signersRaw.length) out.push('The threshold (' + v.threshold + ') is higher than the number of signers (' + v.signersRaw.length + ')');
  return out;
}
function treThresholdProblem(v){
  const T = String(v.threshold).trim();
  return (/^\d+$/.test(T) && Number(T) >= 1) ? '' : 'The approval threshold must be a whole number of at least 1, otherwise the contract does not compile or its constructor reverts';
}
function treProblems(v){ const out = treSignerProblems(v); const t = treThresholdProblem(v); if(t) out.push(t); return out; }
function treSig(v){ return JSON.stringify([v.rawName, v.thresholdField, v.signersField, v.streaming, typeof activeNetwork !== 'undefined' ? activeNetwork : '', v.mode]); }

const TRE_CONFIG = {
  key: 'treasury', prefix: 'bld',
  section: 'sec-treasury', codePanel: 'treasuryCode', summary: 'treSummary', progress: 'treProgress', stages: 'treStages',
  isTemplate: (tpl) => tpl === 'treasury',
  read: () => treRead(),
  problems: (v) => treProblems(v),
  signature: (v) => treSig(v),
  // the draft that is in the deploy buffer: the same list the deploy page uses to refuse it
  draft: () => (typeof pendingSource !== 'undefined' && pendingSource && pendingSource.template === 'treasury' && Array.isArray(pendingSource.problems)) ? pendingSource.problems : [],
  guidance(v){
    const n = v.signersRaw.length;
    const sp = treSignerProblems(v);
    const tp = treThresholdProblem(v);
    const note = document.getElementById('treSignersNote');
    if(!n){ note.textContent = 'Add at least one signer. If you generate anyway you get a DRAFT with a placeholder signer, and the deploy page refuses it.'; note.setAttribute('data-kind', 'warn'); }
    else if(sp.length){ note.textContent = sp[0] + (sp.length > 1 ? ' (+' + (sp.length - 1) + ' more)' : '') + '.'; note.setAttribute('data-kind', 'warn'); }
    else { note.textContent = n + (n === 1 ? ' signer.' : ' signers.') + ' Replacing a lost or compromised key is a proposal that needs the normal threshold, and approvals from a replaced signer stop counting.'; note.setAttribute('data-kind', 'info'); }
    const of = document.getElementById('treOf');
    const bad = !!tp || !n || Number(v.threshold) > n;
    of.textContent = (tp ? 'invalid' : v.threshold + ' of ' + n); of.setAttribute('data-bad', bad ? '1' : '0');
    const box = document.getElementById('treStream');
    const st = TRE_STREAMING[v.streaming ? 'yes' : 'no'];
    box.textContent = ''; box.appendChild(swbEl('b', '', st.title)); box.appendChild(document.createTextNode(st.text));
  },
  summaryRows(v, row){
    const n = v.signersRaw.length;
    const sp = treSignerProblems(v);
    const items = v.signersRaw.map((a, i) => ({ label: 'Signer ' + (i + 1), value: a, required: true }));
    const invalid = typeof reqProblems === 'function' ? reqProblems(items).length : 0;
    row('Project', v.name || '(empty)', v.name ? 'ok' : 'bad', v.name ? '' : 'Enter a name');
    if(!n) row('Signers', 'None yet', 'missing', 'Required: one address per line');
    else if(sp.length && (invalid || sp.some(p => /must be different/.test(p)))) row('Signers', invalid ? (n - invalid) + ' of ' + n + ' valid' : n + ' signers', 'bad', sp[0]);
    else row('Signers', n + (n === 1 ? ' signer' : ' signers'), 'ok');
    const tp = treThresholdProblem(v);
    if(tp) row('Approval', v.threshold + ' of ' + n, 'bad', 'Must be a whole number of at least 1');
    else if(!n) row('Approval', v.threshold + ' of 0', 'missing', 'Needs at least one signer');
    else if(Number(v.threshold) > n) row('Approval', v.threshold + ' of ' + n, 'bad', 'Higher than the number of signers');
    else row('Approval', v.threshold + ' of ' + n, 'ok', Number(v.threshold) === 1 && n > 1 ? 'A single signer can approve alone' : '');
    row('Streaming', v.streaming ? 'Enabled' : 'Disabled', 'ok');
    if(v.portable) row('Gas-token alias', 'Set at deploy time', 'ok', 'Constructor argument in ' + v.mode + ' mode');
    else if(v.alias) row('Gas-token alias', v.alias, 'ok', 'Payments must use the native currency, this ERC-20 address is refused', true);
    else row('Gas-token alias', 'None', 'ok', 'This network\'s gas token has no ERC-20 address');
    CFBuilder.networkRow(row, v.net);
    row('Deployment Mode', v.mode || 'Unknown', v.mode ? 'ok' : 'bad');
  }
};
CFBuilder.register(TRE_CONFIG);

/* ======================================================================
   SECTION 04 — VAULT (ERC-4626 minimal)
   ====================================================================== */
/* Parses a human-readable amount ("500" or "1.5") into the digits and fractional scale needed to express it in the
   token's base units as `digits * 10**decimals() / 10**scale`. Throws for a non-numeric amount. Normalizes the value:
   leading integer zeros and insignificant trailing fractional zeros are stripped (so "000500.250000" -> digits "50025",
   scale 2), which keeps Solidity literals valid (no 0-prefix octal) and minimises the fractional scale without changing
   the mathematical value. Meaningful fractional zeros are preserved. */
function scaleAmount(amount){
  const m = /^(\d+)(?:\.(\d+))?$/.exec(String(amount).trim());
  if(!m) throw new Error('portabilize: "' + amount + '" is not a number');
  const frac = (m[2] || '').replace(/0+$/, '');
  const scale = frac.length;
  const digits = (m[1] + frac).replace(/^0+/, '');
  return { digits, scale, isZero: digits === '' };
}

/* Solidity lines that validate the asset decimals and compute `name` in base units from `capS` (digits/scale), with
   exact-representation and overflow-safe ordering. Returns an array of lines (no leading indentation); callers indent
   them. `tokenExpr` is the token expression ("asset" in single mode, "IERC20(asset_)" in the portable modes). For a
   zero cap (unlimited) it returns an empty array. The order matters: decimals are validated BEFORE any exponentiation,
   and a positive cap is computed only after validation, so a sub-unit or nonrepresentable cap reverts instead of
   silently truncating. */
function scaledCtorLines(capS, name, tokenExpr){
  if(capS.isZero) return [];
  const d = capS.digits, s = capS.scale;
  const lines = [
    `uint8 _vltDec = ${tokenExpr}.decimals();`,
    'require(_vltDec <= 38, "asset decimals out of range");'
  ];
  if(s === 0){
    lines.push(`${name} = ${d} * 10**_vltDec;`);
  } else {
    // scale <= decimals: always exact (multiply). scale > decimals: divide only when the excess fractional digits are
    // all zero (no silent floor/ceiling), keeping the intermediate value inside uint256.
    lines.push(`if (_vltDec >= ${s}) { ${name} = ${d} * 10**(_vltDec - ${s}); } else { require(${d} % 10**(${s} - _vltDec) == 0, "deposit cap is not representable"); ${name} = ${d} / 10**(${s} - _vltDec); }`);
  }
  lines.push(`require(${name} > 0, "deposit cap is not representable");`);
  return lines;
}

function genVault(){
  const net=NETWORKS[activeNetwork];
  const name=(document.getElementById('vault_name').value||'ArcYieldVault').replace(/[^A-Za-z0-9]/g,'');
  const symbol=document.getElementById('vault_symbol').value||'avTKN';
  const asset=resolveToken(document.getElementById('vault_asset').value,'usdc');
  const vaultProblems=[reqTokenProblem('Asset', document.getElementById('vault_asset').value, asset, net.label)].filter(Boolean);
  const perf=document.getElementById('vault_perf').value||'0';
  const strategy=document.getElementById('vault_strategy').value;
  const cap=document.getElementById('vault_cap').value||'0';
  // The cap is human-readable asset units, scaled to base units by the asset's own decimals at deployment (never a fixed 6).
  const capS = scaleAmount(cap);
  // A positive cap is validated and computed in the constructor (not in a state-variable initializer), so the asset
  // decimals are checked before any exponentiation and a nonrepresentable cap reverts instead of silently truncating.
  const capLines = scaledCtorLines(capS, 'depositCap', 'asset');
  // In the portable modes the guard is added by portabilize (with the constructor asset), so the single-mode lines are
  // only emitted here for the single mode.
  const capGuardLines = (capLines.length === 0 || (typeof isPortable === 'function' && isPortable()))
    ? ''
    : capLines.map((l) => '        ' + l).join('\n') + '\n';

  if(!/^\d+$/.test(String(perf).trim()) || Number(perf) > 9999){
    alert('Performance fee must be a whole number of basis points from 0 to 9999 (1000 = 10%).');
    return;
  }

  let code = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function decimals() external view returns (uint8);
}

/// @title ${name} — ERC-4626-style Vault (deposit/withdraw with proportional shares)
/// @notice Generated by ContractForge for ${net.label} (chainId ${net.chainIdDec})
/// @dev Performance fee: ${perf} bps on each holder's gain (value above what they put in). Fees accrue in the vault and the owner collects them with claimFees().
///      Yield is not generated by this contract: assets that are transferred to it (by the owner or any strategy
///      you build around it) raise the share price. Share pricing uses virtual shares, so a first depositor
///      cannot inflate the price to steal later deposits. Shares are not transferable.
contract ${name} {
    string public name = "${name} Shares";
    string public symbol = "${symbol}";
    uint8  public decimals = 18;

    IERC20 public asset = IERC20(${asset});
    uint256 public totalSupply;      // total shares issued
    uint256 public depositCap; // 0 = unlimited (validated and computed in the constructor)
    uint256 public constant PERF_FEE_BPS = ${perf};
    /// @dev Virtual shares: 1e12 shares per smallest asset unit when the vault is empty (a fixed precision offset, independent of the asset's decimals).
    uint256 private constant SHARE_OFFSET = 1e12;
    address public owner;
    address public pendingOwner;

    mapping(address => uint256) public balanceOf;
    /// @notice Assets each holder has put in and not yet taken out (used to compute their gain).
    mapping(address => uint256) public costBasisOf;
    /// @notice Performance fees earned but not yet claimed. They are not part of totalAssets().
    uint256 public accruedFees;
    uint256 private _locked = 1;

    event Deposit(address indexed sender, address indexed owner, uint256 assets, uint256 shares);
    event Withdraw(address indexed sender, address indexed owner, uint256 assets, uint256 shares, uint256 perfFee);
    event DepositCapUpdated(uint256 oldCap, uint256 newCap);
    event FeesClaimed(address indexed to, uint256 amount);
    event OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier nonReentrant() {
        require(_locked == 1, "reentrant call");
        _locked = 2;
        _;
        _locked = 1;
    }

    constructor() {
        owner = msg.sender;
${capGuardLines}    }

    /// @notice Total assets that belong to share holders (unclaimed performance fees are excluded)
    function totalAssets() public view returns (uint256) {
        uint256 bal = asset.balanceOf(address(this));
        return bal > accruedFees ? bal - accruedFees : 0;
    }

    function convertToShares(uint256 assets) public view returns (uint256) {
        return (assets * (totalSupply + SHARE_OFFSET)) / (totalAssets() + 1);
    }

    function convertToAssets(uint256 shares) public view returns (uint256) {
        return (shares * (totalAssets() + 1)) / (totalSupply + SHARE_OFFSET);
    }

    /// @notice Deposits 'assets' of the underlying token and receives proportional shares
    function deposit(uint256 assets, address receiver) external returns (uint256 shares) {
        return _deposit(assets, receiver, 0);
    }

    /// @notice Same as deposit, but reverts if fewer than 'minShares' would be minted (protects against price changes before your transaction lands)
    function depositWithMin(uint256 assets, address receiver, uint256 minShares) external returns (uint256 shares) {
        return _deposit(assets, receiver, minShares);
    }

    /// @notice Burns 'shares' and returns proportional assets (with a performance fee on the gain)
    function redeem(uint256 shares, address receiver) external returns (uint256 assetsOut) {
        return _redeem(shares, receiver, 0);
    }

    /// @notice Same as redeem, but reverts if you would receive less than 'minAssets'
    function redeemWithMin(uint256 shares, address receiver, uint256 minAssets) external returns (uint256 assetsOut) {
        return _redeem(shares, receiver, minAssets);
    }

    function _deposit(uint256 assets, address receiver, uint256 minShares) private nonReentrant returns (uint256 shares) {
        require(assets > 0, "zero deposit");
        require(receiver != address(0), "zero receiver");
        uint256 assetsBefore = totalAssets();
        if (depositCap > 0) require(assetsBefore + assets <= depositCap, "exceeds deposit cap");

        _pull(assets);
        uint256 received = totalAssets() - assetsBefore; // what actually arrived (covers tokens that take a fee)
        shares = (received * (totalSupply + SHARE_OFFSET)) / (assetsBefore + 1);
        require(shares > 0, "zero shares");
        require(shares >= minShares, "slippage exceeded");

        totalSupply += shares;
        balanceOf[receiver] += shares;
        costBasisOf[receiver] += received;

        emit Deposit(msg.sender, receiver, received, shares);
    }

    function _redeem(uint256 shares, address receiver, uint256 minAssets) private nonReentrant returns (uint256 assetsOut) {
        require(shares > 0, "zero shares");
        require(receiver != address(0), "zero receiver");
        uint256 held = balanceOf[msg.sender];
        require(held >= shares, "insufficient shares");

        uint256 grossAssets = convertToAssets(shares);
        uint256 basis = (costBasisOf[msg.sender] * shares) / held; // what the redeemed shares cost this holder
        uint256 perfFee = 0;
        if (PERF_FEE_BPS > 0 && grossAssets > basis) {
            perfFee = ((grossAssets - basis) * PERF_FEE_BPS) / 10000;
        }
        assetsOut = grossAssets - perfFee;
        require(assetsOut >= minAssets, "slippage exceeded");

        balanceOf[msg.sender] = held - shares;
        totalSupply -= shares;
        costBasisOf[msg.sender] -= basis;

        if (perfFee > 0) accruedFees += perfFee; // claimed separately so a blocked fee address can never stop a withdrawal
        _push(receiver, assetsOut);

        emit Withdraw(msg.sender, receiver, assetsOut, shares, perfFee);
    }

    function setDepositCap(uint256 newCap) external {
        require(msg.sender == owner, "not owner");
        emit DepositCapUpdated(depositCap, newCap);
        depositCap = newCap;
    }

    /// @notice Sends the accrued performance fees to the owner. Anyone may call it.
    function claimFees() external nonReentrant returns (uint256 amount) {
        amount = accruedFees;
        require(amount > 0, "no fees");
        accruedFees = 0;
        _push(owner, amount);
        emit FeesClaimed(owner, amount);
    }

    /// @notice Starts a two-step ownership change; the new owner must call acceptOwnership().
    function transferOwnership(address newOwner) external {
        require(msg.sender == owner, "not owner");
        require(newOwner != address(0), "zero owner");
        pendingOwner = newOwner;
        emit OwnershipTransferStarted(owner, newOwner);
    }

    function acceptOwnership() external {
        require(msg.sender == pendingOwner, "not pending owner");
        emit OwnershipTransferred(owner, msg.sender);
        owner = msg.sender;
        pendingOwner = address(0);
    }

    function _pull(uint256 amount) private {
        _call(abi.encodeCall(IERC20.transferFrom, (msg.sender, address(this), amount)));
    }

    function _push(address to, uint256 amount) private {
        _call(abi.encodeCall(IERC20.transfer, (to, amount)));
    }

    /// @dev Works with tokens that return nothing (e.g. USDT) as well as tokens that return a bool.
    function _call(bytes memory data) private {
        (bool ok, bytes memory ret) = address(asset).call(data);
        require(ok && (ret.length == 0 || abi.decode(ret, (bool))), "token transfer failed");
    }
}`;

  code = portabilize(code, [
    { kind:'addr', name:'asset', type:'IERC20', value:asset, param:'asset_', hint:'usdc', userSet:!!document.getElementById('vault_asset').value.trim() },
    { kind:'scaled', name:'depositCap', expr:cap, tokenParam:'asset_', requireNonZero:true }
  ]);
  code = matStamp(code, 'vault');
  showCode('vaultCode', name+'.sol', code);
  pendingSource = { name, code, template: 'vault', problems: vaultProblems };
  renderCtorArgs();
  document.getElementById('pendingContractLabel').value = name+'.sol  ('+net.label+')';
}

/* ---- The Vault screen: one config for the shared engine (Phase 9.2). Read-only: it mirrors what genVault() checks and what the Solidity
   needs in order to compile, and never writes to the form or the buffer. Everything network-specific comes from NETWORKS. ---- */
const VLT_STRATEGY = {
  title: 'Manual yield',
  text: 'The contract does not earn yield by itself. Assets sent to the vault raise the share price, and performance fees accrue in the vault for the owner to collect with claimFees().'
};
const VLT_PERF_MSG = 'Performance fee must be a whole number of basis points from 0 to 9999 (1000 = 10%).';

function vltRead(){
  const g = (id) => { const el = document.getElementById(id); return el ? String(el.value) : ''; };
  const net = (typeof NETWORKS !== 'undefined' && NETWORKS[activeNetwork]) || null;
  const assetRaw = g('vault_asset').trim();
  const portable = typeof isPortable === 'function' ? isPortable() : false;
  return {
    net, assetRaw, portable,
    assetField: g('vault_asset'),
    asset: assetRaw || (net && net.usdc) || '',                     // the same rule as resolveToken(value, 'usdc')
    rawName: g('vault_name'), name: (g('vault_name') || 'ArcYieldVault').replace(/[^A-Za-z0-9]/g, ''),
    symbolField: g('vault_symbol'), symbol: g('vault_symbol') || 'avTKN',
    perfField: g('vault_perf'), perf: g('vault_perf') || '0',
    capField: g('vault_cap'), cap: g('vault_cap') || '0',
    strategy: g('vault_strategy'),
    mode: (typeof MC_MODES !== 'undefined' && typeof multichainMode !== 'undefined' && MC_MODES[multichainMode]) ? MC_MODES[multichainMode].label : ''
  };
}

function vltPerfProblem(v){ return (!/^\d+$/.test(String(v.perf).trim()) || Number(v.perf) > 9999) ? VLT_PERF_MSG : ''; }
function vltAssetProblem(v){
  return (typeof reqTokenProblem === 'function' && v.net) ? reqTokenProblem('Asset', v.assetField, v.asset, v.net.label) : '';
}
function vltSymbolProblem(v){
  return /["\\]/.test(v.symbol) ? 'Share symbol must not contain quotes or backslashes: it is written into a Solidity string and the contract would not compile.' : '';
}
/* Every mode scales the cap with the asset's own decimals at deployment; it accepts only digits with an optional decimal part (anything else makes genVault() throw). */
function vltCapProblem(v){
  const c = String(v.cap).trim();
  return /^\d+(\.\d+)?$/.test(c) ? '' : 'Deposit cap must be a plain number such as 500 or 1.5: any other form stops generation.';
}
function vltProblems(v){
  return [vltPerfProblem(v), vltCapProblem(v) && v.portable ? vltCapProblem(v) : '', vltAssetProblem(v), vltSymbolProblem(v), !v.portable ? vltCapProblem(v) : ''].filter(Boolean);
}
function vltSig(v){ return JSON.stringify([v.rawName, v.symbolField, v.assetField, v.perfField, v.capField, v.strategy, typeof activeNetwork !== 'undefined' ? activeNetwork : '', typeof multichainMode !== 'undefined' ? multichainMode : '']); }
/* The vault scales amounts by the asset's own decimals, so no network-specific decimal warning is needed. */
function vltDecimalsNote(v){
  return '';
}

const VLT_CONFIG = {
  key: 'vault', prefix: 'bld',
  section: 'sec-vault', codePanel: 'vaultCode', summary: 'vltSummary', progress: 'vltProgress', stages: 'vltStages',
  isTemplate: (tpl) => tpl === 'vault',
  read: () => vltRead(),
  problems: (v) => vltProblems(v),
  signature: (v) => vltSig(v),
  draft: () => (typeof pendingSource !== 'undefined' && pendingSource && pendingSource.template === 'vault' && Array.isArray(pendingSource.problems)) ? pendingSource.problems : [],
  guidance(v){
    const net = v.net ? v.net.label : 'this network';
    const note = document.getElementById('vltAssetNote');
    const ap = vltAssetProblem(v), dn = vltDecimalsNote(v);
    let t, kind = 'info';
    if(v.portable){ t = 'The portable modes ask for the asset as a constructor argument at deploy time, per network. What you type here (or the network default) is only the starting value.'; }
    else if(v.assetRaw){ t = ap ? ap + '.' : 'The vault holds this token. It must be an ERC-20 contract on ' + net + '.'; if(ap) kind = 'warn'; }
    else if(v.asset){ t = 'Empty: the vault uses USDC on ' + net + ' (' + v.asset + ').'; }
    else { t = net + ' has no default asset: enter the token address. Generating anyway writes a DRAFT that cannot be deployed.'; kind = 'warn'; }
    if(dn){ t += ' ' + dn; kind = 'warn'; }
    note.textContent = t; note.setAttribute('data-kind', kind);
    const pct = swbFeePercent(String(v.perf).trim());
    const chip = document.getElementById('vltPct');
    chip.textContent = pct ? '= ' + pct : 'invalid'; chip.setAttribute('data-bad', pct ? '0' : '1');
    const cn = document.getElementById('vltCapNote'), cp = vltCapProblem(v);
    const n = String(v.cap).trim();
    if(cp) cn.textContent = cp;
    else if(Number(n) === 0) cn.textContent = 'Unlimited: no deposit cap.';
    else cn.textContent = 'Cap: ' + n + ' tokens, multiplied by the asset\'s decimals() when the constructor runs.';
    const box = document.getElementById('vltStrategy');
    box.textContent = ''; box.appendChild(swbEl('b', '', VLT_STRATEGY.title)); box.appendChild(document.createTextNode(VLT_STRATEGY.text));
  },
  summaryRows(v, row){
    row('Project', v.name || '(empty)', v.name ? 'ok' : 'bad', v.name ? '' : 'Enter a name');
    const sp = vltSymbolProblem(v);
    row('Share symbol', v.symbol, sp ? 'bad' : 'ok', sp ? 'No quotes or backslashes' : '');
    const ap = vltAssetProblem(v), dn = vltDecimalsNote(v);
    if(v.portable) row('Asset', v.asset || 'Set at deploy time', ap ? 'bad' : 'ok', ap || 'Constructor argument, set per network at deploy time', !!v.asset);
    else if(ap) row('Asset', v.assetRaw || 'Missing', v.assetRaw ? 'bad' : 'missing', ap, !!v.assetRaw);
    else row('Asset', v.asset, 'ok', dn || (v.assetRaw ? '' : 'Network default (USDC)'), true);
    const pct = swbFeePercent(String(v.perf).trim());
    row('Performance fee', pct ? v.perf + ' bps (' + pct + ')' : (v.perf || '(empty)') + ' bps', pct ? 'ok' : 'bad', pct ? '' : 'Whole number from 0 to 9999: generation is refused otherwise');
    const cp = vltCapProblem(v), n = String(v.cap).trim();
    if(cp) row('Deposit cap', n || '(empty)', 'bad', cp);
    else row('Deposit cap', Number(n) === 0 ? 'Unlimited' : n + ' tokens', 'ok', Number(n) === 0 ? '' : 'Scaled by the asset decimals at deploy');
    row('Strategy', VLT_STRATEGY.title, 'ok');
    CFBuilder.networkRow(row, v.net);
    row('Deployment Mode', v.mode || 'Unknown', v.mode ? 'ok' : 'bad');
  }
};
CFBuilder.register(VLT_CONFIG);

/* ======================================================================
   SECTION 05 — MULTISEND
   ====================================================================== */
function genMultisend(){
  const net=NETWORKS[activeNetwork];
  const name=(document.getElementById('ms_name').value||'ArcMultiSend').replace(/[^A-Za-z0-9]/g,'');
  const mode=document.getElementById('ms_mode').value;
  const maxRecipients=document.getElementById('ms_max').value||'200';
  const feeBps=document.getElementById('ms_fee').value||'0';
  const feeOwner=document.getElementById('ms_owner').value.trim();
  const msProblems=reqProblems([{ label:'Fee recipient', value:feeOwner }]);

  let code = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

/// @title ${name} — Batch payments (multisend)
/// @notice Generated by ContractForge for ${net.label} (chainId ${net.chainIdDec})
/// @dev Max ${maxRecipients} recipients per transaction${feeBps!=='0'?`, service fee of ${feeBps} bps`:''}
contract ${name} {
    uint256 public constant MAX_RECIPIENTS = ${maxRecipients};
    uint256 public constant FEE_BPS = ${feeBps};
    address public feeRecipient = ${feeOwner || 'msg.sender'};
${(mode==='native' || mode==='both') ? `    /// @notice Gas given to each recipient of a native payment. Enough for a normal contract wallet; a recipient that
    ///         burns gas fails its own payment instead of using up the whole transaction.
    uint256 public constant NATIVE_TRANSFER_GAS = 200000;
` : ''}
    event BatchSent(address indexed sender, address token, uint256 totalAmount, uint256 recipients);
`;

  if(mode==='erc20' || mode==='both'){
    code += `
    /// @notice Sends \`amounts[i]\` of \`token\` to \`recipients[i]\`. Requires prior approve to this contract.
    ///         The tokens go straight from you to each recipient: this contract never holds them. If any single
    ///         transfer fails (for example a recipient blocked by the token) the whole batch reverts.
    ///         Tokens that charge a fee on transfer deliver less than listed; use plain tokens such as USDC.
    function multiSendToken(address token, address[] calldata recipients, uint256[] calldata amounts) external {
        require(token.code.length > 0, "token is not a contract");
        require(recipients.length == amounts.length, "length mismatch");
        require(recipients.length <= MAX_RECIPIENTS, "too many recipients");

        uint256 total = 0;
        for (uint256 i = 0; i < amounts.length; i++) total += amounts[i];

        uint256 fee = (FEE_BPS > 0) ? (total * FEE_BPS) / 10000 : 0;

        emit BatchSent(msg.sender, token, total, recipients.length);
        for (uint256 i = 0; i < recipients.length; i++) {
            _pay(token, recipients[i], amounts[i]);
        }
        if (fee > 0) _pay(token, feeRecipient, fee);
    }

    /// @dev Pulls from the caller to \`to\`; works with tokens that return nothing (e.g. USDT) as well as bool tokens.
    function _pay(address token, address to, uint256 amount) private {
        (bool ok, bytes memory ret) = token.call(abi.encodeCall(IERC20.transferFrom, (msg.sender, to, amount)));
        require(ok && (ret.length == 0 || abi.decode(ret, (bool))), "transferFrom failed");
    }
`;
  }

  if(mode==='native' || mode==='both'){
    code += `
    /// @notice Sends the network's native token (gas token) to multiple recipients. Send msg.value = sum(amounts) + fee.
    function multiSendNative(address[] calldata recipients, uint256[] calldata amounts) external payable {
        require(recipients.length == amounts.length, "length mismatch");
        require(recipients.length <= MAX_RECIPIENTS, "too many recipients");

        uint256 total = 0;
        for (uint256 i = 0; i < amounts.length; i++) total += amounts[i];

        uint256 fee = (FEE_BPS > 0) ? (total * FEE_BPS) / 10000 : 0;
        require(msg.value >= total + fee, "insufficient value sent");

        for (uint256 i = 0; i < recipients.length; i++) {
            (bool ok, ) = recipients[i].call{value: amounts[i], gas: NATIVE_TRANSFER_GAS}("");
            require(ok, "native transfer failed");
        }
        if (fee > 0) {
            (bool okFee, ) = feeRecipient.call{value: fee}("");
            require(okFee, "fee transfer failed");
        }

        // return change, if any
        uint256 leftover = msg.value - total - fee;
        if (leftover > 0) {
            (bool okRefund, ) = msg.sender.call{value: leftover}("");
            require(okRefund, "refund failed");
        }

        emit BatchSent(msg.sender, address(0), total, recipients.length);
    }
`;
  }

  code += `}`;

  code = portabilize(code, []);
  code = matStamp(code, 'multisend');
  showCode('multisendCode', name+'.sol', code);
  pendingSource = { name, code, template: 'multisend', problems: msProblems };
  renderCtorArgs();
  document.getElementById('pendingContractLabel').value = name+'.sol  ('+net.label+')';
}

/* ---- The MultiSend screen: one config for the shared engine (Phase 9.3). Read-only: it mirrors what genMultisend() checks and what the
   Solidity needs in order to compile. The contract has no token address and no network logic of its own: the token is an argument of each
   call, the network only appears in a comment, and the Deployment Mode does not change it (no constructor argument in any mode). ---- */
const MSL_MODES = {
  erc20: { label: 'ERC-20 only', title: 'ERC-20 batch (multiSendToken)', text: 'Pays many recipients in any ERC-20 with one call. The sender approves this contract first, and the tokens go straight from the sender to each recipient: the contract never holds them. If one transfer fails, the whole batch reverts.' },
  native: { label: 'Native token only', title: 'Native-token batch (multiSendNative)', text: 'Pays many recipients in the network\'s gas token with one call. The sender sends msg.value covering the amounts plus the fee, and any change is returned. Each recipient gets a fixed gas allowance, so a recipient that burns gas fails its own payment.' },
  both:   { label: 'Native + ERC-20', title: 'Both batches', text: 'Includes multiSendToken and multiSendNative, each working as described for its mode.' }
};

function mslRead(){
  const g = (id) => { const el = document.getElementById(id); return el ? String(el.value) : ''; };
  const net = (typeof NETWORKS !== 'undefined' && NETWORKS[activeNetwork]) || null;
  const mode = MSL_MODES[g('ms_mode')] ? g('ms_mode') : 'erc20';
  return {
    net, mode,
    rawName: g('ms_name'), name: (g('ms_name') || 'ArcMultiSend').replace(/[^A-Za-z0-9]/g, ''),
    maxField: g('ms_max'), max: (g('ms_max') || '200').trim(),
    feeField: g('ms_fee'), fee: (g('ms_fee') || '0').trim(),
    ownerField: g('ms_owner'), owner: g('ms_owner').trim(),
    dmode: (typeof MC_MODES !== 'undefined' && typeof multichainMode !== 'undefined' && MC_MODES[multichainMode]) ? MC_MODES[multichainMode].label : ''
  };
}
const mslWhole = (s) => /^\d+$/.test(s);
function mslOwnerProblems(v){ return typeof reqProblems === 'function' ? reqProblems([{ label: 'Fee recipient', value: v.owner }]) : []; }
function mslMaxProblem(v){
  if(!mslWhole(v.max)) return 'Max recipients must be a whole number of at least 1: the value is written into the Solidity as it is, and anything else does not compile.';
  return Number(v.max) < 1 ? 'Max recipients of 0 means no batch could ever be sent: use at least 1.' : '';
}
function mslFeeProblem(v){ return mslWhole(v.fee) ? '' : 'Service fee must be a whole number of basis points: the value is written into the Solidity as it is, and anything else does not compile.'; }
function mslProblems(v){ return [...mslOwnerProblems(v), mslMaxProblem(v), mslFeeProblem(v)].filter(Boolean); }
function mslSig(v){ return JSON.stringify([v.rawName, v.mode, v.maxField, v.feeField, v.ownerField, typeof activeNetwork !== 'undefined' ? activeNetwork : '', typeof multichainMode !== 'undefined' ? multichainMode : '']); }
const mslPercent = (fee) => mslWhole(fee) ? (Number(fee) / 100).toFixed(2) + '%' : null;

const MSL_CONFIG = {
  key: 'multisend', prefix: 'bld',
  section: 'sec-multisend', codePanel: 'multisendCode', summary: 'mslSummary', progress: 'mslProgress', stages: 'mslStages',
  isTemplate: (tpl) => tpl === 'multisend',
  read: () => mslRead(),
  problems: (v) => mslProblems(v),
  signature: (v) => mslSig(v),
  draft: () => (typeof pendingSource !== 'undefined' && pendingSource && pendingSource.template === 'multisend' && Array.isArray(pendingSource.problems)) ? pendingSource.problems : [],
  guidance(v){
    const m = MSL_MODES[v.mode], card = document.getElementById('mslModeCard');
    card.textContent = ''; card.appendChild(swbEl('b', '', m.title)); card.appendChild(document.createTextNode(m.text));
    const pct = mslPercent(v.fee), chip = document.getElementById('mslPct');
    chip.textContent = pct ? '= ' + pct : 'invalid'; chip.setAttribute('data-bad', pct ? '0' : '1');
    const mp = mslMaxProblem(v);
    document.getElementById('mslMaxNote').textContent = mp || 'At most ' + v.max + ' recipients per transaction. A larger batch costs more gas and has to fit in one block.';
    const op = mslOwnerProblems(v), note = document.getElementById('mslOwnerNote');
    if(op.length) note.textContent = op[0] + '.';
    else if(!v.owner) note.textContent = 'Empty: the deployer receives the fee. The contract has no function to change the fee recipient later.';
    else note.textContent = 'This address receives the fee. The contract has no function to change it later.';
  },
  summaryRows(v, row){
    const m = MSL_MODES[v.mode], net = v.net;
    row('Project', v.name || '(empty)', v.name ? 'ok' : 'bad', v.name ? '' : 'Enter a name');
    row('Payment mode', m.label, 'ok', v.mode === 'erc20' ? '' : 'The sender pays with msg.value');
    row('Native token', v.mode === 'erc20' ? 'Not used' : (net ? net.gasSymbol : 'Unknown'), 'ok', v.mode !== 'erc20' && net && net.gasSymbol === 'USDC' ? 'On this network the gas token is USDC' : '');
    const mp = mslMaxProblem(v);
    row('Max recipients', mp ? (v.max || '(empty)') : v.max + ' per transaction', mp ? 'bad' : 'ok', mp);
    const fp = mslFeeProblem(v), pct = mslPercent(v.fee);
    if(fp) row('Service fee', v.fee || '(empty)', 'bad', fp);
    else if(Number(v.fee) === 0) row('Service fee', 'No fee', 'ok');
    else row('Service fee', v.fee + ' bps (' + pct + ')', 'ok', Number(v.fee) > 10000 ? 'More than 100% of the batch total, charged on top' : 'Charged on top of the batch total');
    const op = mslOwnerProblems(v);
    if(Number(v.fee) === 0 && !op.length) row('Fee recipient', v.owner || 'Not used (no fee)', 'ok', v.owner ? 'Not used while the fee is 0' : '', !!v.owner);
    else if(op.length) row('Fee recipient', v.owner, 'bad', op[0], true);
    else row('Fee recipient', v.owner || 'The deployer', 'ok', v.owner ? 'Fixed at deploy time' : 'The account that deploys: fixed at deploy time', !!v.owner);
    CFBuilder.networkRow(row, v.net);
    row('Deployment Mode', v.dmode || 'Unknown', v.dmode ? 'ok' : 'bad', v.dmode ? 'This contract is the same in every mode' : '');
  }
};
CFBuilder.register(MSL_CONFIG);

/* ======================================================================
   SECTION 06 — CROSSCHAIN PAYMENTS (CCTP)
   ====================================================================== */
function genCrosschain(){
  if(isPortable()){ genCrosschainV2(); return; }
  const net=NETWORKS[activeNetwork];
  const name=(document.getElementById('cc_name').value||'ArcCrossPay').replace(/[^A-Za-z0-9]/g,'');
  const ccField = (id, fallback) => document.getElementById(id).value.trim() || fallback || '';
  const tokenMessenger = ccField('cc_tokenmessenger', net.cctp.tokenMessenger) || REQ_DRAFT_ADDR.a;   // a draft only: see required.js
  const msgTransmitter = ccField('cc_msgtransmitter', net.cctp.messageTransmitter) || REQ_DRAFT_ADDR.a;
  const usdc = ccField('cc_usdc', net.usdc) || REQ_DRAFT_ADDR.a;
  const ccProblems = reqProblems([
    { label:'Token Messenger', value:ccField('cc_tokenmessenger', net.cctp.tokenMessenger), required:true },
    { label:'Message Transmitter', value:ccField('cc_msgtransmitter', net.cctp.messageTransmitter), required:true },
    { label:'USDC', value:ccField('cc_usdc', net.usdc), required:true }
  ]).map(p => p.replace(/ is required$/, ' is required: '+net.label+' has no default for it'));
  const mode = document.getElementById('cc_mode').value;
  const resume = document.getElementById('cc_resume').value==='yes';

  let code = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
}

/// @dev Minimal TokenMessenger CCTP v2 interface (Circle)
interface ITokenMessenger {
    function depositForBurn(
        uint256 amount,
        uint32 destinationDomain,
        bytes32 mintRecipient,
        address burnToken
    ) external returns (uint64 nonce);
}

/// @dev Minimal MessageTransmitter CCTP interface (receive/attestation)
interface IMessageTransmitter {
    function receiveMessage(bytes calldata message, bytes calldata attestation) external returns (bool success);
}

/// @title ${name} — Crosschain payments via Circle CCTP
/// @notice Generated by ContractForge for ${net.label} (chainId ${net.chainIdDec})
/// @dev TokenMessenger: ${tokenMessenger} · MessageTransmitter: ${msgTransmitter} · Local USDC: ${usdc}
contract ${name} {
    ITokenMessenger public tokenMessenger = ITokenMessenger(${tokenMessenger});
    IMessageTransmitter public messageTransmitter = IMessageTransmitter(${msgTransmitter});
    IERC20 public usdc = IERC20(${usdc});
    address public owner;
    /// @notice The account offered the owner role by transferOwnership(); it has no powers until it calls acceptOwnership().
    address public pendingOwner;

    event BurnInitiated(address indexed sender, uint256 amount, uint32 destinationDomain, bytes32 mintRecipient, uint64 nonce);
    event MintReceived(bytes32 indexed messageHash);
    event OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event OwnershipTransferCancelled(address indexed previousOwner, address indexed pendingOwner);
`;

  if(resume){
    code += `
    // ---------------- Persistent state for resuming interrupted burns ----------------
    struct PendingBurn {
        address sender;
        uint256 amount;
        uint32 destinationDomain;
        bytes32 mintRecipient;
        uint64 nonce;
        bool attested; // set to true when attestation is confirmed off-chain and mint executed at destination
    }
    PendingBurn[] public pendingBurns;

    event PendingBurnRecorded(uint256 indexed id, uint64 nonce);
    event PendingBurnResolved(uint256 indexed id);
`;
  }

  if(mode==='payment'){
    code += `
    /// @notice Initiates a crosschain transfer: burns local USDC and emits a message to the Arc/CCTP relay
    /// @param amount value in USDC units (6 decimals)
    /// @param destinationDomain CCTP destination domain (e.g. Arc — see docs.arc.io)
    /// @param mintRecipient address (bytes32, left-padded) that receives USDC on the destination network
    function sendCrossChain(uint256 amount, uint32 destinationDomain, bytes32 mintRecipient) external returns (uint64 nonce) {
        require(amount > 0, "zero amount");
        require(usdc.transferFrom(msg.sender, address(this), amount), "transferFrom failed");
        require(usdc.approve(address(tokenMessenger), amount), "approve failed");

        nonce = tokenMessenger.depositForBurn(amount, destinationDomain, mintRecipient, address(usdc));

        ${resume ? `pendingBurns.push(PendingBurn({
            sender: msg.sender,
            amount: amount,
            destinationDomain: destinationDomain,
            mintRecipient: mintRecipient,
            nonce: nonce,
            attested: false
        }));
        emit PendingBurnRecorded(pendingBurns.length - 1, nonce);
` : ''}
        emit BurnInitiated(msg.sender, amount, destinationDomain, mintRecipient, nonce);
    }

    /// @notice Completes the mint on the destination network after Iris API attestation (called by relayer/user)
    function receiveCrossChain(bytes calldata message, bytes calldata attestation) external returns (bool) {
        bool ok = messageTransmitter.receiveMessage(message, attestation);
        require(ok, "receiveMessage failed");
        emit MintReceived(keccak256(message));
        return ok;
    }
`;
    if(resume){
      code += `
    /// @notice Marks a pending burn as resolved after the mint at the destination is confirmed
    function markResolved(uint256 id) external {
        PendingBurn storage b = pendingBurns[id];
        require(msg.sender == b.sender || msg.sender == owner, "not authorized");
        require(!b.attested, "already resolved");
        b.attested = true;
        emit PendingBurnResolved(id);
    }

    function pendingBurnsLength() external view returns (uint256) { return pendingBurns.length; }

    /// @notice Returns unresolved burns for polling resumption
    function unresolvedBurns() external view returns (uint256[] memory ids) {
        uint256 count = 0;
        for (uint256 i = 0; i < pendingBurns.length; i++) if (!pendingBurns[i].attested) count++;
        ids = new uint256[](count);
        uint256 j = 0;
        for (uint256 i = 0; i < pendingBurns.length; i++) {
            if (!pendingBurns[i].attested) { ids[j] = i; j++; }
        }
    }
`;
    }
  }

  else if(mode==='escrow'){
    code += `
    struct CrossEscrow {
        address sender;
        address beneficiary;  // who can confirm release at the source
        uint256 amount;
        uint32 destinationDomain;
        bytes32 mintRecipient;
        bool released;
        bool burned;
        uint64 nonce;
    }
    CrossEscrow[] public escrows;

    event EscrowCreated(uint256 indexed id, address sender, uint256 amount, uint32 destinationDomain);
    event EscrowReleased(uint256 indexed id, uint64 nonce);

    /// @notice Creates a crosschain escrow: funds are held until released
    function createEscrow(uint256 amount, address beneficiary, uint32 destinationDomain, bytes32 mintRecipient) external returns (uint256 id) {
        require(amount > 0, "zero amount");
        require(usdc.transferFrom(msg.sender, address(this), amount), "transferFrom failed");
        id = escrows.length;
        escrows.push(CrossEscrow({
            sender: msg.sender, beneficiary: beneficiary, amount: amount,
            destinationDomain: destinationDomain, mintRecipient: mintRecipient,
            released: false, burned: false, nonce: 0
        }));
        emit EscrowCreated(id, msg.sender, amount, destinationDomain);
    }

    /// @notice Beneficiary (or sender) releases the escrow: triggers the CCTP burn to the destination
    function releaseEscrow(uint256 id) external returns (uint64 nonce) {
        CrossEscrow storage e = escrows[id];
        require(!e.burned, "already released");
        require(msg.sender == e.beneficiary || msg.sender == e.sender, "not authorized");

        require(usdc.approve(address(tokenMessenger), e.amount), "approve failed");
        nonce = tokenMessenger.depositForBurn(e.amount, e.destinationDomain, e.mintRecipient, address(usdc));

        e.burned = true; e.released = true; e.nonce = nonce;
        emit EscrowReleased(id, nonce);
    }

    function receiveCrossChain(bytes calldata message, bytes calldata attestation) external returns (bool) {
        bool ok = messageTransmitter.receiveMessage(message, attestation);
        require(ok, "receiveMessage failed");
        emit MintReceived(keccak256(message));
        return ok;
    }

    function escrowsLength() external view returns (uint256) { return escrows.length; }
`;
  }

  else if(mode==='recurring'){
    code += `
    struct Subscription {
        address payer;
        uint256 amount;          // per period, in USDC (6 decimals)
        uint256 periodDuration;  // seconds
        uint256 nextPayment;
        uint32 destinationDomain;
        bytes32 mintRecipient;
        bool active;
    }
    Subscription[] public subscriptions;

    event SubscriptionCreated(uint256 indexed id, address payer, uint256 amount, uint256 periodDuration);
    event SubscriptionCharged(uint256 indexed id, uint64 nonce);
    event SubscriptionCancelled(uint256 indexed id);

    /// @notice Creates a recurring subscription that sends USDC crosschain every period
    function createSubscription(uint256 amount, uint256 periodDuration, uint32 destinationDomain, bytes32 mintRecipient) external returns (uint256 id) {
        require(amount > 0 && periodDuration > 0, "invalid params");
        id = subscriptions.length;
        subscriptions.push(Subscription({
            payer: msg.sender, amount: amount, periodDuration: periodDuration,
            nextPayment: block.timestamp, destinationDomain: destinationDomain,
            mintRecipient: mintRecipient, active: true
        }));
        emit SubscriptionCreated(id, msg.sender, amount, periodDuration);
    }

    /// @notice Executes the charge for the current period (callable by any relayer/cron when due)
    function charge(uint256 id) external returns (uint64 nonce) {
        Subscription storage s = subscriptions[id];
        require(s.active, "inactive");
        require(block.timestamp >= s.nextPayment, "not due yet");

        require(usdc.transferFrom(s.payer, address(this), s.amount), "transferFrom failed");
        require(usdc.approve(address(tokenMessenger), s.amount), "approve failed");
        nonce = tokenMessenger.depositForBurn(s.amount, s.destinationDomain, s.mintRecipient, address(usdc));

        s.nextPayment += s.periodDuration;
        emit SubscriptionCharged(id, nonce);
    }

    function cancelSubscription(uint256 id) external {
        Subscription storage s = subscriptions[id];
        require(msg.sender == s.payer, "not payer");
        s.active = false;
        emit SubscriptionCancelled(id);
    }

    function receiveCrossChain(bytes calldata message, bytes calldata attestation) external returns (bool) {
        bool ok = messageTransmitter.receiveMessage(message, attestation);
        require(ok, "receiveMessage failed");
        emit MintReceived(keccak256(message));
        return ok;
    }

    function subscriptionsLength() external view returns (uint256) { return subscriptions.length; }
`;
  }

  code += `
    constructor() { owner = msg.sender; }

    /// @notice Offer the owner role (markResolved) to newOwner; it takes effect when newOwner accepts.
    function transferOwnership(address newOwner) external {
        require(msg.sender == owner, "not owner");
        require(newOwner != address(0) && newOwner != owner && newOwner != address(this), "invalid new owner");
        pendingOwner = newOwner;
        emit OwnershipTransferStarted(owner, newOwner);
    }

    /// @notice Take over the owner role after being offered it.
    function acceptOwnership() external {
        require(msg.sender == pendingOwner && msg.sender != address(0), "not pending owner");
        emit OwnershipTransferred(owner, msg.sender);
        owner = msg.sender;
        pendingOwner = address(0);
    }

    /// @notice The current owner cancels a pending transfer.
    function cancelOwnershipTransfer() external {
        require(msg.sender == owner, "not owner");
        emit OwnershipTransferCancelled(owner, pendingOwner);
        pendingOwner = address(0);
    }
}`;

  code = portabilize(code, []);
  code = matStamp(code, 'crosschain');
  showCode('crosschainCode', name+'.sol', code);
  pendingSource = { name, code, template: 'crosschain', problems: ccProblems };
  document.getElementById('pendingContractLabel').value = name+'.sol  ('+net.label+')';
  renderCtorArgs();
}

/* ---- The Crosschain screen: one config for the shared engine (Phase 9.4). Read-only: it mirrors what genCrosschain() does in each mode.
   Single network mode writes the payments contract (template 'crosschain'): CCTP V1 addresses from NETWORKS[*].cctp, three functionalities,
   optional resume, and a draft when an address is missing. Every other mode writes the CCTP V2 bridge (template 'bridge'), which does NOT use
   the functionality or the resume choice, takes the three addresses as constructor arguments and has CCTP V2 data only for the networks in
   CCTP_DOMAINS. ---- */
const CCX_MODES = {
  payment:   { label: 'Direct payment', title: 'Direct crosschain payment', text: 'sendCrossChain burns USDC here and CCTP mints it to the recipient on the destination chain. The destination domain and the recipient are arguments of each call.' },
  escrow:    { label: 'Escrow', title: 'Crosschain escrow', text: 'createEscrow holds the USDC for a beneficiary and releaseEscrow burns it towards the destination chain once the escrow is released.' },
  recurring: { label: 'Recurring payments', title: 'Recurring crosschain payments', text: 'createSubscription sets up a payment every period and charge burns each instalment towards the destination chain. The payer can cancel.' }
};
const CCX_BRIDGE = { title: 'CCTP V2 bridge', text: 'The portable modes write the CCTP V2 bridge. It does not use this choice: payment, escrow and recurring payments only exist in Single network mode.' };

function ccxRead(){
  const g = (id) => { const el = document.getElementById(id); return el ? String(el.value) : ''; };
  const net = (typeof NETWORKS !== 'undefined' && NETWORKS[activeNetwork]) || null;
  const portable = typeof isPortable === 'function' ? isPortable() : false;
  const v2 = (typeof cctpV2 === 'function' && net) ? cctpV2(activeNetwork) : null;
  const cctp = (net && net.cctp) || {};
  const tmField = g('cc_tokenmessenger'), mtField = g('cc_msgtransmitter'), usdcField = g('cc_usdc');
  return {
    net, portable, v2,
    rawName: g('cc_name'), name: (g('cc_name') || 'ArcCrossPay').replace(/[^A-Za-z0-9]/g, ''),
    mode: CCX_MODES[g('cc_mode')] ? g('cc_mode') : 'payment',
    resume: g('cc_resume') === 'yes',
    tmField, mtField, usdcField,
    tm: tmField.trim(), mt: mtField.trim(), usdc: usdcField.trim(),
    defTm: cctp.tokenMessenger || '', defMt: cctp.messageTransmitter || '', defUsdc: (net && net.usdc) || '',
    dmode: (typeof MC_MODES !== 'undefined' && typeof multichainMode !== 'undefined' && MC_MODES[multichainMode]) ? MC_MODES[multichainMode].label : ''
  };
}
/* What genCrosschain() records: in the single mode the three addresses are required (typed, or the network's V1 table, or the USDC default);
   in the portable modes only a typed, malformed address is a problem. */
function ccxProblems(v){
  if(typeof reqProblems !== 'function' || !v.net) return [];
  if(v.portable) return reqProblems([{ label: 'Token Messenger', value: v.tm }, { label: 'Message Transmitter', value: v.mt }, { label: 'USDC', value: v.usdc }]);
  return reqProblems([
    { label: 'Token Messenger', value: v.tm || v.defTm, required: true },
    { label: 'Message Transmitter', value: v.mt || v.defMt, required: true },
    { label: 'USDC', value: v.usdc || v.defUsdc, required: true }
  ]).map(p => p.replace(/ is required$/, ' is required: ' + v.net.label + ' has no default for it'));
}
function ccxSig(v){ return JSON.stringify([v.rawName, v.mode, v.resume, v.tmField, v.mtField, v.usdcField, typeof activeNetwork !== 'undefined' ? activeNetwork : '', typeof multichainMode !== 'undefined' ? multichainMode : '']); }

const CCX_CONFIG = {
  key: 'crosschain', prefix: 'bld',
  section: 'sec-crosschain', codePanel: 'crosschainCode', summary: 'ccxSummary', progress: 'ccxProgress', stages: 'ccxStages',
  isTemplate: (tpl) => tpl === 'crosschain' || tpl === 'bridge',
  read: () => ccxRead(),
  problems: (v) => ccxProblems(v),
  signature: (v) => ccxSig(v),
  draft: () => (typeof pendingSource !== 'undefined' && pendingSource && (pendingSource.template === 'crosschain' || pendingSource.template === 'bridge') && Array.isArray(pendingSource.problems)) ? pendingSource.problems : [],
  guidance(v){
    const net = v.net ? v.net.label : 'this network';
    const card = document.getElementById('ccxModeCard'), m = v.portable ? CCX_BRIDGE : CCX_MODES[v.mode];
    card.textContent = ''; card.appendChild(swbEl('b', '', m.title)); card.appendChild(document.createTextNode(m.text));
    const note = document.getElementById('ccxSetupNote'); let t, kind = 'info';
    if(v.portable){
      t = 'The CCTP V2 bridge takes the three addresses as constructor arguments, set per network at deploy time. What you type below is only the starting value.';
      t += v.v2 ? ' ' + net + ' has CCTP V2 (domain ' + v.v2.domain + '): its Circle addresses are filled in on the deploy page.' : ' ' + net + ' has no CCTP V2 deployment in this app: you will have to enter the TokenMessenger and MessageTransmitter on the deploy page.';
      if(!v.v2) kind = 'warn';
    } else if(v.defTm && v.defMt){
      t = 'Single network mode uses the CCTP V1 addresses this app has for ' + net + '. Typing an address overrides it.';
    } else {
      t = net + ' is not in this app\'s CCTP V1 address table: enter the TokenMessenger and MessageTransmitter, or generate a DRAFT that cannot be deployed.';
      if(v.v2) t += ' The portable modes use CCTP V2, which ' + net + ' has.';
      kind = 'warn';
    }
    note.textContent = t; note.setAttribute('data-kind', kind);
    document.getElementById('ccxResumeNote').textContent = v.portable ? 'Not used by the CCTP V2 bridge: it only applies to the payments contract in Single network mode.' : 'Keeps the burn in contract storage so an interrupted transfer can be resumed once the attestation is ready.';
  },
  summaryRows(v, row){
    const net = v.net;
    row('Project', v.name || '(empty)', v.name ? 'ok' : 'bad', v.name ? '' : 'Enter a name');
    row('Contract', v.portable ? 'CCTP V2 bridge' : CCX_MODES[v.mode].title, 'ok', v.portable ? 'Portable modes write the bridge' : 'Single network mode');
    if(v.portable){ row('Functionality', 'Not used', 'ok', 'The V2 bridge has no payment, escrow or recurring choice'); row('Resume burns', 'Not used', 'ok'); }
    else { row('Functionality', CCX_MODES[v.mode].label, 'ok'); row('Resume burns', v.resume ? 'Yes' : 'No', 'ok'); }
    row('CCTP V2', v.v2 ? 'Supported (domain ' + v.v2.domain + ')' : 'Not available', v.v2 ? 'ok' : 'missing', v.v2 ? '' : 'No CCTP V2 deployment for this network in the app');
    const addr = (label, typed, def, v2val, problemLabel) => {
      if(v.portable){
        if(typed) row(label, typed, 'ok', 'Starting value for the constructor argument', true);
        else if(v2val) row(label, v2val, 'ok', 'CCTP V2 default, set per network at deploy time', true);
        else row(label, 'Enter on the deploy page', 'missing', 'No default for this network');
      } else {
        const probs = ccxProblems(v).filter(p => p.indexOf(problemLabel) === 0);
        if(probs.length) row(label, typed || 'Missing', typed ? 'bad' : 'missing', probs[0], !!typed);
        else row(label, typed || def, 'ok', typed ? '' : 'Network default', true);
      }
    };
    addr('Token Messenger', v.tm, v.defTm, v.v2 && v.v2.tokenMessenger, 'Token Messenger');
    addr('Message Transmitter', v.mt, v.defMt, v.v2 && v.v2.messageTransmitter, 'Message Transmitter');
    addr('Local USDC', v.usdc, v.defUsdc, v.defUsdc, 'USDC');
    CFBuilder.networkRow(row, v.net);
    row('Deployment Mode', v.dmode || 'Unknown', v.dmode ? 'ok' : 'bad');
  }
};
CFBuilder.register(CCX_CONFIG);

/* ---- The Simple contracts screen (Phase 9.5). Eight templates behind one tab: the cards and the form are drawn by script (renderSimpleGrid,
   renderSimpleForm) and stay exactly as they were; this config only reads whatever form is on screen, so the overview, the notes and the
   progress follow the template you picked. Read-only: it never writes to the form or the buffer.
   What the audit found, per kind of field (each one verified by compiling the generated Solidity):
     W  whole number >= 0      a fraction or a negative value does not compile
     N  number >= 0            a negative value does not compile (a fraction is fine)
     P  number >= 0, 6 decimals at most, "scaled" by the token decimals: more decimals do not compile; the portable modes accept only digits
        with an optional decimal part and THROW otherwise (portabilize)
     S  text written into a Solidity string: a quote or a backslash does not compile
   Some checks are refusals (an alert, nothing generated): the DAO voting period and the four Smart Wallet limits. Missing addresses write a DRAFT. ---- */
const SMP_SPEC = {
  erc20: { title: 'ERC-20 Token', ctor: [], fields: [
    { id: 's_name', label: 'Token name', kind: 'name', def: 'ArcToken' },
    { id: 's_symbol', label: 'Symbol', kind: 'S', def: 'ARC' },
    { id: 's_decimals', label: 'Decimals', kind: 'W', def: '18', max: 255, why: 'the decimals are a uint8' },
    { id: 's_supply', label: 'Initial supply', kind: 'N', def: '0', note: 'Written as supply × 10^decimals' },
    { id: 's_cap', label: 'Max cap', kind: 'N', def: '0', zero: 'No limit', note: 'Written as cap × 10^decimals' },
    { id: 's_burn', label: 'Burn', kind: 'sel', map: { yes: 'Allowed', no: 'Not allowed' } }],
    notes: ['Owner-controlled mint, an optional cap and optional burn. It has no constructor argument in any Deployment Mode.'] },
  erc721: { title: 'NFT Collection (ERC-721)', ctor: ['usdc_'], fields: [
    { id: 's_name', label: 'Collection name', kind: 'name', def: 'ArcNFT' },
    { id: 's_symbol', label: 'Symbol', kind: 'S', def: 'ARC' },
    { id: 's_supply', label: 'Max supply', kind: 'W', def: '10000' },
    { id: 's_price', label: 'Mint price', kind: 'P', def: '0', unit: 'USDC', zero: 'Free' },
    { id: 's_royalty', label: 'Royalty', kind: 'W', def: '0', unit: 'bps' },
    { id: 's_baseuri', label: 'Base URI', kind: 'S', def: '(empty)' }],
    notes: ['Mints are paid in the payment token (USDC by default). In the portable modes the payment token is the constructor argument usdc_ and the price is scaled by its decimals at deploy time.'] },
  escrow: { title: 'Buyer/Seller Escrow', ctor: ['token_'], fields: [
    { id: 's_name', label: 'Contract name', kind: 'name', def: 'ArcEscrow' },
    { id: 's_buyer', label: 'Buyer', kind: 'addr', req: true },
    { id: 's_seller', label: 'Seller', kind: 'addr', req: true },
    { id: 's_arbiter', label: 'Arbiter', kind: 'addr', req: true },
    { id: 's_token', label: 'Token', kind: 'token' },
    { id: 's_amount', label: 'Amount', kind: 'P', def: '0', unit: 'tokens' },
    { id: 's_timeout', label: 'Refund timeout', kind: 'N', def: '14', unit: 'days' }],
    notes: ['Buyer, seller and arbiter are three different addresses; a missing or repeated one writes a DRAFT.'] },
  vesting: { title: 'Linear Vesting', ctor: ['token_'], fields: [
    { id: 's_name', label: 'Contract name', kind: 'name', def: 'ArcVesting' },
    { id: 's_token', label: 'Token', kind: 'token' },
    { id: 's_beneficiary', label: 'Beneficiary', kind: 'addr', req: true },
    { id: 's_amount', label: 'Total amount', kind: 'P', def: '0', unit: 'tokens' },
    { id: 's_duration', label: 'Total duration', kind: 'N', def: '365', unit: 'days' },
    { id: 's_cliff', label: 'Cliff', kind: 'N', def: '0', unit: 'days' }],
    notes: ['A missing beneficiary writes a DRAFT.'] },
  paywall: { title: 'Paywall / Subscription', ctor: ['token_'], fields: [
    { id: 's_name', label: 'Contract name', kind: 'name', def: 'ArcSubscription' },
    { id: 's_token', label: 'Payment token', kind: 'token' },
    { id: 's_amount', label: 'Price per period', kind: 'P', def: '0', unit: 'tokens' },
    { id: 's_duration', label: 'Period', kind: 'N', def: '30', unit: 'days' },
    { id: 's_beneficiary', label: 'Beneficiary', kind: 'addr', req: true }],
    notes: ['A missing beneficiary writes a DRAFT.'] },
  dao: { title: 'DAO Governance', ctor: ['token_', 'votingPeriod_'], fields: [
    { id: 's_name', label: 'Contract name', kind: 'name', def: 'ArcDAO' },
    { id: 's_token', label: 'Governance token', kind: 'govtoken' },
    { id: 's_quorum', label: 'Quorum', kind: 'W', def: '4', unit: '% of supply' },
    { id: 's_voting', label: 'Voting period', kind: 'V', def: '45818', unit: 'blocks' },
    { id: 's_delay', label: 'Timelock delay', kind: 'W', def: '172800', unit: 'seconds' },
    { id: 's_threshold', label: 'Proposal threshold', kind: 'N', def: '1000', unit: 'tokens', note: 'Written as tokens × 10^18 (it assumes an 18-decimal governance token)' }],
    notes: ['The voting period is counted in blocks, and block times differ between chains: in the portable modes it is a constructor argument, so you can set it per network.', 'In Single network mode the governance token is required (a missing one writes a DRAFT).'] },
  smartwallet: { title: 'Smart Wallet (guardian recovery)', ctor: ['dailyLimit_'], fields: [
    { id: 's_name', label: 'Contract name', kind: 'name', def: 'ArcSmartWallet' },
    { id: 's_guardian', label: 'Guardian', kind: 'guardian' },
    { id: 's_session', label: 'Longest session key', kind: 'R', def: '24', unit: 'hours', min: 1, max: 720 },
    { id: 's_rdelay', label: 'Recovery delay', kind: 'R', def: '2', unit: 'days', min: 1, max: 30 },
    { id: 's_spendlimit', label: 'Daily spend limit', kind: 'L', unit: 'native' }],
    notes: ['The wallet refuses to generate (an alert, nothing is written) when the guardian is missing or is the account that deploys it, or when a limit is out of range.', 'The daily limit is counted in the network\'s gas token; in the portable modes it is a constructor argument, scaled per network.'] },
  staking: { title: 'Staking Rewards', ctor: ['stakingToken_'], fields: [
    { id: 's_name', label: 'Contract name', kind: 'name', def: 'ArcStaking' },
    { id: 's_token', label: 'Staking token', kind: 'token' },
    { id: 's_reward', label: 'Reward token', kind: 'reward' },
    { id: 's_apy', label: 'APY', kind: 'N', def: '12', unit: '% per year' },
    { id: 's_lock', label: 'Lock period', kind: 'N', def: '30', unit: 'days', zero: 'No lock' },
    { id: 's_exitfee', label: 'Emergency exit fee', kind: 'W', def: '100', unit: 'bps' }],
    notes: ['An empty reward token means the staking token.'] }
};

function smpTemplate(){
  const b = document.querySelector('#simpleForm button[data-onclick^="genSimple("]');
  const m = b && /genSimple\('(\w+)'\)/.exec(b.getAttribute('data-onclick'));
  return (m && SMP_SPEC[m[1]]) ? m[1] : '';
}
function smpRead(){
  const form = document.getElementById('simpleForm'), vals = {};
  if(form) form.querySelectorAll('[id^="s_"]').forEach(el => { if('value' in el) vals[el.id] = String(el.value); });
  const net = (typeof NETWORKS !== 'undefined' && NETWORKS[activeNetwork]) || null;
  return {
    tpl: smpTemplate(), vals, net,
    portable: typeof isPortable === 'function' ? isPortable() : false,
    dmode: (typeof MC_MODES !== 'undefined' && typeof multichainMode !== 'undefined' && MC_MODES[multichainMode]) ? MC_MODES[multichainMode].label : ''
  };
}
const smpVal = (v, f) => { const raw = v.vals[f.id]; return (raw === undefined || raw === '') ? '' : String(raw); };
const smpUsed = (v, f) => { const x = smpVal(v, f); return x === '' && f.def !== undefined ? f.def : x; };
const smpTokLabel = (tpl) => tpl === 'staking' ? 'Staking token' : 'Token';

/* One problem per field at most: { text, sev } where sev is 'refuse' (the generator alerts and writes nothing), 'draft' (it writes a DRAFT)
   or 'compile' (it writes Solidity that does not compile, or throws in the portable modes). */
function smpFieldProblem(f, v){
  const x = String(smpUsed(v, f)).trim(), L = f.label;
  const net = v.net;
  switch(f.kind){
    case 'S': return /["\\]/.test(smpUsed(v, f)) ? { sev: 'compile', text: L + ' must not contain quotes or backslashes: it is written into a Solidity string and the contract would not compile.' } : null;
    case 'W': if(!/^\d+$/.test(x)) return { sev: 'compile', text: L + ' must be a whole number of at least 0: the value is written into the Solidity as it is, and anything else does not compile.' };
              return (f.max !== undefined && Number(x) > f.max) ? { sev: 'compile', text: L + ' must be at most ' + f.max + ' (' + f.why + '): a larger value does not compile.' } : null;
    case 'N': return (x !== '' && Number.isFinite(Number(x)) && Number(x) >= 0) ? null : { sev: 'compile', text: L + ' must be a number of at least 0: a negative value does not compile.' };
    case 'P':
      if(v.portable) return /^\d+(\.\d+)?$/.test(x) ? null : { sev: 'compile', text: L + ' must be a plain number such as 500 or 1.5: any other form stops generation in the portable modes.' };
      { const n = Number(x); return (x !== '' && Number.isFinite(n) && n >= 0 && Math.abs(n * 1e6 - Math.round(n * 1e6)) < 1e-6) ? null : { sev: 'compile', text: L + ' must be at least 0 with at most 6 decimals: it is multiplied by 10^6 in the Solidity.' }; }
    case 'V': return (/^\d+$/.test(x) && Number(x) >= 1) ? null : { sev: 'refuse', text: 'The voting period must be a whole number of blocks, at least 1: generation is refused.' };
    case 'R': return (/^\d+$/.test(x) && Number(x) >= f.min && Number(x) <= f.max) ? null : { sev: 'refuse', text: L + ' must be a whole number between ' + f.min + ' and ' + f.max + ' (' + f.unit + '): generation is refused.' };
    case 'L': {
      const lim = String(smpVal(v, f)).trim() || (net ? net.walletDailyDefault : '');
      const dec = net ? net.gasDecimals : 18;
      return (/^\d+(\.\d+)?$/.test(lim) && (lim.split('.')[1] || '').length <= dec) ? null : { sev: 'refuse', text: 'The daily limit must be a plain number with at most ' + dec + ' decimals: generation is refused.' };
    }
    case 'guardian': {
      if(typeof reqAddressProblem !== 'function') return null;
      const p = reqAddressProblem(smpVal(v, f).trim(), { required: true, notDeployer: true });
      return p ? { sev: 'refuse', text: 'Guardian ' + p + ': generation is refused (the wallet needs a guardian that is not the account that deploys it).' } : null;
    }
    default: return null;
  }
}
/* The address and token problems the generators record on pendingSource.problems (a DRAFT), mirrored read-only. */
function smpDraftProblems(v){
  if(typeof reqProblems !== 'function' || !v.net) return [];
  const g = (id) => v.vals[id] === undefined ? '' : String(v.vals[id]);
  const tok = (label, id) => { const raw = g(id), resolved = raw.trim() || v.net.usdc || ''; return typeof reqTokenProblem === 'function' ? reqTokenProblem(label, raw, resolved, v.net.label) : ''; };
  let out = [];
  switch(v.tpl){
    case 'escrow': out = reqProblems([{ label: 'Buyer', value: g('s_buyer'), required: true }, { label: 'Seller', value: g('s_seller'), required: true }, { label: 'Arbiter', value: g('s_arbiter'), required: true }], true).concat([tok('Token', 's_token')]); break;
    case 'vesting': case 'paywall': out = reqProblems([{ label: 'Beneficiary', value: g('s_beneficiary'), required: true }]).concat([tok('Token', 's_token')]); break;
    case 'dao': out = reqProblems([{ label: 'Governance token', value: g('s_token').trim(), required: !v.portable }]); break;
    case 'staking': out = [tok('Staking token', 's_token'), g('s_reward').trim() ? (typeof reqTokenProblem === 'function' ? reqTokenProblem('Reward token', g('s_reward'), g('s_reward') || '', v.net.label) : '') : '']; break;
    case 'erc721': {
      const price = String(g('s_price') || '0').trim(), usdc = v.net.usdc;
      if(!v.portable && !/^0+(\.0+)?$/.test(price) && !usdc) out = ['Payment token: ' + v.net.label + ' has no default stablecoin, so set the mint price to 0 or use a portable mode'];
      break;
    }
  }
  return out.filter(Boolean);
}
function smpProblems(v){
  if(!v.tpl) return ['Choose a template first.'];
  const spec = SMP_SPEC[v.tpl], fp = spec.fields.map(f => smpFieldProblem(f, v)).filter(Boolean);
  return [...fp.filter(p => p.sev === 'refuse'), ...smpDraftProblems(v), ...fp.filter(p => p.sev === 'compile')].map(p => typeof p === 'string' ? p : p.text);
}
function smpSig(v){ return JSON.stringify([v.tpl, v.vals, typeof activeNetwork !== 'undefined' ? activeNetwork : '', typeof multichainMode !== 'undefined' ? multichainMode : '']); }
/* Single network mode writes token amounts times 10^6, which is right for a 6-decimal token only: the network's own default token may differ (BNB Chain). */
function smpDecimalsNote(v, f){
  if(v.portable || !v.net || !v.net.usdc || v.net.usdcDecimals === 6) return '';
  const tokenId = v.tpl === 'erc721' ? null : 's_token';
  if(tokenId && smpVal(v, { id: tokenId }).trim()) return '';
  return 'The default token on ' + v.net.label + ' has ' + v.net.usdcDecimals + ' decimals; the amount is written for 6.';
}

function smpFieldRow(v, f, row){
  const net = v.net, used = String(smpUsed(v, f)), typed = smpVal(v, f).trim();
  const p = smpFieldProblem(f, v), dp = smpDraftProblems(v);
  const mine = dp.find(t => t.indexOf(f.label) === 0 || (f.kind === 'token' && t.indexOf(smpTokLabel(v.tpl)) === 0));
  const pf = (extra) => p ? p.text : (extra || '');
  switch(f.kind){
    case 'name': { const nm = used.replace(/[^A-Za-z0-9]/g, '') || f.def; return row(f.label, nm, 'ok'); }
    case 'sel': return row(f.label, f.map[typed] || f.map[Object.keys(f.map)[0]], 'ok');
    case 'S': return row(f.label, used === '' ? '(empty)' : used, p ? 'bad' : 'ok', pf());
    case 'addr': return row(f.label, typed || 'Missing', mine ? (typed ? 'bad' : 'missing') : 'ok', mine || '', !!typed);
    case 'guardian': return row(f.label, typed || 'Missing', p ? (typed ? 'bad' : 'missing') : 'ok', p ? p.text : 'Cannot be the account that deploys the wallet', !!typed);
    case 'reward': return row(f.label, typed || 'Same as the staking token', mine ? 'bad' : 'ok', mine || '', !!typed);
    case 'govtoken':
      if(typed) return row(f.label, typed, mine ? 'bad' : 'ok', mine || '', true);
      return v.portable ? row(f.label, 'Set at deploy time', 'ok', 'Constructor argument token_') : row(f.label, 'Missing', 'missing', mine || 'Required in Single network mode');
    case 'token': {
      if(typed) return row(f.label, typed, mine ? 'bad' : 'ok', mine || (v.portable ? 'Starting value for the constructor argument' : ''), true);
      if(net && net.usdc) return row(f.label, net.usdc, 'ok', v.portable ? 'Network default (USDC), set per network at deploy time' : (smpDecimalsNote(v, f) || 'Network default (USDC)'), true);
      return row(f.label, 'Missing', v.portable ? 'ok' : 'missing', v.portable ? 'Set at deploy time' : (mine || 'No default token on this network'));
    }
    case 'L': { const lim = typed || (net ? net.walletDailyDefault : ''); return row(f.label, lim + (net ? ' ' + net.gasSymbol : ''), p ? 'bad' : 'ok', pf(v.portable ? 'Constructor argument dailyLimit_, scaled per network' : 'Counted in the gas token of the network'), false); }
    default: {
      const zero = f.zero && /^0+(\.0+)?$/.test(used.trim());
      const shown = zero ? f.zero : used + (f.unit ? ' ' + f.unit : '');
      let note = '';
      if(f.kind === 'P') note = v.portable ? 'Scaled by the token decimals at deploy time' : 'Written as ' + used + ' × 10^6' + (smpDecimalsNote(v, f) ? '. ' + smpDecimalsNote(v, f) : '');
      else if(f.note) note = f.note;
      return row(f.label, shown, p ? 'bad' : 'ok', pf(note));
    }
  }
}

const SMP_CONFIG = {
  key: 'simple', prefix: 'bld',
  section: 'sec-simple', codePanel: 'simpleCode', summary: 'smpSummary', progress: 'smpProgress', stages: 'smpStages',
  watch: ['simpleForm'],
  isTemplate: (tpl) => !!SMP_SPEC[tpl],
  read: () => smpRead(),
  problems: (v) => smpProblems(v),
  signature: (v) => smpSig(v),
  draft: () => (typeof pendingSource !== 'undefined' && pendingSource && SMP_SPEC[pendingSource.template] && Array.isArray(pendingSource.problems)) ? pendingSource.problems : [],
  guidance(v){
    const pick = document.getElementById('smpPick'); if(pick) pick.hidden = !!v.tpl;
    const ul = document.getElementById('smpNotes'); if(!ul) return;
    ul.textContent = '';
    const add = (t, kind) => { const li = swbEl('li', '', t); if(kind) li.setAttribute('data-kind', kind); ul.appendChild(li); };
    if(!v.tpl){ add('Choose a template to see what it generates, what it checks and what its constructor needs.'); return; }
    const spec = SMP_SPEC[v.tpl];
    spec.notes.forEach(t => add(t));
    add(v.portable ? (spec.ctor.length ? 'In this Deployment Mode the constructor takes: ' + spec.ctor.join(', ') + '. They are set per network on the deploy page.' : 'It has no constructor argument in any Deployment Mode.') : 'In Single network mode nothing is set at deploy time: the values are written into the Solidity.');
    smpProblems(v).slice(0, 3).forEach(t => add(t, 'warn'));
  },
  summaryRows(v, row){
    if(!v.tpl){
      row('Template', 'None selected', 'missing', 'Choose a template above');
    } else {
      const spec = SMP_SPEC[v.tpl];
      row('Template', spec.title, 'ok');
      spec.fields.forEach(f => smpFieldRow(v, f, row));
    }
    CFBuilder.networkRow(row, v.net);
    const spec = v.tpl ? SMP_SPEC[v.tpl] : null;
    row('Deployment Mode', v.dmode || 'Unknown', v.dmode ? 'ok' : 'bad', !spec ? '' : (v.portable && spec.ctor.length ? 'Constructor arguments: ' + spec.ctor.join(', ') : 'No constructor arguments'));
  }
};
CFBuilder.register(SMP_CONFIG);

/* ======================================================================
   CODE DISPLAY / DOWNLOAD
   ====================================================================== */
const AUDIT_SEVERITIES = ['critical','high','medium','low','info'];

function showCode(panelId, filename, code){
  filename = String(filename);
  const panel=document.getElementById(panelId);
  panel.style.display='block';
  panel.innerHTML=`
    <div class="codehead">
      <span class="filename">${escapeHtml(filename)}</span>
      <span style="font-family:var(--mono);font-size:10.5px;color:#5C6B65;">${code.split('\n').length} lines</span>
    </div>
    <pre>${escapeHtml(code)}</pre>
  `;
  panel.scrollIntoView({behavior:'smooth', block:'nearest'});
}

/* AI requests go through a server function (/api/ai) that holds the API key, the prompts and the model.
   The browser only names one of a few actions and sends the data for it; it resolves { text, outputTokens }. */
async function aiFetch(action, payload){
  let r;
  try{
    r = await fetch('/api/ai',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action, payload }) });
  }catch(_){
    throw new Error('Could not reach the AI service. Check your connection.');
  }
  if(!r.ok){
    const byStatus = { 400:'The AI service did not accept this request.', 403:'The AI service refused this request.', 413:'This contract is too large for the AI service.',
      415:'The AI service did not accept this request.', 429:'Too many AI requests. Wait a minute and try again.', 503:'AI is not configured on this deployment.' };
    let msg = byStatus[r.status] || '';
    if(r.status===404 || r.status===405 || r.status===501) msg = 'AI is not available on this deployment (the /api/ai function is missing).';
    throw new Error(msg || ('AI request failed (HTTP '+r.status+').'));
  }
  let data = null;
  try{ data = await r.json(); }catch(_){ /* handled below */ }
  if(!data || typeof data.text !== 'string') throw new Error('The AI service sent an unexpected answer.');
  return data;
}

function escapeHtml(s){
  return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function isAddr(a){ return /^0x[0-9a-fA-F]{40}$/.test(String(a||'')); }

function downloadSource(){
  if(!pendingSource.code){ logConsole('warn','No contract generated yet.'); return; }
  if(reqBlockReason()){ logConsole('warn','Download blocked. '+reqBlockReason()); return; }
  const blob=new Blob([pendingSource.code], {type:'text/plain'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url; a.download=pendingSource.name+'.sol';
  a.click();
  URL.revokeObjectURL(url);
}

function copySource(){
  if(!pendingSource.code){ logConsole('warn','No contract generated yet.'); return; }
  if(reqBlockReason()){ logConsole('warn','Copy blocked. '+reqBlockReason()); return; }
  navigator.clipboard.writeText(pendingSource.code).then(()=>logConsole('ok','Source code copied to clipboard.'));
}

/* navigate to deploy section + scroll */
function deployFromBuffer(){
  navigateTo('deploy');
  window.scrollTo({top:0, behavior:'smooth'});
}

/* ---- Deterministic contract resolution (phase 11.1 / 11.1.1) ---- */
/* A compiled contract is deployable only when it has non-empty creation bytecode (abstract contracts, interfaces and
   libraries have none). */
function isDeployableArtifact(c){
  const o = c && c.evm && c.evm.bytecode && c.evm.bytecode.object;
  return typeof o === 'string' && o.length > 0 && o !== '0x';
}
function deployableContractNames(contracts){
  return Object.keys(contracts || {}).filter((n) => isDeployableArtifact(contracts[n]));
}
/* Library references still to be linked (solc `evm.bytecode.linkReferences`): the names of any library the creation
   bytecode references but has not been linked. Empty array => no external linking required. */
function unresolvedLibraries(c){
  const lr = c && c.evm && c.evm.bytecode && c.evm.bytecode.linkReferences;
  if(!lr || typeof lr !== 'object') return [];
  const names = [];
  for(const file of Object.keys(lr)){
    const libs = lr[file] || {};
    for(const lib of Object.keys(libs)){
      if(Array.isArray(libs[lib]) && libs[lib].length) names.push(lib);
    }
  }
  return names;
}
function libraryLinkError(name, libs){
  const err = new Error('Contract "' + name + '" needs these libraries linked before it can be deployed: ' + libs.join(', ') + '.');
  err.libraries = libs.slice();
  return err;
}
function ambiguousContractError(names){
  const err = new Error('This source contains ' + names.length + ' deployable contracts (' + names.join(', ') + '). Pick the one to deploy.');
  err.ambiguous = true;
  err.deployable = names.slice();
  return err;
}
/* Resolves the contract to deploy from the compiler output. An exact requested name wins and is never substituted by
   another contract. Without a requested name, a single deployable contract is selected automatically; several require
   the caller to pick one (the error carries the list). A contract whose bytecode still references unlinked libraries is
   never selected or offered in the selector — it is refused with a clear diagnostic. */
function resolveContract(contracts, requestedName){
  const all = Object.keys(contracts || {});
  if (!all.length) throw new Error('The compiler returned no contract for this source.');
  if (requestedName) {
    if (!Object.prototype.hasOwnProperty.call(contracts, requestedName)) throw new Error('Contract "' + requestedName + '" was not found in the compiler output.');
    const c = contracts[requestedName];
    if (!isDeployableArtifact(c)) throw new Error('Contract "' + requestedName + '" is not deployable (abstract, interface or library?).');
    const libs = unresolvedLibraries(c);
    if (libs.length) throw libraryLinkError(requestedName, libs);
    return requestedName;
  }
  const withBytecode = all.filter((n) => isDeployableArtifact(contracts[n]));
  if (!withBytecode.length) throw new Error('No deployable contract in this source (only abstract contracts, interfaces or libraries?).');
  const ready = withBytecode.filter((n) => !unresolvedLibraries(contracts[n]).length);
  if (ready.length === 1) return ready[0];
  if (ready.length > 1) throw ambiguousContractError(ready);
  // every bytecode-bearing contract needs library linking
  throw libraryLinkError(withBytecode[0], unresolvedLibraries(contracts[withBytecode[0]]));
}

/* ======================================================================
   COMPILE + DEPLOY (self-hosted solc-js, verified against vendor/MANIFEST.json)
   ====================================================================== */

/* ---- Operation-scoped guards (phase 11.1.1) ----
   A deploy is a sequence of async steps (compile → confirm → sign → broadcast). If the source, wallet or mode changes
   mid-flight, the operation must stop before signing rather than broadcast stale data. `deployInFlight` stops
   double-click/concurrent runs; `deployOpSnapshot`/`assertOpUnchanged` re-check the operation's identity at each signing
   boundary. Multi-deploy's own per-network wallet switch is an internal transition that changes neither the account nor
   the mode, so it does not trip these guards. */
let deployInFlight = false;
function deployOpSnapshot(){
  return {
    sourceHash: (pendingSource && pendingSource.code) ? matHash(pendingSource.code) : '',
    account: account || '',
    mode: (typeof multichainMode !== 'undefined') ? multichainMode : 'single',
    network: activeNetwork
  };
}
/* A fatal operation-identity violation: the operation (or the whole batch) must stop scheduling new transactions, never
   continue to the next network. Recoverable per-network failures (a rejected transaction, a wrong-chain switch that
   timed out, an unsupported optional bridge) are ordinary Errors without this flag. */
function fatalDeployError(message){
  const err = new Error(message);
  err.fatal = true;
  return err;
}
function assertOpUnchanged(op, opts){
  opts = opts || {};
  if(op.sourceHash && pendingSource && pendingSource.code && matHash(pendingSource.code) !== op.sourceHash){
    throw fatalDeployError('The contract source changed. Compile and deploy again.');
  }
  if((account || '') !== op.account){
    throw fatalDeployError('The wallet account changed. Connect the same account and deploy again.');
  }
  if((typeof multichainMode !== 'undefined') && multichainMode !== op.mode){
    throw fatalDeployError('The deployment mode changed. Start the deployment again.');
  }
  if(!opts.allowNetworkChange && op.network && activeNetwork !== op.network){
    throw fatalDeployError('The network changed. Switch back to the network you confirmed, then deploy again.');
  }
}

/* Resolves the wallet's currently authorized account, independently of the cached global `account`. A delayed
   accountsChanged event must not let a stale cached account pass the pre-signing guard. Uses the EIP-1193 eth_accounts
   (a read, never a connection popup) and falls back to the provider's listAccounts. Returns { accounts: [lowercase…] }
   or null when no independent query is available. */
async function currentWalletAccounts(){
  try{
    if(window.ethereum && typeof window.ethereum.request === 'function'){
      const accts = await window.ethereum.request({ method: 'eth_accounts' });
      if(Array.isArray(accts)) return { accounts: accts.map((a) => String(a).toLowerCase()) };
    }
  }catch(_){ /* method unsupported or failed — try the provider */ }
  try{
    if(provider && typeof provider.listAccounts === 'function'){
      const accts = await provider.listAccounts();
      if(Array.isArray(accts)) return { accounts: accts.map((a) => String(a).toLowerCase()) };
    }
  }catch(_){ /* unavailable */ }
  return null;
}
/* Independently confirms the wallet's authorized account against the operation snapshot before signing, so a delayed
   account-change event cannot authorise a stale signer. Throws a fatal error when the wallet is disconnected or the
   account differs; returns silently when no independent query is available (the cached check already passed). */
async function assertWalletIdentity(op, label){
  const current = await currentWalletAccounts();
  if(current === null) return;
  if(!current.accounts.length) throw fatalDeployError('Wallet disconnected before signing' + (label ? ' on '+label : '') + '.');
  if((op.account || '').toLowerCase() !== current.accounts[0]){
    throw fatalDeployError('The wallet account changed before signing' + (label ? ' on '+label : '') + '.');
  }
}

async function compileAndDeploy(){
  if(deployInFlight){ logConsole('warn','A deployment is already in progress.'); return; }
  deployInFlight = true;                    // acquired synchronously, before the first await (the maturity gate)
  const op = deployOpSnapshot();            // the intent at click time
  try{
    if(!pendingSource.code){ logConsole('err','Generate a contract first.'); return; }
    if(!signer){ logConsole('err','Connect your wallet first.'); return; }
    const draftReason = reqBlockReason();   // on every network: a draft is never compiled or deployed
    if(draftReason){ logConsole('err','Deploy blocked. '+draftReason); return; }
    const sameAsDeployer = (pendingSource.notDeployer || []).find(x => reqAddressProblem(x.value, { notDeployer:true }) === 'cannot be the wallet that deploys the contract');
    if(sameAsDeployer){ logConsole('err','Deploy blocked. '+sameAsDeployer.label+' cannot be the wallet that deploys the contract. Use another address and generate again.'); return; }
    if(!(await matGate([activeNetwork], pendingSource))){ logConsole('warn','Mainnet deployment cancelled (maturity check not confirmed).'); return; }

    if(typeof uiResetDeployResults === 'function') uiResetDeployResults();
    logConsole('step','Starting compilation of '+pendingSource.name+'.sol…');

    const compiled = await compilePendingResolved();
    if(!compiled){ logConsole('warn','Deployment cancelled (no contract selected).'); return; }
    await finishDeploy(compiled, op);
  }catch(e){
    if(e && e.handled) return; // already reported in the console
    logConsole('err','Error: '+(e.message||e));
  }finally{
    deployInFlight = false;
  }
}

/* The shared tail of compileAndDeploy: constructor values, mainnet confirmation, then the actual deploy. */
async function finishDeploy(compiled, op){
  assertOpUnchanged(op);
  const ctorInputs = (compiled.abi.find(x=>x.type==='constructor') || { inputs: [] }).inputs;
  const ctorValues = collectCtorValues(ctorInputs);
  if(!(await mainnetDeployConfirm({ args: typeof ctorSummary === 'function' ? ctorSummary() : [], maturity: matDialogInfo(pendingSource.template), facts: compilerFacts(compiled).concat(pendingSource.facts || []), acks: pendingSource.acks || [] }))){ logConsole('warn','Mainnet deployment cancelled.'); return; }
  assertOpUnchanged(op);   // the confirmation dialog is the last chance before signing
  await assertWalletIdentity(op);   // independent wallet-account confirmation before the single signature
  await deployCompiled(compiled, ctorValues, activeNetwork);
}

/* Compiles pendingSource once, resolving an ambiguous multi-contract source through the selector. Returns the compiled
   artifact, or null when the user cancels. Shared by Single and Multi-deploy so both resolve the exact same way. */
async function compilePendingResolved(){
  try{
    return await compilePending();
  }catch(e){
    if(e && e.ambiguous && typeof uiContractSelect === 'function'){
      const target = await uiContractSelect(e.deployable);
      if(!target){ logConsole('warn','Deployment cancelled (no contract selected).'); return null; }
      logConsole('step','Compiling '+target+'…');
      return await compilePending(target);
    }
    throw e;
  }
}

/* Compiles any source with the selected solc; resolves { name, target, abi, bytecode }. An explicitTarget (chosen in the
   selector) wins; otherwise the generator/AI target is resolved deterministically with resolveContract. */
async function compileSource(name, code, explicitTarget){
  const version = document.getElementById('solcVersion').value;
  await ensureSolcLoaded(version);

  const input = {
    language: 'Solidity',
    sources: { [name+'.sol']: { content: code } },
    settings: { outputSelection: { '*': { '*': ['abi','evm.bytecode.object','evm.bytecode.linkReferences'] } }, optimizer:{enabled:true, runs:200} }
  };

  const output = JSON.parse(await solcCompile(JSON.stringify(input)));

  if(output.errors){
    const fatal = output.errors.filter(e=>e.severity==='error');
    output.errors.forEach(e=>logConsole(e.severity==='error'?'err':'warn', e.formattedMessage.split('\n')[0]));
    if(fatal.length){
      logConsole('err','Compilation failed — fix the errors above.');
      const err = new Error('Compilation failed'); err.handled = true; throw err;
    }
  }

  const contracts = output.contracts[name+'.sol'];
  // A multi-contract AI source has no implicit target; the selector (or an explicit target) resolves it.
  const requested = explicitTarget !== undefined
    ? explicitTarget
    : ((pendingSource && Array.isArray(pendingSource.aiTargets) && pendingSource.aiTargets.length > 1) ? undefined : name);
  const target = resolveContract(contracts, requested);
  const artifact = contracts[target];
  const rawObject = artifact.evm.bytecode.object;
  if(typeof rawObject !== 'string' || !/^[0-9a-fA-F]*$/.test(rawObject)){
    const err = new Error('Cannot deploy "' + target + '": the creation bytecode is malformed or still holds an unlinked library placeholder.');
    err.handled = true; throw err;
  }
  const abi = artifact.abi;
  const bytecode = '0x'+rawObject;
  const bytecodeKeccak256 = (typeof ethers !== 'undefined' && ethers.utils && ethers.utils.keccak256) ? ethers.utils.keccak256(bytecode) : '';

  logConsole('ok','Compiled successfully: '+target+' ('+abi.length+' ABI items).');
  return { name, target, abi, bytecode, sourceHash: matHash(code), compilerVersion: SOLC_VERSION, compilerSha256: SOLC_SHA256, bytecodeKeccak256 };
}

async function compilePending(explicitTarget){
  const compiled = await compileSource(pendingSource.name, pendingSource.code, explicitTarget);
  // Store for Playground, Gas Estimator, Share
  window.__lastCompiledABI      = compiled.abi;
  window.__lastCompiledBytecode = compiled.bytecode;
  document.getElementById('auditContractLabel').value = pendingSource.name+'.sol';
  // The form must reflect the resolved target's actual ABI (a selected contract may differ from the source's first).
  pendingSource.resolvedTarget = compiled.target;
  if(typeof syncCtorArgsFromAbi === 'function'){
    const abi = (compiled && Array.isArray(compiled.abi)) ? compiled.abi : [];
    syncCtorArgsFromAbi((abi.find(x=>x.type==='constructor') || { inputs: [] }).inputs);
  }
  return compiled;
}

/* Sends the deployment (constructor values already validated) on network netKey. */
async function deployCompiled(compiled, ctorValues, netKey){
  // Last line of defence: whatever path got here, a mainnet needs the maturity check to have been confirmed for this exact source.
  if(NETWORKS[netKey].isMainnet && !matIsApproved(compiled.sourceHash, netKey)){
    throw new Error('Mainnet deploy blocked: the maturity check was not confirmed for this contract on '+NETWORKS[netKey].label+'.');
  }
  const factory = new ethers.ContractFactory(compiled.abi, compiled.bytecode, signer);
  logConsole('step','Sending deploy transaction on '+NETWORKS[netKey].label+'… confirm in your wallet.');
  const contract = await factory.deploy(...ctorValues);
  const txNet = NETWORKS[netKey];
  logConsole('step','Tx sent: '+contract.deployTransaction.hash, txNet.explorer ? { href: txNet.explorer+'/tx/'+contract.deployTransaction.hash, text:'view tx' } : null);
  await contract.deployed();
  logConsole('ok','Contract deployed at: '+contract.address);
  // Save to deploy history
  addToDeployHistory({
    name:    compiled.name,
    address: contract.address,
    network: netKey,
    abi:     compiled.abi,
    txHash:  contract.deployTransaction.hash
  });
  const net=NETWORKS[netKey];
  if(net.explorer){
    logConsole('ok','Explorer:', { href: net.explorer+'/address/'+contract.address, text: net.explorer+'/address/'+contract.address });
  }
  if(typeof uiAddDeployResult === 'function') uiAddDeployResult({ name: compiled.name, network: netKey, address: contract.address, txHash: contract.deployTransaction.hash, compilerVersion: compiled.compilerVersion, compilerSha256: compiled.compilerSha256, bytecodeKeccak256: compiled.bytecodeKeccak256 });
  logConsole('ok','Compiler solc v'+(compiled.compilerVersion||SOLC_VERSION)+' · sha256 '+(compiled.compilerSha256||SOLC_SHA256).slice(0,16)+'… · creation bytecode keccak256 '+(compiled.bytecodeKeccak256||''));
  await refreshBalance();
  return contract;
}

/* The one compiler version this app ships. The compiler is self-hosted under vendor/ and its sha256 is checked
   against vendor/MANIFEST.json before it runs (in the worker, and again on the main-thread fallback). Only this
   version compiles: any other version is refused with an explicit error, never downloaded. */
const SOLC_VERSION = '0.8.24';
const SOLC_SHA256 = 'fb59b825b7d57f9de89cd9de2415b12aab1fcc7eb2573fd2bf5c9b969eacf4d9';

/* The compiler facts shown in the deploy summary, so the user can reproduce the build outside the app. */
function compilerFacts(compiled){
  const f = [['Compiler', 'solc ' + SOLC_VERSION + ' · sha256 ' + SOLC_SHA256.slice(0, 16) + '…']];
  if(compiled && compiled.bytecodeKeccak256) f.push(['Creation bytecode keccak256', compiled.bytecodeKeccak256]);
  return f;
}

/* solc runs in a Web Worker (solc-worker.js). If a worker cannot be started in
   this environment, it falls back to loading the compiler on the main thread. */
let solcWorker = null, solcSeq = 0, solcLoaded = null; // solcLoaded = { version, mode }
const solcPending = new Map();

function solcFailAll(err){
  solcPending.forEach(p=>p.reject(err));
  solcPending.clear();
}

function solcCall(msg){
  return new Promise((resolve,reject)=>{
    const id = ++solcSeq;
    solcPending.set(id,{resolve,reject});
    solcWorker.postMessage({ ...msg, id });
  });
}

function startSolcWorker(){
  if(solcWorker){ solcWorker.terminate(); solcWorker = null; }
  solcFailAll(new Error('Compiler restarted'));
  const w = new Worker('solc-worker.js');
  w.onmessage = (ev)=>{
    const { id, ok, output, error } = ev.data || {};
    const p = solcPending.get(id);
    if(!p) return;
    solcPending.delete(id);
    ok ? p.resolve(output) : p.reject(new Error(error || 'Compiler error'));
  };
  w.onerror = (ev)=>{ solcFailAll(new Error((ev && ev.message) || 'Compiler worker failed')); };
  solcWorker = w;
}

/* sha256 of a fetched ArrayBuffer, as hex (the same format as vendor/MANIFEST.json). */
async function vendorSha256(buf){
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/* Loads the self-hosted compiler on the main thread (no Web Worker): fetch the manifest, fetch the file,
   verify its sha256, then run it. No remote fallback. */
async function loadSolcMainThread(){
  const manifest = await (await fetch('vendor/MANIFEST.json')).json();
  const entry = manifest && manifest.solc;
  if(!entry || !entry.file || !entry.sha256) throw new Error('Compiler manifest is missing or incomplete');
  const resp = await fetch('vendor/' + entry.file);
  if(!resp.ok) throw new Error('Could not load the self-hosted compiler (' + resp.status + ')');
  const buf = await resp.arrayBuffer();
  const actual = await vendorSha256(buf);
  if(actual !== entry.sha256) throw new Error('Compiler integrity check failed: the file does not match the manifest sha256. Refusing to run it.');
  await loadSolcScript('vendor/' + entry.file);
}

function loadSolcScript(url){
  return new Promise((resolve,reject)=>{
    window.Module = undefined;
    const script=document.createElement('script');
    script.src=url;
    script.setAttribute('data-solc','1');
    script.onload=()=>{
      const finish=()=>{
        try{
          const compileJson = window.Module.cwrap('solidity_compile', 'string', ['string','number','number']);
          window.__solc = { compile: (input)=>compileJson(input, 0, 0) };
          resolve();
        }catch(e){ reject(e); }
      };
      if(window.Module && window.Module.calledRun){ finish(); }
      else if(window.Module){ window.Module.onRuntimeInitialized = finish; }
      else { reject(new Error('solc module did not initialize')); }
    };
    script.onerror=()=>reject(new Error('Failed to load solc v'+SOLC_VERSION+' — the self-hosted compiler is missing.'));
    document.head.appendChild(script);
  });
}

async function ensureSolcLoaded(version){
  if(version && version !== SOLC_VERSION){
    logConsole('err','Only solc '+SOLC_VERSION+' is supported. The compiler is self-hosted and pinned; other versions cannot be downloaded.');
    throw new Error('Only solc '+SOLC_VERSION+' is supported');
  }
  if(solcLoaded && solcLoaded.version===SOLC_VERSION) return;
  logConsole('step','Loading solc-js v'+SOLC_VERSION+'… (first time may take ~10-20s)');

  let mode = 'worker';
  try{
    if(typeof Worker === 'undefined') throw new Error('Web Workers unavailable');
    startSolcWorker();
    await solcCall({ type:'load' });
  }catch(e){
    if(solcWorker){ solcWorker.terminate(); solcWorker = null; }
    logConsole('warn','Background compiler unavailable ('+(e.message||e)+'). Trying the main thread.');
    await loadSolcMainThread();
    mode = 'main';
  }
  solcLoaded = { version: SOLC_VERSION, mode };
  logConsole('ok','Compiler solc v'+SOLC_VERSION+' ready (sha256 '+SOLC_SHA256.slice(0,16)+'…).');
}

function solcCompile(inputJson){
  if(!solcLoaded) return Promise.reject(new Error('Compiler is not loaded'));
  if(solcLoaded.mode === 'worker') return solcCall({ type:'compile', input:inputJson });
  return Promise.resolve(window.__solc.compile(inputJson));
}

/* ======================================================================
   08 — AI AUDITOR
   ====================================================================== */
let lastAuditReport = null;

async function runAudit(){
  if(!pendingSource.code){
    alert('Generate a contract first (sections 01–06), then run the audit.');
    return;
  }
  const btn = document.getElementById('runAuditBtn');
  btn.disabled = true; btn.textContent = 'Auditing…';
  document.getElementById('auditContractLabel').value = pendingSource.name+'.sol';
  document.getElementById('auditResults').style.display = 'none';

  const focus = document.getElementById('audit_focus').value;

  try{
    const data = await aiFetch('audit', { name: pendingSource.name, code: pendingSource.code, focus });
    const raw = data.text || '';
    // strip any accidental markdown fences
    const clean = raw.replace(/```json|```/g,'').trim();
    const report = JSON.parse(clean);
    lastAuditReport = report;
    renderAuditReport(report);
  }catch(e){
    alert('Audit error: '+(e.message||e));
  }finally{
    btn.disabled = false; btn.textContent = 'Run AI Audit';
  }
}

function renderAuditReport(report){
  const score = Math.max(0, Math.min(100, report.score||0));
  const color = score>=80?'#81C784':score>=60?'#FFD54F':score>=40?'#FFB74D':'#E57373';
  const r=32, cx=36, cy=36, circ=2*Math.PI*r;
  const dash = (score/100)*circ;

  document.getElementById('auditRing').innerHTML = `
    <div style="position:relative;width:72px;height:72px;">
      <svg width="72" height="72" viewBox="0 0 72 72" style="transform:rotate(-90deg);">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#1A2A24" stroke-width="5"/>
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="5"
          stroke-dasharray="${dash} ${circ-dash}" stroke-linecap="round"/>
      </svg>
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-family:var(--display);font-size:20px;font-weight:600;color:${color};">${score}</div>
    </div>`;

  document.getElementById('auditScoreLabel').style.color = color;
  document.getElementById('auditScoreLabel').textContent = score >= 80 ? 'Secure' : score >= 60 ? 'Moderate risk' : score >= 40 ? 'High risk' : 'Critical issues';
  document.getElementById('auditScoreSub').textContent = report.summary || '';

  const counts = {critical:0,high:0,medium:0,low:0,info:0};
  (report.findings||[]).forEach(f=>{ if(counts[f.severity]!==undefined) counts[f.severity]++; });
  const countStr = Object.entries(counts).filter(([,v])=>v>0).map(([k,v])=>`${v} ${k}`).join(' · ');
  if(countStr) document.getElementById('auditScoreSub').textContent += ' — '+countStr;

  const container = document.getElementById('auditFindings');
  container.innerHTML = '';
  const sevOrder = ['critical','high','medium','low','info'];
  const sorted = [...(report.findings||[])].sort((a,b)=>sevOrder.indexOf(a.severity)-sevOrder.indexOf(b.severity));
  sorted.forEach(f=>{
    const div = document.createElement('div');
    const sev = AUDIT_SEVERITIES.includes(String(f.severity).toLowerCase()) ? String(f.severity).toLowerCase() : 'info';   // the severity comes from the AI answer: only known words reach the markup
    div.className = 'audit-finding '+sev;
    div.innerHTML = `
      <div><span class="sev">${sev.toUpperCase()}</span><h4>${escapeHtml(f.title||'')}</h4></div>
      <p>${escapeHtml(f.description||'')}</p>
      ${f.recommendation?`<p style="margin-top:6px;color:#7E8C86;font-size:11.5px;"><b style="color:var(--gold);">Fix:</b> ${escapeHtml(f.recommendation)}</p>`:''}
      ${f.lineHint?`<div class="line-ref">→ ${escapeHtml(f.lineHint)}</div>`:''}`;
    container.appendChild(div);
  });

  if(sorted.length===0){
    container.innerHTML = '<div class="audit-finding info"><div><span class="sev">INFO</span><h4>No findings</h4></div><p>No issues detected for the selected audit focus.</p></div>';
  }

  document.getElementById('auditResults').style.display = 'block';
}

function downloadAuditReport(){
  if(!lastAuditReport){ alert('Run an audit first.'); return; }
  const md = buildAuditMarkdown(lastAuditReport);
  const blob = new Blob([md],{type:'text/markdown'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = (pendingSource.name||'contract')+'_audit.md';
  a.click();
}

function buildAuditMarkdown(r){
  const lines = [
    `# Security Audit — ${pendingSource.name||'Contract'}`,
    `\nGenerated by ContractForge AI Auditor · ${new Date().toISOString()}`,
    `\n## Score: ${r.score}/100\n\n${r.summary||''}`,
    `\n## Findings\n`
  ];
  (r.findings||[]).forEach((f,i)=>{
    lines.push(`### ${i+1}. [${(f.severity||'').toUpperCase()}] ${f.title||''}`);
    lines.push(`\n${f.description||''}`);
    if(f.recommendation) lines.push(`\n**Recommendation:** ${f.recommendation}`);
    if(f.lineHint) lines.push(`\n\`\`\`\n${f.lineHint}\n\`\`\``);
    lines.push('');
  });
  return lines.join('\n');
}

/* ---- AI Auditor overview (Phase 12.2): read-only. runAudit(), renderAuditReport(), downloadAuditReport() and buildAuditMarkdown() are untouched. This only
   notes, at the click on Run AI Audit, what runAudit() reads at that moment (the contract and the focus), and watches the page's own results, so it can say whether the
   report on screen was written for the source on screen. ---- */
const AUD_MAX_CODE = 60000;   // the most source the AI service accepts for an audit (AI_MAX_BODY in functions/api/ai.js and api/ai.js; a test keeps them equal)
let audRun = null;            // the latest click: what the form held, and how it ended
let audLast = null;           // the latest click that ended with a report on screen
let audTap = null;            // while a run is waiting: a pass-through on alert(), only to learn the reason runAudit() gives when it fails

function audNow(){
  const ps = (typeof pendingSource !== 'undefined' && pendingSource) ? pendingSource : null;
  const code = ps && ps.code ? ps.code : '';
  const f = document.getElementById('audit_focus');
  return { name: ps && ps.name ? ps.name : '', code, hash: code && typeof matHash === 'function' ? matHash(code) : '', template: ps && ps.template ? ps.template : '', focus: (f && f.value) || 'full' };
}

function audTapOn(){
  if(audTap) return;
  const orig = window.alert;
  const tap = { orig, wrap: function(m){ if(audTap === tap && audRun && !audRun.done && /^Audit error: /.test(String(m))) audRun.error = String(m).replace(/^Audit error: /, ''); return orig.apply(window, arguments); } };
  audTap = tap; window.alert = tap.wrap;
}
function audTapOff(){
  if(!audTap) return;
  if(window.alert === audTap.wrap) window.alert = audTap.orig;   // if something else replaced alert meanwhile, leave it alone
  audTap = null;
}

function audSeverityCounts(report){
  const counts = {};
  ((report && report.findings) || []).forEach((f) => {
    const sev = (typeof AUDIT_SEVERITIES !== 'undefined' && AUDIT_SEVERITIES.includes(String(f && f.severity).toLowerCase())) ? String(f.severity).toLowerCase() : 'info';
    counts[sev] = (counts[sev] || 0) + 1;
  });
  return ['critical', 'high', 'medium', 'low', 'info'].filter((k) => counts[k]).map((k) => counts[k] + ' ' + k).join(' · ');
}

function audFinish(){
  if(!audRun || audRun.done) return;
  const btn = document.getElementById('runAuditBtn');
  if(!btn || btn.disabled) return;                       // still waiting for the AI
  audRun.done = true;
  audTapOff();
  const res = document.getElementById('auditResults');
  if(typeof lastAuditReport !== 'undefined' && lastAuditReport && lastAuditReport !== audRun.prev && res && res.style.display === 'block'){
    audLast = { name: audRun.name, hash: audRun.hash, focus: audRun.focus, report: lastAuditReport };
  } else audRun.error = audRun.error || 'The page did not receive a report.';
}

function audRead(){
  const now = audNow();
  const net = (typeof NETWORKS !== 'undefined' && typeof activeNetwork !== 'undefined') ? NETWORKS[activeNetwork] : null;
  const btn = document.getElementById('runAuditBtn');
  const working = !!(btn && btn.disabled);
  const why = (now.code && typeof reqBlockReason === 'function') ? reqBlockReason() : '';
  let state = 'none', outdated = '';
  if(working) state = 'working';
  else if(audRun && audRun.done && audRun.error) state = 'failed';
  else if(audLast){
    const sameSrc = audLast.hash === now.hash && audLast.name === now.name;
    const sameFocus = audLast.focus === now.focus;
    state = sameSrc && sameFocus ? 'current' : 'outdated';
    outdated = !sameSrc ? 'source' : (!sameFocus ? 'focus' : '');
  }
  const unavailable = state === 'failed' && /not configured|not available/i.test(audRun.error || '');
  return { now, net, working, why, state, outdated, unavailable, mode: (typeof MC_MODES !== 'undefined' && typeof multichainMode !== 'undefined' && MC_MODES[multichainMode]) ? MC_MODES[multichainMode].label : '' };
}

const AUD_FOCUS = { full: 'Full audit (all categories)', security: 'Security only', gas: 'Gas optimization only', logic: 'Business logic only' };

function audRender(){
  const sum = document.getElementById('audSummary'), prog = document.getElementById('audProgress'), notes = document.getElementById('audNotes');
  if(!sum || !prog || !notes) return;
  const v = audRead(), n = v.now, last = audLast;
  sum.textContent = ''; prog.textContent = ''; notes.textContent = '';
  const row = CFBuilder.rowWriter(sum), step = CFBuilder.stepWriter(prog);
  const lvl = n.code && typeof matInfo === 'function' ? (matInfo(n.template) || {}).level : '';
  row('Contract', n.name ? n.name + '.sol' : 'None', n.name ? 'ok' : 'missing', n.name ? (lvl ? 'Maturity: ' + lvl : '') : 'Generate a contract in a builder first', true);
  if(n.code){
    row('Source', v.why ? 'Draft' : 'Ready', v.why ? 'missing' : 'ok', v.why ? 'A draft can be audited; it cannot be deployed: ' + v.why : '');
    const big = n.code.length > AUD_MAX_CODE;
    row('Size', n.code.length.toLocaleString('en-US') + ' characters', big ? 'bad' : 'ok', big ? 'More than the ' + AUD_MAX_CODE.toLocaleString('en-US') + ' the AI service accepts: it will refuse this source' : 'The AI service accepts up to ' + AUD_MAX_CODE.toLocaleString('en-US'));
  }
  CFBuilder.networkRow(row, v.net);
  row('Deployment Mode', v.mode || 'Unknown', v.mode ? 'ok' : 'bad');
  row('Focus', AUD_FOCUS[n.focus] || n.focus, 'ok', n.focus === 'full' ? '' : 'The score and its label refer to this focus only');
  if(v.state === 'none') row('Report', 'No audit yet', 'missing', 'Press Run AI Audit');
  else if(v.state === 'working') row('Report', 'Waiting for the AI…', 'missing');
  else if(v.state === 'failed') row('Report', v.unavailable ? 'AI unavailable' : 'Audit failed', 'bad', audRun.error + (last ? ' · Download would still save the earlier report (of ' + last.name + ')' : ''));
  else {
    row('Report', 'Of ' + last.name + '.sol (' + (AUD_FOCUS[last.focus] || last.focus) + ')', v.state === 'current' ? 'ok' : 'missing',
      v.state === 'outdated' ? (v.outdated === 'source' ? 'The contract on screen is not the one this report is about' : 'The focus changed since this report') : '');
    const score = Math.max(0, Math.min(100, last.report.score || 0));
    const label = (document.getElementById('auditScoreLabel') || {}).textContent || '';
    row('Score', score + '/100', 'ok', 'A number given by the AI' + (label && label !== '—' && v.state === 'current' ? ', shown above as "' + label + '"' : '') + ': not computed by this page and not a guarantee');
    const counts = audSeverityCounts(last.report);
    row('Findings', counts || 'None', 'ok');
    if(last.name !== n.name) row('Download saves', n.name + '_audit.md', 'missing', 'Titled with the contract on screen now (' + n.name + '), but the report is about ' + last.name, true);
    else row('Download saves', n.name + '_audit.md', 'ok', '', true);
  }
  // progress: only what really happened
  const hasSrc = !!n.code;
  step('Source', hasSrc ? (v.why ? 'draft' : 'done') : 'todo', hasSrc ? (v.why ? 'A draft: it can be audited, but it cannot be deployed yet.' : n.name + '.sol is on screen.') : 'Generate a contract in a builder first.');
  if(!hasSrc) step('Audit run', 'locked', 'Available once there is a contract.');
  else if(v.state === 'working') step('Audit run', 'todo', 'Waiting for the AI…');
  else if(v.state === 'failed') step('Audit run', 'attention', v.unavailable ? 'The AI is unavailable: ' + audRun.error : 'The audit did not complete: ' + audRun.error);
  else if(v.state === 'current') step('Audit run', 'done', 'The AI answered for this source, with this focus.');
  else if(v.state === 'outdated') step('Audit run', 'stale', v.outdated === 'source' ? 'The contract changed after this report. Run the audit again.' : 'The focus changed after this report.');
  else step('Audit run', 'todo', 'Press Run AI Audit to ask the AI.');
  step('Review', hasSrc && (v.state === 'current' || v.state === 'outdated') ? 'todo' : 'locked', 'Not tracked here: read each finding and decide. An AI audit is advisory and is not a security guarantee.');
  [
    'The score is a number the AI returns with the findings. This page does not compute it, and the word next to it (Secure, Moderate risk...) only follows that number.',
    'The AI service limits the answer to about 2,000 tokens. A long report can arrive cut off, which this page cannot read: it then shows an error.',
    'Download Report titles the file and the report with the contract on screen when you press it, which may not be the one that was audited.',
    'Opening this tab from the contract bar does not start an audit: press Run AI Audit.'
  ].forEach((t) => { const li = document.createElement('li'); li.textContent = t; notes.appendChild(li); });
  const fn = document.getElementById('audFocusNote'); if(fn) fn.textContent = n.focus === 'full' ? '' : 'The score and its label refer to "' + (AUD_FOCUS[n.focus] || n.focus) + '" only.';
  const empty = document.getElementById('audEmpty'); if(empty) empty.hidden = document.getElementById('auditResults').style.display === 'block';
}

(function audInit(){
  const sec = document.getElementById('sec-auditor'), btn = document.getElementById('runAuditBtn');
  if(!sec || !btn || sec.dataset.audBound) return;
  sec.dataset.audBound = '1';
  // what the form held at the click (runAudit reads the same values, synchronously, before it waits for the AI)
  btn.addEventListener('click', () => {
    const n = audNow();
    if(!n.code) return;
    audTapOff();
    audRun = { name: n.name, hash: n.hash, focus: n.focus, prev: typeof lastAuditReport !== 'undefined' ? lastAuditReport : null, done: false, error: '' };
    audTapOn();
  }, true);
  let queued = false;
  const draw = () => { if(queued) return; queued = true; queueMicrotask(() => { queued = false; audFinish(); audRender(); }); };
  sec.addEventListener('input', draw); sec.addEventListener('change', draw);
  if(typeof MutationObserver === 'function'){
    const watch = (el, opts) => { if(el) new MutationObserver(draw).observe(el, opts); };
    watch(sec, { attributes: true, attributeFilter: ['style'] });
    watch(btn, { attributes: true, attributeFilter: ['disabled'] });
    watch(document.getElementById('auditResults'), { attributes: true, attributeFilter: ['style'], childList: true, subtree: true });
    watch(document.getElementById('sidenet'), { childList: true, characterData: true, subtree: true });
  }
  CFBuilder.addView('auditor', audRender);
})();

/* 09 — ABI PLAYGROUND lives in playground.js */

/* ======================================================================
   10 — DEPLOY HISTORY
   ====================================================================== */
const HISTORY_KEY = 'contractforge_deploy_history';

function loadDeployHistory(){
  try{ const h = JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]'); return Array.isArray(h) ? h : []; }   // storage that is not a list reads as empty (the Home page would otherwise fail on it)
  catch(_){ return []; }
}

function saveDeployHistory(hist){
  localStorage.setItem(HISTORY_KEY, JSON.stringify(hist.slice(-50)));// keep last 50
}

function addToDeployHistory(entry){
  const hist = loadDeployHistory();
  hist.unshift({...entry, timestamp: Date.now()});
  saveDeployHistory(hist);
  renderHistory();
}

/* ---- Deploy History view (Phase 10.1). The records are untouched: same storage key, same shape, same order (newest first), same indexes,
   so the Home page, the Playground and the builders' "Deployed" stages keep reading them exactly as before. The filters below only
   decide what is DRAWN: a button always acts on the index the record has in storage, whatever is hidden. Everything is built with
   textContent (nothing from storage reaches markup). ---- */
let histNetKeys = [];                                 // the network keys the filter list offers, by position
const HIST_LIMIT = 50;                                // saveDeployHistory keeps this many records
function histScope(){ const b = document.querySelector('#histScope [aria-pressed="true"]'); return b ? b.getAttribute('data-scope') : 'all'; }
function histSetScope(scope){
  document.querySelectorAll('#histScope .hist-segbtn').forEach(b => b.setAttribute('aria-pressed', String(b.getAttribute('data-scope') === scope)));
  renderHistory();
}
function histResetFilters(){
  histSetScope('all');
  const n = document.getElementById('histNet'), q = document.getElementById('histSearch');
  if(n) n.value = ''; if(q) q.value = '';
  renderHistory();
}
function histFlash(btn, text){
  if(!btn) return;
  const keep = btn.getAttribute('data-label') || btn.textContent; btn.setAttribute('data-label', keep); btn.textContent = text;
  setTimeout(() => { btn.textContent = keep; }, 1400);
}
function copyHistoryAddress(btn, i){
  const e = loadDeployHistory()[i];
  if(!e || !isAddr(e.address)) return;
  if(!navigator.clipboard || !navigator.clipboard.writeText){ histFlash(btn, 'Copy failed'); return; }
  navigator.clipboard.writeText(e.address).then(() => histFlash(btn, 'Copied'), () => histFlash(btn, 'Copy failed'));
}
function histWhen(ts){
  const t = Number(ts);
  if(!Number.isFinite(t) || t <= 0) return { ago: 'unknown time', date: '' };
  return { ago: timeAgo(t), date: new Date(t).toLocaleString() };
}
function renderHistory(){
  if(typeof renderHome === 'function') renderHome();
  if(typeof pgRefreshDeployments === 'function') pgRefreshDeployments();
  const hist = loadDeployHistory();
  const container = document.getElementById('historyList');
  if(!container) return;
  const stats = document.getElementById('histStats'), note = document.getElementById('histNote'), count = document.getElementById('histCount');
  const netSel = document.getElementById('histNet'), search = document.getElementById('histSearch');
  const rows = [];                                                       // [entry, index in storage]
  (Array.isArray(hist) ? hist : []).forEach((e, i) => { if(e && isAddr(e.address)) rows.push([e, i]); });
  const bad = (Array.isArray(hist) ? hist.length : 0) - rows.length;
  /* the network list follows the records (an option carries its position in this list, never text from storage) */
  let netKey = '';
  if(netSel){
    const keepKey = netSel.value === '' ? '' : (histNetKeys[Number(netSel.value)] || '');
    const seen = [...new Set(rows.map(([e]) => String(e.network || 'unknown')))];
    histNetKeys = Object.keys(NETWORKS).filter(k => seen.includes(k)).concat(seen.filter(k => !NETWORKS[k]));
    netSel.textContent = '';
    const all = document.createElement('option'); all.value = ''; all.textContent = 'All networks'; netSel.appendChild(all);
    histNetKeys.forEach((k, ix) => { const o = document.createElement('option'); o.value = String(ix); o.textContent = NETWORKS[k] ? NETWORKS[k].label : k; netSel.appendChild(o); });
    const at = histNetKeys.indexOf(keepKey);
    netSel.value = keepKey && at >= 0 ? String(at) : '';
    netKey = netSel.value === '' ? '' : histNetKeys[Number(netSel.value)];
  }
  /* summary */
  if(stats){
    stats.textContent = '';
    stats.hidden = !rows.length;
    if(rows.length){
      const live = rows.filter(([e]) => NETWORKS[e.network] && NETWORKS[e.network].isMainnet).length;
      const latest = rows.reduce((m, r) => (Number(r[0].timestamp) || 0) > (Number(m[0].timestamp) || 0) ? r : m, rows[0]);
      const card = (k, v, sub) => { const c = swbEl('div', 'hist-stat'); c.appendChild(swbEl('span', 'hist-k', k)); c.appendChild(swbEl('b', '', v)); if(sub) c.appendChild(swbEl('span', 'hist-s', sub)); stats.appendChild(c); };
      card('Deployments', String(rows.length), rows.length === 1 ? 'recorded in this browser' : 'recorded in this browser');
      card('Networks', String(new Set(rows.map(([e]) => String(e.network || 'unknown'))).size), 'with at least one deployment');
      card('Live (mainnet)', String(live), live ? 'real funds were used' : 'testnets only');
      card('Latest', String(latest[0].name || 'Contract'), histWhen(latest[0].timestamp).ago);
    }
  }
  /* what to draw */
  const scope = histScope(), q = search ? search.value.trim().toLowerCase() : '';
  const shown = rows.filter(([e]) => {
    const n = NETWORKS[e.network];
    if(scope === 'mainnet' && !(n && n.isMainnet)) return false;
    if(scope === 'testnet' && !(n && !n.isMainnet)) return false;
    if(netKey && String(e.network || 'unknown') !== netKey) return false;
    if(q && !(String(e.name || '').toLowerCase().includes(q) || String(e.address).toLowerCase().includes(q))) return false;
    return true;
  });
  const filtered = scope !== 'all' || !!netKey || !!q;
  if(count) count.textContent = !rows.length ? '' : (filtered ? 'Showing ' + shown.length + ' of ' + rows.length : rows.length + (rows.length === 1 ? ' deployment' : ' deployments'));
  if(note){
    const msgs = [];
    if(Array.isArray(hist) && hist.length >= HIST_LIMIT) msgs.push('The history is full (' + HIST_LIMIT + ' entries): a new deployment is not recorded until you remove some. Use Export JSON first if you want to keep the list.');
    if(bad > 0) msgs.push(bad + (bad === 1 ? ' stored entry has' : ' stored entries have') + ' an invalid address and cannot be shown.');
    note.textContent = msgs.join(' '); note.hidden = !msgs.length;
  }
  container.textContent = '';
  container.setAttribute('role', 'list');
  if(!rows.length){
    const p = swbEl('p', 'hist-empty', 'No deployments yet. Deploy a contract in section 07.'); container.appendChild(p); return;
  }
  if(!shown.length){
    const box = swbEl('div', 'hist-empty'); box.appendChild(swbEl('p', '', 'No deployment matches these filters.'));
    const b = swbEl('button', 'btn btn-ghost', 'Reset filters'); b.type = 'button'; b.setAttribute('data-onclick', 'histResetFilters()'); box.appendChild(b); container.appendChild(box); return;
  }
  shown.forEach(([entry, i]) => {
    const net = NETWORKS[entry.network];
    const explorerUrl = net && net.explorer ? net.explorer + '/address/' + entry.address : '';
    const txOk = typeof entry.txHash === 'string' && /^0x[0-9a-fA-F]{64}$/.test(entry.txHash);
    const when = histWhen(entry.timestamp);
    const row = swbEl('div', 'hist-row'); row.setAttribute('role', 'listitem');
    if(net && net.isMainnet) row.setAttribute('data-live', '1');
    const netBox = swbEl('div', 'hist-net');
    const nl = swbEl('span', 'hnet', net ? net.label : String(entry.network || 'unknown')); netBox.appendChild(nl);
    if(net && net.isMainnet) netBox.appendChild(swbEl('span', 'hist-live', 'LIVE'));
    netBox.appendChild(swbEl('span', 'hist-kind', net ? (net.isMainnet ? 'Mainnet' : 'Testnet') + ' · chain ' + net.chainIdDec : 'Network not in this app'));
    const main = swbEl('div', 'hist-main');
    const nm = swbEl('span', 'hname', entry.name || 'Contract'); nm.id = 'histname-' + i; main.appendChild(nm);
    const ar = swbEl('div', 'hist-addr'); ar.appendChild(swbEl('span', 'haddr', entry.address));
    const cp = swbEl('button', 'hbtn', 'Copy'); cp.type = 'button'; cp.setAttribute('data-onclick', 'copyHistoryAddress(this, ' + i + ')'); cp.setAttribute('aria-describedby', 'histname-' + i); ar.appendChild(cp); main.appendChild(ar);
    const tx = swbEl('div', 'hist-tx'); tx.appendChild(swbEl('span', 'hist-k', 'tx'));
    if(txOk){
      const short = entry.txHash.slice(0, 10) + '…' + entry.txHash.slice(-6);
      if(net && net.explorer){ const a = swbEl('button', 'hist-link', short); a.type = 'button'; a.setAttribute('data-onclick', "openExternal('" + net.explorer + '/tx/' + entry.txHash + "')"); a.setAttribute('aria-describedby', 'histname-' + i); tx.appendChild(a); }
      else tx.appendChild(swbEl('span', 'hist-hash', short));
    } else tx.appendChild(swbEl('span', 'hist-hash', entry.txHash ? 'not a valid transaction hash' : 'not recorded'));
    main.appendChild(tx);
    const wh = swbEl('div', 'hist-when'); wh.appendChild(swbEl('span', 'htime', when.ago)); if(when.date) wh.appendChild(swbEl('span', 'hist-date', when.date));
    const btns = swbEl('div', 'hbtns');
    if(explorerUrl){ const b = swbEl('button', 'hbtn', 'Explorer ↗'); b.type = 'button'; b.setAttribute('data-onclick', "openExternal('" + explorerUrl + "')"); b.setAttribute('aria-describedby', 'histname-' + i); btns.appendChild(b); }
    const pg = swbEl('button', 'hbtn', 'Playground'); pg.type = 'button'; pg.setAttribute('data-onclick', 'loadHistoryIntoPlayground(' + i + ')'); pg.setAttribute('aria-describedby', 'histname-' + i); btns.appendChild(pg);
    const rm = swbEl('button', 'hbtn hbtn-del', '✕'); rm.type = 'button'; rm.setAttribute('data-onclick', 'deleteHistoryEntry(' + i + ')'); rm.setAttribute('aria-label', 'Remove this deployment from the history'); rm.setAttribute('aria-describedby', 'histname-' + i); btns.appendChild(rm);
    row.appendChild(netBox); row.appendChild(main); row.appendChild(wh); row.appendChild(btns);
    container.appendChild(row);
  });
}
(function histInit(){
  if(typeof document === 'undefined') return;
  const sec = document.getElementById('sec-history'); if(!sec) return;
  new MutationObserver(() => { if(sec.style.display === 'block') renderHistory(); }).observe(sec, { attributes: true, attributeFilter: ['style'] });   // the relative times are fresh whenever the tab opens
})();

function loadHistoryIntoPlayground(i){
  const hist = loadDeployHistory();
  const entry = hist[i];
  if(!entry){ return; }
  navigateTo('playground');
  pgOpenEntry(entry);
}

function deleteHistoryEntry(i){
  const hist = loadDeployHistory();
  hist.splice(i,1);
  saveDeployHistory(hist);
  renderHistory();
}

function clearHistory(){
  if(!confirm('Clear all deploy history? This cannot be undone.')) return;
  localStorage.removeItem(HISTORY_KEY);
  renderHistory();
}

function exportHistory(){
  const hist = loadDeployHistory();
  if(!hist.length){ alert('No history to export.'); return; }
  const blob = new Blob([JSON.stringify(hist,null,2)],{type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'contractforge_history.json';
  a.click();
}

function timeAgo(ts){
  const diff = Date.now()-ts;
  if(diff<60000) return 'just now';
  if(diff<3600000) return Math.floor(diff/60000)+'m ago';
  if(diff<86400000) return Math.floor(diff/3600000)+'h ago';
  return Math.floor(diff/86400000)+'d ago';
}

/* ======================================================================
   11 — GAS ESTIMATOR
   ====================================================================== */
function logGas(type, msg){
  const c = document.getElementById('gasLog');
  const line = document.createElement('div');
  line.className = 'line '+(type||'');
  const t = new Date().toLocaleTimeString('en-US',{hour12:false});
  line.innerHTML = `<span class="t">[${t}]</span><span class="msg">${escapeHtml(msg)}</span>`;
  c.appendChild(line); c.scrollTop = c.scrollHeight;
}

async function estimateGas(){
  if(!pendingSource.code){ logGas('err','Generate and compile a contract first.'); return; }
  if(!signer){ logGas('err','Connect your wallet first.'); return; }
  if(!window.__lastCompiledBytecode){ logGas('err','Compile the contract first (section 07) to get bytecode.'); return; }

  logGas('warn','Fetching gas price from network…');

  try{
    // 1. gas price from network
    const gweiOverride = parseFloat(document.getElementById('gas_gweioverride').value)||0;
    let gasPrice;
    if(gweiOverride>0){
      gasPrice = ethers.utils.parseUnits(gweiOverride.toString(),'gwei');
    } else {
      gasPrice = await provider.getGasPrice();
    }
    const gasPriceGwei = parseFloat(ethers.utils.formatUnits(gasPrice,'gwei'));
    logGas('ok','Gas price: '+gasPriceGwei.toFixed(3)+' gwei');

    // 2. estimate deploy gas units
    const deployData = window.__lastCompiledBytecode;
    const bytecodeLen = (deployData.length-2)/2;
    logGas('warn','Estimating deployment gas units…');
    let gasUnits;
    try{
      gasUnits = await provider.estimateGas({ data: deployData });
    }catch(e){
      // fallback: rough estimate = 32000 (base) + 200 per byte of non-zero bytecode
      const nonZeroBytes = deployData.replace(/0x/,'').match(/../g).filter(b=>b!=='00').length;
      gasUnits = ethers.BigNumber.from(32000 + nonZeroBytes*200 + bytecodeLen*4);
      logGas('warn','estimateGas not available on this network — using approximation.');
    }
    const gasUnitsNum = gasUnits.toNumber();

    // 3. cost in native token
    const costWei = gasPrice.mul(gasUnits);
    const costNative = parseFloat(ethers.utils.formatEther(costWei));

    // 4. USD price
    let ethPriceUSD = parseFloat(document.getElementById('gas_ethprice').value)||0;
    if(ethPriceUSD<=0){
      try{
        logGas('warn',NETWORKS[activeNetwork].gasSymbol==='USDC'?'Gas token is USDC — using $1.00':'Fetching ETH price from CoinGecko…');
        const net = NETWORKS[activeNetwork];
        if(net.gasSymbol==='USDC'){
          ethPriceUSD = 1; // gas token is USDC (1 USD), no price lookup needed
        } else {
          const coinId = net.gasSymbol==='ETH'?'ethereum':net.gasSymbol==='POL'?'matic-network':'ethereum';
          const cg = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`);
          const cgData = await cg.json();
          ethPriceUSD = cgData[coinId]?.usd||0;
        }
        logGas('ok','Live price: $'+ethPriceUSD.toFixed(2)+' / '+NETWORKS[activeNetwork].gasSymbol);
      }catch(_){
        ethPriceUSD = 0;
        logGas('warn','Could not fetch live price — USD estimate unavailable. Set a manual price.');
      }
    }
    const costUSD = ethPriceUSD>0?(costNative*ethPriceUSD).toFixed(4):'—';

    // 5. ABI stats
    const abiItems = window.__lastCompiledABI?.length||0;

    // render
    document.getElementById('g_units').textContent   = gasUnitsNum.toLocaleString();
    document.getElementById('g_gwei').textContent    = gasPriceGwei.toFixed(3);
    document.getElementById('g_native').textContent  = costNative.toFixed(6);
    document.getElementById('g_nativesub').textContent = NETWORKS[activeNetwork].gasSymbol;
    document.getElementById('g_usd').textContent     = costUSD!=='—'?'$'+costUSD:'—';
    document.getElementById('g_usdsub').textContent  = ethPriceUSD>0?'at $'+ethPriceUSD.toFixed(0)+'/'+NETWORKS[activeNetwork].gasSymbol:'set a price manually';
    document.getElementById('g_bytecode').textContent= bytecodeLen.toLocaleString();
    document.getElementById('g_functions').textContent= abiItems;
    document.getElementById('gasMeter').style.display='grid';

    // warn on size
    if(bytecodeLen>24576) logGas('err','Bytecode exceeds 24 576 byte limit (EIP-170). Contract will fail to deploy.');
    else if(bytecodeLen>20000) logGas('warn','Bytecode is large ('+bytecodeLen+' bytes). Consider splitting the contract.');
    logGas('ok','Estimate complete: '+gasUnitsNum.toLocaleString()+' gas units × '+gasPriceGwei.toFixed(3)+' gwei = '+costNative.toFixed(6)+' '+NETWORKS[activeNetwork].gasSymbol+(costUSD!=='—'?' ($'+costUSD+')':''));
  }catch(e){
    logGas('err','Error: '+e.message);
  }
}

/* ---- Gas Estimator overview (Phase 12.3): read-only. estimateGas() and logGas() are untouched. This notes, at the click on Estimate Gas, what the page held (the contract, the
   network, the two overrides) and reads the page's own log lines and meter afterwards, so the overview can say where each number came from and whether it still matches what is on
   screen. It never asks the wallet, the node or CoinGecko for anything. ---- */
const GAS_MAX_BYTES = 24576, GAS_WARN_BYTES = 20000;   // the page's own limits (EIP-170, and where it starts to warn)
let gasRun = null;   // the latest click: what the form held, and how it ended
let gasEst = null;   // the latest click that ended with an estimate on screen

function gasNow(){
  const ps = (typeof pendingSource !== 'undefined' && pendingSource) ? pendingSource : null;
  const code = ps && ps.code ? ps.code : '';
  const el = (id) => document.getElementById(id);
  return {
    name: ps && ps.name ? ps.name : '', code, template: ps && ps.template ? ps.template : '',
    hash: code && typeof matHash === 'function' ? matHash(code) : '',
    net: typeof activeNetwork !== 'undefined' ? activeNetwork : '',
    gwei: parseFloat(el('gas_gweioverride') && el('gas_gweioverride').value) || 0,
    price: parseFloat(el('gas_ethprice') && el('gas_ethprice').value) || 0
  };
}

function gasLines(from){ return [...document.querySelectorAll('#gasLog .line .msg')].map((m) => m.textContent).slice(from || 0); }

function gasFinish(){
  if(!gasRun || gasRun.done) return;
  const lines = gasLines(gasRun.startLen);
  const blocked = lines.find((t) => /^(Generate and compile a contract first\.|Connect your wallet first\.|Compile the contract first)/.test(t));
  const err = lines.find((t) => /^Error: /.test(t));
  const fin = lines.find((t) => /^Estimate complete: /.test(t));
  if(blocked){ gasRun.done = true; gasRun.kind = 'blocked'; gasRun.msg = blocked; return; }
  if(fin){
    const txt = (id) => (document.getElementById(id) || {}).textContent || '';
    gasRun.done = true; gasRun.kind = 'ok';
    gasRun.approx = lines.some((t) => /using approximation/.test(t));
    gasRun.priceNote = gasRun.price > 0 ? 'manual' : (lines.some((t) => /^Could not fetch live price/.test(t)) ? 'unavailable' : (lines.some((t) => /^Gas token is USDC/.test(t)) ? 'fixed' : 'live'));
    gasRun.est = { units: txt('g_units'), gasPrice: txt('g_gwei'), native: txt('g_native'), sym: txt('g_nativesub'), usd: txt('g_usd'), usdsub: txt('g_usdsub'), bytes: txt('g_bytecode') };
    gasEst = Object.assign({ name: gasRun.name, hash: gasRun.hash, net: gasRun.net, gwei: gasRun.gwei, price: gasRun.price, approx: gasRun.approx, priceNote: gasRun.priceNote }, gasRun.est);
    return;
  }
  if(err){ gasRun.done = true; gasRun.kind = 'failed'; gasRun.msg = err.replace(/^Error: /, ''); }
}

function gasWalletChain(){
  const id = typeof window !== 'undefined' && window.ethereum && window.ethereum.chainId;   // a property the wallet already holds: nothing is requested
  const n = id ? parseInt(id, 16) : NaN;
  return Number.isFinite(n) ? n : null;
}

function gasRead(){
  const now = gasNow();
  const net = (typeof NETWORKS !== 'undefined' && NETWORKS[now.net]) ? NETWORKS[now.net] : null;
  const why = (now.code && typeof reqBlockReason === 'function') ? reqBlockReason() : '';
  const wallet = (typeof signer !== 'undefined' && !!signer);
  const bc = window.__lastCompiledBytecode || '';
  const art = (typeof shrArtifact === 'function') ? shrArtifact({ hash: now.hash, name: now.name }) : { state: 'none' };
  const bytes = bc ? Math.max(0, (String(bc).length - 2) / 2) : 0;
  const ctor = (typeof pendingCtorArgs !== 'undefined' ? pendingCtorArgs : []).length;
  let state = 'none', outdated = '';
  if(gasRun && !gasRun.done) state = 'working';
  else if(gasRun && gasRun.done && gasRun.kind === 'failed') state = 'failed';
  else if(gasRun && gasRun.done && gasRun.kind === 'blocked') state = 'blocked';
  else if(gasEst){
    const sameSrc = gasEst.hash === now.hash && gasEst.name === now.name;
    const sameNet = gasEst.net === now.net;
    const sameIn = gasEst.gwei === now.gwei && gasEst.price === now.price;
    state = sameSrc && sameNet && sameIn ? 'current' : 'outdated';
    outdated = !sameSrc ? 'source' : (!sameNet ? 'network' : (!sameIn ? 'inputs' : ''));
  }
  return { now, net, why, wallet, bc, art, bytes, ctor, state, outdated, wchain: gasWalletChain(),
    mode: (typeof MC_MODES !== 'undefined' && typeof multichainMode !== 'undefined' && MC_MODES[multichainMode]) ? MC_MODES[multichainMode].label : '' };
}

function gasRender(){
  const sum = document.getElementById('gasSummary'), prog = document.getElementById('gasProgress'), notes = document.getElementById('gasNotes');
  if(!sum || !prog || !notes) return;
  const v = gasRead(), n = v.now, sym = v.net ? v.net.gasSymbol : '';
  sum.textContent = ''; prog.textContent = ''; notes.textContent = '';
  const row = CFBuilder.rowWriter(sum), step = CFBuilder.stepWriter(prog);
  const lvl = n.code && typeof matInfo === 'function' ? (matInfo(n.template) || {}).level : '';
  row('Contract', n.name ? n.name + '.sol' : 'None', n.name ? 'ok' : 'missing', n.name ? (lvl ? 'Maturity: ' + lvl : '') : 'Generate a contract in a builder first', true);
  CFBuilder.networkRow(row, v.net);
  if(v.wchain != null && v.net){
    const same = v.wchain === v.net.chainIdDec;
    const known = typeof NETWORKS !== 'undefined' ? Object.values(NETWORKS).find((x) => x.chainIdDec === v.wchain) : null;
    row('Wallet chain', same ? 'The same chain' : 'Chain ' + v.wchain + (known ? ' (' + known.label + ')' : ''), same ? 'ok' : 'bad', same ? '' : 'The numbers come from your wallet\'s chain, but this page labels them with ' + v.net.label);
  }
  row('Deployment Mode', v.mode || 'Unknown', v.mode ? 'ok' : 'bad');
  row('Wallet', v.wallet ? 'Connected' : 'Not connected', v.wallet ? 'ok' : 'missing', v.wallet ? '' : 'The estimate goes through your wallet\'s connection');
  if(v.art.state === 'none') row('Compiled bytecode', 'None yet', 'missing', 'Compile and deploy in section 07 to get it; nothing is compiled here');
  else row('Compiled bytecode', v.art.state === 'exact' ? 'From this exact source' : 'From the last compile', v.art.state === 'exact' ? 'ok' : 'missing', v.art.state === 'exact' ? 'A deployment made on this page proves it' : 'This page cannot tell it is from the contract on screen');
  if(v.bc){
    const big = v.bytes > GAS_MAX_BYTES, large = v.bytes > GAS_WARN_BYTES;
    row('Bytecode size', v.bytes.toLocaleString('en-US') + ' of ' + GAS_MAX_BYTES.toLocaleString('en-US') + ' bytes', big ? 'bad' : (large ? 'missing' : 'ok'), big ? 'Over the EIP-170 limit: it cannot be deployed' : (large ? 'Large: consider splitting the contract' : ''));
  }
  row('Constructor', v.ctor ? v.ctor + (v.ctor === 1 ? ' argument' : ' arguments') : 'No arguments', 'ok', v.ctor ? 'Not included: the node is asked about the creation bytecode only' : '');
  row('Gas price', n.gwei > 0 ? n.gwei + ' gwei (your override)' : 'From the network', 'ok', n.gwei > 0 ? '' : 'Asked of your wallet\'s connection when you press Estimate');
  if(n.price > 0) row('Dollar price', '$' + n.price + ' per ' + sym + ' (yours)', 'ok');
  else if(sym === 'USDC') row('Dollar price', 'Fixed at $1', 'ok', 'The gas token here is USDC');
  else if(sym === 'AVAX' || sym === 'BNB') row('Dollar price', 'The Ethereum price', 'bad', 'This page asks CoinGecko for the Ethereum price for ' + sym + ' (KNOWN): set your own price above');
  else row('Dollar price', 'CoinGecko', 'ok', 'An outside service, asked when you press Estimate and no price is set');
  // what the page last estimated
  const e = gasEst;
  if(v.state === 'none') row('Estimate', 'Not made yet', 'missing', 'Press Estimate Gas');
  else if(v.state === 'working') row('Estimate', 'Working…', 'missing');
  else if(v.state === 'blocked') row('Estimate', 'Not made', 'bad', gasRun.msg);
  else if(v.state === 'failed') row('Estimate', 'Failed', 'bad', gasRun.msg + (e ? ' · The meter still shows the earlier estimate (' + e.name + ')' : ''));
  else {
    row('Estimate', e.units + ' gas × ' + e.gasPrice + ' gwei = ' + e.native + ' ' + e.sym, v.state === 'current' ? 'ok' : 'missing',
      v.state === 'outdated' ? ({ source: 'The contract on screen is not the one estimated', network: 'The network changed since', inputs: 'An override changed since' }[v.outdated]) : '');
    row('Gas units from', e.approx ? 'A formula' : 'The node', e.approx ? 'missing' : 'ok', e.approx ? 'The node could not estimate, so the page used 32,000 + 200 per non-zero byte + 4 per byte: a rough number' : 'eth_estimateGas on the creation bytecode');
    row('Cost in dollars', e.usd, e.usd === '—' ? 'missing' : 'ok', { manual: 'At the price you set', fixed: 'At $1: the gas token is USDC', live: 'At the CoinGecko price', unavailable: 'The price service could not be reached: nothing is invented' }[e.priceNote] || '');
  }
  const hasSrc = !!n.code, ready = hasSrc && v.wallet && !!v.bc;
  step('Ready to estimate', hasSrc ? (ready ? 'done' : 'todo') : 'todo', ready ? 'A contract, a wallet and compiled bytecode.' : 'Needs: ' + [!hasSrc && 'a contract', !v.wallet && 'a connected wallet', !v.bc && 'compiled bytecode'].filter(Boolean).join(', ') + '.');
  if(!ready) step('Estimate', 'locked', 'Available once it is ready.');
  else if(v.state === 'working') step('Estimate', 'todo', 'Working…');
  else if(v.state === 'blocked' || v.state === 'failed') step('Estimate', 'attention', gasRun.msg);
  else if(v.state === 'current') step('Estimate', 'done', e.approx ? 'Made for this source, but with the formula: a rough number.' : 'Made for this source, on this network, with these settings.');
  else if(v.state === 'outdated') step('Estimate', 'stale', { source: 'The contract changed after this estimate.', network: 'The network changed after this estimate.', inputs: 'An override changed after this estimate.' }[v.outdated]);
  else step('Estimate', 'todo', 'Press Estimate Gas.');
  step('Before you deploy', ready && (v.state === 'current' || v.state === 'outdated') ? 'todo' : 'locked', 'Not tracked here: gas prices move, so estimate again right before deploying, and add what the constructor arguments cost.');
  [
    'The node is asked about the creation bytecode only. Constructor arguments are not part of the estimate, so a contract that takes arguments will cost a little more.',
    'If the node cannot estimate, the page uses a formula (32,000 + 200 per non-zero byte + 4 per byte) and says so in the log: treat that number as rough.',
    'The numbers come from your wallet\'s connection. If your wallet is on another chain than the one labelled here, the figures belong to that chain.',
    'The dollar price is yours, or fixed at $1 where the gas token is USDC, or fetched from CoinGecko. For Avalanche (AVAX) and BNB Chain (BNB) the page asks CoinGecko for the Ethereum price: set your own.'
  ].forEach((t) => { const li = document.createElement('li'); li.textContent = t; notes.appendChild(li); });
  const pn = document.getElementById('gasPriceNote');
  if(pn) pn.textContent = n.price > 0 ? '' : (sym === 'USDC' ? 'Not needed here: the gas token is USDC ($1).' : ((sym === 'AVAX' || sym === 'BNB') ? 'Set a price for ' + sym + ': the live price asked for is the Ethereum one.' : ''));
}

(function gasInit(){
  const sec = document.getElementById('sec-gas'), btn = document.getElementById('estimateGasBtn');
  if(!sec || !btn || sec.dataset.gasBound) return;
  sec.dataset.gasBound = '1';
  // what the form held at the click (estimateGas reads the same values before it asks anything)
  btn.addEventListener('click', () => {
    const n = gasNow();
    gasRun = { name: n.name, hash: n.hash, net: n.net, gwei: n.gwei, price: n.price, startLen: gasLines().length, done: false, kind: '', msg: '', approx: false, priceNote: '' };
  }, true);
  let queued = false;
  const draw = () => { if(queued) return; queued = true; queueMicrotask(() => { queued = false; gasFinish(); gasRender(); }); };
  sec.addEventListener('input', draw); sec.addEventListener('change', draw);
  if(typeof MutationObserver === 'function'){
    const watch = (el, opts) => { if(el) new MutationObserver(draw).observe(el, opts); };
    watch(sec, { attributes: true, attributeFilter: ['style'] });
    watch(document.getElementById('gasLog'), { childList: true });
    watch(document.getElementById('gasMeter'), { attributes: true, attributeFilter: ['style'] });
    watch(document.getElementById('sidenet'), { childList: true, characterData: true, subtree: true });
    watch(document.getElementById('walletStatus'), { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  }
  CFBuilder.addView('gas', gasRender);
})();

/* ======================================================================
   12 — VERIFY ON EXPLORER
   ====================================================================== */
/* Explorer API — resolved dynamically from NETWORKS[activeNetwork].explorerApi */
function getExplorerApi(){ return NETWORKS[activeNetwork]?.explorerApi || ''; }

function logVerify(type, msg){
  const c = document.getElementById('verifyLog');
  const line = document.createElement('div');
  line.className = 'line '+(type||'');
  const t = new Date().toLocaleTimeString('en-US',{hour12:false});
  line.innerHTML = `<span class="t">[${t}]</span><span class="msg">${escapeHtml(msg)}</span>`;
  c.appendChild(line); c.scrollTop = c.scrollHeight;
}

async function verifyContract(){
  const address  = document.getElementById('ver_address').value.trim();
  const apiKey   = document.getElementById('ver_apikey').value.trim();
  const compiler = document.getElementById('ver_compiler').value.trim();
  const runs     = document.getElementById('ver_runs').value.trim();
  const ctorArgs = document.getElementById('ver_constructor').value.trim().replace(/^0x/,'');

  if(!address){ logVerify('err','Enter the deployed contract address.'); return; }
  if(!apiKey){ logVerify('err','Enter your explorer API key.'); return; }
  if(!pendingSource.code){ logVerify('err','Generate a contract first.'); return; }
  if(!pendingSource.name){ logVerify('err','No contract name found.'); return; }

  const apiUrl = getExplorerApi();
  if(!apiUrl){ logVerify('err','Source verification is not yet available for '+NETWORKS[activeNetwork].label+'. Supported: '+Object.values(NETWORKS).filter(n=>n.explorerApi).map(n=>n.label).join(', ')+'.'); return; }

  logVerify('warn','Submitting source to '+apiUrl+'…');

  const params = new URLSearchParams({
    apikey:            apiKey,
    module:            'contract',
    action:            'verifysourcecode',
    contractaddress:   address,
    sourceCode:        pendingSource.code,
    codeformat:        'solidity-single-file',
    contractname:      pendingSource.name,
    compilerversion:   compiler,
    optimizationUsed:  '1',
    runs:              runs,
    constructorArguements: ctorArgs
  });

  try{
    const resp = await fetch(apiUrl, {method:'POST', body: params, headers:{'Content-Type':'application/x-www-form-urlencoded'}});
    const data = await resp.json();
    if(data.status==='1'){
      window.__lastVerifyGuid = data.result;
      logVerify('ok','Verification submitted. GUID: '+data.result+' — Click "Check Status" in ~30s.');
    } else {
      logVerify('err','Submission failed: '+data.result);
    }
  }catch(e){
    logVerify('err','Request error: '+e.message);
  }
}

async function checkVerificationStatus(){
  const apiKey  = document.getElementById('ver_apikey').value.trim();
  const guid    = window.__lastVerifyGuid;
  if(!guid){ logVerify('warn','No pending verification. Submit first.'); return; }

  const apiUrl = getExplorerApi();
  if(!apiUrl){ logVerify('err','Explorer API not available for this network.'); return; }

  const params = new URLSearchParams({ apikey:apiKey, module:'contract', action:'checkverifystatus', guid });
  try{
    const resp = await fetch(apiUrl+'?'+params.toString());
    const data = await resp.json();
    if(data.result==='Pass - Verified'){
      logVerify('ok','Verified! View on explorer: '+NETWORKS[activeNetwork].explorer+'/address/'+document.getElementById('ver_address').value);
    } else {
      logVerify('warn','Status: '+data.result);
    }
  }catch(e){
    logVerify('err','Status check error: '+e.message);
  }
}

/* ---- Verify on Explorer view (Phase 10.2). verifyContract() and checkVerificationStatus() are unchanged: they read the same fields and send the
   same request. This code only reads the form, the application state and what the page itself logs, and never sends anything. Facts it states
   come from the application: which networks have an explorer API (NETWORKS[].explorerApi), the compiler settings the app really uses
   (solc SOLC_VERSION, optimizer on, 200 runs), the constructor arguments of the buffer, the deployments recorded on this page and the
   explorer's own answers as logged by the page. The API key is never shown, stored or logged here. ---- */
let verRun = null;                                    // the latest submission this page saw start: values at the click, then what the explorer answered
function verSnapshot(){
  const g = (id) => { const e = document.getElementById(id); return e ? String(e.value).trim() : ''; };
  const ps = (typeof pendingSource !== 'undefined' && pendingSource) || {};
  verRun = { address: g('ver_address'), network: activeNetwork, name: ps.name || '', hash: ps.code && typeof matHash === 'function' ? matHash(ps.code) : '', submitted: false, guid: '', failed: '', status: '', verified: false };
}
function verReadLog(nodes){
  if(!verRun) return;
  nodes.forEach(n => {
    const m = n.querySelector ? n.querySelector('.msg') : null; if(!m) return;
    const t = m.textContent;
    if(/^Verification submitted\. GUID:/.test(t)){ verRun.submitted = true; verRun.failed = ''; verRun.guid = (/GUID: (\S+)/.exec(t) || [])[1] || ''; verRun.status = ''; verRun.verified = false; }
    else if(/^(Submission failed|Request error):/.test(t)){ verRun.failed = t; }
    else if(/^Verified!/.test(t)){ verRun.verified = true; }
    else if(/^Status:/.test(t)){ verRun.status = t.replace(/^Status:\s*/, ''); }
  });
}
function verSupportedNetworks(){ return Object.keys(NETWORKS).filter(k => NETWORKS[k].explorerApi); }
function verRead(){
  const g = (id) => { const e = document.getElementById(id); return e ? String(e.value).trim() : ''; };
  const ps = (typeof pendingSource !== 'undefined' && pendingSource) || {};
  const net = NETWORKS[activeNetwork] || null, api = net && net.explorerApi ? net.explorerApi : '';
  const hash = ps.code && typeof matHash === 'function' ? matHash(ps.code) : '';
  const address = g('ver_address'), ctor = g('ver_constructor');
  const hexOk = !ctor || /^(0x)?([0-9a-fA-F]{2})+$/.test(ctor);
  const results = (typeof uiDeployResults !== 'undefined' ? uiDeployResults : []);
  const hist = typeof loadDeployHistory === 'function' ? loadDeployHistory() : [];
  const low = address.toLowerCase();
  const fromPage = isAddr(address) ? results.find(r => r && r.address && r.address.toLowerCase() === low && r.network === activeNetwork) : null;
  const fromHist = isAddr(address) ? hist.find(e => e && isAddr(e.address) && e.address.toLowerCase() === low && e.network === activeNetwork) : null;
  const exact = !!(fromPage && ps.name && fromPage.name === ps.name && dplRun && dplRun.hash && dplRun.hash === hash && dplRun.name === ps.name);
  return {
    ps, net, api, hash, address, addressOk: isAddr(address), key: g('ver_apikey'), compiler: g('ver_compiler'), runs: g('ver_runs'), ctor, hexOk,
    hasCode: !!ps.code, ctorArgs: (typeof pendingCtorArgs !== 'undefined' ? pendingCtorArgs : []).length,
    fromPage, fromHist, exact, supported: verSupportedNetworks(), run: verRun
  };
}
function verLatest(){
  const results = (typeof uiDeployResults !== 'undefined' ? uiDeployResults : []).filter(r => r && isAddr(r.address) && r.network === activeNetwork);
  if(results.length) return { address: results[results.length - 1].address, from: 'this page' };
  const h = (typeof loadDeployHistory === 'function' ? loadDeployHistory() : []).find(e => e && isAddr(e.address) && e.network === activeNetwork);
  return h ? { address: h.address, from: 'the deploy history' } : null;
}
function verUseLatest(btn){
  const el = document.getElementById('ver_address'); if(!el) return;
  const cand = verLatest();
  if(!cand){ if(typeof histFlash === 'function') histFlash(btn, 'No deployment on this network'); return; }
  if(el.value.trim() && el.value.trim().toLowerCase() !== cand.address.toLowerCase()){ if(typeof histFlash === 'function') histFlash(btn, 'The field already has an address'); return; }   // never replaces what you typed
  el.value = cand.address; el.dispatchEvent(new Event('input', { bubbles: true }));
}
function verRender(){
  const list = document.getElementById('verSummary'), prog = document.getElementById('verProgress');
  if(!list || !prog) return;
  const v = verRead(); list.textContent = ''; prog.textContent = '';
  const row = CFBuilder.rowWriter(list);
  const apiHost = (u) => { try{ return new URL(u).host; }catch(_){ return u; } };
  const expSolc = 'v' + SOLC_VERSION;
  const compilerOk = v.compiler.indexOf(expSolc) === 0, runsOk = v.runs === '200';
  const problems = [];
  if(!v.hasCode) problems.push('generate a contract first');
  if(!v.api) problems.push((v.net ? v.net.label : 'this network') + ' has no explorer API here');
  if(!v.addressOk) problems.push(v.address ? 'the address is not valid' : 'enter the deployed address');
  if(!v.key) problems.push('enter the explorer API key');
  if(!v.hexOk) problems.push('the constructor arguments are not valid hex');
  /* summary */
  row('Contract', v.hasCode ? v.ps.name + '.sol' : 'None generated yet', v.hasCode ? 'ok' : 'missing', v.hasCode ? (v.ps.template || '') : 'Verification needs the source of the contract');
  CFBuilder.networkRow(row, v.net);
  if(v.api) row('Explorer API', apiHost(v.api), 'ok', 'Etherscan-style verification');
  else row('Explorer API', 'Not available here', 'bad', 'Available on: ' + v.supported.map(k => NETWORKS[k].label).join(', '));
  if(!v.address) row('Address', 'Not entered', 'missing', v.net ? 'The contract you deployed on ' + v.net.label : '');
  else if(!v.addressOk) row('Address', v.address, 'bad', 'Not a valid address', true);
  else row('Address', v.address, 'ok', v.fromPage ? 'Deployed from this page on ' + v.net.label : (v.fromHist ? 'Found in the deploy history on ' + v.net.label : 'Not in this browser\'s records'), true);
  if(v.hasCode && v.addressOk){
    if(v.exact) row('Source', 'Same code as your deployment', 'ok', 'It is the exact source this page deployed to that address');
    else row('Source', 'Not confirmed', 'missing', v.fromPage ? 'The source on screen is not the one this page deployed to that address' : 'This page cannot tell whether the source on screen is the code deployed there');
  }
  row('Compiler', v.compiler || 'Not entered', compilerOk ? 'ok' : 'bad', compilerOk ? 'The version the app compiles with' : 'The app compiles with solc ' + SOLC_VERSION + ': another version will not match');
  row('Optimizer', 'On, ' + (v.runs || '?') + ' runs', runsOk ? 'ok' : 'bad', runsOk ? 'As compiled by the app' : 'The app compiles with 200 runs: another value will not match');
  row('Constructor', v.ctor ? (v.hexOk ? Math.floor(v.ctor.replace(/^0x/, '').length / 2) + ' bytes' : 'Not valid hex') : 'None entered', !v.hexOk ? 'bad' : (v.ctorArgs && !v.ctor ? 'missing' : 'ok'), !v.hexOk ? 'Use an even number of hex digits' : (v.ctorArgs && !v.ctor ? 'The contract on screen takes ' + v.ctorArgs + (v.ctorArgs === 1 ? ' argument' : ' arguments') + ': paste them ABI-encoded or the explorer will refuse the match' : ''));
  row('API key', v.key ? 'Entered' : 'Not entered', v.key ? 'ok' : 'missing', 'Used for this request only; this page never stores or shows it');
  /* hints beside the fields */
  const setNote = (id, text, kind) => { const e = document.getElementById(id); if(!e) return; e.textContent = text; e.hidden = !text; if(kind) e.setAttribute('data-kind', kind); };
  setNote('verAddrNote', v.addressOk ? '' : (v.address ? 'This is not a valid address.' : ''), 'warn');
  setNote('verCompilerNote', compilerOk || !v.compiler ? '' : 'The app compiles with solc ' + SOLC_VERSION + '; another version will not match the deployed bytecode.', 'warn');
  setNote('verRunsNote', runsOk || !v.runs ? '' : 'The app compiles with the optimizer on and 200 runs; another value will not match.', 'warn');
  const lat = verLatest(); const lb = document.getElementById('verUseLatest');
  if(lb) lb.hidden = !lat;
  setNote('verLatestNote', lat ? 'Latest deployment on ' + (v.net ? v.net.label : 'this network') + ' (from ' + lat.from + '): ' + lat.address.slice(0, 10) + '…' + lat.address.slice(-6) : '', 'info');
  /* progress */
  const step = CFBuilder.stepWriter(prog);
  const r = v.run, rNet = r && NETWORKS[r.network] ? NETWORKS[r.network].label : '';
  step('Ready to submit', problems.length ? 'todo' : 'done', problems.length ? 'Still needed: ' + problems.join('; ') + '.' : 'Everything the explorer asks for is filled in.');
  if(r && r.submitted) step('Submitted', 'done', 'Accepted by the explorer for ' + r.address.slice(0, 10) + '…' + r.address.slice(-6) + ' on ' + rNet + (r.guid ? ' (GUID ' + r.guid + ')' : '') + '.');
  else if(r && r.failed) step('Submitted', 'attention', r.failed);
  else step('Submitted', 'locked', 'Press Submit Verification. Nothing is sent before that.');
  if(r && r.verified) step('Verified', 'done', 'The explorer reports this contract as verified on ' + rNet + '.');
  else if(r && r.submitted) step('Verified', 'todo', r.status ? 'Last answer from the explorer: ' + r.status : 'Press Check Status in about 30 seconds to ask the explorer.');
  else step('Verified', 'locked', 'Available after the explorer accepts the submission.');
}
(function verInit(){
  if(typeof document === 'undefined') return;
  const sec = document.getElementById('sec-verify'); if(!sec) return;
  let queued = false; const later = () => { if(queued) return; queued = true; queueMicrotask(() => { queued = false; verRender(); }); };
  sec.addEventListener('input', later); sec.addEventListener('change', later);
  const submit = sec.querySelector('[data-onclick="verifyContract()"]'); if(submit) submit.addEventListener('click', verSnapshot, true);   // the values the page is about to read
  const log = document.getElementById('verifyLog'); if(log) new MutationObserver(ms => { ms.forEach(m => verReadLog([...m.addedNodes])); later(); }).observe(log, { childList: true });
  new MutationObserver(later).observe(sec, { attributes: true, attributeFilter: ['style'] });
  ['sidenet'].forEach(id => { const e = document.getElementById(id); if(e) new MutationObserver(later).observe(e, { subtree: true, childList: true, characterData: true }); });
  ['deployResult', 'historyList'].forEach(id => { const e = document.getElementById(id); if(e) new MutationObserver(later).observe(e, { childList: true, subtree: true }); });   // a deployment recorded on this page or in the history
  CFBuilder.addView('verify', verRender);
})();

/* ======================================================================
   13 — SHARE / EXPORT
   ====================================================================== */
function generateShareUrl(){
  const config = {
    network: activeNetwork,
    name: pendingSource.name||'',
    code: pendingSource.code||''
  };
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(config))));
  const url = window.location.origin + '/#cfg=' + encoded;
  document.getElementById('shareUrl').value = url;
  logConsole('ok','Share URL generated ('+encoded.length+' chars encoded).');
}

function copyShareUrl(){
  const url = document.getElementById('shareUrl').value;
  if(!url){ generateShareUrl(); }
  navigator.clipboard.writeText(document.getElementById('shareUrl').value)
    .then(()=>logConsole('ok','Share URL copied to clipboard.'));
}

function loadFromUrlHash(){
  const hash = window.location.hash;
  if(!hash.startsWith('#cfg=')) return;
  try{
    const encoded = hash.slice(5);
    const config = JSON.parse(decodeURIComponent(escape(atob(encoded))));
    if(config.network && NETWORKS[config.network]){
      activeNetwork = config.network;
      renderNetBar(); updateSideNet();
    }
    if(config.name && config.code){
      pendingSource = { name: config.name, code: config.code, template: 'imported' };   // never trust a template named inside a link
      pendingCtorArgs = []; renderCtorArgs();
      document.getElementById('pendingContractLabel').value = config.name+'.sol  ('+NETWORKS[activeNetwork].label+')';
      document.getElementById('auditContractLabel').value = config.name+'.sol';
      logConsole('ok','Configuration loaded from URL: '+config.name+'.sol');
    }
  }catch(e){ /* silent — bad hash */ }
}

function exportArtifact(){
  const fmt = document.getElementById('export_format').value;
  if(!pendingSource.code){ alert('Generate and compile a contract first.'); return; }

  const name  = pendingSource.name||'Contract';
  const abi   = window.__lastCompiledABI||[];
  const bytec = window.__lastCompiledBytecode||'';
  let content='', filename='', mime='text/plain';
  if((fmt==='abi' && !abi.length) || ((fmt==='full' || fmt==='hardhat') && (!abi.length || !bytec))){ alert('No content to export. Ensure the contract is compiled first.'); return; }   // never a file with an empty ABI or bytecode

  if(fmt==='abi'){
    content  = JSON.stringify(abi, null, 2);
    filename = name+'_abi.json';
    mime     = 'application/json';
  } else if(fmt==='full'){
    content  = JSON.stringify({name, abi, bytecode: bytec, source: pendingSource.code, network: activeNetwork, timestamp: new Date().toISOString()}, null, 2);
    filename = name+'_artifact.json';
    mime     = 'application/json';
  } else if(fmt==='hardhat'){
    content = buildHardhatScript(name, abi, bytec);
    filename= 'deploy_'+name+'.js';
  } else if(fmt==='forge'){
    content = buildForgeScript(name);
    filename= 'Deploy'+name+'.s.sol';
  }

  if(!content){ alert('No content to export. Ensure the contract is compiled first.'); return; }
  const blob = new Blob([content],{type:mime});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

function buildHardhatScript(name, abi, bytec){
  return `// Hardhat deploy script — generated by ContractForge
// Network: ${NETWORKS[activeNetwork].label} (chainId ${NETWORKS[activeNetwork].chainIdDec})
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH");

  const factory = new ethers.ContractFactory(
    ${JSON.stringify(abi, null, 4)},
    "${bytec}",
    deployer
  );

  const contract = await factory.deploy(/* add constructor args here */);
  await contract.deployed();
  console.log("${name} deployed to:", contract.address);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
`;
}

function buildForgeScript(name){
  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Foundry deploy script — generated by ContractForge
// Network: ${NETWORKS[activeNetwork].label} (chainId ${NETWORKS[activeNetwork].chainIdDec})
// Run: forge script script/Deploy${name}.s.sol --rpc-url <RPC_URL> --broadcast --verify

import {Script, console} from "forge-std/Script.sol";
import {${name}} from "../src/${name}.sol";

contract Deploy${name} is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        ${name} deployed = new ${name}(/* add constructor args here */);
        console.log("${name} deployed at:", address(deployed));

        vm.stopBroadcast();
    }
}
`;
}

async function generateQR(){
  generateShareUrl();
  const url = document.getElementById('shareUrl').value;
  if(!url){ return; }
  const qrBox = document.getElementById('qrBox');
  qrBox.style.display='block';
  if(url.length > SHR_QR_MAX){      // a QR code holds at most this much: the request would be useless, and it would still send the whole source to an outside service
    qrBox.textContent = 'This link is ' + url.length.toLocaleString('en-US') + ' characters and a QR code holds at most ' + SHR_QR_MAX.toLocaleString('en-US') + '. Nothing was sent to the QR service. Use Copy URL, or download the source instead.';
    return;
  }
  // Use a free QR API
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
  qrBox.innerHTML = `<img src="${qrUrl}" alt="QR Code" style="border:8px solid var(--paper);border-radius:2px;" />
    <div style="font-family:var(--mono);font-size:10px;color:#5C6B65;margin-top:8px;">Scan to open this configuration</div>`;
}


/* ---- Share & Export view (Phase 10.3). generateShareUrl, copyShareUrl, loadFromUrlHash and the artifact builders are unchanged. This code only reads: the
   current contract, the link field, the last compile (window.__lastCompiledABI / __lastCompiledBytecode) and the deployments this page recorded.
   What it states comes from the application: what the link holds, what each export file contains, and whether the compiled artifact can be tied to the
   source on screen. The artifact is only called "from this source" when a deployment made on this page proves it (same run, same bytecode hash);
   otherwise it is shown as unverified. ---- */
const SHR_QR_MAX = 2953;                              // the most a QR code can hold (version 40, lowest error correction, binary data)
function shrConfig(){
  const ps = (typeof pendingSource !== 'undefined' && pendingSource) || {};
  return { network: activeNetwork, name: ps.name || '', code: ps.code || '' };
}
function shrLinkFor(cfg){ return window.location.origin + '/#cfg=' + btoa(unescape(encodeURIComponent(JSON.stringify(cfg)))); }
function shrArtifact(v){
  const abi = window.__lastCompiledABI, bc = window.__lastCompiledBytecode;
  if(!Array.isArray(abi) || !abi.length || !bc) return { state: 'none' };
  let kk = ''; try{ kk = ethers.utils.keccak256(bc); }catch(_){ kk = ''; }
  const results = (typeof uiDeployResults !== 'undefined' ? uiDeployResults : []);
  const exact = !!(kk && v.hash && dplRun && dplRun.hash === v.hash && dplRun.name === v.name && results.some(r => r && r.name === v.name && r.bytecodeKeccak256 === kk));
  return { state: exact ? 'exact' : 'unverified', items: abi.length };
}
function shrRead(){
  const ps = (typeof pendingSource !== 'undefined' && pendingSource) || {};
  const code = ps.code || '', net = NETWORKS[activeNetwork] || null;
  const linkEl = document.getElementById('shareUrl'), link = linkEl ? linkEl.value : '';
  let linkState = 'none';
  if(link){
    linkState = 'stale';
    try{
      const enc = link.split('#cfg=')[1]; const cfg = JSON.parse(decodeURIComponent(escape(atob(enc)))); const cur = shrConfig();
      if(cfg && cfg.network === cur.network && cfg.name === cur.name && cfg.code === cur.code) linkState = 'current';
    }catch(_){ linkState = 'stale'; }
  }
  const cfg = shrConfig();
  let potential = 0; try{ potential = shrLinkFor(cfg).length; }catch(_){ potential = 0; }
  return {
    ps, code, name: ps.name || '', net, hash: code && typeof matHash === 'function' ? matHash(code) : '', lines: code ? code.split('\n').length : 0,
    level: code && typeof matInfo === 'function' ? matInfo(ps.template).level : '',
    dmode: (typeof MC_MODES !== 'undefined' && MC_MODES[multichainMode]) ? MC_MODES[multichainMode].label : '',
    link, linkState, potential, fmt: (document.getElementById('export_format') || {}).value || '',
    ctor: (typeof pendingCtorArgs !== 'undefined' ? pendingCtorArgs : []).length
  };
}
function shrRender(){
  const list = document.getElementById('shrSummary'), notes = document.getElementById('shrNotes');
  if(!list || !notes) return;
  const v = shrRead(); list.textContent = ''; notes.textContent = '';
  const isMain = !!(v.net && v.net.isMainnet), art = shrArtifact(v);
  const row = CFBuilder.rowWriter(list);
  row('Contract', v.code ? v.name + '.sol' : 'None generated yet', v.code ? 'ok' : 'missing', v.code ? (v.ps.template || '') + (v.level ? ' · ' + v.level : '') : 'Generate one in a builder first');
  CFBuilder.networkRow(row, v.net);
  row('Deployment Mode', v.dmode || 'Unknown', v.dmode ? 'ok' : 'bad');
  /* the link */
  if(v.linkState === 'none') row('Share link', 'Not generated', 'missing', v.code ? 'It would be ' + v.potential.toLocaleString('en-US') + ' characters' : 'Without a contract it holds only the network');
  else if(v.linkState === 'current') row('Share link', v.link.length.toLocaleString('en-US') + ' characters', 'ok', 'Holds the network and the full source');
  else row('Share link', 'Out of date', 'bad', 'The contract or the network changed after it was generated: generate it again');
  if(v.code) row('When someone opens it', 'Starts on ' + (v.net ? v.net.label : 'the network in the link'), 'ok', 'The source loads as an imported contract, treated as experimental');
  /* QR */
  const qrLen = v.linkState === 'current' ? v.link.length : v.potential;
  row('QR code', qrLen && qrLen <= SHR_QR_MAX ? 'Fits' : 'Too long', qrLen && qrLen <= SHR_QR_MAX ? 'ok' : 'bad', qrLen ? qrLen.toLocaleString('en-US') + ' of ' + SHR_QR_MAX.toLocaleString('en-US') + ' characters a QR code can hold' : '');
  /* the compiled artifact */
  if(art.state === 'none') row('Compiled artifact', 'None in this session', 'missing', 'ABI and bytecode exports need a compile: compile and deploy in section 07');
  else if(art.state === 'exact') row('Compiled artifact', art.items + ' ABI items', 'ok', 'Compiled from this exact source: a deployment made on this page used the same bytecode');
  else row('Compiled artifact', art.items + ' ABI items', 'missing', 'Unverified: from the last compile in this session; this page cannot tell it is from the source on screen');
  row('Constructor', v.ctor ? v.ctor + (v.ctor === 1 ? ' argument' : ' arguments') : 'None', 'ok', v.ctor ? 'The Hardhat and Foundry scripts leave a placeholder for them' : '');
  /* the note under the format list */
  const info = document.getElementById('exportInfo');
  if(info){
    const n = v.name || 'the contract';
    const T = {
      hardhat: 'A Hardhat deploy script (ethers v5) with the ABI and the creation bytecode of the last compile inside. It uses the signer of your Hardhat configuration, and the constructor arguments are left as a placeholder.',
      forge: 'A Foundry script that deploys ' + n + ' from ../src/' + n + '.sol with the PRIVATE_KEY environment variable. It does not contain the contract: save the source with Download .sol in section 07. The constructor arguments are left as a placeholder.',
      abi: 'The ABI JSON of the last compile.',
      full: 'One JSON file with the ABI and the creation bytecode of the last compile, the source on screen, the network and a timestamp.'
    };
    info.textContent = (T[v.fmt] || '') + (v.fmt !== 'forge' && art.state === 'none' ? ' Nothing has been compiled in this session, so this export is refused until you compile.' : '') + (v.fmt !== 'forge' && art.state === 'unverified' ? ' The compiled part may belong to another source.' : '');
  }
  /* cautions */
  const note = (kind, text) => { const li = swbEl('li', '', text); li.setAttribute('data-kind', kind); notes.appendChild(li); };
  note('info', 'The link keeps everything in the part after the # (your browser does not send it to a server), and it contains the full source code.');
  if(isMain) note('warn', 'You are on a mainnet (' + v.net.label + '). The Hardhat and Foundry scripts broadcast real transactions when you run them: review them first.');
  note(qrLen && qrLen <= SHR_QR_MAX ? 'info' : 'warn', 'The QR image is drawn by api.qrserver.com, an outside service that receives the whole link, source code included. ' + (qrLen && qrLen > SHR_QR_MAX ? 'This link is too long for a QR code, so no request is made.' : 'Nothing is sent until you press QR Code.'));
}
(function shrInit(){
  if(typeof document === 'undefined') return;
  const sec = document.getElementById('sec-share'); if(!sec) return;
  let queued = false; const later = () => { if(queued) return; queued = true; queueMicrotask(() => { queued = false; shrRender(); }); };
  sec.addEventListener('change', later); sec.addEventListener('click', later);
  new MutationObserver(later).observe(sec, { attributes: true, attributeFilter: ['style'] });
  ['sidenet'].forEach(id => { const e = document.getElementById(id); if(e) new MutationObserver(later).observe(e, { subtree: true, childList: true, characterData: true }); });
  const dr = document.getElementById('deployResult'); if(dr) new MutationObserver(later).observe(dr, { childList: true, subtree: true });
  CFBuilder.addView('share', shrRender);
})();

/* ======================================================================
   TIER SYSTEM — DISABLED FOR TESTNET (all features free)
   ====================================================================== */
function checkGate(){ return true; }          // all gates open
function openPricing(){ return; }             // no-op
function closePricing(){ return; }
function updateTierUI(){ return; }
function loadTierFromStorage(){ return; }
function saveTier(){ return; }
function verifyTierOnChain(){ return Promise.resolve(); }
function showGateBlocked(){ return; }
function clearGateOverlay(){ return; }
function purchaseTier(){ alert('Tier payments are disabled in testnet mode.'); }
function activateFree(){ return; }
function payLog(msg){ console.log('[payLog]', msg); }


/* ======================================================================
   THEME TOGGLE
   ====================================================================== */
let isDark = true;
function toggleTheme(){
  isDark = !isDark;
  document.body.classList.toggle('light', !isDark);
  const btn = document.getElementById('themeBtn');
  if(btn) btn.textContent = isDark ? '☀ Light mode' : '☾ Dark mode';
  localStorage.setItem('cf_theme', isDark?'dark':'light');
}
function initTheme(){
  const saved = localStorage.getItem('cf_theme');
  if(saved==='light'){ isDark=false; document.body.classList.add('light'); const btn=document.getElementById('themeBtn'); if(btn) btn.textContent='☾ Dark mode'; }
}

/* ======================================================================
   NEW SIMPLE TEMPLATES: DAO, SmartWallet, Staking
   ====================================================================== */
function genSimpleDAO(){
  const net=NETWORKS[activeNetwork];
  const g=id=>document.getElementById(id)?.value||'';
  const name=(g('s_name')||'ArcDAO').replace(/[^A-Za-z0-9]/g,'');
  const tokenRaw = g('s_token').trim();
  const token  = tokenRaw || REQ_DRAFT_ADDR.a;   // a draft only: the governance token must be entered (see required.js)
  const daoProblems = isPortable() ? reqProblems([{ label:'Governance token', value:tokenRaw }]) : reqProblems([{ label:'Governance token', value:tokenRaw, required:true }]);
  const quorum = g('s_quorum')||'4';
  const voting = g('s_voting')||'45818';
  if(!/^\d+$/.test(voting.trim()) || Number(voting) < 1){ alert('The voting period must be a whole number of blocks, at least 1.'); return; }
  const delay  = g('s_delay')||'172800';
  const thresh = g('s_threshold')||'1000';
  let code = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Generated by ContractForge for ${net.label} (chainId ${net.chainIdDec})

interface IERC20Votes {
    function getPastVotes(address account, uint256 blockNumber) external view returns (uint256);
    function getPastTotalSupply(uint256 blockNumber) external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
}

/// @title ${name} — On-chain DAO Governance with timelock
/// @notice Token-weighted voting. Quorum: ${quorum}% (of 'for' votes), Voting period: ${voting} blocks, Timelock: ${delay}s, then 14 days to execute.
/// @dev The token must keep voting checkpoints (ERC20Votes style) and holders must delegate (even to themselves).
///      Proposing needs voting power held in the previous block, so borrowed tokens cannot open proposals.
///      The admin (the deployer at first) is a guardian: it can cancel any proposal that has not been executed. The admin can be
///      handed over in two steps (transferAdmin, then acceptAdmin by the new admin) and can give the power up for good with
///      renounceAdmin(); after a renounce nobody but a proposal's own proposer can cancel it, and the power cannot come back.
///      The voting period must be at least one block (a period of zero would make every proposal impossible to pass).
contract ${name} {
    IERC20Votes public token = IERC20Votes(${token});
    uint256 public constant QUORUM_NUMERATOR   = ${quorum};
    uint256 public constant VOTING_PERIOD      = ${voting};
    uint256 public constant PROPOSAL_THRESHOLD = ${thresh} * 10**18;
    uint256 public timelockDelay = ${delay};
    /// @notice A queued proposal can only be executed within this window after its timelock ends.
    uint256 public constant GRACE_PERIOD = 14 days;
    address public admin;
    /// @notice The account offered the admin role; it has no powers until it calls acceptAdmin().
    address public pendingAdmin;

    enum ProposalState { Pending, Active, Defeated, Succeeded, Queued, Executed, Cancelled, Expired }

    struct Proposal {
        address proposer;
        address[] targets;
        uint256[] values;
        bytes[] calldatas;
        string description;
        uint256 voteStart;
        uint256 voteEnd;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        bool executed;
        bool cancelled;
        uint256 eta;
        mapping(address => bool) hasVoted;
    }

    Proposal[] private _proposals;

    event ProposalCreated(uint256 indexed id, address proposer, string description);
    event VoteCast(address indexed voter, uint256 indexed proposalId, uint8 support, uint256 weight);
    event ProposalQueued(uint256 indexed id, uint256 eta);
    event ProposalExecuted(uint256 indexed id);
    event ProposalCancelled(uint256 indexed id);
    event AdminTransferStarted(address indexed previousAdmin, address indexed newAdmin);
    event AdminTransferred(address indexed previousAdmin, address indexed newAdmin);
    event AdminRenounced(address indexed previousAdmin);

    modifier onlyAdmin() { require(msg.sender == admin, "not admin"); _; }

    constructor() {
        require(VOTING_PERIOD >= 1, "voting period must be at least 1 block");
        admin = msg.sender;
    }

    /// @notice Offer the admin role to newAdmin (replaces an earlier offer). Nothing changes until newAdmin accepts.
    function transferAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "new admin is the zero address");
        pendingAdmin = newAdmin;
        emit AdminTransferStarted(admin, newAdmin);
    }

    /// @notice Take over the admin role after being offered it by transferAdmin().
    function acceptAdmin() external {
        require(msg.sender == pendingAdmin && msg.sender != address(0), "not pending admin");
        emit AdminTransferred(admin, msg.sender);
        admin = msg.sender;
        pendingAdmin = address(0);
    }

    /// @notice Give up the admin role for good: afterwards only a proposal's own proposer can cancel it. IRREVERSIBLE.
    function renounceAdmin() external onlyAdmin {
        emit AdminRenounced(admin);
        admin = address(0);
        pendingAdmin = address(0);
    }

    function propose(address[] calldata targets, uint256[] calldata values, bytes[] calldata calldatas, string calldata description) external returns (uint256 id) {
        require(token.getPastVotes(msg.sender, block.number - 1) >= PROPOSAL_THRESHOLD, "below threshold");
        require(targets.length == values.length && values.length == calldatas.length, "length mismatch");
        id = _proposals.length;
        _proposals.push();
        Proposal storage p = _proposals[id];
        p.proposer = msg.sender; p.targets = targets; p.values = values;
        for (uint256 i = 0; i < calldatas.length; i++) { p.calldatas.push(calldatas[i]); }
        p.description = description;
        p.voteStart = block.number + 1;
        p.voteEnd   = block.number + 1 + VOTING_PERIOD;
        emit ProposalCreated(id, msg.sender, description);
    }

    function castVote(uint256 id, uint8 support) external {
        Proposal storage p = _proposals[id];
        require(block.number > p.voteStart && block.number <= p.voteEnd, "not in voting period");
        require(!p.hasVoted[msg.sender], "already voted");
        require(support <= 2, "invalid: 0=against 1=for 2=abstain");
        uint256 weight = token.getPastVotes(msg.sender, p.voteStart);
        require(weight > 0, "no voting power");
        p.hasVoted[msg.sender] = true;
        if (support == 0) p.againstVotes += weight;
        else if (support == 1) p.forVotes += weight;
        else p.abstainVotes += weight;
        emit VoteCast(msg.sender, id, support, weight);
    }

    function queue(uint256 id) external {
        require(state(id) == ProposalState.Succeeded, "not succeeded");
        _proposals[id].eta = block.timestamp + timelockDelay;
        emit ProposalQueued(id, _proposals[id].eta);
    }

    function execute(uint256 id) external payable {
        Proposal storage p = _proposals[id];
        require(state(id) == ProposalState.Queued, "not queued");
        require(block.timestamp >= p.eta, "timelock active");
        p.executed = true;
        for (uint256 i = 0; i < p.targets.length; i++) {
            (bool ok,) = p.targets[i].call{value: p.values[i]}(p.calldatas[i]);
            require(ok, "execution reverted");
        }
        emit ProposalExecuted(id);
    }

    function cancel(uint256 id) external {
        Proposal storage p = _proposals[id];
        require(msg.sender == p.proposer || (admin != address(0) && msg.sender == admin), "not authorised");
        require(!p.executed, "already executed");
        p.cancelled = true;
        emit ProposalCancelled(id);
    }

    function state(uint256 id) public view returns (ProposalState) {
        Proposal storage p = _proposals[id];
        if (p.cancelled) return ProposalState.Cancelled;
        if (p.executed)  return ProposalState.Executed;
        if (block.number <= p.voteStart) return ProposalState.Pending;
        if (block.number <= p.voteEnd)   return ProposalState.Active;
        uint256 supply = token.getPastTotalSupply(p.voteStart);
        if (p.forVotes * 100 < supply * QUORUM_NUMERATOR || p.forVotes <= p.againstVotes)
            return ProposalState.Defeated;
        if (p.eta == 0) return ProposalState.Succeeded;
        if (block.timestamp > p.eta + GRACE_PERIOD) return ProposalState.Expired;
        return ProposalState.Queued;
    }

    function proposalsLength() external view returns (uint256) { return _proposals.length; }

    /// @notice Everything about a proposal except its votes and its actions.
    function proposalCore(uint256 id) external view returns (address proposer, uint256 voteStart, uint256 voteEnd, uint256 eta, bool executed, bool cancelled, ProposalState currentState) {
        Proposal storage p = _proposals[id];
        return (p.proposer, p.voteStart, p.voteEnd, p.eta, p.executed, p.cancelled, state(id));
    }

    /// @notice The tally so far.
    function proposalVotes(uint256 id) external view returns (uint256 forVotes, uint256 againstVotes, uint256 abstainVotes) {
        Proposal storage p = _proposals[id];
        return (p.forVotes, p.againstVotes, p.abstainVotes);
    }

    /// @notice The calls the proposal will make when it is executed.
    function proposalActions(uint256 id) external view returns (address[] memory targets, uint256[] memory values, bytes[] memory calldatas) {
        Proposal storage p = _proposals[id];
        return (p.targets, p.values, p.calldatas);
    }

    function proposalDescription(uint256 id) external view returns (string memory) { return _proposals[id].description; }

    function hasVoted(uint256 id, address account) external view returns (bool) { return _proposals[id].hasVoted[account]; }
}`;
  code = portabilize(code, [
    { kind:'addr', name:'token', type:'IERC20Votes', value:token, param:'token_', hint:'static', userSet:true, argValue:tokenRaw },
    { kind:'uint', name:'VOTING_PERIOD', rhs:voting, param:'votingPeriod_', hint:'static', value:voting, userSet:true,
      note:'Voting length in blocks. Block time differs per chain, so set it for this network.' }
  ]);
  code = matStamp(code, 'dao');
  showCode('simpleCode', name+'.sol', code);
  pendingSource = {name, code, template: 'dao', problems: daoProblems};
  renderCtorArgs();
  document.getElementById('pendingContractLabel').value = name+'.sol  ('+NETWORKS[activeNetwork].label+')';
}

function genSimpleSmartWallet(){
  const net=NETWORKS[activeNetwork];
  const g=id=>document.getElementById(id)?.value||'';
  const name      =(g('s_name')||'ArcSmartWallet').replace(/[^A-Za-z0-9]/g,'');
  const guardian  = g('s_guardian').trim();
  const guardianProblem = reqAddressProblem(guardian, { required:true, notDeployer:true });
  if(guardianProblem){ alert('Guardian '+guardianProblem+'. The wallet needs a guardian for recovery, and it must not be the wallet that deploys it.'); return; }
  const nativeDec = net.gasDecimals||18;
  const spendlimit= g('s_spendlimit').trim()||net.walletDailyDefault;
  const limitIsDefault = spendlimit === net.walletDailyDefault;
  if(!/^\d+(\.\d+)?$/.test(spendlimit) || (spendlimit.split('.')[1]||'').length > nativeDec){
    alert('The daily limit must be a plain number with at most '+nativeDec+' decimals (it is counted in '+net.gasSymbol+').'); return;
  }
  const sessionHours = Number(g('s_session').trim()||'24');
  if(!Number.isInteger(sessionHours) || sessionHours < 1 || sessionHours > 720){ alert('Session key validity must be a whole number of hours between 1 and 720 (30 days).'); return; }
  const delayDays = Number(g('s_rdelay').trim()||'2');
  if(!Number.isInteger(delayDays) || delayDays < 1 || delayDays > 30){ alert('The recovery delay must be a whole number of days between 1 and 30.'); return; }
  const limitWei = scaleUnits(spendlimit, nativeDec);
  // portable sources must not depend on the network they were generated on
  const limitDoc = isPortable() ? 'set when the wallet is deployed (constructor argument), in the smallest unit of the native currency'
                                : spendlimit+' '+net.gasSymbol+' (native currency, '+nativeDec+' decimals)';   // human units -> smallest unit of the native token
  let code = `// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

// Generated by ContractForge for ${net.label} (chainId ${net.chainIdDec})

/// @title ${name} — Smart wallet with guardian recovery
/// @notice A wallet you control (owner), with a recovery guardian and limited session keys.
/// @dev ROLES
///  - owner: full control, no limits.
///  - guardian: can only start a recovery to a new owner (after a delay), never move funds.
///  - session keys: temporary keys the owner approves for a short time. A session key
///      * can only call the addresses on its own allowlist, and never this wallet itself;
///      * cannot call the well-known token transfer / approval / permit / multicall / vault-withdraw functions
///        (see _isBlockedSelector). This is a list of known function selectors, not a guarantee: a contract with an
///        unusual way to move tokens can still do it, so NEVER allowlist token contracts or contracts that can move
///        this wallet's assets;
///      * can spend native currency only within the daily limit below, summed over execute AND executeBatch.
///    Anything an allowlisted contract does for its callers is within reach of the key, so only allowlist
///    contracts you trust.
///
///  DAILY LIMIT: ${limitDoc}, shared by all session keys.
///  It works like a bucket that refills evenly over 24 hours: a key can spend the whole limit at once, then
///  only what has refilled since. This avoids a double spend around midnight. The owner is not limited.
///  On Arc the native currency is USDC with 18 decimals, so the limit is in 18-decimal units.
///
///  RESIDUAL RISKS: the owner key has no limit; the guardian can take over the wallet if the owner does not cancel
///  a recovery in time; a token issuer (for example USDC) can block this address.
contract ${name} {
    // ------------------------------------------------------------------ errors
    error NotOwner();
    error NotAuthorised();
    error Reentrancy();
    error LengthMismatch();
    error InvalidSessionKey();
    error InvalidDuration();
    error InvalidPermissions();
    error CallNotAllowed(address target, bytes4 selector);
    error ForbiddenTarget();
    error ForbiddenCall(bytes4 selector);
    error InvalidCalldata();
    error DailyLimitExceeded(uint256 requested, uint256 available);
    error NotAContract(address target);
    error CallFailed();
    error InvalidGuardian();
    error InvalidOwner();
    error InvalidLimit();
    error InvalidDelay();
    error NotGuardian();
    error NotPendingOwner();
    error RecoveryAlreadyPending();
    error NoRecoveryPending();
    error RecoveryNotReady(uint256 activationTime);
    error GuardianMismatch();

    // ------------------------------------------------------------------ state
    address public owner;
    address public guardian = ${guardian};

    /// @notice Native-currency limit for session keys, per 24 hours (smallest unit of the native token).
    uint256 public constant DAILY_LIMIT = ${limitWei};
    /// @notice The longest a session key may stay valid, fixed when this wallet is generated (never more than 30 days).
    uint256 public constant MAX_SESSION_DURATION = ${sessionHours} hours;
    /// @notice Most (target, function) pairs one session key can be granted.
    uint256 public constant MAX_SESSION_PERMISSIONS = 32;

    /// @notice One thing a session key may do: call function selector on target. selector 0x00000000 means "send plain native currency to target" (a call with no data).
    struct Permission { address target; bytes4 selector; }

    /// @notice Session key => expiry timestamp (0 = not a session key).
    mapping(address => uint256) public sessionKeys;
    uint256 public sessionGeneration;                       // raised when the owner changes: old keys stop working
    uint256 private _versionCounter;
    mapping(address => uint256) private _sessionVersion;    // unique id of the current grant of a key
    mapping(address => uint256) private _sessionGen;        // generation the key was granted in
    mapping(bytes32 => uint256) private _permAt;            // keccak(key, target, selector) => grant version (one storage slot per pair)

    uint256 private _spendAvailable;                        // daily-limit bucket
    uint256 private _lastRefill;
    uint256 private _status = 1;                            // reentrancy guard

    // ownership (two steps) and recovery
    address public pendingOwner;
    uint256 public constant MIN_RECOVERY_DELAY = 1 days;
    uint256 public constant MAX_RECOVERY_DELAY = 30 days;
    /// @notice How long a recovery must wait before it can be executed (the owner can change it, 1 to 30 days).
    uint256 public recoveryDelay = ${delayDays} days;
    address public recoveryCandidate;                       // the new owner a recovery would install
    address public recoveryStartedBy;                       // the guardian that started it
    uint256 public recoveryActivationTime;

    event Received(address indexed from, uint256 value);
    event Executed(address indexed target, uint256 value, bytes4 selector);
    event SessionKeyAdded(address indexed key, uint256 expiry, Permission[] permissions);
    event SessionKeyRevoked(address indexed key);
    event RecoveryInitiated(address indexed guardian, address indexed newOwner, uint256 activationTime);
    event RecoveryCancelled(address indexed cancelledBy, address indexed newOwner);
    event RecoveryExecuted(address indexed previousOwner, address indexed newOwner);
    event RecoveryDelayUpdated(uint256 newDelay);
    event GuardianUpdated(address indexed previousGuardian, address indexed newGuardian);
    event OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event OwnershipTransferCancelled(address indexed cancelledCandidate);

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier nonReentrant() {
        if (_status == 2) revert Reentrancy();
        _status = 2;
        _;
        _status = 1;
    }

    constructor() {
        if (guardian == address(0) || guardian == msg.sender) revert InvalidGuardian();
        if (DAILY_LIMIT > type(uint128).max) revert InvalidLimit();
        if (recoveryDelay < MIN_RECOVERY_DELAY || recoveryDelay > MAX_RECOVERY_DELAY) revert InvalidDelay();
        owner = msg.sender;
        _spendAvailable = DAILY_LIMIT;
        _lastRefill = block.timestamp;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    // -------------------------------------------------------------- execution

    /// @notice Call one contract. The owner is unrestricted; a session key is checked against its allowlist,
    ///         the blocked token functions and the daily limit.
    function execute(address target, uint256 value, bytes calldata data)
        external
        nonReentrant
        returns (bytes memory result)
    {
        if (msg.sender != owner) {
            _checkSession(msg.sender, target, data);
            if (value > 0) _spend(value);
        }
        result = _call(target, value, data);
        emit Executed(target, value, _selector(data));
    }

    /// @notice Call several contracts in one transaction. For a session key every call is checked and the
    ///         SUM of the values is charged to the daily limit; if anything fails the whole batch reverts.
    function executeBatch(address[] calldata targets, uint256[] calldata values, bytes[] calldata datas)
        external
        nonReentrant
    {
        uint256 n = targets.length;
        if (n != values.length || n != datas.length) revert LengthMismatch();
        if (msg.sender != owner) {
            uint256 total = 0;
            for (uint256 i = 0; i < n; ++i) {
                _checkSession(msg.sender, targets[i], datas[i]);
                total += values[i];
            }
            if (total > 0) _spend(total);
        }
        for (uint256 i = 0; i < n; ++i) {
            _call(targets[i], values[i], datas[i]);
            emit Executed(targets[i], values[i], _selector(datas[i]));
        }
    }

    // ----------------------------------------------------------- session keys

    /// @notice Approve a session key for validForHours (at most MAX_SESSION_DURATION) and the exact (contract, function) pairs it may call.
    ///         Plain native currency to a contract needs its own pair with selector 0x00000000. A pair whose function is on the
    ///         blocked list (token transfers and approvals, see _isBlockedSelector) is refused. Adding a key again replaces its
    ///         pairs and expiry; revokeSessionKey removes everything.
    function addSessionKey(address key, uint256 validForHours, Permission[] calldata permissions) external onlyOwner {
        if (key == address(0) || key == owner || key == guardian || key == pendingOwner || key == recoveryCandidate || key == address(this)) {
            revert InvalidSessionKey();
        }
        if (validForHours == 0 || validForHours > MAX_SESSION_DURATION / 1 hours) {
            revert InvalidDuration();
        }
        if (permissions.length == 0 || permissions.length > MAX_SESSION_PERMISSIONS) revert InvalidPermissions();

        uint256 version = ++_versionCounter;
        _sessionVersion[key] = version;
        _sessionGen[key] = sessionGeneration;
        uint256 expiry = block.timestamp + validForHours * 1 hours;
        sessionKeys[key] = expiry;
        for (uint256 i = 0; i < permissions.length; ++i) {
            address t = permissions[i].target;
            bytes4 sel = permissions[i].selector;
            if (t == address(0) || t == address(this) || t == key) revert InvalidPermissions();
            if (sel != bytes4(0) && _isBlockedSelector(sel)) revert ForbiddenCall(sel);
            _permAt[_permKey(key, t, sel)] = version;
        }
        emit SessionKeyAdded(key, expiry, permissions);
    }

    function revokeSessionKey(address key) external onlyOwner {
        delete sessionKeys[key];
        delete _sessionVersion[key];
        emit SessionKeyRevoked(key);
    }

    function isValidSessionKey(address key) public view returns (bool) {
        return sessionKeys[key] > block.timestamp && _sessionVersion[key] != 0 && _sessionGen[key] == sessionGeneration;
    }

    /// @notice Whether key may call selector on target right now by grant (0x00000000 = plain native currency).
    function isCallAllowed(address key, address target, bytes4 selector) external view returns (bool) {
        uint256 version = _sessionVersion[key];
        return version != 0 && _permAt[_permKey(key, target, selector)] == version;
    }

    function _permKey(address key, address target, bytes4 selector) private pure returns (bytes32) {
        return keccak256(abi.encode(key, target, selector));
    }

    /// @notice Native currency a session key could still spend right now.
    function remainingDailyAllowance() public view returns (uint256) {
        uint256 elapsed = block.timestamp - _lastRefill;
        if (elapsed >= 1 days) return DAILY_LIMIT;
        uint256 refilled = _spendAvailable + (elapsed * DAILY_LIMIT) / 1 days;
        return refilled > DAILY_LIMIT ? DAILY_LIMIT : refilled;
    }

    function _spend(uint256 amount) private {
        uint256 available = remainingDailyAllowance();
        if (amount > available) revert DailyLimitExceeded(amount, available);
        _spendAvailable = available - amount;
        _lastRefill = block.timestamp;
    }

    /// @dev Order matters: the blocked list is checked first so that a blocked function is always reported as forbidden, then the
    ///      exact (target, function) pair must have been granted to this key.
    function _checkSession(address key, address target, bytes calldata data) private view {
        if (!isValidSessionKey(key)) revert NotAuthorised();
        if (target == address(this)) revert ForbiddenTarget();
        bytes4 selector;
        if (data.length != 0) {
            if (data.length < 4) revert InvalidCalldata();
            selector = bytes4(data[:4]);
            if (selector == bytes4(0) || _isBlockedSelector(selector)) revert ForbiddenCall(selector);
        }
        if (_permAt[_permKey(key, target, selector)] != _sessionVersion[key]) revert CallNotAllowed(target, selector);
    }

    /// @dev Functions a session key may never call, on any contract: ERC-20 transfer, transferFrom, approve,
    ///      increase/decreaseAllowance and permit; ERC-721/1155 approvals and transfers; ERC-777 and ERC-1363 transfer
    ///      and approval entry points; generic multicall dispatchers; ERC-4626 withdraw and redeem. This is a blocklist
    ///      of well-known selectors, so the allowlist of targets stays the main protection.
    function _isBlockedSelector(bytes4 s) private pure returns (bool) {
        return s == 0xa9059cbb      // transfer(address,uint256)
            || s == 0x23b872dd      // transferFrom(address,address,uint256)
            || s == 0x095ea7b3      // approve(address,uint256)
            || s == 0x39509351      // increaseAllowance(address,uint256)
            || s == 0xd505accf      // permit(address,address,uint256,uint256,uint8,bytes32,bytes32)
            || s == 0xa22cb465      // setApprovalForAll(address,bool)
            || s == 0x42842e0e      // safeTransferFrom(address,address,uint256)
            || s == 0xb88d4fde      // safeTransferFrom(address,address,uint256,bytes)
            || s == 0xf242432a      // safeTransferFrom(address,address,uint256,uint256,bytes)
            || s == 0x2eb2c2d6      // safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)
            || s == 0xa457c2d7      // decreaseAllowance(address,uint256)
            || s == 0x9bd9bbc6      // ERC-777 send(address,uint256,bytes)
            || s == 0x62ad1b83      // ERC-777 operatorSend(address,address,uint256,bytes,bytes)
            || s == 0x959b8c3f      // ERC-777 authorizeOperator(address)
            || s == 0x1296ee62      // ERC-1363 transferAndCall(address,uint256)
            || s == 0x4000aea0      // ERC-1363 transferAndCall(address,uint256,bytes)
            || s == 0xd8fbe994      // ERC-1363 transferFromAndCall(address,address,uint256)
            || s == 0xc1d34b89      // ERC-1363 transferFromAndCall(address,address,uint256,bytes)
            || s == 0x3177029f      // ERC-1363 approveAndCall(address,uint256)
            || s == 0xcae9ca51      // ERC-1363 approveAndCall(address,uint256,bytes)
            || s == 0xac9650d8      // multicall(bytes[])
            || s == 0x5ae401dc      // multicall(uint256,bytes[])
            || s == 0x1f0464d1      // multicall(bytes32,bytes[])
            || s == 0xb460af94      // ERC-4626 withdraw(uint256,address,address)
            || s == 0xba087652;     // ERC-4626 redeem(uint256,address,address)
    }

    function _selector(bytes calldata data) private pure returns (bytes4) {
        return data.length >= 4 ? bytes4(data[:4]) : bytes4(0);
    }

    /// @dev Low-level call that passes the target's revert reason through.
    function _call(address target, uint256 value, bytes calldata data) private returns (bytes memory result) {
        if (data.length != 0 && target.code.length == 0) revert NotAContract(target);
        bool ok;
        (ok, result) = target.call{value: value}(data);
        if (!ok) {
            if (result.length == 0) revert CallFailed();
            assembly ("memory-safe") {
                revert(add(result, 32), mload(result))
            }
        }
    }

    // --------------------------------------------------------------- recovery

    /// @notice The guardian proposes a new owner. It takes effect only after recoveryDelay, and the owner
    ///         (or the guardian) can cancel it until then.
    function initiateRecovery(address newOwner) external {
        if (msg.sender != guardian) revert NotGuardian();
        if (recoveryCandidate != address(0)) revert RecoveryAlreadyPending();
        if (newOwner == address(0) || newOwner == owner || newOwner == guardian || newOwner == address(this)) {
            revert InvalidOwner();
        }
        recoveryCandidate = newOwner;
        recoveryStartedBy = msg.sender;
        recoveryActivationTime = block.timestamp + recoveryDelay;
        emit RecoveryInitiated(msg.sender, newOwner, recoveryActivationTime);
    }

    /// @notice The owner or the guardian cancels a pending recovery.
    function cancelRecovery() external {
        if (msg.sender != owner && msg.sender != guardian) revert NotAuthorised();
        if (recoveryCandidate == address(0)) revert NoRecoveryPending();
        _cancelRecovery(msg.sender);
    }

    /// @notice Anyone can finish a recovery once the delay has passed, if it was not cancelled and the
    ///         guardian is still the one that started it.
    function executeRecovery() external {
        address candidate = recoveryCandidate;
        if (candidate == address(0)) revert NoRecoveryPending();
        if (block.timestamp < recoveryActivationTime) revert RecoveryNotReady(recoveryActivationTime);
        if (guardian != recoveryStartedBy) revert GuardianMismatch();
        address previous = owner;
        owner = candidate;
        pendingOwner = address(0);
        sessionGeneration += 1;                             // session keys of the old owner stop working
        recoveryCandidate = address(0);
        recoveryStartedBy = address(0);
        recoveryActivationTime = 0;
        emit RecoveryExecuted(previous, candidate);
        emit OwnershipTransferred(previous, candidate);
    }

    /// @notice Change how long a new recovery has to wait (1 to 30 days). Does not affect one already started.
    function setRecoveryDelay(uint256 newDelay) external onlyOwner {
        if (newDelay < MIN_RECOVERY_DELAY || newDelay > MAX_RECOVERY_DELAY) revert InvalidDelay();
        recoveryDelay = newDelay;
        emit RecoveryDelayUpdated(newDelay);
    }

    /// @notice Replace the guardian. Any recovery the old guardian started is cancelled.
    function setGuardian(address newGuardian) external onlyOwner {
        if (newGuardian == address(0) || newGuardian == owner || newGuardian == address(this)) revert InvalidGuardian();
        if (recoveryCandidate != address(0)) _cancelRecovery(msg.sender);
        emit GuardianUpdated(guardian, newGuardian);
        guardian = newGuardian;
    }

    function _cancelRecovery(address by) private {
        address candidate = recoveryCandidate;
        recoveryCandidate = address(0);
        recoveryStartedBy = address(0);
        recoveryActivationTime = 0;
        emit RecoveryCancelled(by, candidate);
    }

    // -------------------------------------------------------------- ownership

    /// @notice Step 1: the owner names the next owner. Nothing changes until that address accepts.
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0) || newOwner == owner || newOwner == guardian || newOwner == address(this)) {
            revert InvalidOwner();
        }
        pendingOwner = newOwner;
        emit OwnershipTransferStarted(owner, newOwner);
    }

    /// @notice Step 2: the named address accepts. Session keys of the old owner stop working and a pending recovery is cancelled.
    function acceptOwnership() external {
        if (msg.sender != pendingOwner) revert NotPendingOwner();
        if (msg.sender == guardian) revert InvalidOwner();
        address previous = owner;
        owner = msg.sender;
        pendingOwner = address(0);
        sessionGeneration += 1;
        if (recoveryCandidate != address(0)) _cancelRecovery(msg.sender);
        emit OwnershipTransferred(previous, msg.sender);
    }

    function cancelOwnershipTransfer() external onlyOwner {
        emit OwnershipTransferCancelled(pendingOwner);
        pendingOwner = address(0);
    }

    // ------------------------------------------------- signatures (ERC-1271)

    bytes32 private constant _DOMAIN_TYPEHASH = keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
    bytes32 private constant _WALLET_TYPEHASH = keccak256("SmartWalletMessage(bytes32 hash)");

    /// @notice The digest the owner must actually sign for isValidSignature(hash, ...). It mixes in this wallet's
    ///         address and the chain id, so a signature made for one wallet (or chain) is worthless on another.
    function replaySafeHash(bytes32 hash) public view returns (bytes32) {
        bytes32 domain = keccak256(abi.encode(_DOMAIN_TYPEHASH, keccak256("ContractForge Smart Wallet"), keccak256("1"), block.chainid, address(this)));
        return keccak256(abi.encodePacked("\\x19\\x01", domain, keccak256(abi.encode(_WALLET_TYPEHASH, hash))));
    }

    /// @notice Lets other contracts ask whether the owner signed a hash (ERC-1271). Only the owner's ECDSA signature
    ///         counts (not session keys). The owner signs replaySafeHash(hash), not the raw hash.
    function isValidSignature(bytes32 hash, bytes calldata signature) external view returns (bytes4) {
        if (signature.length != 65) return 0xffffffff;
        bytes32 r = bytes32(signature[0:32]);
        bytes32 s = bytes32(signature[32:64]);
        uint8 v = uint8(signature[64]);
        // reject the mirrored (malleable) form of a signature and unknown recovery ids
        if (uint256(s) > 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0) return 0xffffffff;
        if (v != 27 && v != 28) return 0xffffffff;
        address signer = ecrecover(replaySafeHash(hash), v, r, s);
        return (signer != address(0) && signer == owner) ? bytes4(0x1626ba7e) : bytes4(0xffffffff);
    }

    // ---------------------------------------- receiving NFTs (ERC-721 / 1155)

    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return 0x150b7a02;
    }

    function onERC1155Received(address, address, uint256, uint256, bytes calldata) external pure returns (bytes4) {
        return 0xf23a6e61;
    }

    function onERC1155BatchReceived(address, address, uint256[] calldata, uint256[] calldata, bytes calldata)
        external
        pure
        returns (bytes4)
    {
        return 0xbc197c81;
    }

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == 0x01ffc9a7      // ERC-165
            || interfaceId == 0x150b7a02      // ERC-721 receiver
            || interfaceId == 0x4e2312e0;     // ERC-1155 receiver
    }
}
`;
  code = portabilize(code, [
    { kind:'uint', name:'DAILY_LIMIT', rhs:limitWei, param:'dailyLimit_', hint:'nativeScaled', units:spendlimit, perNetworkDefault:limitIsDefault, value:'',
      note:'Daily spend limit for session keys, in the native token smallest unit ('+nativeDec+' decimals here).' }
  ]);
  code = matStamp(code, 'smartwallet');
  showCode('simpleCode', name+'.sol', code);
  pendingSource = {name, code, template: 'smartwallet', notDeployer: [{ label:'Guardian', value:guardian }],
    facts: [['Session-key daily limit', isPortable() ? spendlimit+' (gas token of each network)' : spendlimit+' '+net.gasSymbol]],
    acks: ['I checked the daily limit for session keys shown above']};
  renderCtorArgs();
  document.getElementById('pendingContractLabel').value = name+'.sol  ('+NETWORKS[activeNetwork].label+')';
}

function genSimpleStaking(){
  const net=NETWORKS[activeNetwork];
  const g=id=>document.getElementById(id)?.value||'';
  const name   =(g('s_name')||'ArcStaking').replace(/[^A-Za-z0-9]/g,'');
  const stkTok = resolveToken(g('s_token'),'usdc');
  const rwdTok = g('s_reward')||stkTok;
  const stakingProblems = [reqTokenProblem('Staking token', g('s_token'), stkTok, net.label), g('s_reward').trim() ? reqTokenProblem('Reward token', g('s_reward'), rwdTok, net.label) : ''].filter(Boolean);
  const apy    = g('s_apy')||'12';
  const lock   = g('s_lock')||'30';
  const exitFee= g('s_exitfee')||'100';
  let code = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Generated by ContractForge for ${net.label} (chainId ${net.chainIdDec})

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/// @title ${name} — Staking Rewards
/// @notice ${apy}% APY · ${lock}-day lock · ${exitFee} bps early-exit penalty
/// @dev Rewards are paid in the reward token from a pool the owner funds (rewardPool). Reward units are the
///      reward token's smallest unit, so use a reward token with the same decimals as the staking token.
///      Earned rewards are always recorded for the staker. If the pool runs short a claim pays what is
///      available and the rest stays claimable, and withdrawing principal never depends on a reward payment.
contract ${name} {
    IERC20 public stakingToken = IERC20(${stkTok});
    IERC20 public rewardToken  = IERC20(${rwdTok||stkTok});
    address public owner;
    /// @notice The account offered the owner role by transferOwnership(); it has no powers until it calls acceptOwnership().
    address public pendingOwner;

    uint256 public constant APY_BPS      = ${apy} * 100;
    uint256 public constant LOCK_PERIOD  = ${lock} days;
    uint256 public constant EXIT_FEE_BPS = ${exitFee};
    uint256 public totalStaked;
    uint256 public rewardPool;
    /// @notice Early-exit fees collected for the owner (claimed with claimFees).
    uint256 public accruedFees;
    uint256 private _locked = 1;

    struct Position {
        uint256 amount;
        uint256 stakedAt;
        uint256 lastUpdate;
        uint256 accrued;   // rewards earned up to lastUpdate and not paid yet
    }

    mapping(address => Position) public positions;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount, uint256 fee);
    event RewardClaimed(address indexed user, uint256 reward);
    event RewardPoolFunded(uint256 amount);
    event FeesClaimed(address indexed to, uint256 amount);
    event OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event OwnershipTransferCancelled(address indexed previousOwner, address indexed pendingOwner);

    modifier onlyOwner() { require(msg.sender == owner, "not owner"); _; }

    modifier nonReentrant() {
        require(_locked == 1, "reentrant call");
        _locked = 2;
        _;
        _locked = 1;
    }

    constructor() { owner = msg.sender; }

    /// @notice Offer the owner role (fundRewardPool/claimFees) to newOwner; it takes effect when newOwner accepts.
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0) && newOwner != owner && newOwner != address(this), "invalid new owner");
        pendingOwner = newOwner;
        emit OwnershipTransferStarted(owner, newOwner);
    }

    /// @notice Take over the owner role after being offered it.
    function acceptOwnership() external {
        require(msg.sender == pendingOwner && msg.sender != address(0), "not pending owner");
        emit OwnershipTransferred(owner, msg.sender);
        owner = msg.sender;
        pendingOwner = address(0);
    }

    /// @notice The current owner cancels a pending transfer.
    function cancelOwnershipTransfer() external onlyOwner {
        emit OwnershipTransferCancelled(owner, pendingOwner);
        pendingOwner = address(0);
    }

    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "zero amount");
        _accrue(msg.sender);
        uint256 received = _pull(stakingToken, amount);
        Position storage pos = positions[msg.sender];
        pos.amount   += received;
        pos.stakedAt  = block.timestamp;
        totalStaked  += received;
        emit Staked(msg.sender, received);
    }

    /// @notice Withdraw principal. Rewards earned so far stay recorded and can be claimed separately.
    function unstake(uint256 amount) external nonReentrant {
        Position storage pos = positions[msg.sender];
        require(amount > 0 && pos.amount >= amount, "insufficient stake");
        _accrue(msg.sender);
        uint256 fee = 0;
        if (block.timestamp < pos.stakedAt + LOCK_PERIOD)
            fee = (amount * EXIT_FEE_BPS + 9999) / 10000;   // rounds up, so splitting an exit cannot avoid the fee
        if (fee > amount) fee = amount;
        pos.amount -= amount;
        totalStaked -= amount;
        accruedFees += fee;
        emit Unstaked(msg.sender, amount - fee, fee);
        _callToken(address(stakingToken), abi.encodeCall(IERC20.transfer, (msg.sender, amount - fee)));
    }

    /// @notice Pay out the rewards earned so far (as much as the reward pool can cover).
    function claim() external nonReentrant returns (uint256 paid) {
        _accrue(msg.sender);
        Position storage pos = positions[msg.sender];
        paid = pos.accrued < rewardPool ? pos.accrued : rewardPool;
        require(paid > 0, "nothing to claim");
        pos.accrued -= paid;
        rewardPool  -= paid;
        emit RewardClaimed(msg.sender, paid);
        _callToken(address(rewardToken), abi.encodeCall(IERC20.transfer, (msg.sender, paid)));
    }

    function pendingReward(address user) public view returns (uint256) {
        Position storage pos = positions[user];
        uint256 live = pos.amount == 0 ? 0 : (pos.amount * APY_BPS * (block.timestamp - pos.lastUpdate)) / (10000 * 365 days);
        return pos.accrued + live;
    }

    function fundRewardPool(uint256 amount) external onlyOwner nonReentrant {
        uint256 received = _pull(rewardToken, amount);
        rewardPool += received;
        emit RewardPoolFunded(received);
    }

    /// @notice Sends the collected early-exit fees to the owner. Anyone may call it.
    function claimFees() external nonReentrant returns (uint256 amount) {
        amount = accruedFees;
        require(amount > 0, "no fees");
        accruedFees = 0;
        emit FeesClaimed(owner, amount);
        _callToken(address(stakingToken), abi.encodeCall(IERC20.transfer, (owner, amount)));
    }

    function _accrue(address user) internal {
        Position storage pos = positions[user];
        if (pos.amount > 0) {
            pos.accrued += (pos.amount * APY_BPS * (block.timestamp - pos.lastUpdate)) / (10000 * 365 days);
        }
        pos.lastUpdate = block.timestamp;
    }

    /// @dev Pulls tokens from the caller and returns what actually arrived (so fee-on-transfer tokens are credited correctly).
    function _pull(IERC20 token, uint256 amount) private returns (uint256 received) {
        uint256 balBefore = token.balanceOf(address(this));
        _callToken(address(token), abi.encodeCall(IERC20.transferFrom, (msg.sender, address(this), amount)));
        received = token.balanceOf(address(this)) - balBefore;
    }

    /// @dev Works with tokens that return nothing (e.g. USDT) as well as tokens that return a bool.
    function _callToken(address token, bytes memory data) private {
        (bool ok, bytes memory ret) = token.call(data);
        require(ok && (ret.length == 0 || abi.decode(ret, (bool))), "token transfer failed");
    }
}`;

  const sameReward = (rwdTok||stkTok) === stkTok;
  code = portabilize(code, [
    { kind:'addr', name:'stakingToken', type:'IERC20', value:stkTok, param:'stakingToken_', hint:'usdc', userSet:!!g('s_token').trim() },
    { kind:'addr', name:'rewardToken', type:'IERC20', value:(rwdTok||stkTok), param: sameReward ? 'stakingToken_' : 'rewardToken_', hint: sameReward ? 'usdc' : 'static', userSet:!sameReward }
  ]);
  code = matStamp(code, 'staking');
  showCode('simpleCode', name+'.sol', code);
  pendingSource = {name, code, template: 'staking', problems: stakingProblems};
  renderCtorArgs();
  document.getElementById('pendingContractLabel').value = name+'.sol  ('+NETWORKS[activeNetwork].label+')';
}

/* ======================================================================
   CONTRACT WIZARD
   ====================================================================== */
let wizardState = {step:0, category:'', subtype:''};

const WIZARD_SUBTYPES = {
  token:   [{id:'erc20',name:'ERC-20 Token',sub:'Fungible with mint/burn'},
            {id:'erc721',name:'NFT Collection',sub:'ERC-721 with royalties'}],
  payment: [{id:'escrow',name:'Escrow',sub:'Buyer/seller with arbiter'},
            {id:'vesting',name:'Vesting',sub:'Linear release with cliff'},
            {id:'paywall',name:'Subscription',sub:'Recurring payments'}],
  defi:    [{id:'swap',name:'AMM Swap',sub:'Constant-product x*y=k'},
            {id:'vault',name:'Vault ERC-4626',sub:'Yield-bearing vault'},
            {id:'staking',name:'Staking',sub:'Stake and earn rewards'}],
  org:     [{id:'dao',name:'DAO Governance',sub:'Vote → timelock → execute'},
            {id:'treasury',name:'Treasury',sub:'Multisig + streaming'}],
  bridge:  [{id:'crosschain',name:'CCTP Payment',sub:'Burn/mint across chains'}],
  wallet:  [{id:'smartwallet',name:'Smart Wallet',sub:'Guardian recovery and session keys'}],
};

function wizardPick(category, el){
  document.querySelectorAll('#wp-0 .tcard').forEach(c=>c.classList.remove('selected'));
  el.classList.add('selected');
  if(wizardState.category !== category) wizardState.subtype = '';   // a contract picked under another goal must not survive the change (it used to be routed to anyway)
  wizardState.category = category;
  const subs = WIZARD_SUBTYPES[category]||[];
  const container = document.getElementById('wz-subtypes');
  container.innerHTML='';
  subs.forEach(s=>{
    const c=document.createElement('div');
    c.className='tcard'; c.style.padding='16px'; c.style.cursor='pointer';
    c.innerHTML=`<h3 style="font-size:16px;">${s.name}</h3>${typeof matBadgeFor==='function'?'<div class="mat-row">'+matBadgeFor(s.id==='swap'?'swap-amm-single':s.id)+'</div>':''}<p style="font-size:12px;">${s.sub}</p>`;
    c.onclick=()=>{
      document.querySelectorAll('#wp-1 .tcard').forEach(x=>x.classList.remove('selected'));
      c.classList.add('selected');
      wizardState.subtype=s.id;
    };
    container.appendChild(c);
  });
  wizardNext();
}

function wizardNext(){
  if(wizardState.step===0 && !wizardState.category) return;
  if(wizardState.step===1 && !wizardState.subtype)  return;
  wizardState.step = Math.min(wizardState.step+1, 3);
  renderWizardStep();
}

function wizardBack(){
  wizardState.step = Math.max(wizardState.step-1,0);
  renderWizardStep();
}

function renderWizardStep(){
  const step=wizardState.step;
  document.querySelectorAll('.wstep').forEach((el,i)=>{
    el.classList.toggle('active', i===step);
    el.classList.toggle('done', i<step);
  });
  document.querySelectorAll('.wizard-panel').forEach((el,i)=>{
    el.classList.toggle('active', i===step);
  });
  document.getElementById('wz-back').style.display = step>0?'inline-flex':'none';
  document.getElementById('wz-next').style.display = (step>0&&step<3)?'inline-flex':'none';
  if(step===2){
    const nb=document.getElementById('wz-netbar'); nb.innerHTML='';
    // Show testnet group first, then mainnets
    const testnets = Object.entries(NETWORKS).filter(([,n])=>!n.isMainnet);
    const mainnets = Object.entries(NETWORKS).filter(([,n])=>n.isMainnet);

    const mkLabel=(txt)=>{ const l=document.createElement('div'); l.style.cssText='font-family:var(--mono);font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:#5C6B65;width:100%;margin:8px 0 4px;'; l.textContent=txt; nb.appendChild(l); };

    mkLabel('Testnets');
    testnets.forEach(([key,net])=>{
      const b=document.createElement('div'); b.className='netbtn'+(key===activeNetwork?' active':'');
      b.innerHTML=`<span class="chip"></span>${net.label}`;
      b.onclick=()=>{ activeNetwork=key; renderNetBar(); updateSideNet(); document.querySelectorAll('#wz-netbar .netbtn').forEach(x=>x.classList.remove('active')); b.classList.add('active'); };
      nb.appendChild(b);
    });
    mkLabel('⚠ Mainnets (real funds)');
    mainnets.forEach(([key,net])=>{
      const b=document.createElement('div'); b.className='netbtn'+(key===activeNetwork?' active':'');
      b.style.cssText='border-color:#3A2A0A;';
      b.innerHTML=`<span class="chip" style="background:#C9A24B;"></span>${net.label} <span style="font-family:var(--mono);font-size:8px;color:#C9A24B;margin-left:3px;">LIVE</span>`;
      b.onclick=async ()=>{
        if(!(await confirmMainnet(net.label))) return;
        activeNetwork=key; renderNetBar(); updateSideNet();
        document.querySelectorAll('#wz-netbar .netbtn').forEach(x=>x.classList.remove('active')); b.classList.add('active');
      };
      nb.appendChild(b);
    });
  }
  if(step===3){
    const subs=WIZARD_SUBTYPES[wizardState.category]||[];
    const sub=subs.find(s=>s.id===wizardState.subtype);
    document.getElementById('wz-summary-title').textContent = sub?sub.name:'Selected contract';
    document.getElementById('wz-summary-sub').textContent   = NETWORKS[activeNetwork].label+' · chainId '+NETWORKS[activeNetwork].chainIdDec;
  }
}

function wizardGenerate(){
  const sub=wizardState.subtype;
  const isAdv=['swap','vault','treasury','multisend','crosschain'].includes(sub);
  const target=isAdv?sub:'simple';
  navigateTo(target);
  if(!isAdv){
    renderSimpleForm(sub);
    setTimeout(()=>{
      document.querySelectorAll('#simpleGrid .tcard').forEach(c=>{ if(c.dataset.id===sub) c.click(); });
    }, 100);
  }
  window.scrollTo({top:0,behavior:'smooth'});
}

/* ---- The Contract Wizard overview (Phase 9.6). The wizard itself (wizardPick, wizardNext, wizardBack, renderWizardStep, wizardGenerate) is
   unchanged. It does not generate a contract: it routes. Swap, Vault, Treasury and Crosschain open their own builder; every other choice
   opens Simple contracts with that template selected (after a short delay). The MultiSend builder is not offered by the wizard. The network
   step switches the app's active network at once (a mainnet asks to confirm first). This view only reads wizardState, activeNetwork and the
   Deployment Mode, and never writes them. ---- */
const WZ_CATEGORY = { token: 'Launch a token', payment: 'Handle payments', defi: 'Build DeFi', org: 'Govern an org', bridge: 'Move value cross-chain', wallet: 'Smart wallet' };
const WZ_STEPS = ['What to build', 'Configure', 'Network', 'Review & generate'];
/* opens: where wizardGenerate() lands; ctor: the constructor arguments in the portable modes (none in Single network mode), as generated. */
const WZ_INFO = {
  erc20:       { opens: 'Simple contracts: ERC-20 Token', ctor: [], notes: ['Owner-controlled mint, an optional cap and optional burn.'] },
  erc721:      { opens: 'Simple contracts: NFT Collection', ctor: ['usdc_'], notes: ['Mints are paid in USDC by default; a free mint (price 0) needs no stablecoin.'] },
  escrow:      { opens: 'Simple contracts: Buyer/Seller Escrow', ctor: ['token_'], notes: ['Needs a buyer, a seller and an arbiter, three different addresses: otherwise the builder writes a DRAFT.'] },
  vesting:     { opens: 'Simple contracts: Linear Vesting', ctor: ['token_'], notes: ['Needs a beneficiary address: otherwise the builder writes a DRAFT.'] },
  paywall:     { opens: 'Simple contracts: Paywall / Subscription', ctor: ['token_'], notes: ['Needs a beneficiary address: otherwise the builder writes a DRAFT.'] },
  staking:     { opens: 'Simple contracts: Staking Rewards', ctor: ['stakingToken_'], notes: ['Stakes an ERC-20 and pays rewards over time. An empty reward token means the staking token.'] },
  dao:         { opens: 'Simple contracts: DAO Governance', ctor: ['token_', 'votingPeriod_'], notes: ['Needs a governance token in Single network mode (a DRAFT otherwise).', 'The voting period is counted in blocks, and block times differ between chains.'] },
  smartwallet: { opens: 'Simple contracts: Smart Wallet', ctor: ['dailyLimit_'], notes: ['Needs a guardian address that is not the account that deploys the wallet: otherwise the builder refuses to generate.'] },
  swap:        { opens: 'Swap / AMM', ctor: ['tokenA_', 'tokenB_'], notes: ['Opens the Swap / AMM builder with the constant-product AMM. The order-book swap is a choice inside the builder.'] },
  vault:       { opens: 'Vault (ERC-4626)', ctor: ['asset_'], notes: ['The asset defaults to the USDC of the active network. Robinhood Chain and Robinhood Testnet have none, so you type the token address.'] },
  treasury:    { opens: 'Treasury', ctor: ['gasTokenAlias_'], notes: ['Needs the signer addresses, one per line: without them the builder writes a DRAFT with a placeholder signer.'] },
  crosschain:  { opens: 'Crosschain (CCTP)', ctor: ['tokenMessenger_', 'messageTransmitter_', 'usdc_'], notes: ['Single network mode writes the payments contract; the portable modes write the CCTP V2 bridge.'] }
};

function wzRender(){
  const list = document.getElementById('wzSummaryList'), ul = document.getElementById('wzNotes');
  if(!list || !ul || typeof wizardState === 'undefined') return;
  const net = (typeof NETWORKS !== 'undefined' && NETWORKS[activeNetwork]) || null;
  const portable = typeof isPortable === 'function' ? isPortable() : false;
  const dmode = (typeof MC_MODES !== 'undefined' && typeof multichainMode !== 'undefined' && MC_MODES[multichainMode]) ? MC_MODES[multichainMode].label : '';
  const subs = WIZARD_SUBTYPES[wizardState.category] || [], sub = subs.find(s => s.id === wizardState.subtype);
  const info = sub ? WZ_INFO[sub.id] : null;
  list.textContent = '';
  const row = CFBuilder.rowWriter(list);
  row('Step', (wizardState.step + 1) + ' of 4: ' + WZ_STEPS[wizardState.step], 'ok');
  row('Goal', WZ_CATEGORY[wizardState.category] || 'Not chosen yet', WZ_CATEGORY[wizardState.category] ? 'ok' : 'missing');
  row('Contract', sub ? sub.name : 'Not chosen yet', sub ? 'ok' : 'missing');
  row('Opens', info ? info.opens : 'Choose a contract first', info ? 'ok' : 'missing');
  if(net) CFBuilder.networkRow(row, net); else row('Network', 'Unknown', 'bad');
  row('Deployment Mode', dmode || 'Unknown', dmode ? 'ok' : 'bad', info ? (portable && info.ctor.length ? 'Constructor arguments: ' + info.ctor.join(', ') : 'No constructor arguments') : '');
  ul.textContent = '';
  const add = (t, kind) => { const li = swbEl('li', '', t); if(kind) li.setAttribute('data-kind', kind); ul.appendChild(li); };
  if(!info){ add('Choose what you want to build and the wizard shows what the contract needs and where it opens.'); }
  else {
    info.notes.forEach(t => add(t));
    if(sub.id === 'crosschain' && net){
      const v1 = !!(net.cctp && net.cctp.tokenMessenger && net.cctp.messageTransmitter), v2 = typeof cctpV2 === 'function' && !!cctpV2(activeNetwork);
      if(!portable && !v1) add(net.label + ' is not in the CCTP V1 address table: in Single network mode the builder writes a DRAFT until you enter the addresses.' + (v2 ? ' The portable modes use CCTP V2, which ' + net.label + ' has.' : ''), 'warn');
      if(portable && !v2) add(net.label + ' has no CCTP V2 deployment in this app: you enter the addresses on the deploy page.', 'warn');
    }
  }
  if(wizardState.step >= 2) add('Choosing a network here switches the app\'s active network at once. A mainnet asks you to confirm first, and deploying to one needs the maturity confirmation.');
}
(function wzInit(){
  if(typeof document === 'undefined') return;
  const sec = document.getElementById('sec-wizard'); if(!sec) return;
  sec.addEventListener('click', () => setTimeout(wzRender, 0));                                                   // every wizard control is a click
  ['wizardSteps', 'wz-subtypes', 'wz-netbar'].forEach(id => { const el = document.getElementById(id); if(el) new MutationObserver(() => wzRender()).observe(el, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] }); });
  const sn = document.getElementById('sidenet'); if(sn) new MutationObserver(() => wzRender()).observe(sn, { childList: true, characterData: true, subtree: true });   // the network changed elsewhere
  CFBuilder.addView('wizard', wzRender);
})();

/* ---- The Compile & Deploy workspace (Phases 9.7 and 9.8). The deploy page itself (compileAndDeploy, compilePending, compileSource,
   deployCompiled, collectCtorValues, matGate, mainnetDeployConfirm, the constructor panel, Multi-deploy, the results card, the activity
   console, the mainnet banner and every gate) is unchanged: its elements were only moved into the new layout and keep their ids, handlers and
   values. This code only reads: pendingSource, reqBlockReason(), the constructor inputs, the wallet, the maturity approvals, the multi-deploy
   selection and the results the page itself records. It never compiles, asks the wallet or deploys, and it cannot claim a deployment that it
   cannot tie to the exact source on screen.
   Exact association: the page clears its results at the START of every deploy run (single or multi), right before it compiles the buffer. The
   source hash is noted at that moment, so a result is "confirmed for this source" only when the source on screen is that same source. Results
   from an earlier source, or from a run this page did not see start, are shown as "unverified". ---- */
let dplRun = null;                                    // { hash, name } of the source the page started its latest deploy run with
function dplTrackRuns(){
  if(typeof uiResetDeployResults !== 'function' || uiResetDeployResults.__dplTracked) return;
  const orig = uiResetDeployResults;
  const tracked = function(){
    try{ const ps = (typeof pendingSource !== 'undefined' && pendingSource) || {}; dplRun = { hash: ps.code ? matHash(ps.code) : '', name: ps.name || '' }; }catch(_){ dplRun = null; }
    return orig.apply(this, arguments);
  };
  tracked.__dplTracked = true;
  uiResetDeployResults = tracked;
}
function dplRead(){
  const ps = (typeof pendingSource !== 'undefined' && pendingSource) || {};
  const code = ps.code || '';
  const net = (typeof NETWORKS !== 'undefined' && NETWORKS[activeNetwork]) || null;
  const sameDeployer = (ps.notDeployer || []).find(x => typeof reqAddressProblem === 'function' && reqAddressProblem(x.value, { notDeployer: true }) === 'cannot be the wallet that deploys the contract');
  const args = (typeof pendingCtorArgs !== 'undefined' ? pendingCtorArgs : []).map((a, i) => {
    const el = document.getElementById('ctor_arg_' + i), val = el ? String(el.value).trim() : '';
    let problem = '';
    if(!val && !a.optional) problem = a.param.replace(/_$/, '') + ' needs a value';
    else if(val && a.type === 'address' && typeof reqAddressProblem === 'function'){ const p = reqAddressProblem(val, { allowZero: !!a.allowZero }); if(p) problem = a.param.replace(/_$/, '') + ' ' + p; }
    return { a, val, problem };
  });
  const sel = (typeof mdState !== 'undefined') ? [...mdState.selected].filter(k => NETWORKS[k]) : [];
  const hash = code && typeof matHash === 'function' ? matHash(code) : '';
  const all = (typeof uiDeployResults !== 'undefined' ? uiDeployResults : []).filter(r => r && r.name === ps.name && ps.name);
  const verified = !!(all.length && dplRun && dplRun.hash && dplRun.hash === hash && dplRun.name === ps.name);
  return {
    ps, code, name: ps.name || '', template: ps.template || '', net, hash,
    lines: code ? code.split('\n').length : 0,
    level: code && typeof matInfo === 'function' ? matInfo(ps.template).level : '',
    block: code && typeof reqBlockReason === 'function' ? reqBlockReason() : '',
    sameDeployer: sameDeployer ? sameDeployer.label : '',
    version: (document.getElementById('solcVersion') || {}).value || '',
    dmode: (typeof MC_MODES !== 'undefined' && typeof multichainMode !== 'undefined' && MC_MODES[multichainMode]) ? MC_MODES[multichainMode].label : '',
    mdOn: typeof mdVisible === 'function' && mdVisible(), sel,
    args, argProblem: (args.find(x => x.problem) || {}).problem || '',
    wallet: (typeof signer !== 'undefined' && signer && typeof account !== 'undefined' && account) ? account : '',
    results: verified ? all : [], unverified: all.length && !verified ? all : []
  };
}
let dplShown = '';                                    // what the read-only preview currently holds, so it is rewritten only when the source changes
function dplRender(){
  const list = document.getElementById('dplSummary'), prog = document.getElementById('dplProgress');
  if(!list || !prog) return;
  dplTrackRuns();
  const v = dplRead();
  list.textContent = ''; prog.textContent = '';
  const net = v.net, isMain = !!(net && net.isMainnet), blocked = !!(v.block || v.sameDeployer);
  const row = CFBuilder.rowWriter(list);
  /* header strip */
  const head = document.getElementById('dplHead');
  if(head){
    head.textContent = '';
    const chip = (k, val, cls) => { const c = swbEl('span', 'dpl-chip' + (cls ? ' ' + cls : '')); c.appendChild(swbEl('i', '', k)); c.appendChild(swbEl('b', '', val)); head.appendChild(c); };
    chip('Contract', v.code ? v.name + '.sol' : 'None yet');
    if(v.code) chip('Maturity', v.level || 'unknown', 'lvl-' + (v.level || 'unknown'));
    chip('Compiler', v.version ? 'solc ' + v.version : 'Unknown');
    chip('Mode', v.dmode || 'Unknown');
    chip('Network', net ? net.label + (isMain ? ' · LIVE' : '') : 'Unknown', isMain ? 'live' : '');
    if(v.code) chip('Size', v.lines + ' lines');
  }
  /* read-only source preview */
  const srcEl = document.getElementById('dplSource'), sum = document.getElementById('dplSrcSum');
  const key = v.code ? v.hash + '|' + v.name : '';
  if(srcEl && dplShown !== key){ srcEl.textContent = v.code || ''; dplShown = key; }
  if(sum) sum.textContent = v.code ? 'Solidity preview · ' + v.lines + ' lines · read only' : 'Solidity preview · generate a contract first';
  /* constructor and network cards */
  const cc = document.getElementById('dplCtorCount'), ce = document.getElementById('dplCtorEmpty');
  if(cc) cc.textContent = !v.code ? '' : (v.args.length ? v.args.length + (v.args.length === 1 ? ' argument' : ' arguments') + (v.argProblem ? ' · needs attention' : ' · filled') : 'none');
  if(ce){ ce.hidden = v.args.length > 0 && !!v.code; ce.textContent = !v.code ? 'Generate a contract to see its constructor arguments.' : 'This contract has no constructor arguments in this Deployment Mode.'; }
  const nc = document.getElementById('dplNetCount'), nn = document.getElementById('dplNetNote');
  if(nc) nc.textContent = v.mdOn ? (v.sel.length ? v.sel.length + ' selected' + (v.sel.some(k => NETWORKS[k].isMainnet) ? ' · includes live networks' : '') : 'none selected') : '1 network';
  if(nn) nn.textContent = v.mdOn ? 'Nothing is selected for you. Each mainnet asks for the maturity confirmation, and each network asks for your confirmation in the wallet.' : 'Single and Portable modes deploy to the active network' + (net ? ': ' + net.label + (isMain ? ' (live, real funds)' : '') : '') + '. Change the network from the header; the multi-network selection appears in the Multi-deploy and Crosschain modes.';
  const rn = document.getElementById('dplResNote');
  if(rn){ rn.hidden = typeof uiDeployResults !== 'undefined' && uiDeployResults.length > 0; rn.textContent = 'Nothing deployed yet. Confirmed deployments appear here once the wallet transaction is confirmed.'; }
  /* summary */
  row('Contract', v.code ? v.name + '.sol' : 'None generated yet', v.code ? 'ok' : 'missing', v.code ? (v.template || '') + (v.level ? ' · ' + v.level : '') : 'Generate one in a builder first');
  if(v.code){
    if(v.block) row('Source', 'Draft', 'bad', v.block);
    else if(v.sameDeployer) row('Source', 'Blocked', 'bad', v.sameDeployer + ' cannot be the wallet that deploys the contract');
    else row('Source', 'Ready to compile', 'ok');
  }
  row('Compiler', v.version ? 'solc ' + v.version : 'Unknown', v.version ? 'ok' : 'bad', 'Compiled in the browser');
  CFBuilder.networkRow(row, net);
  row('Deployment Mode', v.dmode || 'Unknown', v.dmode ? 'ok' : 'bad');
  if(v.mdOn){
    if(!v.sel.length) row('Multi-deploy', 'No network selected', 'missing', 'Pick the networks in the panel');
    else { const mains = v.sel.filter(k => NETWORKS[k].isMainnet).length; row('Multi-deploy', v.sel.length + (v.sel.length === 1 ? ' network' : ' networks'), 'ok', mains ? mains + ' mainnet' + (mains > 1 ? 's' : '') + ': each asks for the maturity confirmation' : 'Testnets only'); }
  }
  if(v.code){
    if(!v.args.length) row('Constructor', 'No arguments', 'ok');
    else row('Constructor', v.args.length + (v.args.length === 1 ? ' argument' : ' arguments'), v.argProblem ? 'bad' : 'ok', v.argProblem || 'All filled');
  }
  row('Wallet', v.wallet || 'Not connected', v.wallet ? 'ok' : 'missing', v.wallet ? '' : 'Connect the wallet to deploy', !!v.wallet);
  const approved = !!(v.code && isMain && v.hash && typeof matIsApproved === 'function' && matIsApproved(v.hash, activeNetwork));
  if(v.code && net){
    if(isMain) row('Maturity check', approved ? 'Confirmed for this source' : 'Not confirmed yet', approved ? 'ok' : 'missing', approved ? '' : 'Asked when you press Compile and deploy');
    else row('Maturity check', 'Not required on a testnet', 'ok');
  }
  /* readiness checklist: the same facts as the summary, as a checklist */
  const rd = document.getElementById('dplReady');
  if(rd){
    rd.textContent = '';
    const item = (state, text) => { const li = swbEl('li', '', text); li.setAttribute('data-state', state); rd.appendChild(li); };
    if(!v.code) item('todo', 'No contract yet: generate one in a builder.');
    else if(v.block) item('bad', 'Contract source is a draft: ' + v.block);
    else if(v.sameDeployer) item('bad', v.sameDeployer + ' cannot be the wallet that deploys the contract.');
    else item('ok', 'Contract source is ready.');
    if(v.code && !blocked) item(v.argProblem ? 'bad' : 'ok', v.args.length ? (v.argProblem ? 'Constructor: ' + v.argProblem + '.' : 'Constructor arguments are valid.') : 'No constructor arguments.');
    item(v.wallet ? 'ok' : 'warn', v.wallet ? 'Wallet connected.' : 'Connect your wallet to deploy.');
    if(v.code && net) item(isMain ? (approved ? 'ok' : 'warn') : 'ok', isMain ? (approved ? 'Mainnet: the maturity confirmation is given for this source.' : 'Mainnet: the maturity confirmation is asked when you press Compile and deploy.') : 'Testnet deployment (no maturity approval).');
  }
  /* progress */
  const step = CFBuilder.stepWriter(prog);
  if(!v.code) step('Source', 'todo', 'No contract yet. Generate one in a builder.');
  else if(blocked) step('Source', 'draft', 'The source cannot be deployed yet: ' + (v.block || (v.sameDeployer + ' cannot be the wallet that deploys it')));
  else step('Source', 'done', v.name + '.sol is ready to compile.');
  if(!v.code || blocked) step('Ready to deploy', 'locked', 'Available once the source is ready.');
  else {
    const miss = []; if(!v.wallet) miss.push('connect the wallet'); if(v.argProblem) miss.push(v.argProblem);
    if(miss.length) step('Ready to deploy', 'todo', 'Still needed: ' + miss.join('; ') + '.');
    else step('Ready to deploy', 'done', 'Wallet connected' + (v.args.length ? ' and constructor values filled' : '') + '.' + (isMain ? ' The maturity confirmation is asked when you press Compile and deploy.' : ''));
  }
  if(v.results.length){
    const r = v.results[0], rn2 = NETWORKS[r.network] || { label: r.network };
    step('Deployed', 'done', v.results.length === 1 ? 'Confirmed on ' + rn2.label + ' at ' + r.address + ', for this exact source.' : v.results.length + ' deployments confirmed for this exact source, the first on ' + rn2.label + ' at ' + r.address + '.');
  } else if(v.unverified.length) step('Deployed', 'todo', 'Unverified: ' + v.unverified.length + (v.unverified.length === 1 ? ' deployment shown' : ' deployments shown') + ' on this page cannot be tied to the source on screen (it was generated or changed after, or the run was not seen). This source has not been confirmed as deployed.');
  else step('Deployed', v.code && !blocked ? 'todo' : 'locked', 'Nothing deployed yet. Compile and deploy compiles, asks the wallet and waits for the confirmation.');
}
(function dplInit(){
  if(typeof document === 'undefined') return;
  const sec = document.getElementById('sec-deploy'); if(!sec) return;
  let queued = false; const later = () => { if(queued) return; queued = true; queueMicrotask(() => { queued = false; dplRender(); }); };
  // the page's own elements (never the card's own output, so rendering cannot trigger itself)
  ['ctorArgsPanel', 'multiDeployPanel', 'draftReason', 'deployResult', 'deployConsole', 'mainnetDeployBanner'].forEach(id => { const el = document.getElementById(id); if(el) new MutationObserver(later).observe(el, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['style', 'class', 'disabled', 'value'] }); });
  const b = document.getElementById('btnCompileDeploy'); if(b) new MutationObserver(later).observe(b, { attributes: true, attributeFilter: ['disabled'] });
  new MutationObserver(later).observe(sec, { attributes: true, attributeFilter: ['style'] });                                                     // the tab was opened
  ['walletStatus', 'sidenet'].forEach(id => { const el = document.getElementById(id); if(el) new MutationObserver(later).observe(el, { subtree: true, childList: true, characterData: true }); });
  const cp = document.getElementById('ctorArgsPanel'); if(cp) cp.addEventListener('input', later);
  const sv = document.getElementById('solcVersion'); if(sv) sv.addEventListener('change', later);
  CFBuilder.addView('deploy', dplRender);
})();

/* ======================================================================
   AI CHAT (section 15)
   ====================================================================== */
const NL_EXAMPLES = {
  escrow:       'Create a two-party escrow. The buyer deposits USDC. A neutral arbiter can release funds to the seller or refund the buyer. After 14 days with no dispute the seller can claim automatically.',
  dao:          'Build a DAO governance contract. Members with 1000+ tokens can propose. Voting lasts 7 days with 4% quorum. Passed proposals go into a 48-hour timelock before execution.',
  nft:          'An NFT collection of 5000 items. Public mint costs 0.05 ETH. 24-hour allowlist phase before public. Royalties 5% on secondary. Metadata revealed after mint ends.',
  amm:          'A minimal constant-product AMM for two ERC-20 tokens. Add/remove liquidity and swap both ways. 0.3% fee on swaps goes to liquidity providers.',
  subscription: 'Subscription contract: users pay 9 USDC per month. Access tracked per address, auto-expires. Owner can change price and pause the contract.',
  staking:      'Staking contract for an ERC-20 token. Users earn 15% APY in the same token. 30-day lock. Early exit allowed with 2% penalty.',
  erc20:        'An ERC-20 token called Forge Dollar (FUSD) with 6 decimals. The owner can mint up to a fixed supply cap, and holders can burn their own tokens. Ownership transfer needs the new owner to accept it.',
  treasury:     'A multisig treasury for a team. 3 owners, 2 approvals needed to execute. Owners can propose USDC transfers, approve or revoke them, and anyone can see pending proposals.',
};

const AI_CHATS_KEY = 'cf_ai_chats_v1';
const AI_MAX_CONVS = 30;
const AI_MAX_MSGS = 40;
const AI_MAX_TOTAL = 200 * 1024;   // ~200 KB across all conversations
const AI_ATTACH_MAX = 15000;       // how much of the current contract is attached as context

const aiState = { convs: [], activeId: null, sending: false, sendingId: null, status: { state: 'ready', text: 'Ready' } };

/* Adopts an AI-written contract: stamps it, makes it the pending source (template 'ai', experimental on mainnet) and
   jumps to Compile & Deploy. Shared by the chat "Use" button (the legacy generate flow did the same). */
function adoptAiCode(rawCode){
  const code = matStamp(String(rawCode || ''), 'ai');
  const names = [...code.matchAll(/^\s*(?:abstract\s+)?contract\s+([A-Za-z_][A-Za-z0-9_]*)/gm)].map((m) => m[1]);
  const contractName = names.length ? names[0] : 'GeneratedContract';
  pendingSource = { name: contractName, code, template: 'ai', aiTargets: names };
  pendingCtorArgs = []; renderCtorArgs();
  document.getElementById('pendingContractLabel').value = contractName + '.sol (AI — ' + NETWORKS[activeNetwork].label + ')';
  document.getElementById('auditContractLabel').value = contractName + '.sol';
  document.getElementById('test_contractLabel').value = contractName + '.sol';
  logConsole('ok', 'AI generated: ' + contractName + '.sol (' + code.split('\n').length + ' lines)');
  deployFromBuffer('nlai');
  return contractName;
}

/* ---- history ---- */
function aiValidMessage(m){
  return m && typeof m === 'object' && !Array.isArray(m)
    && (m.role === 'user' || m.role === 'assistant')
    && (m.kind === undefined || m.kind === 'tool' || m.kind === 'error')
    && typeof m.content === 'string' && m.content.length > 0 && m.content.length <= 20000;
}
function aiValidConv(c){
  return c && typeof c === 'object' && !Array.isArray(c)
    && typeof c.id === 'string' && c.id.length > 0 && c.id.length <= 40
    && Array.isArray(c.msgs) && c.msgs.length > 0 && c.msgs.every(aiValidMessage);
}
function aiLoad(){
  try {
    const raw = localStorage.getItem(AI_CHATS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(aiValidConv).slice(0, AI_MAX_CONVS).map((c) => ({ id: c.id, title: typeof c.title === 'string' ? c.title.slice(0, 60) : undefined, msgs: c.msgs.slice(-AI_MAX_MSGS) }));
  } catch (_) { return []; }
}
function aiSave(){
  try {
    const convs = aiState.convs.filter((c) => c.msgs.length);   // an empty chat is not history: never stored
    for (const c of convs) { while (c.msgs.length > AI_MAX_MSGS) c.msgs.shift(); }
    const total = () => convs.reduce((n, c) => n + c.msgs.reduce((m, x) => m + x.content.length, 0), 0);
    while (convs.length > AI_MAX_CONVS) convs.shift();
    while (total() > AI_MAX_TOTAL && convs.length) convs.shift();
    while (total() > AI_MAX_TOTAL && convs.length) { convs[0].msgs.shift(); if (!convs[0].msgs.length) convs.shift(); }
    localStorage.setItem(AI_CHATS_KEY, JSON.stringify(convs));
  } catch (_) { /* storage full or unavailable: ignore */ }
}

/* ---- rendering ---- */
function aiConvTitle(conv){
  if (conv && conv.title) return conv.title;
  const first = conv && conv.msgs.find((m) => m.role === 'user');
  const t = (first ? first.content : '').replace(/\s+/g, ' ').trim();
  return (t.slice(0, 60) || 'New chat');
}

const AI_WELCOME_CHIPS = [['erc20', 'ERC-20 Token'], ['amm', 'Swap / AMM'], ['treasury', 'Treasury'], ['escrow', 'Escrow'], ['staking', 'Staking'], ['subscription', 'Subscription']];
const AI_CTX_MARK = '[contrato atual (dado)]';
const AI_CTX_RE = /\[contrato atual \(dado\)\]\n```solidity\n([\s\S]*?)\n```\n?/;
const AI_MAX_MESSAGE = 20000;       // the proxy rejects a message longer than this

function aiEl(tag, cls, text){
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text !== undefined) el.textContent = text;
  return el;
}

/* The welcome state. The chips only fill the composer; nothing is sent until the user presses Send. */
function aiEmptyState(){
  const box = aiEl('div', 'ai-empty');
  box.appendChild(aiEl('h3', '', 'What would you like to build?'));
  box.appendChild(aiEl('p', '', 'Describe your smart contract in natural language. ContractForge AI helps you generate Solidity, understand contract logic and prepare code for review and testing.'));
  const chips = aiEl('div', 'ai-chips');
  chips.setAttribute('role', 'group'); chips.setAttribute('aria-label', 'Example prompts');
  for (const [key, label] of AI_WELCOME_CHIPS) {
    const chip = aiEl('button', 'pill ai-chip', label); chip.type = 'button';
    chip.setAttribute('data-onclick', `setNLExample('${key}')`);
    chips.appendChild(chip);
  }
  box.appendChild(chips);
  const steps = aiEl('ol', 'ai-steps');
  ['Describe your contract.', 'Review generated Solidity.', 'Test and audit before deployment.'].forEach((t, i) => {
    const li = document.createElement('li');
    li.appendChild(aiEl('b', '', String(i + 1))); li.appendChild(aiEl('span', '', t));
    steps.appendChild(li);
  });
  box.appendChild(steps);
  return box;
}

function aiIsSolidity(lang, code){
  return /^(solidity|sol)$/i.test(lang || '') || /\bpragma\s+solidity\b|\b(?:contract|library|interface)\s+\w+/.test(code);
}

/* Turns a rendered fenced block into a code card. Only a Solidity block gets the contract actions; any other
   language (a shell command, JSON) only gets Copy and is never labelled as a contract. */
function aiDecorateCodeBlock(block){
  const codeEl = block.querySelector('code');
  const code = codeEl ? codeEl.textContent : '';
  const lang = block.getAttribute('data-lang') || '';
  const isSol = aiIsSolidity(lang, code);
  const nameMatch = code.match(/contract\s+(\w+)/);
  const name = isSol ? (nameMatch ? nameMatch[1] : (lang || 'solidity')) + '.sol' : (lang || 'code');
  const lines = code.split('\n').length;
  const head = aiEl('div', 'ai-code-head');
  const info = aiEl('span', 'ai-code-info');
  info.appendChild(aiEl('b', '', name));
  info.appendChild(aiEl('span', '', isSol ? 'Solidity' : (lang || 'text')));
  info.appendChild(aiEl('span', '', lines + (lines === 1 ? ' line' : ' lines')));
  head.appendChild(info);
  if (isSol) {
    head.appendChild(aiEl('span', 'ai-seal', 'Experimental'));
    const warn = aiEl('span', 'ai-code-warn', 'Not audited');
    warn.title = 'Written by AI. Not reviewed or audited.';
    head.appendChild(warn);
  }
  block.insertBefore(head, block.firstChild);
  const pre = block.querySelector('pre');
  if (pre) { pre.tabIndex = 0; pre.setAttribute('role', 'region'); pre.setAttribute('aria-label', name + ' source code'); }
  const actions = aiEl('div', 'ai-code-actions');
  const mk = (label, onclick, cls) => { const btn = aiEl('button', 'ai-act' + (cls ? ' ' + cls : ''), label); btn.type = 'button'; btn.setAttribute('data-onclick', onclick); return btn; };
  actions.appendChild(mk('Copy Code', 'aiChatCopy(this)'));
  if (isSol) {
    actions.appendChild(mk('Download .sol', 'aiChatDownload(this)'));
    actions.appendChild(mk('Use in ContractForge', 'aiChatUse(this)', 'ai-act-primary'));
    actions.appendChild(mk('Audit', 'aiChatAudit(this)'));
    actions.appendChild(mk('Generate Tests', 'aiChatTests(this)'));
  }
  block.appendChild(actions);
}

/* A user message. A contract attached with "Attach Current Contract" is shown as a labelled, collapsed block. */
function aiUserBody(wrap, text){
  const m = AI_CTX_RE.exec(text);
  if (!m) { wrap.appendChild(aiEl('p', '', text)); return; }
  const before = text.slice(0, m.index).trim();
  const after = text.slice(m.index + m[0].length).trim();
  if (before) wrap.appendChild(aiEl('p', '', before));
  const det = aiEl('details', 'ai-attached');
  const n = m[1].split('\n').length;
  det.appendChild(aiEl('summary', '', 'Attached contract (' + n + (n === 1 ? ' line' : ' lines') + ')'));
  const pre = document.createElement('pre'); pre.appendChild(aiEl('code', '', m[1])); det.appendChild(pre);
  wrap.appendChild(det);
  if (after) wrap.appendChild(aiEl('p', '', after));
}

function aiErrorKind(msg){ return /not configured|not available/i.test(msg) ? 'unavailable' : 'error'; }

/* A failed request: the message is the real one the service or the network gave, nothing is made up. */
function aiNoticeNode(content){
  const msg = content.replace(/^Error:\s*/, '');
  const kind = aiErrorKind(msg);
  const box = aiEl('div', 'ai-notice'); box.setAttribute('data-kind', kind);
  box.appendChild(aiEl('b', '', kind === 'unavailable' ? 'AI is unavailable' : 'The request could not be completed'));
  box.appendChild(aiEl('span', '', msg));
  box.appendChild(aiEl('span', '', kind === 'unavailable'
    ? 'Your conversation is saved in this browser. The rest of ContractForge keeps working.'
    : 'Your conversation is saved. You can send your message again.'));
  return box;
}

function aiMessageNode(m){
  const wrap = document.createElement('div');
  wrap.className = 'ai-msg ai-msg-' + m.role;
  const tag = aiEl('span', 'ai-msg-tag', m.role === 'user' ? 'You' : 'ContractForge AI');
  wrap.appendChild(tag);
  if (m.role === 'assistant' && (m.kind === 'error' || m.kind === 'tool') && /^Error:/.test(m.content)) {
    wrap.appendChild(aiNoticeNode(m.content));
  } else if (m.role === 'assistant' && typeof renderChatMarkdown === 'function') {
    const body = aiEl('div', 'ai-prose');
    body.appendChild(renderChatMarkdown(m.content));
    for (const block of body.querySelectorAll('.ai-code-block')) aiDecorateCodeBlock(block);
    wrap.appendChild(body);
  } else if (m.role === 'user') {
    aiUserBody(wrap, m.content);
  } else {
    wrap.appendChild(aiEl('p', '', m.content));
  }
  return wrap;
}

function aiTypingNode(){
  const t = aiEl('div', 'ai-typing'); t.setAttribute('aria-hidden', 'true');
  t.appendChild(document.createElement('i')); t.appendChild(document.createElement('i')); t.appendChild(document.createElement('i'));
  t.appendChild(aiEl('span', '', 'ContractForge AI is writing…'));
  return t;
}

/* The conversation list only (also used by the search box, so typing there never redraws the thread). */
function aiChatRenderList(){
  const side = document.getElementById('aiConvs');
  if (!side) return;
  const search = document.getElementById('aiConvSearch');
  const q = ((search && search.value) || '').trim().toLowerCase();
  side.textContent = '';
  const active = aiState.convs.find((c) => c.id === aiState.activeId) || null;
  let shown = 0;
  for (const c of aiState.convs) {
    const label = aiConvTitle(c);
    if (q && label.toLowerCase().indexOf(q) === -1) continue;
    shown++;
    const row = aiEl('div', 'ai-conv' + (active && c.id === active.id ? ' active' : ''));
    row.setAttribute('role', 'listitem');
    const title = aiEl('button', 'ai-conv-title', label); title.type = 'button'; title.id = 'aiConvTitle' + shown;
    if (active && c.id === active.id) title.setAttribute('aria-current', 'true');
    const tools = aiEl('span', 'ai-conv-tools');
    const rename = aiEl('button', 'ai-conv-btn', '✎'); rename.type = 'button';
    rename.setAttribute('aria-label', 'Rename chat'); rename.setAttribute('aria-describedby', title.id); rename.title = 'Rename'; rename.setAttribute('data-onclick', `aiChatRename('${c.id}', event)`);
    const del = aiEl('button', 'ai-conv-btn ai-conv-del', '×'); del.type = 'button';
    del.setAttribute('aria-label', 'Delete chat'); del.setAttribute('aria-describedby', title.id); del.title = 'Delete'; del.setAttribute('data-onclick', `aiChatDelete('${c.id}', event)`);
    tools.appendChild(rename); tools.appendChild(del);
    row.appendChild(title); row.appendChild(tools);
    row.setAttribute('data-onclick', `aiChatSelect('${c.id}')`);
    side.appendChild(row);
  }
  if (!shown) side.appendChild(aiEl('p', 'ai-convs-empty', aiState.convs.length ? 'No conversations match your search.' : 'No conversations yet. Start a new chat and it will appear here.'));
  const delAll = document.getElementById('aiDelAllBtn');
  if (delAll) delAll.disabled = !aiState.convs.length;
  const confirmBox = document.getElementById('aiDelConfirm');
  if (confirmBox && !aiState.convs.length) confirmBox.hidden = true;
}

function aiChatRender(){
  const side = document.getElementById('aiConvs');
  const thread = document.getElementById('aiThread');
  if (!side || !thread) return;
  aiChatRenderList();
  const active = aiState.convs.find((c) => c.id === aiState.activeId) || null;
  thread.textContent = '';
  if (!active || !active.msgs.length) thread.appendChild(aiEmptyState());
  else for (const m of active.msgs) thread.appendChild(aiMessageNode(m));
  if (active && aiState.sending && aiState.sendingId === active.id) thread.appendChild(aiTypingNode());
  const title = document.getElementById('aiMainTitle');
  if (title) title.textContent = active ? aiConvTitle(active) : 'New chat';
  aiChatRenderComposerState();
  thread.scrollTop = thread.scrollHeight;
}

/* Status line: ready, generating, completed, error, unavailable (or a short notice). */
function aiSetStatus(state, text){ aiState.status = { state, text }; aiChatRenderComposerState(); }

function aiChatRenderComposerState(){
  const btn = document.getElementById('aiSendBtn');
  const gen = document.getElementById('aiGenerating');
  const chat = document.getElementById('aiChat');
  const st = document.getElementById('aiStatus');
  const stText = document.getElementById('aiStatusText');
  if (btn) btn.disabled = aiState.sending;
  if (gen) gen.hidden = !aiState.sending;
  if (chat) chat.classList.toggle('is-busy', aiState.sending);
  const s = aiState.sending ? { state: 'generating', text: 'Generating…' } : aiState.status;
  if (st) st.setAttribute('data-state', s.state);
  if (stText) stText.textContent = s.text;
}

/* ---- actions ---- */
function aiNewId(){ return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
function aiIsMobile(){ return typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 760px)').matches; }

function aiSetSidebar(collapsed){
  const side = document.getElementById('aiSidebar');
  const chat = document.getElementById('aiChat');
  if (!side) return;
  side.classList.toggle('collapsed', collapsed);
  if (chat) chat.classList.toggle('list-collapsed', collapsed);
  for (const t of document.querySelectorAll('.ai-sidebar-toggle')) t.setAttribute('aria-expanded', String(!collapsed));
}

/* At most one empty chat exists at a time: New Chat (and the first send from the welcome screen) reuse it. */
function aiEmptyConv(){ return aiState.convs.find((c) => !c.msgs.length) || null; }

function aiChatNew(){
  let conv = aiEmptyConv();
  if (!conv) { conv = { id: aiNewId(), msgs: [] }; aiState.convs.unshift(conv); }
  aiState.activeId = conv.id;
  if (!aiState.sending) aiState.status = { state: 'ready', text: 'Ready' };
  aiSave(); aiChatRender();
  if (aiIsMobile()) aiSetSidebar(true);
  const ta = document.getElementById('aiComposer'); if (ta) ta.focus();
}
function aiChatSelect(id){
  const list = document.getElementById('aiConvs');
  const keepFocus = !!(list && list.contains(document.activeElement));
  aiState.activeId = id;
  if (!aiState.sending) aiState.status = { state: 'ready', text: 'Ready' };
  aiChatRender();
  if (aiIsMobile()) { aiSetSidebar(true); return; }
  if (keepFocus) { const b = document.querySelector('#aiConvs .ai-conv.active .ai-conv-title'); if (b) b.focus(); }
}
function aiChatDelete(id, ev){
  if (ev && 'cancelBubble' in ev) ev.cancelBubble = true;
  aiState.convs = aiState.convs.filter((c) => c.id !== id);
  if (aiState.activeId === id) aiState.activeId = aiState.convs.length ? aiState.convs[0].id : null;
  aiSave(); aiChatRender();
}
/* "Delete All" in the sidebar only asks; the deletion itself is aiChatDeleteAll, as before. */
function aiChatAskDeleteAll(){
  if (!aiState.convs.length) return;
  const box = document.getElementById('aiDelConfirm');
  if (!box) { aiChatDeleteAll(); return; }
  box.hidden = false;
  const cancel = box.querySelector('button:not(.ai-del-yes)'); if (cancel) cancel.focus();
}
function aiChatCancelDeleteAll(){
  const box = document.getElementById('aiDelConfirm'); if (box) box.hidden = true;
  const btn = document.getElementById('aiDelAllBtn'); if (btn) btn.focus();
}
function aiChatDeleteAll(){
  aiState.convs = []; aiState.activeId = null; aiSave();
  const box = document.getElementById('aiDelConfirm'); if (box) box.hidden = true;
  aiChatRender();
}
function aiChatRename(id, ev){
  if (ev && 'cancelBubble' in ev) ev.cancelBubble = true;
  const conv = aiState.convs.find((c) => c.id === id);
  if (!conv) return;
  const name = prompt('Chat title:', aiConvTitle(conv));
  if (name && name.trim()) { conv.title = name.trim().slice(0, 60); aiSave(); aiChatRender(); }
}
function aiChatToggleSidebar(){
  const side = document.getElementById('aiSidebar');
  if (!side) return;
  const trigger = document.activeElement;
  const collapse = !side.classList.contains('collapsed');
  aiSetSidebar(collapse);
  if (trigger && trigger.classList && trigger.classList.contains('ai-sidebar-toggle')) {
    const target = document.querySelector(collapse ? '.ai-open-list' : '#aiSidebar .ai-sidebar-toggle');
    if (target) target.focus();
  }
}

function setNLExample(key){
  const ta = document.getElementById('aiComposer');
  if (ta && NL_EXAMPLES[key]) { ta.value = NL_EXAMPLES[key]; aiAutoGrow(ta); ta.focus(); }
}

function aiAutoGrow(ta){
  if (!ta) return;
  ta.style.height = 'auto';
  ta.style.height = Math.min(Math.max(ta.scrollHeight, 24), 240) + 'px';
  const count = document.getElementById('aiCount');
  if (count) count.textContent = ta.value.length + ' / ' + AI_MAX_MESSAGE;
  aiUpdateContextChip();
}

/* The attached contract lives in the message box as text, so what you see is exactly what is sent. This chip only
   labels it, and is derived from the box itself, so it can never disagree with what will be sent. */
function aiUpdateContextChip(){
  const ta = document.getElementById('aiComposer');
  const chip = document.getElementById('aiContextChip');
  const txt = document.getElementById('aiContextText');
  if (!ta || !chip) return;
  const has = ta.value.indexOf(AI_CTX_MARK) !== -1;
  chip.hidden = !has;
  if (!has || !txt) return;
  const m = AI_CTX_RE.exec(ta.value);
  const cm = m && m[1].match(/contract\s+(\w+)/);
  txt.textContent = m
    ? 'Attached as reference data: ' + (cm ? cm[1] + '.sol' : 'current contract') + ' (' + m[1].split('\n').length + ' lines' + (/\/\/ … \(truncated\)\s*$/.test(m[1]) ? ', truncated to ' + AI_ATTACH_MAX.toLocaleString('en-US') + ' characters' : '') + '). It is sent with your message.'
    : 'A contract is attached to this message. It is sent with your message.';
}

function aiChatAttachContext(){
  const ta = document.getElementById('aiComposer');
  if (!ta) return;
  if (!pendingSource || !pendingSource.code) { logConsole('warn', 'No current contract to attach.'); aiSetStatus('notice', 'No current contract to attach'); return; }
  if (ta.value.indexOf(AI_CTX_MARK) !== -1) { aiSetStatus('notice', 'A contract is already attached'); return; }
  const code = pendingSource.code.length > AI_ATTACH_MAX
    ? pendingSource.code.slice(0, AI_ATTACH_MAX) + '\n// … (truncated)'
    : pendingSource.code;
  const block = AI_CTX_MARK + '\n```solidity\n' + code + '\n```\n';
  ta.value = (ta.value ? ta.value + '\n' : '') + block;
  if (!aiState.sending) aiState.status = { state: 'ready', text: 'Ready' };
  aiAutoGrow(ta); aiChatRenderComposerState();
}
function aiChatDetachContext(){
  const ta = document.getElementById('aiComposer');
  if (!ta) return;
  if (AI_CTX_RE.test(ta.value)) ta.value = ta.value.replace(AI_CTX_RE, '').replace(/\n{3,}/g, '\n\n').trim();
  else aiSetStatus('notice', 'Edit the message to remove the attached contract');
  aiAutoGrow(ta); ta.focus();
}

function aiBlockCode(btn){
  const block = btn && btn.closest ? btn.closest('.ai-code-block') : null;
  const codeEl = block && block.querySelector('code');
  const code = codeEl ? codeEl.textContent : '';
  const m = code.match(/contract\s+(\w+)/);
  return { code, name: m ? m[1] : 'GeneratedContract' };
}

function aiChatUse(btn){
  const { code } = aiBlockCode(btn);
  if (!code) { alert('No code to use.'); return; }
  adoptAiCode(code);
}
function aiFlash(btn, label){
  if (!btn) return;
  if (!btn.getAttribute('data-label')) btn.setAttribute('data-label', btn.textContent);
  btn.textContent = label;
  setTimeout(() => { btn.textContent = btn.getAttribute('data-label'); }, 1600);
}
function aiChatCopy(btn){
  const { code } = aiBlockCode(btn);
  if (!code) return;
  if (!navigator.clipboard || !navigator.clipboard.writeText) { logConsole('warn', 'Copy is not available in this browser.'); aiFlash(btn, 'Copy failed'); return; }
  navigator.clipboard.writeText(code).then(
    () => { logConsole('ok', 'Code copied.'); aiFlash(btn, 'Copied'); },
    () => { logConsole('warn', 'Could not copy the code.'); aiFlash(btn, 'Copy failed'); }
  );
}
function aiChatDownload(btn){
  const { name, code } = aiBlockCode(btn);
  if (!code) return;
  const blob = new Blob([code], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = name + '.sol'; a.click();
  URL.revokeObjectURL(url);
}

function aiChatFormatAudit(text){
  try {
    const r = JSON.parse(text);
    if (!r || typeof r !== 'object') return text;
    const parts = ['**Score: ' + (typeof r.score === 'number' ? r.score : '?') + '/100**'];
    if (r.summary) parts.push(String(r.summary));
    for (const f of (Array.isArray(r.findings) ? r.findings : [])) {
      const s = ['critical', 'high', 'medium', 'low', 'info'].includes(f.severity) ? f.severity : 'info';
      parts.push('**' + s.toUpperCase() + '** — ' + (f.title || '') + '\n' + (f.description || '') + (f.recommendation ? '\nFix: ' + f.recommendation : ''));
    }
    return parts.join('\n\n');
  } catch (_) { return text; }
}

/* Records the outcome of a request in the status line. A reply that arrives after its chat was deleted or the user
   moved to another chat never changes the chat that is open now. */
function aiFinishStatus(conv, failed, errMsg, okText){
  if (!aiState.convs.includes(conv)) { aiSetStatus('ready', 'Ready'); return; }
  if (failed) { aiSetStatus(aiErrorKind(errMsg), aiErrorKind(errMsg) === 'unavailable' ? 'AI unavailable' : 'Request failed'); return; }
  aiSetStatus('completed', conv.id === aiState.activeId ? okText : 'Reply saved in another chat');
}

async function aiChatRunAction(action, name, code, extra){
  if (aiState.sending) return;
  const conv = aiState.convs.find((c) => c.id === aiState.activeId);
  if (!conv) return;
  aiState.sending = true; aiState.sendingId = conv.id; aiChatRender();
  let text, failed = false, errMsg = '';
  try {
    const data = await aiFetch(action, { name, code, ...extra });
    text = data.text || '';
    if (!text.trim()) throw new Error('The AI returned an empty answer.');
    if (action === 'audit') text = aiChatFormatAudit(text);
  } catch (e) {
    failed = true; errMsg = String((e && e.message) || e);
    text = 'Error: ' + errMsg;
  } finally {
    aiState.sending = false; aiState.sendingId = null;
  }
  conv.msgs.push({ role: 'assistant', content: text, kind: 'tool' });
  aiFinishStatus(conv, failed, errMsg, action === 'audit' ? 'Audit completed' : 'Tests generated');
  aiSave(); aiChatRender();
}
function aiChatAudit(btn){
  const { name, code } = aiBlockCode(btn);
  if (!code) { alert('No code to audit.'); return; }
  aiChatRunAction('audit', name, code, { focus: document.getElementById('audit_focus')?.value || 'full' });
}
function aiChatTests(btn){
  const { name, code } = aiBlockCode(btn);
  if (!code) { alert('No code to test.'); return; }
  aiChatRunAction('tests', name, code, { framework: document.getElementById('test_framework')?.value || 'foundry', coverage: document.getElementById('test_coverage')?.value || 'full' });
}

/* Builds the alternating user/assistant sequence the model sees: drop tool/error results, merge consecutive
   same-role messages (an orphan user after a tab close joins the next one), trim a leading/trailing assistant,
   then keep the last 20 starting from a user. */
function aiBuildRequestMessages(msgs){
  let seq = msgs.filter((m) => m.kind !== 'tool' && m.kind !== 'error');
  const merged = [];
  for (const m of seq) {
    const last = merged[merged.length - 1];
    if (last && last.role === m.role) last.content += '\n\n' + m.content;
    else merged.push({ role: m.role, content: m.content });
  }
  seq = merged;
  while (seq.length && seq[0].role !== 'user') seq.shift();
  while (seq.length && seq[seq.length - 1].role !== 'user') seq.pop();
  if (seq.length > 20) seq = seq.slice(seq.length - 20);
  while (seq.length && seq[0].role !== 'user') seq.shift();
  return seq.map((m) => ({ role: m.role, content: m.content }));
}

async function aiChatSend(){
  if (aiState.sending) return;
  const ta = document.getElementById('aiComposer');
  const text = (ta && ta.value || '').trim();
  if (!text) return;
  if (text.length > AI_MAX_MESSAGE) { aiSetStatus('error', 'Message is too long (max 20,000 characters)'); return; }
  let conv = aiState.convs.find((c) => c.id === aiState.activeId);
  if (!conv) { conv = aiEmptyConv(); if (!conv) { conv = { id: aiNewId(), msgs: [] }; aiState.convs.unshift(conv); } aiState.activeId = conv.id; }
  conv.msgs.push({ role: 'user', content: text });
  if (ta) { ta.value = ''; aiAutoGrow(ta); }
  aiState.sending = true; aiState.sendingId = conv.id;
  aiSave(); aiChatRender();

  let failed = false, errMsg = '';
  try {
    const netKey = document.getElementById('nl_network')?.value || 'arc';
    const net = NETWORKS[netKey] || NETWORKS.arc;
    const complexity = document.getElementById('nl_complexity')?.value || 'moderate';
    const messages = aiBuildRequestMessages(conv.msgs);
    const data = await aiFetch('chat', { messages, network: { label: net.label, chainId: net.chainIdDec, usdc: net.usdc || '' }, complexity });
    if (!data.text || !data.text.trim()) throw new Error('The AI returned an empty answer.');
    conv.msgs.push({ role: 'assistant', content: data.text });
  } catch (e) {
    failed = true; errMsg = String((e && e.message) || e);
    conv.msgs.push({ role: 'assistant', content: 'Error: ' + errMsg, kind: 'error' });
  } finally {
    aiState.sending = false; aiState.sendingId = null;
    aiFinishStatus(conv, failed, errMsg, 'Completed');
    aiSave(); aiChatRender();
  }
}

/* Phase 8.2: while AI -> Solidity is the open section, the page is a full-height workspace (body.ai-workspace, see app.css).
   The section's own inline display is the single source of truth; every way of opening or leaving it (menu, Use in
   ContractForge, wizard, playground) writes it, so one observer covers them all. Nothing is removed or rebuilt. */
/* Entering AI -> Solidity from another section shows the welcome screen (nothing is selected, nothing is deleted).
   Work in progress is protected: a pending request or an unsent draft keeps the current session as it is. */
function aiEnterFresh(){
  if (aiState.sending) return;
  const ta = document.getElementById('aiComposer');
  if (ta && ta.value.trim()) return;
  if (aiState.activeId === null && !aiEmptyConv()) return;
  aiState.activeId = null;
  aiState.convs = aiState.convs.filter((c) => c.msgs.length);   // drop the in-memory empty chat, it was never saved
  aiState.status = { state: 'ready', text: 'Ready' };
  aiChatRender();
}

function aiSyncWorkspace(){
  const sec = document.getElementById('sec-nlai');
  if (!sec || !document.body) return;
  const on = sec.style.display === 'block';
  const was = document.body.classList.contains('ai-workspace');
  document.body.classList.toggle('ai-workspace', on);
  if (on && !was) {
    aiEnterFresh();
    const thread = document.getElementById('aiThread');
    if (thread) thread.scrollTop = thread.scrollHeight;
    // on a phone the menu is stacked above the page: bring the workspace itself to the top of the screen
    try { if (window.matchMedia && window.matchMedia('(max-width: 980px)').matches) document.querySelector('main').scrollIntoView({ block: 'start' }); } catch (_) { /* optional */ }
  }
}

function initAiChat(){
  aiState.convs = aiLoad();
  aiState.activeId = null;      // clean start: the welcome screen; every saved chat stays in the list until the user picks one
  aiChatRender();
  aiSetSidebar(aiIsMobile());
  const wsSection = document.getElementById('sec-nlai');
  if (wsSection && typeof MutationObserver === 'function') new MutationObserver(aiSyncWorkspace).observe(wsSection, { attributes: true, attributeFilter: ['style'] });
  aiSyncWorkspace();
  const ta = document.getElementById('aiComposer');
  if (ta) {
    ta.addEventListener('input', () => aiAutoGrow(ta));
    ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); aiChatSend(); } });
    ta.addEventListener('focus', () => { if (aiIsMobile()) setTimeout(() => ta.scrollIntoView({ block: 'nearest' }), 250); });
  }
  const list = document.getElementById('aiConvs');
  if (list) list.addEventListener('keydown', (e) => {
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].indexOf(e.key) === -1) return;
    const items = [...list.querySelectorAll('.ai-conv-title')];
    const i = items.indexOf(document.activeElement);
    if (i === -1 || !items.length) return;
    e.preventDefault();
    const next = e.key === 'Home' ? 0 : e.key === 'End' ? items.length - 1 : Math.min(items.length - 1, Math.max(0, i + (e.key === 'ArrowDown' ? 1 : -1)));
    items[next].focus();
  });
  const chat = document.getElementById('aiChat');
  if (chat) chat.addEventListener('keydown', (e) => {
    const side = document.getElementById('aiSidebar');
    if (e.key === 'Escape' && aiIsMobile() && side && !side.classList.contains('collapsed')) {
      aiSetSidebar(true);
      const open = document.querySelector('.ai-open-list'); if (open) open.focus();
    }
  });
  if (window.visualViewport) window.visualViewport.addEventListener('resize', () => {
    if (aiIsMobile() && document.activeElement === ta) ta.scrollIntoView({ block: 'nearest' });
  });
}
if (typeof document !== 'undefined') initAiChat();

/* ======================================================================
   CONTRACT ANALYTICS
   ====================================================================== */
async function loadAnalytics(){
  const addr=document.getElementById('an_address')?.value?.trim();
  if(!addr){ alert('Enter a contract address.'); return; }
  if(!provider){ alert('Connect your wallet first.'); return; }

  logConsole('step','Loading analytics for '+addr.slice(0,10)+'…');
  try{
    const latest=await provider.getBlockNumber();
    const lookback=parseInt(document.getElementById('an_blocks')?.value||'10000');
    const fromBlock=Math.max(0,latest-lookback);
    const txCount=await provider.getTransactionCount(addr);
    const balance=await provider.getBalance(addr);
    const balFmt=parseFloat(ethers.utils.formatEther(balance)).toFixed(4);
    const net=NETWORKS[activeNetwork];
    let usdcBal='—';
    if(net.usdc){
      try{
        const usdc=new ethers.Contract(net.usdc,['function balanceOf(address) view returns (uint256)','function decimals() view returns (uint8)'],provider);
        const dec=await usdc.decimals();
        const bal=await usdc.balanceOf(addr);
        usdcBal=parseFloat(ethers.utils.formatUnits(bal,dec)).toFixed(2)+' USDC';
      }catch(_){}
    }
    const logs=await provider.getLogs({address:addr,fromBlock,toBlock:latest});
    const buckets=new Array(10).fill(0);
    const bucketSize=Math.ceil((latest-fromBlock)/10)||1;
    logs.forEach(log=>{ const idx=Math.min(9,Math.floor((log.blockNumber-fromBlock)/bucketSize)); buckets[idx]++; });

    const kpiData=[
      {label:'Transactions',value:txCount.toLocaleString(),sub:'lifetime nonce'},
      {label:'Events (range)',value:logs.length.toLocaleString(),sub:'last '+lookback.toLocaleString()+' blocks'},
      {label:'Native balance',value:balFmt,sub:net.gasSymbol},
      {label:'USDC balance',value:usdcBal,sub:'on '+net.label},
      {label:'From block',value:fromBlock.toLocaleString(),sub:'start of range'},
      {label:'Latest block',value:latest.toLocaleString(),sub:'current head'},
    ];
    document.getElementById('an_kpis').innerHTML=kpiData.map(k=>`
      <div class="an-card"><div class="anv">${escapeHtml(k.value)}</div><div class="anl">${escapeHtml(k.label)}</div><div class="ans">${escapeHtml(k.sub)}</div></div>`).join('');

    const maxB=Math.max(...buckets,1);
    document.getElementById('an_bars').innerHTML=buckets.map(v=>`<div class="bar" style="height:${Math.max(4,(v/maxB*76))}px;" title="${v} events"></div>`).join('');
    document.getElementById('an_barlabels').innerHTML=buckets.map((_,i)=>`<span>${i===0?'-'+lookback:i===9?'now':''}</span>`).join('');

    const evEl=document.getElementById('an_events');
    evEl.innerHTML='';
    const recent=logs.slice(-20).reverse();
    if(!recent.length){
      evEl.innerHTML='<div class="line"><span class="msg" style="color:#5C6B65;">No events found in this range.</span></div>';
    } else {
      recent.forEach(log=>{
        const div=document.createElement('div'); div.className='line ok';
        // the log comes from an RPC node: build it from text nodes, not markup
        const t1=document.createElement('span'); t1.className='t'; t1.textContent='blk '+log.blockNumber;
        const m1=document.createElement('span'); m1.className='msg'; m1.textContent='Topic: '+(String(log.topics&&log.topics[0]||'').slice(0,18)||'unknown')+'… tx: '+String(log.transactionHash).slice(0,14)+'…';
        div.append(t1,m1);
        evEl.appendChild(div);
      });
    }
    document.getElementById('analyticsData').style.display='block';
    logConsole('ok','Analytics: '+logs.length+' events, '+txCount+' txns for '+addr.slice(0,10)+'…');
  }catch(e){ logConsole('err','Analytics error: '+(e.message||e)); }
}

function refreshAnalytics(){ loadAnalytics(); }

/* the two helpers below replace what used to be written inline in onclick attributes */
function openExternal(url){
  if(!/^https:\/\//.test(String(url))) return;                     // links come from NETWORKS (explorers) and are https
  window.open(url, '_blank', 'noopener');
}
function setAnalyticsAddress(addr){
  if(!isAddr(addr)) return;
  const el = document.getElementById('an_address'); if(el) el.value = addr;
}

function renderAnalyticsHistoryPills(){
  const hist=loadDeployHistory();
  const pills=document.getElementById('an_history_pills');
  if(!pills) return;
  pills.innerHTML=hist.filter(h=>h && isAddr(h.address)).slice(0,6).map(h=>`
    <div class="pill" data-onclick="setAnalyticsAddress('${escapeHtml(h.address)}')">${escapeHtml(h.name)} (${escapeHtml(h.network)})</div>`).join('');
}

/* ---- Analytics overview (Phase 12.5): read-only. loadAnalytics(), refreshAnalytics(), setAnalyticsAddress() and the pills are untouched. This notes, at the click on Load Analytics or
   Refresh, what the page held (the address, the look-back, the network) and reads the page's own cards and console line afterwards, so the overview can say where the numbers come
   from and whether they still match what is on screen. It never asks the wallet or a node for anything. ---- */
let anRun = null;    // the latest click: what the form held, and how it ended
let anLast = null;   // the latest click that ended with numbers on screen

function anNow(){
  const el = (id) => document.getElementById(id);
  const raw = el('an_blocks') ? el('an_blocks').value : '';
  return { addr: ((el('an_address') && el('an_address').value) || '').trim(), raw, look: parseInt(raw || '10000'), net: typeof activeNetwork !== 'undefined' ? activeNetwork : '' };   // the look-back is read exactly as loadAnalytics() reads it
}

function anCards(){
  return [...document.querySelectorAll('#an_kpis .an-card')].map((c) => ({ label: (c.querySelector('.anl') || {}).textContent || '', value: (c.querySelector('.anv') || {}).textContent || '', sub: (c.querySelector('.ans') || {}).textContent || '' }));
}

function anFinish(){
  if(!anRun || anRun.done) return;
  const k = document.getElementById('an_kpis');
  const lines = [...document.querySelectorAll('#deployConsole .line .msg')].map((m) => m.textContent).slice(anRun.startLen);
  const err = lines.find((t) => /^Analytics error: /.test(t));
  if(err){ anRun.done = true; anRun.kind = 'failed'; anRun.msg = err.replace(/^Analytics error: /, ''); return; }
  if(k && k.firstChild && k.firstChild !== anRun.firstKpi && document.getElementById('analyticsData').style.display === 'block'){
    anRun.done = true; anRun.kind = 'ok';
    anLast = { addr: anRun.addr, net: anRun.net, raw: anRun.raw, look: anRun.look, cards: anCards() };
  }
}

function anRead(){
  const now = anNow();
  const net = (typeof NETWORKS !== 'undefined' && NETWORKS[now.net]) ? NETWORKS[now.net] : null;
  const valid = typeof isAddr === 'function' && isAddr(now.addr);
  const wallet = (typeof provider !== 'undefined' && !!provider);
  const rec = valid ? loadDeployHistory().find((h) => h && h.address && String(h.address).toLowerCase() === now.addr.toLowerCase()) : null;
  let state = 'none', outdated = '';
  if(anRun && !anRun.done) state = 'working';
  else if(anRun && anRun.done && (anRun.kind === 'failed' || anRun.kind === 'blocked')) state = anRun.kind;
  else if(anLast){
    const sameAddr = anLast.addr.toLowerCase() === now.addr.toLowerCase();
    const sameNet = anLast.net === now.net, sameLook = anLast.look === now.look || (Number.isNaN(anLast.look) && Number.isNaN(now.look));
    state = sameAddr && sameNet && sameLook ? 'current' : 'outdated';
    outdated = !sameAddr ? 'address' : (!sameNet ? 'network' : (!sameLook ? 'range' : ''));
  }
  return { now, net, valid, wallet, rec, wchain: gasWalletChain(), state, outdated,
    mode: (typeof MC_MODES !== 'undefined' && typeof multichainMode !== 'undefined' && MC_MODES[multichainMode]) ? MC_MODES[multichainMode].label : '' };
}

function anShort(a){ return a ? String(a).slice(0, 8) + '…' + String(a).slice(-4) : ''; }

function anRender(){
  const sum = document.getElementById('anSummary'), prog = document.getElementById('anProgress'), notes = document.getElementById('anNotes');
  if(!sum || !prog || !notes) return;
  const v = anRead(), n = v.now, last = anLast;
  sum.textContent = ''; prog.textContent = ''; notes.textContent = '';
  const row = CFBuilder.rowWriter(sum), step = CFBuilder.stepWriter(prog);
  if(!n.addr) row('Address', 'None yet', 'missing', 'Type an address or pick a deployment below', true);
  else if(!v.valid) row('Address', n.addr.length > 46 ? n.addr.slice(0, 44) + '…' : n.addr, 'bad', 'Not a valid address: the node will refuse it', true);
  else row('Address', n.addr, 'ok', '', true);
  if(v.rec){
    const rn = NETWORKS[v.rec.network];
    const same = v.rec.network === n.net;
    row('Known deployment', (v.rec.name || 'Contract') + ' on ' + (rn ? rn.label : 'an unknown network'), same ? 'ok' : 'bad', same ? '' : 'Analytics reads from your wallet\'s chain and labels with ' + (v.net ? v.net.label : 'the app\'s network') + ', not with ' + (rn ? rn.label : 'that network'));
  } else if(v.valid) row('Known deployment', 'Not in this browser\'s history', 'ok');
  CFBuilder.networkRow(row, v.net);
  if(v.wchain != null && v.net){
    const same = v.wchain === v.net.chainIdDec;
    const known = typeof NETWORKS !== 'undefined' ? Object.values(NETWORKS).find((x) => x.chainIdDec === v.wchain) : null;
    row('Wallet chain', same ? 'The same chain' : 'Chain ' + v.wchain + (known ? ' (' + known.label + ')' : ''), same ? 'ok' : 'bad', same ? '' : 'Everything is read from your wallet\'s chain, but this page labels it with ' + v.net.label);
  }
  row('Deployment Mode', v.mode || 'Unknown', v.mode ? 'ok' : 'bad');
  row('Reads through', 'Your wallet\'s connection', 'ok', 'Not the network\'s public node: the chain is the one your wallet is on');
  row('Wallet', v.wallet ? 'Connected' : 'Not connected', v.wallet ? 'ok' : 'missing', v.wallet ? '' : 'Analytics needs it to read');
  const lk = n.look;
  if(Number.isNaN(lk)) row('Look-back', 'Not a number', 'bad', 'The page cannot read it');
  else if(lk < 0) row('Look-back', lk.toLocaleString('en-US') + ' blocks', 'bad', 'The range would start after the latest block: the node will answer with an error');
  else if(lk === 0) row('Look-back', '0 blocks', 'ok', 'Only the latest block');
  else row('Look-back', lk.toLocaleString('en-US') + ' blocks', 'ok', lk > 10000 ? 'Longer than the default: some nodes refuse big ranges and answer with their own limit' : '');
  if(v.state === 'none') row('Result', 'Not loaded yet', 'missing', 'Press Load Analytics');
  else if(v.state === 'working') row('Result', 'Working…', 'missing');
  else if(v.state === 'blocked') row('Result', 'Not loaded', 'bad', anRun.msg);
  else if(v.state === 'failed') row('Result', 'Failed', 'bad', anRun.msg + (last ? ' · The cards still show the earlier result (for ' + anShort(last.addr) + ')' : ''));
  else {
    const rn = NETWORKS[last.net];
    row('Result', 'For ' + anShort(last.addr) + ' on ' + (rn ? rn.label : last.net), v.state === 'current' ? 'ok' : 'missing',
      v.state === 'outdated' ? ({ address: 'The address on screen is another one', network: 'The network changed since', range: 'The look-back changed since' }[v.outdated]) : '');
    const card = (l) => last.cards.find((c) => c.label === l) || { value: '—', sub: '' };
    row('Events in range', card('Events (range)').value + ' (' + card('Events (range)').sub + ')', 'ok', 'Counted over the whole range; the list below shows the newest 20');
    row('Native balance', card('Native balance').value + ' ' + card('Native balance').sub, 'ok');
    row('USDC balance', card('USDC balance').value, 'ok', card('USDC balance').value === '—' ? 'Not available here: this network has no USDC address, or your wallet is on another chain' : '');
    row('"Transactions" card', card('Transactions').value, 'missing', 'This is the account\'s nonce: for a contract it is not the number of transactions sent to it (KNOWN)');
    row('Range', 'From block ' + card('From block').value + ' to ' + card('Latest block').value, 'ok', 'The head when you pressed the button');
  }
  const ready = n.addr && v.valid && v.wallet;
  step('Ready to load', ready ? 'done' : 'todo', ready ? 'A valid address and a connected wallet.' : 'Needs: ' + [!n.addr ? 'an address' : (!v.valid ? 'a valid address' : ''), !v.wallet ? 'a connected wallet' : ''].filter(Boolean).join(', ') + '.');
  if(!ready) step('Loaded', 'locked', 'Available once it is ready.');
  else if(v.state === 'working') step('Loaded', 'todo', 'Working…');
  else if(v.state === 'failed' || v.state === 'blocked') step('Loaded', 'attention', anRun.msg);
  else if(v.state === 'current') step('Loaded', 'done', 'Loaded for this address, network and look-back.');
  else if(v.state === 'outdated') step('Loaded', 'stale', { address: 'The address changed after this load.', network: 'The network changed after this load.', range: 'The look-back changed after this load.' }[v.outdated]);
  else step('Loaded', 'todo', 'Press Load Analytics.');
  step('Reading the numbers', ready && (v.state === 'current' || v.state === 'outdated') ? 'todo' : 'locked', 'Not tracked here: a snapshot of the chain head when you pressed the button. Press Refresh for a new one.');
  [
    'Everything is read through your wallet\'s connection, so it describes the chain your wallet is on. Picking a deployment from the pills only fills in the address: it does not switch network.',
    'The "Transactions" card is the account\'s nonce. For a contract that is the number of contracts it created (it starts at 1), not the number of transactions sent to it.',
    'Events are counted over the whole range, but the list shows only the newest 20. The ten bars split the range into equal parts.',
    'A node may refuse a large look-back. The page then shows the node\'s own message and keeps the earlier numbers on screen.'
  ].forEach((t) => { const li = document.createElement('li'); li.textContent = t; notes.appendChild(li); });
  const an = document.getElementById('anAddrNote'); if(an) an.textContent = (v.rec && v.rec.network !== n.net) ? 'This deployment lives on another network than the one selected.' : '';
  const bn = document.getElementById('anBlocksNote'); if(bn) bn.textContent = n.raw === '' ? 'Empty reads as the default, 10,000.' : '';
  const empty = document.getElementById('anEmpty'); if(empty) empty.hidden = document.getElementById('analyticsData').style.display === 'block';
}

(function anInit(){
  const sec = document.getElementById('sec-analytics');
  if(!sec || sec.dataset.anBound) return;
  sec.dataset.anBound = '1';
  // what the form held at the click (loadAnalytics reads the same values before it asks anything)
  sec.addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('[data-onclick]');
    const h = b ? b.getAttribute('data-onclick') : '';
    if(b && b.closest('#an_history_pills')){ setTimeout(draw, 0); return; }   // a pill fills the address without an input event: draw after its handler has run
    if(h !== 'loadAnalytics()' && h !== 'refreshAnalytics()') return;
    const n = anNow(), k = document.getElementById('an_kpis');
    anRun = { addr: n.addr, raw: n.raw, look: n.look, net: n.net, startLen: document.querySelectorAll('#deployConsole .line').length, firstKpi: k ? k.firstChild : null, done: false, kind: '', msg: '' };
    // the two checks loadAnalytics() makes first, answered with an alert
    if(!n.addr){ anRun.done = true; anRun.kind = 'blocked'; anRun.msg = 'Enter a contract address.'; }
    else if(typeof provider === 'undefined' || !provider){ anRun.done = true; anRun.kind = 'blocked'; anRun.msg = 'Connect your wallet first.'; }
    if(anRun.done) draw();   // nothing in the page changes when it only alerts, so draw it here
  }, true);
  let queued = false;
  const draw = () => { if(queued) return; queued = true; queueMicrotask(() => { queued = false; anFinish(); anRender(); }); };
  sec.addEventListener('input', draw); sec.addEventListener('change', draw);
  if(typeof MutationObserver === 'function'){
    const watch = (el, opts) => { if(el) new MutationObserver(draw).observe(el, opts); };
    watch(sec, { attributes: true, attributeFilter: ['style'] });
    watch(document.getElementById('an_kpis'), { childList: true });
    watch(document.getElementById('analyticsData'), { attributes: true, attributeFilter: ['style'] });
    watch(document.getElementById('deployConsole'), { childList: true });
    watch(document.getElementById('an_history_pills'), { childList: true });
    watch(document.getElementById('sidenet'), { childList: true, characterData: true, subtree: true });
    watch(document.getElementById('walletStatus'), { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  }
  CFBuilder.addView('analytics', anRender);
  anRender();
})();

/* ======================================================================
   TEST GENERATOR
   ====================================================================== */
let lastTestCode='';

async function generateTests(){
  if(!pendingSource.code){ alert('Generate a contract first (sections 01-06 or AI → Solidity).'); return; }
  const btn=document.getElementById('genTestsBtn');
  btn.disabled=true; btn.textContent='Generating…';
  document.getElementById('testOutput').style.display='none';
  document.getElementById('test_contractLabel').value=pendingSource.name+'.sol';

  const framework=document.getElementById('test_framework')?.value||'foundry';
  const coverage =document.getElementById('test_coverage')?.value||'full';

  try{
    const data=await aiFetch('tests', { name: pendingSource.name, code: pendingSource.code, framework, coverage });
    let code=(data.text||'').replace(/^```[a-z]*\s*/,'').replace(/\s*```$/,'').trim();
    lastTestCode=code;
    const testCount=(code.match(/function test_?[A-Za-z]/g)||[]).length;

    document.getElementById('testCards').innerHTML=`
      <div class="test-card">
        <h4>✓ ${escapeHtml(pendingSource.name)} — ${Number(testCount)||0} test functions</h4>
        <div class="tc">${framework==='foundry'?'Foundry (.t.sol)':framework==='hardhat'?'Hardhat (Mocha/Chai)':'Foundry + Hardhat'} · ${escapeHtml(coverage)} coverage · ${Number(data.outputTokens)||'?'} tokens</div>
      </div>`;
    document.getElementById('testCode').textContent=code;
    document.getElementById('testOutput').style.display='block';
    logConsole('ok','Tests generated: '+testCount+' for '+pendingSource.name);
  }catch(e){ logConsole('err','Test gen error: '+(e.message||e)); }
  finally{ btn.disabled=false; btn.textContent='Generate Tests'; }
}

function downloadTests(){
  if(!lastTestCode){ alert('Generate tests first.'); return; }
  const fw=document.getElementById('test_framework')?.value||'foundry';
  const ext=fw==='hardhat'?'.test.js':'.t.sol';
  const blob=new Blob([lastTestCode],{type:'text/plain'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
  a.download=pendingSource.name+ext; a.click();
}

function copyTests(){
  if(!lastTestCode) return;
  navigator.clipboard.writeText(lastTestCode).then(()=>logConsole('ok','Test code copied.'));
}

/* ---- Test Generator overview (Phase 12.1): read-only. generateTests(), copyTests() and downloadTests() are untouched; this only notes what the page
   already shows and what the click captured, so it can say whether the tests on screen belong to the source on screen. ---- */
let tgRun = null;   // the latest click on Generate Tests: what the form held at that moment, and how it ended
let tgLast = null;  // the latest click that ended with tests on screen: what they were written for

function tgNow(){
  const ps = (typeof pendingSource !== 'undefined' && pendingSource) ? pendingSource : null;
  const code = ps && ps.code ? ps.code : '';
  const el = (id) => document.getElementById(id);
  return {
    name: ps && ps.name ? ps.name : '',
    code,
    hash: code && typeof matHash === 'function' ? matHash(code) : '',
    template: ps && ps.template ? ps.template : '',
    framework: (el('test_framework') && el('test_framework').value) || 'foundry',
    coverage: (el('test_coverage') && el('test_coverage').value) || 'full'
  };
}

function tgFinish(){
  if(!tgRun || tgRun.done) return;
  const btn = document.getElementById('genTestsBtn');
  if(!btn || btn.disabled) return;                       // still waiting for the AI
  const lines = [...document.querySelectorAll('#deployConsole .line .msg')].map((m) => m.textContent).slice(tgRun.consoleLen);
  const err = lines.find((t) => /^Test gen error: /.test(t));
  tgRun.done = true;
  if(err){ tgRun.error = err.replace(/^Test gen error: /, ''); return; }
  const out = document.getElementById('testOutput');
  if(out && out.style.display === 'block'){
    const code = typeof lastTestCode === 'string' ? lastTestCode : '';
    tgLast = { name: tgRun.name, hash: tgRun.hash, framework: tgRun.framework, coverage: tgRun.coverage, code };
  }
}

function tgCount(code, framework){
  if(framework === 'hardhat') return { n: (code.match(/\bit\(/g) || []).length, what: 'it() blocks' };
  return { n: (code.match(/function test_?[A-Za-z]/g) || []).length, what: '"function test" lines' };
}

function tgRead(){
  const now = tgNow();
  const net = (typeof NETWORKS !== 'undefined' && typeof activeNetwork !== 'undefined') ? NETWORKS[activeNetwork] : null;
  const btn = document.getElementById('genTestsBtn');
  const working = !!(btn && btn.disabled);
  const why = (now.code && typeof reqBlockReason === 'function') ? reqBlockReason() : '';
  let state = 'none', outdated = '';
  if(working) state = 'working';
  else if(tgRun && tgRun.done && tgRun.error) state = 'failed';
  else if(tgLast){
    const sameSrc = tgLast.hash === now.hash && tgLast.name === now.name;
    const sameSet = tgLast.framework === now.framework && tgLast.coverage === now.coverage;
    state = sameSrc && sameSet ? 'current' : 'outdated';
    outdated = !sameSrc ? 'source' : (!sameSet ? 'settings' : '');
    if(!tgLast.code.trim() && state === 'current') state = 'empty';
  }
  const unavailable = state === 'failed' && /not configured|not available/i.test(tgRun.error || '');
  return { now, net, working, why, state, outdated, unavailable, mode: (typeof MC_MODES !== 'undefined' && typeof multichainMode !== 'undefined' && MC_MODES[multichainMode]) ? MC_MODES[multichainMode].label : '' };
}

const TG_COVER = { basic: 'Happy paths only', full: 'Happy paths, edge cases and reverts', security: 'Access control and fuzz stubs' };
const TG_FW = { foundry: 'Foundry', hardhat: 'Hardhat (Mocha/Chai)', both: 'Foundry and Hardhat' };

function tgRender(){
  const sum = document.getElementById('tgSummary'), prog = document.getElementById('tgProgress'), notes = document.getElementById('tgNotes');
  if(!sum || !prog || !notes) return;
  const v = tgRead(), n = v.now;
  sum.textContent = ''; prog.textContent = ''; notes.textContent = '';
  const row = CFBuilder.rowWriter(sum), step = CFBuilder.stepWriter(prog);
  const lvl = n.code && typeof matInfo === 'function' ? (matInfo(n.template) || {}).level : '';
  row('Contract', n.name ? n.name + '.sol' : 'None', n.name ? 'ok' : 'missing', n.name ? (lvl ? 'Maturity: ' + lvl : '') : 'Generate a contract in a builder first', true);
  if(n.code) row('Source', v.why ? 'Draft' : 'Ready', v.why ? 'missing' : 'ok', v.why ? 'Tests can still be written for a draft; it cannot be deployed: ' + v.why : '');
  CFBuilder.networkRow(row, v.net);
  row('Deployment Mode', v.mode || 'Unknown', v.mode ? 'ok' : 'bad');
  row('Framework', TG_FW[n.framework] || n.framework, 'ok', n.framework === 'both' ? 'One text for both: saving it gives a single .t.sol file' : '');
  row('Coverage', TG_COVER[n.coverage] || n.coverage, 'ok');
  // what is on screen
  const last = tgLast;
  if(v.state === 'none') row('Tests', 'Not generated yet', 'missing', 'Press Generate Tests');
  else if(v.state === 'working') row('Tests', 'Waiting for the AI…', 'missing');
  else if(v.state === 'failed') row('Tests', v.unavailable ? 'AI unavailable' : 'Request failed', 'bad', tgRun.error + (last ? ' · Download would still save the earlier tests for ' + last.name : ''));
  else {
    const c = tgCount(last.code, last.framework);
    const label = v.state === 'empty' ? 'The AI answered with no text' : 'For ' + last.name + '.sol (' + (TG_FW[last.framework] || last.framework) + ', ' + last.coverage + ')';
    row('Tests', label, v.state === 'current' ? 'ok' : (v.state === 'empty' ? 'bad' : 'missing'),
      v.state === 'outdated' ? (v.outdated === 'source' ? 'The contract on screen is not the one these were written for' : 'The framework or coverage changed since') : '');
    if(last.code.trim()) row('Counted in the text', c.n + ' ' + c.what, 'ok', 'Counted by the page from the text; the tests were not compiled or run');
  }
  if(last && last.code.trim()){
    const ext = (document.getElementById('test_framework') || {}).value === 'hardhat' ? '.test.js' : '.t.sol';
    row('Download saves', n.name + ext, last.hash === n.hash && last.name === n.name ? 'ok' : 'missing', 'The file name follows the contract and the framework chosen now, not the ones the text was written for', true);
  }
  // progress: only what really happened
  const hasSrc = !!n.code;
  step('Source', hasSrc ? (v.why ? 'draft' : 'done') : 'todo', hasSrc ? (v.why ? 'A draft: tests can be written, but it cannot be deployed yet.' : n.name + '.sol is on screen.') : 'Generate a contract in a builder first.');
  if(!hasSrc) step('Tests written', 'locked', 'Available once there is a contract.');
  else if(v.state === 'working') step('Tests written', 'todo', 'Waiting for the AI…');
  else if(v.state === 'failed') step('Tests written', 'attention', v.unavailable ? 'The AI is unavailable: ' + tgRun.error : 'The request failed: ' + tgRun.error);
  else if(v.state === 'current') step('Tests written', 'done', 'Written for this source, with these settings.');
  else if(v.state === 'empty') step('Tests written', 'attention', 'The AI answered with no text.');
  else if(v.state === 'outdated') step('Tests written', 'stale', v.outdated === 'source' ? 'The contract changed after these tests were written. Generate again.' : 'The framework or coverage changed after these tests were written.');
  else step('Tests written', 'todo', 'Press Generate Tests to ask the AI.');
  step('Review and run', hasSrc && (v.state === 'current' || v.state === 'outdated') ? 'todo' : 'locked', 'Not tracked here: read the tests and run them yourself (forge test or npx hardhat test). This page never compiles or runs them.');
  // notes
  [
    'The tests are written by an AI from the source on screen alone. They are a starting point: read them before you trust them.',
    'The page counts test functions from the text it receives. It does not compile or run them, so a count is not a result.',
    'The file name and extension follow the framework and the contract chosen when you press Download, which may differ from what the text was written for.'
  ].forEach((t) => { const li = document.createElement('li'); li.textContent = t; notes.appendChild(li); });
  const fw = document.getElementById('tgFwNote'); if(fw) fw.textContent = n.framework === 'both' ? 'Both comes as one text and is saved as a single .t.sol file.' : '';
  const empty = document.getElementById('tgEmpty'); if(empty) empty.hidden = document.getElementById('testOutput').style.display === 'block';
}

(function tgInit(){
  const sec = document.getElementById('sec-tests'), btn = document.getElementById('genTestsBtn');
  if(!sec || !btn || sec.dataset.tgBound) return;
  sec.dataset.tgBound = '1';
  // what the form held at the click (generateTests reads the same values, synchronously, before it waits for the AI)
  btn.addEventListener('click', () => {
    const n = tgNow();
    if(!n.code) return;
    tgRun = { name: n.name, hash: n.hash, framework: n.framework, coverage: n.coverage, consoleLen: document.querySelectorAll('#deployConsole .line').length, done: false, error: '' };
  }, true);
  let queued = false;
  const draw = () => { if(queued) return; queued = true; queueMicrotask(() => { queued = false; tgFinish(); tgRender(); }); };
  sec.addEventListener('input', draw); sec.addEventListener('change', draw);
  if(typeof MutationObserver === 'function'){
    const watch = (el, opts) => { if(el) new MutationObserver(draw).observe(el, opts); };
    watch(sec, { attributes: true, attributeFilter: ['style'] });
    watch(btn, { attributes: true, attributeFilter: ['disabled'] });
    watch(document.getElementById('testOutput'), { attributes: true, attributeFilter: ['style'], childList: true, subtree: true });
    watch(document.getElementById('deployConsole'), { childList: true });
    watch(document.getElementById('sidenet'), { childList: true, characterData: true, subtree: true });
  }
  CFBuilder.addView('tests', tgRender);
})();

/* ======================================================================
   WIRE NEW TEMPLATES INTO genSimple
   ====================================================================== */
renderNetBar();
updateSideNet();
renderSimpleGrid();
renderHistory();
loadFromUrlHash();
initRouter();
initTheme();
renderAnalyticsHistoryPills();

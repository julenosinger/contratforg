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

let activeNetwork = 'arc';
let provider=null, signer=null, account=null;
let pendingSource = { name:'', code:'' };

let netFilter = 'testnet'; // 'testnet' | 'mainnet' | 'all'

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
    t.onclick = ()=>{ netFilter=f; renderNetBar(); };
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
    b.onclick = async ()=>{
      if(net.isMainnet && !(await confirmMainnet(net.label))) return;
      activeNetwork = key;
      renderNetBar();
      updateSideNet();
      if(account) switchWalletNetwork();
    };
    grid.appendChild(b);
  });
  bar.appendChild(grid);
}

/* Resolves true when the user agrees to switch to a mainnet (in-app dialog; falls back to confirm()). */
function confirmMainnet(label){
  if(typeof uiConfirmSwitch === 'function'){
    const key = Object.keys(NETWORKS).find(k=>NETWORKS[k].label===label);
    return uiConfirmSwitch(label, (key && NETWORKS[key].gasSymbol) || 'ETH');
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

/* ---------------- Sidebar navigation ---------------- */
document.querySelectorAll('.nav-item').forEach(item=>{
  item.addEventListener('click',()=>{
    const target = item.dataset.section;
    document.querySelectorAll('.nav-item').forEach(i=>i.classList.remove('active'));
    item.classList.add('active');
    document.querySelectorAll('main section.section').forEach(s=>s.style.display='none');
    document.getElementById('sec-'+target).style.display='block';
  });
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
    // Show native gas token balance
    const nativeBal = await provider.getBalance(account);
    const nativeFmt = parseFloat(ethers.utils.formatUnits(nativeBal, 18)).toFixed(4);

    // Additionally show USDC balance if address is known
    if(net.usdc && net.usdc !== ''){
      try{
        const usdc = new ethers.Contract(net.usdc, ERC20_BALANCE_ABI, provider);
        const dec  = await usdc.decimals();
        const bal  = await usdc.balanceOf(account);
        const fmt  = parseFloat(ethers.utils.formatUnits(bal, dec)).toFixed(2);
        document.getElementById('balanceBadge').textContent = net.gasSymbol==='USDC'
          ? fmt+' USDC'   // Arc: native gas and ERC-20 USDC are one pool, show it once
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
   SECTION 04 — VAULT (ERC-4626 minimal)
   ====================================================================== */
function genVault(){
  const net=NETWORKS[activeNetwork];
  const name=(document.getElementById('vault_name').value||'ArcYieldVault').replace(/[^A-Za-z0-9]/g,'');
  const symbol=document.getElementById('vault_symbol').value||'avTKN';
  const asset=resolveToken(document.getElementById('vault_asset').value,'usdc');
  const vaultProblems=[reqTokenProblem('Asset', document.getElementById('vault_asset').value, asset, net.label)].filter(Boolean);
  const perf=document.getElementById('vault_perf').value||'0';
  const strategy=document.getElementById('vault_strategy').value;
  const cap=document.getElementById('vault_cap').value||'0';

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
    uint256 public depositCap = ${cap} * 10**6; // 0 = unlimited (assumes a 6-decimal asset)
    uint256 public constant PERF_FEE_BPS = ${perf};
    /// @dev Virtual shares: 1e12 shares per smallest asset unit when the vault is empty (a 6-decimal asset maps to 18-decimal shares).
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

    constructor() { owner = msg.sender; }

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
    { kind:'scaled', name:'depositCap', expr:cap, tokenParam:'asset_' }
  ]);
  code = matStamp(code, 'vault');
  showCode('vaultCode', name+'.sol', code);
  pendingSource = { name, code, template: 'vault', problems: vaultProblems };
  renderCtorArgs();
  document.getElementById('pendingContractLabel').value = name+'.sol  ('+net.label+')';
}

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
  document.querySelectorAll('.nav-item').forEach(i=>i.classList.remove('active'));
  document.querySelector('[data-section="deploy"]').classList.add('active');
  document.querySelectorAll('main section.section').forEach(s=>s.style.display='none');
  document.getElementById('sec-deploy').style.display='block';
  window.scrollTo({top:0, behavior:'smooth'});
}

/* ======================================================================
   COMPILE + DEPLOY (self-hosted solc-js, verified against vendor/MANIFEST.json)
   ====================================================================== */

async function compileAndDeploy(){
  if(!pendingSource.code){ logConsole('err','Generate a contract first.'); return; }
  if(!signer){ logConsole('err','Connect your wallet first.'); return; }
  const draftReason = reqBlockReason();   // on every network: a draft is never compiled or deployed
  if(draftReason){ logConsole('err','Deploy blocked. '+draftReason); return; }
  const sameAsDeployer = (pendingSource.notDeployer || []).find(x => reqAddressProblem(x.value, { notDeployer:true }) === 'cannot be the wallet that deploys the contract');
  if(sameAsDeployer){ logConsole('err','Deploy blocked. '+sameAsDeployer.label+' cannot be the wallet that deploys the contract. Use another address and generate again.'); return; }
  if(!(await matGate([activeNetwork], pendingSource))){ logConsole('warn','Mainnet deployment cancelled (maturity check not confirmed).'); return; }

  if(typeof uiResetDeployResults === 'function') uiResetDeployResults();
  logConsole('step','Starting compilation of '+pendingSource.name+'.sol…');

  try{
    const compiled = await compilePending();
    const ctorInputs = (compiled.abi.find(x=>x.type==='constructor') || { inputs: [] }).inputs;
    const ctorValues = collectCtorValues(ctorInputs);
    if(!(await mainnetDeployConfirm({ args: typeof ctorSummary === 'function' ? ctorSummary() : [], maturity: matDialogInfo(pendingSource.template), facts: compilerFacts(compiled).concat(pendingSource.facts || []), acks: pendingSource.acks || [] }))){ logConsole('warn','Mainnet deployment cancelled.'); return; }
    await deployCompiled(compiled, ctorValues, activeNetwork);
  }catch(e){
    if(e && e.handled) return; // already reported in the console
    logConsole('err','Error: '+(e.message||e));
  }
}

/* Compiles any source with the selected solc; resolves { name, target, abi, bytecode }. */
async function compileSource(name, code){
  const version = document.getElementById('solcVersion').value;
  await ensureSolcLoaded(version);

  const input = {
    language: 'Solidity',
    sources: { [name+'.sol']: { content: code } },
    settings: { outputSelection: { '*': { '*': ['abi','evm.bytecode.object'] } }, optimizer:{enabled:true, runs:200} }
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
  const contractNames = Object.keys(contracts);
  const target = contracts[name] ? name : contractNames[0];
  const abi = contracts[target].abi;
  const bytecode = '0x'+contracts[target].evm.bytecode.object;
  const bytecodeKeccak256 = (typeof ethers !== 'undefined' && ethers.utils && ethers.utils.keccak256) ? ethers.utils.keccak256(bytecode) : '';

  logConsole('ok','Compiled successfully: '+target+' ('+abi.length+' ABI items).');
  return { name, target, abi, bytecode, sourceHash: matHash(code), compilerVersion: SOLC_VERSION, compilerSha256: SOLC_SHA256, bytecodeKeccak256 };
}

async function compilePending(){
  const compiled = await compileSource(pendingSource.name, pendingSource.code);
  // Store for Playground, Gas Estimator, Share
  window.__lastCompiledABI      = compiled.abi;
  window.__lastCompiledBytecode = compiled.bytecode;
  document.getElementById('auditContractLabel').value = pendingSource.name+'.sol';
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

/* 09 — ABI PLAYGROUND lives in playground.js */

/* ======================================================================
   10 — DEPLOY HISTORY
   ====================================================================== */
const HISTORY_KEY = 'contractforge_deploy_history';

function loadDeployHistory(){
  try{ return JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]'); }
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

function renderHistory(){
  if(typeof renderHome === 'function') renderHome();
  if(typeof pgRefreshDeployments === 'function') pgRefreshDeployments();
  const hist = loadDeployHistory();
  const container = document.getElementById('historyList');
  if(!container) return;
  if(!hist.length){
    container.innerHTML = '<p style="color:#5C6B65;font-family:var(--mono);font-size:12px;">No deployments yet. Deploy a contract in section 07.</p>';
    return;
  }
  container.innerHTML = '';
  hist.forEach((entry,i)=>{
    if(!entry || !isAddr(entry.address)) return; // ignore corrupted history entries
    const net = NETWORKS[entry.network];
    const explorerUrl = net?.explorer ? net.explorer+'/address/'+entry.address : '';
    const ago = timeAgo(entry.timestamp);
    const row = document.createElement('div');
    row.className = 'hist-row';
    row.innerHTML = `
      <span class="hnet">${escapeHtml(entry.network||'unknown')}</span>
      <span class="hname">${escapeHtml(entry.name||'Contract')}</span>
      <span class="haddr" title="${escapeHtml(entry.address)}">${entry.address.slice(0,10)}…${entry.address.slice(-6)}</span>
      <span class="htime">${ago}</span>
      <div class="hbtns">
        ${explorerUrl?`<button class="hbtn" data-onclick="openExternal('${escapeHtml(explorerUrl)}')">Explorer ↗</button>`:''}
        <button class="hbtn" data-onclick="loadHistoryIntoPlayground(${i})">Playground</button>
        <button class="hbtn" data-onclick="deleteHistoryEntry(${i})" style="color:#E08A6B;">✕</button>
      </div>`;
    container.appendChild(row);
  });
}

function loadHistoryIntoPlayground(i){
  const hist = loadDeployHistory();
  const entry = hist[i];
  if(!entry){ return; }
  // Navigate to playground
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  document.querySelector('[data-section="playground"]')?.classList.add('active');
  document.querySelectorAll('main section.section').forEach(s=>s.style.display='none');
  document.getElementById('sec-playground').style.display='block';
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
  if(!apiUrl){ logVerify('err','Source verification is not yet available for '+NETWORKS[activeNetwork].label+'. Supported: Ethereum, Polygon, Base, Arbitrum, Optimism (mainnet + testnet).'); return; }

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
  const url = window.location.href.split('#')[0]+'#cfg='+encoded;
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
  // Use a free QR API
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
  qrBox.innerHTML = `<img src="${qrUrl}" alt="QR Code" style="border:8px solid var(--paper);border-radius:2px;" />
    <div style="font-family:var(--mono);font-size:10px;color:#5C6B65;margin-top:8px;">Scan to open this configuration</div>`;
}


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
  document.querySelectorAll('.nav-item').forEach(i=>i.classList.remove('active'));
  document.querySelector(`[data-section="${target}"]`)?.classList.add('active');
  document.querySelectorAll('main section.section').forEach(s=>s.style.display='none');
  document.getElementById('sec-'+target).style.display='block';
  if(!isAdv){
    renderSimpleForm(sub);
    setTimeout(()=>{
      document.querySelectorAll('#simpleGrid .tcard').forEach(c=>{ if(c.dataset.id===sub) c.click(); });
    }, 100);
  }
  window.scrollTo({top:0,behavior:'smooth'});
}

/* ======================================================================
   NL → SOLIDITY AI GENERATOR
   ====================================================================== */
const NL_EXAMPLES = {
  escrow:       'Create a two-party escrow. The buyer deposits USDC. A neutral arbiter can release funds to the seller or refund the buyer. After 14 days with no dispute the seller can claim automatically.',
  dao:          'Build a DAO governance contract. Members with 1000+ tokens can propose. Voting lasts 7 days with 4% quorum. Passed proposals go into a 48-hour timelock before execution.',
  nft:          'An NFT collection of 5000 items. Public mint costs 0.05 ETH. 24-hour allowlist phase before public. Royalties 5% on secondary. Metadata revealed after mint ends.',
  amm:          'A minimal constant-product AMM for two ERC-20 tokens. Add/remove liquidity and swap both ways. 0.3% fee on swaps goes to liquidity providers.',
  subscription: 'Subscription contract: users pay 9 USDC per month. Access tracked per address, auto-expires. Owner can change price and pause the contract.',
  staking:      'Staking contract for an ERC-20 token. Users earn 15% APY in the same token. 30-day lock. Early exit allowed with 2% penalty.',
};

let lastNLCode = '';

function setNLExample(key){
  const ta=document.getElementById('nl_prompt');
  if(ta && NL_EXAMPLES[key]) ta.value=NL_EXAMPLES[key];
  document.querySelectorAll('#nl_examples .pill').forEach(p=>p.classList.remove('active'));
  document.querySelector(`#nl_examples .pill[data-onclick*="${key}"]`)?.classList.add('active');
}

async function generateFromNL(){
  const prompt=document.getElementById('nl_prompt')?.value?.trim();
  if(!prompt||prompt.length<20){ alert('Describe your contract in more detail (at least 20 characters).'); return; }

  const btn=document.getElementById('nlGenBtn');
  btn.disabled=true; btn.textContent='Generating…';
  document.getElementById('nl_output').style.display='none';

  const networkCtx=document.getElementById('nl_network')?.value||'arc';
  const complexity=document.getElementById('nl_complexity')?.value||'moderate';
  const netInfo=NETWORKS[networkCtx]||NETWORKS.arc;

  try{
    const data=await aiFetch('generate', { prompt, network:{ label:netInfo.label, chainId:netInfo.chainIdDec, usdc:netInfo.usdc||'' }, complexity });
    let code=(data.text||'').replace(/^```[a-z]*\s*/,'').replace(/\s*```$/,'').trim();
    lastNLCode=code;

    const nameMatch=code.match(/contract\s+(\w+)/);
    const contractName=nameMatch?nameMatch[1]:'GeneratedContract';
    document.getElementById('nl_filename').textContent=contractName+'.sol  ('+(data.outputTokens||'?')+' tokens used)';
    document.getElementById('nl_code').textContent=code;
    document.getElementById('nl_output').style.display='block';

    code = matStamp(code, 'ai');
    lastNLCode = code;
    document.getElementById('nl_code').textContent = code;
    pendingSource={name:contractName, code, template:'ai'};
    pendingCtorArgs = []; renderCtorArgs();
    document.getElementById('pendingContractLabel').value=contractName+'.sol (AI — '+NETWORKS[activeNetwork].label+')';
    document.getElementById('auditContractLabel').value=contractName+'.sol';
    document.getElementById('test_contractLabel').value=contractName+'.sol';
    logConsole('ok','AI generated: '+contractName+'.sol ('+code.split('\n').length+' lines)');
  }catch(e){
    document.getElementById('nl_code').textContent='Error: '+(e.message||e);
    document.getElementById('nl_output').style.display='block';
    logConsole('err','AI generation error: '+(e.message||e));
  }finally{
    btn.disabled=false; btn.textContent='Generate Solidity';
  }
}

function useNLContract(){ if(!lastNLCode){ alert('Generate first.'); return; } deployFromBuffer('nlai'); }
function copyNLContract(){ if(lastNLCode) navigator.clipboard.writeText(lastNLCode).then(()=>logConsole('ok','Code copied.')); }
function auditNLContract(){
  if(!lastNLCode){ alert('Generate a contract first.'); return; }
  document.querySelectorAll('.nav-item').forEach(i=>i.classList.remove('active'));
  document.querySelector('[data-section="auditor"]')?.classList.add('active');
  document.querySelectorAll('main section.section').forEach(s=>s.style.display='none');
  document.getElementById('sec-auditor').style.display='block';
  runAudit();
}

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

/* ======================================================================
   WIRE NEW TEMPLATES INTO genSimple
   ====================================================================== */
renderNetBar();
updateSideNet();
renderSimpleGrid();
renderHistory();
loadFromUrlHash();
initTheme();
renderAnalyticsHistoryPills();

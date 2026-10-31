/* ======================================================================
   CONTRACTFORGE — engine
   ====================================================================== */

const NETWORKS = {

  /* ── MAINNETS ─────────────────────────────────────────────── */
  ethereum: {
    label:'Ethereum', chainIdHex:'0x1', chainIdDec:1, isMainnet:true,
    rpc:'https://eth.llamarpc.com', explorer:'https://etherscan.io',
    gasSymbol:'ETH', gasDecimals:18,
    usdc:'0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    eurc:'0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c',
    usdcDecimals:6,
    cctp:{ tokenMessenger:'0xBd3fa81B58Ba92a82136038B25aDec7066af3155', messageTransmitter:'0x0a992d191DEeC32aFe36203Ad87D7d289a738F81' },
    explorerApi:'https://api.etherscan.io/api',
  },
  polygon: {
    label:'Polygon', chainIdHex:'0x89', chainIdDec:137, isMainnet:true,
    rpc:'https://polygon.llamarpc.com', explorer:'https://polygonscan.com',
    gasSymbol:'POL', gasDecimals:18,
    usdc:'0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
    eurc:'',
    usdcDecimals:6,
    cctp:{ tokenMessenger:'0x9daF8c91AEFAE50b9c0E69629D3F6Ca40cA3B3FE', messageTransmitter:'0xF3be9355363857F3e001be68856A2f96b4C39Ba9' },
    explorerApi:'https://api.polygonscan.com/api',
  },
  base: {
    label:'Base', chainIdHex:'0x2105', chainIdDec:8453, isMainnet:true,
    rpc:'https://mainnet.base.org', explorer:'https://basescan.org',
    gasSymbol:'ETH', gasDecimals:18,
    usdc:'0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    eurc:'0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42',
    usdcDecimals:6,
    cctp:{ tokenMessenger:'0x1682Ae6375C4E4A97e4B583BC394c861A46D8962', messageTransmitter:'0xAD09780d193884d503182aD4588450C416D6F9D4' },
    explorerApi:'https://api.basescan.org/api',
  },
  arbitrum: {
    label:'Arbitrum One', chainIdHex:'0xa4b1', chainIdDec:42161, isMainnet:true,
    rpc:'https://arb1.arbitrum.io/rpc', explorer:'https://arbiscan.io',
    gasSymbol:'ETH', gasDecimals:18,
    usdc:'0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    eurc:'',
    usdcDecimals:6,
    cctp:{ tokenMessenger:'0x19330d10D9Cc8751218eaf51E8885D058642E08A', messageTransmitter:'0xC30362313FBBA5cf9163F0bb16a0e01f01A896ca' },
    explorerApi:'https://api.arbiscan.io/api',
  },
  optimism: {
    label:'Optimism', chainIdHex:'0xa', chainIdDec:10, isMainnet:true,
    rpc:'https://mainnet.optimism.io', explorer:'https://optimistic.etherscan.io',
    gasSymbol:'ETH', gasDecimals:18,
    usdc:'0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
    eurc:'',
    usdcDecimals:6,
    cctp:{ tokenMessenger:'0x2B4069517957735bE00ceE0fadAE88a26365528f', messageTransmitter:'0x4D41f22c5a0e5c74090899E5a8Fb597a8842b3e8' },
    explorerApi:'https://api-optimistic.etherscan.io/api',
  },
  avalanche: {
    label:'Avalanche C-Chain', chainIdHex:'0xa86a', chainIdDec:43114, isMainnet:true,
    rpc:'https://api.avax.network/ext/bc/C/rpc', explorer:'https://snowtrace.io',
    gasSymbol:'AVAX', gasDecimals:18,
    usdc:'0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
    eurc:'',
    usdcDecimals:6,
    cctp:{ tokenMessenger:'0x6B25532e1060CE10cc3B0A99e5683b91BFDe6982', messageTransmitter:'0x8186359aF5F57FbB40c6b14A588d2A59C0C29880' },
    explorerApi:'https://api.snowtrace.io/api',
  },
  bnb: {
    label:'BNB Chain', chainIdHex:'0x38', chainIdDec:56, isMainnet:true,
    rpc:'https://bsc-dataseed.binance.org', explorer:'https://bscscan.com',
    gasSymbol:'BNB', gasDecimals:18,
    usdc:'0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    eurc:'',
    usdcDecimals:18,
    cctp:{ tokenMessenger:'', messageTransmitter:'' },
    explorerApi:'https://api.bscscan.com/api',
  },
  robinhoodMain: {
    label:'Robinhood Chain', chainIdHex:'0xB61F', chainIdDec:46623, isMainnet:true,
    rpc:'https://rpc.chain.robinhood.com', explorer:'https://explorer.chain.robinhood.com',
    gasSymbol:'ETH', gasDecimals:18,
    usdc:'', eurc:'', usdcDecimals:6,
    cctp:{ tokenMessenger:'', messageTransmitter:'' },
    explorerApi:'',
  },
  arcMain: {
    label:'Arc Mainnet', chainIdHex:'0x13b2', chainIdDec:5042, isMainnet:true,
    rpc:'https://rpc.mainnet.arc.io', explorer:'https://explorer.arc.io',
    gasSymbol:'USDC', gasDecimals:18,
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
    gasSymbol:'USDC', gasDecimals:18,
    usdc:'0x3600000000000000000000000000000000000000',
    eurc:'0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a',
    usdcDecimals:6,
    cctp:{ tokenMessenger:'', messageTransmitter:'' },
    explorerApi:'',
  },
  robinhood: {
    label:'Robinhood Testnet', chainIdHex:'0xB626', chainIdDec:46630, isMainnet:false,
    rpc:'https://rpc.testnet.chain.robinhood.com', explorer:'https://explorer.testnet.chain.robinhood.com',
    gasSymbol:'ETH', gasDecimals:18,
    usdc:'', eurc:'', usdcDecimals:6,
    cctp:{ tokenMessenger:'', messageTransmitter:'' },
    explorerApi:'',
  },
  sepolia: {
    label:'Ethereum Sepolia', chainIdHex:'0xaa36a7', chainIdDec:11155111, isMainnet:false,
    rpc:'https://rpc.sepolia.org', explorer:'https://sepolia.etherscan.io',
    gasSymbol:'ETH', gasDecimals:18,
    usdc:'0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    eurc:'0x08210F9170F89Ab7658F0B5E3fF39b0E03C594D4',
    usdcDecimals:6,
    cctp:{ tokenMessenger:'0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5', messageTransmitter:'0x7865fAfC2db2093669d92c0F33AeEF291086BEFD' },
    explorerApi:'https://api-sepolia.etherscan.io/api',
  },
  amoy: {
    label:'Polygon Amoy', chainIdHex:'0x13882', chainIdDec:80002, isMainnet:false,
    rpc:'https://rpc-amoy.polygon.technology', explorer:'https://amoy.polygonscan.com',
    gasSymbol:'POL', gasDecimals:18,
    usdc:'0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582', eurc:'',
    usdcDecimals:6,
    cctp:{ tokenMessenger:'0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5', messageTransmitter:'0x7865fAfC2db2093669d92c0F33AeEF291086BEFD' },
    explorerApi:'https://api-amoy.polygonscan.com/api',
  },
  basesep: {
    label:'Base Sepolia', chainIdHex:'0x14a34', chainIdDec:84532, isMainnet:false,
    rpc:'https://sepolia.base.org', explorer:'https://sepolia.basescan.org',
    gasSymbol:'ETH', gasDecimals:18,
    usdc:'0x036CbD53842c5426634e7929541eC2318f3dCF7e', eurc:'',
    usdcDecimals:6,
    cctp:{ tokenMessenger:'0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5', messageTransmitter:'0x7865fAfC2db2093669d92c0F33AeEF291086BEFD' },
    explorerApi:'https://api-sepolia.basescan.org/api',
  },
  arbsep: {
    label:'Arbitrum Sepolia', chainIdHex:'0x66eee', chainIdDec:421614, isMainnet:false,
    rpc:'https://sepolia-rollup.arbitrum.io/rpc', explorer:'https://sepolia.arbiscan.io',
    gasSymbol:'ETH', gasDecimals:18,
    usdc:'0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d', eurc:'',
    usdcDecimals:6,
    cctp:{ tokenMessenger:'0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5', messageTransmitter:'0x7865fAfC2db2093669d92c0F33AeEF291086BEFD' },
    explorerApi:'https://api-sepolia.arbiscan.io/api',
  },
  opsep: {
    label:'Optimism Sepolia', chainIdHex:'0xaa37dc', chainIdDec:11155420, isMainnet:false,
    rpc:'https://sepolia.optimism.io', explorer:'https://sepolia-optimism.etherscan.io',
    gasSymbol:'ETH', gasDecimals:18,
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
  status.innerHTML = `<span class="dot"></span> ${addr.slice(0,6)}…${addr.slice(-4)}
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
  { id:'smartwallet',name:'Smart Wallet (ERC-4337)', desc:'Account abstraction wallet with guardian recovery, session keys, and gasless UX.', tags:['ERC-4337','AA','Gasless'], isNew:true},
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
        <button class="btn btn-primary" onclick="genSimple('erc20')">Generate contract</button>
        <button class="btn btn-ghost" onclick="deployFromBuffer('simple')">Deploy now</button>
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
        <button class="btn btn-primary" onclick="genSimple('erc721')">Generate contract</button>
        <button class="btn btn-ghost" onclick="deployFromBuffer('simple')">Deploy now</button>
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
        <button class="btn btn-primary" onclick="genSimple('escrow')">Generate contract</button>
        <button class="btn btn-ghost" onclick="deployFromBuffer('simple')">Deploy now</button>
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
        <button class="btn btn-primary" onclick="genSimple('vesting')">Generate contract</button>
        <button class="btn btn-ghost" onclick="deployFromBuffer('simple')">Deploy now</button>
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
        <button class="btn btn-primary" onclick="genSimple('paywall')">Generate contract</button>
        <button class="btn btn-ghost" onclick="deployFromBuffer('simple')">Deploy now</button>
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
        <button class="btn btn-primary" onclick="genSimple('dao')">Generate contract</button>
        <button class="btn btn-ghost" onclick="deployFromBuffer('simple')">Deploy now</button>
      </div>`;
  } else if(id==='smartwallet'){
    html=`
      <div class="field-grid">
        <div class="field"><label>Contract name</label><input id="s_name" value="ArcSmartWallet"/></div>
        <div class="field"><label>Entry point (ERC-4337, leave empty = default)</label><input id="s_entrypoint" placeholder="0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"/></div>
        <div class="field"><label>Guardian (recovery address)</label><input id="s_guardian" placeholder="0x..."/></div>
        <div class="field"><label>Session key validity (hours)</label><input id="s_session" type="number" value="24"/></div>
        <div class="field"><label>Daily spend limit (USDC)</label><input id="s_spendlimit" type="number" value="1000"/></div>
      </div>
      <div class="btnrow">
        <button class="btn btn-primary" onclick="genSimple('smartwallet')">Generate contract</button>
        <button class="btn btn-ghost" onclick="deployFromBuffer('simple')">Deploy now</button>
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
        <button class="btn btn-primary" onclick="genSimple('staking')">Generate contract</button>
        <button class="btn btn-ghost" onclick="deployFromBuffer('simple')">Deploy now</button>
      </div>`;
  }
  panel.innerHTML = html;
}

function genSimple(id){
  const net=NETWORKS[activeNetwork];
  const g=(id)=>document.getElementById(id)?.value ?? '';
  let code='', name='', mcSpecs=[];

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

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Mint(address indexed to, uint256 amount);
    ${burn?'event Burn(address indexed from, uint256 amount);':''}

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
    mcSpecs = [
      { kind:'addr', name:'usdc', type:'address', value: usdc==='' ? '0x0000000000000000000000000000000000000000' : usdc, param:'usdc_', hint:'usdc', optional: /^0+(\.0+)?$/.test(String(price).trim()) },
      { kind:'scaled', name:'mintPrice', expr: price, tokenParam:'usdc_' }
    ];
    code = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/// @title ${name} — NFT collection (minimal ERC-721) with USDC-paid mint
/// @notice Generated by ContractForge for ${net.label} (chainId ${net.chainIdDec})
contract ${name} {
    string public name = "${g('s_name')||name}";
    string public symbol = "${sym}";
    string public baseURI = "${baseuri}";
    uint256 public constant MAX_SUPPLY = ${supply};
    uint256 public mintPrice = ${price} * 10**6; // USDC, 6 decimals
    uint96  public royaltyBps = ${royalty};
    address public owner;
    address public usdc = ${usdc==='' ? '0x0000000000000000000000000000000000000000' : usdc};
    uint256 public totalSupply;

    mapping(uint256 => address) public ownerOf;
    mapping(address => uint256) public balanceOf;
    mapping(uint256 => address) public getApproved;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event Minted(address indexed to, uint256 indexed tokenId);

    modifier onlyOwner(){ require(msg.sender == owner, "not owner"); _; }

    constructor() { owner = msg.sender; }

    function tokenURI(uint256 tokenId) external view returns (string memory) {
        return string(abi.encodePacked(baseURI, _toString(tokenId)));
    }

    /// @notice EIP-2981 royalty info
    function royaltyInfo(uint256, uint256 salePrice) external view returns (address receiver, uint256 royaltyAmount) {
        return (owner, (salePrice * royaltyBps) / 10000);
    }

    function mint() external returns (uint256 tokenId) {
        require(totalSupply < MAX_SUPPLY, "sold out");
        if (mintPrice > 0) {
            require(IERC20(usdc).transferFrom(msg.sender, owner, mintPrice), "USDC payment failed");
        }
        tokenId = ++totalSupply;
        ownerOf[tokenId] = msg.sender;
        balanceOf[msg.sender] += 1;
        emit Transfer(address(0), msg.sender, tokenId);
        emit Minted(msg.sender, tokenId);
    }

    function approve(address to, uint256 tokenId) external {
        require(ownerOf[tokenId] == msg.sender, "not token owner");
        getApproved[tokenId] = to;
        emit Approval(msg.sender, to, tokenId);
    }

    function transferFrom(address from, address to, uint256 tokenId) external {
        require(ownerOf[tokenId] == from, "wrong owner");
        require(msg.sender == from || getApproved[tokenId] == msg.sender, "not authorized");
        ownerOf[tokenId] = to;
        balanceOf[from] -= 1;
        balanceOf[to] += 1;
        delete getApproved[tokenId];
        emit Transfer(from, to, tokenId);
    }

    function setMintPrice(uint256 newPrice) external onlyOwner { mintPrice = newPrice; }
    function setBaseURI(string calldata uri) external onlyOwner { baseURI = uri; }

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
    const buyer=g('s_buyer')||'0x0000000000000000000000000000000000dEaD';
    const seller=g('s_seller')||'0x0000000000000000000000000000000000bEEF';
    const arbiter=g('s_arbiter')||'0x0000000000000000000000000000000000cAfE';
    const token=resolveToken(g('s_token'),'usdc');
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

    constructor() {
        deadline = block.timestamp + ${timeout} days;
    }

    function fund() external {
        require(msg.sender == buyer, "only buyer");
        require(!funded, "already funded");
        require(token.transferFrom(buyer, address(this), amount), "transferFrom failed");
        funded = true;
        emit Funded(amount);
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
    const beneficiary=g('s_beneficiary')||'0x0000000000000000000000000000000000bEEF';
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
        start = block.timestamp;
    }

    function fund() external {
        require(!funded, "already funded");
        require(token.transferFrom(msg.sender, address(this), totalAmount), "transferFrom failed");
        funded = true;
        emit Funded(totalAmount);
    }

    function vestedAmount() public view returns (uint256) {
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
    const beneficiary=g('s_beneficiary')||'0x0000000000000000000000000000000000bEEF';
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

    mapping(address => uint256) public accessUntil;

    event Subscribed(address indexed user, uint256 until);

    modifier onlyOwner(){ require(msg.sender == owner, "not owner"); _; }

    constructor() { owner = msg.sender; }

    function isActive(address user) external view returns (bool) {
        return accessUntil[user] >= block.timestamp;
    }

    /// @notice Pays for one period and extends access (cumulative if already active)
    function subscribe() external {
        require(token.transferFrom(msg.sender, beneficiary, pricePerPeriod), "payment failed");
        uint256 base = accessUntil[msg.sender] > block.timestamp ? accessUntil[msg.sender] : block.timestamp;
        accessUntil[msg.sender] = base + periodDuration;
        emit Subscribed(msg.sender, accessUntil[msg.sender]);
    }

    function setPrice(uint256 newPrice) external onlyOwner { pricePerPeriod = newPrice; }
    function setBeneficiary(address newBeneficiary) external onlyOwner { beneficiary = newBeneficiary; }
}`;
  }

  code = portabilize(code, mcSpecs);
  showCode('simpleCode', name+'.sol', code);
  pendingSource = { name, code };
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

    event PairCreated(address token0, address token1, address pair);

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
        uint256 fee = (amountB * FEE_BPS) / 10000;
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
  showCode('swapCode', filename, code);
  pendingSource = { name: (multi==='factory' && kind==='amm')?name+'Factory':name, code };
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
  const signersArr = signersRaw.length ? signersRaw : ['0x0000000000000000000000000000000000dEaD'];

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
  showCode('treasuryCode', name+'.sol', code);
  pendingSource = { name, code };
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
  showCode('vaultCode', name+'.sol', code);
  pendingSource = { name, code };
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

    event BatchSent(address indexed sender, address token, uint256 totalAmount, uint256 recipients);
`;

  if(mode==='erc20' || mode==='both'){
    code += `
    /// @notice Sends \`amounts[i]\` of \`token\` to \`recipients[i]\`. Requires prior approve to this contract.
    function multiSendToken(address token, address[] calldata recipients, uint256[] calldata amounts) external {
        require(recipients.length == amounts.length, "length mismatch");
        require(recipients.length <= MAX_RECIPIENTS, "too many recipients");

        uint256 total = 0;
        for (uint256 i = 0; i < amounts.length; i++) total += amounts[i];

        uint256 fee = (FEE_BPS > 0) ? (total * FEE_BPS) / 10000 : 0;
        uint256 totalWithFee = total + fee;

        require(IERC20(token).transferFrom(msg.sender, address(this), totalWithFee), "transferFrom failed");

        for (uint256 i = 0; i < recipients.length; i++) {
            require(IERC20(token).transfer(recipients[i], amounts[i]), "transfer failed");
        }
        if (fee > 0) require(IERC20(token).transfer(feeRecipient, fee), "fee transfer failed");

        emit BatchSent(msg.sender, token, total, recipients.length);
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
            (bool ok, ) = recipients[i].call{value: amounts[i]}("");
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
  showCode('multisendCode', name+'.sol', code);
  pendingSource = { name, code };
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
  const tokenMessenger = document.getElementById('cc_tokenmessenger').value.trim() || net.cctp.tokenMessenger || '0x0000000000000000000000000000000000dEaD';
  const msgTransmitter = document.getElementById('cc_msgtransmitter').value.trim() || net.cctp.messageTransmitter || '0x0000000000000000000000000000000000dEaD';
  const usdc = document.getElementById('cc_usdc').value.trim() || net.usdc || '0x0000000000000000000000000000000000dEaD';
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

    event BurnInitiated(address indexed sender, uint256 amount, uint32 destinationDomain, bytes32 mintRecipient, uint64 nonce);
    event MintReceived(bytes32 indexed messageHash);
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
}`;

  code = portabilize(code, []);
  showCode('crosschainCode', name+'.sol', code);
  pendingSource = { name, code };
  document.getElementById('pendingContractLabel').value = name+'.sol  ('+net.label+')';
  renderCtorArgs();
}

/* ======================================================================
   CODE DISPLAY / DOWNLOAD
   ====================================================================== */
function showCode(panelId, filename, code){
  const panel=document.getElementById(panelId);
  panel.style.display='block';
  panel.innerHTML=`
    <div class="codehead">
      <span class="filename">${filename}</span>
      <span style="font-family:var(--mono);font-size:10.5px;color:#5C6B65;">${code.split('\n').length} lines</span>
    </div>
    <pre>${escapeHtml(code)}</pre>
  `;
  panel.scrollIntoView({behavior:'smooth', block:'nearest'});
}

/* AI requests go through a server function (/api/ai) that holds the API key. */
async function aiFetch(init){
  let r;
  try{
    r = await fetch('/api/ai',{ method:'POST', headers:{'Content-Type':'application/json'}, ...init });
  }catch(_){
    throw new Error('Could not reach the AI service. Check your connection.');
  }
  if(!r.ok){
    let msg = '';
    try{ const j = await r.json(); msg = (j && (j.error?.message || j.error)) || ''; }catch(_){}
    if(r.status===404 || r.status===405 || r.status===501) msg = 'AI is not available on this deployment (the /api/ai function is missing).';
    throw new Error(msg || ('AI request failed (HTTP '+r.status+').'));
  }
  return r;
}

function escapeHtml(s){
  return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function isAddr(a){ return /^0x[0-9a-fA-F]{40}$/.test(String(a||'')); }

function downloadSource(){
  if(!pendingSource.code){ logConsole('warn','No contract generated yet.'); return; }
  const blob=new Blob([pendingSource.code], {type:'text/plain'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url; a.download=pendingSource.name+'.sol';
  a.click();
  URL.revokeObjectURL(url);
}

function copySource(){
  if(!pendingSource.code){ logConsole('warn','No contract generated yet.'); return; }
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
   COMPILE + DEPLOY (solc-js loaded on demand from binaries.soliditylang.org)
   ====================================================================== */

async function compileAndDeploy(){
  if(!pendingSource.code){ logConsole('err','Generate a contract first.'); return; }
  if(!signer){ logConsole('err','Connect your wallet first.'); return; }
  if(NETWORKS[activeNetwork]?.isMainnet && /0x0{34,36}dEaD/i.test(pendingSource.code)){
    logConsole('err','Mainnet deploy blocked: the contract contains the placeholder address 0x…dEaD. Replace it with a real address (signers, buyer, CCTP or token addresses) and generate again.');
    return;
  }
  if(!(await mainnetDeployConfirm({ args: typeof ctorSummary === 'function' ? ctorSummary() : [] }))){ logConsole('warn','Mainnet deployment cancelled.'); return; }

  if(typeof uiResetDeployResults === 'function') uiResetDeployResults();
  logConsole('step','Starting compilation of '+pendingSource.name+'.sol…');

  try{
    const compiled = await compilePending();
    const ctorInputs = (compiled.abi.find(x=>x.type==='constructor') || { inputs: [] }).inputs;
    const ctorValues = collectCtorValues(ctorInputs);
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

  logConsole('ok','Compiled successfully: '+target+' ('+abi.length+' ABI items).');
  return { name, target, abi, bytecode };
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
  if(typeof uiAddDeployResult === 'function') uiAddDeployResult({ name: compiled.name, network: netKey, address: contract.address, txHash: contract.deployTransaction.hash });
  await refreshBalance();
  return contract;
}

const SOLC_COMMITS = {
  '0.8.24': 'e11b9ed9',
  '0.8.20': 'a1b79de6'
};

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

async function resolveSolcUrl(version){
  let commit = SOLC_COMMITS[version];
  if(!commit){
    try{
      const listResp = await fetch('https://binaries.soliditylang.org/emscripten-wasm32/list.json');
      const list = await listResp.json();
      const fileName = list.releases && list.releases[version];
      if(fileName){ const m = fileName.match(/commit\.([0-9a-f]+)/); if(m) commit = m[1]; }
    }catch(e){ /* ignore, fall through */ }
  }
  if(!commit) throw new Error('Unknown compiler version: '+version);
  return `https://binaries.soliditylang.org/emscripten-wasm32/solc-emscripten-wasm32-v${version}+commit.${commit}.js`;
}

/* Where the compiler can be downloaded from: the official host first, then a CDN mirror of the same build. */
async function resolveSolcUrls(version){
  const primary = await resolveSolcUrl(version);
  return [primary, `https://cdn.jsdelivr.net/npm/solc@${version}/soljson.js`];
}

function solcHost(u){ try{ return new URL(u).host; }catch(_){ return String(u); } }

async function loadSolcMainThread(version, urls){
  const list = Array.isArray(urls) ? urls : [urls];
  const failures = [];
  for(const url of list){
    try{
      await loadSolcScript(version, url);
      return url;
    }catch(e){
      failures.push(solcHost(url));
      const stale = document.querySelector('script[data-solc="1"]'); if(stale) stale.remove();
    }
  }
  throw new Error('Could not download the compiler from '+failures.join(' or ')+'. Check your connection, VPN, or an ad-blocker/privacy extension that blocks these hosts, then try again.');
}

function loadSolcScript(version, url){
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
    script.onerror=()=>reject(new Error('Failed to download solc v'+version+' — check your connection.'));
    document.head.appendChild(script);
  });
}

async function ensureSolcLoaded(version){
  if(solcLoaded && solcLoaded.version===version) return;
  logConsole('step','Loading solc-js v'+version+'… (first time may take ~10-20s)');
  const urls = await resolveSolcUrls(version);

  let mode = 'worker';
  try{
    if(typeof Worker === 'undefined') throw new Error('Web Workers unavailable');
    startSolcWorker();
    await solcCall({ type:'load', urls });
  }catch(e){
    if(solcWorker){ solcWorker.terminate(); solcWorker = null; }
    logConsole('warn','Background compiler unavailable ('+(e.message||e)+'). Trying the main thread.');
    await loadSolcMainThread(version, urls);
    mode = 'main';
  }
  solcLoaded = { version, mode };
  logConsole('ok','Compiler solc v'+version+' ready.');
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
  const focusMap = {
    full: 'all categories: reentrancy, access control, integer overflow/underflow, uninitialized storage, tx.origin misuse, unchecked return values, gas inefficiencies, business logic flaws, and code quality',
    security: 'security vulnerabilities only: reentrancy, access control, integer issues, unchecked calls, tx.origin, selfdestruct risks',
    gas: 'gas optimization opportunities: storage layout, loop efficiency, redundant operations, tight variable packing',
    logic: 'business logic correctness: state machine validity, invariant preservation, edge cases in financial math'
  };

  const prompt = `You are an expert Solidity security auditor. Audit the following smart contract focusing on ${focusMap[focus]}.

IMPORTANT: Respond ONLY with a valid JSON object — no markdown, no backticks, no preamble. The JSON must match this exact schema:
{
  "score": <integer 0-100, where 100 is perfect>,
  "summary": "<one sentence overall assessment>",
  "findings": [
    {
      "severity": "<critical|high|medium|low|info>",
      "title": "<short title>",
      "description": "<explanation of the issue>",
      "recommendation": "<how to fix it>",
      "lineHint": "<relevant code snippet or line reference, max 60 chars>"
    }
  ]
}

CONTRACT (${pendingSource.name}.sol):
\`\`\`solidity
${pendingSource.code}
\`\`\``;

  try{
    const resp = await aiFetch({
      body: JSON.stringify({
        model:'claude-sonnet-4-6',
        max_tokens:2000,
        messages:[{role:'user', content: prompt}]
      })
    });
    const data = await resp.json();
    const raw = data.content?.find(b=>b.type==='text')?.text || '';
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
    div.className = 'audit-finding '+f.severity;
    div.innerHTML = `
      <div><span class="sev">${f.severity.toUpperCase()}</span><h4>${escapeHtml(f.title||'')}</h4></div>
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
        ${explorerUrl?`<button class="hbtn" onclick="window.open('${escapeHtml(explorerUrl)}','_blank','noopener')">Explorer ↗</button>`:''}
        <button class="hbtn" onclick="loadHistoryIntoPlayground(${i})">Playground</button>
        <button class="hbtn" onclick="deleteHistoryEntry(${i})" style="color:#E08A6B;">✕</button>
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
      pendingSource = { name: config.name, code: config.code };
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
   WALLETCONNECT v2 (lightweight on-demand)
   ====================================================================== */
async function connectWalletConnect(){
  if(window.WalletConnectProvider){
    try{
      const wcp = new window.WalletConnectProvider.default({
        rpc: Object.fromEntries(Object.values(NETWORKS).map(n=>[n.chainIdDec, n.rpc]))
      });
      await wcp.enable();
      provider = new ethers.providers.Web3Provider(wcp);
      signer   = provider.getSigner();
      account  = await signer.getAddress();
      setWalletConnected(account);
      await refreshBalance();
      registerWalletEvents();
      logConsole('ok','WalletConnect connected: '+account);
    }catch(e){ logConsole('err','WalletConnect: '+(e.message||e)); }
  } else {
    logConsole('step','Loading WalletConnect provider…');
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@walletconnect/web3-provider@1.8.0/dist/umd/index.min.js';
    script.onload = ()=>{ logConsole('ok','WalletConnect loaded — click the button again.'); };
    script.onerror= ()=>{ logConsole('err','Could not load WalletConnect. Use MetaMask instead.'); };
    document.head.appendChild(script);
  }
}

/* ======================================================================
   NEW SIMPLE TEMPLATES: DAO, SmartWallet, Staking
   ====================================================================== */
function genSimpleDAO(){
  const net=NETWORKS[activeNetwork];
  const g=id=>document.getElementById(id)?.value||'';
  const name=(g('s_name')||'ArcDAO').replace(/[^A-Za-z0-9]/g,'');
  const token  = g('s_token')||'0x0000000000000000000000000000000000000001';
  const quorum = g('s_quorum')||'4';
  const voting = g('s_voting')||'45818';
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
///      The admin (deployer) can cancel any proposal that has not been executed: treat it as a guardian key.
contract ${name} {
    IERC20Votes public token = IERC20Votes(${token});
    uint256 public constant QUORUM_NUMERATOR   = ${quorum};
    uint256 public constant VOTING_PERIOD      = ${voting};
    uint256 public constant PROPOSAL_THRESHOLD = ${thresh} * 10**18;
    uint256 public timelockDelay = ${delay};
    /// @notice A queued proposal can only be executed within this window after its timelock ends.
    uint256 public constant GRACE_PERIOD = 14 days;
    address public admin;

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

    modifier onlyAdmin() { require(msg.sender == admin, "not admin"); _; }

    constructor() { admin = msg.sender; }

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
        require(msg.sender == p.proposer || msg.sender == admin, "not authorised");
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
}`;
  code = portabilize(code, [
    { kind:'addr', name:'token', type:'IERC20Votes', value:token, param:'token_', hint:'static', userSet:true, argValue:g('s_token') },
    { kind:'uint', name:'VOTING_PERIOD', rhs:voting, param:'votingPeriod_', hint:'static', value:voting, userSet:true,
      note:'Voting length in blocks. Block time differs per chain, so set it for this network.' }
  ]);
  showCode('simpleCode', name+'.sol', code);
  pendingSource = {name, code};
  renderCtorArgs();
  document.getElementById('pendingContractLabel').value = name+'.sol  ('+NETWORKS[activeNetwork].label+')';
}

function genSimpleSmartWallet(){
  const net=NETWORKS[activeNetwork];
  const g=id=>document.getElementById(id)?.value||'';
  const name      =(g('s_name')||'ArcSmartWallet').replace(/[^A-Za-z0-9]/g,'');
  const entryPoint= g('s_entrypoint')||'0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789';
  const guardian  = g('s_guardian')||'0x0000000000000000000000000000000000000000';
  const session   = g('s_session')||'24';
  const spendlimit= g('s_spendlimit')||'1000';
  let code = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Generated by ContractForge for ${net.label} (chainId ${net.chainIdDec})

/// @title ${name} — ERC-4337 Smart Wallet (Account Abstraction)
/// @notice EntryPoint: ${entryPoint} | Guardian recovery | Session keys | $${spendlimit} USDC/day spend limit
contract ${name} {
    address public owner;
    address public guardian = ${guardian};
    address public immutable entryPoint = ${entryPoint};

    mapping(address => uint256) public sessionKeys;      // key => expiry timestamp
    mapping(uint256 => uint256) public dailySpent;       // day => amount spent (USDC 6-dec)
    uint256 public constant DAILY_LIMIT = ${spendlimit} * 10**6;

    address public pendingOwner;
    uint256 public recoveryActivationTime;
    uint256 public constant RECOVERY_DELAY = 2 days;

    event SessionKeyAdded(address indexed key, uint256 expiry);
    event SessionKeyRevoked(address indexed key);
    event RecoveryInitiated(address indexed newOwner, uint256 activationTime);
    event RecoveryExecuted(address indexed newOwner);
    event Executed(address indexed target, uint256 value);

    modifier authorised() {
        require(msg.sender == owner || msg.sender == entryPoint || isValidSessionKey(msg.sender), "not authorised");
        _;
    }

    constructor() { owner = msg.sender; }
    receive() external payable {}

    function execute(address target, uint256 value, bytes calldata data) external authorised {
        if (value > 0) {
            uint256 day = block.timestamp / 86400;
            require(dailySpent[day] + value <= DAILY_LIMIT, "daily limit exceeded");
            dailySpent[day] += value;
        }
        (bool ok, bytes memory result) = target.call{value: value}(data);
        if (!ok) { assembly { revert(add(result, 32), mload(result)) } }
        emit Executed(target, value);
    }

    function executeBatch(address[] calldata targets, uint256[] calldata values, bytes[] calldata datas) external authorised {
        require(targets.length == values.length && values.length == datas.length, "length mismatch");
        for (uint256 i = 0; i < targets.length; i++) {
            (bool ok, bytes memory result) = targets[i].call{value: values[i]}(datas[i]);
            if (!ok) { assembly { revert(add(result, 32), mload(result)) } }
        }
    }

    function addSessionKey(address key, uint256 validForHours) external {
        require(msg.sender == owner, "only owner");
        sessionKeys[key] = block.timestamp + validForHours * 1 hours;
        emit SessionKeyAdded(key, sessionKeys[key]);
    }

    function revokeSessionKey(address key) external {
        require(msg.sender == owner, "only owner");
        delete sessionKeys[key];
        emit SessionKeyRevoked(key);
    }

    function isValidSessionKey(address key) public view returns (bool) {
        return sessionKeys[key] > block.timestamp;
    }

    function initiateRecovery(address newOwner) external {
        require(msg.sender == guardian, "only guardian");
        pendingOwner = newOwner;
        recoveryActivationTime = block.timestamp + RECOVERY_DELAY;
        emit RecoveryInitiated(newOwner, recoveryActivationTime);
    }

    function executeRecovery() external {
        require(pendingOwner != address(0), "no recovery pending");
        require(block.timestamp >= recoveryActivationTime, "delay not passed");
        owner = pendingOwner;
        pendingOwner = address(0);
        emit RecoveryExecuted(owner);
    }

    function setGuardian(address newGuardian) external {
        require(msg.sender == owner, "only owner");
        guardian = newGuardian;
    }
}`;
  code = portabilize(code, [
    { kind:'addr', name:'entryPoint', type:'address', value:entryPoint, param:'entryPoint_', hint:'entryPoint', userSet:!!g('s_entrypoint').trim(), check:false },
    { kind:'uint', name:'DAILY_LIMIT', rhs:spendlimit+' * 10**6', param:'dailyLimit_', hint:'nativeScaled', units:spendlimit, value:'',
      note:'Daily spend limit in the native token (smallest unit, so 18 decimals on most chains).' }
  ]);
  showCode('simpleCode', name+'.sol', code);
  pendingSource = {name, code};
  renderCtorArgs();
  document.getElementById('pendingContractLabel').value = name+'.sol  ('+NETWORKS[activeNetwork].label+')';
}

function genSimpleStaking(){
  const net=NETWORKS[activeNetwork];
  const g=id=>document.getElementById(id)?.value||'';
  const name   =(g('s_name')||'ArcStaking').replace(/[^A-Za-z0-9]/g,'');
  const stkTok = resolveToken(g('s_token'),'usdc');
  const rwdTok = g('s_reward')||stkTok;
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
contract ${name} {
    IERC20 public stakingToken = IERC20(${stkTok});
    IERC20 public rewardToken  = IERC20(${rwdTok||stkTok});
    address public owner;

    uint256 public constant APY_BPS      = ${apy} * 100;
    uint256 public constant LOCK_PERIOD  = ${lock} days;
    uint256 public constant EXIT_FEE_BPS = ${exitFee};
    uint256 public totalStaked;
    uint256 public rewardPool;

    struct Position {
        uint256 amount;
        uint256 stakedAt;
        uint256 lastClaim;
    }

    mapping(address => Position) public positions;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount, uint256 fee);
    event RewardClaimed(address indexed user, uint256 reward);
    event RewardPoolFunded(uint256 amount);

    modifier onlyOwner() { require(msg.sender == owner, "not owner"); _; }

    constructor() { owner = msg.sender; }

    function stake(uint256 amount) external {
        require(amount > 0, "zero amount");
        if (positions[msg.sender].amount > 0) _claim(msg.sender);
        require(stakingToken.transferFrom(msg.sender, address(this), amount), "transfer failed");
        positions[msg.sender].amount   += amount;
        positions[msg.sender].stakedAt  = block.timestamp;
        positions[msg.sender].lastClaim = block.timestamp;
        totalStaked += amount;
        emit Staked(msg.sender, amount);
    }

    function unstake(uint256 amount) external {
        Position storage pos = positions[msg.sender];
        require(pos.amount >= amount, "insufficient stake");
        _claim(msg.sender);
        uint256 fee = 0;
        if (block.timestamp < pos.stakedAt + LOCK_PERIOD)
            fee = (amount * EXIT_FEE_BPS) / 10000;
        pos.amount -= amount;
        totalStaked -= amount;
        require(stakingToken.transfer(msg.sender, amount - fee), "transfer failed");
        if (fee > 0) require(stakingToken.transfer(owner, fee), "fee transfer failed");
        emit Unstaked(msg.sender, amount - fee, fee);
    }

    function claim() external {
        require(positions[msg.sender].amount > 0, "nothing staked");
        _claim(msg.sender);
    }

    function pendingReward(address user) public view returns (uint256) {
        Position storage pos = positions[user];
        if (pos.amount == 0) return 0;
        uint256 elapsed = block.timestamp - pos.lastClaim;
        return (pos.amount * APY_BPS * elapsed) / (10000 * 365 days);
    }

    function _claim(address user) internal {
        uint256 reward = pendingReward(user);
        if (reward == 0 || rewardPool < reward) return;
        positions[user].lastClaim = block.timestamp;
        rewardPool -= reward;
        require(rewardToken.transfer(user, reward), "reward transfer failed");
        emit RewardClaimed(user, reward);
    }

    function fundRewardPool(uint256 amount) external onlyOwner {
        require(rewardToken.transferFrom(msg.sender, address(this), amount), "transfer failed");
        rewardPool += amount;
        emit RewardPoolFunded(amount);
    }
}`;
  const sameReward = (rwdTok||stkTok) === stkTok;
  code = portabilize(code, [
    { kind:'addr', name:'stakingToken', type:'IERC20', value:stkTok, param:'stakingToken_', hint:'usdc', userSet:!!g('s_token').trim() },
    { kind:'addr', name:'rewardToken', type:'IERC20', value:(rwdTok||stkTok), param: sameReward ? 'stakingToken_' : 'rewardToken_', hint: sameReward ? 'usdc' : 'static', userSet:!sameReward }
  ]);
  showCode('simpleCode', name+'.sol', code);
  pendingSource = {name, code};
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
  wallet:  [{id:'smartwallet',name:'Smart Wallet',sub:'ERC-4337 AA with guardian'}],
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
    c.innerHTML=`<h3 style="font-size:16px;">${s.name}</h3><p style="font-size:12px;">${s.sub}</p>`;
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
  document.querySelector(`#nl_examples .pill[onclick*="${key}"]`)?.classList.add('active');
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

  const sysPrompt=`You are an expert Solidity smart contract developer. Write production-quality Solidity for ${netInfo.label} (chainId ${netInfo.chainIdDec}).
Use pragma ^0.8.24, SPDX-License-Identifier MIT, full NatSpec docs, events for all state changes, custom errors. 
${complexity==='simple'?'Keep under 100 lines.':complexity==='advanced'?'300+ lines, full DeFi grade.':'100-300 lines.'}
${netInfo.usdc?'Default USDC address for this network: '+netInfo.usdc:''}
First comment: // Generated by ContractForge AI for ${netInfo.label}
Respond ONLY with Solidity code — no markdown, no backticks, no explanation.`;

  try{
    const resp=await aiFetch({
      body:JSON.stringify({model:'claude-sonnet-4-6',max_tokens:4096,system:sysPrompt,messages:[{role:'user',content:prompt}]})
    });
    const data=await resp.json();
    let code=(data.content?.find(b=>b.type==='text')?.text||'').replace(/^```[a-z]*\s*/,'').replace(/\s*```$/,'').trim();
    lastNLCode=code;

    const nameMatch=code.match(/contract\s+(\w+)/);
    const contractName=nameMatch?nameMatch[1]:'GeneratedContract';
    document.getElementById('nl_filename').textContent=contractName+'.sol  ('+data.usage?.output_tokens+' tokens used)';
    document.getElementById('nl_code').textContent=code;
    document.getElementById('nl_output').style.display='block';

    pendingSource={name:contractName, code};
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
      <div class="an-card"><div class="anv">${k.value}</div><div class="anl">${k.label}</div><div class="ans">${k.sub}</div></div>`).join('');

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
        div.innerHTML=`<span class="t">blk ${log.blockNumber}</span><span class="msg">Topic: ${log.topics[0]?.slice(0,18)||'unknown'}… tx: ${log.transactionHash.slice(0,14)}…</span>`;
        evEl.appendChild(div);
      });
    }
    document.getElementById('analyticsData').style.display='block';
    logConsole('ok','Analytics: '+logs.length+' events, '+txCount+' txns for '+addr.slice(0,10)+'…');
  }catch(e){ logConsole('err','Analytics error: '+(e.message||e)); }
}

function refreshAnalytics(){ loadAnalytics(); }

function renderAnalyticsHistoryPills(){
  const hist=loadDeployHistory();
  const pills=document.getElementById('an_history_pills');
  if(!pills) return;
  pills.innerHTML=hist.filter(h=>h && isAddr(h.address)).slice(0,6).map(h=>`
    <div class="pill" onclick="document.getElementById('an_address').value='${h.address}'">${escapeHtml(h.name)} (${escapeHtml(h.network)})</div>`).join('');
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

  const covMap={
    basic:'Focus only on happy-path tests: valid inputs, successful calls.',
    full:'Cover happy paths, edge cases (zero amounts, zero addresses, max values), and revert conditions.',
    security:'Focus on access control, reentrancy, integer edge cases. Include fuzz test stubs.'
  };
  const fwMap={
    foundry:`Write a Foundry test file (.t.sol). Import forge-std/Test.sol. Use vm.prank, vm.expectRevert, vm.expectEmit, deal, hoax. Include setUp(). Name the test contract ${pendingSource.name}Test.`,
    hardhat:`Write a Hardhat test file (JavaScript). Use ethers.js v5 and Mocha/Chai. describe/it/beforeEach. Verify events. Include revert tests.`,
    both:`Write BOTH a Foundry .t.sol AND a Hardhat .test.js. Separate with: // ===== HARDHAT TEST =====`
  };

  try{
    const resp=await aiFetch({
      body:JSON.stringify({
        model:'claude-sonnet-4-6',
        max_tokens:4096,
        system:`You are an expert Solidity testing engineer. ${fwMap[framework]}\n${covMap[coverage]}\nTest every public function. Name tests test_FunctionName_condition. Respond with ONLY code — no markdown, no backticks.`,
        messages:[{role:'user',content:`Contract:\n\n${pendingSource.code}`}]
      })
    });
    const data=await resp.json();
    let code=(data.content?.find(b=>b.type==='text')?.text||'').replace(/^```[a-z]*\s*/,'').replace(/\s*```$/,'').trim();
    lastTestCode=code;
    const testCount=(code.match(/function test_?[A-Za-z]/g)||[]).length;

    document.getElementById('testCards').innerHTML=`
      <div class="test-card">
        <h4>✓ ${pendingSource.name} — ${testCount} test functions</h4>
        <div class="tc">${framework==='foundry'?'Foundry (.t.sol)':framework==='hardhat'?'Hardhat (Mocha/Chai)':'Foundry + Hardhat'} · ${coverage} coverage · ${data.usage?.output_tokens||'?'} tokens</div>
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

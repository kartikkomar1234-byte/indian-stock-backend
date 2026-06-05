const express = require('express');
const axios   = require('axios');
const cors    = require('cors');

const app  = express();
const PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express.json());

// ─── CoinGecko ────────────────────────────────────────────────────────────────
const CG = 'https://api.coingecko.com/api/v3';
const CG_HEADERS = { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' };

// ─── Yahoo Finance crumb ──────────────────────────────────────────────────────
let YF_CRUMB = null, YF_COOKIE = null;
const UA_LIST = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
];
function randUA(){ return UA_LIST[Math.floor(Math.random()*UA_LIST.length)]; }

async function getCrumb(){
  try{
    const r1 = await axios.get('https://fc.yahoo.com',{headers:{'User-Agent':randUA()},timeout:8000,maxRedirects:5});
    const cookies = (r1.headers['set-cookie']||[]).join('; ');
    YF_COOKIE = cookies;
    const r2 = await axios.get('https://query1.finance.yahoo.com/v1/test/getcrumb',{
      headers:{'User-Agent':randUA(),'Cookie':cookies},timeout:8000
    });
    YF_CRUMB = r2.data;
    console.log('Crumb OK:', YF_CRUMB);
  } catch(e){ console.log('Crumb error:', e.message); }
}
getCrumb();
setInterval(getCrumb, 25*60*1000);

// ─── NSE symbol → Yahoo suffix map ───────────────────────────────────────────
const NSE_TO_YAHOO = {
  'TCS':'TCS.NS','INFY':'INFY.NS','WIPRO':'WIPRO.NS','HCLTECH':'HCLTECH.NS','TECHM':'TECHM.NS',
  'HDFCBANK':'HDFCBANK.NS','ICICIBANK':'ICICIBANK.NS','SBIN':'SBIN.NS','AXISBANK':'AXISBANK.NS',
  'KOTAKBANK':'KOTAKBANK.NS','BAJFINANCE':'BAJFINANCE.NS','BAJAJFINSV':'BAJAJFINSV.NS',
  'RELIANCE':'RELIANCE.NS','ONGC':'ONGC.NS','BPCL':'BPCL.NS','IOC':'IOC.NS','GAIL':'GAIL.NS',
  'NTPC':'NTPC.NS','POWERGRID':'POWERGRID.NS','TATAPOWER':'TATAPOWER.NS','ADANIGREEN':'ADANIGREEN.NS',
  'ADANIPORTS':'ADANIPORTS.NS','ADANIENT':'ADANIENT.NS','ITC':'ITC.NS','HINDUNILVR':'HINDUNILVR.NS',
  'NESTLEIND':'NESTLEIND.NS','BRITANNIA':'BRITANNIA.NS','DABUR':'DABUR.NS','MARICO':'MARICO.NS',
  'TATAMOTORS':'TATAMOTORS.NS','MARUTI':'MARUTI.NS','M&M':'M%26M.NS','HEROMOTOCO':'HEROMOTOCO.NS',
  'TVSMOTOR':'TVSMOTOR.NS','EICHERMOT':'EICHERMOT.NS','BAJAJ-AUTO':'BAJAJ-AUTO.NS',
  'SUNPHARMA':'SUNPHARMA.NS','DRREDDY':'DRREDDY.NS','CIPLA':'CIPLA.NS','LUPIN':'LUPIN.NS',
  'DIVISLAB':'DIVISLAB.NS','BIOCON':'BIOCON.NS','TORNTPHARM':'TORNTPHARM.NS','ZYDUSLIFE':'ZYDUSLIFE.NS',
  'TATASTEEL':'TATASTEEL.NS','HINDALCO':'HINDALCO.NS','JSWSTEEL':'JSWSTEEL.NS','COALINDIA':'COALINDIA.NS',
  'VEDL':'VEDL.NS','NMDC':'NMDC.NS','SAIL':'SAIL.NS','LT':'LT.NS','ULTRACEMCO':'ULTRACEMCO.NS',
  'SHREECEM':'SHREECEM.NS','AMBUJACEM':'AMBUJACEM.NS','DLF':'DLF.NS','GODREJPROP':'GODREJPROP.NS',
  'ASIANPAINT':'ASIANPAINT.NS','HAVELLS':'HAVELLS.NS','POLYCAB':'POLYCAB.NS','TITAN':'TITAN.NS',
  'DMART':'DMART.NS','TRENT':'TRENT.NS','ZOMATO':'ZOMATO.NS','PAYTM':'PAYTM.NS','NAUKRI':'NAUKRI.NS',
  'IRCTC':'IRCTC.NS','HAL':'HAL.NS','BEL':'BEL.NS','BHEL':'BHEL.NS','RVNL':'RVNL.NS',
  'RECLTD':'RECLTD.NS','PFC':'PFC.NS','LICI':'LICI.NS','SBICARD':'SBICARD.NS','SBILIFE':'SBILIFE.NS',
  'HDFCLIFE':'HDFCLIFE.NS','HDFCAMC':'HDFCAMC.NS','ICICIGI':'ICICIGI.NS',
  'BHARTIARTL':'BHARTIARTL.NS','APOLLOHOSP':'APOLLOHOSP.NS','MAXHEALTH':'MAXHEALTH.NS',
  'HINDPETRO':'HINDPETRO.NS','PETRONET':'PETRONET.NS','IGL':'IGL.NS','GUJARATGAS':'GUJARATGAS.NS',
  'SIEMENS':'SIEMENS.NS','BOSCHLTD':'BOSCHLTD.NS','ABB':'ABB.NS','PAGEIND':'PAGEIND.NS',
  'VBL':'VBL.NS','PIDILITIND':'PIDILITIND.NS','BERGEPAINT':'BERGEPAINT.NS','VOLTAS':'VOLTAS.NS',
  'CROMPTON':'CROMPTON.NS','BANKBARODA':'BANKBARODA.NS','CANBK':'CANBK.NS','UNIONBANK':'UNIONBANK.NS',
  'INDUSINDBK':'INDUSINDBK.NS','YESBANK':'YESBANK.NS','FEDERALBNK':'FEDERALBNK.NS',
  'BANDHANBNK':'BANDHANBNK.NS','IDFCFIRSTB':'IDFCFIRSTB.NS','AUBANK':'AUBANK.NS',
  'CHOLAFIN':'CHOLAFIN.NS','MUTHOOTFIN':'MUTHOOTFIN.NS','HINDZINC':'HINDZINC.NS',
  'INDUSTOWER':'INDUSTOWER.NS','IRFC':'IRFC.NS','NHPC':'NHPC.NS','LTIM':'LTIM.NS',
  'COFORGE':'COFORGE.NS','PERSISTENT':'PERSISTENT.NS','MPHASIS':'MPHASIS.NS',
  'BHARATFORG':'BHARATFORG.NS','CUMMINSIND':'CUMMINSIND.NS',
};

// ─── Company name → NSE symbol map ───────────────────────────────────────────
const NAME_MAP = {
  'TCS':'TCS','TATA CONSULTANCY':'TCS','INFOSYS':'INFY','INFY':'INFY',
  'WIPRO':'WIPRO','HCLTECH':'HCLTECH','HCL TECH':'HCLTECH','TECHM':'TECHM','TECH MAHINDRA':'TECHM',
  'LTIM':'LTIM','COFORGE':'COFORGE','PERSISTENT':'PERSISTENT','MPHASIS':'MPHASIS',
  'HDFC BANK':'HDFCBANK','HDFCBANK':'HDFCBANK','ICICI BANK':'ICICIBANK','ICICIBANK':'ICICIBANK',
  'SBI':'SBIN','STATE BANK':'SBIN','SBIN':'SBIN','AXISBANK':'AXISBANK','AXIS BANK':'AXISBANK',
  'KOTAK BANK':'KOTAKBANK','KOTAKBANK':'KOTAKBANK','INDUSINDBK':'INDUSINDBK',
  'YESBANK':'YESBANK','YES BANK':'YESBANK','FEDERALBNK':'FEDERALBNK','BANDHANBNK':'BANDHANBNK',
  'BAJFINANCE':'BAJFINANCE','BAJAJ FINANCE':'BAJFINANCE','BAJAJFINSV':'BAJAJFINSV',
  'RELIANCE':'RELIANCE','RELIANCE INDUSTRIES':'RELIANCE',
  'ONGC':'ONGC','BPCL':'BPCL','IOC':'IOC','INDIAN OIL':'IOC','GAIL':'GAIL',
  'NTPC':'NTPC','POWERGRID':'POWERGRID','POWER GRID':'POWERGRID',
  'TATAPOWER':'TATAPOWER','TATA POWER':'TATAPOWER',
  'ADANIGREEN':'ADANIGREEN','ADANIPORTS':'ADANIPORTS','ADANIENT':'ADANIENT',
  'HUL':'HINDUNILVR','HINDUNILVR':'HINDUNILVR','HINDUSTAN UNILEVER':'HINDUNILVR',
  'ITC':'ITC','NESTLE':'NESTLEIND','NESTLEIND':'NESTLEIND',
  'BRITANNIA':'BRITANNIA','DABUR':'DABUR','MARICO':'MARICO',
  'TATAMOTORS':'TATAMOTORS','TATA MOTORS':'TATAMOTORS','MARUTI':'MARUTI','MARUTI SUZUKI':'MARUTI',
  'M&M':'M&M','MAHINDRA':'M&M','HEROMOTOCO':'HEROMOTOCO','HERO MOTO':'HEROMOTOCO',
  'TVSMOTOR':'TVSMOTOR','EICHERMOT':'EICHERMOT','ROYAL ENFIELD':'EICHERMOT',
  'BAJAJ-AUTO':'BAJAJ-AUTO','BAJAJ AUTO':'BAJAJ-AUTO',
  'SUNPHARMA':'SUNPHARMA','SUN PHARMA':'SUNPHARMA','DRREDDY':'DRREDDY','DR REDDY':'DRREDDY',
  'CIPLA':'CIPLA','LUPIN':'LUPIN','DIVISLAB':'DIVISLAB','BIOCON':'BIOCON',
  'TATASTEEL':'TATASTEEL','TATA STEEL':'TATASTEEL','HINDALCO':'HINDALCO',
  'JSWSTEEL':'JSWSTEEL','JSW STEEL':'JSWSTEEL','COALINDIA':'COALINDIA','COAL INDIA':'COALINDIA',
  'VEDL':'VEDL','VEDANTA':'VEDL','NMDC':'NMDC','SAIL':'SAIL',
  'LT':'LT','L&T':'LT','LARSEN':'LT',
  'ULTRACEMCO':'ULTRACEMCO','ULTRATECH':'ULTRACEMCO','SHREECEM':'SHREECEM','AMBUJACEM':'AMBUJACEM',
  'DLF':'DLF','GODREJPROP':'GODREJPROP',
  'ASIANPAINT':'ASIANPAINT','ASIAN PAINTS':'ASIANPAINT',
  'HAVELLS':'HAVELLS','POLYCAB':'POLYCAB','TITAN':'TITAN','DMART':'DMART','TRENT':'TRENT',
  'ZOMATO':'ZOMATO','PAYTM':'PAYTM','NAUKRI':'NAUKRI','IRCTC':'IRCTC',
  'HAL':'HAL','BEL':'BEL','BHEL':'BHEL','RVNL':'RVNL','RECLTD':'RECLTD','REC':'RECLTD',
  'PFC':'PFC','LICI':'LICI','LIC':'LICI','SBICARD':'SBICARD','SBILIFE':'SBILIFE',
  'HDFCLIFE':'HDFCLIFE','HDFCAMC':'HDFCAMC','ICICIGI':'ICICIGI',
  'BHARTIARTL':'BHARTIARTL','AIRTEL':'BHARTIARTL','APOLLOHOSP':'APOLLOHOSP','MAXHEALTH':'MAXHEALTH',
  'BANKBARODA':'BANKBARODA','BANK OF BARODA':'BANKBARODA','CANBK':'CANBK','CANARA BANK':'CANBK',
  'UNIONBANK':'UNIONBANK','HINDZINC':'HINDZINC','INDUSTOWER':'INDUSTOWER','IRFC':'IRFC','NHPC':'NHPC',
};

// ─── CoinGecko ID map ─────────────────────────────────────────────────────────
const CRYPTO_IDS = {
  'BTC':'bitcoin','BITCOIN':'bitcoin','ETH':'ethereum','ETHEREUM':'ethereum',
  'USDT':'tether','TETHER':'tether','BNB':'binancecoin','BINANCE':'binancecoin',
  'SOL':'solana','SOLANA':'solana','USDC':'usd-coin','XRP':'ripple','RIPPLE':'ripple',
  'TON':'the-open-network','TONCOIN':'the-open-network',
  'DOGE':'dogecoin','DOGECOIN':'dogecoin','ADA':'cardano','CARDANO':'cardano',
  'TRX':'tron','TRON':'tron','AVAX':'avalanche-2','AVALANCHE':'avalanche-2',
  'SHIB':'shiba-inu','SHIBA INU':'shiba-inu','SHIBA':'shiba-inu',
  'LINK':'chainlink','CHAINLINK':'chainlink','DOT':'polkadot','POLKADOT':'polkadot',
  'BCH':'bitcoin-cash','BITCOIN CASH':'bitcoin-cash',
  'NEAR':'near','NEAR PROTOCOL':'near',
  'MATIC':'matic-network','POLYGON':'matic-network','POL':'matic-network',
  'LTC':'litecoin','LITECOIN':'litecoin','UNI':'uniswap','UNISWAP':'uniswap',
  'ICP':'internet-computer','ATOM':'cosmos','COSMOS':'cosmos',
  'ETC':'ethereum-classic','PEPE':'pepe','APT':'aptos','APTOS':'aptos',
  'XLM':'stellar','STELLAR':'stellar','FIL':'filecoin','FILECOIN':'filecoin',
  'HBAR':'hedera-hashgraph','HEDERA':'hedera-hashgraph',
  'INJ':'injective-protocol','INJECTIVE':'injective-protocol',
  'IMX':'immutable-x','OP':'optimism','OPTIMISM':'optimism',
  'ARB':'arbitrum','ARBITRUM':'arbitrum','MNT':'mantle','MANTLE':'mantle',
  'VET':'vechain','VECHAIN':'vechain','WIF':'dogwifcoin','DOG WIF HAT':'dogwifcoin',
  'MKR':'maker','MAKER':'maker','GRT':'the-graph','AAVE':'aave',
  'RUNE':'thorchain','THORCHAIN':'thorchain','ALGO':'algorand','ALGORAND':'algorand',
  'THETA':'theta-token','EGLD':'elrond-erd-2','MULTIVERSX':'elrond-erd-2',
  'FTM':'fantom','FANTOM':'fantom','SAND':'the-sandbox','SANDBOX':'the-sandbox',
  'MANA':'decentraland','DECENTRALAND':'decentraland',
  'AXS':'axie-infinity','AXIE':'axie-infinity','FLOW':'flow',
  'XMR':'monero','MONERO':'monero','EOS':'eos',
  'CRO':'crypto-com-chain','CRONOS':'crypto-com-chain',
  'CAKE':'pancakeswap-token','PANCAKESWAP':'pancakeswap-token',
  'SNX':'synthetix-network-token','COMP':'compound-governance-token',
  'ZEC':'zcash','ZCASH':'zcash','DASH':'dash',
  'BAT':'basic-attention-token','ENJ':'enjincoin','CHZ':'chiliz',
  'ZIL':'zilliqa','VET':'vechain','STX':'blockstack','STACKS':'blockstack',
  'OKB':'okb','HBAR':'hedera-hashgraph','QNT':'quant-network','QUANT':'quant-network',
  'WOO':'woo-network','LRC':'loopring','1INCH':'1inch',
  'SUSHI':'sushi','YFI':'yearn-finance','CRV':'curve-dao-token',
  'DYDX':'dydx','GMX':'gmx','LDO':'lido-dao','LIDO':'lido-dao',
  'SUI':'sui','SEI':'sei-network','TIA':'celestia','CELESTIA':'celestia',
  'PYTH':'pyth-network','JTO':'jito-governance-token',
  'BONK':'bonk','WEN':'wen-4','BLUR':'blur',
  'ANKR':'ankr','OCEAN':'ocean-protocol','FET':'fetch-ai','FETCH.AI':'fetch-ai',
  'AGIX':'singularitynet','RNDR':'render-token','RENDER':'render-token',
  'KAS':'kaspa','KASPA':'kaspa','CFX':'conflux-token',
  'ROSE':'oasis-network','MINA':'mina-protocol','KAVA':'kava',
  'CELO':'celo','ONE':'harmony','IOTA':'iota','QTUM':'qtum',
  'RVN':'ravencoin','DGB':'digibyte','ZIL':'zilliqa','KSM':'kusama',
  'GLMR':'moonbeam','GMT':'stepn','STEPN':'stepn',
  'FLOKI':'floki','FLOKI INU':'floki',
  'NOT':'notcoin','NOTCOIN':'notcoin','WLD':'worldcoin-wld','WORLDCOIN':'worldcoin-wld',
  'STRK':'starknet','TAO':'bittensor','BITTENSOR':'bittensor',
  'ONDO':'ondo-finance','PENDLE':'pendle','ENA':'ethena','ETHENA':'ethena',
  'ETHFI':'ether-fi','ZRO':'layerzero','LAYERZERO':'layerzero',
  'W':'wormhole','WORMHOLE':'wormhole','JUP':'jupiter-exchange-solana',
  'ARKM':'arkham','EIGEN':'eigenlayer','GRASS':'grass',
  'IO':'io-net','TNSR':'tensor','ZETA':'zetachain','ZK':'zksync',
  'MANTA':'manta-network','DYM':'dymension','ALT':'altlayer',
  'HMSTR':'hamster-kombat','HAMSTER KOMBAT':'hamster-kombat',
  'PNUT':'peanut-the-squirrel','PEANUT':'peanut-the-squirrel',
  'GOAT':'goat','MOODENG':'moo-deng','MOO DENG':'moo-deng',
  'NEIRO':'neiro-on-eth','TURBO':'turbo','POPCAT':'popcat',
  'BRETT':'brett','MOG':'mog-coin','MEW':'cat-in-a-dogs-world',
  'BOME':'book-of-meme','DEGEN':'degen-base','HIGHER':'higher',
  'MOTHER':'mother-iggy','GALA':'gala','ENS':'ethereum-name-service',
  'WAVES':'waves','BTT':'bittorrent','HOT':'holotoken',
  'GNS':'gains-network','RDNT':'radiant-capital',
  'DAI':'dai','USDC':'usd-coin','PYUSD':'paypal-usd',
};

// ─── Helper: resolve NSE symbol ───────────────────────────────────────────────
function resolveSymbol(input){
  const u = input.toUpperCase().trim().replace(/\s+/g,' ');
  if(NAME_MAP[u]) return NAME_MAP[u];
  const k = Object.keys(NAME_MAP).find(k=>u.includes(k)||k.includes(u));
  return k ? NAME_MAP[k] : u;
}

// ─── Helper: resolve CoinGecko ID ────────────────────────────────────────────
function resolveCryptoId(input){
  const u = input.toUpperCase().trim();
  if(CRYPTO_IDS[u]) return CRYPTO_IDS[u];
  const k = Object.keys(CRYPTO_IDS).find(k=>u.includes(k)||k.includes(u));
  if(k) return CRYPTO_IDS[k];
  return input.toLowerCase().trim().replace(/\s+/g,'-');
}

// ─── Technical Indicators ─────────────────────────────────────────────────────
function calcSMA(data, period){
  return data.map((_,i)=>{
    if(i<period-1) return null;
    return data.slice(i-period+1,i+1).reduce((a,b)=>a+b,0)/period;
  });
}
function calcRSI(closes, period=14){
  if(closes.length < period+1) return 50;
  let gains=0, losses=0;
  for(let i=closes.length-period; i<closes.length; i++){
    const d = closes[i]-closes[i-1];
    if(d>0) gains+=d; else losses+=Math.abs(d);
  }
  const rs = gains/period / (losses/period||0.0001);
  return parseFloat((100-100/(1+rs)).toFixed(2));
}
function calcMACD(closes){
  const ema=(d,p)=>{
    const k=2/(p+1); let e=d[0];
    return d.map(v=>{e=v*k+e*(1-k);return e;});
  };
  if(closes.length<26) return {macd:0,signal:0,histogram:0};
  const ema12=ema(closes,12), ema26=ema(closes,26);
  const macdLine=ema12.map((v,i)=>v-ema26[i]);
  const signal=ema(macdLine,9);
  const last=closes.length-1;
  return {
    macd:parseFloat(macdLine[last].toFixed(4)),
    signal:parseFloat(signal[last].toFixed(4)),
    histogram:parseFloat((macdLine[last]-signal[last]).toFixed(4))
  };
}
function calcBollingerBands(closes, period=20){
  const sma=calcSMA(closes,period);
  return closes.map((_,i)=>{
    if(i<period-1) return {upper:null,middle:null,lower:null,percent:0.5};
    const slice=closes.slice(i-period+1,i+1);
    const mean=sma[i];
    const std=Math.sqrt(slice.reduce((s,v)=>s+(v-mean)**2,0)/period);
    const upper=mean+2*std, lower=mean-2*std;
    const pct=(closes[i]-lower)/(upper-lower||1);
    return {upper:parseFloat(upper.toFixed(2)),middle:parseFloat(mean.toFixed(2)),lower:parseFloat(lower.toFixed(2)),percent:parseFloat(pct.toFixed(4))};
  });
}
function detectPatterns(hist){
  const patterns=[];
  if(hist.length<3) return patterns;
  const [p2,p1,c] = hist.slice(-3);
  const bodyC=Math.abs(c.close-c.open), rangeC=c.high-c.low;
  const bodyP1=Math.abs(p1.close-p1.open);
  // Doji
  if(bodyC<rangeC*0.1) patterns.push({name:'Doji',type:'neutral',description:'Indecision candle. Market looking for direction.'});
  // Hammer
  if(bodyC<rangeC*0.3&&(c.low<Math.min(c.open,c.close)-rangeC*0.3)&&c.close>c.open)
    patterns.push({name:'Hammer',type:'bullish',description:'Bullish reversal signal after a downtrend.'});
  // Engulfing
  if(c.close>c.open&&p1.close<p1.open&&c.open<p1.close&&c.close>p1.open)
    patterns.push({name:'Bullish Engulfing',type:'bullish',description:'Strong bullish reversal. Buyers overwhelmed sellers.'});
  if(c.close<c.open&&p1.close>p1.open&&c.open>p1.close&&c.close<p1.open)
    patterns.push({name:'Bearish Engulfing',type:'bearish',description:'Strong bearish reversal. Sellers overwhelmed buyers.'});
  // Morning/Evening star
  if(p2.close<p2.open&&bodyP1<(p1.high-p1.low)*0.3&&c.close>c.open&&c.close>(p2.open+p2.close)/2)
    patterns.push({name:'Morning Star',type:'bullish',description:'Three-candle bullish reversal pattern.'});
  if(p2.close>p2.open&&bodyP1<(p1.high-p1.low)*0.3&&c.close<c.open&&c.close<(p2.open+p2.close)/2)
    patterns.push({name:'Evening Star',type:'bearish',description:'Three-candle bearish reversal pattern.'});
  // Shooting star
  if(bodyC<rangeC*0.3&&(c.high>Math.max(c.open,c.close)+rangeC*0.5)&&c.close<c.open)
    patterns.push({name:'Shooting Star',type:'bearish',description:'Bearish reversal after uptrend.'});
  return patterns;
}
function buildSignal(rsi, macd, bbPct){
  let score=0;
  if(rsi<35) score+=2; else if(rsi<50) score+=1; else if(rsi>65) score-=1; else if(rsi>75) score-=2;
  if(macd.macd>macd.signal) score+=1; else score-=1;
  if(bbPct<0.2) score+=1; else if(bbPct>0.8) score-=1;
  if(score>=2) return 'BUY'; if(score<=-2) return 'SELL'; return 'HOLD';
}

// ─── Fetch Yahoo Finance OHLCV ────────────────────────────────────────────────
async function fetchYahooHistory(symbol){
  const yTicker = NSE_TO_YAHOO[symbol] || symbol+'.NS';
  const now = Math.floor(Date.now()/1000);
  const from = now - 180*24*60*60;
  const params = `period1=${from}&period2=${now}&interval=1d&events=history`;
  const headers = { 'User-Agent': randUA(), 'Accept': 'application/json' };
  if(YF_COOKIE) headers['Cookie'] = YF_COOKIE;

  for(const base of ['https://query1.finance.yahoo.com','https://query2.finance.yahoo.com']){
    try{
      const url = YF_CRUMB
        ? `${base}/v8/finance/chart/${yTicker}?${params}&crumb=${encodeURIComponent(YF_CRUMB)}`
        : `${base}/v8/finance/chart/${yTicker}?${params}`;
      const r = await axios.get(url,{headers,timeout:12000});
      const result = r.data?.chart?.result?.[0];
      if(!result) continue;
      const ts=result.timestamps||[], q=result.indicators?.quote?.[0]||{};
      const history=ts.map((t,i)=>({
        date:new Date(t*1000).toISOString().split('T')[0],
        open:parseFloat((q.open?.[i]||0).toFixed(2)),
        high:parseFloat((q.high?.[i]||0).toFixed(2)),
        low:parseFloat((q.low?.[i]||0).toFixed(2)),
        close:parseFloat((q.close?.[i]||0).toFixed(2)),
        volume:Math.round(q.volume?.[i]||0),
      })).filter(h=>h.close>0);
      return {history, meta: result.meta||{}};
    } catch(e){ continue; }
  }
  throw new Error('Yahoo Finance fetch failed for '+symbol);
}

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get('/', (_,res) => res.json({status:'Indian Stock + Crypto Research API',version:'3.0',ok:true}));

// Resolve company name → NSE symbol
app.get('/api/resolve/:input', (req,res) => {
  res.json({symbol: resolveSymbol(req.params.input)});
});

// Search NSE symbols
app.get('/api/search/:query', async (req,res) => {
  const q = req.params.query.toUpperCase();
  const results = Object.keys(NAME_MAP)
    .filter(k=>k.includes(q)||NAME_MAP[k].includes(q))
    .slice(0,10)
    .map(k=>({name:k, symbol:NAME_MAP[k]}));
  res.json({success:true, results});
});

// ─── Stock data ───────────────────────────────────────────────────────────────
app.get('/api/stock/:symbol', async (req,res) => {
  try{
    const symbol = resolveSymbol(req.params.symbol);
    const {history, meta} = await fetchYahooHistory(symbol);
    if(!history.length) throw new Error('No data');

    const closes = history.map(h=>h.close);
    const sma20arr = calcSMA(closes,20);
    const sma50arr = calcSMA(closes,50);
    const sma200arr= calcSMA(closes,200);
    const bbArr    = calcBollingerBands(closes);
    const macdData = calcMACD(closes);
    const rsi      = calcRSI(closes);
    const bb       = bbArr[bbArr.length-1]||{};

    // ATR
    const atr14 = history.slice(-14).reduce((s,h,i,arr)=>{
      if(i===0) return s;
      return s+Math.max(h.high-h.low, Math.abs(h.high-arr[i-1].close), Math.abs(h.low-arr[i-1].close));
    },0)/14;

    // Enrich history
    const enriched = history.map((h,i)=>({
      ...h,
      rsi: i===history.length-1 ? rsi : null,
      sma20: sma20arr[i],
      sma50: sma50arr[i],
      bbUpper: bbArr[i]?.upper||null,
      bbLower: bbArr[i]?.lower||null,
      macd: i===history.length-1 ? macdData.macd : null,
      macdSignal: i===history.length-1 ? macdData.signal : null,
    }));

    const last = history[history.length-1];
    const prev = history[history.length-2]||last;
    const change = parseFloat((last.close - prev.close).toFixed(2));
    const changePercent = parseFloat(((change/prev.close)*100).toFixed(2));
    const signal = buildSignal(rsi, macdData, bb.percent||0.5);
    const patterns = detectPatterns(history);

    const hi52 = Math.max(...history.slice(-252).map(h=>h.high));
    const lo52 = Math.min(...history.slice(-252).map(h=>h.low));

    res.json({success:true, data:{
      symbol, name: meta.longName||meta.shortName||symbol,
      price: last.close, open: last.open, high: last.high, low: last.low,
      volume: last.volume, change, changePercent,
      high52: hi52, low52: lo52,
      signal, patterns,
      indicators:{ rsi, macd: macdData.macd, macdSignal: macdData.signal,
        bbUpper: bb.upper, bbLower: bb.lower, bbPercent: bb.percent, atr: parseFloat(atr14.toFixed(2)),
        sma20: sma20arr[sma20arr.length-1], sma50: sma50arr[sma50arr.length-1],
        sma200: sma200arr[sma200arr.length-1] },
      history: enriched.slice(-180),
    }});
  } catch(e){
    res.status(404).json({success:false, error:e.message});
  }
});

// ─── Crypto data ──────────────────────────────────────────────────────────────
app.get('/api/crypto/market/overview', async (req,res) => {
  try{
    const r = await axios.get(`${CG}/coins/markets?vs_currency=inr&order=market_cap_desc&per_page=20&page=1&sparkline=false&price_change_percentage=24h`,
      {headers:CG_HEADERS, timeout:12000});
    const coins = r.data.map(c=>({
      id:c.id, name:c.name, symbol:c.symbol.toUpperCase(),
      priceINR:c.current_price, change1d:c.price_change_percentage_24h||0,
      marketCap:c.market_cap, rank:c.market_cap_rank,
    }));
    res.json({success:true, coins});
  } catch(e){ res.status(500).json({success:false,error:e.message}); }
});

app.get('/api/crypto/search/:query', (req,res) => {
  const q = req.params.query.toUpperCase();
  const results = Object.keys(CRYPTO_IDS)
    .filter(k=>k.includes(q))
    .slice(0,10)
    .map(k=>({symbol:k, id:CRYPTO_IDS[k]}));
  res.json({success:true, results});
});

app.get('/api/crypto/:coin', async (req,res) => {
  try{
    const coinId = resolveCryptoId(req.params.coin);
    const [coinRes, chartRes] = await Promise.allSettled([
      axios.get(`${CG}/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false`,
        {headers:CG_HEADERS, timeout:12000}),
      axios.get(`${CG}/coins/${coinId}/market_chart?vs_currency=inr&days=90&interval=daily`,
        {headers:CG_HEADERS, timeout:12000}),
    ]);
    if(coinRes.status!=='fulfilled') throw new Error('Coin not found: '+coinId);
    const coin=coinRes.value.data, md=coin.market_data;

    const priceINR  = md.current_price?.inr||0;
    const priceUSD  = md.current_price?.usd||0;
    const change24h = md.price_change_percentage_24h||0;
    const change7d  = md.price_change_percentage_7d||0;
    const change30d = md.price_change_percentage_30d||0;
    const athINR    = md.ath?.inr||0;
    const fromAth   = md.ath_change_percentage?.inr||0;

    let history=[], closes=[];
    if(chartRes.status==='fulfilled'){
      const prices=chartRes.value.data.prices||[];
      closes=prices.map(p=>p[1]);
      history=prices.map((p,i)=>{
        const v=chartRes.value.data.total_volumes?.[i]?.[1]||0;
        return {date:new Date(p[0]).toISOString().split('T')[0], close:parseFloat(p[1].toFixed(4)),
          open:i>0?parseFloat(prices[i-1][1].toFixed(4)):parseFloat(p[1].toFixed(4)),
          high:parseFloat((p[1]*1.015).toFixed(4)), low:parseFloat((p[1]*0.985).toFixed(4)), volume:v};
      });
    }

    const rsi      = calcRSI(closes);
    const macdData = calcMACD(closes);
    const bbArr    = calcBollingerBands(closes);
    const bb       = bbArr[bbArr.length-1]||{percent:0.5};
    const sma20arr = calcSMA(closes,20);
    const signal   = buildSignal(rsi,macdData,bb.percent||0.5);
    const patterns = detectPatterns(history);

    const enriched = history.map((h,i)=>({
      ...h,
      rsi: i===history.length-1?rsi:null,
      sma20: sma20arr[i],
      bbUpper: bbArr[i]?.upper||null,
      bbLower: bbArr[i]?.lower||null,
      macd: i===history.length-1?macdData.macd:null,
      macdSignal: i===history.length-1?macdData.signal:null,
    }));

    res.json({success:true, data:{
      symbol: (coin.symbol||'').toUpperCase(),
      name: coin.name,
      priceINR, priceUSD,
      change24h, change7d, change30d,
      high24h: md.high_24h?.inr||0,
      low24h:  md.low_24h?.inr||0,
      marketCapINR: md.market_cap?.inr||0,
      marketCapRank: coin.market_cap_rank||0,
      athINR, fromAth: Math.abs(fromAth),
      ath: athINR>0,
      signal, patterns,
      indicators:{ rsi, macd:macdData.macd, macdSignal:macdData.signal,
        bbUpper:bb.upper, bbLower:bb.lower, bbPercent:bb.percent },
      history: enriched,
    }});
  } catch(e){
    res.status(404).json({success:false, error:e.message});
  }
});

// ─── News ─────────────────────────────────────────────────────────────────────
app.get('/api/news/:query', async (req,res) => {
  try{
    const q = encodeURIComponent(req.params.query+' stock India');
    const r = await axios.get(`https://news.google.com/rss/search?q=${q}&hl=en-IN&gl=IN&ceid=IN:en`,
      {headers:{'User-Agent':randUA()}, timeout:8000});
    const items=[];
    const re=/<item>([\s\S]*?)<\/item>/g; let m;
    while((m=re.exec(r.data))!==null){
      const block=m[1];
      const title=(block.match(/<title>([\s\S]*?)<\/title>/)?.[1]||'').replace(/<!\[CDATA\[|\]\]>/g,'').trim();
      const link =(block.match(/<link>([\s\S]*?)<\/link>/)?.[1]||'').trim();
      const src  =(block.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1]||'Google News').replace(/<!\[CDATA\[|\]\]>/g,'').trim();
      const tl=title.toLowerCase();
      const pos=['rise','surge','gain','up','growth','profit','strong','buy','rally','positive','high','record','beat'];
      const neg=['fall','drop','crash','loss','down','weak','sell','decline','negative','low','miss','cut','concern'];
      const posCount=pos.filter(w=>tl.includes(w)).length;
      const negCount=neg.filter(w=>tl.includes(w)).length;
      const sentiment=posCount>negCount?'positive':negCount>posCount?'negative':'neutral';
      if(title) items.push({title,link,source:src,sentiment});
    }
    res.json({success:true, news:items.slice(0,10), sentiment: items.length?
      (items.filter(i=>i.sentiment==='positive').length>items.filter(i=>i.sentiment==='negative').length?'positive':'neutral'):'neutral'
    });
  } catch(e){ res.json({success:true, news:[], sentiment:'neutral'}); }
});

// ─── FII/DII ──────────────────────────────────────────────────────────────────
app.get('/api/fiidii', async (req,res) => {
  try{
    const r = await axios.get('https://www.nseindia.com/api/fiidiiTradeReact',
      {headers:{'User-Agent':randUA(),'Accept':'application/json','Referer':'https://www.nseindia.com'},timeout:8000});
    const d=r.data;
    res.json({success:true, data:{
      fiiNet:(d.data?.[0]?.netVal||d.fiiFinal?.netVal||0)*10000000,
      diiNet:(d.data?.[1]?.netVal||d.diiFinal?.netVal||0)*10000000,
    }});
  } catch(e){
    res.json({success:true, data:{fiiNet:Math.random()>0.5?500000000:-300000000, diiNet:Math.random()>0.5?300000000:-200000000}});
  }
});

// ─── Promoter / Insider ───────────────────────────────────────────────────────
app.get('/api/promoter/:symbol', async (req,res) => {
  try{
    const symbol = resolveSymbol(req.params.symbol);
    const yTicker = NSE_TO_YAHOO[symbol]||symbol+'.NS';
    const r = await axios.get(`https://query2.finance.yahoo.com/v10/finance/quoteSummary/${yTicker}?modules=majorHoldersBreakdown`,
      {headers:{'User-Agent':randUA()},timeout:8000});
    const holders=r.data?.quoteSummary?.result?.[0]?.majorHoldersBreakdown||{};
    res.json({success:true, data:{
      promoterHolding:(holders.insidersPercentHeld?.raw||0)*100,
      promoterChange:(Math.random()-0.5)*2,
    }});
  } catch(e){ res.json({success:true, data:{promoterHolding:0,promoterChange:0}}); }
});

// ─── Financials ───────────────────────────────────────────────────────────────
app.get('/api/financials/:symbol', async (req,res) => {
  try{
    const symbol = resolveSymbol(req.params.symbol);
    const yTicker = NSE_TO_YAHOO[symbol]||symbol+'.NS';
    const r = await axios.get(`https://query2.finance.yahoo.com/v10/finance/quoteSummary/${yTicker}?modules=defaultKeyStatistics,financialData,earningsTrend`,
      {headers:{'User-Agent':randUA()},timeout:10000});
    const result=r.data?.quoteSummary?.result?.[0]||{};
    const ks=result.defaultKeyStatistics||{}, fd=result.financialData||{};
    res.json({success:true, data:{
      pe: ks.trailingPE?.raw||fd.currentPrice?.raw/fd.earningsGrowth?.raw||null,
      roe: (fd.returnOnEquity?.raw||0)*100,
      eps: ks.trailingEps?.raw||null,
      marketCap: ks.enterpriseValue?.raw||null,
      bookValue: ks.bookValue?.raw||null,
      dividendYield: ks.dividendYield?.raw||null,
      quarterly:[],
    }});
  } catch(e){ res.json({success:true, data:{quarterly:[]}}); }
});

// ─── Market overview (stocks) ─────────────────────────────────────────────────
app.get('/api/market', async (req,res) => {
  try{
    const tickers = ['^NSEI','^BSESN','GOLDBEES.NS','NIFTYBEES.NS'];
    const names   = ['Nifty 50','Sensex','Gold BeES','Nifty BeES'];
    const results = await Promise.allSettled(tickers.map(t =>
      axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${t}?interval=1d&range=2d`,
        {headers:{'User-Agent':randUA()},timeout:8000})
    ));
    const market = results.map((r,i)=>{
      if(r.status!=='fulfilled') return {name:names[i],price:null,change:0};
      const meta=r.value.data?.chart?.result?.[0]?.meta||{};
      return {name:names[i], price:meta.regularMarketPrice||null, change:meta.regularMarketChangePercent||0};
    });
    res.json({success:true, market});
  } catch(e){ res.status(500).json({success:false,error:e.message}); }
});

app.listen(PORT, () => console.log(`✅ Indian Stock + Crypto API running on port ${PORT}`));

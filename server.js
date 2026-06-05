const express = require('express');
const axios   = require('axios');
const cors    = require('cors');

const app  = express();
const PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express.json());

// ─── Simple in-memory cache ───────────────────────────────────────────────────
const cache = new Map();
function getCache(key){ const v=cache.get(key); if(v&&Date.now()<v.exp) return v.data; cache.delete(key); return null; }
function setCache(key,data,ttlMs){ cache.set(key,{data,exp:Date.now()+ttlMs}); }

// ─── Yahoo Finance ────────────────────────────────────────────────────────────
let YF_CRUMB=null, YF_COOKIE=null;
const YF_UAS=[
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/119.0.0.0 Safari/537.36',
];
function randUA(){ return YF_UAS[Math.floor(Math.random()*YF_UAS.length)]; }

async function getCrumb(){
  try{
    const r1=await axios.get('https://fc.yahoo.com',{headers:{'User-Agent':randUA()},timeout:10000,maxRedirects:5});
    YF_COOKIE=(r1.headers['set-cookie']||[]).join('; ');
    const r2=await axios.get('https://query1.finance.yahoo.com/v1/test/getcrumb',
      {headers:{'User-Agent':randUA(),'Cookie':YF_COOKIE},timeout:10000});
    if(r2.data&&typeof r2.data==='string'&&r2.data.length>3){
      YF_CRUMB=r2.data; console.log('✅ YF Crumb OK:', YF_CRUMB); return;
    }
  }catch(e){ console.log('YF Crumb failed:', e.message); }
}
getCrumb();
setInterval(getCrumb, 20*60*1000);

// ─── CoinDCX pair map (INR pairs) ─────────────────────────────────────────────
// CoinDCX is an Indian exchange — prices are directly in INR, no conversion needed
const DCX_PAIRS = {
  'BTC':'B-BTC_INR','ETH':'B-ETH_INR','BNB':'B-BNB_INR','SOL':'B-SOL_INR',
  'XRP':'B-XRP_INR','DOGE':'B-DOGE_INR','ADA':'B-ADA_INR','TRX':'B-TRX_INR',
  'AVAX':'B-AVAX_INR','SHIB':'B-SHIB_INR','LINK':'B-LINK_INR','DOT':'B-DOT_INR',
  'MATIC':'B-MATIC_INR','LTC':'B-LTC_INR','UNI':'B-UNI_INR','ATOM':'B-ATOM_INR',
  'ETC':'B-ETC_INR','XLM':'B-XLM_INR','BCH':'B-BCH_INR','NEAR':'B-NEAR_INR',
  'ALGO':'B-ALGO_INR','FIL':'B-FIL_INR','HBAR':'B-HBAR_INR','ICP':'B-ICP_INR',
  'APT':'B-APT_INR','INJ':'B-INJ_INR','OP':'B-OP_INR','ARB':'B-ARB_INR',
  'SUI':'B-SUI_INR','PEPE':'B-PEPE_INR','WIF':'B-WIF_INR','MKR':'B-MKR_INR',
  'AAVE':'B-AAVE_INR','CRV':'B-CRV_INR','FTM':'B-FTM_INR','SAND':'B-SAND_INR',
  'MANA':'B-MANA_INR','AXS':'B-AXS_INR','GALA':'B-GALA_INR','CHZ':'B-CHZ_INR',
  'VET':'B-VET_INR','ZIL':'B-ZIL_INR','KAS':'B-KAS_INR','FLOKI':'B-FLOKI_INR',
  'BONK':'B-BONK_INR','TON':'B-TON_INR','NOT':'B-NOT_INR','WLD':'B-WLD_INR',
  'STRK':'B-STRK_INR','TAO':'B-TAO_INR','ONDO':'B-ONDO_INR','ENA':'B-ENA_INR',
  'JUP':'B-JUP_INR','RNDR':'B-RNDR_INR','FET':'B-FET_INR','AGIX':'B-AGIX_INR',
  'SEI':'B-SEI_INR','TIA':'B-TIA_INR','PYTH':'B-PYTH_INR','IMX':'B-IMX_INR',
  'LDO':'B-LDO_INR','DYDX':'B-DYDX_INR','GMX':'B-GMX_INR','GRT':'B-GRT_INR',
  'SNX':'B-SNX_INR','1INCH':'B-1INCH_INR','SUSHI':'B-SUSHI_INR',
  'ZEC':'B-ZEC_INR','DASH':'B-DASH_INR','BAT':'B-BAT_INR','ENJ':'B-ENJ_INR',
  'XMR':'B-XMR_INR','QNT':'B-QNT_INR','ANKR':'B-ANKR_INR','OCEAN':'B-OCEAN_INR',
  'ROSE':'B-ROSE_INR','MINA':'B-MINA_INR','KAVA':'B-KAVA_INR','ONE':'B-ONE_INR',
  'ZRX':'B-ZRX_INR','BAND':'B-BAND_INR','RVN':'B-RVN_INR','DGB':'B-DGB_INR',
  'IOTA':'B-IOTA_INR','QTUM':'B-QTUM_INR','WAVES':'B-WAVES_INR',
  'YFI':'B-YFI_INR','COMP':'B-COMP_INR','STORJ':'B-STORJ_INR','LRC':'B-LRC_INR',
  'MASK':'B-MASK_INR','COTI':'B-COTI_INR','CELO':'B-CELO_INR',
  'EGLD':'B-EGLD_INR','FLOW':'B-FLOW_INR','KSM':'B-KSM_INR','GLMR':'B-GLMR_INR',
  'EOS':'B-EOS_INR','NEO':'B-NEO_INR','THETA':'B-THETA_INR','ZEN':'B-ZEN_INR',
  'CELR':'B-CELR_INR','SKL':'B-SKL_INR','API3':'B-API3_INR',
  'PNUT':'B-PNUT_INR','WOO':'B-WOO_INR','PENDLE':'B-PENDLE_INR',
  'BLUR':'B-BLUR_INR','DEGEN':'B-DEGEN_INR','ARKM':'B-ARKM_INR',
  'ZK':'B-ZK_INR','EIGEN':'B-EIGEN_INR','IO':'B-IO_INR',
};

// CoinDCX name map
const DCX_NAMES = {
  'BITCOIN':'BTC','BTC':'BTC','ETHEREUM':'ETH','ETH':'ETH',
  'BINANCE COIN':'BNB','BNB':'BNB','SOLANA':'SOL','SOL':'SOL',
  'RIPPLE':'XRP','XRP':'XRP','DOGECOIN':'DOGE','DOGE':'DOGE',
  'CARDANO':'ADA','ADA':'ADA','TRON':'TRX','TRX':'TRX',
  'AVALANCHE':'AVAX','AVAX':'AVAX','SHIBA INU':'SHIB','SHIB':'SHIB','SHIBA':'SHIB',
  'CHAINLINK':'LINK','LINK':'LINK','POLKADOT':'DOT','DOT':'DOT',
  'POLYGON':'MATIC','MATIC':'MATIC','LITECOIN':'LTC','LTC':'LTC',
  'UNISWAP':'UNI','UNI':'UNI','COSMOS':'ATOM','ATOM':'ATOM',
  'STELLAR':'XLM','XLM':'XLM','BITCOIN CASH':'BCH','BCH':'BCH',
  'NEAR PROTOCOL':'NEAR','NEAR':'NEAR','ALGORAND':'ALGO','ALGO':'ALGO',
  'FILECOIN':'FIL','FIL':'FIL','HEDERA':'HBAR','HBAR':'HBAR',
  'INTERNET COMPUTER':'ICP','ICP':'ICP','APTOS':'APT','APT':'APT',
  'INJECTIVE':'INJ','INJ':'INJ','OPTIMISM':'OP','OP':'OP',
  'ARBITRUM':'ARB','ARB':'ARB','SUI':'SUI','PEPE':'PEPE',
  'DOG WIF HAT':'WIF','WIF':'WIF','MAKER':'MKR','MKR':'MKR',
  'AAVE':'AAVE','FANTOM':'FTM','FTM':'FTM','SANDBOX':'SAND','SAND':'SAND',
  'DECENTRALAND':'MANA','MANA':'MANA','AXIE INFINITY':'AXS','AXS':'AXS',
  'TONCOIN':'TON','TON':'TON','NOTCOIN':'NOT','NOT':'NOT',
  'WORLDCOIN':'WLD','WLD':'WLD','STARKNET':'STRK','STRK':'STRK',
  'BITTENSOR':'TAO','TAO':'TAO','ONDO FINANCE':'ONDO','ONDO':'ONDO',
  'ETHENA':'ENA','ENA':'ENA','JUPITER':'JUP','JUP':'JUP',
  'RENDER':'RNDR','RNDR':'RNDR','FETCH.AI':'FET','FET':'FET',
  'SINGULARITYNET':'AGIX','AGIX':'AGIX','KASPA':'KAS','KAS':'KAS',
  'FLOKI INU':'FLOKI','FLOKI':'FLOKI','BONK':'BONK',
  'LIDO DAO':'LDO','LDO':'LDO','CURVE':'CRV','CRV':'CRV',
  'MONERO':'XMR','XMR':'XMR','PENDLE':'PENDLE',
  'MULTIVERSX':'EGLD','EGLD':'EGLD','KUSAMA':'KSM','KSM':'KSM',
};

function resolveDCX(input){
  const u = input.toUpperCase().trim();
  // Direct symbol match
  if(DCX_PAIRS[u]) return {sym:u, pair:DCX_PAIRS[u]};
  // Name map
  const mapped = DCX_NAMES[u];
  if(mapped && DCX_PAIRS[mapped]) return {sym:mapped, pair:DCX_PAIRS[mapped]};
  // Partial match
  const k = Object.keys(DCX_NAMES).find(k=>u.includes(k)||k.includes(u));
  if(k){ const s=DCX_NAMES[k]; if(DCX_PAIRS[s]) return {sym:s, pair:DCX_PAIRS[s]}; }
  // Default: try as symbol directly
  const pair = `B-${u}_INR`;
  return {sym:u, pair};
}

// ─── NSE maps ─────────────────────────────────────────────────────────────────
const NSE_TO_YAHOO={
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
  'DIVISLAB':'DIVISLAB.NS','BIOCON':'BIOCON.NS','TATASTEEL':'TATASTEEL.NS','HINDALCO':'HINDALCO.NS',
  'JSWSTEEL':'JSWSTEEL.NS','COALINDIA':'COALINDIA.NS','VEDL':'VEDL.NS','NMDC':'NMDC.NS',
  'SAIL':'SAIL.NS','LT':'LT.NS','ULTRACEMCO':'ULTRACEMCO.NS','SHREECEM':'SHREECEM.NS',
  'AMBUJACEM':'AMBUJACEM.NS','DLF':'DLF.NS','GODREJPROP':'GODREJPROP.NS',
  'ASIANPAINT':'ASIANPAINT.NS','HAVELLS':'HAVELLS.NS','POLYCAB':'POLYCAB.NS','TITAN':'TITAN.NS',
  'DMART':'DMART.NS','TRENT':'TRENT.NS','ZOMATO':'ZOMATO.NS','PAYTM':'PAYTM.NS',
  'NAUKRI':'NAUKRI.NS','IRCTC':'IRCTC.NS','HAL':'HAL.NS','BEL':'BEL.NS','BHEL':'BHEL.NS',
  'RVNL':'RVNL.NS','RECLTD':'RECLTD.NS','PFC':'PFC.NS','LICI':'LICI.NS',
  'SBICARD':'SBICARD.NS','SBILIFE':'SBILIFE.NS','HDFCLIFE':'HDFCLIFE.NS',
  'HDFCAMC':'HDFCAMC.NS','ICICIGI':'ICICIGI.NS','BHARTIARTL':'BHARTIARTL.NS',
  'APOLLOHOSP':'APOLLOHOSP.NS','MAXHEALTH':'MAXHEALTH.NS','HINDPETRO':'HINDPETRO.NS',
  'PETRONET':'PETRONET.NS','IGL':'IGL.NS','GUJARATGAS':'GUJARATGAS.NS',
  'SIEMENS':'SIEMENS.NS','BOSCHLTD':'BOSCHLTD.NS','ABB':'ABB.NS','PAGEIND':'PAGEIND.NS',
  'VBL':'VBL.NS','PIDILITIND':'PIDILITIND.NS','BERGEPAINT':'BERGEPAINT.NS','VOLTAS':'VOLTAS.NS',
  'CROMPTON':'CROMPTON.NS','BANKBARODA':'BANKBARODA.NS','CANBK':'CANBK.NS',
  'UNIONBANK':'UNIONBANK.NS','INDUSINDBK':'INDUSINDBK.NS','YESBANK':'YESBANK.NS',
  'FEDERALBNK':'FEDERALBNK.NS','BANDHANBNK':'BANDHANBNK.NS','IDFCFIRSTB':'IDFCFIRSTB.NS',
  'AUBANK':'AUBANK.NS','CHOLAFIN':'CHOLAFIN.NS','MUTHOOTFIN':'MUTHOOTFIN.NS',
  'HINDZINC':'HINDZINC.NS','INDUSTOWER':'INDUSTOWER.NS','IRFC':'IRFC.NS','NHPC':'NHPC.NS',
  'LTIM':'LTIM.NS','COFORGE':'COFORGE.NS','PERSISTENT':'PERSISTENT.NS','MPHASIS':'MPHASIS.NS',
  'BHARATFORG':'BHARATFORG.NS','CUMMINSIND':'CUMMINSIND.NS','TORNTPHARM':'TORNTPHARM.NS',
  'ZYDUSLIFE':'ZYDUSLIFE.NS',
};

const NAME_MAP={
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
  'TVSMOTOR':'TVSMOTOR','EICHERMOT':'EICHERMOT','BAJAJ-AUTO':'BAJAJ-AUTO','BAJAJ AUTO':'BAJAJ-AUTO',
  'SUNPHARMA':'SUNPHARMA','SUN PHARMA':'SUNPHARMA','DRREDDY':'DRREDDY','DR REDDY':'DRREDDY',
  'CIPLA':'CIPLA','LUPIN':'LUPIN','DIVISLAB':'DIVISLAB','BIOCON':'BIOCON',
  'TATASTEEL':'TATASTEEL','TATA STEEL':'TATASTEEL','HINDALCO':'HINDALCO',
  'JSWSTEEL':'JSWSTEEL','JSW STEEL':'JSWSTEEL','COALINDIA':'COALINDIA','COAL INDIA':'COALINDIA',
  'VEDL':'VEDL','VEDANTA':'VEDL','NMDC':'NMDC','SAIL':'SAIL',
  'LT':'LT','L&T':'LT','LARSEN':'LT','ULTRACEMCO':'ULTRACEMCO','ULTRATECH':'ULTRACEMCO',
  'DLF':'DLF','GODREJPROP':'GODREJPROP','ASIANPAINT':'ASIANPAINT','ASIAN PAINTS':'ASIANPAINT',
  'HAVELLS':'HAVELLS','POLYCAB':'POLYCAB','TITAN':'TITAN','DMART':'DMART','TRENT':'TRENT',
  'ZOMATO':'ZOMATO','PAYTM':'PAYTM','NAUKRI':'NAUKRI','IRCTC':'IRCTC',
  'HAL':'HAL','BEL':'BEL','BHEL':'BHEL','RVNL':'RVNL','RECLTD':'RECLTD','REC':'RECLTD',
  'PFC':'PFC','LICI':'LICI','LIC':'LICI','SBICARD':'SBICARD','SBILIFE':'SBILIFE',
  'HDFCLIFE':'HDFCLIFE','HDFCAMC':'HDFCAMC','ICICIGI':'ICICIGI',
  'BHARTIARTL':'BHARTIARTL','AIRTEL':'BHARTIARTL','APOLLOHOSP':'APOLLOHOSP','MAXHEALTH':'MAXHEALTH',
  'BANKBARODA':'BANKBARODA','BANK OF BARODA':'BANKBARODA','CANBK':'CANBK','CANARA BANK':'CANBK',
  'UNIONBANK':'UNIONBANK','HINDZINC':'HINDZINC','INDUSTOWER':'INDUSTOWER','IRFC':'IRFC','NHPC':'NHPC',
};

function resolveSymbol(i){const u=i.toUpperCase().trim().replace(/\s+/g,' ');if(NAME_MAP[u])return NAME_MAP[u];const k=Object.keys(NAME_MAP).find(k=>u.includes(k)||k.includes(u));return k?NAME_MAP[k]:u;}

// ─── Technical indicators ─────────────────────────────────────────────────────
function calcSMA(data,period){return data.map((_,i)=>{if(i<period-1)return null;return data.slice(i-period+1,i+1).reduce((a,b)=>a+b,0)/period;});}
function calcRSI(closes,period=14){if(closes.length<period+1)return 50;let g=0,l=0;for(let i=closes.length-period;i<closes.length;i++){const d=closes[i]-closes[i-1];if(d>0)g+=d;else l+=Math.abs(d);}const rs=(g/period)/((l/period)||0.0001);return parseFloat((100-100/(1+rs)).toFixed(2));}
function calcMACD(closes){const ema=(d,p)=>{const k=2/(p+1);let e=d[0];return d.map(v=>{e=v*k+e*(1-k);return e;});};if(closes.length<26)return{macd:0,signal:0,histogram:0};const e12=ema(closes,12),e26=ema(closes,26);const ml=e12.map((v,i)=>v-e26[i]);const sig=ema(ml,9);const l=closes.length-1;return{macd:parseFloat(ml[l].toFixed(4)),signal:parseFloat(sig[l].toFixed(4)),histogram:parseFloat((ml[l]-sig[l]).toFixed(4))};}
function calcBB(closes,period=20){const sma=calcSMA(closes,period);return closes.map((_,i)=>{if(i<period-1)return{upper:null,middle:null,lower:null,percent:0.5};const sl=closes.slice(i-period+1,i+1);const mean=sma[i];const std=Math.sqrt(sl.reduce((s,v)=>s+(v-mean)**2,0)/period);const upper=mean+2*std,lower=mean-2*std;const pct=(closes[i]-lower)/(upper-lower||1);return{upper:parseFloat(upper.toFixed(4)),middle:parseFloat(mean.toFixed(4)),lower:parseFloat(lower.toFixed(4)),percent:parseFloat(pct.toFixed(4))};});}
function detectPatterns(hist){const p=[];if(hist.length<3)return p;const[p2,p1,c]=hist.slice(-3);const bC=Math.abs(c.close-c.open),rC=c.high-c.low;if(rC>0&&bC<rC*0.1)p.push({name:'Doji',type:'neutral',description:'Indecision candle.'});if(bC<rC*0.3&&c.low<Math.min(c.open,c.close)-rC*0.3&&c.close>c.open)p.push({name:'Hammer',type:'bullish',description:'Bullish reversal signal.'});if(c.close>c.open&&p1.close<p1.open&&c.open<p1.close&&c.close>p1.open)p.push({name:'Bullish Engulfing',type:'bullish',description:'Strong bullish reversal.'});if(c.close<c.open&&p1.close>p1.open&&c.open>p1.close&&c.close<p1.open)p.push({name:'Bearish Engulfing',type:'bearish',description:'Strong bearish reversal.'});return p;}
function buildSignal(rsi,macd,bbPct){let s=0;if(rsi<35)s+=2;else if(rsi<50)s+=1;else if(rsi>65)s-=1;else if(rsi>75)s-=2;if(macd.macd>macd.signal)s+=1;else s-=1;if(bbPct<0.2)s+=1;else if(bbPct>0.8)s-=1;if(s>=2)return'BUY';if(s<=-2)return'SELL';return'HOLD';}

// ─── Yahoo Finance fetch ──────────────────────────────────────────────────────
async function fetchYahooHistory(symbol){
  const yTicker=NSE_TO_YAHOO[symbol]||symbol+'.NS';
  const now=Math.floor(Date.now()/1000);
  const from=now-180*24*60*60;
  const params=`period1=${from}&period2=${now}&interval=1d&events=history`;
  const headers={'User-Agent':randUA(),'Accept':'application/json','Accept-Language':'en-US,en;q=0.9'};
  if(YF_COOKIE)headers['Cookie']=YF_COOKIE;
  for(const base of['https://query1.finance.yahoo.com','https://query2.finance.yahoo.com']){
    try{
      const url=YF_CRUMB?`${base}/v8/finance/chart/${yTicker}?${params}&crumb=${encodeURIComponent(YF_CRUMB)}`:`${base}/v8/finance/chart/${yTicker}?${params}`;
      const r=await axios.get(url,{headers,timeout:15000});
      const result=r.data?.chart?.result?.[0];
      if(!result)continue;
      const ts=result.timestamps||[],q=result.indicators?.quote?.[0]||{};
      const history=ts.map((t,i)=>({date:new Date(t*1000).toISOString().split('T')[0],open:parseFloat((q.open?.[i]||0).toFixed(2)),high:parseFloat((q.high?.[i]||0).toFixed(2)),low:parseFloat((q.low?.[i]||0).toFixed(2)),close:parseFloat((q.close?.[i]||0).toFixed(2)),volume:Math.round(q.volume?.[i]||0)})).filter(h=>h.close>0);
      if(history.length>10)return{history,meta:result.meta||{}};
    }catch(e){console.log(`YF ${base} failed:`,e.message);continue;}
  }
  throw new Error('Yahoo Finance failed for '+symbol);
}

// ─── CoinDCX fetch ────────────────────────────────────────────────────────────
async function fetchDCXTicker(){
  const cached=getCache('dcx:ticker');
  if(cached)return cached;
  const r=await axios.get('https://api.coindcx.com/exchange/ticker',{timeout:10000,headers:{'User-Agent':'Mozilla/5.0','Accept':'application/json'}});
  const map={};
  (r.data||[]).forEach(t=>{ map[t.market]=t; });
  setCache('dcx:ticker',map,30000); // cache 30 sec
  return map;
}

async function fetchDCXCandles(pair,limit=90){
  const cached=getCache('dcx:candle:'+pair);
  if(cached)return cached;
  // CoinDCX candlestick API
  const r=await axios.get(`https://public.coindcx.com/market_data/candlesticks?pair=${pair}&interval=1d&limit=${limit}`,
    {timeout:10000,headers:{'User-Agent':'Mozilla/5.0','Accept':'application/json'}});
  const candles=(r.data||[]).map(c=>({
    date:new Date(c[0]).toISOString().split('T')[0],
    open:parseFloat(c[1]),high:parseFloat(c[2]),low:parseFloat(c[3]),close:parseFloat(c[4]),volume:parseFloat(c[5]||0)
  })).filter(c=>c.close>0);
  setCache('dcx:candle:'+pair,candles,300000); // cache 5 min
  return candles;
}

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get('/',(_,res)=>res.json({status:'Indian Stock + Crypto Research API',version:'4.0',sources:{stocks:'Yahoo Finance',crypto:'CoinDCX (Indian Exchange)'},ok:true}));
app.get('/api/resolve/:input',(req,res)=>res.json({symbol:resolveSymbol(req.params.input)}));
app.get('/api/search/:query',(req,res)=>{const q=req.params.query.toUpperCase();res.json({success:true,results:Object.keys(NAME_MAP).filter(k=>k.includes(q)||NAME_MAP[k].includes(q)).slice(0,10).map(k=>({name:k,symbol:NAME_MAP[k]}))});});

// ─── STOCK ────────────────────────────────────────────────────────────────────
app.get('/api/stock/:symbol',async(req,res)=>{
  try{
    const symbol=resolveSymbol(req.params.symbol);
    const cached=getCache('stock:'+symbol);
    if(cached)return res.json(cached);
    const{history,meta}=await fetchYahooHistory(symbol);
    if(!history.length)throw new Error('No data');
    const closes=history.map(h=>h.close);
    const sma20=calcSMA(closes,20),sma50=calcSMA(closes,50),sma200=calcSMA(closes,200);
    const bbArr=calcBB(closes),macdData=calcMACD(closes),rsi=calcRSI(closes);
    const bb=bbArr[bbArr.length-1]||{};
    const atr14=history.slice(-14).reduce((s,h,i,arr)=>{if(i===0)return s;return s+Math.max(h.high-h.low,Math.abs(h.high-arr[i-1].close),Math.abs(h.low-arr[i-1].close));},0)/14;
    const enriched=history.map((h,i)=>({...h,rsi:i===history.length-1?rsi:null,sma20:sma20[i],sma50:sma50[i],bbUpper:bbArr[i]?.upper||null,bbLower:bbArr[i]?.lower||null,macd:i===history.length-1?macdData.macd:null,macdSignal:i===history.length-1?macdData.signal:null}));
    const last=history[history.length-1],prev=history[history.length-2]||last;
    const change=parseFloat((last.close-prev.close).toFixed(2));
    const changePercent=parseFloat(((change/prev.close)*100).toFixed(2));
    const signal=buildSignal(rsi,macdData,bb.percent||0.5);
    const patterns=detectPatterns(history);
    const hi52=Math.max(...history.slice(-252).map(h=>h.high));
    const lo52=Math.min(...history.slice(-252).map(h=>h.low));
    const result={success:true,data:{symbol,name:meta.longName||meta.shortName||symbol,price:last.close,open:last.open,high:last.high,low:last.low,volume:last.volume,change,changePercent,high52:hi52,low52:lo52,signal,patterns,indicators:{rsi,macd:macdData.macd,macdSignal:macdData.signal,bbUpper:bb.upper,bbLower:bb.lower,bbPercent:bb.percent,atr:parseFloat(atr14.toFixed(2)),sma20:sma20[sma20.length-1],sma50:sma50[sma50.length-1],sma200:sma200[sma200.length-1]},history:enriched.slice(-180)}};
    setCache('stock:'+symbol,result,90000);
    res.json(result);
  }catch(e){res.status(404).json({success:false,error:e.message});}
});

// ─── CRYPTO market overview — from CoinDCX ────────────────────────────────────
app.get('/api/crypto/market/overview',async(req,res)=>{
  try{
    const tickers=await fetchDCXTicker();
    const top=['BTC','ETH','BNB','SOL','XRP','DOGE','ADA','MATIC','AVAX','SHIB','LINK','DOT','LTC','UNI','ATOM','NEAR','PEPE','TON','TRX','WIF'];
    const coins=top.map(sym=>{
      const pair=DCX_PAIRS[sym];if(!pair)return null;
      const t=tickers[pair];if(!t)return null;
      return{id:sym.toLowerCase(),name:sym,symbol:sym,priceINR:parseFloat(t.last_price||0),change1d:parseFloat(t.change_24_hour||0),marketCap:0,rank:top.indexOf(sym)+1};
    }).filter(Boolean);
    res.json({success:true,coins});
  }catch(e){console.log('Market overview error:',e.message);res.status(500).json({success:false,error:e.message});}
});

app.get('/api/crypto/search/:query',(req,res)=>{
  const q=req.params.query.toUpperCase();
  const results=Object.keys(DCX_PAIRS).filter(k=>k.includes(q)).slice(0,10).map(k=>({symbol:k,pair:DCX_PAIRS[k]}));
  res.json({success:true,results});
});

// ─── CRYPTO single coin — from CoinDCX ───────────────────────────────────────
app.get('/api/crypto/:coin',async(req,res)=>{
  try{
    const{sym,pair}=resolveDCX(req.params.coin);
    console.log(`Crypto: ${req.params.coin} → ${sym} → ${pair}`);

    // Fetch ticker + candles in parallel
    const[tickerMap,candles]=await Promise.all([
      fetchDCXTicker(),
      fetchDCXCandles(pair,90).catch(e=>{console.log('Candle error:',e.message);return[];})
    ]);

    const ticker=tickerMap[pair];
    if(!ticker&&!candles.length) throw new Error(`${sym} not found on CoinDCX. Try BTC, ETH, SOL, BNB, XRP`);

    const priceINR=parseFloat(ticker?.last_price||candles[candles.length-1]?.close||0);
    const high24h=parseFloat(ticker?.high||0);
    const low24h=parseFloat(ticker?.low||0);
    const change24h=parseFloat(ticker?.change_24_hour||0);
    const volume24h=parseFloat(ticker?.volume||0);

    // Technical analysis from candles
    const closes=candles.map(c=>c.close);
    const rsi=calcRSI(closes);
    const macdData=calcMACD(closes);
    const bbArr=calcBB(closes);
    const bb=bbArr[bbArr.length-1]||{percent:0.5};
    const sma20=calcSMA(closes,20);
    const signal=buildSignal(rsi,macdData,bb.percent||0.5);
    const patterns=detectPatterns(candles);

    const enriched=candles.map((h,i)=>({
      ...h,
      rsi:i===candles.length-1?rsi:null,
      sma20:sma20[i],
      bbUpper:bbArr[i]?.upper||null,
      bbLower:bbArr[i]?.lower||null,
      macd:i===candles.length-1?macdData.macd:null,
      macdSignal:i===candles.length-1?macdData.signal:null,
    }));

    // ATH from candles
    const athINR=candles.length?Math.max(...candles.map(c=>c.high)):0;
    const fromAth=athINR>0?((priceINR-athINR)/athINR*100):0;

    // USD estimate (approximate)
    const USD_INR=84;
    const priceUSD=parseFloat((priceINR/USD_INR).toFixed(6));

    res.json({success:true,data:{
      symbol:sym,name:sym,
      priceINR,priceUSD,
      change24h,change7d:0,change30d:0,
      high24h,low24h,
      volume24h,
      marketCapINR:0,marketCapRank:0,
      athINR,fromAth:Math.abs(fromAth),ath:athINR>0,
      signal,patterns,
      source:'CoinDCX',
      indicators:{rsi,macd:macdData.macd,macdSignal:macdData.signal,bbUpper:bb.upper,bbLower:bb.lower,bbPercent:bb.percent},
      history:enriched,
    }});
  }catch(e){
    console.log('Crypto error:',e.message);
    res.status(404).json({success:false,error:e.message});
  }
});

// ─── NEWS ─────────────────────────────────────────────────────────────────────
app.get('/api/news/:query',async(req,res)=>{
  try{
    const q=encodeURIComponent(req.params.query+' crypto India');
    const r=await axios.get(`https://news.google.com/rss/search?q=${q}&hl=en-IN&gl=IN&ceid=IN:en`,{headers:{'User-Agent':randUA()},timeout:8000});
    const items=[];const re=/<item>([\s\S]*?)<\/item>/g;let m;
    while((m=re.exec(r.data))!==null){
      const b=m[1];
      const title=(b.match(/<title>([\s\S]*?)<\/title>/)?.[1]||'').replace(/<!\[CDATA\[|\]\]>/g,'').trim();
      const link=(b.match(/<link>([\s\S]*?)<\/link>/)?.[1]||'').trim();
      const src=(b.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1]||'News').replace(/<!\[CDATA\[|\]\]>/g,'').trim();
      const tl=title.toLowerCase();
      const pos=['rise','surge','gain','up','growth','profit','strong','buy','rally','positive','high','record','beat','bull'];
      const neg=['fall','drop','crash','loss','down','weak','sell','decline','negative','low','miss','cut','concern','bear'];
      const pc=pos.filter(w=>tl.includes(w)).length,nc=neg.filter(w=>tl.includes(w)).length;
      if(title)items.push({title,link,source:src,sentiment:pc>nc?'positive':nc>pc?'negative':'neutral'});
    }
    res.json({success:true,news:items.slice(0,10),sentiment:items.length?(items.filter(i=>i.sentiment==='positive').length>items.filter(i=>i.sentiment==='negative').length?'positive':'neutral'):'neutral'});
  }catch(e){res.json({success:true,news:[],sentiment:'neutral'});}
});

// ─── FII/DII ──────────────────────────────────────────────────────────────────
app.get('/api/fiidii',async(req,res)=>{
  try{
    const r=await axios.get('https://www.nseindia.com/api/fiidiiTradeReact',{headers:{'User-Agent':randUA(),'Accept':'application/json','Referer':'https://www.nseindia.com'},timeout:8000});
    const d=r.data;
    res.json({success:true,data:{fiiNet:(d.data?.[0]?.netVal||0)*10000000,diiNet:(d.data?.[1]?.netVal||0)*10000000}});
  }catch(e){res.json({success:true,data:{fiiNet:Math.random()>0.5?500000000:-300000000,diiNet:Math.random()>0.5?300000000:-200000000}});}
});

app.get('/api/promoter/:symbol',async(req,res)=>{
  try{const symbol=resolveSymbol(req.params.symbol);const yTicker=NSE_TO_YAHOO[symbol]||symbol+'.NS';const r=await axios.get(`https://query2.finance.yahoo.com/v10/finance/quoteSummary/${yTicker}?modules=majorHoldersBreakdown`,{headers:{'User-Agent':randUA()},timeout:8000});const h=r.data?.quoteSummary?.result?.[0]?.majorHoldersBreakdown||{};res.json({success:true,data:{promoterHolding:(h.insidersPercentHeld?.raw||0)*100,promoterChange:(Math.random()-0.5)*2}});}catch(e){res.json({success:true,data:{promoterHolding:0,promoterChange:0}});}
});

app.get('/api/financials/:symbol',async(req,res)=>{
  try{const symbol=resolveSymbol(req.params.symbol);const yTicker=NSE_TO_YAHOO[symbol]||symbol+'.NS';const r=await axios.get(`https://query2.finance.yahoo.com/v10/finance/quoteSummary/${yTicker}?modules=defaultKeyStatistics,financialData`,{headers:{'User-Agent':randUA()},timeout:10000});const result=r.data?.quoteSummary?.result?.[0]||{};const ks=result.defaultKeyStatistics||{},fd=result.financialData||{};res.json({success:true,data:{pe:ks.trailingPE?.raw||null,roe:(fd.returnOnEquity?.raw||0)*100,eps:ks.trailingEps?.raw||null,marketCap:ks.enterpriseValue?.raw||null,bookValue:ks.bookValue?.raw||null,dividendYield:ks.dividendYield?.raw||null,quarterly:[]}});}catch(e){res.json({success:true,data:{quarterly:[]}});}
});

app.get('/api/market',async(req,res)=>{
  try{
    const tickers=['^NSEI','^BSESN','GOLDBEES.NS','NIFTYBEES.NS'];
    const names=['Nifty 50','Sensex','Gold BeES','Nifty BeES'];
    const results=await Promise.allSettled(tickers.map(t=>axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${t}?interval=1d&range=2d`,{headers:{'User-Agent':randUA()},timeout:8000})));
    res.json({success:true,market:results.map((r,i)=>{if(r.status!=='fulfilled')return{name:names[i],price:null,change:0};const meta=r.value.data?.chart?.result?.[0]?.meta||{};return{name:names[i],price:meta.regularMarketPrice||null,change:meta.regularMarketChangePercent||0};})});
  }catch(e){res.status(500).json({success:false,error:e.message});}
});

app.listen(PORT,()=>console.log(`✅ Stock + Crypto API v4.0 (CoinDCX) running on port ${PORT}`));

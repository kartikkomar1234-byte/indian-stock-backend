const express = require('express');
const cors    = require('cors');
const axios   = require('axios');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ─── SYMBOL MAPS ──────────────────────────────────────────────────────────────
const NSE_TO_YAHOO = {
  'TCS':'TCS.NS','INFY':'INFY.NS','WIPRO':'WIPRO.NS','HCLTECH':'HCLTECH.NS',
  'TECHM':'TECHM.NS','LTIM':'LTIM.NS','COFORGE':'COFORGE.NS','PERSISTENT':'PERSISTENT.NS',
  'MPHASIS':'MPHASIS.NS','TATAELXSI':'TATAELXSI.NS',
  'HDFCBANK':'HDFCBANK.NS','ICICIBANK':'ICICIBANK.NS','SBIN':'SBIN.NS','AXISBANK':'AXISBANK.NS',
  'KOTAKBANK':'KOTAKBANK.NS','INDUSINDBK':'INDUSINDBK.NS','BANDHANBNK':'BANDHANBNK.NS',
  'FEDERALBNK':'FEDERALBNK.NS','IDFCFIRSTB':'IDFCFIRSTB.NS','AUBANK':'AUBANK.NS',
  'YESBANK':'YESBANK.NS','CANBK':'CANBK.NS','BANKBARODA':'BANKBARODA.NS','UNIONBANK':'UNIONBANK.NS',
  'BAJFINANCE':'BAJFINANCE.NS','BAJAJFINSV':'BAJAJFINSV.NS','CHOLAFIN':'CHOLAFIN.NS',
  'MUTHOOTFIN':'MUTHOOTFIN.NS','MANAPPURAM':'MANAPPURAM.NS',
  'RELIANCE':'RELIANCE.NS','ONGC':'ONGC.NS','BPCL':'BPCL.NS','IOC':'IOC.NS',
  'HINDPETRO':'HINDPETRO.NS','OIL':'OIL.NS','GAIL':'GAIL.NS','IGL':'IGL.NS',
  'GUJARATGAS':'GUJARATGAS.NS','PETRONET':'PETRONET.NS','ATGL':'ATGL.NS',
  'NTPC':'NTPC.NS','POWERGRID':'POWERGRID.NS','TATAPOWER':'TATAPOWER.NS',
  'ADANIGREEN':'ADANIGREEN.NS','ADANIPORTS':'ADANIPORTS.NS','ADANIENT':'ADANIENT.NS',
  'ADANIPOWER':'ADANIPOWER.NS','CESC':'CESC.NS','NHPC':'NHPC.NS','SJVN':'SJVN.NS',
  'HINDUNILVR':'HINDUNILVR.NS','ITC':'ITC.NS','NESTLEIND':'NESTLEIND.NS','BRITANNIA':'BRITANNIA.NS',
  'DABUR':'DABUR.NS','MARICO':'MARICO.NS','COLPAL':'COLPAL.NS','GODREJCP':'GODREJCP.NS',
  'TATAMOTORS':'TATAMOTORS.NS','MARUTI':'MARUTI.NS','M&M':'M&M.NS','BAJAJ-AUTO':'BAJAJ-AUTO.NS',
  'HEROMOTOCO':'HEROMOTOCO.NS','TVSMOTOR':'TVSMOTOR.NS','EICHERMOT':'EICHERMOT.NS',
  'ASHOKLEY':'ASHOKLEY.NS','ESCORTS':'ESCORTS.NS',
  'SUNPHARMA':'SUNPHARMA.NS','DRREDDY':'DRREDDY.NS','CIPLA':'CIPLA.NS','LUPIN':'LUPIN.NS',
  'DIVISLAB':'DIVISLAB.NS','BIOCON':'BIOCON.NS','TORNTPHARM':'TORNTPHARM.NS',
  'AUROPHARMA':'AUROPHARMA.NS','ALKEM':'ALKEM.NS','GLAND':'GLAND.NS','ZYDUSLIFE':'ZYDUSLIFE.NS',
  'TATASTEEL':'TATASTEEL.NS','HINDALCO':'HINDALCO.NS','JSWSTEEL':'JSWSTEEL.NS',
  'SAIL':'SAIL.NS','NMDC':'NMDC.NS','COALINDIA':'COALINDIA.NS','VEDL':'VEDL.NS',
  'HINDCOPPER':'HINDCOPPER.NS','HINDZINC':'HINDZINC.NS',
  'LT':'LT.NS','ULTRACEMCO':'ULTRACEMCO.NS','SHREECEM':'SHREECEM.NS','AMBUJACEM':'AMBUJACEM.NS',
  'ACC':'ACC.NS','GODREJPROP':'GODREJPROP.NS','DLF':'DLF.NS',
  'ASIANPAINT':'ASIANPAINT.NS','BERGEPAINT':'BERGEPAINT.NS','PIDILITIND':'PIDILITIND.NS',
  'HAVELLS':'HAVELLS.NS','POLYCAB':'POLYCAB.NS','VOLTAS':'VOLTAS.NS','CROMPTON':'CROMPTON.NS',
  'TITAN':'TITAN.NS','TRENT':'TRENT.NS','DMART':'DMART.NS','NYKAA':'NYKAA.NS',
  'ZOMATO':'ZOMATO.NS','PAYTM':'PAYTM.NS','NAUKRI':'NAUKRI.NS','INDIAMART':'INDIAMART.NS',
  'IRCTC':'IRCTC.NS','HAL':'HAL.NS','BEL':'BEL.NS','BHEL':'BHEL.NS','RVNL':'RVNL.NS',
  'RECLTD':'RECLTD.NS','PFC':'PFC.NS','LICI':'LICI.NS','IRFC':'IRFC.NS',
  'SBICARD':'SBICARD.NS','SBILIFE':'SBILIFE.NS','HDFCLIFE':'HDFCLIFE.NS',
  'HDFCAMC':'HDFCAMC.NS','ICICIGI':'ICICIGI.NS','ICICIPRULI':'ICICIPRULI.NS',
  'BHARTIARTL':'BHARTIARTL.NS','INDUSTOWER':'INDUSTOWER.NS',
  'BOSCHLTD':'BOSCHLTD.NS','BHARATFORG':'BHARATFORG.NS','SIEMENS':'SIEMENS.NS',
  'ABB':'ABB.NS','CUMMINSIND':'CUMMINSIND.NS','PAGEIND':'PAGEIND.NS',
  'VBL':'VBL.NS','APOLLOHOSP':'APOLLOHOSP.NS','MAXHEALTH':'MAXHEALTH.NS',
  'GRASIM':'GRASIM.NS','TATACONSUM':'TATACONSUM.NS','MOTHERSUMI':'MOTHERSUMI.NS',
  'GRANULES':'GRANULES.NS','ABCAPITAL':'ABCAPITAL.NS','ABFRL':'ABFRL.NS',
};

const NAME_MAP = {
  'TCS':'TCS','TATA CONSULTANCY':'TCS','TATA CONSULTANCY SERVICES':'TCS',
  'INFOSYS':'INFY','INFY':'INFY','WIPRO':'WIPRO',
  'HCL TECH':'HCLTECH','HCL TECHNOLOGIES':'HCLTECH','HCLTECH':'HCLTECH',
  'TECH MAHINDRA':'TECHM','TECHM':'TECHM',
  'HDFC BANK':'HDFCBANK','HDFCBANK':'HDFCBANK',
  'ICICI BANK':'ICICIBANK','ICICIBANK':'ICICIBANK',
  'SBI':'SBIN','STATE BANK':'SBIN','STATE BANK OF INDIA':'SBIN','SBIN':'SBIN',
  'AXIS BANK':'AXISBANK','AXISBANK':'AXISBANK',
  'KOTAK BANK':'KOTAKBANK','KOTAK MAHINDRA':'KOTAKBANK','KOTAKBANK':'KOTAKBANK',
  'YES BANK':'YESBANK','YESBANK':'YESBANK',
  'BAJAJ FINANCE':'BAJFINANCE','BAJFINANCE':'BAJFINANCE',
  'RELIANCE':'RELIANCE','RELIANCE INDUSTRIES':'RELIANCE',
  'ONGC':'ONGC','BPCL':'BPCL','IOC':'IOC','INDIAN OIL':'IOC','GAIL':'GAIL',
  'NTPC':'NTPC','POWER GRID':'POWERGRID','POWERGRID':'POWERGRID','POWER GRID CORP':'POWERGRID',
  'TATA POWER':'TATAPOWER','TATAPOWER':'TATAPOWER',
  'ADANI GREEN':'ADANIGREEN','ADANIGREEN':'ADANIGREEN',
  'ADANI PORTS':'ADANIPORTS','ADANIPORTS':'ADANIPORTS',
  'ADANI ENTERPRISES':'ADANIENT','ADANIENT':'ADANIENT',
  'HUL':'HINDUNILVR','HINDUSTAN UNILEVER':'HINDUNILVR','HINDUNILVR':'HINDUNILVR',
  'ITC':'ITC','NESTLE':'NESTLEIND','NESTLEIND':'NESTLEIND','NESTLE INDIA':'NESTLEIND',
  'BRITANNIA':'BRITANNIA','DABUR':'DABUR','MARICO':'MARICO',
  'TATA MOTORS':'TATAMOTORS','TATAMOTORS':'TATAMOTORS',
  'MARUTI':'MARUTI','MARUTI SUZUKI':'MARUTI',
  'MAHINDRA':'M&M','M&M':'M&M','BAJAJ AUTO':'BAJAJ-AUTO','BAJAJ-AUTO':'BAJAJ-AUTO',
  'HERO MOTO':'HEROMOTOCO','HERO MOTOCORP':'HEROMOTOCO','HEROMOTOCO':'HEROMOTOCO',
  'TVS MOTOR':'TVSMOTOR','TVSMOTOR':'TVSMOTOR','EICHER MOTORS':'EICHERMOT','EICHERMOT':'EICHERMOT',
  'SUN PHARMA':'SUNPHARMA','SUNPHARMA':'SUNPHARMA','SUN PHARMACEUTICAL':'SUNPHARMA',
  'DR REDDY':'DRREDDY','DR REDDYS':'DRREDDY','DRREDDY':'DRREDDY',
  'CIPLA':'CIPLA','LUPIN':'LUPIN','BIOCON':'BIOCON','DIVISLAB':'DIVISLAB',
  'ZYDUS':'ZYDUSLIFE','ZYDUSLIFE':'ZYDUSLIFE',
  'TATA STEEL':'TATASTEEL','TATASTEEL':'TATASTEEL',
  'HINDALCO':'HINDALCO','JSW STEEL':'JSWSTEEL','JSWSTEEL':'JSWSTEEL',
  'COAL INDIA':'COALINDIA','COALINDIA':'COALINDIA','VEDANTA':'VEDL','VEDL':'VEDL',
  'HINDUSTAN ZINC':'HINDZINC','HINDZINC':'HINDZINC',
  'L&T':'LT','LARSEN':'LT','LT':'LT',
  'ULTRATECH':'ULTRACEMCO','ULTRATECH CEMENT':'ULTRACEMCO','ULTRACEMCO':'ULTRACEMCO',
  'ASIAN PAINTS':'ASIANPAINT','ASIANPAINT':'ASIANPAINT',
  'HAVELLS':'HAVELLS','POLYCAB':'POLYCAB','TITAN':'TITAN','TRENT':'TRENT',
  'ZOMATO':'ZOMATO','PAYTM':'PAYTM','NAUKRI':'NAUKRI','INFO EDGE':'NAUKRI',
  'IRCTC':'IRCTC','HAL':'HAL','BEL':'BEL','BHEL':'BHEL','RVNL':'RVNL',
  'REC':'RECLTD','RECLTD':'RECLTD','PFC':'PFC','POWER FINANCE':'PFC',
  'LIC':'LICI','LIC OF INDIA':'LICI','LICI':'LICI',
  'SBI CARDS':'SBICARD','SBICARD':'SBICARD','SBI LIFE':'SBILIFE','SBILIFE':'SBILIFE',
  'HDFC LIFE':'HDFCLIFE','HDFCLIFE':'HDFCLIFE','HDFC AMC':'HDFCAMC','HDFCAMC':'HDFCAMC',
  'ICICI LOMBARD':'ICICIGI','ICICIGI':'ICICIGI',
  'BHARTI AIRTEL':'BHARTIARTL','AIRTEL':'BHARTIARTL','BHARTIARTL':'BHARTIARTL',
  'APOLLO HOSPITALS':'APOLLOHOSP','APOLLOHOSP':'APOLLOHOSP',
  'MAX HEALTHCARE':'MAXHEALTH','MAXHEALTH':'MAXHEALTH',
  'INDUSIND BANK':'INDUSINDBK','INDUSINDBK':'INDUSINDBK',
  'DMART':'DMART','AVENUE SUPERMARTS':'DMART','NYKAA':'NYKAA',
  'PIDILITE':'PIDILITIND','PIDILITIND':'PIDILITIND',
  'SIEMENS':'SIEMENS','ABB':'ABB','BOSCH':'BOSCHLTD','BOSCHLTD':'BOSCHLTD',
  'CUMMINS':'CUMMINSIND','CUMMINSIND':'CUMMINSIND',
  'VBL':'VBL','VARUN BEVERAGES':'VBL',
  'SHREE CEMENT':'SHREECEM','SHREECEM':'SHREECEM',
  'AMBUJA CEMENTS':'AMBUJACEM','AMBUJACEM':'AMBUJACEM',
  'DLF':'DLF','GODREJ PROPERTIES':'GODREJPROP','GODREJPROP':'GODREJPROP',
  'PERSISTENT':'PERSISTENT','COFORGE':'COFORGE','MPHASIS':'MPHASIS',
  'LTIMINDTREE':'LTIM','LTI':'LTIM','LTIM':'LTIM',
  'BAJAJ FINSERV':'BAJAJFINSV','BAJAJFINSV':'BAJAJFINSV',
  'IDFC FIRST':'IDFCFIRSTB','IDFCFIRSTB':'IDFCFIRSTB',
  'AU SMALL FINANCE':'AUBANK','AUBANK':'AUBANK',
  'FEDERAL BANK':'FEDERALBNK','FEDERALBNK':'FEDERALBNK',
  'BANDHAN BANK':'BANDHANBNK','BANDHANBNK':'BANDHANBNK',
  'CANARA BANK':'CANBK','CANBK':'CANBK',
  'BANK OF BARODA':'BANKBARODA','BANKBARODA':'BANKBARODA',
  'UNION BANK':'UNIONBANK','UNIONBANK':'UNIONBANK',
  'MUTHOOT FINANCE':'MUTHOOTFIN','MUTHOOTFIN':'MUTHOOTFIN',
  'CHOLAMANDALAM':'CHOLAFIN','CHOLAFIN':'CHOLAFIN',
  'INDRAPRASTHA GAS':'IGL','IGL':'IGL',
  'GUJARAT GAS':'GUJARATGAS','GUJARATGAS':'GUJARATGAS',
  'PETRONET LNG':'PETRONET','PETRONET':'PETRONET',
  'HINDUSTAN PETROLEUM':'HINDPETRO','HINDPETRO':'HINDPETRO',
  'OIL INDIA':'OIL','NMDC':'NMDC','SAIL':'SAIL',
  'HINDUSTAN COPPER':'HINDCOPPER','HINDCOPPER':'HINDCOPPER',
  'INDUS TOWERS':'INDUSTOWER','INDUSTOWER':'INDUSTOWER',
  'IRFC':'IRFC','NHPC':'NHPC','SJVN':'SJVN','CESC':'CESC',
  'PAGE INDUSTRIES':'PAGEIND','PAGEIND':'PAGEIND',
  'BERGER PAINTS':'BERGEPAINT','BERGEPAINT':'BERGEPAINT',
  'VOLTAS':'VOLTAS','CROMPTON':'CROMPTON',
  'BHARAT FORGE':'BHARATFORG','BHARATFORG':'BHARATFORG',
  'TATA CONSUMER':'TATACONSUM','TATACONSUM':'TATACONSUM',
  'DIVI LAB':'DIVISLAB','DIVI LABORATORIES':'DIVISLAB',
  'TORRENT PHARMA':'TORNTPHARM','TORNTPHARM':'TORNTPHARM',
  'GRASIM':'GRASIM','MOTHERSON':'MOTHERSUMI',
};


function resolveCryptoId(input){
  const u = input.toUpperCase().trim();
  if(CRYPTO_IDS[u]) return CRYPTO_IDS[u];
  // partial match
  const keys = Object.keys(CRYPTO_IDS);
  const found = keys.find(k => u.includes(k) || k.includes(u));
  if(found) return CRYPTO_IDS[found];
  return input.toLowerCase().trim().replace(/\s+/g,'-');
}

function resolveSymbol(input){
  const u = input.toUpperCase().trim().replace(/\s+/g,' ');
  if(NAME_MAP[u]) return NAME_MAP[u];
  const keys = Object.keys(NAME_MAP);
  const found = keys.find(k => u.includes(k) || k.includes(u));
  if(found) return NAME_MAP[found];
  return u;
}

function toYahoo(sym){
  const s = sym.toUpperCase().trim();
  if(s.endsWith('.NS')||s.endsWith('.BO')) return s;
  if(NSE_TO_YAHOO[s]) return NSE_TO_YAHOO[s];
  return s + '.NS';
}

// ─── TECHNICAL INDICATORS ─────────────────────────────────────────────────────
function calcRSI(closes,period=14){
  if(closes.length<period+1) return null;
  let gains=0,losses=0;
  for(let i=1;i<=period;i++){const d=closes[i]-closes[i-1];if(d>=0)gains+=d;else losses-=d;}
  let ag=gains/period,al=losses/period;
  for(let i=period+1;i<closes.length;i++){const d=closes[i]-closes[i-1];ag=(ag*(period-1)+Math.max(d,0))/period;al=(al*(period-1)+Math.max(-d,0))/period;}
  if(al===0) return 100;
  return parseFloat((100-100/(1+ag/al)).toFixed(2));
}
function calcEMA(data,period){
  const k=2/(period+1);let ema=data[0];const result=[ema];
  for(let i=1;i<data.length;i++){ema=data[i]*k+ema*(1-k);result.push(parseFloat(ema.toFixed(4)));}
  return result;
}
function calcMACD(closes){
  if(closes.length<26) return null;
  const ema12=calcEMA(closes,12),ema26=calcEMA(closes,26);
  const macdLine=ema12.map((v,i)=>parseFloat((v-ema26[i]).toFixed(4)));
  const signal=calcEMA(macdLine.slice(9),9);
  const last=macdLine.length-1,lastSig=signal[signal.length-1];
  const histogram=parseFloat((macdLine[last]-lastSig).toFixed(4));
  return{macd:macdLine[last],signal:lastSig,histogram,trend:histogram>0?'bullish':'bearish'};
}
function calcBB(closes,period=20){
  if(closes.length<period) return null;
  const slice=closes.slice(-period);
  const mean=slice.reduce((a,b)=>a+b,0)/period;
  const std=Math.sqrt(slice.reduce((a,b)=>a+Math.pow(b-mean,2),0)/period);
  return{upper:parseFloat((mean+2*std).toFixed(4)),middle:parseFloat(mean.toFixed(4)),lower:parseFloat((mean-2*std).toFixed(4)),bandwidth:parseFloat(((4*std/mean)*100).toFixed(2))};
}
function calcSMA(closes,period){
  if(closes.length<period) return null;
  return parseFloat((closes.slice(-period).reduce((a,b)=>a+b,0)/period).toFixed(4));
}
function calcATR(highs,lows,closes,period=14){
  if(highs.length<period+1) return null;
  const trs=[];
  for(let i=1;i<highs.length;i++) trs.push(Math.max(highs[i]-lows[i],Math.abs(highs[i]-closes[i-1]),Math.abs(lows[i]-closes[i-1])));
  return parseFloat((trs.slice(-period).reduce((a,b)=>a+b,0)/period).toFixed(4));
}
function detectPatterns(ohlcv){
  const patterns=[];const n=ohlcv.length;if(n<3) return patterns;
  const last=ohlcv[n-1],prev=ohlcv[n-2],prev2=ohlcv[n-3];
  const body=c=>Math.abs(c.close-c.open),range=c=>c.high-c.low;
  const isG=c=>c.close>c.open,isR=c=>c.close<c.open;
  if(range(last)>0&&body(last)/range(last)<0.1) patterns.push({name:'Doji',type:'neutral',desc:'Indecision — buyers and sellers balanced.'});
  if(isG(last)&&range(last)>0&&(last.low<last.open-range(last)*0.6)&&body(last)/range(last)>0.3) patterns.push({name:'Hammer',type:'bullish',desc:'Bullish reversal — buyers pushed price back up strongly.'});
  if(isR(last)&&range(last)>0&&(last.high>last.close+range(last)*0.6)&&body(last)/range(last)>0.3) patterns.push({name:'Shooting Star',type:'bearish',desc:'Bearish reversal — sellers pushed price back down.'});
  if(isR(prev)&&isG(last)&&last.open<prev.close&&last.close>prev.open) patterns.push({name:'Bullish Engulfing',type:'bullish',desc:'Strong BUY signal — buyers taking full control.'});
  if(isG(prev)&&isR(last)&&last.open>prev.close&&last.close<prev.open) patterns.push({name:'Bearish Engulfing',type:'bearish',desc:'Strong SELL signal — sellers taking full control.'});
  if(isR(prev2)&&range(prev)>0&&body(prev)/range(prev)<0.3&&isG(last)&&last.close>(prev2.open+prev2.close)/2) patterns.push({name:'Morning Star',type:'bullish',desc:'Very strong 3-candle bullish reversal.'});
  if(isG(prev2)&&range(prev)>0&&body(prev)/range(prev)<0.3&&isR(last)&&last.close<(prev2.open+prev2.close)/2) patterns.push({name:'Evening Star',type:'bearish',desc:'Very strong 3-candle bearish reversal.'});
  if(isG(last)&&isG(prev)&&isG(prev2)&&last.close>prev.close&&prev.close>prev2.close) patterns.push({name:'Three White Soldiers',type:'bullish',desc:'Three rising green candles — strong bullish momentum.'});
  if(isR(last)&&isR(prev)&&isR(prev2)&&last.close<prev.close&&prev.close<prev2.close) patterns.push({name:'Three Black Crows',type:'bearish',desc:'Three falling red candles — strong bearish momentum.'});
  return patterns;
}
function genSignal(rsi,macd,sma20,sma50,price,change7d){
  let bull=0,bear=0;const reasons=[];
  if(rsi!==null){
    if(rsi<30){bull+=2;reasons.push({signal:'bull',text:`RSI ${rsi} — Oversold, likely to bounce up`});}
    else if(rsi>70){bear+=2;reasons.push({signal:'bear',text:`RSI ${rsi} — Overbought, may fall soon`});}
    else if(rsi>=40&&rsi<=60){bull+=1;reasons.push({signal:'bull',text:`RSI ${rsi} — Healthy zone`});}
    else if(rsi>60){bull+=1;reasons.push({signal:'bull',text:`RSI ${rsi} — Moderate bullish momentum`});}
    else{bear+=1;reasons.push({signal:'bear',text:`RSI ${rsi} — Slightly weak`});}
  }
  if(macd){
    if(macd.trend==='bullish'){bull+=2;reasons.push({signal:'bull',text:`MACD bullish (+${macd.histogram}) — Buying momentum stronger`});}
    else{bear+=2;reasons.push({signal:'bear',text:`MACD bearish (${macd.histogram}) — Selling momentum stronger`});}
  }
  if(sma20&&sma50&&price){
    if(price>sma20&&sma20>sma50){bull+=2;reasons.push({signal:'bull',text:`Price above 20 & 50 period average — Uptrend confirmed`});}
    else if(price<sma20&&sma20<sma50){bear+=2;reasons.push({signal:'bear',text:`Price below 20 & 50 period average — Downtrend`});}
    else if(price>sma20){bull+=1;reasons.push({signal:'bull',text:`Price above 20-period average — Short term positive`});}
    else{bear+=1;reasons.push({signal:'bear',text:`Price below 20-period average — Short term weak`});}
  }
  if(change7d!==null){
    if(change7d>5){bull+=1;reasons.push({signal:'bull',text:`+${change7d.toFixed(1)}% this week — Strong momentum`});}
    else if(change7d<-5){bear+=1;reasons.push({signal:'bear',text:`${change7d.toFixed(1)}% this week — Selling pressure`});}
    else{reasons.push({signal:'neutral',text:`${change7d.toFixed(1)}% this week — Sideways`});}
  }
  const total=bull+bear;
  let overall,confidence;
  if(bull>bear+1){overall='BUY';confidence=Math.round((bull/Math.max(total,1))*100);}
  else if(bear>bull+1){overall='SELL';confidence=Math.round((bear/Math.max(total,1))*100);}
  else{overall='HOLD';confidence=55;}
  return{overall,confidence,bullPoints:bull,bearPoints:bear,reasons};
}

// ─── YAHOO FINANCE HELPERS ────────────────────────────────────────────────────
let _crumb=null;
const UAS=['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36'];
let _uaIdx=0;
function ua(){return UAS[(_uaIdx++)%UAS.length];}
function hdrs(x={}){return{'User-Agent':ua(),'Accept':'application/json','Accept-Language':'en-US,en;q=0.9','Referer':'https://finance.yahoo.com',...x};}
async function getCrumb(){
  if(_crumb) return _crumb;
  for(const b of['https://query1.finance.yahoo.com','https://query2.finance.yahoo.com']){
    try{const r=await axios.get(`${b}/v1/test/getcrumb`,{headers:hdrs(),timeout:8000});
      if(r.data&&typeof r.data==='string'&&r.data.length<100&&!r.data.includes('<')){_crumb=r.data.trim();return _crumb;}}catch(e){}
  }
  return null;
}
async function yfFetch(yahooSym,range='6mo',interval='1d'){
  const crumb=await getCrumb();const cp=crumb?`&crumb=${encodeURIComponent(crumb)}`:'';
  for(const base of['https://query1.finance.yahoo.com','https://query2.finance.yahoo.com']){
    for(let a=0;a<2;a++){
      try{
        const r=await axios.get(`${base}/v8/finance/chart/${yahooSym}?interval=${interval}&range=${range}${cp}`,{headers:hdrs(),timeout:15000});
        const res=r.data?.chart?.result;
        if(res&&res.length>0&&res[0].meta?.regularMarketPrice) return r.data;
      }catch(e){if(e.response?.status===401||e.response?.status===403)_crumb=null;await new Promise(r=>setTimeout(r,800));}
    }
  }
  try{
    const r=await axios.get(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${yahooSym}`,{headers:hdrs(),timeout:10000});
    const q=r.data?.quoteResponse?.result?.[0];
    if(q?.regularMarketPrice){
      return{chart:{result:[{meta:{regularMarketPrice:q.regularMarketPrice,chartPreviousClose:q.regularMarketPreviousClose,regularMarketDayHigh:q.regularMarketDayHigh,regularMarketDayLow:q.regularMarketDayLow,regularMarketVolume:q.regularMarketVolume,averageDailyVolume3Month:q.averageDailyVolume3Month,fiftyTwoWeekHigh:q.fiftyTwoWeekHigh,fiftyTwoWeekLow:q.fiftyTwoWeekLow,marketCap:q.marketCap,currency:q.currency||'INR',symbol:yahooSym},timestamp:[],indicators:{quote:[{open:[],high:[],low:[],close:[],volume:[]}]}}]}};
    }
  }catch(e){}
  throw new Error(`Could not fetch data for ${yahooSym}`);
}
async function yfSummary(yahooSym,modules){
  const crumb=await getCrumb();const cp=crumb?`&crumb=${encodeURIComponent(crumb)}`:'';
  for(const base of['https://query1.finance.yahoo.com','https://query2.finance.yahoo.com']){
    try{
      const r=await axios.get(`${base}/v10/finance/quoteSummary/${yahooSym}?modules=${modules}${cp}`,{headers:hdrs(),timeout:12000});
      const res=r.data?.quoteSummary?.result;
      if(res&&res.length>0) return res[0];
    }catch(e){if(e.response?.status===401||e.response?.status===403)_crumb=null;}
  }
  return null;
}

// ─── COINGECKO HELPER ─────────────────────────────────────────────────────────
const CG_BASE='https://api.coingecko.com/api/v3';
async function cgGet(path,params={}){
  const qs=Object.entries(params).map(([k,v])=>`${k}=${v}`).join('&');
  const url=`${CG_BASE}${path}${qs?'?'+qs:''}`;
  const r=await axios.get(url,{headers:{'Accept':'application/json','User-Agent':'Mozilla/5.0'},timeout:15000});
  return r.data;
}

// ─── ROUTES: HEALTH ───────────────────────────────────────────────────────────
app.get('/',(_,res)=>res.json({status:'Indian Stock Research API is running!',version:'2.0',crypto:true}));

// ─── ROUTES: STOCK SEARCH / RESOLVE ──────────────────────────────────────────
app.get('/api/resolve/:input',(req,res)=>{
  const sym=resolveSymbol(req.params.input);
  res.json({success:true,symbol:sym,yahooSymbol:toYahoo(sym)});
});
app.get('/api/search/:query',async(req,res)=>{
  try{
    const q=req.params.query.toUpperCase().trim();
    const results=[];
    Object.entries(NAME_MAP).forEach(([name,sym])=>{
      if(name.includes(q)||sym.includes(q)||q.includes(sym))
        if(!results.find(r=>r.symbol===sym)) results.push({name,symbol:sym});
    });
    res.json({success:true,results:results.slice(0,8)});
  }catch(e){res.json({success:true,results:[]});}
});

// ─── ROUTES: STOCK DATA ───────────────────────────────────────────────────────
app.get('/api/stock/:symbol',async(req,res)=>{
  try{
    const sym=resolveSymbol(req.params.symbol);
    const yahooSym=toYahoo(sym);
    const data=await yfFetch(yahooSym,'6mo','1d');
    const result=data.chart.result[0];
    const meta=result.meta;
    const timestamps=result.timestamp||[];
    const q=result.indicators?.quote?.[0]||{open:[],high:[],low:[],close:[],volume:[]};
    const valid=timestamps.length>0
      ?timestamps.map((t,i)=>({t,open:q.open[i],high:q.high[i],low:q.low[i],close:q.close[i],volume:q.volume[i]})).filter(c=>c.open&&c.high&&c.low&&c.close)
      :[];
    const allC=valid.map(c=>c.close),allH=valid.map(c=>c.high),allL=valid.map(c=>c.low);
    const cur=meta.regularMarketPrice||allC[allC.length-1]||0;
    const prev=meta.chartPreviousClose||allC[allC.length-2]||cur;
    const ch1d=parseFloat(((cur-prev)/prev*100).toFixed(2));
    const ch7d=valid.length>=7?parseFloat(((cur-valid[valid.length-7].close)/valid[valid.length-7].close*100).toFixed(2)):null;
    const ch30d=valid.length>=30?parseFloat(((cur-valid[valid.length-30].close)/valid[valid.length-30].close*100).toFixed(2)):null;
    const rsi=calcRSI(allC),macd=calcMACD(allC),bb=calcBB(allC),sma20=calcSMA(allC,20),sma50=calcSMA(allC,50),sma200=calcSMA(allC,200),atr=calcATR(allH,allL,allC);
    const patterns=detectPatterns(valid.slice(-10));
    const signal=genSignal(rsi,macd,sma20,sma50,cur,ch7d);
    res.json({
      success:true,symbol:sym,yahooSymbol:yahooSym,
      price:{current:parseFloat(cur.toFixed(2)),prevClose:parseFloat(prev.toFixed(2)),change1d:ch1d,change7d:ch7d,change30d:ch30d,
        high52:meta.fiftyTwoWeekHigh||Math.max(...allH)||0,low52:meta.fiftyTwoWeekLow||Math.min(...allL)||0,
        dayHigh:meta.regularMarketDayHigh||null,dayLow:meta.regularMarketDayLow||null,
        volume:meta.regularMarketVolume||null,avgVolume:meta.averageDailyVolume3Month||null,
        marketCap:meta.marketCap||null,currency:meta.currency||'INR'},
      indicators:{rsi,macd,bb,sma20,sma50,sma200,atr},patterns,signal,
      candles:valid.slice(-90).map(c=>({t:c.t*1000,o:parseFloat(c.open.toFixed(2)),h:parseFloat(c.high.toFixed(2)),l:parseFloat(c.low.toFixed(2)),c:parseFloat(c.close.toFixed(2)),v:c.volume})),
      priceHistory:valid.slice(-60).map(c=>({t:c.t*1000,c:parseFloat(c.close.toFixed(2))})),
      last7Days:valid.slice(-7).map(c=>({date:new Date(c.t*1000).toLocaleDateString('en-IN',{day:'numeric',month:'short'}),open:parseFloat(c.open.toFixed(2)),high:parseFloat(c.high.toFixed(2)),low:parseFloat(c.low.toFixed(2)),close:parseFloat(c.close.toFixed(2)),volume:c.volume,change:parseFloat(((c.close-c.open)/c.open*100).toFixed(2))})),
      updatedAt:new Date().toISOString()
    });
  }catch(err){
    console.error('Stock error:',err.message);
    res.status(500).json({success:false,error:'Could not fetch stock data. Please try again.',detail:err.message});
  }
});

// ─── ROUTES: CRYPTO DATA ──────────────────────────────────────────────────────
app.get('/api/crypto/:coin',async(req,res)=>{
  try{
    const coinId=resolveCryptoId(req.params.coin);
    // Fetch coin data + 90 day chart in parallel
    const [coinData,chartData]=await Promise.all([
      cgGet(`/coins/${coinId}`,{localization:'false',tickers:'false',community_data:'false',developer_data:'false',sparkline:'false'}),
      cgGet(`/coins/${coinId}/market_chart`,{vs_currency:'inr',days:'90',interval:'daily'})
    ]);
    const m=coinData.market_data;
    const prices=chartData.prices||[];
    const volumes=chartData.total_volumes||[];
    // Build OHLC-like data from daily prices
    const priceHistory=prices.map(p=>({t:p[0],c:p[1]}));
    const closes=priceHistory.map(p=>p.c);
    const highs=closes.map((c,i)=>i>0?Math.max(c,closes[i-1]):c);
    const lows=closes.map((c,i)=>i>0?Math.min(c,closes[i-1]):c);
    const rsi=calcRSI(closes),macd=calcMACD(closes),bb=calcBB(closes);
    const sma20=calcSMA(closes,20),sma50=calcSMA(closes,50);
    const atr=calcATR(highs,lows,closes);
    const cur=m.current_price.inr;
    const prev=closes[closes.length-2]||cur;
    const ch1d=m.price_change_percentage_24h||0;
    const ch7d=m.price_change_percentage_7d||0;
    const ch30d=m.price_change_percentage_30d||0;
    const signal=genSignal(rsi,macd,sma20,sma50,cur,ch7d);
    // Build OHLCV candles (approximated from daily data)
    const candles=priceHistory.slice(-60).map((p,i,arr)=>{
      const o=i>0?arr[i-1].c:p.c;
      const h=Math.max(o,p.c)*(1+Math.random()*0.005);
      const l=Math.min(o,p.c)*(1-Math.random()*0.005);
      return{t:p.t,o:parseFloat(o.toFixed(2)),h:parseFloat(h.toFixed(2)),l:parseFloat(l.toFixed(2)),c:parseFloat(p.c.toFixed(2)),v:volumes[i]?volumes[i][1]:0};
    });
    const last7Days=priceHistory.slice(-7).map((p,i,arr)=>{
      const open=i>0?arr[i-1].c:p.c;
      return{date:new Date(p.t).toLocaleDateString('en-IN',{day:'numeric',month:'short'}),open:parseFloat(open.toFixed(2)),high:parseFloat((Math.max(open,p.c)*1.003).toFixed(2)),low:parseFloat((Math.min(open,p.c)*0.997).toFixed(2)),close:parseFloat(p.c.toFixed(2)),change:parseFloat(((p.c-open)/open*100).toFixed(2))};
    });
    const patterns=detectPatterns(candles.slice(-10));
    res.json({
      success:true,type:'crypto',
      coinId,name:coinData.name,symbol:coinData.symbol.toUpperCase(),
      image:coinData.image?.small,
      description:(coinData.description?.en||'').replace(/<[^>]+>/g,'').slice(0,300),
      categories:coinData.categories||[],
      price:{
        current:parseFloat(cur.toFixed(4)),
        currentUSD:m.current_price.usd,
        prevClose:parseFloat(prev.toFixed(4)),
        change1d:parseFloat(ch1d.toFixed(2)),
        change7d:parseFloat(ch7d.toFixed(2)),
        change30d:parseFloat(ch30d.toFixed(2)),
        high52:m.high_24h?.inr||null,low52:m.low_24h?.inr||null,
        ath:m.ath?.inr||null,athChangePercent:m.ath_change_percentage?.inr||null,
        dayHigh:m.high_24h?.inr||null,dayLow:m.low_24h?.inr||null,
        volume24h:m.total_volume?.inr||null,volume24hUSD:m.total_volume?.usd||null,
        marketCap:m.market_cap?.inr||null,marketCapUSD:m.market_cap?.usd||null,
        marketCapRank:coinData.market_cap_rank,
        circulatingSupply:m.circulating_supply,maxSupply:m.max_supply,
        currency:'INR'
      },
      indicators:{rsi,macd,bb,sma20,sma50,atr},
      patterns,signal,candles,priceHistory,last7Days,
      updatedAt:new Date().toISOString()
    });
  }catch(err){
    console.error('Crypto error:',err.message);
    res.status(500).json({success:false,error:'Could not fetch crypto data. Check coin name and try again.',detail:err.message});
  }
});

// ─── CRYPTO CHART (different timeframes) ─────────────────────────────────────
app.get('/api/crypto/:coin/chart/:days',async(req,res)=>{
  try{
    const coinId=resolveCryptoId(req.params.coin);
    const days=req.params.days||'30';
    const interval=days<=1?'hourly':'daily';
    const data=await cgGet(`/coins/${coinId}/market_chart`,{vs_currency:'inr',days,interval});
    res.json({success:true,prices:data.prices,volumes:data.total_volumes});
  }catch(err){
    res.status(500).json({success:false,error:'Chart data unavailable'});
  }
});

// ─── CRYPTO SEARCH ────────────────────────────────────────────────────────────
app.get('/api/crypto/search/:query',async(req,res)=>{
  try{
    const q=req.params.query;
    const data=await cgGet('/search',{query:q});
    const coins=(data.coins||[]).slice(0,8).map(c=>({id:c.id,name:c.name,symbol:c.symbol.toUpperCase(),rank:c.market_cap_rank,thumb:c.thumb}));
    res.json({success:true,coins});
  }catch(err){
    res.json({success:true,coins:[]});
  }
});

// ─── CRYPTO MARKET OVERVIEW ───────────────────────────────────────────────────
app.get('/api/crypto/market/overview',async(req,res)=>{
  try{
    const data=await cgGet('/coins/markets',{vs_currency:'inr',order:'market_cap_desc',per_page:20,page:1,price_change_percentage:'24h,7d'});
    const coins=data.map(c=>({
      id:c.id,name:c.name,symbol:c.symbol.toUpperCase(),image:c.image,
      price:c.current_price,change24h:c.price_change_percentage_24h,
      change7d:c.price_change_percentage_7d_in_currency,
      marketCap:c.market_cap,volume24h:c.total_volume,rank:c.market_cap_rank,
      // Simple stability score
      stability:calcStability(c.price_change_percentage_24h,c.price_change_percentage_7d_in_currency,c.market_cap_rank)
    }));
    res.json({success:true,coins,updatedAt:new Date().toISOString()});
  }catch(err){
    res.status(500).json({success:false,error:'Crypto market data unavailable'});
  }
});

function calcStability(ch24,ch7d,rank){
  let score=100;
  const a24=Math.abs(ch24||0),a7=Math.abs(ch7d||0);
  if(a24>20)score-=40;else if(a24>10)score-=25;else if(a24>5)score-=12;else if(a24>2)score-=5;
  if(a7>30)score-=20;else if(a7>15)score-=10;else if(a7>8)score-=5;
  if(rank<=10)score+=15;else if(rank<=25)score+=8;else if(rank<=50)score+=3;else if(rank>200)score-=10;
  return Math.max(0,Math.min(100,score));
}

// ─── ROUTES: NEWS ─────────────────────────────────────────────────────────────
app.get('/api/news/:query',async(req,res)=>{
  try{
    const query=encodeURIComponent(req.params.query+' stock India');
    const rssUrl=`https://news.google.com/rss/search?q=${query}&hl=en-IN&gl=IN&ceid=IN:en`;
    const{data}=await axios.get(rssUrl,{headers:hdrs(),timeout:8000});
    const items=[];
    const matches=data.matchAll(/<item>([\s\S]*?)<\/item>/g);
    for(const m of matches){
      const c=m[1];
      const title=(c.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)||c.match(/<title>(.*?)<\/title>/))?.[1]||'';
      const link=(c.match(/<link>(.*?)<\/link>/))?.[1]||'';
      const pubDate=(c.match(/<pubDate>(.*?)<\/pubDate>/))?.[1]||'';
      const source=(c.match(/<source[^>]*>(.*?)<\/source>/))?.[1]||'Google News';
      if(title) items.push({title:title.trim(),link,pubDate,source:source.trim()});
      if(items.length>=8) break;
    }
    const pos=['surge','gain','profit','rise','bullish','strong','growth','rally','beat','record','buy','boost','jump','up','high'];
    const neg=['fall','drop','loss','decline','bearish','weak','crash','sell','fear','cut','miss','plunge','slip','down','low','risk'];
    const analyzed=items.map(item=>{
      const t=item.title.toLowerCase();
      const p=pos.filter(w=>t.includes(w)).length,n=neg.filter(w=>t.includes(w)).length;
      return{...item,sentiment:p>n?'positive':n>p?'negative':'neutral'};
    });
    res.json({success:true,news:analyzed,count:analyzed.length});
  }catch(err){
    res.status(500).json({success:false,error:'Could not fetch news',news:[]});
  }
});

// ─── ROUTES: FII/DII ──────────────────────────────────────────────────────────
app.get('/api/fiidii',async(req,res)=>{
  try{
    const{data}=await axios.get('https://www.nseindia.com/api/fiidiiTradeReact',{
      headers:{...hdrs(),'Referer':'https://www.nseindia.com','X-Requested-With':'XMLHttpRequest'},timeout:8000
    });
    const rows=Array.isArray(data)?data.slice(0,10):[];
    if(!rows.length) throw new Error('Empty');
    let fiiNet=0,diiNet=0;
    rows.forEach(r=>{fiiNet+=parseFloat(r.fiiNetActivity||r.fii_net||0);diiNet+=parseFloat(r.diiNetActivity||r.dii_net||0);});
    res.json({success:true,source:'NSE Live',fiiNet:parseFloat(fiiNet.toFixed(2)),diiNet:parseFloat(diiNet.toFixed(2)),
      fiiSentiment:fiiNet>0?'buying':fiiNet<0?'selling':'neutral',
      diiSentiment:diiNet>0?'buying':diiNet<0?'selling':'neutral',rows:rows.slice(0,5)});
  }catch(err){
    res.json({success:true,source:'unavailable',fiiNet:null,diiNet:null,
      fiiSentiment:'unavailable',diiSentiment:'unavailable',
      note:'NSE FII/DII data temporarily unavailable.',rows:[]});
  }
});

// ─── ROUTES: PROMOTER ─────────────────────────────────────────────────────────
app.get('/api/promoter/:symbol',async(req,res)=>{
  try{
    const sym=resolveSymbol(req.params.symbol);
    const yahooSym=toYahoo(sym);
    const result=await yfSummary(yahooSym,'majorHoldersBreakdown,insiderHolders,insiderTransactions,netSharePurchaseActivity');
    if(!result) throw new Error('No data');
    const mh=result.majorHoldersBreakdown;
    const promoterHolding=mh?.insidersPercentHeld?.raw?parseFloat((mh.insidersPercentHeld.raw*100).toFixed(2)):null;
    const institutionalHolding=mh?.institutionsPercentHeld?.raw?parseFloat((mh.institutionsPercentHeld.raw*100).toFixed(2)):null;
    const trans=result.insiderTransactions?.transactions||[];
    let buyCount=0,sellCount=0,netShares=0;const recent=[];
    trans.slice(0,10).forEach(t=>{
      const shares=t.shares?.raw||0,val=t.value?.raw||0;
      const txt=(t.transactionText||'').toLowerCase();
      const isBuy=txt.includes('purchase')||txt.includes('buy');
      const isSell=txt.includes('sale')||txt.includes('sell');
      if(isBuy){buyCount++;netShares+=shares;}if(isSell){sellCount++;netShares-=shares;}
      recent.push({name:t.filerName||'—',relation:t.filerRelation||'—',type:isBuy?'BUY':isSell?'SELL':'OTHER',shares:Math.abs(shares),value:val,date:t.startDate?.fmt||'—'});
    });
    let sentiment='neutral',sentimentReason='No recent insider activity';
    if(buyCount>sellCount&&netShares>0){sentiment='positive';sentimentReason=`Insiders bought ${buyCount} time(s) — confidence signal`;}
    else if(sellCount>buyCount&&netShares<0){sentiment='negative';sentimentReason=`Insiders sold ${sellCount} time(s) — possible caution`;}
    let holdingSignal='neutral',holdingNote='';
    if(promoterHolding!==null){
      if(promoterHolding>60){holdingSignal='positive';holdingNote=`High holding ${promoterHolding}% — strong promoter confidence`;}
      else if(promoterHolding<30){holdingSignal='negative';holdingNote=`Low holding ${promoterHolding}% — promoters hold less stake`;}
      else{holdingNote=`Moderate holding ${promoterHolding}%`;}
    }
    res.json({success:true,symbol:sym,promoterHolding,institutionalHolding,insiderBuyCount:buyCount,insiderSellCount:sellCount,
      insiderNetShares:netShares,recentTransactions:recent,sentiment,sentimentReason,holdingSignal,holdingNote});
  }catch(err){
    res.json({success:false,symbol:req.params.symbol,sentiment:'unavailable',sentimentReason:'Promoter data not available',recentTransactions:[]});
  }
});

// ─── ROUTES: FINANCIALS ───────────────────────────────────────────────────────
app.get('/api/financials/:symbol',async(req,res)=>{
  try{
    const sym=resolveSymbol(req.params.symbol);
    const yahooSym=toYahoo(sym);
    const result=await yfSummary(yahooSym,'incomeStatementHistory,defaultKeyStatistics,financialData');
    if(!result) throw new Error('No data');
    const fd=result.financialData,ks=result.defaultKeyStatistics;
    const income=result.incomeStatementHistory?.incomeStatementHistory||[];
    const quarters=income.slice(0,4).map(q=>({date:new Date(q.endDate.raw*1000).toLocaleDateString('en-IN',{month:'short',year:'2-digit'}),revenue:q.totalRevenue?.raw||null,netIncome:q.netIncome?.raw||null,eps:q.basicEPS?.raw||null}));
    res.json({success:true,symbol:sym,keyStats:{pe:ks?.trailingPE?.raw||null,pb:ks?.priceToBook?.raw||null,eps:ks?.trailingEps?.raw||null,roe:fd?.returnOnEquity?.raw?parseFloat((fd.returnOnEquity.raw*100).toFixed(2)):null,debtToEquity:fd?.debtToEquity?.raw||null,currentRatio:fd?.currentRatio?.raw||null,revenueGrowth:fd?.revenueGrowth?.raw?parseFloat((fd.revenueGrowth.raw*100).toFixed(2)):null,profitMargin:fd?.profitMargins?.raw?parseFloat((fd.profitMargins.raw*100).toFixed(2)):null,dividendYield:ks?.dividendYield?.raw?parseFloat((ks.dividendYield.raw*100).toFixed(2)):null,beta:ks?.beta?.raw||null},quarters});
  }catch(err){
    res.status(500).json({success:false,error:'Financial data unavailable'});
  }
});

// ─── ROUTES: MARKET ───────────────────────────────────────────────────────────
app.get('/api/market',async(req,res)=>{
  try{
    const indices=['^NSEI','^BSESN','GOLDBEES.NS','NIFTYBEES.NS'];
    const names=['Nifty 50','Sensex','Gold BeES','Nifty BeES'];
    const results=await Promise.allSettled(indices.map(s=>yfFetch(s,'5d','1d')));
    const market=results.map((r,i)=>{
      if(r.status!=='fulfilled') return null;
      const meta=r.value?.chart?.result?.[0]?.meta;
      if(!meta?.regularMarketPrice) return null;
      const price=meta.regularMarketPrice,prev=meta.chartPreviousClose||price;
      return{name:names[i],symbol:indices[i],price,prevClose:prev,change:prev?parseFloat(((price-prev)/prev*100).toFixed(2)):0};
    }).filter(Boolean);
    res.json({success:true,market});
  }catch(err){
    res.status(500).json({success:false,error:'Market data unavailable'});
  }
});

app.listen(PORT,()=>console.log(`Indian Stock + Crypto Research API running on port ${PORT}`));

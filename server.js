const express = require('express');
const cors    = require('cors');
const axios   = require('axios');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ─── SYMBOL MAPS ──────────────────────────────────────────────────────────────
// NSE symbol → Yahoo Finance symbol
const NSE_TO_YAHOO = {
  'TCS':'TCS.NS','INFY':'INFY.NS','WIPRO':'WIPRO.NS','HCLTECH':'HCLTECH.NS',
  'TECHM':'TECHM.NS','LTIM':'LTIM.NS','COFORGE':'COFORGE.NS','PERSISTENT':'PERSISTENT.NS',
  'MPHASIS':'MPHASIS.NS','TATAELXSI':'TATAELXSI.NS',
  'HDFCBANK':'HDFCBANK.NS','ICICIBANK':'ICICIBANK.NS','SBIN':'SBIN.NS','AXISBANK':'AXISBANK.NS',
  'KOTAKBANK':'KOTAKBANK.NS','INDUSINDBK':'INDUSINDBK.NS','BANDHANBNK':'BANDHANBNK.NS',
  'FEDERALBNK':'FEDERALBNK.NS','IDFCFIRSTB':'IDFCFIRSTB.NS','AUBANK':'AUBANK.NS',
  'YESBANK':'YESBANK.NS','CANBK':'CANBK.NS','BANKBARODA':'BANKBARODA.NS','UNIONBANK':'UNIONBANK.NS',
  'BAJFINANCE':'BAJFINANCE.NS','BAJAJFINSV':'BAJAJFINSV.NS','CHOLAFIN':'CHOLAFIN.NS',
  'MUTHOOTFIN':'MUTHOOTFIN.NS','MANAPPURAM':'MANAPPURAM.NS','SUNDARMFIN':'SUNDARMFIN.NS',
  'RELIANCE':'RELIANCE.NS','ONGC':'ONGC.NS','BPCL':'BPCL.NS','IOC':'IOC.NS',
  'HINDPETRO':'HINDPETRO.NS','OIL':'OIL.NS','GAIL':'GAIL.NS','IGL':'IGL.NS',
  'GUJARATGAS':'GUJARATGAS.NS','PETRONET':'PETRONET.NS','ATGL':'ATGL.NS',
  'NTPC':'NTPC.NS','POWERGRID':'POWERGRID.NS','TATAPOWER':'TATAPOWER.NS',
  'ADANIGREEN':'ADANIGREEN.NS','ADANIPORTS':'ADANIPORTS.NS','ADANIENT':'ADANIENT.NS',
  'ADANIPOWER':'ADANIPOWER.NS','CESC':'CESC.NS','NHPC':'NHPC.NS','SJVN':'SJVN.NS',
  'HINDUNILVR':'HINDUNILVR.NS','ITC':'ITC.NS','NESTLEIND':'NESTLEIND.NS','BRITANNIA':'BRITANNIA.NS',
  'DABUR':'DABUR.NS','MARICO':'MARICO.NS','COLPAL':'COLPAL.NS','EMAMILTD':'EMAMILTD.NS',
  'GODREJCP':'GODREJCP.NS','PGHH':'PGHH.NS',
  'TATAMOTORS':'TATAMOTORS.NS','MARUTI':'MARUTI.NS','M&M':'M&M.NS','BAJAJ-AUTO':'BAJAJ-AUTO.NS',
  'HEROMOTOCO':'HEROMOTOCO.NS','TVSMOTOR':'TVSMOTOR.NS','EICHERMOT':'EICHERMOT.NS',
  'ASHOKLEY':'ASHOKLEY.NS','ESCORTS':'ESCORTS.NS','TIINDIA':'TIINDIA.NS',
  'SUNPHARMA':'SUNPHARMA.NS','DRREDDY':'DRREDDY.NS','CIPLA':'CIPLA.NS','LUPIN':'LUPIN.NS',
  'DIVISLAB':'DIVISLAB.NS','BIOCON':'BIOCON.NS','TORNTPHARM':'TORNTPHARM.NS',
  'AUROPHARMA':'AUROPHARMA.NS','ALKEM':'ALKEM.NS','GLAND':'GLAND.NS',
  'ZYDUSLIFE':'ZYDUSLIFE.NS','GRANULES':'GRANULES.NS',
  'TATASTEEL':'TATASTEEL.NS','HINDALCO':'HINDALCO.NS','JSWSTEEL':'JSWSTEEL.NS',
  'SAIL':'SAIL.NS','NMDC':'NMDC.NS','COALINDIA':'COALINDIA.NS','VEDL':'VEDL.NS',
  'HINDCOPPER':'HINDCOPPER.NS','HINDZINC':'HINDZINC.NS',
  'LT':'LT.NS','ULTRACEMCO':'ULTRACEMCO.NS','SHREECEM':'SHREECEM.NS','AMBUJACEM':'AMBUJACEM.NS',
  'ACC':'ACC.NS','GODREJPROP':'GODREJPROP.NS','DLF':'DLF.NS','OBEROIRLTY':'OBEROIRLTY.NS',
  'PHOENIXLTD':'PHOENIXLTD.NS','PRESTIGE':'PRESTIGE.NS',
  'ASIANPAINT':'ASIANPAINT.NS','BERGEPAINT':'BERGEPAINT.NS','PIDILITIND':'PIDILITIND.NS',
  'HAVELLS':'HAVELLS.NS','POLYCAB':'POLYCAB.NS','VOLTAS':'VOLTAS.NS','CROMPTON':'CROMPTON.NS',
  'TITAN':'TITAN.NS','TRENT':'TRENT.NS','DMART':'DMART.NS','NYKAA':'NYKAA.NS',
  'ZOMATO':'ZOMATO.NS','PAYTM':'PAYTM.NS','POLICYBZR':'POLICYBZR.NS','CARTRADE':'CARTRADE.NS',
  'NAUKRI':'NAUKRI.NS','INDIAMART':'INDIAMART.NS','JUSTDIAL':'JUSTDIAL.NS',
  'IRCTC':'IRCTC.NS','HAL':'HAL.NS','BEL':'BEL.NS','BHEL':'BHEL.NS',
  'COCHINSHIP':'COCHINSHIP.NS','RVNL':'RVNL.NS','IRFC':'IRFC.NS',
  'RECLTD':'RECLTD.NS','PFC':'PFC.NS','LICI':'LICI.NS',
  'SBICARD':'SBICARD.NS','SBILIFE':'SBILIFE.NS','HDFCLIFE':'HDFCLIFE.NS',
  'HDFCAMC':'HDFCAMC.NS','ICICIGI':'ICICIGI.NS','ICICIPRULI':'ICICIPRULI.NS',
  'BHARTIARTL':'BHARTIARTL.NS','INDUSTOWER':'INDUSTOWER.NS','IDEA':'IDEA.NS',
  'MOTHERSUMI':'MOTHERSUMI.NS','BOSCHLTD':'BOSCHLTD.NS','BHARATFORG':'BHARATFORG.NS',
  'SIEMENS':'SIEMENS.NS','ABB':'ABB.NS','CUMMINSIND':'CUMMINSIND.NS',
  'PAGEIND':'PAGEIND.NS','VBL':'VBL.NS','MCDOWELL-N':'MCDOWELL-N.NS','UBL':'UBL.NS',
  'APOLLOHOSP':'APOLLOHOSP.NS','MAXHEALTH':'MAXHEALTH.NS','FORTIS':'FORTIS.NS',
  'ABCAPITAL':'ABCAPITAL.NS','ABFRL':'ABFRL.NS',
};

// Company name → NSE symbol (for search by name)
const NAME_MAP = {
  'TCS':'TCS','TATA CONSULTANCY':'TCS','TATA CONSULTANCY SERVICES':'TCS',
  'INFOSYS':'INFY','INFY':'INFY',
  'WIPRO':'WIPRO','HCL TECH':'HCLTECH','HCL TECHNOLOGIES':'HCLTECH','HCLTECH':'HCLTECH',
  'TECH MAHINDRA':'TECHM','TECHM':'TECHM',
  'HDFC BANK':'HDFCBANK','HDFCBANK':'HDFCBANK',
  'ICICI BANK':'ICICIBANK','ICICIBANK':'ICICIBANK',
  'SBI':'SBIN','STATE BANK':'SBIN','STATE BANK OF INDIA':'SBIN','SBIN':'SBIN',
  'AXIS BANK':'AXISBANK','AXISBANK':'AXISBANK',
  'KOTAK BANK':'KOTAKBANK','KOTAK MAHINDRA':'KOTAKBANK','KOTAKBANK':'KOTAKBANK',
  'YES BANK':'YESBANK','YESBANK':'YESBANK',
  'BAJAJ FINANCE':'BAJFINANCE','BAJFINANCE':'BAJFINANCE',
  'RELIANCE':'RELIANCE','RELIANCE INDUSTRIES':'RELIANCE',
  'ONGC':'ONGC','BPCL':'BPCL','IOC':'IOC','INDIAN OIL':'IOC',
  'GAIL':'GAIL','NTPC':'NTPC',
  'POWER GRID':'POWERGRID','POWERGRID':'POWERGRID','POWER GRID CORP':'POWERGRID',
  'TATA POWER':'TATAPOWER','TATAPOWER':'TATAPOWER',
  'ADANI GREEN':'ADANIGREEN','ADANIGREEN':'ADANIGREEN',
  'ADANI PORTS':'ADANIPORTS','ADANIPORTS':'ADANIPORTS',
  'ADANI ENTERPRISES':'ADANIENT','ADANIENT':'ADANIENT',
  'HUL':'HINDUNILVR','HINDUSTAN UNILEVER':'HINDUNILVR','HINDUNILVR':'HINDUNILVR',
  'ITC':'ITC','NESTLE':'NESTLEIND','NESTLEIND':'NESTLEIND','NESTLE INDIA':'NESTLEIND',
  'BRITANNIA':'BRITANNIA','DABUR':'DABUR','MARICO':'MARICO',
  'TATA MOTORS':'TATAMOTORS','TATAMOTORS':'TATAMOTORS',
  'MARUTI':'MARUTI','MARUTI SUZUKI':'MARUTI',
  'MAHINDRA':'M&M','M&M':'M&M',
  'BAJAJ AUTO':'BAJAJ-AUTO','BAJAJ-AUTO':'BAJAJ-AUTO',
  'HERO MOTO':'HEROMOTOCO','HERO MOTOCORP':'HEROMOTOCO','HEROMOTOCO':'HEROMOTOCO',
  'TVS MOTOR':'TVSMOTOR','TVSMOTOR':'TVSMOTOR',
  'EICHER MOTORS':'EICHERMOT','EICHERMOT':'EICHERMOT',
  'SUN PHARMA':'SUNPHARMA','SUNPHARMA':'SUNPHARMA','SUN PHARMACEUTICAL':'SUNPHARMA',
  'DR REDDY':'DRREDDY','DR REDDYS':'DRREDDY','DRREDDY':'DRREDDY',
  'CIPLA':'CIPLA','LUPIN':'LUPIN','BIOCON':'BIOCON','DIVISLAB':'DIVISLAB',
  'ZYDUS':'ZYDUSLIFE','ZYDUSLIFE':'ZYDUSLIFE',
  'TATA STEEL':'TATASTEEL','TATASTEEL':'TATASTEEL',
  'HINDALCO':'HINDALCO','JSW STEEL':'JSWSTEEL','JSWSTEEL':'JSWSTEEL',
  'COAL INDIA':'COALINDIA','COALINDIA':'COALINDIA',
  'VEDANTA':'VEDL','VEDL':'VEDL',
  'HINDUSTAN ZINC':'HINDZINC','HINDZINC':'HINDZINC',
  'L&T':'LT','LARSEN':'LT','LT':'LT',
  'ULTRATECH':'ULTRACEMCO','ULTRATECH CEMENT':'ULTRACEMCO','ULTRACEMCO':'ULTRACEMCO',
  'ASIAN PAINTS':'ASIANPAINT','ASIANPAINT':'ASIANPAINT',
  'HAVELLS':'HAVELLS','POLYCAB':'POLYCAB','TITAN':'TITAN',
  'ZOMATO':'ZOMATO','PAYTM':'PAYTM','NAUKRI':'NAUKRI','INFO EDGE':'NAUKRI',
  'IRCTC':'IRCTC','HAL':'HAL','BEL':'BEL','BHEL':'BHEL','RVNL':'RVNL',
  'REC':'RECLTD','RECLTD':'RECLTD','PFC':'PFC','POWER FINANCE':'PFC',
  'LIC':'LICI','LIC OF INDIA':'LICI','LICI':'LICI',
  'SBI CARDS':'SBICARD','SBICARD':'SBICARD',
  'SBI LIFE':'SBILIFE','SBILIFE':'SBILIFE',
  'HDFC LIFE':'HDFCLIFE','HDFCLIFE':'HDFCLIFE',
  'HDFC AMC':'HDFCAMC','HDFCAMC':'HDFCAMC',
  'ICICI LOMBARD':'ICICIGI','ICICIGI':'ICICIGI',
  'BHARTI AIRTEL':'BHARTIARTL','AIRTEL':'BHARTIARTL','BHARTIARTL':'BHARTIARTL',
  'APOLLO HOSPITALS':'APOLLOHOSP','APOLLOHOSP':'APOLLOHOSP',
  'MAX HEALTHCARE':'MAXHEALTH','MAXHEALTH':'MAXHEALTH',
  'INDUSIND BANK':'INDUSINDBK','INDUSINDBK':'INDUSINDBK',
  'DMART':'DMART','AVENUE SUPERMARTS':'DMART',
  'TRENT':'TRENT','NYKAA':'NYKAA',
  'PIDILITE':'PIDILITIND','PIDILITIND':'PIDILITIND',
  'SIEMENS':'SIEMENS','ABB':'ABB','BOSCH':'BOSCHLTD','BOSCHLTD':'BOSCHLTD',
  'MOTHERSON':'MOTHERSUMI','BHARAT FORGE':'BHARATFORG','BHARATFORG':'BHARATFORG',
  'CUMMINS':'CUMMINSIND','CUMMINSIND':'CUMMINSIND',
  'VBL':'VBL','VARUN BEVERAGES':'VBL',
  'GRASIM':'GRASIM','SHREE CEMENT':'SHREECEM','SHREECEM':'SHREECEM',
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
  'COCHIN SHIPYARD':'COCHINSHIP','COCHINSHIP':'COCHINSHIP',
  'PAGE INDUSTRIES':'PAGEIND','PAGEIND':'PAGEIND',
  'BERGER PAINTS':'BERGEPAINT','BERGEPAINT':'BERGEPAINT',
  'VOLTAS':'VOLTAS','CROMPTON':'CROMPTON',
  'FORTIS':'FORTIS','FORTIS HEALTHCARE':'FORTIS',
  'ABFRL':'ABFRL','ADANI TOTAL GAS':'ATGL','ATGL':'ATGL',
  'TATA CONSUMER':'TATACONSUM','TATACONSUM':'TATACONSUM',
  'DIVI LAB':'DIVISLAB','DIVI LABORATORIES':'DIVISLAB',
  'TORRENT PHARMA':'TORNTPHARM','TORNTPHARM':'TORNTPHARM',
};

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

// ─── TECHNICAL INDICATORS ────────────────────────────────────────────────────
function calcRSI(closes, period=14){
  if(closes.length < period+1) return null;
  let gains=0, losses=0;
  for(let i=1;i<=period;i++){
    const d=closes[i]-closes[i-1];
    if(d>=0) gains+=d; else losses-=d;
  }
  let ag=gains/period, al=losses/period;
  for(let i=period+1;i<closes.length;i++){
    const d=closes[i]-closes[i-1];
    ag=(ag*(period-1)+Math.max(d,0))/period;
    al=(al*(period-1)+Math.max(-d,0))/period;
  }
  if(al===0) return 100;
  return parseFloat((100-100/(1+ag/al)).toFixed(2));
}
function calcEMA(data,period){
  const k=2/(period+1); let ema=data[0];
  const result=[ema];
  for(let i=1;i<data.length;i++){ ema=data[i]*k+ema*(1-k); result.push(parseFloat(ema.toFixed(2))); }
  return result;
}
function calcMACD(closes){
  if(closes.length<26) return null;
  const ema12=calcEMA(closes,12), ema26=calcEMA(closes,26);
  const macdLine=ema12.map((v,i)=>parseFloat((v-ema26[i]).toFixed(2)));
  const signal=calcEMA(macdLine.slice(9),9);
  const last=macdLine.length-1;
  const lastSignal=signal[signal.length-1];
  const histogram=parseFloat((macdLine[last]-lastSignal).toFixed(2));
  return { macd:macdLine[last], signal:lastSignal, histogram, trend:histogram>0?'bullish':'bearish' };
}
function calcBollingerBands(closes,period=20){
  if(closes.length<period) return null;
  const slice=closes.slice(-period);
  const mean=slice.reduce((a,b)=>a+b,0)/period;
  const std=Math.sqrt(slice.reduce((a,b)=>a+Math.pow(b-mean,2),0)/period);
  return { upper:parseFloat((mean+2*std).toFixed(2)), middle:parseFloat(mean.toFixed(2)), lower:parseFloat((mean-2*std).toFixed(2)), bandwidth:parseFloat(((4*std/mean)*100).toFixed(2)) };
}
function calcSMA(closes,period){
  if(closes.length<period) return null;
  const slice=closes.slice(-period);
  return parseFloat((slice.reduce((a,b)=>a+b,0)/period).toFixed(2));
}
function calcATR(highs,lows,closes,period=14){
  if(highs.length<period+1) return null;
  const trs=[];
  for(let i=1;i<highs.length;i++){
    trs.push(Math.max(highs[i]-lows[i],Math.abs(highs[i]-closes[i-1]),Math.abs(lows[i]-closes[i-1])));
  }
  return parseFloat((trs.slice(-period).reduce((a,b)=>a+b,0)/period).toFixed(2));
}
function detectCandlePatterns(ohlcv){
  const patterns=[]; const n=ohlcv.length;
  if(n<3) return patterns;
  const last=ohlcv[n-1],prev=ohlcv[n-2],prev2=ohlcv[n-3];
  const body=c=>Math.abs(c.close-c.open), range=c=>c.high-c.low;
  const isGreen=c=>c.close>c.open, isRed=c=>c.close<c.open;
  if(body(last)/range(last)<0.1) patterns.push({name:'Doji',type:'neutral',desc:'Indecision — buyers and sellers balanced. Watch next candle for direction.'});
  if(isGreen(last)&&(last.low<last.open-range(last)*0.6)&&body(last)/range(last)>0.3) patterns.push({name:'Hammer',type:'bullish',desc:'Strong bullish reversal. Price fell but buyers pushed back strongly.'});
  if(isRed(last)&&(last.high>last.close+range(last)*0.6)&&body(last)/range(last)>0.3) patterns.push({name:'Shooting Star',type:'bearish',desc:'Bearish reversal. Price rose but sellers pushed it back down.'});
  if(isRed(prev)&&isGreen(last)&&last.open<prev.close&&last.close>prev.open) patterns.push({name:'Bullish Engulfing',type:'bullish',desc:'Strong BUY signal! Green candle covered the red candle. Buyers taking control.'});
  if(isGreen(prev)&&isRed(last)&&last.open>prev.close&&last.close<prev.open) patterns.push({name:'Bearish Engulfing',type:'bearish',desc:'Strong SELL signal! Red candle covered the green candle. Sellers taking control.'});
  if(isRed(prev2)&&body(prev)/range(prev)<0.3&&isGreen(last)&&last.close>(prev2.open+prev2.close)/2) patterns.push({name:'Morning Star',type:'bullish',desc:'Very strong 3-candle bullish reversal. High probability of upward move.'});
  if(isGreen(prev2)&&body(prev)/range(prev)<0.3&&isRed(last)&&last.close<(prev2.open+prev2.close)/2) patterns.push({name:'Evening Star',type:'bearish',desc:'Very strong 3-candle bearish reversal. High probability of downward move.'});
  if(isGreen(last)&&isGreen(prev)&&isGreen(prev2)&&last.close>prev.close&&prev.close>prev2.close) patterns.push({name:'Three White Soldiers',type:'bullish',desc:'Three green candles rising. Very strong bullish momentum.'});
  if(isRed(last)&&isRed(prev)&&isRed(prev2)&&last.close<prev.close&&prev.close<prev2.close) patterns.push({name:'Three Black Crows',type:'bearish',desc:'Three red candles falling. Very strong bearish momentum.'});
  return patterns;
}
function generateSignal(rsi,macd,sma20,sma50,price,change7d){
  let bull=0, bear=0; const reasons=[];
  if(rsi!==null){
    if(rsi<30){bull+=2;reasons.push({signal:'bull',text:`RSI ${rsi} — Oversold! Stock is cheap, likely to bounce up`});}
    else if(rsi>70){bear+=2;reasons.push({signal:'bear',text:`RSI ${rsi} — Overbought! Stock may fall soon`});}
    else if(rsi>=40&&rsi<=60){bull+=1;reasons.push({signal:'bull',text:`RSI ${rsi} — Healthy zone, no extreme pressure`});}
    else if(rsi>60){bull+=1;reasons.push({signal:'bull',text:`RSI ${rsi} — Moderately bullish`});}
    else{bear+=1;reasons.push({signal:'bear',text:`RSI ${rsi} — Slightly weak`});}
  }
  if(macd){
    if(macd.trend==='bullish'){bull+=2;reasons.push({signal:'bull',text:`MACD positive (+${macd.histogram}) — Buying momentum stronger`});}
    else{bear+=2;reasons.push({signal:'bear',text:`MACD negative (${macd.histogram}) — Selling momentum stronger`});}
  }
  if(sma20&&sma50&&price){
    if(price>sma20&&sma20>sma50){bull+=2;reasons.push({signal:'bull',text:`Price above 20 & 50 day average — Uptrend confirmed`});}
    else if(price<sma20&&sma20<sma50){bear+=2;reasons.push({signal:'bear',text:`Price below 20 & 50 day average — Downtrend`});}
    else if(price>sma20){bull+=1;reasons.push({signal:'bull',text:`Price above 20-day average — Short term trend positive`});}
    else{bear+=1;reasons.push({signal:'bear',text:`Price below 20-day average — Short term trend weak`});}
  }
  if(change7d!==null){
    if(change7d>3){bull+=1;reasons.push({signal:'bull',text:`+${change7d.toFixed(1)}% this week — Strong buying`});}
    else if(change7d<-3){bear+=1;reasons.push({signal:'bear',text:`${change7d.toFixed(1)}% this week — Selling pressure`});}
    else{reasons.push({signal:'neutral',text:`${change7d.toFixed(1)}% this week — Sideways`});}
  }
  const total=bull+bear;
  let overall,confidence;
  if(bull>bear+1){overall='BUY';confidence=Math.round((bull/Math.max(total,1))*100);}
  else if(bear>bull+1){overall='SELL';confidence=Math.round((bear/Math.max(total,1))*100);}
  else{overall='HOLD';confidence=55;}
  return{overall,confidence,bullPoints:bull,bearPoints:bear,reasons};
}

// ─── YAHOO FINANCE FETCH (with retries + crumb) ───────────────────────────────
let _crumb=null;
const UA_LIST=[
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
];
let _uaIdx=0;
function ua(){ return UA_LIST[(_uaIdx++)%UA_LIST.length]; }
function hdrs(extra={}){ return {'User-Agent':ua(),'Accept':'application/json','Accept-Language':'en-US,en;q=0.9','Referer':'https://finance.yahoo.com',...extra}; }

async function getCrumb(){
  if(_crumb) return _crumb;
  const urls=['https://query1.finance.yahoo.com/v1/test/getcrumb','https://query2.finance.yahoo.com/v1/test/getcrumb'];
  for(const u of urls){
    try{
      const r=await axios.get(u,{headers:hdrs(),timeout:8000});
      if(r.data&&typeof r.data==='string'&&r.data.length<100&&!r.data.includes('<')){
        _crumb=r.data.trim(); return _crumb;
      }
    }catch(e){}
  }
  return null;
}

async function yfFetch(yahooSym, range='6mo', interval='1d'){
  const crumb=await getCrumb();
  const cp=crumb?`&crumb=${encodeURIComponent(crumb)}`:'';
  const bases=['https://query1.finance.yahoo.com','https://query2.finance.yahoo.com'];
  for(const base of bases){
    for(let attempt=0;attempt<2;attempt++){
      try{
        const url=`${base}/v8/finance/chart/${yahooSym}?interval=${interval}&range=${range}${cp}`;
        const r=await axios.get(url,{headers:hdrs(),timeout:15000});
        const res=r.data?.chart?.result;
        if(res&&res.length>0&&res[0].meta&&res[0].meta.regularMarketPrice){
          return r.data;
        }
      }catch(e){
        if(e.response?.status===401||e.response?.status===403){ _crumb=null; }
        await new Promise(r=>setTimeout(r,800));
      }
    }
  }
  // Last resort: v7 quote
  try{
    const r=await axios.get(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${yahooSym}`,{headers:hdrs(),timeout:10000});
    const q=r.data?.quoteResponse?.result?.[0];
    if(q&&q.regularMarketPrice){
      return {chart:{result:[{
        meta:{
          regularMarketPrice:q.regularMarketPrice,
          chartPreviousClose:q.regularMarketPreviousClose,
          regularMarketDayHigh:q.regularMarketDayHigh,
          regularMarketDayLow:q.regularMarketDayLow,
          regularMarketVolume:q.regularMarketVolume,
          averageDailyVolume3Month:q.averageDailyVolume3Month,
          fiftyTwoWeekHigh:q.fiftyTwoWeekHigh,
          fiftyTwoWeekLow:q.fiftyTwoWeekLow,
          marketCap:q.marketCap,
          currency:q.currency||'INR',
          symbol:yahooSym
        },
        timestamp:[],
        indicators:{quote:[{open:[],high:[],low:[],close:[],volume:[]}]}
      }]}};
    }
  }catch(e){}
  throw new Error(`Could not fetch data for ${yahooSym}`);
}

async function yfSummary(yahooSym, modules){
  const crumb=await getCrumb();
  const cp=crumb?`&crumb=${encodeURIComponent(crumb)}`:'';
  const bases=['https://query1.finance.yahoo.com','https://query2.finance.yahoo.com'];
  for(const base of bases){
    try{
      const url=`${base}/v10/finance/quoteSummary/${yahooSym}?modules=${modules}${cp}`;
      const r=await axios.get(url,{headers:hdrs(),timeout:12000});
      const res=r.data?.quoteSummary?.result;
      if(res&&res.length>0) return res[0];
    }catch(e){
      if(e.response?.status===401||e.response?.status===403){ _crumb=null; }
    }
  }
  return null;
}

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get('/', (_req, res) => res.json({status:'Indian Stock Research API is running!', version:'2.0'}));

// ─── SYMBOL RESOLVE ───────────────────────────────────────────────────────────
app.get('/api/resolve/:input', (req,res)=>{
  const sym=resolveSymbol(req.params.input);
  res.json({success:true, symbol:sym, yahooSymbol:toYahoo(sym)});
});

// ─── SYMBOL SEARCH ────────────────────────────────────────────────────────────
app.get('/api/search/:query', async (req,res)=>{
  try{
    const q=req.params.query.toUpperCase().trim();
    const results=[];
    Object.entries(NAME_MAP).forEach(([name,sym])=>{
      if(name.includes(q)||sym.includes(q)||q.includes(sym)){
        if(!results.find(r=>r.symbol===sym)) results.push({name,symbol:sym});
      }
    });
    res.json({success:true, results:results.slice(0,8)});
  }catch(e){ res.json({success:true, results:[]}); }
});

// ─── MAIN STOCK DATA ──────────────────────────────────────────────────────────
app.get('/api/stock/:symbol', async (req,res)=>{
  try{
    const sym=resolveSymbol(req.params.symbol);
    const yahooSym=toYahoo(sym);

    const data=await yfFetch(yahooSym,'6mo','1d');
    const result=data.chart.result[0];
    const meta=result.meta;
    const timestamps=result.timestamp||[];
    const q=result.indicators?.quote?.[0]||{open:[],high:[],low:[],close:[],volume:[]};

    const valid=timestamps.length>0
      ?timestamps.map((t,i)=>({t,open:q.open[i],high:q.high[i],low:q.low[i],close:q.close[i],volume:q.volume[i]}))
               .filter(c=>c.open&&c.high&&c.low&&c.close)
      :[];

    const allCloses=valid.map(c=>c.close);
    const allHighs=valid.map(c=>c.high);
    const allLows=valid.map(c=>c.low);

    const currentPrice=meta.regularMarketPrice||allCloses[allCloses.length-1]||0;
    const prevClose=meta.chartPreviousClose||allCloses[allCloses.length-2]||currentPrice;
    const change1d=parseFloat(((currentPrice-prevClose)/prevClose*100).toFixed(2));
    const change7d=valid.length>=7?parseFloat(((currentPrice-valid[valid.length-7].close)/valid[valid.length-7].close*100).toFixed(2)):null;
    const change30d=valid.length>=30?parseFloat(((currentPrice-valid[valid.length-30].close)/valid[valid.length-30].close*100).toFixed(2)):null;

    const rsi=calcRSI(allCloses);
    const macd=calcMACD(allCloses);
    const bb=calcBollingerBands(allCloses);
    const sma20=calcSMA(allCloses,20);
    const sma50=calcSMA(allCloses,50);
    const sma200=calcSMA(allCloses,200);
    const atr=calcATR(allHighs,allLows,allCloses);
    const patterns=detectCandlePatterns(valid.slice(-10));
    const signal=generateSignal(rsi,macd,sma20,sma50,currentPrice,change7d);

    const candles=valid.slice(-90).map(c=>({t:c.t*1000,o:parseFloat(c.open.toFixed(2)),h:parseFloat(c.high.toFixed(2)),l:parseFloat(c.low.toFixed(2)),c:parseFloat(c.close.toFixed(2)),v:c.volume}));
    const priceHistory=valid.slice(-60).map(c=>({t:c.t*1000,c:parseFloat(c.close.toFixed(2))}));
    const last7Days=valid.slice(-7).map(c=>({
      date:new Date(c.t*1000).toLocaleDateString('en-IN',{day:'numeric',month:'short'}),
      open:parseFloat(c.open.toFixed(2)),high:parseFloat(c.high.toFixed(2)),
      low:parseFloat(c.low.toFixed(2)),close:parseFloat(c.close.toFixed(2)),
      volume:c.volume,change:parseFloat(((c.close-c.open)/c.open*100).toFixed(2))
    }));

    res.json({
      success:true, symbol:sym, yahooSymbol:yahooSym,
      price:{
        current:parseFloat(currentPrice.toFixed(2)), prevClose:parseFloat(prevClose.toFixed(2)),
        change1d, change7d, change30d,
        high52:meta.fiftyTwoWeekHigh||Math.max(...allHighs)||0,
        low52:meta.fiftyTwoWeekLow||Math.min(...allLows)||0,
        dayHigh:meta.regularMarketDayHigh||null, dayLow:meta.regularMarketDayLow||null,
        volume:meta.regularMarketVolume||null, avgVolume:meta.averageDailyVolume3Month||null,
        marketCap:meta.marketCap||null, currency:meta.currency||'INR'
      },
      indicators:{rsi,macd,bb,sma20,sma50,sma200,atr},
      patterns, signal, candles, priceHistory, last7Days,
      updatedAt:new Date().toISOString()
    });
  }catch(err){
    console.error('Stock error:',err.message);
    res.status(500).json({success:false, error:'Could not fetch stock data. Please try again in a moment.', detail:err.message});
  }
});

// ─── NEWS ─────────────────────────────────────────────────────────────────────
app.get('/api/news/:query', async (req,res)=>{
  try{
    const query=encodeURIComponent(req.params.query+' NSE stock India');
    const rssUrl=`https://news.google.com/rss/search?q=${query}&hl=en-IN&gl=IN&ceid=IN:en`;
    const {data}=await axios.get(rssUrl,{headers:hdrs(),timeout:8000});
    const items=[];
    const itemMatches=data.matchAll(/<item>([\s\S]*?)<\/item>/g);
    for(const match of itemMatches){
      const content=match[1];
      const title=(content.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)||content.match(/<title>(.*?)<\/title>/))?.[1]||'';
      const link=(content.match(/<link>(.*?)<\/link>/))?.[1]||'';
      const pubDate=(content.match(/<pubDate>(.*?)<\/pubDate>/))?.[1]||'';
      const source=(content.match(/<source[^>]*>(.*?)<\/source>/))?.[1]||'Google News';
      if(title) items.push({title:title.trim(),link,pubDate,source:source.trim()});
      if(items.length>=8) break;
    }
    const positive=['surge','gain','profit','rise','bullish','strong','growth','rally','beat','record','up','buy','positive','increase','high','boost','jump'];
    const negative=['fall','drop','loss','decline','bearish','weak','crash','sell','negative','down','low','risk','concern','fear','cut','miss','plunge','slip'];
    const analyzed=items.map(item=>{
      const text=item.title.toLowerCase();
      const pos=positive.filter(w=>text.includes(w)).length;
      const neg=negative.filter(w=>text.includes(w)).length;
      return{...item, sentiment:pos>neg?'positive':neg>pos?'negative':'neutral'};
    });
    res.json({success:true, news:analyzed, count:analyzed.length});
  }catch(err){
    res.status(500).json({success:false, error:'Could not fetch news', news:[]});
  }
});

// ─── FII/DII ──────────────────────────────────────────────────────────────────
app.get('/api/fiidii', async (req,res)=>{
  try{
    const url='https://www.nseindia.com/api/fiidiiTradeReact';
    const {data}=await axios.get(url,{
      headers:{...hdrs(),'Referer':'https://www.nseindia.com','X-Requested-With':'XMLHttpRequest'},
      timeout:8000
    });
    const rows=Array.isArray(data)?data.slice(0,10):[];
    if(!rows.length) throw new Error('Empty');
    let fiiNet=0,diiNet=0;
    rows.forEach(r=>{
      fiiNet+=parseFloat(r.fiiNetActivity||r.fii_net||0);
      diiNet+=parseFloat(r.diiNetActivity||r.dii_net||0);
    });
    res.json({success:true,source:'NSE Live',fiiNet:parseFloat(fiiNet.toFixed(2)),diiNet:parseFloat(diiNet.toFixed(2)),
      fiiSentiment:fiiNet>0?'buying':fiiNet<0?'selling':'neutral',
      diiSentiment:diiNet>0?'buying':diiNet<0?'selling':'neutral',
      rows:rows.slice(0,5),updatedAt:new Date().toISOString()});
  }catch(err){
    res.json({success:true,source:'unavailable',fiiNet:null,diiNet:null,
      fiiSentiment:'unavailable',diiSentiment:'unavailable',
      note:'NSE FII/DII data temporarily unavailable. Check nseindia.com directly.',rows:[]});
  }
});

// ─── PROMOTER ─────────────────────────────────────────────────────────────────
app.get('/api/promoter/:symbol', async (req,res)=>{
  try{
    const sym=resolveSymbol(req.params.symbol);
    const yahooSym=toYahoo(sym);
    const result=await yfSummary(yahooSym,'majorHoldersBreakdown,insiderHolders,insiderTransactions,netSharePurchaseActivity');
    if(!result) throw new Error('No data');

    const mh=result.majorHoldersBreakdown;
    const promoterHolding=mh?.insidersPercentHeld?.raw?parseFloat((mh.insidersPercentHeld.raw*100).toFixed(2)):null;
    const institutionalHolding=mh?.institutionsPercentHeld?.raw?parseFloat((mh.institutionsPercentHeld.raw*100).toFixed(2)):null;

    const trans=result.insiderTransactions?.transactions||[];
    let buyCount=0,sellCount=0,netShares=0;
    const recent=[];
    trans.slice(0,10).forEach(t=>{
      const shares=t.shares?.raw||0, val=t.value?.raw||0;
      const txt=(t.transactionText||'').toLowerCase();
      const isBuy=txt.includes('purchase')||txt.includes('buy');
      const isSell=txt.includes('sale')||txt.includes('sell');
      if(isBuy){buyCount++;netShares+=shares;}
      if(isSell){sellCount++;netShares-=shares;}
      recent.push({name:t.filerName||'—',relation:t.filerRelation||'—',type:isBuy?'BUY':isSell?'SELL':'OTHER',shares:Math.abs(shares),value:val,date:t.startDate?.fmt||'—'});
    });

    let sentiment='neutral',sentimentReason='No recent insider activity';
    if(buyCount>sellCount&&netShares>0){sentiment='positive';sentimentReason=`Insiders bought ${buyCount} time(s) — confidence in company`;}
    else if(sellCount>buyCount&&netShares<0){sentiment='negative';sentimentReason=`Insiders sold ${sellCount} time(s) — possible caution signal`;}

    let holdingSignal='neutral',holdingNote='';
    if(promoterHolding!==null){
      if(promoterHolding>60){holdingSignal='positive';holdingNote=`High holding ${promoterHolding}% — strong promoter confidence`;}
      else if(promoterHolding<30){holdingSignal='negative';holdingNote=`Low holding ${promoterHolding}% — promoters hold less stake`;}
      else{holdingNote=`Moderate holding ${promoterHolding}%`;}
    }

    const nspa=result.netSharePurchaseActivity;
    res.json({success:true,symbol:sym,promoterHolding,institutionalHolding,
      insiderBuyCount:buyCount,insiderSellCount:sellCount,insiderNetShares:netShares,
      recentTransactions:recent,sentiment,sentimentReason,holdingSignal,holdingNote,
      netPurchase6m:nspa?.sixMonthNetShares?.raw||null});
  }catch(err){
    res.json({success:false,symbol:req.params.symbol,sentiment:'unavailable',
      sentimentReason:'Promoter data not available for this stock',recentTransactions:[]});
  }
});

// ─── FINANCIALS ───────────────────────────────────────────────────────────────
app.get('/api/financials/:symbol', async (req,res)=>{
  try{
    const sym=resolveSymbol(req.params.symbol);
    const yahooSym=toYahoo(sym);
    const result=await yfSummary(yahooSym,'incomeStatementHistory,defaultKeyStatistics,financialData');
    if(!result) throw new Error('No data');
    const fd=result.financialData, ks=result.defaultKeyStatistics;
    const income=result.incomeStatementHistory?.incomeStatementHistory||[];
    const quarters=income.slice(0,4).map(q=>({
      date:new Date(q.endDate.raw*1000).toLocaleDateString('en-IN',{month:'short',year:'2-digit'}),
      revenue:q.totalRevenue?.raw||null, netIncome:q.netIncome?.raw||null, eps:q.basicEPS?.raw||null
    }));
    res.json({success:true,symbol:sym,
      keyStats:{
        pe:ks?.trailingPE?.raw||null, pb:ks?.priceToBook?.raw||null, eps:ks?.trailingEps?.raw||null,
        roe:fd?.returnOnEquity?.raw?parseFloat((fd.returnOnEquity.raw*100).toFixed(2)):null,
        debtToEquity:fd?.debtToEquity?.raw||null, currentRatio:fd?.currentRatio?.raw||null,
        revenueGrowth:fd?.revenueGrowth?.raw?parseFloat((fd.revenueGrowth.raw*100).toFixed(2)):null,
        profitMargin:fd?.profitMargins?.raw?parseFloat((fd.profitMargins.raw*100).toFixed(2)):null,
        dividendYield:ks?.dividendYield?.raw?parseFloat((ks.dividendYield.raw*100).toFixed(2)):null,
        beta:ks?.beta?.raw||null
      }, quarters});
  }catch(err){
    res.status(500).json({success:false, error:'Financial data unavailable', detail:err.message});
  }
});

// ─── MARKET OVERVIEW ─────────────────────────────────────────────────────────
app.get('/api/market', async (req,res)=>{
  try{
    const indices=['^NSEI','^BSESN','GOLDBEES.NS','NIFTYBEES.NS'];
    const names=['Nifty 50','Sensex','Gold BeES','Nifty BeES'];
    const results=await Promise.allSettled(indices.map(s=>yfFetch(s,'5d','1d')));
    const market=results.map((r,i)=>{
      if(r.status!=='fulfilled') return null;
      const meta=r.value?.chart?.result?.[0]?.meta;
      if(!meta||!meta.regularMarketPrice) return null;
      const price=meta.regularMarketPrice, prev=meta.chartPreviousClose||price;
      return{name:names[i],symbol:indices[i],price,prevClose:prev,
        change:prev?parseFloat(((price-prev)/prev*100).toFixed(2)):0};
    }).filter(Boolean);
    res.json({success:true, market});
  }catch(err){
    res.status(500).json({success:false, error:'Market data unavailable'});
  }
});

app.listen(PORT, ()=>console.log(`Indian Stock Research API running on port ${PORT}`));

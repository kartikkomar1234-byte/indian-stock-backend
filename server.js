const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

// Yahoo Finance base URL
const YF = 'https://query1.finance.yahoo.com/v8/finance/chart/';
const YF2 = 'https://query2.finance.yahoo.com/v8/finance/chart/';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
};

// Convert NSE symbol to Yahoo Finance format
// Large company name → NSE symbol map
const NAME_MAP = {
  // A
  'ADANI ENTERPRISES':'ADANIENT','ADANI GREEN':'ADANIGREEN','ADANI GREEN ENERGY':'ADANIGREEN',
  'ADANI PORTS':'ADANIPORTS','ADANI POWER':'ADANIPOWER','ADANI TOTAL GAS':'ATGL',
  'ADANI WILMAR':'AWL','AMBUJA CEMENTS':'AMBUJACEM','APOLLO HOSPITALS':'APOLLOHOSP',
  'APOLLO TYRES':'APOLLOTYRE','ASIAN PAINTS':'ASIANPAINT','AXIS BANK':'AXISBANK',
  'AU SMALL FINANCE':'AUBANK','ADITYA BIRLA CAPITAL':'ABCAPITAL',
  'ADITYA BIRLA FASHION':'ABFRL','ASTRAL':'ASTRAL','ASTRAL POLY':'ASTRAL',
  // B
  'BAJAJ AUTO':'BAJAJ-AUTO','BAJAJ FINANCE':'BAJFINANCE','BAJAJ FINSERV':'BAJAJFINSV',
  'BAJAJ HOLDINGS':'BAJAJHLDNG','BANDHAN BANK':'BANDHANBNK','BANK OF BARODA':'BANKBARODA',
  'BERGER PAINTS':'BERGEPAINT','BHARAT ELECTRONICS':'BEL','BHARAT FORGE':'BHARATFORG',
  'BHEL':'BHEL','BIOCON':'BIOCON','BOSCH':'BOSCHLTD','BRITANNIA':'BRITANNIA',
  // C
  'CANARA BANK':'CANBK','CHOLAMANDALAM':'CHOLAFIN','CHOLAMANDALAM INVESTMENT':'CHOLAFIN',
  'CIPLA':'CIPLA','COAL INDIA':'COALINDIA','COFORGE':'COFORGE',
  'COLGATE':'COLPAL','COLGATE PALMOLIVE':'COLPAL','CONTAINER CORP':'CONCOR',
  'CROMPTON':'CROMPTON','CUMMINS':'CUMMINSIND',
  // D
  'DABUR':'DABUR','DIVI LAB':'DIVISLAB',"DIVI'S LAB":'DIVISLAB',"DIVI'S LABORATORIES":'DIVISLAB',
  'DLF':'DLF','DR REDDY':'DRREDDY',"DR REDDY'S":'DRREDDY',"DR REDDY'S LABS":'DRREDDY',
  // E
  'EICHER MOTORS':'EICHERMOT','ESCORTS KUBOTA':'ESCORTS',
  // F
  'FEDERAL BANK':'FEDERALBNK','FIRSTSOURCE':'FSL',
  // G
  'GAIL':'GAIL','GLAND PHARMA':'GLAND','GODREJ CONSUMER':'GODREJCP',
  'GODREJ PROPERTIES':'GODREJPROP','GRANULES':'GRANULES','GRASIM':'GRASIM',
  'GUJARAT GAS':'GUJARATGAS','GUJARAT TITAN':'TITAN',
  // H
  'HAVELLS':'HAVELLS','HCL TECH':'HCLTECH','HCL TECHNOLOGIES':'HCLTECH',
  'HDFC':'HDFC','HDFC AMC':'HDFCAMC','HDFC BANK':'HDFCBANK','HDFC LIFE':'HDFCLIFE',
  'HERO MOTO':'HEROMOTOCO','HERO MOTOCORP':'HEROMOTOCO','HINDALCO':'HINDALCO',
  'HINDUSTAN AERONAUTICS':'HAL','HAL':'HAL',
  'HINDUSTAN COPPER':'HINDCOPPER','HINDUSTAN PETROLEUM':'HINDPETRO',
  'HINDUSTAN UNILEVER':'HINDUNILVR','HUL':'HINDUNILVR','HINDUSTAN ZINC':'HINDZINC',
  'HONEYWELL':'HONAUT',
  // I
  'ICICI BANK':'ICICIBANK','ICICI LOMBARD':'ICICIGI','ICICI PRUDENTIAL':'ICICIPRULI',
  'IDFC FIRST':'IDFCFIRSTB','IDFC FIRST BANK':'IDFCFIRSTB','INDIAMART':'INDIAMART',
  'INDIAN HOTELS':'INDHOTEL','INDIAN OIL':'IOC','IOC':'IOC',
  'INDRAPRASTHA GAS':'IGL','INDUS TOWERS':'INDUSTOWER',
  'INDUSIND BANK':'INDUSINDBK','INFO EDGE':'NAUKRI','INFOSYS':'INFY',
  'INFY':'INFY','ITC':'ITC',
  // J
  'JSW ENERGY':'JSWENERGY','JSW STEEL':'JSWSTEEL','JUBILANT FOOD':'JUBLFOOD',
  'JUBILANT FOODWORKS':'JUBLFOOD',
  // K
  'KOTAK BANK':'KOTAKBANK','KOTAK MAHINDRA':'KOTAKBANK','KOTAK MAHINDRA BANK':'KOTAKBANK',
  // L
  'L&T':'LT','LARSEN':'LT','LARSEN AND TOUBRO':'LT','LARSEN & TOUBRO':'LT',
  'L&T TECHNOLOGY':'LTTS','LT TECHNOLOGY':'LTTS','L&T INFOTECH':'LTIM',
  'LTIMINDTREE':'LTIM','LIC':'LICI','LIC OF INDIA':'LICI',
  'LUPIN':'LUPIN',
  // M
  'M&M':'M&M','MAHINDRA':'M&M','MAHINDRA AND MAHINDRA':'M&M',
  'MAHINDRA FINANCE':'M&MFIN','MANAPPURAM':'MANAPPURAM',
  'MARICO':'MARICO','MARUTI':'MARUTI','MARUTI SUZUKI':'MARUTI',
  'MAX HEALTHCARE':'MAXHEALTH','MCDOWELL':'MCDOWELL-N','MPHASIS':'MPHASIS',
  'MOTHERSON':'MOTHERSUMI','MUTHOOT FINANCE':'MUTHOOTFIN',
  // N
  'NAUKRI':'NAUKRI','NESTLE':'NESTLEIND','NESTLE INDIA':'NESTLEIND',
  'NMDC':'NMDC','NTPC':'NTPC',
  // O
  'ONGC':'ONGC','OIL INDIA':'OIL',
  // P
  'PAGE INDUSTRIES':'PAGEIND','PAYTM':'PAYTM','PERSISTENT':'PERSISTENT',
  'PETRONET LNG':'PETRONET','PIDILITE':'PIDILITIND','PIIND':'PIDILITIND',
  'PIRAMAL':'PEL','POLYCAB':'POLYCAB','POWER FINANCE':'PFC',
  'POWER GRID':'POWERGRID','POWERFINANCE':'PFC','PVR INOX':'PVRINOX',
  // R
  'RAIL VIKAS NIGAM':'RVNL','RVNL':'RVNL','REC':'RECLTD','REC LIMITED':'RECLTD',
  'RELIANCE':'RELIANCE','RELIANCE INDUSTRIES':'RELIANCE',
  // S
  'SBI':'SBIN','STATE BANK':'SBIN','STATE BANK OF INDIA':'SBIN',
  'SBI CARDS':'SBICARD','SBI LIFE':'SBILIFE',
  'SHREE CEMENT':'SHREECEM','SIEMENS':'SIEMENS','SRF':'SRF',
  'SUN PHARMA':'SUNPHARMA','SUN PHARMACEUTICAL':'SUNPHARMA',
  'SUNDARAM FINANCE':'SUNDARMFIN',
  // T
  'TATA CHEMICALS':'TATACHEM','TATA COMMUNICATION':'TATACOMM','TATA COMMUNICATIONS':'TATACOMM',
  'TATA CONSUMER':'TATACONSUM','TATA CONSUMER PRODUCTS':'TATACONSUM',
  'TATA ELXSI':'TATAELXSI','TATA MOTORS':'TATAMOTORS','TATA POWER':'TATAPOWER',
  'TATA STEEL':'TATASTEEL','TCS':'TCS','TATA CONSULTANCY':'TCS',
  'TATA CONSULTANCY SERVICES':'TCS',
  'TECH MAHINDRA':'TECHM','TITAN':'TITAN','TORRENT PHARMA':'TORNTPHARM',
  'TRENT':'TRENT','TVS MOTOR':'TVSMOTOR',
  // U
  'ULTRA CEMENT':'ULTRACEMCO','ULTRATECH':'ULTRACEMCO','ULTRATECH CEMENT':'ULTRACEMCO',
  'UNION BANK':'UNIONBANK',
  // V
  'VARUN BEVERAGES':'VBL','VEDANTA':'VEDL','VEDL':'VEDL',
  'VOLTAS':'VOLTAS',
  // W
  'WIPRO':'WIPRO',
  // Z
  'ZOMATO':'ZOMATO','ZYDUS LIFESCIENCES':'ZYDUSLIFE',
};

function toYahoo(sym){
  const s = sym.toUpperCase().trim();
  // Already has exchange suffix
  if(s.endsWith('.NS') || s.endsWith('.BO')) return s;
  // Check name map first
  if(NAME_MAP[s]) return NAME_MAP[s] + '.NS';
  // Try partial match in name map
  const keys = Object.keys(NAME_MAP);
  const partial = keys.find(k => s.includes(k) || k.includes(s));
  if(partial) return NAME_MAP[partial] + '.NS';
  // Default — assume it is already an NSE symbol
  return s + '.NS';
}

// ─── TECHNICAL INDICATORS ─────────────────────────────────────────────────────

function calcRSI(closes, period = 14){
  if(closes.length < period + 1) return null;
  let gains = 0, losses = 0;
  for(let i = 1; i <= period; i++){
    const diff = closes[i] - closes[i-1];
    if(diff >= 0) gains += diff; else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  for(let i = period + 1; i < closes.length; i++){
    const diff = closes[i] - closes[i-1];
    avgGain = (avgGain * (period - 1) + Math.max(diff, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-diff, 0)) / period;
  }
  if(avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return parseFloat((100 - 100 / (1 + rs)).toFixed(2));
}

function calcEMA(data, period){
  const k = 2 / (period + 1);
  let ema = data[0];
  const result = [ema];
  for(let i = 1; i < data.length; i++){
    ema = data[i] * k + ema * (1 - k);
    result.push(parseFloat(ema.toFixed(2)));
  }
  return result;
}

function calcMACD(closes){
  if(closes.length < 26) return null;
  const ema12 = calcEMA(closes, 12);
  const ema26 = calcEMA(closes, 26);
  const macdLine = ema12.map((v, i) => parseFloat((v - ema26[i]).toFixed(2)));
  const signal = calcEMA(macdLine.slice(9), 9);
  const last = macdLine.length - 1;
  const lastSignal = signal[signal.length - 1];
  const histogram = parseFloat((macdLine[last] - lastSignal).toFixed(2));
  return {
    macd: macdLine[last],
    signal: lastSignal,
    histogram,
    trend: histogram > 0 ? 'bullish' : 'bearish'
  };
}

function calcBollingerBands(closes, period = 20){
  if(closes.length < period) return null;
  const slice = closes.slice(-period);
  const mean = slice.reduce((a,b) => a+b, 0) / period;
  const variance = slice.reduce((a,b) => a + Math.pow(b - mean, 2), 0) / period;
  const std = Math.sqrt(variance);
  return {
    upper: parseFloat((mean + 2 * std).toFixed(2)),
    middle: parseFloat(mean.toFixed(2)),
    lower: parseFloat((mean - 2 * std).toFixed(2)),
    bandwidth: parseFloat(((4 * std / mean) * 100).toFixed(2))
  };
}

function calcSMA(closes, period){
  if(closes.length < period) return null;
  const slice = closes.slice(-period);
  return parseFloat((slice.reduce((a,b) => a+b, 0) / period).toFixed(2));
}

function calcATR(highs, lows, closes, period = 14){
  if(highs.length < period + 1) return null;
  const trs = [];
  for(let i = 1; i < highs.length; i++){
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i-1]),
      Math.abs(lows[i] - closes[i-1])
    );
    trs.push(tr);
  }
  return parseFloat((trs.slice(-period).reduce((a,b)=>a+b,0)/period).toFixed(2));
}

function detectCandlePatterns(ohlcv){
  const patterns = [];
  const n = ohlcv.length;
  if(n < 3) return patterns;

  const last = ohlcv[n-1];
  const prev = ohlcv[n-2];
  const prev2 = ohlcv[n-3];

  const body = (c) => Math.abs(c.close - c.open);
  const range = (c) => c.high - c.low;
  const isGreen = (c) => c.close > c.open;
  const isRed = (c) => c.close < c.open;

  // Doji
  if(body(last) / range(last) < 0.1){
    patterns.push({ name: 'Doji', type: 'neutral', desc: 'Indecision in market — buyers and sellers balanced. Watch next candle for direction.' });
  }
  // Hammer (bullish reversal)
  if(isGreen(last) && (last.low < last.open - range(last)*0.6) && body(last)/range(last) > 0.3){
    patterns.push({ name: 'Hammer', type: 'bullish', desc: 'Strong bullish reversal signal. Price tried to fall but buyers pushed it back up strongly.' });
  }
  // Shooting Star (bearish reversal)
  if(isRed(last) && (last.high > last.close + range(last)*0.6) && body(last)/range(last) > 0.3){
    patterns.push({ name: 'Shooting Star', type: 'bearish', desc: 'Bearish reversal signal. Price tried to rise but sellers pushed it back down strongly.' });
  }
  // Bullish Engulfing
  if(isRed(prev) && isGreen(last) && last.open < prev.close && last.close > prev.open){
    patterns.push({ name: 'Bullish Engulfing', type: 'bullish', desc: 'Strong buy signal! Green candle fully covered the previous red candle. Buyers are taking control.' });
  }
  // Bearish Engulfing
  if(isGreen(prev) && isRed(last) && last.open > prev.close && last.close < prev.open){
    patterns.push({ name: 'Bearish Engulfing', type: 'bearish', desc: 'Strong sell signal! Red candle fully covered previous green candle. Sellers are taking control.' });
  }
  // Morning Star (bullish)
  if(isRed(prev2) && body(prev)/range(prev) < 0.3 && isGreen(last) && last.close > (prev2.open + prev2.close)/2){
    patterns.push({ name: 'Morning Star', type: 'bullish', desc: 'Very strong 3-candle bullish reversal. High probability of upward move from here.' });
  }
  // Evening Star (bearish)
  if(isGreen(prev2) && body(prev)/range(prev) < 0.3 && isRed(last) && last.close < (prev2.open + prev2.close)/2){
    patterns.push({ name: 'Evening Star', type: 'bearish', desc: 'Very strong 3-candle bearish reversal. High probability of downward move from here.' });
  }
  // Three White Soldiers (bullish)
  if(isGreen(last) && isGreen(prev) && isGreen(prev2) && last.close > prev.close && prev.close > prev2.close){
    patterns.push({ name: 'Three White Soldiers', type: 'bullish', desc: 'Three consecutive green candles with higher highs. Very strong bullish momentum.' });
  }
  // Three Black Crows (bearish)
  if(isRed(last) && isRed(prev) && isRed(prev2) && last.close < prev.close && prev.close < prev2.close){
    patterns.push({ name: 'Three Black Crows', type: 'bearish', desc: 'Three consecutive red candles with lower lows. Very strong bearish momentum.' });
  }

  return patterns;
}

function generateSignal(rsi, macd, sma20, sma50, currentPrice, change7d){
  let bullPoints = 0, bearPoints = 0;
  const reasons = [];

  // RSI
  if(rsi !== null){
    if(rsi < 30){ bullPoints += 2; reasons.push({ signal:'bull', text:`RSI ${rsi} — Oversold! Stock is cheap right now, likely to bounce up` }); }
    else if(rsi > 70){ bearPoints += 2; reasons.push({ signal:'bear', text:`RSI ${rsi} — Overbought! Stock is expensive right now, may fall` }); }
    else if(rsi >= 40 && rsi <= 60){ bullPoints += 1; reasons.push({ signal:'bull', text:`RSI ${rsi} — Healthy zone, no extreme buying or selling` }); }
    else if(rsi > 60){ bullPoints += 1; reasons.push({ signal:'bull', text:`RSI ${rsi} — Moderately bullish momentum` }); }
    else { bearPoints += 1; reasons.push({ signal:'bear', text:`RSI ${rsi} — Slightly weak, watch carefully` }); }
  }
  // MACD
  if(macd !== null){
    if(macd.trend === 'bullish'){ bullPoints += 2; reasons.push({ signal:'bull', text:`MACD positive (+${macd.histogram}) — Buying momentum is stronger than selling` }); }
    else { bearPoints += 2; reasons.push({ signal:'bear', text:`MACD negative (${macd.histogram}) — Selling momentum is stronger than buying` }); }
  }
  // Moving Averages
  if(sma20 && sma50 && currentPrice){
    if(currentPrice > sma20 && sma20 > sma50){ bullPoints += 2; reasons.push({ signal:'bull', text:`Price above 20 & 50 day average — Uptrend confirmed. Buyers are in control` }); }
    else if(currentPrice < sma20 && sma20 < sma50){ bearPoints += 2; reasons.push({ signal:'bear', text:`Price below 20 & 50 day average — Downtrend. Sellers are in control` }); }
    else if(currentPrice > sma20){ bullPoints += 1; reasons.push({ signal:'bull', text:`Price above 20-day average — Short term trend is positive` }); }
    else { bearPoints += 1; reasons.push({ signal:'bear', text:`Price below 20-day average — Short term trend is weak` }); }
  }
  // 7 day change
  if(change7d !== null){
    if(change7d > 3){ bullPoints += 1; reasons.push({ signal:'bull', text:`Stock gained +${change7d.toFixed(1)}% this week — Strong buying interest` }); }
    else if(change7d < -3){ bearPoints += 1; reasons.push({ signal:'bear', text:`Stock fell ${change7d.toFixed(1)}% this week — Selling pressure present` }); }
    else { reasons.push({ signal:'neutral', text:`Stock moved ${change7d.toFixed(1)}% this week — Sideways, no clear direction` }); }
  }

  const total = bullPoints + bearPoints;
  let overall, confidence;
  if(bullPoints > bearPoints + 1){ overall = 'BUY'; confidence = Math.round((bullPoints/Math.max(total,1))*100); }
  else if(bearPoints > bullPoints + 1){ overall = 'SELL'; confidence = Math.round((bearPoints/Math.max(total,1))*100); }
  else { overall = 'HOLD'; confidence = 55; }

  return { overall, confidence, bullPoints, bearPoints, reasons };
}

// ─── ROUTES ───────────────────────────────────────────────────────────────────

// Health check
app.get('/', (req, res) => res.json({ status: 'Indian Stock Research API is running!', version: '2.0' }));

// ── SYMBOL SEARCH ─────────────────────────────────────────────────────────────
app.get('/api/search/:query', async (req, res) => {
  try {
    const q = req.params.query.toUpperCase().trim();
    // Check our name map first
    const results = [];
    Object.entries(NAME_MAP).forEach(([name, sym]) => {
      if(name.includes(q) || sym.includes(q)){
        results.push({ name, symbol: sym });
      }
    });
    // Also try Yahoo Finance search
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(req.params.query)}+NSE&quotesCount=8&newsCount=0&listsCount=0`;
    const { data } = await axios.get(url, { headers: HEADERS, timeout: 8000 });
    const yahoResults = (data.quotes || [])
      .filter(q => q.exchange === 'NSI' || q.symbol?.endsWith('.NS'))
      .map(q => ({ name: q.longname || q.shortname, symbol: q.symbol?.replace('.NS','') }));
    const combined = [...results, ...yahoResults].slice(0, 10);
    res.json({ success: true, results: combined });
  } catch(e) {
    res.json({ success: true, results: [] });
  }
});

// ── MAIN STOCK DATA ──────────────────────────────────────────────────────────
app.get('/api/stock/:symbol', async (req, res) => {
  try {
    const sym = req.params.symbol.toUpperCase().trim();
    const yahooSym = toYahoo(sym);

    // Fetch quote data
    const quoteUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSym}?interval=1d&range=6mo`;
    const { data } = await axios.get(quoteUrl, { headers: HEADERS, timeout: 10000 });

    const result = data.chart.result[0];
    const meta = result.meta;
    const timestamps = result.timestamp;
    const q = result.indicators.quote[0];
    const opens = q.open, highs = q.high, lows = q.low, closes = q.close, volumes = q.volume;

    // Filter nulls
    const valid = timestamps.map((t,i) => ({
      t, open: opens[i], high: highs[i], low: lows[i], close: closes[i], volume: volumes[i]
    })).filter(c => c.open && c.high && c.low && c.close);

    const allCloses = valid.map(c => c.close);
    const allHighs  = valid.map(c => c.high);
    const allLows   = valid.map(c => c.low);
    const last7     = valid.slice(-7);
    const last30    = valid.slice(-30);

    // Current price
    const currentPrice = meta.regularMarketPrice || allCloses[allCloses.length - 1];
    const prevClose    = meta.chartPreviousClose || allCloses[allCloses.length - 2];
    const change1d     = parseFloat(((currentPrice - prevClose) / prevClose * 100).toFixed(2));
    const change7d     = valid.length >= 7 ? parseFloat(((currentPrice - valid[valid.length-7].close) / valid[valid.length-7].close * 100).toFixed(2)) : null;
    const change30d    = valid.length >= 30 ? parseFloat(((currentPrice - valid[valid.length-30].close) / valid[valid.length-30].close * 100).toFixed(2)) : null;

    // 52 week
    const high52 = meta.fiftyTwoWeekHigh || Math.max(...allHighs);
    const low52  = meta.fiftyTwoWeekLow  || Math.min(...allLows);

    // Technical indicators
    const rsi  = calcRSI(allCloses);
    const macd = calcMACD(allCloses);
    const bb   = calcBollingerBands(allCloses);
    const sma20 = calcSMA(allCloses, 20);
    const sma50 = calcSMA(allCloses, 50);
    const sma200= calcSMA(allCloses, 200);
    const atr   = calcATR(allHighs, allLows, allCloses);

    // Candle patterns (last 10 candles)
    const patterns = detectCandlePatterns(valid.slice(-10));

    // Signal
    const signal = generateSignal(rsi, macd, sma20, sma50, currentPrice, change7d);

    // Candlestick data (last 90 days)
    const candles = valid.slice(-90).map(c => ({
      t: c.t * 1000,
      o: parseFloat(c.open.toFixed(2)),
      h: parseFloat(c.high.toFixed(2)),
      l: parseFloat(c.low.toFixed(2)),
      c: parseFloat(c.close.toFixed(2)),
      v: c.volume
    }));

    // Price history for RSI/MACD chart
    const priceHistory = valid.slice(-60).map(c => ({
      t: c.t * 1000,
      c: parseFloat(c.close.toFixed(2))
    }));

    // Last 7 days movement
    const last7Days = last7.map(c => ({
      date: new Date(c.t * 1000).toLocaleDateString('en-IN', { day:'numeric', month:'short' }),
      open: parseFloat(c.open.toFixed(2)),
      high: parseFloat(c.high.toFixed(2)),
      low:  parseFloat(c.low.toFixed(2)),
      close:parseFloat(c.close.toFixed(2)),
      volume: c.volume,
      change: parseFloat(((c.close - c.open) / c.open * 100).toFixed(2))
    }));

    res.json({
      success: true,
      symbol: sym,
      yahooSymbol: yahooSym,
      price: {
        current: parseFloat(currentPrice.toFixed(2)),
        prevClose: parseFloat(prevClose.toFixed(2)),
        change1d,
        change7d,
        change30d,
        high52: parseFloat(high52.toFixed(2)),
        low52:  parseFloat(low52.toFixed(2)),
        dayHigh: meta.regularMarketDayHigh || null,
        dayLow:  meta.regularMarketDayLow  || null,
        volume:  meta.regularMarketVolume  || null,
        avgVolume: meta.averageDailyVolume3Month || null,
        marketCap: meta.marketCap || null,
        currency: meta.currency || 'INR'
      },
      indicators: { rsi, macd, bb, sma20, sma50, sma200, atr },
      patterns,
      signal,
      candles,
      priceHistory,
      last7Days,
      updatedAt: new Date().toISOString()
    });

  } catch(err) {
    console.error('Stock error:', err.message);
    res.status(500).json({ success: false, error: 'Could not fetch stock data. Please check symbol and try again.', detail: err.message });
  }
});

// ── NEWS ──────────────────────────────────────────────────────────────────────
app.get('/api/news/:query', async (req, res) => {
  try {
    const query = encodeURIComponent(req.params.query + ' NSE stock India');
    const rssUrl = `https://news.google.com/rss/search?q=${query}&hl=en-IN&gl=IN&ceid=IN:en`;
    const { data } = await axios.get(rssUrl, { headers: HEADERS, timeout: 8000 });

    // Parse RSS XML manually
    const items = [];
    const itemMatches = data.matchAll(/<item>([\s\S]*?)<\/item>/g);
    for(const match of itemMatches){
      const content = match[1];
      const title   = (content.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || content.match(/<title>(.*?)<\/title>/))?.[1] || '';
      const link    = (content.match(/<link>(.*?)<\/link>/))?.[1] || '';
      const pubDate = (content.match(/<pubDate>(.*?)<\/pubDate>/))?.[1] || '';
      const source  = (content.match(/<source[^>]*>(.*?)<\/source>/))?.[1] || 'Google News';
      if(title) items.push({ title: title.trim(), link, pubDate, source: source.trim() });
      if(items.length >= 8) break;
    }

    // Simple sentiment
    const sentimentWords = {
      positive: ['surge', 'gain', 'profit', 'rise', 'bullish', 'strong', 'growth', 'rally', 'beat', 'record', 'up', 'buy', 'positive', 'good', 'increase', 'high'],
      negative: ['fall', 'drop', 'loss', 'decline', 'bearish', 'weak', 'crash', 'sell', 'negative', 'down', 'low', 'risk', 'concern', 'fear', 'cut', 'miss']
    };
    const analyzed = items.map(item => {
      const text = item.title.toLowerCase();
      const posScore = sentimentWords.positive.filter(w => text.includes(w)).length;
      const negScore = sentimentWords.negative.filter(w => text.includes(w)).length;
      return { ...item, sentiment: posScore > negScore ? 'positive' : negScore > posScore ? 'negative' : 'neutral' };
    });

    res.json({ success: true, news: analyzed, count: analyzed.length });
  } catch(err) {
    res.status(500).json({ success: false, error: 'Could not fetch news', news: [] });
  }
});

// ── FII/DII DATA ──────────────────────────────────────────────────────────────
// ── FII/DII DATA ──────────────────────────────────────────────────────────────
app.get('/api/fiidii', async (req, res) => {
  try {
    // Try NSE API first
    const url = 'https://www.nseindia.com/api/fiidiiTradeReact';
    const { data } = await axios.get(url, {
      headers: {
        ...HEADERS,
        'Referer':        'https://www.nseindia.com',
        'X-Requested-With':'XMLHttpRequest',
        'Accept':         'application/json, text/plain, */*',
      },
      timeout: 8000
    });
    const rows = Array.isArray(data) ? data.slice(0, 10) : [];
    if(rows.length === 0) throw new Error('Empty response');

    // Calculate net FII and DII
    let fiiNet=0, diiNet=0;
    rows.forEach(r => {
      fiiNet += parseFloat(r.fiiNetActivity || r.fii_net || 0);
      diiNet += parseFloat(r.diiNetActivity || r.dii_net || 0);
    });

    res.json({
      success: true,
      source: 'NSE Live',
      fiiNet: parseFloat(fiiNet.toFixed(2)),
      diiNet: parseFloat(diiNet.toFixed(2)),
      fiiSentiment: fiiNet > 0 ? 'buying' : fiiNet < 0 ? 'selling' : 'neutral',
      diiSentiment: diiNet > 0 ? 'buying' : diiNet < 0 ? 'selling' : 'neutral',
      rows: rows.slice(0, 5),
      updatedAt: new Date().toISOString()
    });
  } catch(err) {
    // Fallback — try Yahoo Finance institutional holders as proxy
    try {
      res.json({
        success: true,
        source: 'estimated',
        fiiNet: null,
        diiNet: null,
        fiiSentiment: 'unavailable',
        diiSentiment: 'unavailable',
        note: 'NSE FII/DII data temporarily unavailable. NSE website may be blocking the request. Check nseindia.com/market-data/live-equity-market for latest data.',
        rows: []
      });
    } catch(e2) {
      res.json({ success: false, error: 'FII/DII data unavailable' });
    }
  }
});

// ── PROMOTER HOLDING DATA ────────────────────────────────────────────────────
app.get('/api/promoter/:symbol', async (req, res) => {
  try {
    const sym = req.params.symbol.toUpperCase().trim();
    const yahooSym = toYahoo(sym);

    // Yahoo Finance major holders + insider transactions
    const [holdersRes, insiderRes] = await Promise.allSettled([
      axios.get(`https://query1.finance.yahoo.com/v10/finance/quoteSummary/${yahooSym}?modules=majorHoldersBreakdown,institutionOwnership,insiderHolders,insiderTransactions`, {
        headers: HEADERS, timeout: 10000
      }),
      axios.get(`https://query2.finance.yahoo.com/v10/finance/quoteSummary/${yahooSym}?modules=netSharePurchaseActivity`, {
        headers: HEADERS, timeout: 10000
      })
    ]);

    let promoterData = {
      success: true,
      symbol: sym,
      promoterHolding: null,
      promoterChange: null,
      insiderBuyCount: 0,
      insiderSellCount: 0,
      insiderNetShares: 0,
      recentTransactions: [],
      sentiment: 'neutral',
      sentimentReason: '',
      source: 'Yahoo Finance'
    };

    if(holdersRes.status === 'fulfilled') {
      const result = holdersRes.value.data?.quoteSummary?.result?.[0];
      if(result) {
        // Major holders breakdown
        const mh = result.majorHoldersBreakdown;
        if(mh) {
          // insidersPercentHeld = promoter equivalent
          const insider  = mh.insidersPercentHeld?.raw;
          const inst     = mh.institutionsPercentHeld?.raw;
          promoterData.promoterHolding   = insider ? parseFloat((insider * 100).toFixed(2)) : null;
          promoterData.institutionalHolding = inst ? parseFloat((inst * 100).toFixed(2)) : null;
        }

        // Insider transactions (recent buys/sells)
        const trans = result.insiderTransactions?.transactions || [];
        let buyCount=0, sellCount=0, netShares=0;
        const recent = [];
        trans.slice(0, 10).forEach(t => {
          const shares = t.shares?.raw || 0;
          const val    = t.value?.raw || 0;
          const isBuy  = (t.transactionText || '').toLowerCase().includes('purchase') ||
                         (t.transactionText || '').toLowerCase().includes('buy');
          const isSell = (t.transactionText || '').toLowerCase().includes('sale') ||
                         (t.transactionText || '').toLowerCase().includes('sell');
          if(isBuy) { buyCount++; netShares += shares; }
          if(isSell){ sellCount++; netShares -= shares; }
          recent.push({
            name: t.filerName || '—',
            relation: t.filerRelation || '—',
            type: isBuy ? 'BUY' : isSell ? 'SELL' : 'OTHER',
            shares: Math.abs(shares),
            value: val,
            date: t.startDate?.fmt || '—'
          });
        });

        promoterData.insiderBuyCount    = buyCount;
        promoterData.insiderSellCount   = sellCount;
        promoterData.insiderNetShares   = netShares;
        promoterData.recentTransactions = recent;

        // Determine sentiment
        if(buyCount > sellCount && netShares > 0){
          promoterData.sentiment = 'positive';
          promoterData.sentimentReason = `Insiders/promoters bought ${buyCount} time(s) recently — they believe price will rise`;
        } else if(sellCount > buyCount && netShares < 0){
          promoterData.sentiment = 'negative';
          promoterData.sentimentReason = `Insiders/promoters sold ${sellCount} time(s) recently — could indicate caution`;
        } else if(buyCount === 0 && sellCount === 0){
          promoterData.sentiment = 'neutral';
          promoterData.sentimentReason = 'No recent insider buying or selling activity found';
        } else {
          promoterData.sentiment = 'neutral';
          promoterData.sentimentReason = 'Mixed insider activity — no clear signal';
        }

        // Promoter holding level
        if(promoterData.promoterHolding !== null){
          if(promoterData.promoterHolding > 60){
            promoterData.holdingSignal = 'positive';
            promoterData.holdingNote   = `High promoter holding ${promoterData.promoterHolding}% — promoters have strong confidence in the company`;
          } else if(promoterData.promoterHolding > 40){
            promoterData.holdingSignal = 'neutral';
            promoterData.holdingNote   = `Moderate promoter holding ${promoterData.promoterHolding}%`;
          } else {
            promoterData.holdingSignal = 'negative';
            promoterData.holdingNote   = `Low promoter holding ${promoterData.promoterHolding}% — promoters may have less confidence`;
          }
        }
      }
    }

    // Net share purchase activity
    if(insiderRes.status === 'fulfilled') {
      const nspa = insiderRes.value.data?.quoteSummary?.result?.[0]?.netSharePurchaseActivity;
      if(nspa) {
        promoterData.netPurchase6m = nspa.sixMonthNetShares?.raw || null;
        promoterData.buyInfoRate   = nspa.buyInfoShares?.raw || null;
        promoterData.sellInfoRate  = nspa.sellInfoShares?.raw || null;
      }
    }

    res.json(promoterData);
  } catch(err) {
    console.error('Promoter error:', err.message);
    res.json({
      success: false,
      symbol: req.params.symbol,
      sentiment: 'unavailable',
      sentimentReason: 'Could not fetch promoter/insider data for this stock',
      recentTransactions: [],
      note: err.message
    });
  }
});

// ── QUARTERLY RESULTS ─────────────────────────────────────────────────────────
app.get('/api/financials/:symbol', async (req, res) => {
  try {
    const sym = req.params.symbol.toUpperCase();
    const yahooSym = toYahoo(sym);

    const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${yahooSym}?modules=incomeStatementHistory,balanceSheetHistory,cashflowStatementHistory,defaultKeyStatistics,financialData`;
    const { data } = await axios.get(url, { headers: HEADERS, timeout: 10000 });

    const summary = data.quoteSummary.result[0];
    const fd = summary.financialData;
    const ks = summary.defaultKeyStatistics;
    const income = summary.incomeStatementHistory?.incomeStatementHistory || [];

    const quarters = income.slice(0, 4).map(q => ({
      date: new Date(q.endDate.raw * 1000).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
      revenue: q.totalRevenue?.raw || null,
      netIncome: q.netIncome?.raw || null,
      eps: q.basicEPS?.raw || null,
      ebitda: q.ebitda?.raw || null,
    }));

    res.json({
      success: true,
      symbol: sym,
      keyStats: {
        pe:           ks.trailingPE?.raw || null,
        pb:           ks.priceToBook?.raw || null,
        eps:          ks.trailingEps?.raw || null,
        roe:          fd.returnOnEquity?.raw ? parseFloat((fd.returnOnEquity.raw * 100).toFixed(2)) : null,
        debtToEquity: fd.debtToEquity?.raw || null,
        currentRatio: fd.currentRatio?.raw || null,
        revenueGrowth:fd.revenueGrowth?.raw ? parseFloat((fd.revenueGrowth.raw * 100).toFixed(2)) : null,
        profitMargin: fd.profitMargins?.raw ? parseFloat((fd.profitMargins.raw * 100).toFixed(2)) : null,
        dividendYield:ks.dividendYield?.raw ? parseFloat((ks.dividendYield.raw * 100).toFixed(2)) : null,
        beta:         ks.beta?.raw || null,
      },
      quarters
    });
  } catch(err) {
    res.status(500).json({ success: false, error: 'Could not fetch financial data', detail: err.message });
  }
});

// ── MARKET OVERVIEW (Nifty/Sensex) ───────────────────────────────────────────
app.get('/api/market', async (req, res) => {
  try {
    const indices = ['^NSEI', '^BSESN', 'GOLDBEES.NS', 'NIFTYBEES.NS'];
    const results = await Promise.allSettled(indices.map(sym =>
      axios.get(`${YF}${sym}?interval=1d&range=5d`, { headers: HEADERS, timeout: 8000 })
    ));
    const market = results.map((r, i) => {
      if(r.status !== 'fulfilled') return null;
      const meta = r.value.data?.chart?.result?.[0]?.meta;
      if(!meta) return null;
      const names = ['Nifty 50', 'Sensex', 'Gold BeES', 'Nifty BeES'];
      return {
        name: names[i],
        symbol: indices[i],
        price: meta.regularMarketPrice,
        prevClose: meta.chartPreviousClose,
        change: parseFloat(((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose * 100).toFixed(2))
      };
    }).filter(Boolean);
    res.json({ success: true, market });
  } catch(err) {
    res.status(500).json({ success: false, error: 'Market data unavailable' });
  }
});

app.listen(PORT, () => console.log(`Indian Stock Research API running on port ${PORT}`));

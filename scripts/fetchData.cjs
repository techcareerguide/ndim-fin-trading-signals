const fs = require('fs');
const path = require('path');

const stockTemplates = [
  // Nifty 50
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', sector: 'Energy & Conglomerate', indexGroup: 'Nifty 50' },
  { symbol: 'TCS', name: 'Tata Consultancy Services Ltd.', sector: 'Information Technology', indexGroup: 'Nifty 50' },
  { symbol: 'INFY', name: 'Infosys Ltd.', sector: 'Information Technology', indexGroup: 'Nifty 50' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.', sector: 'Financial Services', indexGroup: 'Nifty 50' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd.', sector: 'Financial Services', indexGroup: 'Nifty 50' },
  { symbol: 'SBIN', name: 'State Bank of India', sector: 'Financial Services', indexGroup: 'Nifty 50' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd.', sector: 'Telecommunications', indexGroup: 'Nifty 50' },
  { symbol: 'LT', name: 'Larsen & Toubro Ltd.', sector: 'Construction & Engineering', indexGroup: 'Nifty 50' },
  { symbol: 'ITC', name: 'ITC Ltd.', sector: 'Fast Moving Consumer Goods', indexGroup: 'Nifty 50' },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd.', sector: 'Fast Moving Consumer Goods', indexGroup: 'Nifty 50' },
  { symbol: 'POWERGRID', name: 'Power Grid Corp of India Ltd.', sector: 'Energy & Utilities', indexGroup: 'Nifty 50' },
  { symbol: 'NTPC', name: 'NTPC Ltd.', sector: 'Energy & Utilities', indexGroup: 'Nifty 50' },
  { symbol: 'ONGC', name: 'Oil & Natural Gas Corp Ltd.', sector: 'Energy & Utilities', indexGroup: 'Nifty 50' },
  { symbol: 'JSWSTEEL', name: 'JSW Steel Ltd.', sector: 'Metals & Mining', indexGroup: 'Nifty 50' },
  { symbol: 'TITAN', name: 'Titan Company Ltd.', sector: 'Consumer Goods', indexGroup: 'Nifty 50' },

  // Nifty Bank
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank Ltd.', sector: 'Financial Services', indexGroup: 'Nifty Bank' },
  { symbol: 'AXISBANK', name: 'Axis Bank Ltd.', sector: 'Financial Services', indexGroup: 'Nifty Bank' },
  { symbol: 'INDUSINDBK', name: 'IndusInd Bank Ltd.', sector: 'Financial Services', indexGroup: 'Nifty Bank' },
  { symbol: 'PNB', name: 'Punjab National Bank', sector: 'Financial Services', indexGroup: 'Nifty Bank' },
  { symbol: 'BANKBARODA', name: 'Bank of Baroda', sector: 'Financial Services', indexGroup: 'Nifty Bank' },
  { symbol: 'FEDERALBNK', name: 'Federal Bank Ltd.', sector: 'Financial Services', indexGroup: 'Nifty Bank' },
  { symbol: 'IDFCFIRSTB', name: 'IDFC First Bank Ltd.', sector: 'Financial Services', indexGroup: 'Nifty Bank' },

  // Nifty IT
  { symbol: 'WIPRO', name: 'Wipro Ltd.', sector: 'Information Technology', indexGroup: 'Nifty IT' },
  { symbol: 'HCLTECH', name: 'HCL Technologies Ltd.', sector: 'Information Technology', indexGroup: 'Nifty IT' },
  { symbol: 'TECHM', name: 'Tech Mahindra Ltd.', sector: 'Information Technology', indexGroup: 'Nifty IT' },
  { symbol: 'LTTS', name: 'L&T Technology Services Ltd.', sector: 'Information Technology', indexGroup: 'Nifty IT' },
  { symbol: 'COFORGE', name: 'Coforge Ltd.', sector: 'Information Technology', indexGroup: 'Nifty IT' },
  { symbol: 'PERSISTENT', name: 'Persistent Systems Ltd.', sector: 'Information Technology', indexGroup: 'Nifty IT' },

  // Nifty Auto
  { symbol: 'MARUTI', name: 'Maruti Suzuki India Ltd.', sector: 'Automobile', indexGroup: 'Nifty Auto' },
  { symbol: 'M&M', name: 'Mahindra & Mahindra Ltd.', sector: 'Automobile', indexGroup: 'Nifty Auto' },
  { symbol: 'BAJAJ-AUTO', name: 'Bajaj Auto Ltd.', sector: 'Automobile', indexGroup: 'Nifty Auto' },
  { symbol: 'HEROMOTOCO', name: 'Hero MotoCorp Ltd.', sector: 'Automobile', indexGroup: 'Nifty Auto' },
  { symbol: 'EICHERMOT', name: 'Eicher Motors Ltd.', sector: 'Automobile', indexGroup: 'Nifty Auto' },
  { symbol: 'TVSMOTOR', name: 'TVS Motor Company Ltd.', sector: 'Automobile', indexGroup: 'Nifty Auto' },

  // Nifty Metal
  { symbol: 'TATASTEEL', name: 'Tata Steel Ltd.', sector: 'Metals & Mining', indexGroup: 'Nifty Metal' },
  { symbol: 'HINDALCO', name: 'Hindalco Industries Ltd.', sector: 'Metals & Mining', indexGroup: 'Nifty Metal' },
  { symbol: 'VEDL', name: 'Vedanta Ltd.', sector: 'Metals & Mining', indexGroup: 'Nifty Metal' },
  { symbol: 'SAIL', name: 'Steel Authority of India Ltd.', sector: 'Metals & Mining', indexGroup: 'Nifty Metal' },
  { symbol: 'NATIONALUM', name: 'National Aluminium Co Ltd.', sector: 'Metals & Mining', indexGroup: 'Nifty Metal' }
];

function calculateSMA(data, period) {
  if (data.length < period) return data[data.length - 1] || 0;
  const slice = data.slice(-period);
  return slice.reduce((sum, val) => sum + val, 0) / period;
}

function calculateEMA(data, period) {
  if (data.length === 0) return 0;
  const k = 2 / (period + 1);
  let ema = data[0];
  for (let i = 1; i < data.length; i++) {
    ema = data[i] * k + ema * (1 - k);
  }
  return ema;
}

function calculateRSI(prices, period = 14) {
  if (prices.length <= period) return 50;
  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  for (let i = period + 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function calculateMACD(prices) {
  if (prices.length < 26) {
    return { macdLine: 0, signalLine: 0, histogram: 0 };
  }
  const ema12List = [];
  const ema26List = [];
  for (let i = 26; i <= prices.length; i++) {
    const subPrices = prices.slice(0, i);
    ema12List.push(calculateEMA(subPrices, 12));
    ema26List.push(calculateEMA(subPrices, 26));
  }
  const macdLineHistory = ema12List.map((val, idx) => val - ema26List[idx]);
  const macdLine = macdLineHistory[macdLineHistory.length - 1] || 0;
  const signalLine = calculateEMA(macdLineHistory, 9);
  const histogram = macdLine - signalLine;
  return { macdLine, signalLine, histogram };
}

async function fetchStockData(template) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${template.symbol}.NS?interval=1d&range=3mo`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    const result = data.chart.result[0];
    const timestamps = result.timestamp || [];
    const quote = result.indicators.quote[0];
    const opens = quote.open || [];
    const highs = quote.high || [];
    const lows = quote.low || [];
    const closes = quote.close || [];
    const volumes = quote.volume || [];

    const rawHistory = [];
    for (let i = 0; i < timestamps.length; i++) {
      const open = opens[i];
      const high = highs[i];
      const low = lows[i];
      const close = closes[i];
      const volume = volumes[i];

      if (open !== null && high !== null && low !== null && close !== null && volume !== null &&
          open !== undefined && high !== undefined && low !== undefined && close !== undefined && volume !== undefined) {
        const date = new Date(timestamps[i] * 1000).toISOString().split('T')[0];
        rawHistory.push({
          date,
          open: parseFloat(open.toFixed(2)),
          high: parseFloat(high.toFixed(2)),
          low: parseFloat(low.toFixed(2)),
          close: parseFloat(close.toFixed(2)),
          volume: Math.round(volume)
        });
      }
    }

    if (rawHistory.length === 0) throw new Error("No valid candles found");

    const prices = rawHistory.map(h => h.close);
    const rsi = parseFloat(calculateRSI(prices, 14).toFixed(2));
    const { macdLine, signalLine, histogram } = calculateMACD(prices);
    const ema20 = parseFloat(calculateEMA(prices, 20).toFixed(2));
    const sma50 = parseFloat(calculateSMA(prices, 50).toFixed(2));

    const indicators = {
      rsi,
      macdLine: parseFloat(macdLine.toFixed(2)),
      signalLine: parseFloat(signalLine.toFixed(2)),
      histogram: parseFloat(histogram.toFixed(2)),
      ema20,
      sma50
    };

    const history = rawHistory.map((day, idx) => {
      const subPrices = prices.slice(0, idx + 1);
      return {
        ...day,
        ema20: parseFloat(calculateEMA(subPrices, 20).toFixed(2)),
        sma50: parseFloat(calculateSMA(subPrices, 50).toFixed(2))
      };
    });

    const currentPrice = history[history.length - 1].close;
    let signal = 'HOLD';
    let signalStrength = 50;
    let signalReason = 'No strong momentum or breakout indicators detected. Price consolidation.';

    // Buy conditions
    if (rsi < 35 && macdLine > signalLine && currentPrice > ema20) {
      signal = 'BUY';
      signalStrength = Math.min(95, Math.round(50 + (35 - rsi) * 2 + (macdLine - signalLine) * 10));
      signalReason = 'Strong BUY signal: Stock is oversold (RSI < 35) with a bullish MACD crossover, and price has crossed above the 20-day EMA.';
    } else if (rsi < 30) {
      signal = 'BUY';
      signalStrength = Math.min(85, Math.round(50 + (30 - rsi) * 3));
      signalReason = 'BUY signal: Stock is technically oversold (RSI is below 30). Potential reversal/rebound expected.';
    } else if (macdLine > signalLine && currentPrice > ema20 && ema20 > sma50) {
      signal = 'BUY';
      signalStrength = 75;
      signalReason = 'Accumulate / BUY: Bullish EMA crossover. Price action shows solid upward momentum above key moving averages.';
    }
    // Sell conditions
    else if (rsi > 65 && macdLine < signalLine && currentPrice < ema20) {
      signal = 'SELL';
      signalStrength = Math.min(95, Math.round(50 + (rsi - 65) * 2 + (signalLine - macdLine) * 10));
      signalReason = 'Strong SELL signal: Stock is overbought (RSI > 65) with a bearish MACD crossover, and price is slipping below the 20-day EMA.';
    } else if (rsi > 70) {
      signal = 'SELL';
      signalStrength = Math.min(88, Math.round(50 + (rsi - 70) * 3));
      signalReason = 'SELL signal: Stock is technically overbought (RSI is above 70). Risk of profit-booking and minor correction.';
    } else if (macdLine < signalLine && currentPrice < ema20) {
      signal = 'SELL';
      signalStrength = 72;
      signalReason = 'Reduce / SELL: Bearish MACD signal line crossover and price breakdown below 20-day EMA.';
    }

    const entryPrice = currentPrice;
    let targetPrice = currentPrice * 1.08;
    let stopLoss = currentPrice * 0.96;

    if (signal === 'BUY') {
      targetPrice = currentPrice * 1.10;
      stopLoss = currentPrice * 0.95;
    } else if (signal === 'SELL') {
      targetPrice = currentPrice * 0.90;
      stopLoss = currentPrice * 1.05;
    }

    const lastCandle = history[history.length - 1];
    const prevDay = history[history.length - 2] || lastCandle;
    const change = parseFloat((currentPrice - prevDay.close).toFixed(2));
    const changePercent = parseFloat(((change / prevDay.close) * 100).toFixed(2));

    return {
      symbol: template.symbol,
      name: template.name,
      sector: template.sector,
      indexGroup: template.indexGroup,
      price: currentPrice,
      change,
      changePercent,
      volume: lastCandle.volume,
      high24h: parseFloat(Math.max(lastCandle.high, currentPrice).toFixed(2)),
      low24h: parseFloat(Math.min(lastCandle.low, currentPrice).toFixed(2)),
      signal,
      signalStrength,
      signalReason,
      entryPrice: parseFloat(entryPrice.toFixed(2)),
      targetPrice: parseFloat(targetPrice.toFixed(2)),
      stopLoss: parseFloat(stopLoss.toFixed(2)),
      indicators,
      history
    };
  } catch (error) {
    console.error(`Failed to fetch ${template.symbol}:`, error.message);
    return null;
  }
}

async function main() {
  console.log("Fetching live Indian stocks from Yahoo Finance...");
  const stocks = [];
  for (const template of stockTemplates) {
    const data = await fetchStockData(template);
    if (data) {
      stocks.push(data);
    }
  }

  if (stocks.length === 0) {
    console.error("No stock data fetched. Exiting without writing file.");
    process.exit(1);
  }

  const dir = path.join(__dirname, '../src/data');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const filePath = path.join(dir, 'stocks.json');
  fs.writeFileSync(filePath, JSON.stringify(stocks, null, 2));
  console.log(`Successfully wrote ${stocks.length} stocks to ${filePath}`);
}

main();

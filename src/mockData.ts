import type { StockData, HistoricalData, TechnicalIndicators, SignalType } from './types';


// Helper to calculate Simple Moving Average
function calculateSMA(data: number[], period: number): number {
  if (data.length < period) return data[data.length - 1] || 0;
  const slice = data.slice(-period);
  return slice.reduce((sum, val) => sum + val, 0) / period;
}

// Helper to calculate Exponential Moving Average
function calculateEMA(data: number[], period: number): number {
  if (data.length === 0) return 0;
  const k = 2 / (period + 1);
  let ema = data[0];
  for (let i = 1; i < data.length; i++) {
    ema = data[i] * k + ema * (1 - k);
  }
  return ema;
}

// Helper to calculate Relative Strength Index (RSI)
function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length <= period) return 50;

  let gains = 0;
  let losses = 0;

  // First change
  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) {
      gains += change;
    } else {
      losses -= change;
    }
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

// Helper to calculate MACD
function calculateMACD(prices: number[]): { macdLine: number; signalLine: number; histogram: number } {
  if (prices.length < 26) {
    return { macdLine: 0, signalLine: 0, histogram: 0 };
  }

  const ema12List: number[] = [];
  const ema26List: number[] = [];
  
  // Calculate rolling EMAs to get MACD line history
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

// Initial Stock Configs
const stockTemplates = [
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', sector: 'Energy & Conglomerate', basePrice: 2450 },
  { symbol: 'TCS', name: 'Tata Consultancy Services Ltd.', sector: 'Information Technology', basePrice: 3820 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.', sector: 'Financial Services', basePrice: 1610 },
  { symbol: 'INFY', name: 'Infosys Ltd.', sector: 'Information Technology', basePrice: 1540 },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd.', sector: 'Financial Services', basePrice: 1120 },
  { symbol: 'SBIN', name: 'State Bank of India', sector: 'Financial Services', basePrice: 780 },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd.', sector: 'Telecommunications', basePrice: 1380 },
  { symbol: 'LT', name: 'Larsen & Toubro Ltd.', sector: 'Construction & Engineering', basePrice: 3550 },
  { symbol: 'ITC', name: 'ITC Ltd.', sector: 'Fast Moving Consumer Goods', basePrice: 430 },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd.', sector: 'Fast Moving Consumer Goods', basePrice: 2480 },
  { symbol: 'MARUTI', name: 'Maruti Suzuki India Ltd.', sector: 'Automobile', basePrice: 12100 },
  { symbol: 'M&M', name: 'Mahindra & Mahindra Ltd.', sector: 'Automobile', basePrice: 2850 },
  { symbol: 'TATASTEEL', name: 'Tata Steel Ltd.', sector: 'Metals & Mining', basePrice: 175 },
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical Industries Ltd.', sector: 'Healthcare & Pharma', basePrice: 1510 },
  { symbol: 'LTIM', name: 'LTIMindtree Ltd.', sector: 'Information Technology', basePrice: 5120 }
];

// Generate mock historical data
function generateHistory(basePrice: number, days: number = 50): HistoricalData[] {
  const history: HistoricalData[] = [];
  let currentPrice = basePrice;
  const now = new Date();

  for (let i = days; i > 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateString = date.toISOString().split('T')[0];

    // Daily volatility
    const volatility = 0.015; // 1.5%
    const changePercent = (Math.random() - 0.49) * 2 * volatility; // slight upward drift
    const open = currentPrice * (1 + (Math.random() - 0.5) * 0.005);
    const close = currentPrice * (1 + changePercent);
    const high = Math.max(open, close) * (1 + Math.random() * 0.008);
    const low = Math.min(open, close) * (1 - Math.random() * 0.008);
    const volume = Math.round(500000 + Math.random() * 2000000);

    history.push({
      date: dateString,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume
    });

    currentPrice = close;
  }

  return history;
}

// Generate Stock Data with Indicators & Signal
export function generateInitialStockData(): StockData[] {
  return stockTemplates.map(template => {
    const history = generateHistory(template.basePrice, 60);
    const lastDay = history[history.length - 1];
    const prices = history.map(h => h.close);

    // Indicators
    const rsi = parseFloat(calculateRSI(prices, 14).toFixed(2));
    const { macdLine, signalLine, histogram } = calculateMACD(prices);
    const ema20 = parseFloat(calculateEMA(prices, 20).toFixed(2));
    const sma50 = parseFloat(calculateSMA(prices, 50).toFixed(2));

    const indicators: TechnicalIndicators = {
      rsi,
      macdLine: parseFloat(macdLine.toFixed(2)),
      signalLine: parseFloat(signalLine.toFixed(2)),
      histogram: parseFloat(histogram.toFixed(2)),
      ema20,
      sma50
    };

    // Calculate signals
    let signal: SignalType = 'HOLD';
    let signalStrength = 50;
    let signalReason = 'No strong momentum or breakout indicators detected. Price consolidation.';

    const currentPrice = lastDay.close;

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

    // Target/Stop Loss setups
    const entryPrice = currentPrice;
    let targetPrice = currentPrice * 1.08; // 8% profit
    let stopLoss = currentPrice * 0.96; // 4% loss limit

    if (signal === 'BUY') {
      targetPrice = currentPrice * 1.10; // 10% target for buy
      stopLoss = currentPrice * 0.95;   // 5% stop loss
    } else if (signal === 'SELL') {
      targetPrice = currentPrice * 0.90; // Short target/Re-entry lower
      stopLoss = currentPrice * 1.05;   // Stop loss for shorts
    }

    // Change metrics
    const prevDay = history[history.length - 2];
    const change = parseFloat((currentPrice - prevDay.close).toFixed(2));
    const changePercent = parseFloat(((change / prevDay.close) * 100).toFixed(2));

    const updatedHistory = history.map((day, idx) => {
      const subPrices = prices.slice(0, idx + 1);
      return {
        ...day,
        ema20: parseFloat(calculateEMA(subPrices, 20).toFixed(2)),
        sma50: parseFloat(calculateSMA(subPrices, 50).toFixed(2))
      };
    });

    return {
      symbol: template.symbol,
      name: template.name,
      sector: template.sector,
      price: currentPrice,
      change,
      changePercent,
      volume: lastDay.volume,
      high24h: parseFloat((currentPrice * (1 + Math.random() * 0.015)).toFixed(2)),
      low24h: parseFloat((currentPrice * (1 - Math.random() * 0.015)).toFixed(2)),
      signal,
      signalStrength,
      signalReason,
      entryPrice: parseFloat(entryPrice.toFixed(2)),
      targetPrice: parseFloat(targetPrice.toFixed(2)),
      stopLoss: parseFloat(stopLoss.toFixed(2)),
      indicators,
      history: updatedHistory
    };
  });
}

// Simulates real-time price tick updates
export function updateStockData(stocks: StockData[]): StockData[] {
  return stocks.map(stock => {
    // 0.25% max tick change
    const volatility = 0.0025;
    const tickChangePercent = (Math.random() - 0.495) * 2 * volatility; // slight upward bias
    const priceDiff = stock.price * tickChangePercent;
    const newPrice = parseFloat((stock.price + priceDiff).toFixed(2));
    
    // Update daily limits
    const high24h = parseFloat(Math.max(stock.high24h, newPrice).toFixed(2));
    const low24h = parseFloat(Math.min(stock.low24h, newPrice).toFixed(2));

    // Update today's candle close in history
    const updatedHistory = [...stock.history];
    if (updatedHistory.length > 0) {
      const lastCandle = { ...updatedHistory[updatedHistory.length - 1] };
      lastCandle.close = newPrice;
      lastCandle.high = Math.max(lastCandle.high, newPrice);
      lastCandle.low = Math.min(lastCandle.low, newPrice);
      
      const prices = updatedHistory.map(h => h.close);
      lastCandle.ema20 = parseFloat(calculateEMA(prices, 20).toFixed(2));
      lastCandle.sma50 = parseFloat(calculateSMA(prices, 50).toFixed(2));

      updatedHistory[updatedHistory.length - 1] = lastCandle;
    }

    const prices = updatedHistory.map(h => h.close);
    const rsi = parseFloat(calculateRSI(prices, 14).toFixed(2));
    const { macdLine, signalLine, histogram } = calculateMACD(prices);
    const ema20 = parseFloat(calculateEMA(prices, 20).toFixed(2));
    const sma50 = parseFloat(calculateSMA(prices, 50).toFixed(2));

    const indicators: TechnicalIndicators = {
      rsi,
      macdLine: parseFloat(macdLine.toFixed(2)),
      signalLine: parseFloat(signalLine.toFixed(2)),
      histogram: parseFloat(histogram.toFixed(2)),
      ema20,
      sma50
    };

    // Calculate signals based on live data
    let signal: SignalType = 'HOLD';
    let signalStrength = 50;
    let signalReason = 'No strong momentum or breakout indicators detected. Price consolidation.';

    // Buy conditions
    if (rsi < 35 && macdLine > signalLine && newPrice > ema20) {
      signal = 'BUY';
      signalStrength = Math.min(95, Math.round(50 + (35 - rsi) * 2 + (macdLine - signalLine) * 10));
      signalReason = 'Strong BUY signal: Stock is oversold (RSI < 35) with a bullish MACD crossover, and price has crossed above the 20-day EMA.';
    } else if (rsi < 30) {
      signal = 'BUY';
      signalStrength = Math.min(85, Math.round(50 + (30 - rsi) * 3));
      signalReason = 'BUY signal: Stock is technically oversold (RSI is below 30). Potential reversal/rebound expected.';
    } else if (macdLine > signalLine && newPrice > ema20 && ema20 > sma50) {
      signal = 'BUY';
      signalStrength = 75;
      signalReason = 'Accumulate / BUY: Bullish EMA crossover. Price action shows solid upward momentum above key moving averages.';
    }
    // Sell conditions
    else if (rsi > 65 && macdLine < signalLine && newPrice < ema20) {
      signal = 'SELL';
      signalStrength = Math.min(95, Math.round(50 + (rsi - 65) * 2 + (signalLine - macdLine) * 10));
      signalReason = 'Strong SELL signal: Stock is overbought (RSI > 65) with a bearish MACD crossover, and price is slipping below the 20-day EMA.';
    } else if (rsi > 70) {
      signal = 'SELL';
      signalStrength = Math.min(88, Math.round(50 + (rsi - 70) * 3));
      signalReason = 'SELL signal: Stock is technically overbought (RSI is above 70). Risk of profit-booking and minor correction.';
    } else if (macdLine < signalLine && newPrice < ema20) {
      signal = 'SELL';
      signalStrength = 72;
      signalReason = 'Reduce / SELL: Bearish MACD signal line crossover and price breakdown below 20-day EMA.';
    }

    // Keep entry price same, update Target & Stop loss dynamically relative to signal changes
    let entryPrice = stock.entryPrice;
    let targetPrice = stock.targetPrice;
    let stopLoss = stock.stopLoss;

    if (signal !== stock.signal) {
      entryPrice = newPrice;
      if (signal === 'BUY') {
        targetPrice = newPrice * 1.10;
        stopLoss = newPrice * 0.95;
      } else if (signal === 'SELL') {
        targetPrice = newPrice * 0.90;
        stopLoss = newPrice * 1.05;
      } else {
        targetPrice = newPrice * 1.08;
        stopLoss = newPrice * 0.96;
      }
    }

    // Change calculations
    const prevDay = updatedHistory[updatedHistory.length - 2];
    const change = parseFloat((newPrice - prevDay.close).toFixed(2));
    const changePercent = parseFloat(((change / prevDay.close) * 100).toFixed(2));

    return {
      ...stock,
      price: newPrice,
      change,
      changePercent,
      high24h,
      low24h,
      signal,
      signalStrength,
      signalReason,
      entryPrice: parseFloat(entryPrice.toFixed(2)),
      targetPrice: parseFloat(targetPrice.toFixed(2)),
      stopLoss: parseFloat(stopLoss.toFixed(2)),
      indicators,
      history: updatedHistory
    };
  });
}

// Mastery - Backtesting Sandbox Engine
import type { BacktestConfig, BacktestResults, MarketOverviewData } from './types';

export function runBacktest(history: HistoricalData[], config: BacktestConfig): BacktestResults {
  const initialBalance = 100000; // ₹1,00,000 starting cash
  let balance = initialBalance;
  let positionSize = 0;
  let entryPrice = 0;
  let totalTrades = 0;
  let winningTrades = 0;
  let losingTrades = 0;
  let grossProfits = 0;
  let grossLosses = 0;

  const closes = history.map(h => h.close);

  for (let i = 26; i < history.length; i++) {
    const currentPrice = history[i].close;
    const subCloses = closes.slice(0, i + 1);

    // Compute dynamic indicators for backtest
    const rsi = calculateRSI(subCloses, config.rsiPeriod);
    const emaFast = calculateEMA(subCloses, config.emaFast);
    const smaSlow = calculateSMA(subCloses, config.smaSlow);

    // Simulated Strategy: Buy if RSI is oversold and price is above SMA, Sell if RSI is overbought or below EMA
    if (positionSize === 0) {
      if (rsi < config.rsiOversold && currentPrice > smaSlow) {
        positionSize = balance / currentPrice;
        entryPrice = currentPrice;
        balance = 0;
      }
    } else {
      // Exit condition (Sell): Overbought RSI or price crosses below fast EMA
      const targetHit = currentPrice >= entryPrice * 1.08;
      const stopHit = currentPrice <= entryPrice * 0.95;
      const indicatorExit = rsi > config.rsiOverbought || currentPrice < emaFast;

      if (targetHit || stopHit || indicatorExit) {
        const exitValue = positionSize * currentPrice;
        const profit = exitValue - (positionSize * entryPrice);
        
        balance = exitValue;
        positionSize = 0;
        totalTrades++;

        if (profit > 0) {
          winningTrades++;
          grossProfits += profit;
        } else {
          losingTrades++;
          grossLosses += Math.abs(profit);
        }
      }
    }
  }

  // Close open positions at the end of backtest period
  if (positionSize > 0) {
    const finalClose = history[history.length - 1].close;
    const exitValue = positionSize * finalClose;
    const profit = exitValue - (positionSize * entryPrice);
    
    balance = exitValue;
    totalTrades++;
    if (profit > 0) {
      winningTrades++;
      grossProfits += profit;
    } else {
      losingTrades++;
      grossLosses += Math.abs(profit);
    }
  }

  const finalBalance = parseFloat(balance.toFixed(2));
  const totalReturn = parseFloat((((finalBalance - initialBalance) / initialBalance) * 100).toFixed(2));
  const winRate = totalTrades > 0 ? parseFloat(((winningTrades / totalTrades) * 100).toFixed(2)) : 0;
  const profitFactor = grossLosses > 0 ? parseFloat((grossProfits / grossLosses).toFixed(2)) : grossProfits > 0 ? 9.99 : 0;

  return {
    totalTrades,
    winningTrades,
    losingTrades,
    winRate,
    totalReturn,
    initialBalance,
    finalBalance,
    profitFactor
  };
}

// Mastery - Market Breadth and Flow Simulators
export function generateInitialMarketOverview(): MarketOverviewData {
  return {
    indices: [
      { name: 'NIFTY 50', price: 24320.50, change: 110.20, changePercent: 0.46 },
      { name: 'NIFTY BANK', price: 52250.70, change: -180.30, changePercent: -0.34 },
      { name: 'NIFTY IT', price: 38120.40, change: 480.90, changePercent: 1.28 }
    ],
    advanceDecline: {
      advances: 32,
      declines: 16,
      unchanged: 2
    },
    sectors: [
      { name: 'Information Technology', changePercent: 1.34 },
      { name: 'FMCG', changePercent: 0.62 },
      { name: 'Healthcare & Pharma', changePercent: 0.48 },
      { name: 'Energy & Conglomerate', changePercent: 0.15 },
      { name: 'Financial Services', changePercent: -0.28 },
      { name: 'Automobile', changePercent: -0.45 }
    ],
    fiiDiiFlows: [
      { date: 'Today (Est)', fiiNet: 450.20, diiNet: 1200.80 },
      { date: 'Yesterday', fiiNet: -820.50, diiNet: 1450.30 },
      { date: '2 Days Ago', fiiNet: 120.40, diiNet: 880.60 },
      { date: '3 Days Ago', fiiNet: 650.10, diiNet: -220.40 }
    ]
  };
}

export function updateMarketOverview(prev: MarketOverviewData): MarketOverviewData {
  // Simulate minor changes to indices and advance/decline
  const updatedIndices = prev.indices.map(idx => {
    const vol = 0.0015; // 0.15% fluctuation
    const pct = (Math.random() - 0.49) * 2 * vol;
    const diff = idx.price * pct;
    const price = parseFloat((idx.price + diff).toFixed(2));
    const change = parseFloat((idx.change + diff).toFixed(2));
    const changePercent = parseFloat(((change / (price - change)) * 100).toFixed(2));
    return { ...idx, price, change, changePercent };
  });

  const updatedSectors = prev.sectors.map(sec => {
    const pct = (Math.random() - 0.48) * 0.2; // -0.1% to +0.1% change
    return { ...sec, changePercent: parseFloat((sec.changePercent + pct).toFixed(2)) };
  });

  // Shift advances/declines randomly
  let advances = prev.advanceDecline.advances + (Math.random() > 0.5 ? 1 : -1);
  advances = Math.max(10, Math.min(45, advances));
  const unchanged = Math.max(1, Math.min(5, prev.advanceDecline.unchanged + (Math.random() > 0.5 ? 1 : -1)));
  const declines = 50 - advances - unchanged;

  // Simulate small FII / DII updates for "Today"
  const updatedFlows = [...prev.fiiDiiFlows];
  if (updatedFlows.length > 0) {
    const todayFlow = { ...updatedFlows[0] };
    todayFlow.fiiNet = parseFloat((todayFlow.fiiNet + (Math.random() - 0.5) * 50).toFixed(2));
    todayFlow.diiNet = parseFloat((todayFlow.diiNet + (Math.random() - 0.48) * 40).toFixed(2));
    updatedFlows[0] = todayFlow;
  }

  return {
    indices: updatedIndices,
    sectors: updatedSectors,
    advanceDecline: { advances, declines, unchanged },
    fiiDiiFlows: updatedFlows
  };
}


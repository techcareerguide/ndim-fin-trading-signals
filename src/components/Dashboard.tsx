import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Bell, AlertTriangle, Layers, Sliders, 
  Activity, Plus, Trash2, X, Briefcase, History,
  Globe, Info, BookOpen
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import type { StockData, PriceAlert, Holding, TradeLogEntry, BacktestConfig, BacktestResults, MarketOverviewData, HistoricalData } from '../types';
import { 
  generateInitialStockData, updateStockData, runBacktest, 
  generateInitialMarketOverview, updateMarketOverview 
} from '../mockData';

interface GlossaryTerm {
  term: string;
  category: 'Signals' | 'Technical' | 'Risk' | 'Market';
  definition: string;
  tip: string;
}

const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    term: 'BUY Signal',
    category: 'Signals',
    definition: 'A system alert suggesting a stock is entry-ready. Triggered by momentum oscillators sliding below support boundaries combined with bullish crossovers.',
    tip: 'Avoid buying near major dynamic resistance zones, even if a buy signal prints.'
  },
  {
    term: 'SELL Signal',
    category: 'Signals',
    definition: 'An alert recommending closing or shorting positions. Occurs when price breaks major support levels or shows overbought exhaustion.',
    tip: 'Strictly respect sell signals to avoid holding through major market drawdowns.'
  },
  {
    term: 'HOLD Signal',
    category: 'Signals',
    definition: 'Indicates consolidation. No strong direction is visible, and the stock is trading within a normal distribution range.',
    tip: 'Patience is a trader\'s best asset during consolidations. Wait for trend confirmations.'
  },
  {
    term: 'Relative Strength Index (RSI)',
    category: 'Technical',
    definition: 'A speed oscillator that indicates overbought (>70) and oversold (<30) signals in a 14-day cycle.',
    tip: 'RSI can stay overbought for long periods during strong bull markets. Combine it with EMA crossover.'
  },
  {
    term: 'MACD Crossover',
    category: 'Technical',
    definition: 'Occurs when the MACD line crosses the Signal Line, signifying shifts in momentum trends.',
    tip: 'A crossover below the zero-line is stronger for bullish entries than one above it.'
  },
  {
    term: '20-Day EMA',
    category: 'Technical',
    definition: 'An exponential moving average reacting fast to short term price trends. Serves as dynamic support.',
    tip: 'During strong uptrends, the 20-EMA acts as a major bounce-trigger area.'
  },
  {
    term: '50-Day SMA',
    category: 'Technical',
    definition: 'A simple moving average smoothing out intermediate price movements. Used to identify macro trends.',
    tip: 'When the price crosses above the 50-SMA, it signals the start of intermediate bullish momentum.'
  },
  {
    term: 'Support Level',
    category: 'Technical',
    definition: 'The price level where a stock historically finds buying interest, stopping its downward movement.',
    tip: 'Always look to enter long trades near support levels with tight stop losses.'
  },
  {
    term: 'Resistance Level',
    category: 'Technical',
    definition: 'The price level where a stock historically faces selling pressure, stopping its upward movement.',
    tip: 'Place your target profit targets slightly below major resistance levels.'
  },
  {
    term: 'Volume Breakout',
    category: 'Technical',
    definition: 'A significant rise in trading volume alongside a price breakout. Indicates strong institution participation.',
    tip: 'Breakouts on low volume are highly prone to failures. Wait for volume confirmations.'
  },
  {
    term: 'Average True Range (ATR)',
    category: 'Risk',
    definition: 'A volatility indicator that shows how much a stock asset moves, on average, during a given frame.',
    tip: 'Set stop losses at 1.5x or 2x ATR away from your entry price to avoid getting shaken out.'
  },
  {
    term: 'Trigger Entry Price',
    category: 'Risk',
    definition: 'The precise price level at which you should open your trade once a signal is verified.',
    tip: 'Chasing a stock way above its trigger price ruins your risk-to-reward ratio.'
  },
  {
    term: 'Target Price',
    category: 'Risk',
    definition: 'The goal price target where you plan to exit and book profits, based on resistance ranges.',
    tip: 'Consider booking partial profits (e.g., 50%) at Target 1 and trail the rest.'
  },
  {
    term: 'Stop Loss (SL)',
    category: 'Risk',
    definition: 'A risk preservation order to exit the trade if the price goes against your setup.',
    tip: 'Never move your stop loss further down. Respect the exit level unconditionally.'
  },
  {
    term: 'Drawdown',
    category: 'Risk',
    definition: 'The peak-to-trough decline in a trading account or portfolio value, expressed in percentage.',
    tip: 'Keep risk per trade below 1-2% to prevent drawdowns from wiping out your balance.'
  },
  {
    term: 'Win Rate',
    category: 'Risk',
    definition: 'The percentage of successful trades relative to the total number of trades completed.',
    tip: 'A high win rate is not necessary if your average win size is much larger than average loss.'
  },
  {
    term: 'Profit Factor',
    category: 'Risk',
    definition: 'The ratio of gross profits to gross losses. A value above 1.5 indicates a robust strategy.',
    tip: 'Aim for strategies with a profit factor of 1.8 or higher in backtesting.'
  },
  {
    term: 'NIFTY 50 Index',
    category: 'Market',
    definition: 'The benchmark index of the National Stock Exchange (NSE), representing the top 50 largest Indian companies.',
    tip: 'Track Nifty 50 daily to ensure you are trading in alignment with broad market trends.'
  },
  {
    term: 'FII Flows',
    category: 'Market',
    definition: 'Foreign Institutional Investor buying activity. FIIs inject global liquidity into Indian markets.',
    tip: 'Heavy FII buying is usually associated with strong upward runs in large-cap stocks.'
  },
  {
    term: 'DII Flows',
    category: 'Market',
    definition: 'Domestic Institutional Investor cash flows (Mutual Funds, LIC). Provides support to Indian markets.',
    tip: 'Strong DII buying can absorb panic selling and create market bottoms during global corrections.'
  },
  {
    term: 'Advance-Decline Ratio',
    category: 'Market',
    definition: 'A breadth indicator comparing the number of stocks closing up vs. those closing down.',
    tip: 'A rising market with a falling Advance-Decline line shows weak participation and high risk.'
  },
  {
    term: 'Market Breadth',
    category: 'Market',
    definition: 'The overall health of the stock market, analyzed by looking at the participation of multiple stocks.',
    tip: 'Healthy bull markets have broad participation across mid-caps and small-caps, not just mega-caps.'
  }
];

export default function Dashboard() {
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('RELIANCE');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [signalFilter, setSignalFilter] = useState<string>('ALL');
  
  // Navigation Tabs: 'SCREENER' | 'PORTFOLIO' | 'BACKTESTER' | 'MARKET' | 'GLOSSARY'
  const [activeTab, setActiveTab] = useState<'SCREENER' | 'PORTFOLIO' | 'BACKTESTER' | 'MARKET' | 'GLOSSARY'>('SCREENER');
  const [showSignalExplain, setShowSignalExplain] = useState<boolean>(false);

  // Glossary Pagination & Search States
  const [glossarySearch, setGlossarySearch] = useState<string>('');
  const [glossaryCatFilter, setGlossaryCatFilter] = useState<string>('ALL');
  const [glossaryPage, setGlossaryPage] = useState<number>(1);

  // Chart Toggle States & Hover Data
  const [showEma20, setShowEma20] = useState<boolean>(true);
  const [showSma50, setShowSma50] = useState<boolean>(true);
  const [hoveredData, setHoveredData] = useState<HistoricalData | null>(null);

  // Alerts System
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [alertTargetPrice, setAlertTargetPrice] = useState<string>('');
  const [alertCondition, setAlertCondition] = useState<'ABOVE' | 'BELOW'>('ABOVE');
  const [triggeredAlerts, setTriggeredAlerts] = useState<{ id: string; msg: string }[]>([]);

  // Paper Trading Portfolio States
  const [balance, setBalance] = useState<number>(1000000); // Starting with ₹10,00,000 INR
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [tradeLogs, setTradeLogs] = useState<TradeLogEntry[]>([]);
  const [tradeQuantity, setTradeQuantity] = useState<string>('10');

  // Backtest Sandbox States
  const [backtestConfig, setBacktestConfig] = useState<BacktestConfig>({
    rsiPeriod: 14,
    rsiOversold: 30,
    rsiOverbought: 70,
    emaFast: 20,
    smaSlow: 50
  });
  const [backtestResults, setBacktestResults] = useState<BacktestResults | null>(null);

  // Market Breadth / FII DII States
  const [marketOverview, setMarketOverview] = useState<MarketOverviewData | null>(null);

  // Active Educational Guidebook Popover
  const [activeGuide, setActiveGuide] = useState<string | null>(null);

  // Flash states for price updates
  const [priceFlash, setPriceFlash] = useState<Record<string, 'up' | 'down' | null>>({});
  const prevPricesRef = useRef<Record<string, number>>({});

  // Initialize stocks and market data
  useEffect(() => {
    const initialData = generateInitialStockData();
    setStocks(initialData);
    setMarketOverview(generateInitialMarketOverview());
    initialData.forEach(s => {
      prevPricesRef.current[s.symbol] = s.price;
    });
  }, []);

  // Live simulation updates
  useEffect(() => {
    if (stocks.length === 0) return;

    const interval = setInterval(() => {
      // 1. Update Stocks Ticks
      setStocks(prevStocks => {
        const nextStocks = updateStockData(prevStocks);
        const nextFlash: Record<string, 'up' | 'down' | null> = {};

        nextStocks.forEach(s => {
          const prevPrice = prevPricesRef.current[s.symbol] || s.price;
          if (s.price > prevPrice) {
            nextFlash[s.symbol] = 'up';
          } else if (s.price < prevPrice) {
            nextFlash[s.symbol] = 'down';
          }
          prevPricesRef.current[s.symbol] = s.price;
        });

        setPriceFlash(nextFlash);
        checkAlerts(nextStocks);
        updateHoldingsPrices(nextStocks);

        return nextStocks;
      });

      // 2. Update Market Overview Stats
      setMarketOverview(prevOverview => {
        if (!prevOverview) return null;
        return updateMarketOverview(prevOverview);
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [stocks.length, alerts, holdings]);

  // Keep holdings prices updated with live ticker changes
  const updateHoldingsPrices = (currentStocks: StockData[]) => {
    setHoldings(prevHoldings => {
      return prevHoldings.map(holding => {
        const stock = currentStocks.find(s => s.symbol === holding.symbol);
        if (!stock) return holding;
        
        const currentValue = holding.quantity * stock.price;
        const pnl = currentValue - holding.totalCost;
        const pnlPercent = (pnl / holding.totalCost) * 100;

        return {
          ...holding,
          currentPrice: stock.price,
          currentValue,
          pnl,
          pnlPercent
        };
      });
    });
  };

  // Check custom alerts
  const checkAlerts = (currentStocks: StockData[]) => {
    alerts.forEach(alert => {
      if (!alert.active) return;
      const stock = currentStocks.find(s => s.symbol === alert.symbol);
      if (!stock) return;

      let triggered = false;
      if (alert.condition === 'ABOVE' && stock.price >= alert.targetPrice) {
        triggered = true;
      } else if (alert.condition === 'BELOW' && stock.price <= alert.targetPrice) {
        triggered = true;
      }

      if (triggered) {
        const msg = `${alert.symbol} has crossed ${alert.condition.toLowerCase()} ₹${alert.targetPrice} (Current: ₹${stock.price})`;
        setTriggeredAlerts(prev => [...prev, { id: alert.id, msg }]);
        setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, active: false } : a));
      }
    });
  };

  const selectedStock = stocks.find(s => s.symbol === selectedSymbol) || stocks[0];

  // Paper Trading buy/sell execution
  const executeVirtualTrade = (type: 'BUY' | 'SELL') => {
    const qty = parseInt(tradeQuantity);
    if (isNaN(qty) || qty <= 0) return;

    const price = selectedStock.price;
    const totalAmount = qty * price;

    if (type === 'BUY') {
      if (totalAmount > balance) {
        alert('Insufficient funds in virtual portfolio!');
        return;
      }

      setBalance(prev => prev - totalAmount);
      
      setHoldings(prev => {
        const existing = prev.find(h => h.symbol === selectedStock.symbol);
        if (existing) {
          const newQty = existing.quantity + qty;
          const newTotalCost = existing.totalCost + totalAmount;
          const avgBuyPrice = newTotalCost / newQty;
          return prev.map(h => h.symbol === selectedStock.symbol ? {
            ...h,
            quantity: newQty,
            totalCost: newTotalCost,
            avgBuyPrice,
            currentValue: newQty * price,
            pnl: (newQty * price) - newTotalCost,
            pnlPercent: (((newQty * price) - newTotalCost) / newTotalCost) * 100
          } : h);
        } else {
          return [...prev, {
            symbol: selectedStock.symbol,
            quantity: qty,
            avgBuyPrice: price,
            currentPrice: price,
            totalCost: totalAmount,
            currentValue: totalAmount,
            pnl: 0,
            pnlPercent: 0
          }];
        }
      });
    } else {
      const existing = holdings.find(h => h.symbol === selectedStock.symbol);
      if (!existing || existing.quantity < qty) {
        alert('You do not own enough shares to sell!');
        return;
      }

      const originalCostOfSoldShares = existing.avgBuyPrice * qty;


      setBalance(prev => prev + totalAmount);
      
      setHoldings(prev => {
        return prev.map(h => {
          if (h.symbol === selectedStock.symbol) {
            const nextQty = h.quantity - qty;
            const nextTotalCost = h.totalCost - originalCostOfSoldShares;
            return {
              ...h,
              quantity: nextQty,
              totalCost: nextTotalCost,
              currentValue: nextQty * price,
              pnl: (nextQty * price) - nextTotalCost,
              pnlPercent: nextTotalCost > 0 ? (((nextQty * price) - nextTotalCost) / nextTotalCost) * 100 : 0
            };
          }
          return h;
        }).filter(h => h.quantity > 0);
      });
    }

    // Add log entry
    const newLog: TradeLogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      symbol: selectedStock.symbol,
      type,
      quantity: qty,
      price,
      totalAmount
    };
    setTradeLogs(prev => [newLog, ...prev]);
  };

  // Run backtester
  const handleRunBacktest = () => {
    if (!selectedStock) return;
    const results = runBacktest(selectedStock.history, backtestConfig);
    setBacktestResults(results);
  };

  // Trigger alert setup
  const addAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertTargetPrice || isNaN(parseFloat(alertTargetPrice))) return;

    const newAlert: PriceAlert = {
      id: Math.random().toString(36).substr(2, 9),
      symbol: selectedSymbol,
      targetPrice: parseFloat(parseFloat(alertTargetPrice).toFixed(2)),
      condition: alertCondition,
      active: true,
      createdAt: new Date().toLocaleTimeString()
    };

    setAlerts(prev => [newAlert, ...prev]);
    setAlertTargetPrice('');
  };

  const removeAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const removeTriggeredAlert = (id: string) => {
    setTriggeredAlerts(prev => prev.filter(a => a.id !== id));
  };

  // Filter watchlist
  const filteredStocks = stocks.filter(s => {
    const matchesSearch = s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = signalFilter === 'ALL' || s.signal === signalFilter;
    return matchesSearch && matchesFilter;
  });

  // Calculate portfolio stats
  const totalHoldingsValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  const totalHoldingsCost = holdings.reduce((sum, h) => sum + h.totalCost, 0);
  const portfolioPnl = totalHoldingsValue - totalHoldingsCost;
  const portfolioPnlPercent = totalHoldingsCost > 0 ? (portfolioPnl / totalHoldingsCost) * 100 : 0;

  const getRsiLabel = (rsi: number) => {
    if (rsi < 30) return { label: 'Oversold', color: 'var(--color-buy)' };
    if (rsi > 70) return { label: 'Overbought', color: 'var(--color-sell)' };
    return { label: 'Neutral', color: 'var(--text-secondary)' };
  };

  const getMacdLabel = (hist: number) => {
    if (hist > 0) return { label: 'Bullish Crossover', color: 'var(--color-buy)' };
    return { label: 'Bearish Crossover', color: 'var(--color-sell)' };
  };

  if (stocks.length === 0 || !marketOverview) {
    return (
      <div className="loading-screen">
        <Activity className="spinner" size={48} />
        <p>Loading master dashboard systems...</p>
      </div>
    );
  }

  // Educational content descriptions
  const guides: Record<string, { title: string; calculation: string; usage: string }> = {
    RSI: {
      title: 'Relative Strength Index (RSI)',
      calculation: 'Compares the magnitude of recent gains to recent losses over a 14-day window to measure speed and change of price movements. Scale ranges from 0 to 100.',
      usage: 'Traditionally, RSI below 30 indicates an oversold condition (potential BUY opportunity due to correction limits). RSI above 70 indicates an overbought condition (potential SELL/profit-booking due to exhaustion).'
    },
    MACD: {
      title: 'MACD (Moving Average Convergence Divergence)',
      calculation: 'Subtracts the 26-period Exponential Moving Average (EMA) from the 12-period EMA. A 9-period EMA of the MACD (the "Signal Line") is then plotted on top.',
      usage: 'Bullish signals occur when the MACD line crosses above the Signal Line (green histogram expands). Bearish signals occur when the MACD crosses below the Signal Line.'
    },
    EMA20: {
      title: 'Exponential Moving Average (EMA-20)',
      calculation: 'A type of moving average that places a greater weight and significance on the most recent data points, reacting faster to price action.',
      usage: 'In active uptrends, price tends to stay above the 20-EMA. If price falls below the 20-EMA, it indicates a breakdown and serves as a dynamic short-term stop-loss point.'
    },
    SMA50: {
      title: 'Simple Moving Average (SMA-50)',
      calculation: 'The average price of the stock over the last 50 days. Smoothes out short-term fluctuations to show long-term trend support.',
      usage: 'Used to identify the macro trend. If the stock trades above SMA-50, it is in a bullish environment. Golden crossover occurs when a shorter EMA crosses above the SMA-50.'
    }
  };

  return (
    <div className="dashboard-container">
      {/* Styles for new components */}
      <style>{`
        .dashboard-container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          padding: 24px;
          gap: 24px;
          max-width: 1600px;
          margin: 0 auto;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          border-radius: 16px;
        }
        .header-title-sec {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .header-logo {
          background: var(--accent-primary);
          color: white;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          font-weight: 800;
          font-size: 18px;
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
        }
        .header h1 {
          font-family: var(--font-display);
          font-size: 24px;
          font-weight: 800;
          margin: 0;
          color: var(--text-primary);
        }
        
        /* Master Navigation Tab Row */
        .tab-row {
          display: flex;
          gap: 12px;
          border-bottom: 1px solid var(--glass-border);
          padding-bottom: 2px;
        }
        .tab-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 14px;
          padding: 10px 16px;
          cursor: pointer;
          transition: all var(--transition-fast);
          display: flex;
          align-items: center;
          gap: 8px;
          border-bottom: 2px solid transparent;
        }
        .tab-btn:hover {
          color: var(--text-primary);
        }
        .tab-btn.active {
          color: var(--accent-primary);
          border-bottom-color: var(--accent-primary);
        }

        .main-layout {
          display: grid;
          grid-template-columns: 360px 1fr;
          gap: 24px;
          align-items: start;
        }

        /* Sidebar Watchlist */
        .watchlist-sidebar {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 20px;
          height: calc(100vh - 200px);
          position: sticky;
          top: 24px;
        }
        .search-input {
          width: 100%;
          background: #ffffff;
          border: 1px solid rgba(0, 0, 0, 0.08);
          padding: 10px 12px 10px 40px;
          border-radius: 10px;
          color: var(--text-primary);
          outline: none;
          box-shadow: 0 2px 8px rgba(0,0,0,0.02);
          transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
        }
        .search-input:focus {
          border-color: var(--accent-primary);
          box-shadow: 0 2px 12px rgba(79, 70, 229, 0.08);
        }
        .watchlist-scroll {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .watchlist-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 16px;
          border-radius: 12px;
          background: #ffffff;
          border: 1px solid rgba(0, 0, 0, 0.04);
          cursor: pointer;
          transition: all var(--transition-fast);
          box-shadow: 0 2px 8px rgba(0,0,0,0.01);
        }
        .watchlist-item:hover {
          background: rgba(255, 255, 255, 0.9);
          border-color: rgba(99, 102, 241, 0.2);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.02);
        }
        .watchlist-item.selected {
          background: rgba(79, 70, 229, 0.06);
          border-color: var(--accent-primary);
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.04);
        }
        
        /* Portfolio simulator styling */
        .portfolio-overview {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        .stat-card {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .stat-num {
          font-family: var(--font-display);
          font-size: 24px;
          font-weight: 700;
        }

        .portfolio-sections {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 24px;
        }
        .portfolio-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .portfolio-table th {
          color: var(--text-muted);
          font-size: 12px;
          font-weight: 600;
          padding: 12px 16px;
          border-bottom: 1px solid var(--glass-border);
          text-transform: uppercase;
        }
        .portfolio-table td {
          padding: 16px;
          border-bottom: 1px solid rgba(255,255,255,0.03);
          font-size: 13.5px;
        }
        .trading-panel {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* Backtest config sandbox styles */
        .backtest-grid {
          display: grid;
          grid-template-columns: 360px 1fr;
          gap: 24px;
        }
        .backtest-form {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .backtest-results-card {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .backtest-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        /* Market index breadth overview styles */
        .indices-grid-market {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        .market-sections {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        .advance-decline-card {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .adv-dec-progress-bar {
          height: 16px;
          background: rgba(255,255,255,0.03);
          border-radius: 8px;
          overflow: hidden;
          display: flex;
        }

        /* Education Guidebook modal popover style */
        .guide-popover {
          background: rgba(18, 20, 29, 0.98);
          border: 1px solid var(--accent-primary);
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.6);
          position: absolute;
          z-index: 100;
          width: 320px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          animation: slide-in 0.2s ease-out;
        }
        .info-indicator-btn {
          cursor: pointer;
          color: var(--text-muted);
          transition: color var(--transition-fast);
        .info-indicator-btn:hover {
          color: var(--accent-primary);
        }

        /* Screener Charts & Indicators Layout */
        .chart-card {
          padding: 24px;
        }
        .indicators-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-top: 24px;
        }
        .indicator-panel {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          justify-content: space-between;
          min-height: 110px;
        }
        .indicator-value-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: auto;
        }
        .indicator-value {
          font-size: 24px;
          font-weight: 700;
          color: var(--text-primary);
          font-family: var(--font-display);
        }
        .indicator-badge {
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
      `}</style>

      {/* Triggered Alerts Notification System */}
      <div className="triggered-alerts-container">
        {triggeredAlerts.map(ta => (
          <div key={ta.id} className="triggered-alert-card">
            <Bell size={20} color="var(--color-hold)" />
            <div style={{ fontSize: '13px' }}>
              <strong>Price Alert Triggered</strong>
              <div>{ta.msg}</div>
            </div>
            <button className="close-alert-btn" onClick={() => removeTriggeredAlert(ta.id)}>
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Header Panel */}
      <div className="header glass-panel">
        <div className="header-title-sec">
          <div className="header-logo">₹</div>
          <div>
            <h1>NDIM-Fin Trading Signals</h1>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Indian Markets Technical Screener & Mastery Tool</p>
          </div>
        </div>
        <div className="live-badge">
          <div className="pulse-dot" />
          <span>Simulating Live Feeds</span>
        </div>
      </div>

      {/* Master Tabs Menu */}
      <div className="tab-row">
        <button className={`tab-btn ${activeTab === 'SCREENER' ? 'active' : ''}`} onClick={() => setActiveTab('SCREENER')}>
          <Activity size={16} /> Screener & Charts
        </button>
        <button className={`tab-btn ${activeTab === 'PORTFOLIO' ? 'active' : ''}`} onClick={() => setActiveTab('PORTFOLIO')}>
          <Briefcase size={16} /> Paper Portfolio
        </button>
        <button className={`tab-btn ${activeTab === 'BACKTESTER' ? 'active' : ''}`} onClick={() => setActiveTab('BACKTESTER')}>
          <History size={16} /> Backtest Sandbox
        </button>
        <button className={`tab-btn ${activeTab === 'MARKET' ? 'active' : ''}`} onClick={() => setActiveTab('MARKET')}>
          <Globe size={16} /> Market Overview
        </button>
        <button className={`tab-btn ${activeTab === 'GLOSSARY' ? 'active' : ''}`} onClick={() => setActiveTab('GLOSSARY')}>
          <BookOpen size={16} /> Glossary Reference
        </button>
      </div>

      {/* Technical analysis guidebook popover */}
      {activeGuide && (
        <div className="guide-popover glass-panel" style={{ right: '50px', top: '150px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ fontSize: '14px', color: 'var(--accent-primary)', fontWeight: 700 }}>{guides[activeGuide].title}</h4>
            <button style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }} onClick={() => setActiveGuide(null)}>
              <X size={14} />
            </button>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-primary)' }}><strong>How it works:</strong> {guides[activeGuide].calculation}</p>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}><strong>Trading Guide:</strong> {guides[activeGuide].usage}</p>
        </div>
      )}

      {/* Grid Layout depending on selected tabs */}
      <div className="main-layout">
        {/* Watchlist Sidebar (Stays for Screener, Portfolio, and Backtester) */}
        <div className="watchlist-sidebar glass-panel">
          <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} color="var(--accent-primary)" /> Watchlist
          </h2>
          
          <div className="search-container" style={{ position: 'relative' }}>
            <Search className="search-icon" size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search symbol or company..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
              style={{ paddingLeft: '40px' }}
            />
          </div>

          <div className="filter-row">
            {['ALL', 'BUY', 'SELL', 'HOLD'].map(f => (
              <button 
                key={f}
                className={`filter-btn ${signalFilter === f ? 'active' : ''}`}
                onClick={() => setSignalFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="watchlist-scroll">
            {filteredStocks.map(stock => {
              const changeDir = stock.change >= 0;
              const flash = priceFlash[stock.symbol];
              const flashClass = flash === 'up' ? 'flash-up' : flash === 'down' ? 'flash-down' : '';

              return (
                <div 
                  key={stock.symbol}
                  className={`watchlist-item ${selectedSymbol === stock.symbol ? 'selected' : ''} ${flashClass}`}
                  onClick={() => setSelectedSymbol(stock.symbol)}
                >
                  <div className="watchlist-item-left">
                    <span className="watchlist-symbol">{stock.symbol}</span>
                    <span className="watchlist-sector" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{stock.name.split(' ')[0]}</span>
                  </div>
                  <div className="watchlist-item-right" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <span className="watchlist-price" style={{ fontSize: '14px', fontWeight: 600 }}>₹{stock.price.toFixed(2)}</span>
                    <span className={`watchlist-change ${changeDir ? 'up' : 'down'}`} style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '2px', color: changeDir ? 'var(--color-buy)' : 'var(--color-sell)' }}>
                      {changeDir ? '+' : ''}{stock.changePercent.toFixed(2)}%
                    </span>
                    <span className={`badge ${stock.signal.toLowerCase()}`} style={{ fontSize: '9px', fontWeight: 700 }}>{stock.signal}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tab content renders on the right */}
        <div>
          {/* TAB 1: SCREENER & CHARTS */}
          {activeTab === 'SCREENER' && (
            <div className="details-panel" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Stock Hero Row */}
              <div className="glass-panel stock-hero">
                <div className="hero-left">
                  <span className="sector-tag">{selectedStock.sector}</span>
                  <h2 className="stock-name-title">
                    {selectedStock.name}
                    <span className="symbol-sub">{selectedStock.symbol} (NSE)</span>
                  </h2>
                </div>
                <div className="hero-right">
                  <span className={`hero-price ${priceFlash[selectedStock.symbol] === 'up' ? 'flash-up' : priceFlash[selectedStock.symbol] === 'down' ? 'flash-down' : ''}`}>
                    ₹{selectedStock.price.toFixed(2)}
                  </span>
                  <span className={`hero-change ${selectedStock.change >= 0 ? 'watchlist-change up' : 'watchlist-change down'}`}>
                    {selectedStock.change >= 0 ? '+' : ''}{selectedStock.change.toFixed(2)} ({selectedStock.changePercent.toFixed(2)}%)
                  </span>
                </div>
              </div>

              {/* Trade execution options directly in details */}
              <div className="glass-panel" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Briefcase size={20} color="var(--accent-primary)" />
                  <div>
                    <strong style={{ fontSize: '14px' }}>Simulated Paper Trading</strong>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Test this signal. Starting cash limit: ₹10,00,000</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>SHARES</label>
                    <input 
                      type="number" 
                      value={tradeQuantity} 
                      onChange={(e) => setTradeQuantity(e.target.value)} 
                      style={{ width: '70px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', padding: '6px', borderRadius: '6px', color: 'white', fontSize: '13px', textAlign: 'center' }} 
                    />
                  </div>
                  <button 
                    onClick={() => executeVirtualTrade('BUY')}
                    className="alert-btn" 
                    style={{ background: 'var(--color-buy)', border: 'none', padding: '10px 18px', fontWeight: 700 }}
                  >
                    VIRTUAL BUY
                  </button>
                  <button 
                    onClick={() => executeVirtualTrade('SELL')}
                    className="alert-btn" 
                    style={{ background: 'var(--color-sell)', border: 'none', padding: '10px 18px', fontWeight: 700 }}
                  >
                    VIRTUAL SELL
                  </button>
                </div>
              </div>

              {/* Signals & Targets */}
              <div className="signal-grid">
                <div className="glass-panel signal-card">
                  <div className="signal-card-header">
                    <span className="card-title">
                      <Activity size={16} color="var(--accent-primary)" /> Recommendation Signal
                    </span>
                    <span className={`badge ${selectedStock.signal.toLowerCase()}`}>{selectedStock.signal}</span>
                  </div>

                  <div className="signal-indicator">
                    <div className={`signal-large-badge ${selectedStock.signal.toLowerCase()}`}>
                      {selectedStock.signal}
                    </div>
                    <div className="strength-bar-container" style={{ flex: 1 }}>
                      <div className="strength-header">
                        <span>Signal Strength</span>
                        <span>{selectedStock.signalStrength}%</span>
                      </div>
                      <div className="strength-bar-bg">
                        <div 
                          className={`strength-bar-fill ${selectedStock.signal.toLowerCase()}`}
                          style={{ width: `${selectedStock.signalStrength}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <p className="signal-reason">{selectedStock.signalReason}</p>
                  <button 
                    onClick={() => setShowSignalExplain(true)} 
                    className="alert-btn" 
                    style={{ fontSize: '11px', padding: '6px 12px', marginTop: '10px', width: 'fit-content', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', cursor: 'pointer' }}
                  >
                    Learn Signal Logic
                  </button>
                </div>

                <div className="glass-panel levels-card">
                  <span className="card-title">
                    <Sliders size={16} color="var(--accent-secondary)" /> Target Thresholds (INR)
                  </span>

                  <div className="levels-grid">
                    <div className="level-box">
                      <span className="level-title">Trigger Entry</span>
                      <span className="level-value entry">₹{selectedStock.entryPrice.toFixed(2)}</span>
                    </div>
                    <div className="level-box">
                      <span className="level-title">Take Profit</span>
                      <span className="level-value target">₹{selectedStock.targetPrice.toFixed(2)}</span>
                    </div>
                    <div className="level-box">
                      <span className="level-title">Stop Loss</span>
                      <span className="level-value stop">₹{selectedStock.stopLoss.toFixed(2)}</span>
                    </div>
                  </div>

                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '12px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <AlertTriangle size={12} color="var(--color-hold)" />
                    <span>Calculated targets based on support/resistance and daily ATR volatility.</span>
                  </div>
                </div>
              </div>

              {/* Chart Panel */}
              {(() => {
                const currentData = hoveredData || (selectedStock.history.length > 0 ? selectedStock.history[selectedStock.history.length - 1] : null);
                return (
                  <div className="glass-panel chart-card">
                    <div className="chart-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span className="card-title">60-Day Interactive Trend Chart</span>
                        {currentData && (
                          <div style={{ display: 'flex', gap: '12px', fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                            <span>O: <strong style={{ color: 'var(--text-primary)' }}>₹{currentData.open.toFixed(1)}</strong></span>
                            <span>H: <strong style={{ color: 'var(--color-buy)' }}>₹{currentData.high.toFixed(1)}</strong></span>
                            <span>L: <strong style={{ color: 'var(--color-sell)' }}>₹{currentData.low.toFixed(1)}</strong></span>
                            <span>C: <strong style={{ color: 'var(--text-primary)' }}>₹{currentData.close.toFixed(1)}</strong></span>
                            <span>V: <strong>{currentData.volume.toLocaleString()}</strong></span>
                          </div>
                        )}
                      </div>

                      {/* Interactive Legend Toggles */}
                      <div className="chart-info" style={{ display: 'flex', gap: '10px' }}>
                        <div 
                          onClick={() => setShowEma20(prev => !prev)}
                          style={{ 
                            display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '11.5px', 
                            padding: '4px 10px', borderRadius: '20px', border: '1px solid var(--glass-border)',
                            background: showEma20 ? 'rgba(124, 58, 237, 0.08)' : 'transparent',
                            borderColor: showEma20 ? 'var(--accent-secondary)' : 'var(--glass-border)',
                            color: showEma20 ? 'var(--accent-secondary)' : 'var(--text-muted)',
                            fontWeight: showEma20 ? 600 : 400
                          }}
                        >
                          <div className="legend-color" style={{ background: 'var(--accent-secondary)', width: '6px', height: '6px' }} />
                          <span>EMA (20)</span>
                        </div>

                        <div 
                          onClick={() => setShowSma50(prev => !prev)}
                          style={{ 
                            display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '11.5px', 
                            padding: '4px 10px', borderRadius: '20px', border: '1px solid var(--glass-border)',
                            background: showSma50 ? 'rgba(217, 119, 6, 0.08)' : 'transparent',
                            borderColor: showSma50 ? 'var(--color-hold)' : 'var(--glass-border)',
                            color: showSma50 ? 'var(--color-hold)' : 'var(--text-muted)',
                            fontWeight: showSma50 ? 600 : 400
                          }}
                        >
                          <div className="legend-color" style={{ background: 'var(--color-hold)', width: '6px', height: '6px' }} />
                          <span>SMA (50)</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ width: '100%', height: 350, marginTop: '16px' }}>
                      <ResponsiveContainer>
                        <AreaChart 
                          data={selectedStock.history}
                          onMouseMove={(state) => {
                            if (state && typeof state.activeTooltipIndex === 'number' && selectedStock.history[state.activeTooltipIndex]) {
                              setHoveredData(selectedStock.history[state.activeTooltipIndex]);
                            }
                          }}
                          onMouseLeave={() => setHoveredData(null)}
                        >
                          <defs>
                            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.15}/>
                              <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0.0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                          <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} />
                          <YAxis domain={['auto', 'auto']} stroke="var(--text-muted)" fontSize={11} />
                          <Tooltip 
                            contentStyle={{ 
                              background: 'rgba(255, 255, 255, 0.95)', 
                              borderColor: 'var(--glass-border)',
                              borderRadius: '8px',
                              color: 'var(--text-primary)',
                              boxShadow: 'var(--glass-shadow)',
                              fontSize: '12px'
                            }} 
                          />
                          <Area type="monotone" dataKey="close" stroke="var(--accent-primary)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPrice)" name="Price (₹)" />
                          {showEma20 && <Area type="monotone" dataKey="ema20" stroke="var(--accent-secondary)" strokeWidth={1.5} fillOpacity={0} name="EMA (20)" />}
                          {showSma50 && <Area type="monotone" dataKey="sma50" stroke="var(--color-hold)" strokeWidth={1.5} fillOpacity={0} name="SMA (50)" />}
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                );
              })()}

              {/* Technical Indicators Summary */}
              <div className="indicators-grid">
                {/* RSI */}
                <div className="glass-panel indicator-panel">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="card-title" style={{ fontSize: '12px' }}>Relative Strength (RSI-14)</span>
                    <Info size={14} className="info-indicator-btn" onClick={() => setActiveGuide('RSI')} />
                  </div>
                  <div className="indicator-value-row">
                    <span className="indicator-value">{selectedStock.indicators.rsi}</span>
                    <span className="indicator-badge" style={{ 
                      background: getRsiLabel(selectedStock.indicators.rsi).color + '20',
                      color: getRsiLabel(selectedStock.indicators.rsi).color,
                      border: `1px solid ${getRsiLabel(selectedStock.indicators.rsi).color}40`
                    }}>
                      {getRsiLabel(selectedStock.indicators.rsi).label}
                    </span>
                  </div>
                </div>

                {/* MACD */}
                <div className="glass-panel indicator-panel">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="card-title" style={{ fontSize: '12px' }}>MACD (12, 26, 9)</span>
                    <Info size={14} className="info-indicator-btn" onClick={() => setActiveGuide('MACD')} />
                  </div>
                  <div className="indicator-value-row">
                    <span className="indicator-value">{selectedStock.indicators.macdLine.toFixed(2)}</span>
                    <span className="indicator-badge" style={{ 
                      background: getMacdLabel(selectedStock.indicators.histogram).color + '20',
                      color: getMacdLabel(selectedStock.indicators.histogram).color,
                      border: `1px solid ${getMacdLabel(selectedStock.indicators.histogram).color}40`
                    }}>
                      {getMacdLabel(selectedStock.indicators.histogram).label}
                    </span>
                  </div>
                </div>

                {/* Moving Averages */}
                <div className="glass-panel indicator-panel">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="card-title" style={{ fontSize: '12px' }}>EMA (20) & SMA (50)</span>
                    <Info size={14} className="info-indicator-btn" onClick={() => setActiveGuide('EMA20')} />
                  </div>
                  <div className="indicator-value-row">
                    <span className="indicator-value" style={{ fontSize: '18px' }}>
                      ₹{selectedStock.indicators.ema20}
                    </span>
                    <span className="indicator-badge" style={{ 
                      background: selectedStock.price > selectedStock.indicators.ema20 ? 'var(--color-buy)20' : 'var(--color-sell)20',
                      color: selectedStock.price > selectedStock.indicators.ema20 ? 'var(--color-buy)' : 'var(--color-sell)',
                      border: `1px solid ${selectedStock.price > selectedStock.indicators.ema20 ? 'var(--color-buy)40' : 'var(--color-sell)40'}`
                    }}>
                      {selectedStock.price > selectedStock.indicators.ema20 ? 'Bullish Trend' : 'Bearish Trend'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Alert Setup Row */}
              <div className="alert-section">
                <div className="glass-panel alert-form-card">
                  <h3 style={{ fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Plus size={16} color="var(--accent-primary)" /> Set Price Alert
                  </h3>
                  <form onSubmit={addAlert} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="form-group">
                      <label>Trigger Condition</label>
                      <div className="alert-input-row">
                        <select value={alertCondition} onChange={(e) => setAlertCondition(e.target.value as 'ABOVE' | 'BELOW')} className="alert-select">
                          <option value="ABOVE">Price Goes ABOVE</option>
                          <option value="BELOW">Price Goes BELOW</option>
                        </select>
                        <input type="text" placeholder={`Target (e.g. ${selectedStock.price.toFixed(0)})`} value={alertTargetPrice} onChange={(e) => setAlertTargetPrice(e.target.value)} className="alert-input" />
                      </div>
                    </div>
                    <button type="submit" className="alert-btn"><Plus size={16} /> Create Alert</button>
                  </form>
                </div>

                <div className="glass-panel alerts-list-card">
                  <h3 style={{ fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <Bell size={16} color="var(--accent-secondary)" /> Active Price Monitors
                  </h3>
                  {alerts.length === 0 ? (
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', margin: 'auto 0' }}>No active alerts. Add one on the left.</p>
                  ) : (
                    alerts.map(a => (
                      <div key={a.id} className="alert-item">
                        <span style={{ fontSize: '13px' }}>{a.symbol} {a.condition.toLowerCase()} <strong>₹{a.targetPrice}</strong></span>
                        <button className="delete-alert-btn" onClick={() => removeAlert(a.id)}><Trash2 size={14} /></button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PORTFOLIO (PAPER TRADING) */}
          {activeTab === 'PORTFOLIO' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="portfolio-overview">
                <div className="glass-panel stat-card">
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Virtual Balance (Cash)</span>
                  <span className="stat-num" style={{ color: 'var(--text-primary)' }}>₹{balance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="glass-panel stat-card">
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Holdings Value</span>
                  <span className="stat-num" style={{ color: 'var(--accent-primary)' }}>₹{totalHoldingsValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="glass-panel stat-card">
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total Assets</span>
                  <span className="stat-num" style={{ color: 'white' }}>₹{(balance + totalHoldingsValue).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="glass-panel stat-card">
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total P&L</span>
                  <span className={`stat-num ${portfolioPnl >= 0 ? 'text-green-500' : 'text-red-500'}`} style={{ color: portfolioPnl >= 0 ? 'var(--color-buy)' : 'var(--color-sell)' }}>
                    ₹{portfolioPnl >= 0 ? '+' : ''}{portfolioPnl.toLocaleString('en-IN', { maximumFractionDigits: 2 })} ({portfolioPnlPercent.toFixed(2)}%)
                  </span>
                </div>
              </div>

              <div className="portfolio-sections">
                {/* Holdings List */}
                <div className="glass-panel" style={{ overflow: 'hidden' }}>
                  <h3 style={{ padding: '20px', fontSize: '15px', borderBottom: '1px solid var(--glass-border)' }}>Active Stock Positions</h3>
                  {holdings.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <Briefcase size={36} style={{ marginBottom: '12px', color: 'var(--text-muted)' }} />
                      <p>You have no active holdings. Go to the screener tab to buy virtual shares.</p>
                    </div>
                  ) : (
                    <table className="portfolio-table">
                      <thead>
                        <tr>
                          <th>Symbol</th>
                          <th>Qty</th>
                          <th>Avg Cost</th>
                          <th>Live Price</th>
                          <th>Total Value</th>
                          <th>P&L (%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {holdings.map(h => (
                          <tr key={h.symbol}>
                            <td style={{ fontWeight: 700 }}>{h.symbol}</td>
                            <td>{h.quantity}</td>
                            <td>₹{h.avgBuyPrice.toFixed(2)}</td>
                            <td>₹{h.currentPrice.toFixed(2)}</td>
                            <td>₹{h.currentValue.toFixed(2)}</td>
                            <td style={{ color: h.pnl >= 0 ? 'var(--color-buy)' : 'var(--color-sell)', fontWeight: 600 }}>
                              ₹{h.pnl >= 0 ? '+' : ''}{h.pnl.toFixed(2)} ({h.pnlPercent.toFixed(2)}%)
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Trade ledger / logs */}
                <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <History size={16} color="var(--accent-secondary)" /> Transaction Ledger
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
                    {tradeLogs.length === 0 ? (
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '40px' }}>No transactions recorded.</p>
                    ) : (
                      tradeLogs.map(log => (
                        <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '8px' }}>
                          <div>
                            <span className={`badge ${log.type.toLowerCase()}`} style={{ marginRight: '6px' }}>{log.type}</span>
                            <strong>{log.symbol}</strong>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{log.timestamp}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div>{log.quantity} shares @ ₹{log.price.toFixed(0)}</div>
                            <div style={{ fontWeight: 600 }}>₹{log.totalAmount.toFixed(0)}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BACKTEST SANDBOX */}
          {activeTab === 'BACKTESTER' && (
            <div className="backtest-grid">
              {/* Backtest Configuration */}
              <div className="glass-panel backtest-form">
                <h3 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sliders size={18} color="var(--accent-primary)" /> Strategy Inputs
                </h3>
                
                <div className="form-group">
                  <label>RSI Period: {backtestConfig.rsiPeriod} days</label>
                  <input 
                    type="range" min="5" max="30" 
                    value={backtestConfig.rsiPeriod} 
                    onChange={(e) => setBacktestConfig({ ...backtestConfig, rsiPeriod: parseInt(e.target.value) })}
                    style={{ accentColor: 'var(--accent-primary)' }}
                  />
                </div>

                <div className="form-group">
                  <label>RSI Oversold Trigger (BUY): {backtestConfig.rsiOversold}</label>
                  <input 
                    type="range" min="15" max="45" 
                    value={backtestConfig.rsiOversold} 
                    onChange={(e) => setBacktestConfig({ ...backtestConfig, rsiOversold: parseInt(e.target.value) })}
                    style={{ accentColor: 'var(--color-buy)' }}
                  />
                </div>

                <div className="form-group">
                  <label>RSI Overbought Trigger (SELL): {backtestConfig.rsiOverbought}</label>
                  <input 
                    type="range" min="55" max="85" 
                    value={backtestConfig.rsiOverbought} 
                    onChange={(e) => setBacktestConfig({ ...backtestConfig, rsiOverbought: parseInt(e.target.value) })}
                    style={{ accentColor: 'var(--color-sell)' }}
                  />
                </div>

                <div className="form-group">
                  <label>Fast EMA Period: {backtestConfig.emaFast} days</label>
                  <input 
                    type="range" min="5" max="40" 
                    value={backtestConfig.emaFast} 
                    onChange={(e) => setBacktestConfig({ ...backtestConfig, emaFast: parseInt(e.target.value) })}
                    style={{ accentColor: 'var(--accent-secondary)' }}
                  />
                </div>

                <div className="form-group">
                  <label>Slow SMA Trend Filter: {backtestConfig.smaSlow} days</label>
                  <input 
                    type="range" min="30" max="100" 
                    value={backtestConfig.smaSlow} 
                    onChange={(e) => setBacktestConfig({ ...backtestConfig, smaSlow: parseInt(e.target.value) })}
                    style={{ accentColor: 'var(--color-hold)' }}
                  />
                </div>

                <button 
                  onClick={handleRunBacktest}
                  className="alert-btn" 
                  style={{ background: 'var(--accent-primary)', width: '100%', marginTop: '10px', fontWeight: 700 }}
                >
                  RUN SIMULATION BACKTEST
                </button>
              </div>

              {/* Backtest Simulation Report */}
              <div className="glass-panel backtest-results-card">
                <h3 style={{ fontSize: '16px', fontWeight: 600 }}>
                  Backtest Simulation Report: <span style={{ color: 'var(--accent-primary)' }}>{selectedStock.symbol}</span> (60 Days Daily Data)
                </h3>
                
                {!backtestResults ? (
                  <div style={{ textAlign: 'center', margin: 'auto 0', padding: '40px', color: 'var(--text-muted)' }}>
                    <History size={48} style={{ marginBottom: '16px', color: 'var(--text-muted)' }} />
                    <p>Select a stock, adjust strategy parameters on the left, and run the simulator to backtest.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="backtest-stats-grid">
                      <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Total Trades</span>
                        <div style={{ fontSize: '24px', fontWeight: 700, margin: '6px 0' }}>{backtestResults.totalTrades}</div>
                      </div>
                      <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Win Rate %</span>
                        <div style={{ fontSize: '24px', fontWeight: 700, margin: '6px 0', color: backtestResults.winRate >= 50 ? 'var(--color-buy)' : 'var(--color-sell)' }}>
                          {backtestResults.winRate}%
                        </div>
                      </div>
                      <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Total Return</span>
                        <div style={{ fontSize: '24px', fontWeight: 700, margin: '6px 0', color: backtestResults.totalReturn >= 0 ? 'var(--color-buy)' : 'var(--color-sell)' }}>
                          {backtestResults.totalReturn >= 0 ? '+' : ''}{backtestResults.totalReturn}%
                        </div>
                      </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 600 }}>Ledger Simulation Summary</h4>
                      <div style={{ display: 'flex', justifyItems: 'space-between', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span>Initial Balance:</span>
                        <strong>₹{backtestResults.initialBalance.toLocaleString()}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyItems: 'space-between', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span>Final Asset Balance:</span>
                        <strong>₹{backtestResults.finalBalance.toLocaleString()}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyItems: 'space-between', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span>Profit Factor (Gross Profits / Gross Losses):</span>
                        <strong style={{ color: backtestResults.profitFactor >= 1.5 ? 'var(--color-buy)' : 'var(--color-hold)' }}>{backtestResults.profitFactor}</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: MARKET OVERVIEW */}
          {activeTab === 'MARKET' && marketOverview && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Indices Panel */}
              <div className="indices-grid-market">
                {marketOverview.indices.map(idx => {
                  const gain = idx.change >= 0;
                  return (
                    <div key={idx.name} className="glass-panel" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{idx.name}</strong>
                        <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px' }}>{idx.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                      </div>
                      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: gain ? 'var(--color-buy)' : 'var(--color-sell)' }}>
                          {gain ? '+' : ''}{idx.changePercent}%
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{idx.change.toFixed(1)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Breadth and Flows */}
              <div className="market-sections">
                {/* Advance Decline Breadth */}
                <div className="glass-panel advance-decline-card">
                  <h3 style={{ fontSize: '14px', fontWeight: 600 }}>Nifty 50 Advance-Decline Breadth</h3>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600 }}>
                    <span style={{ color: 'var(--color-buy)' }}>Advances: {marketOverview.advanceDecline.advances}</span>
                    <span style={{ color: 'var(--text-muted)' }}>Unchanged: {marketOverview.advanceDecline.unchanged}</span>
                    <span style={{ color: 'var(--color-sell)' }}>Declines: {marketOverview.advanceDecline.declines}</span>
                  </div>

                  <div className="adv-dec-progress-bar">
                    <div style={{ width: `${(marketOverview.advanceDecline.advances / 50) * 100}%`, background: 'var(--color-buy)' }} />
                    <div style={{ width: `${(marketOverview.advanceDecline.unchanged / 50) * 100}%`, background: 'var(--text-muted)' }} />
                    <div style={{ width: `${(marketOverview.advanceDecline.declines / 50) * 100}%`, background: 'var(--color-sell)' }} />
                  </div>

                  {/* Sector Performance */}
                  <h3 style={{ fontSize: '14px', fontWeight: 600, marginTop: '10px' }}>Sector Daily Return Heatmap</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {marketOverview.sectors.map(sec => {
                      const pos = sec.changePercent >= 0;
                      return (
                        <div key={sec.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', borderRadius: '8px', fontSize: '12px' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>{sec.name}</span>
                          <span style={{ fontWeight: 600, color: pos ? 'var(--color-buy)' : 'var(--color-sell)' }}>
                            {pos ? '+' : ''}{sec.changePercent}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* FII DII Net Flows */}
                <div className="glass-panel" style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Institutional Cash Market Flows (₹ Crores)</h3>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '16px' }}>Tracks FII and DII buying power, showing structural flow support in Indian stocks.</p>
                  
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        <th style={{ padding: '8px 4px', color: 'var(--text-muted)', fontSize: '11px' }}>Date</th>
                        <th style={{ padding: '8px 4px', color: 'var(--text-muted)', fontSize: '11px' }}>FII Net Flow</th>
                        <th style={{ padding: '8px 4px', color: 'var(--text-muted)', fontSize: '11px' }}>DII Net Flow</th>
                      </tr>
                    </thead>
                    <tbody>
                      {marketOverview.fiiDiiFlows.map((flow, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                          <td style={{ padding: '10px 4px', fontWeight: 600 }}>{flow.date}</td>
                          <td style={{ padding: '10px 4px', color: flow.fiiNet >= 0 ? 'var(--color-buy)' : 'var(--color-sell)', fontWeight: 600 }}>
                            {flow.fiiNet >= 0 ? '+' : ''}{flow.fiiNet.toFixed(1)}
                          </td>
                          <td style={{ padding: '10px 4px', color: flow.diiNet >= 0 ? 'var(--color-buy)' : 'var(--color-sell)', fontWeight: 600 }}>
                            {flow.diiNet >= 0 ? '+' : ''}{flow.diiNet.toFixed(1)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          {/* TAB 5: GLOSSARY */}
          {activeTab === 'GLOSSARY' && (() => {
            const filteredGlossary = GLOSSARY_TERMS.filter(g => {
              const matchesSearch = g.term.toLowerCase().includes(glossarySearch.toLowerCase()) ||
                                    g.definition.toLowerCase().includes(glossarySearch.toLowerCase());
              const matchesCategory = glossaryCatFilter === 'ALL' || g.category.toUpperCase() === glossaryCatFilter;
              return matchesSearch && matchesCategory;
            });
            const glossaryItemsPerPage = 6;
            const totalGlossaryPages = Math.max(1, Math.ceil(filteredGlossary.length / glossaryItemsPerPage));
            const currentPage = Math.min(glossaryPage, totalGlossaryPages);
            const paginatedGlossary = filteredGlossary.slice(
              (currentPage - 1) * glossaryItemsPerPage,
              currentPage * glossaryItemsPerPage
            );

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <h2 style={{ fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <BookOpen size={22} color="var(--accent-primary)" /> Stock Screener Glossary & Educational Terms
                    </h2>
                    <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
                      Learn and master the technical jargon, risk strategies, and metrics used in Indian Stock trading.
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div className="search-container" style={{ position: 'relative', width: '220px' }}>
                      <Search className="search-icon" size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input 
                        type="text" 
                        placeholder="Search terms..." 
                        value={glossarySearch}
                        onChange={(e) => { setGlossarySearch(e.target.value); setGlossaryPage(1); }}
                        className="search-input"
                        style={{ paddingLeft: '32px', fontSize: '13px', height: '36px' }}
                      />
                    </div>
                    
                    <select 
                      value={glossaryCatFilter} 
                      onChange={(e) => { setGlossaryCatFilter(e.target.value); setGlossaryPage(1); }}
                      className="alert-select"
                      style={{ height: '36px', fontSize: '13px' }}
                    >
                      <option value="ALL">All Categories</option>
                      <option value="SIGNALS">Signals</option>
                      <option value="TECHNICAL">Technical Indicators</option>
                      <option value="RISK">Risk Management</option>
                      <option value="MARKET">Market Mechanics</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
                  {paginatedGlossary.length === 0 ? (
                    <div className="glass-panel" style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <Search size={36} style={{ marginBottom: '12px' }} />
                      <p>No terms matching your search criteria.</p>
                    </div>
                  ) : (
                    paginatedGlossary.map((g, idx) => (
                      <div key={idx} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <strong style={{ fontSize: '15px', color: 'white' }}>{g.term}</strong>
                            <span className="badge hold" style={{ fontSize: '8px' }}>{g.category}</span>
                          </div>
                          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.45' }}>{g.definition}</p>
                        </div>
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '10px', fontSize: '11.5px', color: 'var(--accent-secondary)' }}>
                          <strong>Mastery Tip:</strong> {g.tip}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {totalGlossaryPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
                    <button 
                      disabled={currentPage === 1}
                      onClick={() => setGlossaryPage(prev => Math.max(1, prev - 1))}
                      className="filter-btn"
                      style={{ width: '80px', opacity: currentPage === 1 ? 0.4 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                    >
                      Previous
                    </button>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      Page <strong>{currentPage}</strong> of <strong>{totalGlossaryPages}</strong>
                    </span>
                    <button 
                      disabled={currentPage === totalGlossaryPages}
                      onClick={() => setGlossaryPage(prev => Math.min(totalGlossaryPages, prev + 1))}
                      className="filter-btn"
                      style={{ width: '80px', opacity: currentPage === totalGlossaryPages ? 0.4 : 1, cursor: currentPage === totalGlossaryPages ? 'not-allowed' : 'pointer' }}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Modal Popup for Signal Breakdown Explanation */}
      {showSignalExplain && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div className="glass-panel" style={{
            width: '90%',
            maxWidth: '550px',
            padding: '28px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <button 
              style={{ position: 'absolute', right: '20px', top: '20px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              onClick={() => setShowSignalExplain(false)}
            >
              <X size={20} />
            </button>
            
            <h3 style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} color="var(--accent-primary)" /> Technical Signal Analysis
            </h3>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Active Recommendation</div>
                <div className={`signal-large-badge ${selectedStock.signal.toLowerCase()}`} style={{ fontSize: '18px', padding: '4px 12px', marginTop: '4px', width: 'fit-content' }}>
                  {selectedStock.signal}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>Screener Signal Confidence: {selectedStock.signalStrength}%</div>
                <div className="strength-bar-bg" style={{ marginTop: '6px' }}>
                  <div className={`strength-bar-fill ${selectedStock.signal.toLowerCase()}`} style={{ width: `${selectedStock.signalStrength}%`, height: '6px' }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <h4 style={{ fontWeight: 600, color: 'var(--accent-secondary)' }}>Indicator Confluences Explanations:</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>RSI (14 Days) level:</span>
                  <strong>{selectedStock.indicators.rsi} ({selectedStock.indicators.rsi < 35 ? 'Oversold' : selectedStock.indicators.rsi > 65 ? 'Overbought' : 'Neutral'})</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>MACD Hist Status:</span>
                  <strong>{selectedStock.indicators.histogram > 0 ? 'Bullish (Above Signal Line)' : 'Bearish (Below Signal Line)'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Moving Average Trend:</span>
                  <strong>Price is {selectedStock.price > selectedStock.indicators.ema20 ? 'Above 20-EMA (Bullish)' : 'Below 20-EMA (Bearish)'}</strong>
                </div>
              </div>
            </div>

            <div style={{ fontSize: '13px', lineHeight: '1.45', background: 'rgba(99,102,241,0.04)', border: '1px dashed rgba(99,102,241,0.2)', padding: '14px', borderRadius: '8px' }}>
              <strong>Master Analysis Rule:</strong> {selectedStock.signalReason}
            </div>

            <button 
              onClick={() => setShowSignalExplain(false)}
              className="alert-btn" 
              style={{ background: 'var(--accent-primary)', width: '100%', padding: '10px', fontWeight: 700 }}
            >
              Understand & Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export type SignalType = 'BUY' | 'SELL' | 'HOLD';

export interface TechnicalIndicators {
  rsi: number;
  macdLine: number;
  signalLine: number;
  histogram: number;
  ema20: number;
  sma50: number;
}

export interface HistoricalData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ema20?: number;
  sma50?: number;
}

export interface StockData {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high24h: number;
  low24h: number;
  signal: SignalType;
  signalStrength: number;
  signalReason: string;
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  indicators: TechnicalIndicators;
  history: HistoricalData[];
}

export interface PriceAlert {
  id: string;
  symbol: string;
  targetPrice: number;
  condition: 'ABOVE' | 'BELOW';
  active: boolean;
  createdAt: string;
}

// Mastery - Paper Trading Portfolio types
export interface Holding {
  symbol: string;
  quantity: number;
  avgBuyPrice: number;
  currentPrice: number;
  totalCost: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
}

export interface TradeLogEntry {
  id: string;
  timestamp: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  totalAmount: number;
}

// Mastery - Backtesting Sandbox types
export interface BacktestConfig {
  rsiPeriod: number;
  rsiOversold: number;
  rsiOverbought: number;
  emaFast: number;
  smaSlow: number;
}

export interface BacktestResults {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number; // percentage
  totalReturn: number; // percentage
  initialBalance: number;
  finalBalance: number;
  profitFactor: number;
}

// Mastery - Market Breadth and Flow types
export interface IndexStats {
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export interface SectorPerformance {
  name: string;
  changePercent: number;
}

export interface FiiDiiFlow {
  date: string;
  fiiNet: number; // in Crores
  diiNet: number; // in Crores
}

export interface MarketOverviewData {
  indices: IndexStats[];
  advanceDecline: {
    advances: number;
    declines: number;
    unchanged: number;
  };
  sectors: SectorPerformance[];
  fiiDiiFlows: FiiDiiFlow[];
}

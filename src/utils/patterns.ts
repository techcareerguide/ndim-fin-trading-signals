import type { HistoricalData } from '../types';

export interface PatternResult {
  pattern: string;
  type: 'bullish' | 'bearish' | 'neutral';
  description: string;
  tip: string;
}

export function detectPattern(history: HistoricalData[]): PatternResult | null {
  if (history.length < 2) return null;

  const current = history[history.length - 1];
  const previous = history[history.length - 2];

  const body = Math.abs(current.open - current.close);
  const range = current.high - current.low;
  if (range === 0) return null;

  const bodyTop = Math.max(current.open, current.close);
  const bodyBottom = Math.min(current.open, current.close);

  const upperShadow = current.high - bodyTop;
  const lowerShadow = bodyBottom - current.low;

  // 1. Doji Check
  if (body <= range * 0.08) {
    return {
      pattern: 'Doji',
      type: 'neutral',
      description: 'Opening and closing prices are virtually equal, forming a cross shape.',
      tip: 'Indicates intense market indecision. Look for a breakout confirmation on the next candle.'
    };
  }

  // 2. Hammer Check (Bullish Reversal)
  if (lowerShadow >= body * 2 && upperShadow <= body * 0.25 && body > 0) {
    return {
      pattern: 'Hammer',
      type: 'bullish',
      description: 'Small body near the top of the range with a long lower shadow.',
      tip: 'Bullish reversal indicator. Suggests sellers pushed price down, but buyers pushed it back up before close.'
    };
  }

  // 3. Shooting Star Check (Bearish Reversal)
  if (upperShadow >= body * 2 && lowerShadow <= body * 0.25 && body > 0) {
    return {
      pattern: 'Shooting Star',
      type: 'bearish',
      description: 'Small body near the bottom of the range with a long upper shadow.',
      tip: 'Bearish reversal indicator. Indicates buyers pushed price up, but sellers aggressively rejected higher bounds.'
    };
  }

  // Two-candle patterns
  const bodyPrev = Math.abs(previous.open - previous.close);
  const isPrevBearish = previous.close < previous.open;
  const isPrevBullish = previous.close > previous.open;
  const isCurrBearish = current.close < current.open;
  const isCurrBullish = current.close > current.open;

  // 4. Bullish Engulfing
  if (isPrevBearish && isCurrBullish && current.close >= previous.open && current.open <= previous.close && body > bodyPrev) {
    return {
      pattern: 'Bullish Engulfing',
      type: 'bullish',
      description: 'A green body completely engulfs the body of the previous red candle.',
      tip: 'Strong buying momentum. Indicates buyers have completely taken control of the trend direction.'
    };
  }

  // 5. Bearish Engulfing
  if (isPrevBullish && isCurrBearish && current.close <= previous.open && current.open >= previous.close && body > bodyPrev) {
    return {
      pattern: 'Bearish Engulfing',
      type: 'bearish',
      description: 'A red body completely engulfs the body of the previous green candle.',
      tip: 'Strong selling pressure. Indicates sellers have fully overwhelmed buyers, indicating a downturn.'
    };
  }

  return null;
}

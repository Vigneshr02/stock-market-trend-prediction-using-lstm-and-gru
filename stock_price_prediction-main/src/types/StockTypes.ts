export interface StockData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ModelPrediction {
  date: string;
  actual: number;
  predicted: number;
  confidence: number;
}

export interface TechnicalIndicator {
  date: string;
  sma20: number;
  sma50: number;
  rsi: number;
  macd: number;
  signal: number;
  bb_upper: number;
  bb_middle: number;
  bb_lower: number;
}

export interface PerformanceMetric {
  mse: number;
  rmse: number;
  mae: number;
  accuracy: number;
  r2Score: number;
}

export interface Recommendation {
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reason: string;
  targetPrice: number;
  stopLoss: number;
}
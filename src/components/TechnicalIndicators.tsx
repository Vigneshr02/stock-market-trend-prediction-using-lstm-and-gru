import React, { useMemo } from 'react';
import { BarChart3, TrendingUp, Activity, Target } from 'lucide-react';
import { StockData } from '../types/StockTypes';

interface TechnicalIndicatorsProps {
  stockData: StockData[];
}

const TechnicalIndicators: React.FC<TechnicalIndicatorsProps> = ({ stockData }) => {
  const indicators = useMemo(() => {
    if (stockData.length < 50) return [];
    
    return stockData.map((data, index) => {
      // Simple Moving Averages
      const sma20 = index >= 19 
        ? stockData.slice(index - 19, index + 1).reduce((sum, d) => sum + d.close, 0) / 20
        : data.close;
      
      const sma50 = index >= 49
        ? stockData.slice(index - 49, index + 1).reduce((sum, d) => sum + d.close, 0) / 50
        : data.close;
      
      // RSI calculation
      let rsi = 50;
      if (index >= 14) {
        const changes = stockData.slice(index - 13, index + 1).map((d, i, arr) => 
          i === 0 ? 0 : d.close - arr[i - 1].close
        );
        const gains = changes.filter(c => c > 0).reduce((sum, c) => sum + c, 0) / 14;
        const losses = Math.abs(changes.filter(c => c < 0).reduce((sum, c) => sum + c, 0)) / 14;
        rsi = losses === 0 ? 100 : 100 - (100 / (1 + (gains / losses)));
      }
      
      // MACD calculation
      const ema12 = index >= 11
        ? stockData.slice(index - 11, index + 1).reduce((sum, d) => sum + d.close, 0) / 12
        : data.close;
      const ema26 = index >= 25
        ? stockData.slice(index - 25, index + 1).reduce((sum, d) => sum + d.close, 0) / 26
        : data.close;
      const macd = ema12 - ema26;
      
      // Bollinger Bands
      const bb_middle = sma20;
      const variance = index >= 19
        ? stockData.slice(index - 19, index + 1).reduce((sum, d) => sum + Math.pow(d.close - bb_middle, 2), 0) / 20
        : 0;
      const stdDev = Math.sqrt(variance);
      const bb_upper = bb_middle + (stdDev * 2);
      const bb_lower = bb_middle - (stdDev * 2);
      
      return {
        date: data.date,
        close: data.close,
        sma20,
        sma50,
        rsi,
        macd,
        bb_upper,
        bb_middle,
        bb_lower
      };
    });
  }, [stockData]);

  const latestIndicators = indicators[indicators.length - 1];
  
  const getSignalColor = (value: number, type: 'rsi' | 'macd' | 'sma') => {
    switch (type) {
      case 'rsi':
        if (value > 70) return 'text-red-400';
        if (value < 30) return 'text-green-400';
        return 'text-yellow-400';
      case 'macd':
        return value > 0 ? 'text-green-400' : 'text-red-400';
      case 'sma':
        return latestIndicators?.close > value ? 'text-green-400' : 'text-red-400';
      default:
        return 'text-slate-400';
    }
  };

  const getSignalText = (value: number, type: 'rsi' | 'macd' | 'sma') => {
    switch (type) {
      case 'rsi':
        if (value > 70) return 'Overbought';
        if (value < 30) return 'Oversold';
        return 'Neutral';
      case 'macd':
        return value > 0 ? 'Bullish' : 'Bearish';
      case 'sma':
        return latestIndicators?.close > value ? 'Above' : 'Below';
      default:
        return 'Neutral';
    }
  };

  if (!latestIndicators) {
    return (
      <div className="text-center py-16">
        <BarChart3 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Insufficient Data</h3>
        <p className="text-slate-400">Need at least 50 data points for technical analysis</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Technical Analysis</h2>
        <p className="text-slate-400 text-lg">
          Key technical indicators for informed trading decisions
        </p>
      </div>

      {/* Indicator Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/30 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <h3 className="font-semibold text-white">SMA 20</h3>
            </div>
            <span className={`text-sm font-medium ${getSignalColor(latestIndicators.sma20, 'sma')}`}>
              {getSignalText(latestIndicators.sma20, 'sma')}
            </span>
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-bold text-blue-400">
              ${latestIndicators.sma20.toFixed(2)}
            </p>
            <p className="text-slate-400 text-sm">20-day moving average</p>
          </div>
        </div>

        <div className="bg-slate-800/30 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-purple-400" />
              <h3 className="font-semibold text-white">RSI</h3>
            </div>
            <span className={`text-sm font-medium ${getSignalColor(latestIndicators.rsi, 'rsi')}`}>
              {getSignalText(latestIndicators.rsi, 'rsi')}
            </span>
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-bold text-purple-400">
              {latestIndicators.rsi.toFixed(1)}
            </p>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div 
                className="bg-purple-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${latestIndicators.rsi}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/30 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-green-400" />
              <h3 className="font-semibold text-white">MACD</h3>
            </div>
            <span className={`text-sm font-medium ${getSignalColor(latestIndicators.macd, 'macd')}`}>
              {getSignalText(latestIndicators.macd, 'macd')}
            </span>
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-bold text-green-400">
              {latestIndicators.macd.toFixed(2)}
            </p>
            <p className="text-slate-400 text-sm">Moving Average Convergence</p>
          </div>
        </div>

        <div className="bg-slate-800/30 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-orange-400" />
              <h3 className="font-semibold text-white">BB Position</h3>
            </div>
            <span className="text-sm font-medium text-orange-400">
              {latestIndicators.close > latestIndicators.bb_upper ? 'Upper' :
               latestIndicators.close < latestIndicators.bb_lower ? 'Lower' : 'Middle'}
            </span>
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-bold text-orange-400">
              {(((latestIndicators.close - latestIndicators.bb_lower) / 
                (latestIndicators.bb_upper - latestIndicators.bb_lower)) * 100).toFixed(1)}%
            </p>
            <p className="text-slate-400 text-sm">Bollinger Band position</p>
          </div>
        </div>
      </div>

      {/* Chart Visualization */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Price with Moving Averages */}
        <div className="bg-slate-800/30 rounded-xl p-6 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white mb-4">Price & Moving Averages</h3>
          <div className="relative h-64 bg-slate-900/50 rounded-lg p-4">
            <svg width="100%" height="100%" className="absolute inset-0">
              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map(y => (
                <line
                  key={y}
                  x1="0"
                  y1={`${y}%`}
                  x2="100%"
                  y2={`${y}%`}
                  stroke="#334155"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />
              ))}
              
              {(() => {
                const recentData = indicators.slice(-50);
                const maxPrice = Math.max(...recentData.map(d => Math.max(d.close, d.sma20, d.sma50)));
                const minPrice = Math.min(...recentData.map(d => Math.min(d.close, d.sma20, d.sma50)));
                const range = maxPrice - minPrice;
                
                return (
                  <>
                    {/* Price line */}
                    <polyline
                      fill="none"
                      stroke="#60A5FA"
                      strokeWidth="2"
                      points={recentData.map((d, i) => 
                        `${(i / (recentData.length - 1)) * 100},${100 - ((d.close - minPrice) / range) * 100}`
                      ).join(' ')}
                    />
                    
                    {/* SMA 20 line */}
                    <polyline
                      fill="none"
                      stroke="#A78BFA"
                      strokeWidth="1.5"
                      points={recentData.map((d, i) => 
                        `${(i / (recentData.length - 1)) * 100},${100 - ((d.sma20 - minPrice) / range) * 100}`
                      ).join(' ')}
                    />
                    
                    {/* SMA 50 line */}
                    <polyline
                      fill="none"
                      stroke="#34D399"
                      strokeWidth="1.5"
                      points={recentData.map((d, i) => 
                        `${(i / (recentData.length - 1)) * 100},${100 - ((d.sma50 - minPrice) / range) * 100}`
                      ).join(' ')}
                    />
                  </>
                );
              })()}
            </svg>
            
            {/* Legend */}
            <div className="absolute bottom-2 right-2 bg-slate-800/80 rounded p-2 text-xs">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-0.5 bg-blue-400"></div>
                  <span className="text-slate-300">Price</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-0.5 bg-purple-400"></div>
                  <span className="text-slate-300">SMA 20</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-0.5 bg-green-400"></div>
                  <span className="text-slate-300">SMA 50</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RSI Chart */}
        <div className="bg-slate-800/30 rounded-xl p-6 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white mb-4">RSI Oscillator</h3>
          <div className="relative h-64 bg-slate-900/50 rounded-lg p-4">
            <svg width="100%" height="100%" className="absolute inset-0">
              {/* RSI levels */}
              <line x1="0" y1="30%" x2="100%" y2="30%" stroke="#EF4444" strokeWidth="1" strokeDasharray="3,3" />
              <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#6B7280" strokeWidth="1" strokeDasharray="2,2" />
              <line x1="0" y1="70%" x2="100%" y2="70%" stroke="#EF4444" strokeWidth="1" strokeDasharray="3,3" />
              
              {/* RSI line */}
              <polyline
                fill="none"
                stroke="#A78BFA"
                strokeWidth="2"
                points={indicators.slice(-50).map((d, i) => 
                  `${(i / 49) * 100},${100 - d.rsi}`
                ).join(' ')}
              />
            </svg>
            
            {/* Labels */}
            <div className="absolute top-1 left-2 text-xs text-red-400">Overbought (70)</div>
            <div className="absolute top-1/2 left-2 text-xs text-slate-400">Neutral (50)</div>
            <div className="absolute bottom-1 left-2 text-xs text-green-400">Oversold (30)</div>
          </div>
        </div>
      </div>

      {/* Bollinger Bands Table */}
      <div className="bg-slate-800/30 rounded-xl p-6 backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-white mb-4">Bollinger Bands Analysis</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-slate-400 text-sm mb-1">Upper Band</p>
            <p className="text-lg font-semibold text-red-400">
              ${latestIndicators.bb_upper.toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-slate-400 text-sm mb-1">Middle Band (SMA 20)</p>
            <p className="text-lg font-semibold text-white">
              ${latestIndicators.bb_middle.toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-slate-400 text-sm mb-1">Lower Band</p>
            <p className="text-lg font-semibold text-green-400">
              ${latestIndicators.bb_lower.toFixed(2)}
            </p>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-slate-900/50 rounded-lg">
          <p className="text-slate-300 text-sm text-center">
            Current Price: <span className="font-semibold text-white">${latestIndicators.close.toFixed(2)}</span>
            {latestIndicators.close > latestIndicators.bb_upper && (
              <span className="text-red-400 ml-2">• Price above upper band - potential reversal</span>
            )}
            {latestIndicators.close < latestIndicators.bb_lower && (
              <span className="text-green-400 ml-2">• Price below lower band - potential bounce</span>
            )}
            {latestIndicators.close >= latestIndicators.bb_lower && latestIndicators.close <= latestIndicators.bb_upper && (
              <span className="text-yellow-400 ml-2">• Price within bands - normal trading range</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TechnicalIndicators;
import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Target, Shield } from 'lucide-react';
import { StockData, ModelPrediction } from '../types/StockTypes';

interface RecommendationsProps {
  stockData: StockData[];
  predictions: ModelPrediction[];
}

const Recommendations: React.FC<RecommendationsProps> = ({ stockData, predictions }) => {
  const recommendation = useMemo(() => {
    if (stockData.length === 0 || predictions.length === 0) return null;
    
    const currentPrice = stockData[stockData.length - 1].close;
    const latestPrediction = predictions[predictions.length - 1];
    const priceChange = latestPrediction.predicted - currentPrice;
    const priceChangePercent = (priceChange / currentPrice) * 100;
    
    // Calculate trend strength - more sensitive
    const recentPredictions = predictions.slice(-3); // Use last 3 predictions
    let trendUp = 0;
    for (let i = 1; i < recentPredictions.length; i++) {
      if (recentPredictions[i].predicted > recentPredictions[i - 1].predicted) {
        trendUp++;
      }
    }
    const trendStrength = recentPredictions.length > 1 ? trendUp / (recentPredictions.length - 1) : 0.5;
    
    // Calculate volatility
    const recentPrices = stockData.slice(-20).map(d => d.close);
    const avgPrice = recentPrices.reduce((sum, p) => sum + p, 0) / recentPrices.length;
    const variance = recentPrices.reduce((sum, p) => sum + Math.pow(p - avgPrice, 2), 0) / recentPrices.length;
    const volatility = Math.sqrt(variance) / avgPrice;
    
    // Calculate additional indicators
    const recentActualPrices = stockData.slice(-5).map(d => d.close);
    const priceMovingUp = recentActualPrices[recentActualPrices.length - 1] > recentActualPrices[0];
    const avgConfidence = predictions.slice(-3).reduce((sum, p) => sum + p.confidence, 0) / Math.min(3, predictions.length);
    
    // More dynamic recommendation logic
    let action: 'BUY' | 'SELL' | 'HOLD';
    let confidence: number;
    let reason: string;
    
    // BUY conditions - more sensitive
    if (priceChangePercent > 1.5 && trendStrength >= 0.5 && latestPrediction.confidence > 0.7) {
      action = 'BUY';
      confidence = Math.min(0.95, avgConfidence * 0.9 + 0.1);
      reason = `Upward trend predicted with ${priceChangePercent.toFixed(1)}% expected gain. Model confidence: ${(latestPrediction.confidence * 100).toFixed(0)}%`;
    } 
    // SELL conditions - more sensitive  
    else if (priceChangePercent < -1.5 && trendStrength <= 0.5 && latestPrediction.confidence > 0.7) {
      action = 'SELL';
      confidence = Math.min(0.9, avgConfidence * 0.85 + 0.1);
      reason = `Downward trend predicted with ${Math.abs(priceChangePercent).toFixed(1)}% expected decline. Model confidence: ${(latestPrediction.confidence * 100).toFixed(0)}%`;
    }
    // Additional BUY signal for strong positive predictions
    else if (priceChangePercent > 0.8 && priceMovingUp && avgConfidence > 0.75) {
      action = 'BUY';
      confidence = avgConfidence * 0.8;
      reason = `Positive momentum detected with ${priceChangePercent.toFixed(1)}% predicted gain and recent price increases`;
    }
    // Additional SELL signal for negative predictions
    else if (priceChangePercent < -0.8 && !priceMovingUp && avgConfidence > 0.75) {
      action = 'SELL';
      confidence = avgConfidence * 0.8;
      reason = `Negative momentum detected with ${Math.abs(priceChangePercent).toFixed(1)}% predicted decline and recent price decreases`;
    }
    // Weak signals still provide direction
    else if (priceChangePercent > 0.3 && trendStrength > 0.6) {
      action = 'BUY';
      confidence = Math.max(0.5, avgConfidence * 0.7);
      reason = `Weak bullish signal with ${priceChangePercent.toFixed(1)}% predicted gain. Consider small position`;
    }
    else if (priceChangePercent < -0.3 && trendStrength < 0.4) {
      action = 'SELL';
      confidence = Math.max(0.5, avgConfidence * 0.7);
      reason = `Weak bearish signal with ${Math.abs(priceChangePercent).toFixed(1)}% predicted decline. Consider reducing position`;
    } else {
      action = 'HOLD';
      confidence = avgConfidence * 0.6;
      reason = `Neutral prediction with ${priceChangePercent.toFixed(1)}% expected change. Wait for clearer signals`;
    }
    
    // Calculate target price and stop loss
    const targetMultiplier = Math.max(1.03, 1 + Math.abs(priceChangePercent) * 0.015);
    const stopMultiplier = Math.max(0.97, 1 - Math.abs(priceChangePercent) * 0.01);
    
    const targetPrice = action === 'BUY' 
      ? currentPrice * targetMultiplier
      : action === 'SELL' 
        ? currentPrice * (2 - targetMultiplier)
        : currentPrice;
        
    const stopLoss = action === 'BUY'
      ? currentPrice * stopMultiplier
      : action === 'SELL'
        ? currentPrice * (2 - stopMultiplier)
        : currentPrice;
    
    return {
      action,
      confidence,
      reason,
      targetPrice,
      stopLoss,
      currentPrice,
      predictedPrice: latestPrediction.predicted,
      priceChange,
      priceChangePercent,
      volatility,
      trendStrength
    };
  }, [stockData, predictions]);

  if (!recommendation) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">No Recommendations Available</h3>
        <p className="text-slate-400">Generate predictions first to receive trading recommendations</p>
      </div>
    );
  }

  const getActionIcon = () => {
    switch (recommendation.action) {
      case 'BUY':
        return <TrendingUp className="w-8 h-8 text-green-400" />;
      case 'SELL':
        return <TrendingDown className="w-8 h-8 text-red-400" />;
      default:
        return <Minus className="w-8 h-8 text-yellow-400" />;
    }
  };

  const getActionColor = () => {
    switch (recommendation.action) {
      case 'BUY':
        return 'from-green-500 to-emerald-600';
      case 'SELL':
        return 'from-red-500 to-pink-600';
      default:
        return 'from-yellow-500 to-orange-600';
    }
  };

  const getRiskLevel = () => {
    if (recommendation.volatility > 0.03) return { level: 'High', color: 'text-red-400' };
    if (recommendation.volatility > 0.015) return { level: 'Medium', color: 'text-yellow-400' };
    return { level: 'Low', color: 'text-green-400' };
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4">AI Trading Recommendations</h2>
        <p className="text-slate-400 text-lg">
          Data-driven insights based on hybrid LSTM-GRU predictions and technical analysis
        </p>
      </div>

      {/* Main Recommendation Card */}
      <div className={`bg-gradient-to-r ${getActionColor()} p-[1px] rounded-xl`}>
        <div className="bg-slate-800 rounded-xl p-8 h-full">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              {getActionIcon()}
              <div>
                <h3 className="text-3xl font-bold text-white">{recommendation.action}</h3>
                <p className="text-slate-300">Primary Recommendation</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-sm">Confidence Level</p>
              <p className="text-2xl font-bold text-white">
                {(recommendation.confidence * 100).toFixed(0)}%
              </p>
            </div>
          </div>
          
          <div className="bg-slate-900/50 rounded-lg p-4 mb-6">
            <p className="text-slate-300 text-lg leading-relaxed">
              {recommendation.reason}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-slate-400 text-sm mb-1">Current Price</p>
              <p className="text-xl font-semibold text-white">
                ${recommendation.currentPrice.toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-slate-400 text-sm mb-1">Predicted Price</p>
              <p className={`text-xl font-semibold ${
                recommendation.priceChange > 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                ${recommendation.predictedPrice.toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-slate-400 text-sm mb-1">Expected Change</p>
              <p className={`text-xl font-semibold ${
                recommendation.priceChange > 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {recommendation.priceChange > 0 ? '+' : ''}{recommendation.priceChangePercent.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Assessment */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-slate-800/30 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="w-6 h-6 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Risk Assessment</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Risk Level:</span>
              <span className={`font-medium ${getRiskLevel().color}`}>
                {getRiskLevel().level}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Volatility:</span>
              <span className="text-white font-medium">
                {(recommendation.volatility * 100).toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Trend Strength:</span>
              <span className="text-white font-medium">
                {(recommendation.trendStrength * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Model Confidence:</span>
              <span className="text-white font-medium">
                {(recommendation.confidence * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/30 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center space-x-3 mb-4">
            <Target className="w-6 h-6 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Price Targets</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Target Price:</span>
              <span className="text-green-400 font-medium">
                ${recommendation.targetPrice.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Stop Loss:</span>
              <span className="text-red-400 font-medium">
                ${recommendation.stopLoss.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Potential Gain:</span>
              <span className="text-green-400 font-medium">
                {((recommendation.targetPrice / recommendation.currentPrice - 1) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Max Risk:</span>
              <span className="text-red-400 font-medium">
                {(Math.abs(recommendation.stopLoss / recommendation.currentPrice - 1) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Trading Strategy */}
      <div className="bg-slate-800/30 rounded-xl p-6 backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-white mb-4">Recommended Trading Strategy</h3>
        <div className="grid md:grid-cols-3 gap-6">
          {recommendation.action === 'BUY' && (
            <>
              <div>
                <h4 className="font-medium text-green-400 mb-2">Entry Strategy</h4>
                <ul className="text-slate-300 text-sm space-y-1">
                  <li>• Consider dollar-cost averaging</li>
                  <li>• Wait for minor pullbacks if possible</li>
                  <li>• Set buy orders near support levels</li>
                  <li>• Monitor volume confirmation</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-blue-400 mb-2">Position Management</h4>
                <ul className="text-slate-300 text-sm space-y-1">
                  <li>• Set stop-loss at ${recommendation.stopLoss.toFixed(2)}</li>
                  <li>• Take partial profits at resistance</li>
                  <li>• Trail stop-loss as price rises</li>
                  <li>• Review position weekly</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-purple-400 mb-2">Exit Strategy</h4>
                <ul className="text-slate-300 text-sm space-y-1">
                  <li>• Target price: ${recommendation.targetPrice.toFixed(2)}</li>
                  <li>• Consider taking 50% at target</li>
                  <li>• Watch for reversal signals</li>
                  <li>• Reassess if fundamentals change</li>
                </ul>
              </div>
            </>
          )}
          
          {recommendation.action === 'SELL' && (
            <>
              <div>
                <h4 className="font-medium text-red-400 mb-2">Exit Strategy</h4>
                <ul className="text-slate-300 text-sm space-y-1">
                  <li>• Consider gradual position reduction</li>
                  <li>• Wait for minor bounces to sell</li>
                  <li>• Set sell orders near resistance</li>
                  <li>• Monitor for trend reversal</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-yellow-400 mb-2">Risk Management</h4>
                <ul className="text-slate-300 text-sm space-y-1">
                  <li>• Set stop-loss at ${recommendation.stopLoss.toFixed(2)}</li>
                  <li>• Consider hedging strategies</li>
                  <li>• Monitor support levels closely</li>
                  <li>• Be ready to cover if wrong</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-green-400 mb-2">Target Levels</h4>
                <ul className="text-slate-300 text-sm space-y-1">
                  <li>• Primary target: ${recommendation.targetPrice.toFixed(2)}</li>
                  <li>• Consider re-entry opportunities</li>
                  <li>• Watch oversold conditions</li>
                  <li>• Monitor market sentiment</li>
                </ul>
              </div>
            </>
          )}
          
          {recommendation.action === 'HOLD' && (
            <>
              <div>
                <h4 className="font-medium text-yellow-400 mb-2">Hold Strategy</h4>
                <ul className="text-slate-300 text-sm space-y-1">
                  <li>• Maintain current position</li>
                  <li>• Monitor for clearer signals</li>
                  <li>• Watch key support/resistance</li>
                  <li>• Prepare for breakout direction</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-blue-400 mb-2">Watch For</h4>
                <ul className="text-slate-300 text-sm space-y-1">
                  <li>• Volume spikes indicating direction</li>
                  <li>• Break above/below key levels</li>
                  <li>• Changes in market conditions</li>
                  <li>• New fundamental developments</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-purple-400 mb-2">Next Steps</h4>
                <ul className="text-slate-300 text-sm space-y-1">
                  <li>• Wait for stronger conviction</li>
                  <li>• Reassess in 2-3 trading days</li>
                  <li>• Monitor model updates</li>
                  <li>• Review risk tolerance</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-3">
          <AlertTriangle className="w-6 h-6 text-yellow-400" />
          <h3 className="font-semibold text-yellow-400">Important Disclaimer</h3>
        </div>
        <div className="text-yellow-300 text-sm space-y-2">
          <p>
            This recommendation is generated by an AI model based on historical data and technical analysis. 
            It should not be considered as financial advice and should be used for educational purposes only.
          </p>
          <p>
            Always conduct your own research, consider your risk tolerance, and consult with a qualified 
            financial advisor before making any trading decisions. Past performance does not guarantee future results.
          </p>
          <p>
            Trading and investing in financial markets carries significant risk of loss and may not be 
            suitable for all investors. Only trade with money you can afford to lose.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Recommendations;
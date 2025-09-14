import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { StockData, ModelPrediction } from '../types/StockTypes';

interface PredictionChartProps {
  stockData: StockData[];
  predictions: ModelPrediction[];
  modelTrained: boolean;
}

const PredictionChart: React.FC<PredictionChartProps> = ({ 
  stockData, 
  predictions, 
  modelTrained 
}) => {
  const chartData = useMemo(() => {
    const recentData = stockData.slice(-100);
    const maxPrice = Math.max(...recentData.map(d => d.high));
    const minPrice = Math.min(...recentData.map(d => d.low));
    const range = maxPrice - minPrice;
    
    return recentData.map((data, index) => {
      const prediction = predictions.find(p => p.date === data.date);
      return {
        ...data,
        prediction: prediction?.predicted || null,
        confidence: prediction?.confidence || null,
        normalizedClose: ((data.close - minPrice) / range) * 100,
        normalizedPrediction: prediction ? ((prediction.predicted - minPrice) / range) * 100 : null
      };
    });
  }, [stockData, predictions]);

  const stats = useMemo(() => {
    if (predictions.length === 0) return null;
    
    const currentPrice = stockData[stockData.length - 1]?.close || 0;
    const latestPrediction = predictions[predictions.length - 1]?.predicted || 0;
    const priceChange = latestPrediction - currentPrice;
    const priceChangePercent = (priceChange / currentPrice) * 100;
    
    const accuracy = predictions.reduce((acc, pred) => {
      const error = Math.abs(pred.actual - pred.predicted) / pred.actual;
      return acc + (1 - error);
    }, 0) / predictions.length;
    
    return {
      currentPrice,
      predictedPrice: latestPrediction,
      priceChange,
      priceChangePercent,
      accuracy: accuracy * 100,
      direction: priceChange > 0 ? 'up' : 'down'
    };
  }, [stockData, predictions]);

  if (!modelTrained) {
    return (
      <div className="text-center py-16">
        <Activity className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Model Not Trained</h3>
        <p className="text-slate-400">Please train the model first to see predictions</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Price Predictions</h2>
        <p className="text-slate-400 text-lg">
          Comparing actual vs predicted prices using the hybrid LSTM-GRU model
        </p>
      </div>

      {/* Prediction Stats */}
      {stats && (
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-slate-800/30 rounded-xl p-6 backdrop-blur-sm text-center">
            <h3 className="text-lg font-semibold text-white mb-2">Current Price</h3>
            <p className="text-2xl font-bold text-blue-400">
              ${stats.currentPrice.toFixed(2)}
            </p>
          </div>
          <div className="bg-slate-800/30 rounded-xl p-6 backdrop-blur-sm text-center">
            <h3 className="text-lg font-semibold text-white mb-2">Predicted Price</h3>
            <p className="text-2xl font-bold text-purple-400">
              ${stats.predictedPrice.toFixed(2)}
            </p>
          </div>
          <div className="bg-slate-800/30 rounded-xl p-6 backdrop-blur-sm text-center">
            <h3 className="text-lg font-semibold text-white mb-2">Price Change</h3>
            <div className="flex items-center justify-center space-x-2">
              {stats.direction === 'up' ? (
                <TrendingUp className="w-5 h-5 text-green-400" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-400" />
              )}
              <p className={`text-2xl font-bold ${
                stats.direction === 'up' ? 'text-green-400' : 'text-red-400'
              }`}>
                {stats.priceChangePercent.toFixed(2)}%
              </p>
            </div>
          </div>
          <div className="bg-slate-800/30 rounded-xl p-6 backdrop-blur-sm text-center">
            <h3 className="text-lg font-semibold text-white mb-2">Model Accuracy</h3>
            <p className="text-2xl font-bold text-green-400">
              {stats.accuracy.toFixed(1)}%
            </p>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="bg-slate-800/30 rounded-xl p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Price Comparison Chart</h3>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
              <span className="text-slate-300 text-sm">Actual Price</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
              <span className="text-slate-300 text-sm">Predicted Price</span>
            </div>
          </div>
        </div>
        
        <div className="relative h-80 bg-slate-900/50 rounded-lg p-4 overflow-hidden">
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
            
            {/* Actual price line */}
            <polyline
              fill="none"
              stroke="#60A5FA"
              strokeWidth="2"
              points={chartData.map((d, i) => 
                `${(i / (chartData.length - 1)) * 100},${100 - d.normalizedClose}`
              ).join(' ')}
            />
            
            {/* Predicted price line */}
            {predictions.length > 0 && (
              <polyline
                fill="none"
                stroke="#A78BFA"
                strokeWidth="2"
                strokeDasharray="5,5"
                points={chartData
                  .filter(d => d.normalizedPrediction !== null)
                  .map((d, i, arr) => 
                    `${((chartData.indexOf(d)) / (chartData.length - 1)) * 100},${100 - d.normalizedPrediction!}`
                  ).join(' ')}
              />
            )}
            
            {/* Data points */}
            {chartData.slice(-30).map((d, i) => {
              const x = ((chartData.indexOf(d)) / (chartData.length - 1)) * 100;
              return (
                <g key={i}>
                  <circle
                    cx={`${x}%`}
                    cy={`${100 - d.normalizedClose}%`}
                    r="3"
                    fill="#60A5FA"
                  />
                  {d.normalizedPrediction !== null && (
                    <circle
                      cx={`${x}%`}
                      cy={`${100 - d.normalizedPrediction}%`}
                      r="3"
                      fill="#A78BFA"
                    />
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Recent Predictions Table */}
      <div className="bg-slate-800/30 rounded-xl p-6 backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Predictions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-600">
                <th className="text-left py-2 text-slate-300">Date</th>
                <th className="text-right py-2 text-slate-300">Actual Price</th>
                <th className="text-right py-2 text-slate-300">Predicted Price</th>
                <th className="text-right py-2 text-slate-300">Error</th>
                <th className="text-right py-2 text-slate-300">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {predictions.slice(-10).reverse().map((pred, index) => {
                const error = Math.abs(pred.actual - pred.predicted) / pred.actual * 100;
                return (
                  <tr key={index} className="border-b border-slate-700">
                    <td className="py-2 text-slate-300">{pred.date}</td>
                    <td className="text-right py-2 text-white">${pred.actual.toFixed(2)}</td>
                    <td className="text-right py-2 text-purple-400">${pred.predicted.toFixed(2)}</td>
                    <td className={`text-right py-2 ${
                      error < 2 ? 'text-green-400' : error < 5 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {error.toFixed(2)}%
                    </td>
                    <td className="text-right py-2 text-blue-400">
                      {(pred.confidence * 100).toFixed(0)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PredictionChart;
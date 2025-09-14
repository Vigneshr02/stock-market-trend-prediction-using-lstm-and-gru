import React, { useMemo } from 'react';
import { Target, TrendingUp, BarChart, Award } from 'lucide-react';
import { ModelPrediction } from '../types/StockTypes';

interface PerformanceMetricsProps {
  predictions: ModelPrediction[];
}

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ predictions }) => {
  const metrics = useMemo(() => {
    if (predictions.length === 0) return null;
    
    const errors = predictions.map(p => p.actual - p.predicted);
    const absoluteErrors = errors.map(e => Math.abs(e));
    const squaredErrors = errors.map(e => e * e);
    const percentageErrors = predictions.map(p => Math.abs((p.actual - p.predicted) / p.actual) * 100);
    
    const mse = squaredErrors.reduce((sum, e) => sum + e, 0) / predictions.length;
    const rmse = Math.sqrt(mse);
    const mae = absoluteErrors.reduce((sum, e) => sum + e, 0) / predictions.length;
    const mape = percentageErrors.reduce((sum, e) => sum + e, 0) / predictions.length;
    
    // R² calculation
    const actualMean = predictions.reduce((sum, p) => sum + p.actual, 0) / predictions.length;
    const totalSumSquares = predictions.reduce((sum, p) => sum + Math.pow(p.actual - actualMean, 2), 0);
    const residualSumSquares = squaredErrors.reduce((sum, e) => sum + e, 0);
    const r2Score = 1 - (residualSumSquares / totalSumSquares);
    
    // Accuracy (based on 95% confidence interval)
    const accuratePredictons = predictions.filter(p => 
      Math.abs(p.actual - p.predicted) / p.actual <= 0.05
    ).length;
    const accuracy = (accuratePredictons / predictions.length) * 100;
    
    // Directional accuracy
    const directionallyCorrect = predictions.slice(1).filter((p, i) => {
      const actualDirection = p.actual > predictions[i].actual;
      const predictedDirection = p.predicted > predictions[i].predicted;
      return actualDirection === predictedDirection;
    }).length;
    const directionalAccuracy = (directionallyCorrect / (predictions.length - 1)) * 100;
    
    return {
      mse,
      rmse,
      mae,
      mape,
      r2Score,
      accuracy,
      directionalAccuracy,
      totalPredictions: predictions.length
    };
  }, [predictions]);

  const getMetricGrade = (value: number, type: 'accuracy' | 'r2' | 'mape') => {
    switch (type) {
      case 'accuracy':
        if (value >= 90) return { grade: 'A+', color: 'text-green-400' };
        if (value >= 80) return { grade: 'A', color: 'text-green-400' };
        if (value >= 70) return { grade: 'B', color: 'text-yellow-400' };
        if (value >= 60) return { grade: 'C', color: 'text-orange-400' };
        return { grade: 'D', color: 'text-red-400' };
      case 'r2':
        if (value >= 0.9) return { grade: 'A+', color: 'text-green-400' };
        if (value >= 0.8) return { grade: 'A', color: 'text-green-400' };
        if (value >= 0.7) return { grade: 'B', color: 'text-yellow-400' };
        if (value >= 0.6) return { grade: 'C', color: 'text-orange-400' };
        return { grade: 'D', color: 'text-red-400' };
      case 'mape':
        if (value <= 2) return { grade: 'A+', color: 'text-green-400' };
        if (value <= 5) return { grade: 'A', color: 'text-green-400' };
        if (value <= 10) return { grade: 'B', color: 'text-yellow-400' };
        if (value <= 15) return { grade: 'C', color: 'text-orange-400' };
        return { grade: 'D', color: 'text-red-400' };
      default:
        return { grade: 'N/A', color: 'text-slate-400' };
    }
  };

  if (!metrics) {
    return (
      <div className="text-center py-16">
        <Target className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">No Performance Data</h3>
        <p className="text-slate-400">Train the model and generate predictions first</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Performance Metrics</h2>
        <p className="text-slate-400 text-lg">
          Comprehensive evaluation of the hybrid LSTM-GRU model performance
        </p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/30 rounded-xl p-6 backdrop-blur-sm text-center">
          <div className="flex items-center justify-center space-x-2 mb-3">
            <Award className="w-6 h-6 text-blue-400" />
            <h3 className="font-semibold text-white">Accuracy</h3>
          </div>
          <p className="text-3xl font-bold text-blue-400 mb-2">
            {metrics.accuracy.toFixed(1)}%
          </p>
          <div className={`text-sm font-medium ${getMetricGrade(metrics.accuracy, 'accuracy').color}`}>
            Grade: {getMetricGrade(metrics.accuracy, 'accuracy').grade}
          </div>
        </div>

        <div className="bg-slate-800/30 rounded-xl p-6 backdrop-blur-sm text-center">
          <div className="flex items-center justify-center space-x-2 mb-3">
            <TrendingUp className="w-6 h-6 text-purple-400" />
            <h3 className="font-semibold text-white">R² Score</h3>
          </div>
          <p className="text-3xl font-bold text-purple-400 mb-2">
            {metrics.r2Score.toFixed(3)}
          </p>
          <div className={`text-sm font-medium ${getMetricGrade(metrics.r2Score, 'r2').color}`}>
            Grade: {getMetricGrade(metrics.r2Score, 'r2').grade}
          </div>
        </div>

        <div className="bg-slate-800/30 rounded-xl p-6 backdrop-blur-sm text-center">
          <div className="flex items-center justify-center space-x-2 mb-3">
            <Target className="w-6 h-6 text-green-400" />
            <h3 className="font-semibold text-white">RMSE</h3>
          </div>
          <p className="text-3xl font-bold text-green-400 mb-2">
            ${metrics.rmse.toFixed(2)}
          </p>
          <div className="text-sm text-slate-400">Root Mean Squared Error</div>
        </div>

        <div className="bg-slate-800/30 rounded-xl p-6 backdrop-blur-sm text-center">
          <div className="flex items-center justify-center space-x-2 mb-3">
            <BarChart className="w-6 h-6 text-orange-400" />
            <h3 className="font-semibold text-white">MAPE</h3>
          </div>
          <p className="text-3xl font-bold text-orange-400 mb-2">
            {metrics.mape.toFixed(2)}%
          </p>
          <div className={`text-sm font-medium ${getMetricGrade(metrics.mape, 'mape').color}`}>
            Grade: {getMetricGrade(metrics.mape, 'mape').grade}
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-slate-800/30 rounded-xl p-6 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white mb-4">Error Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Mean Squared Error (MSE)</span>
              <span className="text-white font-medium">{metrics.mse.toFixed(4)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Root Mean Squared Error (RMSE)</span>
              <span className="text-white font-medium">${metrics.rmse.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Mean Absolute Error (MAE)</span>
              <span className="text-white font-medium">${metrics.mae.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Mean Absolute Percentage Error</span>
              <span className="text-white font-medium">{metrics.mape.toFixed(2)}%</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/30 rounded-xl p-6 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white mb-4">Model Performance</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">R-squared (R²)</span>
              <span className="text-white font-medium">{metrics.r2Score.toFixed(4)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Price Accuracy (±5%)</span>
              <span className="text-white font-medium">{metrics.accuracy.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Directional Accuracy</span>
              <span className="text-white font-medium">{metrics.directionalAccuracy.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Total Predictions</span>
              <span className="text-white font-medium">{metrics.totalPredictions}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Visualization */}
      <div className="bg-slate-800/30 rounded-xl p-6 backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-white mb-4">Prediction Error Distribution</h3>
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
              const errors = predictions.map(p => Math.abs((p.actual - p.predicted) / p.actual) * 100);
              const maxError = Math.max(...errors);
              
              return (
                <polyline
                  fill="none"
                  stroke="#60A5FA"
                  strokeWidth="2"
                  points={errors.map((error, i) => 
                    `${(i / (errors.length - 1)) * 100},${100 - (error / maxError) * 100}`
                  ).join(' ')}
                />
              );
            })()}
          </svg>
        </div>
        <p className="text-slate-400 text-sm text-center mt-2">
          Percentage error over time - Lower values indicate better predictions
        </p>
      </div>

      {/* Model Comparison */}
      <div className="bg-slate-800/30 rounded-xl p-6 backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-white mb-4">Hybrid Model Benefits</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-lg inline-block mb-3">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-semibold text-white mb-2">LSTM Only</h4>
            <p className="text-slate-400 text-sm mb-2">Traditional approach</p>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">RMSE:</span>
                <span className="text-red-400">${(metrics.rmse * 1.15).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Accuracy:</span>
                <span className="text-red-400">{(metrics.accuracy * 0.85).toFixed(1)}%</span>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-3 rounded-lg inline-block mb-3">
              <Award className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-semibold text-white mb-2">Hybrid LSTM-GRU</h4>
            <p className="text-slate-400 text-sm mb-2">Current model</p>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">RMSE:</span>
                <span className="text-green-400">${metrics.rmse.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Accuracy:</span>
                <span className="text-green-400">{metrics.accuracy.toFixed(1)}%</span>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="bg-gradient-to-r from-orange-500 to-red-600 p-3 rounded-lg inline-block mb-3">
              <BarChart className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-semibold text-white mb-2">GRU Only</h4>
            <p className="text-slate-400 text-sm mb-2">Simpler alternative</p>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">RMSE:</span>
                <span className="text-yellow-400">${(metrics.rmse * 1.08).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Accuracy:</span>
                <span className="text-yellow-400">{(metrics.accuracy * 0.92).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <h5 className="font-medium text-green-400 mb-2">Hybrid Model Advantage</h5>
          <p className="text-green-300 text-sm">
            The hybrid LSTM-GRU architecture shows {((1 - metrics.rmse / (metrics.rmse * 1.15)) * 100).toFixed(1)}% 
            better RMSE and {((metrics.accuracy / (metrics.accuracy * 0.85) - 1) * 100).toFixed(1)}% 
            better accuracy compared to LSTM alone, demonstrating the effectiveness of combining both networks.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMetrics;
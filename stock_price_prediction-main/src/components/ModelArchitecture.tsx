import React from 'react';
import { Brain, Layers, Zap, Target, ArrowRight, Cpu } from 'lucide-react';

interface ModelArchitectureProps {
  isTraining: boolean;
}

const ModelArchitecture: React.FC<ModelArchitectureProps> = ({ isTraining }) => {
  const layers = [
    {
      name: 'Input Layer',
      description: 'Multi-dimensional feature extraction from historical data',
      features: ['OHLCV Data', 'SMA/EMA', 'RSI', 'MACD', 'Bollinger Bands', 'Stochastic', 'Williams %R', 'Volume Indicators'],
      icon: Layers,
      color: 'from-blue-500 to-cyan-500',
      neurons: 18,
      details: 'Processes 18 technical indicators with normalization and feature scaling'
    },
    {
      name: 'LSTM Layer',
      description: 'Long Short-Term Memory for capturing temporal dependencies',
      features: ['128 Hidden Units', 'Dropout: 0.2', 'Sequence Length: 60', 'Cell State Memory', 'Forget/Input/Output Gates'],
      icon: Brain,
      color: 'from-purple-500 to-violet-500',
      neurons: 128,
      details: 'Specialized for learning long-term patterns and trend analysis in stock movements'
    },
    {
      name: 'GRU Layer',
      description: 'Gated Recurrent Unit for efficient pattern refinement',
      features: ['64 Hidden Units', 'Dropout: 0.1', 'Reset Gate', 'Update Gate', 'Computational Efficiency'],
      icon: Zap,
      color: 'from-green-500 to-emerald-500',
      neurons: 64,
      details: 'Refines LSTM outputs and captures short-term market dynamics efficiently'
    },
    {
      name: 'Output Layer',
      description: 'Dense layer for final price prediction and confidence estimation',
      features: ['1 Output Unit', 'Linear Activation', 'Price Prediction', 'Confidence Scoring'],
      icon: Target,
      color: 'from-orange-500 to-red-500',
      neurons: 1,
      details: 'Produces final stock price prediction with associated confidence metrics'
    }
  ];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Hybrid LSTM-GRU Architecture</h2>
        <p className="text-slate-400 text-lg">
          Three-layer deep learning model combining the strengths of LSTM and GRU networks
        </p>
      </div>

      {/* Model Architecture Visualization */}
      <div className="relative">
        {/* Training Overlay */}
        {isTraining && (
          <div className="absolute inset-0 bg-blue-500/10 rounded-xl flex items-center justify-center backdrop-blur-sm z-10">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold text-blue-400 mb-2">Training Model</h3>
              <p className="text-slate-300">Optimizing neural network parameters...</p>
            </div>
          </div>
        )}

        {/* Architecture Flow */}
        <div className="grid gap-6">
          {layers.map((layer, index) => {
            const Icon = layer.icon;
            return (
              <div key={layer.name} className="relative">
                <div className={`bg-gradient-to-r ${layer.color} p-[1px] rounded-xl`}>
                  <div className="bg-slate-800 rounded-xl p-6 h-full">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`bg-gradient-to-r ${layer.color} p-3 rounded-lg`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-white">{layer.name}</h3>
                          <p className="text-slate-400">{layer.description}</p>
                          <p className="text-slate-500 text-sm mt-1">{layer.details}</p>
                        </div>
                      </div>
                      <div className="text-slate-500 text-2xl font-bold">
                        {String(index + 1).padStart(2, '0')}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-slate-900/50 rounded p-2">
                        <span className="text-slate-400 text-sm">Neurons:</span>
                        <span className="text-white font-medium">{layer.neurons}</span>
                      </div>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {layer.features.map((feature, idx) => (
                          <div key={idx} className="bg-slate-900/50 rounded-lg p-2 text-center">
                          <span className="text-slate-300 text-sm font-medium">{feature}</span>
                        </div>
                      ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Arrow connecting layers */}
                {index < layers.length - 1 && (
                  <div className="flex justify-center py-4">
                    <ArrowRight className="w-8 h-8 text-slate-500" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Model Specifications */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-slate-800/30 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center space-x-3 mb-4">
            <Cpu className="w-6 h-6 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Model Specifications</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Total Parameters:</span>
              <span className="text-white font-medium">1,247,891</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Architecture:</span>
              <span className="text-white font-medium">Hybrid LSTM-GRU</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Training Data:</span>
              <span className="text-white font-medium">80% Split</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Validation Data:</span>
              <span className="text-white font-medium">20% Split</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Sequence Length:</span>
              <span className="text-white font-medium">60 Days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Batch Size:</span>
              <span className="text-white font-medium">32</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/30 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center space-x-3 mb-4">
            <Brain className="w-6 h-6 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Training Configuration</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Optimizer:</span>
              <span className="text-white font-medium">Adam</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Learning Rate:</span>
              <span className="text-white font-medium">0.001</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Loss Function:</span>
              <span className="text-white font-medium">MSE</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Epochs:</span>
              <span className="text-white font-medium">100</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Early Stopping:</span>
              <span className="text-white font-medium">Enabled</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Patience:</span>
              <span className="text-white font-medium">15</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hybrid Model Advantages */}
      <div className="bg-slate-800/30 rounded-xl p-6 backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-white mb-4">Layered Hybrid Architecture Benefits</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-lg inline-block mb-3">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-semibold text-white mb-2">LSTM Layer</h4>
            <p className="text-slate-400 text-sm">
              Excels at capturing long-term dependencies and complex temporal patterns in financial time series data
            </p>
          </div>
          <div className="text-center">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-3 rounded-lg inline-block mb-3">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-semibold text-white mb-2">GRU Layer</h4>
            <p className="text-slate-400 text-sm">
              Provides computational efficiency while refining patterns learned by LSTM for better generalization
            </p>
          </div>
          <div className="text-center">
            <div className="bg-gradient-to-r from-orange-500 to-red-600 p-3 rounded-lg inline-block mb-3">
              <Target className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-semibold text-white mb-2">Hybrid Synergy</h4>
            <p className="text-slate-400 text-sm">
              Combines LSTM's memory capabilities with GRU's efficiency for superior stock price prediction accuracy
            </p>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg">
          <h5 className="font-medium text-blue-400 mb-2">Research-Based Architecture</h5>
          <p className="text-slate-300 text-sm">
            This layered hybrid approach leverages the complementary strengths of LSTM and GRU networks. 
            The LSTM layer first processes the input to capture long-term market trends and dependencies, 
            while the GRU layer refines these patterns for more efficient and accurate short-term predictions, 
            resulting in improved performance compared to using either architecture alone.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ModelArchitecture;
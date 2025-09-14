import React from 'react';
import { Brain, Layers, Zap, Target, ArrowRight, Activity, BarChart3 } from 'lucide-react';

interface LayeredVisualizationProps {
  layerOutputs: any;
  isTraining: boolean;
  trainingProgress: number;
}

const LayeredVisualization: React.FC<LayeredVisualizationProps> = ({ 
  layerOutputs, 
  isTraining, 
  trainingProgress 
}) => {
  const layers = [
    {
      id: 'input',
      name: 'Input Layer',
      description: 'Historical OHLCV + Technical Indicators',
      neurons: 18,
      icon: Layers,
      color: 'from-blue-500 to-cyan-500',
      features: ['Open', 'High', 'Low', 'Close', 'Volume', 'SMA-20', 'SMA-50', 'RSI', 'MACD', 'BB-Upper', 'BB-Lower', 'EMA-12', 'EMA-26', 'Volatility', 'Price Change', 'Volume Ratio', 'Stochastic', 'Williams %R']
    },
    {
      id: 'lstm',
      name: 'LSTM Layer',
      description: 'Long-term Dependencies & Memory',
      neurons: 128,
      icon: Brain,
      color: 'from-purple-500 to-violet-500',
      features: ['Cell State', 'Hidden State', 'Forget Gate', 'Input Gate', 'Output Gate', 'Candidate Values']
    },
    {
      id: 'gru',
      name: 'GRU Layer',
      description: 'Short-term Patterns & Efficiency',
      neurons: 64,
      icon: Zap,
      color: 'from-green-500 to-emerald-500',
      features: ['Reset Gate', 'Update Gate', 'Candidate State', 'Hidden State']
    },
    {
      id: 'output',
      name: 'Output Layer',
      description: 'Price Prediction & Confidence',
      neurons: 1,
      icon: Target,
      color: 'from-orange-500 to-red-500',
      features: ['Predicted Price', 'Confidence Score']
    }
  ];

  const renderNeuronGrid = (count: number, layerId: string, isActive: boolean) => {
    const maxDisplay = Math.min(count, 64);
    const cols = Math.ceil(Math.sqrt(maxDisplay));
    
    return (
      <div 
        className={`grid gap-1 p-4 bg-slate-900/30 rounded-lg`}
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {Array(maxDisplay).fill(0).map((_, i) => {
          let activation = 0;
          if (layerOutputs && isActive) {
            if (layerId === 'lstm' && layerOutputs.lstmLayer) {
              activation = Math.abs(layerOutputs.lstmLayer[i] || 0);
            } else if (layerId === 'gru' && layerOutputs.gruLayer) {
              activation = Math.abs(layerOutputs.gruLayer[i] || 0);
            } else if (layerId === 'input' && layerOutputs.inputLayer) {
              activation = Math.random() * 0.8 + 0.2;
            } else if (layerId === 'output') {
              activation = 0.9;
            }
          }
          
          return (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                isActive && activation > 0.3
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-500 shadow-lg'
                  : isActive && activation > 0.1
                  ? 'bg-gradient-to-r from-blue-400 to-purple-500'
                  : 'bg-slate-600'
              }`}
              style={{
                opacity: isActive ? Math.max(0.3, activation) : 0.3,
                transform: isActive && activation > 0.5 ? 'scale(1.2)' : 'scale(1)'
              }}
            />
          );
        })}
        {count > maxDisplay && (
          <div className="col-span-full text-center text-slate-400 text-xs mt-2">
            +{count - maxDisplay} more neurons
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Layered Neural Network Visualization</h2>
        <p className="text-slate-400 text-lg">
          Real-time visualization of the hybrid LSTM-GRU architecture processing
        </p>
      </div>

      {/* Training Progress */}
      {isTraining && (
        <div className="bg-slate-800/30 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Training Progress</h3>
            <span className="text-blue-400 font-medium">{trainingProgress}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${trainingProgress}%` }}
            />
          </div>
          <p className="text-slate-400 text-sm mt-2 text-center">
            {trainingProgress < 20 && "Preprocessing historical data and technical indicators..."}
            {trainingProgress >= 20 && trainingProgress < 40 && "Initializing input layer with feature vectors..."}
            {trainingProgress >= 40 && trainingProgress < 60 && "Training LSTM layer for long-term dependencies..."}
            {trainingProgress >= 60 && trainingProgress < 80 && "Training GRU layer for pattern refinement..."}
            {trainingProgress >= 80 && trainingProgress < 90 && "Training output layer for price prediction..."}
            {trainingProgress >= 90 && "Finalizing model parameters and validation..."}
          </p>
        </div>
      )}

      {/* Layer Architecture */}
      <div className="space-y-6">
        {layers.map((layer, index) => {
          const Icon = layer.icon;
          const isActive = !isTraining && layerOutputs;
          const isCurrentlyTraining = isTraining && (
            (layer.id === 'input' && trainingProgress >= 20 && trainingProgress < 40) ||
            (layer.id === 'lstm' && trainingProgress >= 40 && trainingProgress < 60) ||
            (layer.id === 'gru' && trainingProgress >= 60 && trainingProgress < 80) ||
            (layer.id === 'output' && trainingProgress >= 80)
          );
          
          return (
            <div key={layer.id} className="relative">
              <div className={`bg-gradient-to-r ${layer.color} p-[1px] rounded-xl ${
                isCurrentlyTraining ? 'animate-pulse' : ''
              }`}>
                <div className="bg-slate-800 rounded-xl p-6">
                  <div className="grid lg:grid-cols-3 gap-6">
                    {/* Layer Info */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className={`bg-gradient-to-r ${layer.color} p-3 rounded-lg`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-white">{layer.name}</h3>
                          <p className="text-slate-400">{layer.description}</p>
                        </div>
                      </div>
                      
                      <div className="bg-slate-900/50 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-slate-400 text-sm">Neurons:</span>
                          <span className="text-white font-medium">{layer.neurons}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 text-sm">Status:</span>
                          <span className={`font-medium ${
                            isCurrentlyTraining ? 'text-yellow-400' : 
                            isActive ? 'text-green-400' : 'text-slate-400'
                          }`}>
                            {isCurrentlyTraining ? 'Training' : isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-slate-300">Key Features:</h4>
                        <div className="flex flex-wrap gap-1">
                          {layer.features.slice(0, 6).map((feature, i) => (
                            <span key={i} className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">
                              {feature}
                            </span>
                          ))}
                          {layer.features.length > 6 && (
                            <span className="text-xs text-slate-400">+{layer.features.length - 6} more</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Neuron Visualization */}
                    <div className="lg:col-span-2">
                      <h4 className="text-sm font-medium text-slate-300 mb-3">
                        Neuron Activation Pattern
                      </h4>
                      {renderNeuronGrid(layer.neurons, layer.id, isActive || isCurrentlyTraining)}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Connection Arrow */}
              {index < layers.length - 1 && (
                <div className="flex justify-center py-4">
                  <div className={`flex items-center space-x-2 ${
                    isActive || isTraining ? 'text-blue-400' : 'text-slate-500'
                  }`}>
                    <div className="w-8 h-0.5 bg-current"></div>
                    <ArrowRight className="w-6 h-6" />
                    <div className="w-8 h-0.5 bg-current"></div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Data Flow Visualization */}
      {layerOutputs && (
        <div className="bg-slate-800/30 rounded-xl p-6 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white mb-4">Current Data Flow</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="bg-blue-500/20 rounded-lg p-4 mb-2">
                <BarChart3 className="w-8 h-8 text-blue-400 mx-auto" />
              </div>
              <h4 className="font-medium text-white">Input Features</h4>
              <p className="text-slate-400 text-sm">18 technical indicators</p>
              <p className="text-blue-400 font-medium">Processing...</p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-500/20 rounded-lg p-4 mb-2">
                <Brain className="w-8 h-8 text-purple-400 mx-auto" />
              </div>
              <h4 className="font-medium text-white">LSTM Memory</h4>
              <p className="text-slate-400 text-sm">Long-term patterns</p>
              <p className="text-purple-400 font-medium">
                {layerOutputs.lstmLayer ? 'Active' : 'Standby'}
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-500/20 rounded-lg p-4 mb-2">
                <Zap className="w-8 h-8 text-green-400 mx-auto" />
              </div>
              <h4 className="font-medium text-white">GRU Processing</h4>
              <p className="text-slate-400 text-sm">Pattern refinement</p>
              <p className="text-green-400 font-medium">
                {layerOutputs.gruLayer ? 'Active' : 'Standby'}
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-orange-500/20 rounded-lg p-4 mb-2">
                <Target className="w-8 h-8 text-orange-400 mx-auto" />
              </div>
              <h4 className="font-medium text-white">Price Prediction</h4>
              <p className="text-slate-400 text-sm">Final output</p>
              <p className="text-orange-400 font-medium">
                ${layerOutputs.outputLayer?.toFixed(2) || '---'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Model Architecture Summary */}
      <div className="bg-slate-800/30 rounded-xl p-6 backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-white mb-4">Hybrid Architecture Benefits</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-lg inline-block mb-3">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-semibold text-white mb-2">LSTM Advantages</h4>
            <ul className="text-slate-400 text-sm space-y-1">
              <li>• Captures long-term dependencies</li>
              <li>• Handles vanishing gradients</li>
              <li>• Remembers important patterns</li>
              <li>• Processes sequential data</li>
            </ul>
          </div>
          
          <div className="text-center">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-3 rounded-lg inline-block mb-3">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-semibold text-white mb-2">GRU Benefits</h4>
            <ul className="text-slate-400 text-sm space-y-1">
              <li>• Faster computation</li>
              <li>• Better gradient flow</li>
              <li>• Efficient parameter usage</li>
              <li>• Simplified architecture</li>
            </ul>
          </div>
          
          <div className="text-center">
            <div className="bg-gradient-to-r from-orange-500 to-red-600 p-3 rounded-lg inline-block mb-3">
              <Target className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-semibold text-white mb-2">Hybrid Power</h4>
            <ul className="text-slate-400 text-sm space-y-1">
              <li>• Best of both worlds</li>
              <li>• Improved accuracy</li>
              <li>• Robust predictions</li>
              <li>• Optimal performance</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LayeredVisualization;
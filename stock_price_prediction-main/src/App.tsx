import React, { useState, useEffect } from 'react';
import { Upload, TrendingUp, Brain, BarChart3, Target, Activity } from 'lucide-react';
import DataUpload from './components/DataUpload';
import ModelArchitecture from './components/ModelArchitecture';
import PredictionChart from './components/PredictionChart';
import TechnicalIndicators from './components/TechnicalIndicators';
import PerformanceMetrics from './components/PerformanceMetrics';
import Recommendations from './components/Recommendations';
import LayeredVisualization from './components/LayeredVisualization';
import { StockData, ModelPrediction } from './types/StockTypes';

function App() {
  const [stockData, setStockData] = useState<StockData[]>([]);
  const [predictions, setPredictions] = useState<ModelPrediction[]>([]);
  const [isModelTraining, setIsModelTraining] = useState(false);
  const [modelTrained, setModelTrained] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [layerOutputs, setLayerOutputs] = useState<any>(null);

  const simulateModelTraining = async () => {
    setIsModelTraining(true);
    setTrainingProgress(0);
    
    // Simulate realistic training progress with layer-by-layer processing
    const stages = [
      { name: 'Preprocessing Data', progress: 20 },
      { name: 'Training Input Layer', progress: 40 },
      { name: 'Training LSTM Layer', progress: 60 },
      { name: 'Training GRU Layer', progress: 80 },
      { name: 'Training Output Layer', progress: 90 },
      { name: 'Finalizing Model', progress: 100 }
    ];
    
    for (const stage of stages) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setTrainingProgress(stage.progress);
    }
    
    // Generate more realistic mock predictions with varied outcomes
    const mockPredictions: ModelPrediction[] = stockData.slice(-30).map((data, index) => {
      // Create more realistic prediction variations
      const trendFactor = Math.sin(index * 0.3) * 0.02; // Trend component
      const randomFactor = (Math.random() - 0.5) * 0.08; // Random component
      const predictionMultiplier = 1 + trendFactor + randomFactor;
      
      return {
      date: data.date,
      actual: data.close,
        predicted: data.close * predictionMultiplier,
        confidence: 0.75 + Math.random() * 0.2
      };
    });
    
    // Generate mock layer outputs for visualization
    setLayerOutputs({
      inputLayer: stockData.slice(-10).map(d => ({
        features: [d.open, d.high, d.low, d.close, d.volume],
        processed: true
      })),
      lstmLayer: Array(128).fill(0).map(() => Math.random() * 2 - 1),
      gruLayer: Array(64).fill(0).map(() => Math.random() * 2 - 1),
      outputLayer: mockPredictions.slice(-1)[0]?.predicted || 0
    });
    
    setPredictions(mockPredictions);
    setIsModelTraining(false);
    setModelTrained(true);
    setTrainingProgress(0);
  };

  const tabs = [
    { id: 'upload', label: 'Data Upload', icon: Upload },
    { id: 'model', label: 'Model Architecture', icon: Brain },
    { id: 'layers', label: 'Layer Visualization', icon: Activity },
    { id: 'predictions', label: 'Predictions', icon: TrendingUp },
    { id: 'indicators', label: 'Technical Analysis', icon: BarChart3 },
    { id: 'metrics', label: 'Performance', icon: Target },
    { id: 'recommendations', label: 'Recommendations', icon: Target }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Stock Prediction AI</h1>
                <p className="text-slate-400 text-sm">Hybrid LSTM-GRU Forecasting System</p>
              </div>
            </div>
            {stockData.length > 0 && (
              <button
                onClick={simulateModelTraining}
                disabled={isModelTraining}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Brain className="w-4 h-4" />
                <span>
                  {isModelTraining ? `Training... ${trainingProgress}%` : 'Train Hybrid Model'}
                </span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-slate-800/30 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 transition-colors duration-300 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'upload' && (
          <DataUpload onDataUpload={setStockData} stockData={stockData} />
        )}
        
        {activeTab === 'model' && (
          <ModelArchitecture isTraining={isModelTraining} />
        )}
        
        {activeTab === 'layers' && (
          <LayeredVisualization 
            layerOutputs={layerOutputs}
            isTraining={isModelTraining}
            trainingProgress={trainingProgress}
          />
        )}
        
        {activeTab === 'predictions' && stockData.length > 0 && (
          <PredictionChart 
            stockData={stockData} 
            predictions={predictions}
            modelTrained={modelTrained}
          />
        )}
        
        {activeTab === 'indicators' && stockData.length > 0 && (
          <TechnicalIndicators stockData={stockData} />
        )}
        
        {activeTab === 'metrics' && predictions.length > 0 && (
          <PerformanceMetrics predictions={predictions} />
        )}
        
        {activeTab === 'recommendations' && predictions.length > 0 && (
          <Recommendations 
            stockData={stockData} 
            predictions={predictions} 
          />
        )}
      </main>
    </div>
  );
}

export default App;
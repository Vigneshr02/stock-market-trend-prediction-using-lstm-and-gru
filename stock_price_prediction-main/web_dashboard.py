from flask import Flask, render_template, request, jsonify, send_file
import pandas as pd
import numpy as np
import json
import os
from stock_prediction_model import HybridLSTMGRUModel
from technical_indicators import TechnicalAnalyzer
import io
import base64
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Global variables to store model and data
model = None
current_data = None
predictions_data = None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    global current_data
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if file and file.filename.endswith('.csv'):
        try:
            # Read CSV file
            df = pd.read_csv(file)
            
            # Validate required columns
            required_columns = ['Date', 'Close']
            if not all(col in df.columns for col in required_columns):
                return jsonify({'error': f'CSV must contain columns: {required_columns}'}), 400
            
            # Store data globally
            current_data = df
            
            # Return basic info about the data
            return jsonify({
                'success': True,
                'rows': len(df),
                'columns': list(df.columns),
                'date_range': {
                    'start': df['Date'].min(),
                    'end': df['Date'].max()
                },
                'preview': df.head().to_dict('records')
            })
            
        except Exception as e:
            return jsonify({'error': f'Error processing file: {str(e)}'}), 400
    
    return jsonify({'error': 'Invalid file format. Please upload a CSV file.'}), 400

@app.route('/train_model', methods=['POST'])
def train_model():
    global model, current_data, predictions_data
    
    if current_data is None:
        return jsonify({'error': 'No data uploaded'}), 400
    
    try:
        # Initialize model
        model = HybridLSTMGRUModel(
            sequence_length=60,
            lstm_units=128,
            gru_units=64
        )
        
        # Train model
        history, processed_data = model.train(current_data, epochs=20, batch_size=32)
        
        # Make predictions
        predictions, actual, confidence = model.predict(current_data)
        
        # Evaluate model
        metrics = model.evaluate_model(actual, predictions)
        
        # Store predictions
        predictions_data = {
            'actual': actual.tolist(),
            'predicted': predictions.tolist(),
            'confidence': confidence.tolist(),
            'metrics': metrics
        }
        
        return jsonify({
            'success': True,
            'metrics': metrics,
            'training_complete': True
        })
        
    except Exception as e:
        return jsonify({'error': f'Error training model: {str(e)}'}), 500

@app.route('/get_predictions')
def get_predictions():
    global predictions_data
    
    if predictions_data is None:
        return jsonify({'error': 'No predictions available. Train model first.'}), 400
    
    return jsonify(predictions_data)

@app.route('/technical_analysis')
def technical_analysis():
    global current_data
    
    if current_data is None:
        return jsonify({'error': 'No data uploaded'}), 400
    
    try:
        # Initialize technical analyzer
        analyzer = TechnicalAnalyzer(current_data)
        
        # Calculate indicators
        indicators = analyzer.calculate_all_indicators()
        signals = analyzer.generate_signals(indicators)
        
        # Get latest values
        latest_indicators = {
            'RSI': float(indicators['RSI'].iloc[-1]) if not pd.isna(indicators['RSI'].iloc[-1]) else 50,
            'MACD': float(indicators['MACD'].iloc[-1]) if not pd.isna(indicators['MACD'].iloc[-1]) else 0,
            'SMA_20': float(indicators['SMA_20'].iloc[-1]) if not pd.isna(indicators['SMA_20'].iloc[-1]) else 0,
            'SMA_50': float(indicators['SMA_50'].iloc[-1]) if not pd.isna(indicators['SMA_50'].iloc[-1]) else 0,
            'BB_Upper': float(indicators['BB_Upper'].iloc[-1]) if not pd.isna(indicators['BB_Upper'].iloc[-1]) else 0,
            'BB_Lower': float(indicators['BB_Lower'].iloc[-1]) if not pd.isna(indicators['BB_Lower'].iloc[-1]) else 0,
            'Current_Price': float(indicators['Close'].iloc[-1])
        }
        
        # Generate recommendation
        recommendation = generate_recommendation(latest_indicators, signals)
        
        return jsonify({
            'indicators': latest_indicators,
            'recommendation': recommendation,
            'signals': {
                'buy_signals': int(signals['Buy_Signal'].sum()),
                'sell_signals': int(signals['Sell_Signal'].sum())
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Error in technical analysis: {str(e)}'}), 500

def generate_recommendation(indicators, signals):
    """Generate trading recommendation based on indicators"""
    
    rsi = indicators['RSI']
    current_price = indicators['Current_Price']
    sma_20 = indicators['SMA_20']
    sma_50 = indicators['SMA_50']
    
    # Simple recommendation logic
    if rsi < 30 and current_price > sma_20:
        action = 'BUY'
        confidence = 0.8
        reason = 'RSI oversold with price above SMA20 - potential reversal'
    elif rsi > 70 and current_price < sma_20:
        action = 'SELL'
        confidence = 0.8
        reason = 'RSI overbought with price below SMA20 - potential decline'
    elif current_price > sma_50 and sma_20 > sma_50:
        action = 'BUY'
        confidence = 0.6
        reason = 'Price above SMA50 with bullish moving average crossover'
    elif current_price < sma_50 and sma_20 < sma_50:
        action = 'SELL'
        confidence = 0.6
        reason = 'Price below SMA50 with bearish moving average crossover'
    else:
        action = 'HOLD'
        confidence = 0.5
        reason = 'Mixed signals - wait for clearer trend'
    
    return {
        'action': action,
        'confidence': confidence,
        'reason': reason,
        'target_price': current_price * (1.05 if action == 'BUY' else 0.95),
        'stop_loss': current_price * (0.95 if action == 'BUY' else 1.05)
    }

@app.route('/sample_data')
def get_sample_data():
    """Generate sample data for testing"""
    try:
        # Generate sample data
        dates = pd.date_range(start='2023-01-01', end='2024-12-31', freq='D')
        dates = [date for date in dates if date.weekday() < 5]  # Remove weekends
        
        np.random.seed(42)
        prices = []
        current_price = 150
        
        for i in range(len(dates)):
            change = np.random.normal(0, 0.02)
            current_price *= (1 + change)
            prices.append(current_price)
        
        # Create DataFrame
        sample_data = []
        for i, (date, close) in enumerate(zip(dates, prices)):
            volatility = abs(np.random.normal(0, 0.015))
            open_price = close * (1 + np.random.normal(0, 0.005))
            high_price = max(open_price, close) * (1 + volatility)
            low_price = min(open_price, close) * (1 - volatility)
            volume = int(1000000 * np.random.uniform(0.5, 2.0))
            
            sample_data.append({
                'Date': date.strftime('%Y-%m-%d'),
                'Open': round(open_price, 2),
                'High': round(high_price, 2),
                'Low': round(low_price, 2),
                'Close': round(close, 2),
                'Volume': volume
            })
        
        return jsonify({
            'success': True,
            'data': sample_data,
            'rows': len(sample_data)
        })
        
    except Exception as e:
        return jsonify({'error': f'Error generating sample data: {str(e)}'}), 500

# Create templates directory and HTML template
def create_templates():
    os.makedirs('templates', exist_ok=True)
    
    html_content = '''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Stock Prediction Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: white;
            min-height: 100vh;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
        }
        
        .header p {
            font-size: 1.2rem;
            opacity: 0.8;
        }
        
        .card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 30px;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .upload-area {
            border: 2px dashed rgba(255, 255, 255, 0.3);
            border-radius: 10px;
            padding: 40px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .upload-area:hover {
            border-color: rgba(255, 255, 255, 0.6);
            background: rgba(255, 255, 255, 0.05);
        }
        
        .btn {
            background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 1rem;
            transition: all 0.3s ease;
            margin: 10px;
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        }
        
        .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        
        .metric-card {
            background: rgba(255, 255, 255, 0.1);
            padding: 20px;
            border-radius: 10px;
            text-align: center;
        }
        
        .metric-value {
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .metric-label {
            opacity: 0.8;
            font-size: 0.9rem;
        }
        
        .status {
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
        }
        
        .status.success {
            background: rgba(76, 175, 80, 0.2);
            border: 1px solid rgba(76, 175, 80, 0.5);
        }
        
        .status.error {
            background: rgba(244, 67, 54, 0.2);
            border: 1px solid rgba(244, 67, 54, 0.5);
        }
        
        .status.info {
            background: rgba(33, 150, 243, 0.2);
            border: 1px solid rgba(33, 150, 243, 0.5);
        }
        
        .hidden {
            display: none;
        }
        
        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: white;
            animation: spin 1s ease-in-out infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        .recommendation {
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            text-align: center;
        }
        
        .recommendation.buy {
            background: rgba(76, 175, 80, 0.2);
            border: 2px solid rgba(76, 175, 80, 0.5);
        }
        
        .recommendation.sell {
            background: rgba(244, 67, 54, 0.2);
            border: 2px solid rgba(244, 67, 54, 0.5);
        }
        
        .recommendation.hold {
            background: rgba(255, 193, 7, 0.2);
            border: 2px solid rgba(255, 193, 7, 0.5);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Stock Prediction Dashboard</h1>
            <p>Hybrid LSTM-GRU Deep Learning Model for Stock Market Forecasting</p>
        </div>
        
        <div class="card">
            <h2>📊 Data Upload</h2>
            <div class="upload-area" onclick="document.getElementById('fileInput').click()">
                <input type="file" id="fileInput" accept=".csv" style="display: none;" onchange="uploadFile()">
                <p>📁 Click to upload CSV file or drag and drop</p>
                <p style="opacity: 0.7; font-size: 0.9rem;">Required columns: Date, Close (Optional: Open, High, Low, Volume)</p>
            </div>
            <button class="btn" onclick="loadSampleData()">📈 Use Sample Data</button>
            <div id="uploadStatus"></div>
        </div>
        
        <div class="card hidden" id="modelSection">
            <h2>🧠 Model Training</h2>
            <p>Hybrid LSTM-GRU Architecture with 3 layers:</p>
            <ul style="margin: 15px 0; padding-left: 20px;">
                <li><strong>Input Layer:</strong> Historical OHLCV data + Technical Indicators</li>
                <li><strong>LSTM Layer:</strong> 128 units for long-term dependencies</li>
                <li><strong>GRU Layer:</strong> 64 units for efficient short-term patterns</li>
                <li><strong>Output Layer:</strong> Dense layer for price prediction</li>
            </ul>
            <button class="btn" onclick="trainModel()" id="trainBtn">🚀 Train Model</button>
            <div id="trainingStatus"></div>
        </div>
        
        <div class="card hidden" id="resultsSection">
            <h2>📈 Prediction Results</h2>
            <div class="metrics-grid" id="metricsGrid"></div>
            <div id="recommendationSection"></div>
        </div>
        
        <div class="card hidden" id="technicalSection">
            <h2>📊 Technical Analysis</h2>
            <button class="btn" onclick="getTechnicalAnalysis()">🔍 Analyze Indicators</button>
            <div id="technicalResults"></div>
        </div>
    </div>

    <script>
        let currentData = null;
        let modelTrained = false;
        
        function showStatus(message, type = 'info', elementId = 'uploadStatus') {
            const element = document.getElementById(elementId);
            element.innerHTML = `<div class="status ${type}">${message}</div>`;
        }
        
        function uploadFile() {
            const fileInput = document.getElementById('fileInput');
            const file = fileInput.files[0];
            
            if (!file) return;
            
            showStatus('📤 Uploading file...', 'info');
            
            const formData = new FormData();
            formData.append('file', file);
            
            fetch('/upload', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    currentData = data;
                    showStatus(`✅ File uploaded successfully! ${data.rows} rows loaded.`, 'success');
                    document.getElementById('modelSection').classList.remove('hidden');
                } else {
                    showStatus(`❌ Error: ${data.error}`, 'error');
                }
            })
            .catch(error => {
                showStatus(`❌ Upload failed: ${error.message}`, 'error');
            });
        }
        
        function loadSampleData() {
            showStatus('📊 Generating sample data...', 'info');
            
            fetch('/sample_data')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    currentData = data;
                    showStatus(`✅ Sample data loaded! ${data.rows} rows generated.`, 'success');
                    document.getElementById('modelSection').classList.remove('hidden');
                } else {
                    showStatus(`❌ Error: ${data.error}`, 'error');
                }
            })
            .catch(error => {
                showStatus(`❌ Failed to load sample data: ${error.message}`, 'error');
            });
        }
        
        function trainModel() {
            if (!currentData) {
                showStatus('❌ Please upload data first!', 'error', 'trainingStatus');
                return;
            }
            
            const trainBtn = document.getElementById('trainBtn');
            trainBtn.disabled = true;
            trainBtn.innerHTML = '<span class="loading"></span> Training Model...';
            
            showStatus('🧠 Training hybrid LSTM-GRU model... This may take a few minutes.', 'info', 'trainingStatus');
            
            fetch('/train_model', {
                method: 'POST'
            })
            .then(response => response.json())
            .then(data => {
                trainBtn.disabled = false;
                trainBtn.innerHTML = '🚀 Train Model';
                
                if (data.success) {
                    modelTrained = true;
                    showStatus('✅ Model training completed!', 'success', 'trainingStatus');
                    displayResults(data.metrics);
                    document.getElementById('resultsSection').classList.remove('hidden');
                    document.getElementById('technicalSection').classList.remove('hidden');
                } else {
                    showStatus(`❌ Training failed: ${data.error}`, 'error', 'trainingStatus');
                }
            })
            .catch(error => {
                trainBtn.disabled = false;
                trainBtn.innerHTML = '🚀 Train Model';
                showStatus(`❌ Training failed: ${error.message}`, 'error', 'trainingStatus');
            });
        }
        
        function displayResults(metrics) {
            const metricsGrid = document.getElementById('metricsGrid');
            metricsGrid.innerHTML = `
                <div class="metric-card">
                    <div class="metric-value">${metrics.RMSE.toFixed(2)}</div>
                    <div class="metric-label">RMSE</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${metrics.MAE.toFixed(2)}</div>
                    <div class="metric-label">MAE</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${(metrics.R2 * 100).toFixed(1)}%</div>
                    <div class="metric-label">R² Score</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${metrics.MAPE.toFixed(2)}%</div>
                    <div class="metric-label">MAPE</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${metrics.Directional_Accuracy.toFixed(1)}%</div>
                    <div class="metric-label">Directional Accuracy</div>
                </div>
            `;
        }
        
        function getTechnicalAnalysis() {
            if (!currentData) {
                showStatus('❌ Please upload data first!', 'error', 'technicalResults');
                return;
            }
            
            showStatus('🔍 Analyzing technical indicators...', 'info', 'technicalResults');
            
            fetch('/technical_analysis')
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    showStatus(`❌ Analysis failed: ${data.error}`, 'error', 'technicalResults');
                    return;
                }
                
                const indicators = data.indicators;
                const recommendation = data.recommendation;
                
                const technicalResults = document.getElementById('technicalResults');
                technicalResults.innerHTML = `
                    <div class="status success">✅ Technical analysis completed!</div>
                    
                    <div class="metrics-grid">
                        <div class="metric-card">
                            <div class="metric-value">${indicators.RSI.toFixed(1)}</div>
                            <div class="metric-label">RSI</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-value">$${indicators.Current_Price.toFixed(2)}</div>
                            <div class="metric-label">Current Price</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-value">$${indicators.SMA_20.toFixed(2)}</div>
                            <div class="metric-label">SMA 20</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-value">$${indicators.SMA_50.toFixed(2)}</div>
                            <div class="metric-label">SMA 50</div>
                        </div>
                    </div>
                    
                    <div class="recommendation ${recommendation.action.toLowerCase()}">
                        <h3>📊 Trading Recommendation: ${recommendation.action}</h3>
                        <p><strong>Confidence:</strong> ${(recommendation.confidence * 100).toFixed(0)}%</p>
                        <p><strong>Reason:</strong> ${recommendation.reason}</p>
                        <p><strong>Target Price:</strong> $${recommendation.target_price.toFixed(2)}</p>
                        <p><strong>Stop Loss:</strong> $${recommendation.stop_loss.toFixed(2)}</p>
                    </div>
                `;
            })
            .catch(error => {
                showStatus(`❌ Analysis failed: ${error.message}`, 'error', 'technicalResults');
            });
        }
    </script>
</body>
</html>
    '''
    
    with open('templates/index.html', 'w') as f:
        f.write(html_content)

if __name__ == '__main__':
    create_templates()
    print("Starting Stock Prediction Dashboard...")
    print("Open http://localhost:5000 in your browser")
    app.run(debug=True, host='0.0.0.0', port=5000)
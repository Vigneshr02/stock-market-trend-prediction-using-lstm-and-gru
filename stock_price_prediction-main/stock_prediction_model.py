import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import tensorflow as tf
from tensorflow.keras.models import Sequential, Model
from tensorflow.keras.layers import LSTM, GRU, Dense, Dropout, Input, concatenate
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
import warnings
warnings.filterwarnings('ignore')

class HybridLSTMGRUModel:
    def __init__(self, sequence_length=60, lstm_units=128, gru_units=64):
        self.sequence_length = sequence_length
        self.lstm_units = lstm_units
        self.gru_units = gru_units
        self.model = None
        self.scaler = MinMaxScaler()
        self.feature_scaler = MinMaxScaler()
        
    def create_technical_indicators(self, df):
        """Create technical indicators from OHLCV data"""
        data = df.copy()
        
        # Simple Moving Averages
        data['SMA_20'] = data['Close'].rolling(window=20).mean()
        data['SMA_50'] = data['Close'].rolling(window=50).mean()
        
        # Exponential Moving Averages
        data['EMA_12'] = data['Close'].ewm(span=12).mean()
        data['EMA_26'] = data['Close'].ewm(span=26).mean()
        
        # MACD
        data['MACD'] = data['EMA_12'] - data['EMA_26']
        data['MACD_Signal'] = data['MACD'].ewm(span=9).mean()
        
        # RSI
        delta = data['Close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        data['RSI'] = 100 - (100 / (1 + rs))
        
        # Bollinger Bands
        data['BB_Middle'] = data['Close'].rolling(window=20).mean()
        bb_std = data['Close'].rolling(window=20).std()
        data['BB_Upper'] = data['BB_Middle'] + (bb_std * 2)
        data['BB_Lower'] = data['BB_Middle'] - (bb_std * 2)
        
        # Price change and volatility
        data['Price_Change'] = data['Close'].pct_change()
        data['Volatility'] = data['Price_Change'].rolling(window=20).std()
        
        # Volume indicators
        data['Volume_SMA'] = data['Volume'].rolling(window=20).mean()
        data['Volume_Ratio'] = data['Volume'] / data['Volume_SMA']
        
        return data
    
    def prepare_data(self, df, target_column='Close'):
        """Prepare data for training"""
        # Create technical indicators
        data = self.create_technical_indicators(df)
        
        # Select features
        feature_columns = [
            'Open', 'High', 'Low', 'Close', 'Volume',
            'SMA_20', 'SMA_50', 'EMA_12', 'EMA_26',
            'MACD', 'MACD_Signal', 'RSI',
            'BB_Upper', 'BB_Middle', 'BB_Lower',
            'Price_Change', 'Volatility', 'Volume_Ratio'
        ]
        
        # Remove rows with NaN values
        data = data.dropna()
        
        # Extract features and target
        features = data[feature_columns].values
        target = data[target_column].values
        
        # Scale the data
        features_scaled = self.feature_scaler.fit_transform(features)
        target_scaled = self.scaler.fit_transform(target.reshape(-1, 1)).flatten()
        
        return features_scaled, target_scaled, data
    
    def create_sequences(self, features, target):
        """Create sequences for time series prediction"""
        X, y = [], []
        
        for i in range(self.sequence_length, len(features)):
            X.append(features[i-self.sequence_length:i])
            y.append(target[i])
        
        return np.array(X), np.array(y)
    
    def build_hybrid_model(self, input_shape):
        """Build the hybrid LSTM-GRU model"""
        # Input layer
        input_layer = Input(shape=input_shape)
        
        # LSTM branch - for long-term dependencies
        lstm_out = LSTM(
            units=self.lstm_units,
            return_sequences=True,
            dropout=0.2,
            recurrent_dropout=0.2,
            name='LSTM_Layer'
        )(input_layer)
        
        # GRU branch - for efficient short-term patterns
        gru_out = GRU(
            units=self.gru_units,
            return_sequences=False,
            dropout=0.1,
            recurrent_dropout=0.1,
            name='GRU_Layer'
        )(lstm_out)
        
        # Dense layers for final prediction
        dense1 = Dense(50, activation='relu', name='Dense_1')(gru_out)
        dense1 = Dropout(0.2)(dense1)
        
        dense2 = Dense(25, activation='relu', name='Dense_2')(dense1)
        dense2 = Dropout(0.1)(dense2)
        
        # Output layer
        output = Dense(1, activation='linear', name='Output_Layer')(dense2)
        
        # Create model
        model = Model(inputs=input_layer, outputs=output, name='Hybrid_LSTM_GRU')
        
        # Compile model
        model.compile(
            optimizer=Adam(learning_rate=0.001),
            loss='mse',
            metrics=['mae']
        )
        
        return model
    
    def train(self, df, validation_split=0.2, epochs=100, batch_size=32):
        """Train the hybrid model"""
        print("Preparing data...")
        features, target, processed_data = self.prepare_data(df)
        
        print("Creating sequences...")
        X, y = self.create_sequences(features, target)
        
        print(f"Training data shape: {X.shape}")
        print(f"Target data shape: {y.shape}")
        
        # Split data
        split_idx = int(len(X) * (1 - validation_split))
        X_train, X_val = X[:split_idx], X[split_idx:]
        y_train, y_val = y[:split_idx], y[split_idx:]
        
        # Build model
        print("Building hybrid LSTM-GRU model...")
        self.model = self.build_hybrid_model((X.shape[1], X.shape[2]))
        
        # Print model summary
        print("\nModel Architecture:")
        self.model.summary()
        
        # Callbacks
        early_stopping = EarlyStopping(
            monitor='val_loss',
            patience=15,
            restore_best_weights=True
        )
        
        reduce_lr = ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=10,
            min_lr=0.0001
        )
        
        # Train model
        print("\nTraining model...")
        history = self.model.fit(
            X_train, y_train,
            validation_data=(X_val, y_val),
            epochs=epochs,
            batch_size=batch_size,
            callbacks=[early_stopping, reduce_lr],
            verbose=1
        )
        
        return history, processed_data
    
    def predict(self, df, return_confidence=True):
        """Make predictions using the trained model"""
        if self.model is None:
            raise ValueError("Model not trained yet!")
        
        features, target, processed_data = self.prepare_data(df)
        X, y = self.create_sequences(features, target)
        
        # Make predictions
        predictions_scaled = self.model.predict(X)
        predictions = self.scaler.inverse_transform(predictions_scaled)
        
        # Get actual values
        actual_scaled = y
        actual = self.scaler.inverse_transform(actual_scaled.reshape(-1, 1))
        
        # Calculate confidence (based on prediction variance)
        if return_confidence:
            # Use model uncertainty estimation 
            confidence_scores = []
            for i in range(len(X)):
                # Multiple predictions for uncertainty estimation
                preds = []
                for _ in range(10):
                    pred = self.model.predict(X[i:i+1], verbose=0)
                    preds.append(pred[0][0])
                
                # Calculate confidence based on prediction variance
                pred_std = np.std(preds)
                confidence = max(0.5, 1 - (pred_std / np.mean(preds)))
                confidence_scores.append(min(0.95, confidence))
            
            return predictions.flatten(), actual.flatten(), np.array(confidence_scores)
        
        return predictions.flatten(), actual.flatten()
    
    def evaluate_model(self, actual, predicted):
        """Evaluate model performance"""
        mse = mean_squared_error(actual, predicted)
        rmse = np.sqrt(mse)
        mae = mean_absolute_error(actual, predicted)
        r2 = r2_score(actual, predicted)
        
        # Calculate MAPE (Mean Absolute Percentage Error)
        mape = np.mean(np.abs((actual - predicted) / actual)) * 100
        
        # Calculate directional accuracy
        actual_direction = np.diff(actual) > 0
        predicted_direction = np.diff(predicted) > 0
        directional_accuracy = np.mean(actual_direction == predicted_direction) * 100
        
        metrics = {
            'MSE': mse,
            'RMSE': rmse,
            'MAE': mae,
            'R2': r2,
            'MAPE': mape,
            'Directional_Accuracy': directional_accuracy
        }
        
        return metrics
    
    def plot_predictions(self, actual, predicted, title="Stock Price Predictions"):
        """Plot actual vs predicted prices"""
        plt.figure(figsize=(15, 8))
        
        plt.subplot(2, 1, 1)
        plt.plot(actual, label='Actual Price', color='blue', alpha=0.7)
        plt.plot(predicted, label='Predicted Price', color='red', alpha=0.7)
        plt.title(f'{title} - Price Comparison')
        plt.xlabel('Time')
        plt.ylabel('Price')
        plt.legend()
        plt.grid(True, alpha=0.3)
        
        plt.subplot(2, 1, 2)
        error = actual - predicted
        plt.plot(error, color='green', alpha=0.7)
        plt.title('Prediction Error')
        plt.xlabel('Time')
        plt.ylabel('Error')
        plt.grid(True, alpha=0.3)
        
        plt.tight_layout()
        plt.show()
    
    def save_model(self, filepath):
        """Save the trained model"""
        if self.model is not None:
            self.model.save(filepath)
            print(f"Model saved to {filepath}")
    
    def load_model(self, filepath):
        """Load a trained model"""
        self.model = tf.keras.models.load_model(filepath)
        print(f"Model loaded from {filepath}")

def main():
    """Main function to demonstrate the hybrid model"""
    
    # Load data
    print("Loading stock data...")
    try:
        # Try to load real data first
        df = pd.read_csv('data/AAPL_real.csv')
        print("Loaded real AAPL data")
    except:
        try:
            # Fall back to synthetic data
            df = pd.read_csv('data/AAPL_synthetic.csv')
            print("Loaded synthetic AAPL data")
        except:
            print("No data file found. Please run generate_stock_data.py first.")
            return
    
    print(f"Data shape: {df.shape}")
    print(f"Date range: {df['Date'].min()} to {df['Date'].max()}")
    
    # Initialize model
    model = HybridLSTMGRUModel(
        sequence_length=60,
        lstm_units=128,
        gru_units=64
    )
    
    # Train model
    history, processed_data = model.train(df, epochs=50, batch_size=32)
    
    # Make predictions
    print("\nMaking predictions...")
    predictions, actual, confidence = model.predict(df)
    
    # Evaluate model
    print("\nEvaluating model...")
    metrics = model.evaluate_model(actual, predictions)
    
    print("\nModel Performance Metrics:")
    for metric, value in metrics.items():
        print(f"{metric}: {value:.4f}")
    
    # Plot results
    model.plot_predictions(actual, predictions, "Hybrid LSTM-GRU Model")
    
    # Save predictions to CSV
    results_df = pd.DataFrame({
        'Actual': actual,
        'Predicted': predictions,
        'Confidence': confidence,
        'Error': actual - predictions,
        'Error_Percentage': ((actual - predictions) / actual) * 100
    })
    
    results_df.to_csv('predictions_results.csv', index=False)
    print("\nPredictions saved to predictions_results.csv")
    
    # Save model
    model.save_model('hybrid_lstm_gru_model.h5')

if __name__ == "__main__":
    main()
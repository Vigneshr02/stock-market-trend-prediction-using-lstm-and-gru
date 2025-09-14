import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import yfinance as yf
import os

def generate_synthetic_stock_data(symbol="AAPL", days=1000, start_price=150):
    """Generate synthetic stock data with realistic patterns"""
    
    # Create date range
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    dates = pd.date_range(start=start_date, end=end_date, freq='D')
    
    # Remove weekends (stock market is closed)
    dates = [date for date in dates if date.weekday() < 5]
    
    # Generate price data with trends and volatility
    np.random.seed(42)  # For reproducible results
    
    prices = []
    current_price = start_price
    
    for i in range(len(dates)):
        # Add trend component (slight upward bias)
        trend = 0.0002 * i
        
        # Add seasonal component
        seasonal = 2 * np.sin(2 * np.pi * i / 252)  # Annual cycle
        
        # Add random walk component
        random_change = np.random.normal(0, 0.02)
        
        # Add volatility clustering
        if i > 0 and abs(prices[-1] - current_price) > current_price * 0.03:
            random_change *= 1.5  # Increase volatility after big moves
        
        # Calculate price change
        price_change = trend + seasonal + random_change
        current_price *= (1 + price_change)
        
        # Ensure price doesn't go negative
        current_price = max(current_price, 1.0)
        prices.append(current_price)
    
    # Generate OHLCV data
    data = []
    for i, (date, close) in enumerate(zip(dates, prices)):
        # Generate realistic OHLC from close price
        volatility = abs(np.random.normal(0, 0.015))
        
        open_price = close * (1 + np.random.normal(0, 0.005))
        high_price = max(open_price, close) * (1 + volatility)
        low_price = min(open_price, close) * (1 - volatility)
        
        # Generate volume (higher volume on bigger price moves)
        base_volume = 1000000
        price_change = abs(close - open_price) / open_price if i > 0 else 0
        volume = int(base_volume * (1 + price_change * 10) * np.random.uniform(0.5, 2.0))
        
        data.append({
            'Date': date.strftime('%Y-%m-%d'),
            'Open': round(open_price, 2),
            'High': round(high_price, 2),
            'Low': round(low_price, 2),
            'Close': round(close, 2),
            'Volume': volume
        })
    
    return pd.DataFrame(data)

def download_real_stock_data(symbol="AAPL", period="2y"):
    """Download real stock data using yfinance"""
    try:
        stock = yf.Ticker(symbol)
        data = stock.history(period=period)
        
        # Reset index to get Date as a column
        data.reset_index(inplace=True)
        
        # Format the data
        data['Date'] = data['Date'].dt.strftime('%Y-%m-%d')
        data = data[['Date', 'Open', 'High', 'Low', 'Close', 'Volume']]
        
        # Round prices to 2 decimal places
        for col in ['Open', 'High', 'Low', 'Close']:
            data[col] = data[col].round(2)
        
        data['Volume'] = data['Volume'].astype(int)
        
        return data
    except Exception as e:
        print(f"Error downloading real data: {e}")
        return None

def create_sample_datasets():
    """Create multiple sample datasets"""
    
    # Create data directory
    os.makedirs('data', exist_ok=True)
    
    # Generate synthetic data for different scenarios
    datasets = [
        {"name": "AAPL_synthetic", "symbol": "AAPL", "days": 1000, "start_price": 150},
        {"name": "GOOGL_synthetic", "symbol": "GOOGL", "days": 800, "start_price": 2500},
        {"name": "TSLA_synthetic", "symbol": "TSLA", "days": 600, "start_price": 200},
        {"name": "MSFT_synthetic", "symbol": "MSFT", "days": 900, "start_price": 300},
    ]
    
    for dataset in datasets:
        print(f"Generating {dataset['name']} data...")
        df = generate_synthetic_stock_data(
            symbol=dataset['symbol'],
            days=dataset['days'],
            start_price=dataset['start_price']
        )
        
        filename = f"data/{dataset['name']}.csv"
        df.to_csv(filename, index=False)
        print(f"Saved {len(df)} records to {filename}")
    
    # Try to download real data
    real_symbols = ["AAPL", "GOOGL", "MSFT", "TSLA"]
    for symbol in real_symbols:
        print(f"Downloading real data for {symbol}...")
        df = download_real_stock_data(symbol, period="2y")
        if df is not None:
            filename = f"data/{symbol}_real.csv"
            df.to_csv(filename, index=False)
            print(f"Saved {len(df)} real records to {filename}")
        else:
            print(f"Failed to download real data for {symbol}")

if __name__ == "__main__":
    create_sample_datasets()
    print("\nDataset generation complete!")
    print("Available files:")
    if os.path.exists('data'):
        for file in os.listdir('data'):
            if file.endswith('.csv'):
                print(f"  - data/{file}")
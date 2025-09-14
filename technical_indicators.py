import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime

class TechnicalAnalyzer:
    def __init__(self, df):
        self.df = df.copy()
        self.df['Date'] = pd.to_datetime(self.df['Date'])
        self.df.set_index('Date', inplace=True)
        
    def calculate_sma(self, period):
        """Simple Moving Average"""
        return self.df['Close'].rolling(window=period).mean()
    
    def calculate_ema(self, period):
        """Exponential Moving Average"""
        return self.df['Close'].ewm(span=period).mean()
    
    def calculate_rsi(self, period=14):
        """Relative Strength Index"""
        delta = self.df['Close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        return rsi
    
    def calculate_macd(self, fast=12, slow=26, signal=9):
        """MACD (Moving Average Convergence Divergence)"""
        ema_fast = self.calculate_ema(fast)
        ema_slow = self.calculate_ema(slow)
        macd = ema_fast - ema_slow
        macd_signal = macd.ewm(span=signal).mean()
        macd_histogram = macd - macd_signal
        return macd, macd_signal, macd_histogram
    
    def calculate_bollinger_bands(self, period=20, std_dev=2):
        """Bollinger Bands"""
        sma = self.calculate_sma(period)
        std = self.df['Close'].rolling(window=period).std()
        upper_band = sma + (std * std_dev)
        lower_band = sma - (std * std_dev)
        return upper_band, sma, lower_band
    
    def calculate_stochastic(self, k_period=14, d_period=3):
        """Stochastic Oscillator"""
        low_min = self.df['Low'].rolling(window=k_period).min()
        high_max = self.df['High'].rolling(window=k_period).max()
        k_percent = 100 * ((self.df['Close'] - low_min) / (high_max - low_min))
        d_percent = k_percent.rolling(window=d_period).mean()
        return k_percent, d_percent
    
    def calculate_williams_r(self, period=14):
        """Williams %R"""
        high_max = self.df['High'].rolling(window=period).max()
        low_min = self.df['Low'].rolling(window=period).min()
        williams_r = -100 * ((high_max - self.df['Close']) / (high_max - low_min))
        return williams_r
    
    def calculate_atr(self, period=14):
        """Average True Range"""
        high_low = self.df['High'] - self.df['Low']
        high_close = np.abs(self.df['High'] - self.df['Close'].shift())
        low_close = np.abs(self.df['Low'] - self.df['Close'].shift())
        
        true_range = np.maximum(high_low, np.maximum(high_close, low_close))
        atr = true_range.rolling(window=period).mean()
        return atr
    
    def calculate_all_indicators(self):
        """Calculate all technical indicators"""
        indicators = pd.DataFrame(index=self.df.index)
        
        # Price data
        indicators['Open'] = self.df['Open']
        indicators['High'] = self.df['High']
        indicators['Low'] = self.df['Low']
        indicators['Close'] = self.df['Close']
        indicators['Volume'] = self.df['Volume']
        
        # Moving Averages
        indicators['SMA_20'] = self.calculate_sma(20)
        indicators['SMA_50'] = self.calculate_sma(50)
        indicators['SMA_200'] = self.calculate_sma(200)
        indicators['EMA_12'] = self.calculate_ema(12)
        indicators['EMA_26'] = self.calculate_ema(26)
        
        # RSI
        indicators['RSI'] = self.calculate_rsi()
        
        # MACD
        macd, macd_signal, macd_histogram = self.calculate_macd()
        indicators['MACD'] = macd
        indicators['MACD_Signal'] = macd_signal
        indicators['MACD_Histogram'] = macd_histogram
        
        # Bollinger Bands
        bb_upper, bb_middle, bb_lower = self.calculate_bollinger_bands()
        indicators['BB_Upper'] = bb_upper
        indicators['BB_Middle'] = bb_middle
        indicators['BB_Lower'] = bb_lower
        indicators['BB_Width'] = bb_upper - bb_lower
        indicators['BB_Position'] = (indicators['Close'] - bb_lower) / (bb_upper - bb_lower)
        
        # Stochastic
        stoch_k, stoch_d = self.calculate_stochastic()
        indicators['Stoch_K'] = stoch_k
        indicators['Stoch_D'] = stoch_d
        
        # Williams %R
        indicators['Williams_R'] = self.calculate_williams_r()
        
        # ATR
        indicators['ATR'] = self.calculate_atr()
        
        # Price-based indicators
        indicators['Price_Change'] = self.df['Close'].pct_change()
        indicators['Volatility'] = indicators['Price_Change'].rolling(window=20).std()
        
        # Volume indicators
        indicators['Volume_SMA'] = self.df['Volume'].rolling(window=20).mean()
        indicators['Volume_Ratio'] = self.df['Volume'] / indicators['Volume_SMA']
        
        return indicators
    
    def generate_signals(self, indicators):
        """Generate buy/sell signals based on technical indicators"""
        signals = pd.DataFrame(index=indicators.index)
        
        # RSI signals
        signals['RSI_Oversold'] = indicators['RSI'] < 30
        signals['RSI_Overbought'] = indicators['RSI'] > 70
        
        # MACD signals
        signals['MACD_Bullish'] = (indicators['MACD'] > indicators['MACD_Signal']) & \
                                  (indicators['MACD'].shift(1) <= indicators['MACD_Signal'].shift(1))
        signals['MACD_Bearish'] = (indicators['MACD'] < indicators['MACD_Signal']) & \
                                  (indicators['MACD'].shift(1) >= indicators['MACD_Signal'].shift(1))
        
        # Moving Average signals
        signals['MA_Bullish'] = indicators['Close'] > indicators['SMA_50']
        signals['MA_Bearish'] = indicators['Close'] < indicators['SMA_50']
        
        # Bollinger Bands signals
        signals['BB_Oversold'] = indicators['Close'] < indicators['BB_Lower']
        signals['BB_Overbought'] = indicators['Close'] > indicators['BB_Upper']
        
        # Combined signals
        signals['Buy_Signal'] = (signals['RSI_Oversold'] | signals['BB_Oversold']) & \
                               signals['MACD_Bullish'] & signals['MA_Bullish']
        
        signals['Sell_Signal'] = (signals['RSI_Overbought'] | signals['BB_Overbought']) & \
                                signals['MACD_Bearish'] & signals['MA_Bearish']
        
        return signals
    
    def plot_technical_analysis(self, indicators, signals, save_path=None):
        """Plot comprehensive technical analysis"""
        fig, axes = plt.subplots(4, 1, figsize=(15, 20))
        
        # Price and Moving Averages
        axes[0].plot(indicators.index, indicators['Close'], label='Close Price', linewidth=2)
        axes[0].plot(indicators.index, indicators['SMA_20'], label='SMA 20', alpha=0.7)
        axes[0].plot(indicators.index, indicators['SMA_50'], label='SMA 50', alpha=0.7)
        axes[0].fill_between(indicators.index, indicators['BB_Upper'], indicators['BB_Lower'], 
                            alpha=0.2, label='Bollinger Bands')
        
        # Buy/Sell signals
        buy_signals = signals[signals['Buy_Signal']].index
        sell_signals = signals[signals['Sell_Signal']].index
        
        if len(buy_signals) > 0:
            axes[0].scatter(buy_signals, indicators.loc[buy_signals, 'Close'], 
                           color='green', marker='^', s=100, label='Buy Signal')
        
        if len(sell_signals) > 0:
            axes[0].scatter(sell_signals, indicators.loc[sell_signals, 'Close'], 
                           color='red', marker='v', s=100, label='Sell Signal')
        
        axes[0].set_title('Price Chart with Technical Indicators')
        axes[0].legend()
        axes[0].grid(True, alpha=0.3)
        
        # RSI
        axes[1].plot(indicators.index, indicators['RSI'], label='RSI', color='purple')
        axes[1].axhline(y=70, color='r', linestyle='--', alpha=0.7, label='Overbought (70)')
        axes[1].axhline(y=30, color='g', linestyle='--', alpha=0.7, label='Oversold (30)')
        axes[1].set_title('RSI (Relative Strength Index)')
        axes[1].set_ylim(0, 100)
        axes[1].legend()
        axes[1].grid(True, alpha=0.3)
        
        # MACD
        axes[2].plot(indicators.index, indicators['MACD'], label='MACD', color='blue')
        axes[2].plot(indicators.index, indicators['MACD_Signal'], label='Signal', color='red')
        axes[2].bar(indicators.index, indicators['MACD_Histogram'], label='Histogram', alpha=0.3)
        axes[2].set_title('MACD (Moving Average Convergence Divergence)')
        axes[2].legend()
        axes[2].grid(True, alpha=0.3)
        
        # Volume
        axes[3].bar(indicators.index, indicators['Volume'], alpha=0.7, color='orange')
        axes[3].plot(indicators.index, indicators['Volume_SMA'], color='red', label='Volume SMA')
        axes[3].set_title('Volume Analysis')
        axes[3].legend()
        axes[3].grid(True, alpha=0.3)
        
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            print(f"Technical analysis chart saved to {save_path}")
        
        plt.show()
    
    def export_analysis(self, filename='technical_analysis.csv'):
        """Export complete technical analysis to CSV"""
        indicators = self.calculate_all_indicators()
        signals = self.generate_signals(indicators)
        
        # Combine indicators and signals
        analysis = pd.concat([indicators, signals], axis=1)
        
        # Reset index to include date as column
        analysis.reset_index(inplace=True)
        
        # Save to CSV
        analysis.to_csv(filename, index=False)
        print(f"Technical analysis exported to {filename}")
        
        return analysis

def main():
    """Main function to demonstrate technical analysis"""
    
    # Load data
    try:
        df = pd.read_csv('data/AAPL_real.csv')
        print("Loaded real AAPL data for technical analysis")
    except:
        try:
            df = pd.read_csv('data/AAPL_synthetic.csv')
            print("Loaded synthetic AAPL data for technical analysis")
        except:
            print("No data file found. Please run generate_stock_data.py first.")
            return
    
    # Initialize analyzer
    analyzer = TechnicalAnalyzer(df)
    
    # Calculate all indicators
    print("Calculating technical indicators...")
    indicators = analyzer.calculate_all_indicators()
    
    # Generate signals
    print("Generating trading signals...")
    signals = analyzer.generate_signals(indicators)
    
    # Plot analysis
    print("Creating technical analysis charts...")
    analyzer.plot_technical_analysis(indicators, signals, 'technical_analysis_chart.png')
    
    # Export analysis
    print("Exporting analysis to CSV...")
    analysis = analyzer.export_analysis('technical_analysis_complete.csv')
    
    # Print summary statistics
    print("\nTechnical Analysis Summary:")
    print(f"Total Buy Signals: {signals['Buy_Signal'].sum()}")
    print(f"Total Sell Signals: {signals['Sell_Signal'].sum()}")
    print(f"Current RSI: {indicators['RSI'].iloc[-1]:.2f}")
    print(f"Current MACD: {indicators['MACD'].iloc[-1]:.4f}")
    print(f"Price vs SMA50: {'Above' if indicators['Close'].iloc[-1] > indicators['SMA_50'].iloc[-1] else 'Below'}")

if __name__ == "__main__":
    main()
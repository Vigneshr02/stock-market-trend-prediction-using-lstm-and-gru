#!/usr/bin/env python3
"""
Complete Stock Market Analysis Pipeline
This script runs the entire analysis pipeline from data generation to prediction
"""

import os
import sys
import subprocess
import pandas as pd
import numpy as np
from datetime import datetime

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"\n{'='*60}")
    print(f"🚀 {description}")
    print(f"{'='*60}")
    
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(result.stdout)
        if result.stderr:
            print("Warnings:", result.stderr)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error: {e}")
        print(f"Output: {e.stdout}")
        print(f"Error: {e.stderr}")
        return False

def check_dependencies():
    """Check if required packages are installed"""
    required_packages = [
        'tensorflow', 'pandas', 'numpy', 'matplotlib', 
        'scikit-learn', 'yfinance', 'flask', 'seaborn'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package)
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        print(f"❌ Missing packages: {missing_packages}")
        print("Installing missing packages...")
        
        install_command = f"pip install {' '.join(missing_packages)}"
        if not run_command(install_command, "Installing Dependencies"):
            return False
    
    print("✅ All dependencies are installed!")
    return True

def main():
    """Main execution pipeline"""
    print("🎯 Stock Market Forecasting - Complete Analysis Pipeline")
    print("=" * 60)
    
    # Check dependencies
    if not check_dependencies():
        print("❌ Failed to install dependencies. Exiting.")
        return
    
    # Step 1: Generate stock data
    if not run_command("python generate_stock_data.py", "Generating Stock Market Data"):
        print("❌ Failed to generate data. Exiting.")
        return
    
    # Step 2: Run stock prediction model
    if not run_command("python stock_prediction_model.py", "Training Hybrid LSTM-GRU Model"):
        print("❌ Failed to train model. Continuing with technical analysis...")
    
    # Step 3: Run technical analysis
    if not run_command("python technical_indicators.py", "Performing Technical Analysis"):
        print("❌ Failed to perform technical analysis. Continuing...")
    
    # Step 4: Display results summary
    print("\n" + "="*60)
    print("📊 ANALYSIS COMPLETE - RESULTS SUMMARY")
    print("="*60)
    
    # Check generated files
    files_to_check = [
        ('data/', 'CSV Data Files'),
        ('predictions_results.csv', 'Model Predictions'),
        ('technical_analysis_complete.csv', 'Technical Analysis'),
        ('technical_analysis_chart.png', 'Technical Charts'),
        ('hybrid_lstm_gru_model.h5', 'Trained Model')
    ]
    
    print("\n📁 Generated Files:")
    for file_path, description in files_to_check:
        if os.path.exists(file_path):
            if os.path.isdir(file_path):
                file_count = len([f for f in os.listdir(file_path) if f.endswith('.csv')])
                print(f"✅ {description}: {file_count} files in {file_path}")
            else:
                file_size = os.path.getsize(file_path) / (1024*1024)  # MB
                print(f"✅ {description}: {file_path} ({file_size:.1f} MB)")
        else:
            print(f"❌ {description}: Not found")
    
    # Display model performance if available
    if os.path.exists('predictions_results.csv'):
        try:
            results = pd.read_csv('predictions_results.csv')
            print(f"\n📈 Model Performance:")
            print(f"   • Total Predictions: {len(results)}")
            print(f"   • Average Error: {results['Error'].abs().mean():.2f}")
            print(f"   • Average Error %: {results['Error_Percentage'].abs().mean():.2f}%")
            print(f"   • Average Confidence: {results['Confidence'].mean():.2f}")
        except Exception as e:
            print(f"❌ Could not read prediction results: {e}")
    
    # Instructions for next steps
    print(f"\n🎯 Next Steps:")
    print(f"   1. 📊 Review generated CSV files in the 'data/' directory")
    print(f"   2. 📈 Check 'predictions_results.csv' for model predictions")
    print(f"   3. 🔍 Examine 'technical_analysis_complete.csv' for indicators")
    print(f"   4. 📱 Run 'python web_dashboard.py' to start the web interface")
    print(f"   5. 🌐 Open http://localhost:5000 in your browser")
    
    print(f"\n🚀 Web Dashboard:")
    print(f"   To start the interactive web dashboard, run:")
    print(f"   python web_dashboard.py")
    
    print(f"\n✨ Analysis pipeline completed successfully!")

if __name__ == "__main__":
    main()
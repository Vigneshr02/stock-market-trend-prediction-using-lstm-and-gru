Description

This project predicts stock market trends using LSTM (Long Short-Term Memory) and GRU (Gated Recurrent Unit) deep learning models.
It analyzes historical stock prices to forecast future trends.

Features

LSTM & GRU model implementation

Data preprocessing and normalization

Visualization of actual vs predicted stock prices

Evaluation metrics: RMSE, MAE

Project Structure
stock-market-trend-prediction-using-lstm-and-gru/
│
├── data/                  # Stock CSV files
├── models/                # Saved trained models
├── notebooks/             # Jupyter notebooks
├── main.py                # Main script to run predictions
├── requirements.txt       # Python dependencies
├── README.md

Installation

Clone the repository:

git clone https://github.com/Vigneshr02/stock-market-trend-prediction-using-lstm-and-gru.git
cd stock-market-trend-prediction-using-lstm-and-gru


(Optional) Create a virtual environment:

python -m venv venv
source venv/bin/activate      # Linux/Mac
venv\Scripts\activate         # Windows


Install dependencies:

pip install -r requirements.txt

Usage

Place your stock CSV files in the data/ folder.

Run the prediction script:

python main.py


Outputs:

Predicted stock prices (LSTM & GRU)

Plots saved in plots/

Evaluation metrics printed in terminal

Example Plot


Replace with your actual output plot.

Author

Vignesh Raj – GitHub Profile

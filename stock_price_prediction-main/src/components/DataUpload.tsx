import React, { useCallback, useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { StockData } from '../types/StockTypes';

interface DataUploadProps {
  onDataUpload: (data: StockData[]) => void;
  stockData: StockData[];
}

const DataUpload: React.FC<DataUploadProps> = ({ onDataUpload, stockData }) => {
  const [dragOver, setDragOver] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const parseCSVData = useCallback((csvText: string): StockData[] => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    
    const data: StockData[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      
      const dateIdx = headers.findIndex(h => h.includes('date') || h.includes('time'));
      const openIdx = headers.findIndex(h => h.includes('open'));
      const highIdx = headers.findIndex(h => h.includes('high'));
      const lowIdx = headers.findIndex(h => h.includes('low'));
      const closeIdx = headers.findIndex(h => h.includes('close') || h.includes('price'));
      const volumeIdx = headers.findIndex(h => h.includes('volume'));
      
      if (dateIdx >= 0 && closeIdx >= 0) {
        data.push({
          date: values[dateIdx],
          open: openIdx >= 0 ? parseFloat(values[openIdx]) || 0 : parseFloat(values[closeIdx]),
          high: highIdx >= 0 ? parseFloat(values[highIdx]) || 0 : parseFloat(values[closeIdx]),
          low: lowIdx >= 0 ? parseFloat(values[lowIdx]) || 0 : parseFloat(values[closeIdx]),
          close: parseFloat(values[closeIdx]),
          volume: volumeIdx >= 0 ? parseFloat(values[volumeIdx]) || 0 : Math.floor(Math.random() * 1000000)
        });
      }
    }
    
    return data.filter(d => !isNaN(d.close));
  }, []);

  const generateSampleData = () => {
    const sampleData: StockData[] = [];
    const basePrice = 150;
    const startDate = new Date('2024-01-01');
    
    for (let i = 0; i < 252; i++) { // One year of trading days
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const trend = Math.sin(i * 0.02) * 10;
      const noise = (Math.random() - 0.5) * 5;
      const close = basePrice + trend + noise + (i * 0.1);
      const volatility = 0.02;
      
      const open = close * (1 + (Math.random() - 0.5) * volatility);
      const high = Math.max(open, close) * (1 + Math.random() * volatility);
      const low = Math.min(open, close) * (1 - Math.random() * volatility);
      
      sampleData.push({
        date: date.toISOString().split('T')[0],
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume: Math.floor(Math.random() * 2000000) + 500000
      });
    }
    
    onDataUpload(sampleData);
    setUploadStatus('success');
  };

  const handleFileUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvText = e.target?.result as string;
        const data = parseCSVData(csvText);
        
        if (data.length > 0) {
          onDataUpload(data);
          setUploadStatus('success');
        } else {
          setUploadStatus('error');
        }
      } catch (error) {
        setUploadStatus('error');
      }
    };
    reader.readAsText(file);
  }, [parseCSVData, onDataUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const csvFile = files.find(file => file.type === 'text/csv' || file.name.endsWith('.csv'));
    
    if (csvFile) {
      handleFileUpload(csvFile);
    }
  }, [handleFileUpload]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Upload Stock Data</h2>
        <p className="text-slate-400 text-lg">
          Upload your CSV file with stock data or use sample data to get started
        </p>
      </div>

      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
          dragOver
            ? 'border-blue-400 bg-blue-500/10'
            : stockData.length > 0
            ? 'border-green-400 bg-green-500/10'
            : 'border-slate-600 bg-slate-800/30 hover:border-slate-500'
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
      >
        <input
          type="file"
          accept=".csv"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="space-y-4">
          {stockData.length > 0 ? (
            <>
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto" />
              <div>
                <h3 className="text-xl font-semibold text-green-400">Data Uploaded Successfully</h3>
                <p className="text-slate-300">{stockData.length} records loaded</p>
              </div>
            </>
          ) : (
            <>
              <Upload className="w-16 h-16 text-slate-400 mx-auto" />
              <div>
                <h3 className="text-xl font-semibold text-white">Drop your CSV file here</h3>
                <p className="text-slate-400">or click to browse files</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Sample Data Button */}
      <div className="text-center">
        <button
          onClick={generateSampleData}
          className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-8 py-3 rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-300 flex items-center space-x-2 mx-auto"
        >
          <FileText className="w-5 h-5" />
          <span>Use Sample Data</span>
        </button>
        <p className="text-slate-400 text-sm mt-2">
          Generate 252 days of sample stock data for testing
        </p>
      </div>

      {/* Status Messages */}
      {uploadStatus === 'error' && (
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <div>
            <h4 className="font-medium text-red-400">Upload Error</h4>
            <p className="text-red-300 text-sm">Please check your CSV format and try again.</p>
          </div>
        </div>
      )}

      {/* Data Preview */}
      {stockData.length > 0 && (
        <div className="bg-slate-800/30 rounded-xl p-6 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white mb-4">Data Preview</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-slate-300">
              <thead>
                <tr className="border-b border-slate-600">
                  <th className="text-left py-2">Date</th>
                  <th className="text-right py-2">Open</th>
                  <th className="text-right py-2">High</th>
                  <th className="text-right py-2">Low</th>
                  <th className="text-right py-2">Close</th>
                  <th className="text-right py-2">Volume</th>
                </tr>
              </thead>
              <tbody>
                {stockData.slice(0, 5).map((row, index) => (
                  <tr key={index} className="border-b border-slate-700">
                    <td className="py-2">{row.date}</td>
                    <td className="text-right py-2">${row.open.toFixed(2)}</td>
                    <td className="text-right py-2">${row.high.toFixed(2)}</td>
                    <td className="text-right py-2">${row.low.toFixed(2)}</td>
                    <td className="text-right py-2">${row.close.toFixed(2)}</td>
                    <td className="text-right py-2">{row.volume.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {stockData.length > 5 && (
              <p className="text-slate-400 text-center mt-3">
                ... and {stockData.length - 5} more records
              </p>
            )}
          </div>
        </div>
      )}

      {/* CSV Format Guide */}
      <div className="bg-slate-800/30 rounded-xl p-6 backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-white mb-4">CSV Format Requirements</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-slate-300 mb-2">Required Columns:</h4>
            <ul className="text-slate-400 text-sm space-y-1">
              <li>• Date (YYYY-MM-DD format)</li>
              <li>• Close/Price (required)</li>
              <li>• Open (optional)</li>
              <li>• High (optional)</li>
              <li>• Low (optional)</li>
              <li>• Volume (optional)</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-slate-300 mb-2">Example:</h4>
            <pre className="text-slate-400 text-xs bg-slate-900/50 p-3 rounded">
{`Date,Open,High,Low,Close,Volume
2024-01-01,150.00,155.00,149.00,152.50,1000000
2024-01-02,152.50,156.00,151.00,154.25,1200000`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataUpload;
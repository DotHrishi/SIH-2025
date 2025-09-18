import { useState, useEffect } from 'react';
import { analyticsAPI } from '../../services/api';
import InteractiveChart from './InteractiveChart';

const CorrelationAnalysis = ({ filters }) => {
  const [correlationData, setCorrelationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState('water-health');

  useEffect(() => {
    fetchCorrelationData();
  }, [filters, selectedAnalysis]);

  const fetchCorrelationData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = { 
        ...filters, 
        analysisType: selectedAnalysis 
      };

      const response = await analyticsAPI.getCorrelation(params);
      
      if (response.data.success) {
        setCorrelationData(response.data.data);
      } else {
        setError('Failed to fetch correlation data');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to fetch correlation data');
    } finally {
      setLoading(false);
    }
  };

  // Generate mock correlation data for demonstration
  const generateMockData = () => {
    const mockData = {
      'water-health': {
        title: 'Water Quality vs Health Cases Correlation',
        scatterData: {
          labels: ['pH vs Cases', 'Turbidity vs Cases', 'DO vs Cases'],
          datasets: [
            {
              label: 'pH Level vs Case Count',
              data: [
                { x: 6.2, y: 15 }, { x: 6.5, y: 12 }, { x: 6.8, y: 8 },
                { x: 7.0, y: 5 }, { x: 7.2, y: 3 }, { x: 7.5, y: 2 },
                { x: 7.8, y: 4 }, { x: 8.0, y: 7 }, { x: 8.3, y: 11 },
                { x: 8.5, y: 14 }, { x: 8.8, y: 18 }
              ],
              backgroundColor: 'rgba(59, 130, 246, 0.6)',
              borderColor: 'rgb(59, 130, 246)',
            }
          ]
        },
        correlationMatrix: [
          { parameter: 'pH Level', correlation: -0.72, strength: 'Strong Negative' },
          { parameter: 'Turbidity', correlation: 0.68, strength: 'Strong Positive' },
          { parameter: 'Dissolved Oxygen', correlation: -0.45, strength: 'Moderate Negative' },
          { parameter: 'Temperature', correlation: 0.23, strength: 'Weak Positive' },
        ],
        insights: [
          'Strong negative correlation between pH levels and health cases',
          'High turbidity strongly associated with increased disease cases',
          'Low dissolved oxygen moderately linked to health issues',
          'Temperature shows weak positive correlation with cases'
        ]
      },
      'seasonal': {
        title: 'Seasonal Pattern Analysis',
        lineData: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
          datasets: [
            {
              label: 'Average Cases per Month',
              data: [45, 38, 42, 55, 68, 85, 92, 88, 75, 62, 48, 41],
              borderColor: 'rgb(34, 197, 94)',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              tension: 0.4,
            },
            {
              label: 'Rainfall (mm)',
              data: [25, 30, 45, 65, 120, 180, 220, 200, 150, 80, 40, 28],
              borderColor: 'rgb(59, 130, 246)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              tension: 0.4,
              yAxisID: 'y1',
            }
          ]
        },
        correlationMatrix: [
          { parameter: 'Rainfall', correlation: 0.78, strength: 'Strong Positive' },
          { parameter: 'Temperature', correlation: 0.65, strength: 'Strong Positive' },
          { parameter: 'Humidity', correlation: 0.58, strength: 'Moderate Positive' },
        ],
        insights: [
          'Strong positive correlation between rainfall and disease cases',
          'Monsoon season shows highest case counts',
          'Temperature and humidity also correlate with case increases',
          'Winter months show lowest disease incidence'
        ]
      },
      'demographic': {
        title: 'Demographic Risk Analysis',
        barData: {
          labels: ['0-5 years', '5-15 years', '15-25 years', '25-35 years', '35-45 years', '45+ years'],
          datasets: [
            {
              label: 'Case Rate per 1000',
              data: [12.5, 8.2, 4.1, 5.8, 7.3, 9.6],
              backgroundColor: [
                'rgba(239, 68, 68, 0.8)',
                'rgba(245, 158, 11, 0.8)',
                'rgba(34, 197, 94, 0.8)',
                'rgba(59, 130, 246, 0.8)',
                'rgba(147, 51, 234, 0.8)',
                'rgba(107, 114, 128, 0.8)',
              ],
            }
          ]
        },
        correlationMatrix: [
          { parameter: 'Age (0-5)', correlation: 0.85, strength: 'Very Strong Positive' },
          { parameter: 'Age (45+)', correlation: 0.62, strength: 'Strong Positive' },
          { parameter: 'Population Density', correlation: 0.48, strength: 'Moderate Positive' },
          { parameter: 'Income Level', correlation: -0.55, strength: 'Moderate Negative' },
        ],
        insights: [
          'Children under 5 show highest vulnerability to waterborne diseases',
          'Elderly population (45+) also at increased risk',
          'Population density moderately correlates with case rates',
          'Lower income areas show higher disease incidence'
        ]
      }
    };

    return mockData[selectedAnalysis] || mockData['water-health'];
  };

  const data = correlationData || generateMockData();

  const getCorrelationColor = (correlation) => {
    const abs = Math.abs(correlation);
    if (abs >= 0.7) return 'text-red-600 bg-red-50';
    if (abs >= 0.5) return 'text-orange-600 bg-orange-50';
    if (abs >= 0.3) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getCorrelationIcon = (correlation) => {
    if (correlation > 0) {
      return <span className="text-red-500">↗</span>;
    } else {
      return <span className="text-blue-500">↘</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading correlation analysis...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-red-400">⚠️</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error Loading Correlation Analysis</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={fetchCorrelationData}
                className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analysis Type Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Correlation Analysis</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedAnalysis('water-health')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              selectedAnalysis === 'water-health'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Water Quality vs Health
          </button>
          <button
            onClick={() => setSelectedAnalysis('seasonal')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              selectedAnalysis === 'seasonal'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Seasonal Patterns
          </button>
          <button
            onClick={() => setSelectedAnalysis('demographic')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              selectedAnalysis === 'demographic'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Demographics
          </button>
        </div>
      </div>

      {/* Main Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <InteractiveChart
            data={data.scatterData || data.lineData || data.barData}
            type={selectedAnalysis === 'water-health' ? 'scatter' : selectedAnalysis === 'seasonal' ? 'line' : 'bar'}
            title={data.title}
            height={400}
            customOptions={selectedAnalysis === 'seasonal' ? {
              scales: {
                y: {
                  type: 'linear',
                  display: true,
                  position: 'left',
                  title: {
                    display: true,
                    text: 'Cases',
                  },
                },
                y1: {
                  type: 'linear',
                  display: true,
                  position: 'right',
                  title: {
                    display: true,
                    text: 'Rainfall (mm)',
                  },
                  grid: {
                    drawOnChartArea: false,
                  },
                },
              },
            } : {}}
          />
        </div>

        {/* Correlation Matrix */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Correlation Strength</h3>
          <div className="space-y-3">
            {data.correlationMatrix?.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{item.parameter}</div>
                  <div className="text-xs text-gray-500">{item.strength}</div>
                </div>
                <div className="flex items-center space-x-2">
                  {getCorrelationIcon(item.correlation)}
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getCorrelationColor(item.correlation)}`}>
                    {item.correlation > 0 ? '+' : ''}{item.correlation}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Correlation Legend */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Correlation Strength Guide</h4>
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span>Very Strong</span>
                <span className="text-red-600">±0.7 to ±1.0</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Strong</span>
                <span className="text-orange-600">±0.5 to ±0.7</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Moderate</span>
                <span className="text-yellow-600">±0.3 to ±0.5</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Weak</span>
                <span className="text-green-600">±0.1 to ±0.3</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Insights */}
      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Key Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.insights?.map((insight, index) => (
            <div key={index} className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-sm text-blue-800">{insight}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Statistical Summary */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistical Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {data.correlationMatrix?.length || 0}
            </div>
            <div className="text-sm text-gray-600">Parameters Analyzed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {data.correlationMatrix?.filter(item => Math.abs(item.correlation) >= 0.5).length || 0}
            </div>
            <div className="text-sm text-gray-600">Strong Correlations</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {data.correlationMatrix?.reduce((max, item) => 
                Math.abs(item.correlation) > Math.abs(max) ? item.correlation : max, 0
              )?.toFixed(2) || '0.00'}
            </div>
            <div className="text-sm text-gray-600">Strongest Correlation</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CorrelationAnalysis;
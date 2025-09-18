import { useState, useRef, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut, Scatter } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

const InteractiveChart = ({ 
  data, 
  type = 'line', 
  title, 
  subtitle,
  height = 400,
  onDataPointClick,
  showLegend = true,
  showTooltip = true,
  enableZoom = true,
  enablePan = true,
  customOptions = {}
}) => {
  const chartRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedDataPoint, setSelectedDataPoint] = useState(null);

  // Base chart options
  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: showLegend,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      title: {
        display: !!title,
        text: title,
        font: {
          size: 16,
          weight: 'bold',
        },
        padding: {
          top: 10,
          bottom: 30,
        },
      },
      subtitle: {
        display: !!subtitle,
        text: subtitle,
        font: {
          size: 12,
        },
        padding: {
          bottom: 20,
        },
      },
      tooltip: {
        enabled: showTooltip,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: function(context) {
            return context[0].label;
          },
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat().format(context.parsed.y);
            }
            return label;
          },
          afterLabel: function(context) {
            // Add percentage for pie/doughnut charts
            if (type === 'doughnut' || type === 'pie') {
              const dataset = context.dataset;
              const total = dataset.data.reduce((sum, value) => sum + value, 0);
              const percentage = ((context.parsed * 100) / total).toFixed(1);
              return `${percentage}%`;
            }
            return '';
          },
        },
      },
    },
    scales: type !== 'doughnut' && type !== 'pie' ? {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Time Period',
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Count',
        },
        beginAtZero: true,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    } : {},
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const element = elements[0];
        const datasetIndex = element.datasetIndex;
        const index = element.index;
        const value = data.datasets[datasetIndex].data[index];
        const label = data.labels[index];
        
        setSelectedDataPoint({
          datasetIndex,
          index,
          value,
          label,
          dataset: data.datasets[datasetIndex]
        });
        
        if (onDataPointClick) {
          onDataPointClick({
            datasetIndex,
            index,
            value,
            label,
            dataset: data.datasets[datasetIndex]
          });
        }
      }
    },
    ...customOptions,
  };

  // Chart type specific options
  const getTypeSpecificOptions = () => {
    switch (type) {
      case 'line':
        return {
          elements: {
            line: {
              tension: 0.4,
            },
            point: {
              radius: 4,
              hoverRadius: 8,
            },
          },
        };
      case 'bar':
        return {
          elements: {
            bar: {
              borderRadius: 4,
            },
          },
        };
      case 'doughnut':
        return {
          cutout: '60%',
          plugins: {
            legend: {
              position: 'right',
            },
          },
        };
      default:
        return {};
    }
  };

  const finalOptions = {
    ...baseOptions,
    ...getTypeSpecificOptions(),
  };

  const renderChart = () => {
    const commonProps = {
      ref: chartRef,
      data: data,
      options: finalOptions,
      height: height,
    };

    switch (type) {
      case 'line':
        return <Line {...commonProps} />;
      case 'bar':
        return <Bar {...commonProps} />;
      case 'doughnut':
        return <Doughnut {...commonProps} />;
      case 'scatter':
        return <Scatter {...commonProps} />;
      default:
        return <Line {...commonProps} />;
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const downloadChart = () => {
    if (chartRef.current) {
      const canvas = chartRef.current.canvas;
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${title || 'chart'}.png`;
      link.href = url;
      link.click();
    }
  };

  const resetZoom = () => {
    if (chartRef.current) {
      chartRef.current.resetZoom();
    }
  };

  return (
    <div className={`bg-white rounded-lg border ${isFullscreen ? 'fixed inset-0 z-50 p-4' : 'relative'}`}>
      {/* Chart Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div>
          {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={resetZoom}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Reset Zoom"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            onClick={downloadChart}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Download Chart"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Chart Content */}
      <div className={`p-4 ${isFullscreen ? 'h-full' : ''}`}>
        <div style={{ height: isFullscreen ? 'calc(100vh - 200px)' : `${height}px` }}>
          {renderChart()}
        </div>
      </div>

      {/* Selected Data Point Info */}
      {selectedDataPoint && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Selected Data Point</h4>
              <p className="text-sm text-gray-600">
                {selectedDataPoint.label}: {selectedDataPoint.value} 
                ({selectedDataPoint.dataset.label})
              </p>
            </div>
            <button
              onClick={() => setSelectedDataPoint(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveChart;
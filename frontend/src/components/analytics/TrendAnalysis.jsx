import { useState, useEffect } from 'react';
import InteractiveChart from './InteractiveChart';
import StatisticsDashboard from './StatisticsDashboard';
import CorrelationAnalysis from './CorrelationAnalysis';
import api, { analyticsAPI } from '../../services/api';



const TrendAnalysis = ({ filters }) => {
  const [trendData, setTrendData] = useState(null);
  const [summaryStats, setSummaryStats] = useState(null);
  const [waterQualityData, setWaterQualityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('overview');
  const [activeChart, setActiveChart] = useState('trends');

  useEffect(() => {
    fetchAnalyticsData();
  }, [filters]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      // Fetch all analytics data
      const filterParams = Object.fromEntries(params.entries());
      const [trendsResponse, summaryResponse, waterQualityResponse] = await Promise.all([
        analyticsAPI.getTrends(filterParams),
        analyticsAPI.getSummary(filterParams),
        analyticsAPI.getWaterQuality(filterParams)
      ]);

      if (trendsResponse.data.success) {
        setTrendData(trendsResponse.data.data);
      }
      
      if (summaryResponse.data.success) {
        setSummaryStats(summaryResponse.data.data);
      }
      
      if (waterQualityResponse.data.success) {
        setWaterQualityData(waterQualityResponse.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleDataPointClick = (dataPoint) => {
    console.log('Data point clicked:', dataPoint);
    // Handle data point interaction
  };

  // Prepare trend chart data
  const getTrendChartData = () => {
    if (!trendData?.dailyTrends) return null;

    const labels = trendData.dailyTrends.map(item => 
      new Date(item._id).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
    );

    return {
      labels,
      datasets: [
        {
          label: 'Total Cases',
          data: trendData.dailyTrends.map(item => item.totalCases),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.1,
        },
        {
          label: 'Severe Cases',
          data: trendData.dailyTrends.map(item => item.severeCases),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.1,
        },
      ],
    };
  };

  // Prepare severity distribution chart data
  const getSeverityChartData = () => {
    if (!summaryStats?.severityDistribution) return null;

    const distribution = summaryStats.severityDistribution;
    return {
      labels: ['Mild', 'Moderate', 'Severe'],
      datasets: [
        {
          data: [
            distribution.find(item => item._id === 'mild')?.count || 0,
            distribution.find(item => item._id === 'moderate')?.count || 0,
            distribution.find(item => item._id === 'severe')?.count || 0,
          ],
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',
            'rgba(251, 191, 36, 0.8)',
            'rgba(239, 68, 68, 0.8)',
          ],
          borderColor: [
            'rgb(34, 197, 94)',
            'rgb(251, 191, 36)',
            'rgb(239, 68, 68)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  // Prepare age group distribution chart data
  const getAgeGroupChartData = () => {
    if (!summaryStats?.ageGroupDistribution) return null;

    const labels = summaryStats.ageGroupDistribution.map(item => item._id);
    const data = summaryStats.ageGroupDistribution.map(item => item.count);

    return {
      labels,
      datasets: [
        {
          label: 'Cases by Age Group',
          data,
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1,
        },
      ],
    };
  };

  // Prepare water quality trends chart data
  const getWaterQualityChartData = () => {
    if (!waterQualityData?.trends) return null;

    const labels = waterQualityData.trends.map(item => 
      new Date(item._id).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
    );

    return {
      labels,
      datasets: [
        {
          label: 'Average pH',
          data: waterQualityData.trends.map(item => item.avgPH),
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.1,
          yAxisID: 'y',
        },
        {
          label: 'Average Turbidity',
          data: waterQualityData.trends.map(item => item.avgTurbidity),
          borderColor: 'rgb(245, 158, 11)',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          tension: 0.1,
          yAxisID: 'y1',
        },
      ],
    };
  };

  const waterQualityChartOptions = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      title: {
        display: true,
        text: 'Water Quality Trends',
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Date',
        },
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'pH Level',
        },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Turbidity (NTU)',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading analytics...</span>
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
            <h3 className="text-sm font-medium text-red-800">Error Loading Analytics</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={fetchAnalyticsData}
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
      {/* View Navigation */}
      <div className="flex space-x-4 border-b border-gray-200">
        <button
          onClick={() => setActiveView('overview')}
          className={`py-2 px-4 font-medium text-sm transition-colors ${
            activeView === 'overview'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Statistics Overview
        </button>
        <button
          onClick={() => setActiveView('trends')}
          className={`py-2 px-4 font-medium text-sm transition-colors ${
            activeView === 'trends'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Trend Charts
        </button>
        <button
          onClick={() => setActiveView('correlation')}
          className={`py-2 px-4 font-medium text-sm transition-colors ${
            activeView === 'correlation'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Correlation Analysis
        </button>
      </div>

      {/* View Content */}
      {activeView === 'overview' && (
        <StatisticsDashboard 
          filters={filters} 
          onStatClick={handleDataPointClick}
        />
      )}

      {activeView === 'trends' && (
        <div className="space-y-6">
          {/* Chart Navigation */}
          <div className="flex space-x-4 border-b border-gray-200">
            <button
              onClick={() => setActiveChart('trends')}
              className={`py-2 px-4 font-medium text-sm transition-colors ${
                activeChart === 'trends'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Case Trends
            </button>
            <button
              onClick={() => setActiveChart('severity')}
              className={`py-2 px-4 font-medium text-sm transition-colors ${
                activeChart === 'severity'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Severity Distribution
            </button>
            <button
              onClick={() => setActiveChart('ageGroup')}
              className={`py-2 px-4 font-medium text-sm transition-colors ${
                activeChart === 'ageGroup'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Age Groups
            </button>
            <button
              onClick={() => setActiveChart('waterQuality')}
              className={`py-2 px-4 font-medium text-sm transition-colors ${
                activeChart === 'waterQuality'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Water Quality
            </button>
          </div>

          {/* Interactive Charts */}
          {activeChart === 'trends' && getTrendChartData() && (
            <InteractiveChart
              data={getTrendChartData()}
              type="line"
              title="Daily Case Trends Over Time"
              subtitle="Total cases and severe cases by date"
              onDataPointClick={handleDataPointClick}
              height={400}
            />
          )}

          {activeChart === 'severity' && getSeverityChartData() && (
            <InteractiveChart
              data={getSeverityChartData()}
              type="doughnut"
              title="Case Severity Distribution"
              subtitle="Distribution by severity level"
              onDataPointClick={handleDataPointClick}
              height={400}
            />
          )}

          {activeChart === 'ageGroup' && getAgeGroupChartData() && (
            <InteractiveChart
              data={getAgeGroupChartData()}
              type="bar"
              title="Case Distribution by Age Group"
              subtitle="Number of cases per age group"
              onDataPointClick={handleDataPointClick}
              height={400}
            />
          )}

          {activeChart === 'waterQuality' && getWaterQualityChartData() && (
            <InteractiveChart
              data={getWaterQualityChartData()}
              type="line"
              title="Water Quality Trends"
              subtitle="pH and turbidity levels over time"
              onDataPointClick={handleDataPointClick}
              height={400}
              customOptions={waterQualityChartOptions}
            />
          )}

          {/* No Data Message */}
          {((activeChart === 'trends' && !getTrendChartData()) ||
            (activeChart === 'severity' && !getSeverityChartData()) ||
            (activeChart === 'ageGroup' && !getAgeGroupChartData()) ||
            (activeChart === 'waterQuality' && !getWaterQualityChartData())) && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">📊</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No data available</h3>
              <p className="text-gray-500">Try adjusting your filters to see chart data.</p>
            </div>
          )}
        </div>
      )}

      {activeView === 'correlation' && (
        <CorrelationAnalysis filters={filters} />
      )}
    </div>
  );
};

export default TrendAnalysis;
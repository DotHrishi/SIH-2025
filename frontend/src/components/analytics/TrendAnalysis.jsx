import { useState, useEffect } from 'react';
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
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import api, { analyticsAPI } from '../../services/api';

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
  ArcElement
);

const TrendAnalysis = ({ filters }) => {
  const [trendData, setTrendData] = useState(null);
  const [summaryStats, setSummaryStats] = useState(null);
  const [waterQualityData, setWaterQualityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

  // Chart configurations
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
      },
      title: {
        display: true,
      },
    },
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
      {/* Summary Statistics */}
      {summaryStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{summaryStats.totalCases}</div>
            <div className="text-sm text-blue-800">Total Cases</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{summaryStats.totalWaterReports}</div>
            <div className="text-sm text-green-800">Water Reports</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{summaryStats.activeAlerts}</div>
            <div className="text-sm text-yellow-800">Active Alerts</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{summaryStats.affectedDistricts}</div>
            <div className="text-sm text-purple-800">Affected Districts</div>
          </div>
        </div>
      )}

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

      {/* Chart Display */}
      <div className="bg-white p-6 rounded-lg border">
        {activeChart === 'trends' && getTrendChartData() && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Daily Case Trends</h3>
            <Line 
              data={getTrendChartData()} 
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  title: {
                    display: true,
                    text: 'Daily Case Trends Over Time',
                  },
                },
              }} 
            />
          </div>
        )}

        {activeChart === 'severity' && getSeverityChartData() && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Case Severity Distribution</h3>
            <div className="max-w-md mx-auto">
              <Doughnut 
                data={getSeverityChartData()} 
                options={{
                  ...doughnutOptions,
                  plugins: {
                    ...doughnutOptions.plugins,
                    title: {
                      display: true,
                      text: 'Distribution by Severity Level',
                    },
                  },
                }} 
              />
            </div>
          </div>
        )}

        {activeChart === 'ageGroup' && getAgeGroupChartData() && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Cases by Age Group</h3>
            <Bar 
              data={getAgeGroupChartData()} 
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  title: {
                    display: true,
                    text: 'Case Distribution by Age Group',
                  },
                },
              }} 
            />
          </div>
        )}

        {activeChart === 'waterQuality' && getWaterQualityChartData() && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Water Quality Trends</h3>
            <Line 
              data={getWaterQualityChartData()} 
              options={waterQualityChartOptions} 
            />
          </div>
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

      {/* Key Insights */}
      {summaryStats && (
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Key Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Most Affected Age Group</h4>
              <p className="text-gray-600">
                {summaryStats.ageGroupDistribution?.[0]?._id || 'N/A'} 
                {summaryStats.ageGroupDistribution?.[0]?.count && 
                  ` (${summaryStats.ageGroupDistribution[0].count} cases)`
                }
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Common Symptoms</h4>
              <p className="text-gray-600">
                {summaryStats.commonSymptoms?.slice(0, 3).map(s => s._id).join(', ') || 'N/A'}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Severity Breakdown</h4>
              <p className="text-gray-600">
                {summaryStats.severityDistribution?.map(s => 
                  `${s._id}: ${s.count}`
                ).join(', ') || 'N/A'}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Water Source Issues</h4>
              <p className="text-gray-600">
                {summaryStats.waterSourceDistribution?.[0]?._id || 'N/A'}
                {summaryStats.waterSourceDistribution?.[0]?.count && 
                  ` (${summaryStats.waterSourceDistribution[0].count} reports)`
                }
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrendAnalysis;
import { useState, useEffect } from 'react';
import { analyticsAPI } from '../../services/api';

const StatisticsDashboard = ({ filters, onStatClick }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('current');

  useEffect(() => {
    fetchStatistics();
  }, [filters, selectedPeriod]);

  const fetchStatistics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = { ...filters };
      
      // Adjust date range based on selected period
      if (selectedPeriod === 'previous') {
        const startDate = new Date(filters.startDate);
        const endDate = new Date(filters.endDate);
        const duration = endDate.getTime() - startDate.getTime();
        
        params.startDate = new Date(startDate.getTime() - duration).toISOString().split('T')[0];
        params.endDate = startDate.toISOString().split('T')[0];
      }

      const response = await analyticsAPI.getSummary(params);
      
      if (response.data.success) {
        setStats(response.data.data);
      } else {
        setError('Failed to fetch statistics');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  };

  const calculatePercentageChange = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  const getChangeIcon = (change) => {
    if (change > 0) {
      return (
        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      );
    } else if (change < 0) {
      return (
        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
      </svg>
    );
  };

  const getChangeColor = (change) => {
    if (change > 0) return 'text-red-600';
    if (change < 0) return 'text-green-600';
    return 'text-gray-600';
  };

  const StatCard = ({ 
    title, 
    value, 
    previousValue, 
    icon, 
    color = 'blue', 
    onClick,
    subtitle,
    trend 
  }) => {
    const change = previousValue ? calculatePercentageChange(value, previousValue) : 0;
    
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-600 border-blue-200',
      green: 'bg-green-50 text-green-600 border-green-200',
      yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
      red: 'bg-red-50 text-red-600 border-red-200',
      purple: 'bg-purple-50 text-purple-600 border-purple-200',
      indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    };

    return (
      <div 
        className={`p-6 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${colorClasses[color]}`}
        onClick={() => onClick && onClick({ title, value, change })}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              {icon && <div className="text-2xl">{icon}</div>}
              <h3 className="text-sm font-medium text-gray-600">{title}</h3>
            </div>
            <div className="mt-2">
              <div className="text-3xl font-bold">{value?.toLocaleString() || 0}</div>
              {subtitle && <div className="text-sm text-gray-500 mt-1">{subtitle}</div>}
            </div>
          </div>
          
          {previousValue && (
            <div className="flex flex-col items-end">
              <div className="flex items-center space-x-1">
                {getChangeIcon(change)}
                <span className={`text-sm font-medium ${getChangeColor(change)}`}>
                  {Math.abs(change)}%
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">vs previous period</div>
            </div>
          )}
        </div>
        
        {trend && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Trend</span>
              <span className={trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600'}>
                {trend > 0 ? '↗' : trend < 0 ? '↘' : '→'} {Math.abs(trend)}%
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-gray-100 p-6 rounded-lg animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
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
            <h3 className="text-sm font-medium text-red-800">Error Loading Statistics</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={fetchStatistics}
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

  if (!stats) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg mb-2">📊</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No statistics available</h3>
        <p className="text-gray-500">Try adjusting your filters to see statistics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Key Statistics</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedPeriod('current')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              selectedPeriod === 'current'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Current Period
          </button>
          <button
            onClick={() => setSelectedPeriod('comparison')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              selectedPeriod === 'comparison'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Compare Periods
          </button>
        </div>
      </div>

      {/* Main Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Cases"
          value={stats.overview?.totalCases}
          icon="🏥"
          color="blue"
          onClick={onStatClick}
          subtitle="All reported cases"
        />
        
        <StatCard
          title="Emergency Cases"
          value={stats.overview?.emergencyCases}
          icon="🚨"
          color="red"
          onClick={onStatClick}
          subtitle="Critical & severe cases"
        />
        
        <StatCard
          title="Recent Cases"
          value={stats.overview?.recentCases}
          icon="📈"
          color="yellow"
          onClick={onStatClick}
          subtitle="Last 7 days"
        />
        
        <StatCard
          title="Mortality Rate"
          value={`${stats.overview?.mortalityRate || 0}%`}
          icon="💔"
          color="purple"
          onClick={onStatClick}
          subtitle="Case fatality rate"
        />
      </div>

      {/* Disease Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Diseases</h3>
          <div className="space-y-3">
            {stats.diseaseDistribution?.slice(0, 5).map((disease, index) => (
              <div key={disease._id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    index === 0 ? 'bg-red-500' : 
                    index === 1 ? 'bg-yellow-500' : 
                    index === 2 ? 'bg-blue-500' : 'bg-gray-400'
                  }`}></div>
                  <span className="text-sm font-medium text-gray-900">
                    {disease._id || 'Unknown'}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">{disease.count}</div>
                  <div className="text-xs text-gray-500">
                    {disease.severeCases} severe
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Age Group Distribution</h3>
          <div className="space-y-3">
            {stats.ageGroupDistribution?.map((ageGroup, index) => {
              const total = stats.ageGroupDistribution.reduce((sum, ag) => sum + ag.count, 0);
              const percentage = ((ageGroup.count / total) * 100).toFixed(1);
              
              return (
                <div key={ageGroup._id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                    <span className="text-sm font-medium text-gray-900">
                      {ageGroup._id} years
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">{ageGroup.count}</div>
                    <div className="text-xs text-gray-500">{percentage}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Water Source Analysis */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Water Source Risk Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.waterSourceDistribution?.slice(0, 6).map((source) => {
            const riskLevel = source.severeCases / source.count;
            const riskColor = riskLevel > 0.3 ? 'red' : riskLevel > 0.1 ? 'yellow' : 'green';
            
            return (
              <div key={source._id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900">
                    {source._id || 'Unknown Source'}
                  </h4>
                  <div className={`w-3 h-3 rounded-full ${
                    riskColor === 'red' ? 'bg-red-500' :
                    riskColor === 'yellow' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}></div>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{source.count}</div>
                <div className="text-xs text-gray-500">
                  {source.severeCases} severe cases ({(riskLevel * 100).toFixed(1)}% risk)
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StatisticsDashboard;
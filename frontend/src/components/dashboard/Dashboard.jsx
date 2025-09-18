import { useState, useEffect } from 'react';
import StatsCard from './StatsCard';
import RecentActivity from './RecentActivity';
import ComprehensiveMap from '../maps/ComprehensiveMap';
import api from '../../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    waterReports: null,
    healthCases: null,
    activeAlerts: null,
    healthCenters: null
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [error, setError] = useState(null);
  const [mapData, setMapData] = useState({
    waterBodies: [],
    outbreakAreas: [],
    facilities: [],
    ngos: []
  });

  useEffect(() => {
    fetchDashboardStats();
    
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(fetchDashboardStats, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { dashboardAPI } = await import('../../services/api');
      const response = await dashboardAPI.getStats();
      const data = response.data.data;
      
      setStats({
        waterReports: data.waterReports || 0,
        healthCases: data.healthCases || 0,
        activeAlerts: data.activeAlerts || 0,
        healthCenters: data.healthCenters || 0
      });
      
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError('Failed to load dashboard statistics');
      
      // Set fallback data if API fails
      setStats({
        waterReports: '--',
        healthCases: '--',
        activeAlerts: '--',
        healthCenters: '--'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchDashboardStats();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex items-center space-x-4">
          {error && (
            <span className="text-sm text-red-600">
              ⚠️ {error}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <div className="text-sm text-gray-500">
            Last updated: {lastUpdated.toLocaleString()}
          </div>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Water Reports"
          value={stats.waterReports}
          subtitle="Total reports submitted"
          color="blue"
          icon="💧"
          loading={loading}
        />
        
        <StatsCard
          title="Health Cases"
          value={stats.healthCases}
          subtitle="Cases reported"
          color="green"
          icon="🏥"
          loading={loading}
        />
        
        <StatsCard
          title="Active Alerts"
          value={stats.activeAlerts}
          subtitle="Requiring attention"
          color="red"
          icon="🚨"
          loading={loading}
        />
        
        <StatsCard
          title="Health Centers"
          value={stats.healthCenters}
          subtitle="Active centers"
          color="purple"
          icon="🏢"
          loading={loading}
        />
      </div>
      
      {/* Map and Recent Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Map Section - Takes up 2/3 of the space */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Surveillance Map
            </h2>
            <ComprehensiveMap
              height="600px"
              width="100%"
              data={mapData}
              showControls={true}
              showLayerControls={true}
              className="rounded-lg overflow-hidden"
            />
          </div>
        </div>
        
        {/* Recent Activity - Takes up 1/3 of the space */}
        <div className="xl:col-span-1">
          <RecentActivity />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
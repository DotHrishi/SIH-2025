import { useState, useEffect } from 'react';
import api from '../../services/api';

const RecentActivity = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRecentActivity();
  }, []);

  const fetchRecentActivity = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dashboard/recent-activity');
      setActivities(response.data.activities || []);
    } catch (err) {
      console.error('Error fetching recent activity:', err);
      setError('Failed to load recent activity');
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'water_report':
        return '💧';
      case 'patient_report':
        return '🏥';
      case 'alert':
        return '🚨';
      case 'directory_update':
        return '📋';
      default:
        return '📄';
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'water_report':
        return 'text-blue-600';
      case 'patient_report':
        return 'text-green-600';
      case 'alert':
        return 'text-red-600';
      case 'directory_update':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const activityDate = new Date(date);
    const diffInMinutes = Math.floor((now - activityDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return activityDate.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="text-center py-8">
          <p className="text-red-600 mb-2">{error}</p>
          <button
            onClick={fetchRecentActivity}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
        <button
          onClick={fetchRecentActivity}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Refresh
        </button>
      </div>
      
      {activities.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No recent activity to display</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {activities.map((activity, index) => (
            <div key={activity._id || index} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="text-2xl">{getActivityIcon(activity.type)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {activity.title}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {activity.description}
                </p>
                <div className="flex items-center mt-2 space-x-4">
                  <span className={`text-xs font-medium ${getActivityColor(activity.type)}`}>
                    {activity.type.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatTimeAgo(activity.createdAt)}
                  </span>
                  {activity.location && (
                    <span className="text-xs text-gray-500">
                      📍 {activity.location}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentActivity;
import { useState, useEffect } from 'react';
import { directoryAPI } from '../../services/api';
import { DIRECTORY_TABS, CENTER_STATUS } from '../../utils/constants';
import CenterCard from './CenterCard';

const DirectoryHub = () => {
  const [activeTab, setActiveTab] = useState('asha');
  const [centers, setCenters] = useState([]);
  const [filteredCenters, setFilteredCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [districts, setDistricts] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [statistics, setStatistics] = useState({});

  // Fetch centers and statistics
  useEffect(() => {
    fetchCenters();
    fetchStatistics();
  }, []);

  // Filter centers based on active tab, search, and filters
  useEffect(() => {
    let filtered = centers;

    // Filter by tab (center type)
    const currentTab = DIRECTORY_TABS.find(tab => tab.id === activeTab);
    if (currentTab) {
      filtered = filtered.filter(center => center.type === currentTab.type);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(center =>
        center.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        center.centerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        center.leadWorker?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        center.location?.district?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(center => center.status === statusFilter);
    }

    // Filter by district
    if (districtFilter !== 'all') {
      filtered = filtered.filter(center => center.location?.district === districtFilter);
    }

    setFilteredCenters(filtered);
  }, [centers, activeTab, searchTerm, statusFilter, districtFilter]);

  // Extract unique districts for filter dropdown
  useEffect(() => {
    const uniqueDistricts = [...new Set(centers.map(center => center.location?.district).filter(Boolean))];
    setDistricts(uniqueDistricts.sort());
  }, [centers]);

  const fetchCenters = async () => {
    try {
      setLoading(true);
      const response = await directoryAPI.getHealthCenters();
      const responseData = response.data;
      
      // Handle different response structures
      let centersData = [];
      if (responseData.success) {
        centersData = responseData.data?.centers || responseData.data || [];
      } else {
        centersData = Array.isArray(responseData) ? responseData : [];
      }
      
      setCenters(centersData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch health centers');
      console.error('Error fetching centers:', err);
      setCenters([]); // Ensure centers is always an array
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await directoryAPI.getDirectoryStatistics();
      const statsData = response.data?.data || response.data || {};
      setStatistics(statsData);
    } catch (err) {
      console.error('Error fetching statistics:', err);
      // Set default statistics on error
      setStatistics({
        totalCenters: 0,
        activeCenters: 0,
        totalPopulation: 0,
        totalDistricts: 0,
      });
    }
  };

  const handleEditCenter = (center) => {
    // TODO: Implement edit functionality
    console.log('Edit center:', center);
  };

  const handleUpdateContact = async (centerId, contactInfo) => {
    try {
      await directoryAPI.updateContactInfo(centerId, { leadWorker: contactInfo });
      await fetchCenters(); // Refresh the list
    } catch (err) {
      console.error('Error updating contact info:', err);
      throw err;
    }
  };

  const handleDeleteCenter = async (centerId) => {
    if (window.confirm('Are you sure you want to delete this center?')) {
      try {
        await directoryAPI.deleteHealthCenter(centerId);
        await fetchCenters(); // Refresh the list
      } catch (err) {
        console.error('Error deleting center:', err);
      }
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDistrictFilter('all');
  };

  const getTabStats = (tabType) => {
    if (!Array.isArray(centers)) return { total: 0, active: 0 };
    const tabCenters = centers.filter(center => center.type === tabType);
    return {
      total: tabCenters.length,
      active: tabCenters.filter(center => center.status === CENTER_STATUS.ACTIVE).length,
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Directory & Resource Management</h1>
          <p className="text-gray-600 mt-1">Manage health centers and NGO partners</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
        >
          <span>➕</span>
          <span>Add Center</span>
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-blue-600">{statistics.totalCenters || 0}</div>
          <div className="text-sm text-gray-600">Total Centers</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-green-600">{statistics.activeCenters || 0}</div>
          <div className="text-sm text-gray-600">Active Centers</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-purple-600">{statistics.totalPopulation?.toLocaleString() || 0}</div>
          <div className="text-sm text-gray-600">Population Served</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-orange-600">{statistics.totalDistricts || 0}</div>
          <div className="text-sm text-gray-600">Districts Covered</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {DIRECTORY_TABS.map((tab) => {
              const stats = getTabStats(tab.type);
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  <span className="ml-2 bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                    {stats.active}/{stats.total}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search centers, workers, or districts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400">🔍</span>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex space-x-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value={CENTER_STATUS.ACTIVE}>Active</option>
                <option value={CENTER_STATUS.INACTIVE}>Inactive</option>
                <option value={CENTER_STATUS.MAINTENANCE}>Maintenance</option>
              </select>

              <select
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Districts</option>
                {districts.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>

              {(searchTerm || statusFilter !== 'all' || districtFilter !== 'all') && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Results count */}
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredCenters.length} of {centers.filter(center => center.type === DIRECTORY_TABS.find(tab => tab.id === activeTab)?.type).length} centers
          </div>
        </div>

        {/* Centers Grid */}
        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="text-red-800">{error}</div>
              <button
                onClick={fetchCenters}
                className="mt-2 text-red-600 hover:text-red-800 font-medium"
              >
                Try Again
              </button>
            </div>
          )}

          {filteredCenters.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🏥</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No centers found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== 'all' || districtFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'No centers have been added yet'}
              </p>
              {(searchTerm || statusFilter !== 'all' || districtFilter !== 'all') && (
                <button
                  onClick={clearFilters}
                  className="text-purple-600 hover:text-purple-800 font-medium"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredCenters.map((center) => (
                <CenterCard
                  key={center._id}
                  center={center}
                  onEdit={handleEditCenter}
                  onUpdateContact={handleUpdateContact}
                  onDelete={handleDeleteCenter}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DirectoryHub;
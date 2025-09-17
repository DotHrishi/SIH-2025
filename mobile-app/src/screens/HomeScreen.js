import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SafeIcon from '../components/SafeIcon';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { dashboardAPI } from '../services/api';

const HomeScreen = ({ navigation }) => {
  const [location, setLocation] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [stats, setStats] = useState({
    reportsSubmitted: 0,
    reportsProcessed: 0,
    underReview: 0,
    highPriority: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    getCurrentLocation();
    fetchDashboardData();
  }, []);

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to show your location on the map.');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, activityResponse] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getRecentActivity(),
      ]);

      if (statsResponse.data.success) {
        setStats(statsResponse.data.data);
      }

      if (activityResponse.data.success) {
        setRecentActivity(activityResponse.data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set mock data for demo
      setStats({
        reportsSubmitted: 10,
        reportsProcessed: 8,
        underReview: 3,
        highPriority: 1,
      });
      setRecentActivity([
        {
          id: 1,
          type: 'patient',
          title: 'Patient Report - Cholera',
          location: 'Guj, Nagaon',
          time: '2 hours ago',
          icon: 'medical',
        },
        {
          id: 2,
          type: 'water',
          title: 'Water Quality Report - Test Spring Location',
          location: 'Test Spring Location, East Khasi Hills',
          time: '2 hours ago',
          icon: 'water',
        },
      ]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const handleQuickAction = () => {
    navigation.navigate('Reports', { screen: 'ReportType' });
  };

  const mockMarkers = [
    { id: 1, coordinate: { latitude: 25.4670, longitude: 91.3662 }, color: 'green' },
    { id: 2, coordinate: { latitude: 25.4680, longitude: 91.3672 }, color: 'blue' },
    { id: 3, coordinate: { latitude: 25.4690, longitude: 91.3682 }, color: 'green' },
    { id: 4, coordinate: { latitude: 25.4700, longitude: 91.3692 }, color: 'orange' },
    { id: 5, coordinate: { latitude: 25.4650, longitude: 91.3652 }, color: 'red' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.appIcon}>
              <Text style={styles.appIconText}>JD</Text>
            </View>
            <View>
              <Text style={styles.appName}>Jal Drishti</Text>
              <Text style={styles.appSubtitle}>Volunteer App</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerButton}>
              <SafeIcon name="notifications-outline" size={24} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <SafeIcon name="call-outline" size={24} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <SafeIcon name="person-outline" size={24} color="#333" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <SafeIcon name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search locations, reports, or alerts..."
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          {location ? (
            <MapView style={styles.map} region={location}>
              <Marker coordinate={location} title="Your Location" />
              {mockMarkers.map((marker) => (
                <Marker
                  key={marker.id}
                  coordinate={marker.coordinate}
                  pinColor={marker.color}
                />
              ))}
            </MapView>
          ) : (
            <View style={styles.mapPlaceholder}>
              <Text>Loading map...</Text>
            </View>
          )}
          <View style={styles.mapInfo}>
            <Text style={styles.mapTitle}>Mawsynram</Text>
            <Text style={styles.mapSubtitle}>Meghalaya 793113</Text>
            <TouchableOpacity>
              <Text style={styles.mapLink}>View larger map</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity style={styles.quickActionCard} onPress={handleQuickAction}>
            <View style={styles.quickActionIcon}>
              <SafeIcon name="add" size={24} color="white" />
            </View>
            <View style={styles.quickActionContent}>
              <Text style={styles.quickActionTitle}>Submit New Report</Text>
              <Text style={styles.quickActionSubtitle}>Submit water testing data and quality assessments</Text>
            </View>
            <SafeIcon name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Report Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Report Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.reportsSubmitted}</Text>
              <Text style={styles.statLabel}>Reports Submitted</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: '#4CAF50' }]}>{stats.reportsProcessed}</Text>
              <Text style={styles.statLabel}>Reports Processed</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: '#FF9800' }]}>{stats.underReview}</Text>
              <Text style={styles.statLabel}>Under Review</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: '#F44336' }]}>{stats.highPriority}</Text>
              <Text style={styles.statLabel}>High Priority</Text>
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {recentActivity.map((activity) => (
            <TouchableOpacity key={activity.id} style={styles.activityCard}>
              <View style={[
                styles.activityIcon,
                { backgroundColor: activity.type === 'patient' ? '#2196F3' : '#4CAF50' }
              ]}>
                <SafeIcon 
                  name={activity.type === 'patient' ? 'medical' : 'water'} 
                  size={20} 
                  color="white" 
                />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityLocation}>{activity.location} - {activity.time}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#FF9800',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  appIconText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  appSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  headerRight: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  mapContainer: {
    height: 300,
    margin: 16,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
  },
  mapInfo: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  mapSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  mapLink: {
    fontSize: 14,
    color: '#2196F3',
    marginTop: 4,
  },
  section: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  quickActionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  activityLocation: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});

export default HomeScreen;
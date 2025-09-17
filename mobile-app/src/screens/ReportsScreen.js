import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { waterReportsAPI, patientReportsAPI } from '../services/api';

const ReportsScreen = ({ navigation }) => {
  const [stats, setStats] = useState({
    reportsSubmitted: 10,
    reportsProcessed: 8,
    underReview: 3,
    highPriority: 1,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchReportsData();
  }, []);

  const fetchReportsData = async () => {
    try {
      // Fetch recent reports
      const [waterReports, patientReports] = await Promise.all([
        waterReportsAPI.getAll({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
        patientReportsAPI.getAll({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
      ]);

      const activities = [];
      
      // Process water reports
      if (waterReports.data.success && waterReports.data.data) {
        waterReports.data.data.forEach(report => {
          activities.push({
            id: `water-${report._id}`,
            type: 'water',
            title: `Water Quality Report - ${report.location?.waterSource || 'Unknown Source'}`,
            location: `${report.location?.address || 'Unknown Location'}`,
            time: getTimeAgo(report.createdAt),
            icon: 'water',
          });
        });
      }

      // Process patient reports
      if (patientReports.data.success && patientReports.data.data) {
        patientReports.data.data.forEach(report => {
          activities.push({
            id: `patient-${report._id}`,
            type: 'patient',
            title: `Patient Report - ${report.suspectedDisease || 'Health Issue'}`,
            location: `${report.location?.address || 'Unknown Location'}`,
            time: getTimeAgo(report.createdAt),
            icon: 'medical',
          });
        });
      }

      // Sort by time and take latest
      activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setRecentActivity(activities.slice(0, 10));

    } catch (error) {
      console.error('Error fetching reports data:', error);
      // Set mock data for demo
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
        {
          id: 3,
          type: 'water',
          title: 'Water Quality Report - Test Tap Location',
          location: 'Test Tap Location, East Khasi Hills',
          time: '2 hours ago',
          icon: 'water',
        },
        {
          id: 4,
          type: 'water',
          title: 'Water Quality Report - Test Well Location',
          location: 'Test Well Location, East Khasi Hills',
          time: '2 hours ago',
          icon: 'water',
        },
        {
          id: 5,
          type: 'water',
          title: 'Water Quality Report - Test Pond Location',
          location: 'Test Pond Location, East Khasi Hills',
          time: '2 hours ago',
          icon: 'water',
        },
        {
          id: 6,
          type: 'water',
          title: 'Water Quality Report - Test Lake Location',
          location: 'Test Lake Location, East Khasi Hills',
          time: '2 hours ago',
          icon: 'water',
        },
        {
          id: 7,
          type: 'patient',
          title: 'Patient Report - Cholera',
          location: 'Test Village, East Khasi Hills',
          time: '2 hours ago',
          icon: 'medical',
        },
      ]);
    }
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours === 1) return '1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReportsData();
    setRefreshing(false);
  };

  const handleSubmitReport = () => {
    navigation.navigate('ReportType');
  };

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
          <Text style={styles.headerTitle}>Submit and manage water quality reports</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity style={styles.quickActionCard} onPress={handleSubmitReport}>
            <View style={styles.quickActionIcon}>
              <Ionicons name="add" size={24} color="white" />
            </View>
            <View style={styles.quickActionContent}>
              <Text style={styles.quickActionTitle}>Submit New Report</Text>
              <Text style={styles.quickActionSubtitle}>Submit water testing data and quality assessments</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
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
                <Ionicons 
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
    backgroundColor: '#FF9800',
    padding: 16,
  },
  headerTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
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

export default ReportsScreen;
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const ReportTypeScreen = ({ navigation }) => {
  const handleWaterQualityReport = () => {
    navigation.navigate('WaterQualityForm');
  };

  const handlePatientReport = () => {
    navigation.navigate('PatientReportForm');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Water Quality Report Card */}
        <TouchableOpacity style={styles.reportCard} onPress={handleWaterQualityReport}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: '#2196F3' }]}>
              <Ionicons name="water" size={24} color="white" />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>Water Quality Report</Text>
              <Text style={styles.cardSubtitle}>Submit water testing data and quality assessments</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </View>
          
          <Text style={styles.cardDescription}>
            Report water quality testing results, contamination issues, or water source problems in your area.
          </Text>
          
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.featureText}>Location & water source details</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.featureText}>Sample collection information</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.featureText}>Testing parameters (pH, turbidity, etc.)</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Patient Report Card */}
        <TouchableOpacity style={styles.reportCard} onPress={handlePatientReport}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: '#F44336' }]}>
              <Ionicons name="medical" size={24} color="white" />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>Patient Report</Text>
              <Text style={styles.cardSubtitle}>Report waterborne disease cases and health issues</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </View>
          
          <Text style={styles.cardDescription}>
            Report suspected waterborne disease cases, symptoms, and health emergencies related to contaminated water.
          </Text>
          
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.featureText}>Patient information & symptoms</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.featureText}>Disease identification & water source</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.featureText}>Emergency health alert system</Text>
            </View>
          </View>
        </TouchableOpacity>
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
    padding: 16,
  },
  reportCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  featureList: {
    marginTop: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
});

export default ReportTypeScreen;
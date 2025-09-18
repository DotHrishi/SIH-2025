import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  Image,
  Modal,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import LeafletMap from './src/components/LeafletMap';
import { waterReportsAPI, patientReportsAPI, dashboardAPI, queriesAPI, filesAPI } from './src/services/api';

const SimpleApp = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportType, setReportType] = useState('');
  const [location, setLocation] = useState(null);
  const [waterQualityForm, setWaterQualityForm] = useState({
    location: {
      address: '',
      district: '',
      waterSource: '',
      coordinates: [],
    },
    testingParameters: {
      pH: '',
      turbidity: '',
      temperature: '',
      tds: '', // Total Dissolved Solids
    },
    visualInspection: {
      color: '',
      odor: '',
    },
    collectorName: '',
    collectorContact: '',
    microscopeImages: [], // Tagged as microscope images
  });
  const [patientForm, setPatientForm] = useState({
    patientInfo: {
      name: '',
      age: '',
      gender: '',
      contactNumber: '',
    },
    location: {
      address: '',
      district: '',
      coordinates: [],
    },
    healthInfo: {
      symptoms: [],
      suspectedDisease: '',
      severity: 'mild',
      onsetDate: '',
    },
    waterExposure: {
      waterSource: '',
      exposureDate: '',
      otherExposed: '',
    },
    additionalNotes: '',
  });
  const [queryForm, setQueryForm] = useState({
    name: '',
    email: '',
    query: '',
  });

  const symptoms = [
    'Diarrhea', 'Vomiting', 'Nausea', 'Abdominal Pain', 'Fever',
    'Dehydration', 'Headache', 'Fatigue', 'Loss of Appetite'
  ];

  const diseases = [
    'Cholera', 'Typhoid', 'Hepatitis A', 'Dysentery', 'Gastroenteritis'
  ];

  useEffect(() => {
    getCurrentLocation();
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load dashboard statistics
      const statsResponse = await dashboardAPI.getStats();
      if (statsResponse.data.success) {
        console.log('Dashboard stats loaded:', statsResponse.data.data);
      }

      // Load recent activity
      const activityResponse = await dashboardAPI.getRecentActivity();
      if (activityResponse.data.success) {
        console.log('Recent activity loaded:', activityResponse.data.data);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Continue with mock data if backend is not available
    }
  };

  const handleQuerySubmit = async () => {
    if (!queryForm.name.trim() || !queryForm.query.trim()) {
      Alert.alert('Validation Error', 'Please enter your name and query');
      return;
    }

    try {
      const queryData = {
        query: queryForm.query,
        contactInfo: {
          name: queryForm.name,
          email: queryForm.email,
        },
        type: 'general',
        status: 'pending',
        submittedVia: 'mobile_app',
      };

      const response = await queriesAPI.create(queryData);
      
      if (response.data.success) {
        Alert.alert(
          'Success',
          'Your query has been submitted successfully! Our experts will respond soon and it will appear on the admin dashboard.',
          [
            {
              text: 'OK',
              onPress: () => {
                setQueryForm({ name: '', email: '', query: '' });
              },
            },
          ]
        );
      } else {
        throw new Error(response.data.message || 'Failed to submit query');
      }
    } catch (error) {
      console.error('Query submit error:', error);
      Alert.alert('Error', 'Failed to submit query. Please check your internet connection and try again.');
    }
  };

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required.');
        return;
      }

      let locationResult = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: locationResult.coords.latitude,
        longitude: locationResult.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
      
      setLocation(coords);

      // Update forms with location
      const coordsArray = [locationResult.coords.longitude, locationResult.coords.latitude];
      setWaterQualityForm(prev => ({
        ...prev,
        location: { ...prev.location, coordinates: coordsArray }
      }));
      setPatientForm(prev => ({
        ...prev,
        location: { ...prev.location, coordinates: coordsArray }
      }));

      // Reverse geocoding
      try {
        let reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: locationResult.coords.latitude,
          longitude: locationResult.coords.longitude,
        });
        
        if (reverseGeocode.length > 0) {
          const address = reverseGeocode[0];
          const fullAddress = `${address.street || ''} ${address.city || ''} ${address.region || ''}`.trim();
          const district = address.subregion || address.city || '';
          
          setWaterQualityForm(prev => ({
            ...prev,
            location: { ...prev.location, address: fullAddress, district }
          }));
          setPatientForm(prev => ({
            ...prev,
            location: { ...prev.location, address: fullAddress, district }
          }));
        }
      } catch (error) {
        console.error('Reverse geocoding error:', error);
      }
    } catch (error) {
      console.error('Location error:', error);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Camera roll permission is required.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setWaterQualityForm(prev => ({
          ...prev,
          microscopeImages: [...prev.microscopeImages, result.assets[0]],
        }));
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Could not pick image');
    }
  };

  const removeImage = (index) => {
    setWaterQualityForm(prev => ({
      ...prev,
      microscopeImages: prev.microscopeImages.filter((_, i) => i !== index),
    }));
  };

  const toggleSymptom = (symptom) => {
    setPatientForm(prev => ({
      ...prev,
      healthInfo: {
        ...prev.healthInfo,
        symptoms: prev.healthInfo.symptoms.includes(symptom)
          ? prev.healthInfo.symptoms.filter(s => s !== symptom)
          : [...prev.healthInfo.symptoms, symptom]
      }
    }));
  };

  const handleWaterQualitySubmit = async () => {
    // Validate required fields
    if (!waterQualityForm.collectorName ||
        !waterQualityForm.collectorContact ||
        !waterQualityForm.testingParameters.pH ||
        !waterQualityForm.testingParameters.turbidity ||
        !waterQualityForm.testingParameters.temperature ||
        !waterQualityForm.testingParameters.tds ||
        !waterQualityForm.visualInspection.color ||
        !waterQualityForm.visualInspection.odor) {
      Alert.alert('Validation Error', 'Please fill in all required fields:\n• Collector Name\n• Contact Number\n• pH\n• Turbidity\n• Temperature\n• TDS\n• Color\n• Odor');
      return;
    }

    try {
      // Upload microscope images first if any
      const imageUrls = [];
      for (const image of waterQualityForm.microscopeImages) {
        try {
          const formData = new FormData();
          formData.append('file', {
            uri: image.uri,
            type: 'image/jpeg',
            name: 'microscope-image.jpg',
          });

          const uploadResponse = await filesAPI.upload(formData);
          if (uploadResponse.data.success) {
            imageUrls.push(uploadResponse.data.data.url);
          }
        } catch (uploadError) {
          console.error('Microscope image upload error:', uploadError);
        }
      }

      // Generate unique sample ID
      const sampleId = `SAMPLE_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      // Prepare report data for backend (simplified format)
      const reportData = {
        submittedBy: waterQualityForm.collectorName,
        location: {
          coordinates: (waterQualityForm.location.coordinates && waterQualityForm.location.coordinates.length === 2) 
            ? waterQualityForm.location.coordinates 
            : [73.8567, 18.5204], // Default to Pune coordinates if location not available
          address: waterQualityForm.location.address || 'Mobile App Location',
          district: waterQualityForm.location.district || 'Unknown District',
          waterSource: 'other', // Default water source
        },
        testingParameters: {
          pH: parseFloat(waterQualityForm.testingParameters.pH),
          turbidity: parseFloat(waterQualityForm.testingParameters.turbidity),
          temperature: parseFloat(waterQualityForm.testingParameters.temperature),
          dissolvedOxygen: 8.0, // Default value for backend compatibility
          totalDissolvedSolids: parseFloat(waterQualityForm.testingParameters.tds),
        },
        sampleCollection: {
          collectionDate: new Date(Date.now() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0],
          collectionTime: new Date().toLocaleTimeString('en-GB', { hour12: false }).substring(0, 5),
          collectorName: waterQualityForm.collectorName,
          sampleId: sampleId,
        },
        notes: `Color: ${waterQualityForm.visualInspection.color}, Odor: ${waterQualityForm.visualInspection.odor}, Contact: ${waterQualityForm.collectorContact}`,
        status: 'pending',
      };

      console.log('Submitting water quality report:', reportData);
      const response = await waterReportsAPI.create(reportData);
      
      if (response.data.success) {
        Alert.alert('Success', 'Water quality report submitted successfully! It will appear on the dashboard.');
        setShowReportForm(false);
        // Reset form
        setWaterQualityForm({
          location: { address: '', district: '', waterSource: '', coordinates: [] },
          testingParameters: { pH: '', turbidity: '', temperature: '', tds: '' },
          visualInspection: { color: '', odor: '' },
          collectorName: '',
          collectorContact: '',
          microscopeImages: [],
        });
      } else {
        throw new Error(response.data.message || 'Failed to submit report');
      }
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('Error', 'Failed to submit report. Please check your internet connection and try again.');
    }
  };

  const handlePatientSubmit = async () => {
    if (!patientForm.patientInfo.name || !patientForm.patientInfo.age || !patientForm.location.address || patientForm.healthInfo.symptoms.length === 0) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    try {
      // Prepare patient report data for backend
      const reportData = {
        patientInfo: {
          name: patientForm.patientInfo.name,
          age: parseInt(patientForm.patientInfo.age),
          gender: patientForm.patientInfo.gender,
          contactNumber: patientForm.patientInfo.contactNumber,
        },
        location: {
          coordinates: (patientForm.location.coordinates && patientForm.location.coordinates.length === 2) 
            ? patientForm.location.coordinates 
            : [73.8567, 18.5204], // Default to Pune coordinates if location not available
          address: patientForm.location.address,
          district: patientForm.location.district,
        },
        healthInfo: {
          symptoms: patientForm.healthInfo.symptoms,
          suspectedDisease: patientForm.healthInfo.suspectedDisease,
          severity: patientForm.healthInfo.severity,
          onsetDate: patientForm.healthInfo.onsetDate,
        },
        waterExposure: {
          waterSource: patientForm.waterExposure.waterSource.toLowerCase(),
          exposureDate: patientForm.waterExposure.exposureDate,
          otherExposed: parseInt(patientForm.waterExposure.otherExposed) || 0,
        },
        additionalNotes: patientForm.additionalNotes,
        reportType: 'patient',
        status: 'pending',
        submittedVia: 'mobile_app',
        reportDate: new Date().toISOString(),
      };

      console.log('Submitting patient report:', reportData);
      const response = await patientReportsAPI.create(reportData);
      
      if (response.data.success) {
        Alert.alert('Success', 'Patient report submitted successfully! It will appear on the dashboard and may trigger health alerts.');
        setShowReportForm(false);
        // Reset form
        setPatientForm({
          patientInfo: { name: '', age: '', gender: '', contactNumber: '' },
          location: { address: '', district: '', coordinates: [] },
          healthInfo: { symptoms: [], suspectedDisease: '', severity: 'mild', onsetDate: '' },
          waterExposure: { waterSource: '', exposureDate: '', otherExposed: '' },
          additionalNotes: '',
        });
      } else {
        throw new Error(response.data.message || 'Failed to submit report');
      }
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('Error', 'Failed to submit report. Please check your internet connection and try again.');
    }
  };

  const TabButton = ({ title, tabKey, emoji }) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tabKey && styles.activeTab]}
      onPress={() => setActiveTab(tabKey)}
    >
      <Text style={styles.tabEmoji}>{emoji}</Text>
      <Text style={[styles.tabText, activeTab === tabKey && styles.activeTabText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderHome = () => (
    <ScrollView style={styles.content}>
      <View style={styles.header}>
        <View style={styles.appIcon}>
          <Text style={styles.appIconText}>JD</Text>
        </View>
        <View>
          <Text style={styles.appName}>Jal Drishti</Text>
          <Text style={styles.appSubtitle}>Volunteer App</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search locations, reports, or alerts..."
        />
      </View>

      <View style={styles.mapContainer}>
        {location ? (
          <LeafletMap
            latitude={location.latitude}
            longitude={location.longitude}
            style={styles.map}
          />
        ) : (
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapPlaceholderText}>📍 Loading Map...</Text>
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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity 
          style={styles.quickActionCard}
          onPress={() => { setActiveTab('reports'); setShowReportForm(false); }}
        >
          <View style={styles.quickActionIcon}>
            <Text style={styles.iconText}>➕</Text>
          </View>
          <View style={styles.quickActionContent}>
            <Text style={styles.quickActionTitle}>Submit New Report</Text>
            <Text style={styles.quickActionSubtitle}>Submit water testing data and quality assessments</Text>
          </View>
          <Text style={styles.chevron}>▶️</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Report Overview</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>10</Text>
            <Text style={styles.statLabel}>Reports Submitted</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#4CAF50' }]}>8</Text>
            <Text style={styles.statLabel}>Reports Processed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#FF9800' }]}>3</Text>
            <Text style={styles.statLabel}>Under Review</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#F44336' }]}>1</Text>
            <Text style={styles.statLabel}>High Priority</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityCard}>
          <View style={[styles.activityIcon, { backgroundColor: '#2196F3' }]}>
            <Text style={styles.iconText}>🏥</Text>
          </View>
          <View style={styles.activityContent}>
            <Text style={styles.activityTitle}>Patient Report - Cholera</Text>
            <Text style={styles.activityLocation}>Guj, Nagaon - 2 hours ago</Text>
          </View>
        </View>
        <View style={styles.activityCard}>
          <View style={[styles.activityIcon, { backgroundColor: '#4CAF50' }]}>
            <Text style={styles.iconText}>💧</Text>
          </View>
          <View style={styles.activityContent}>
            <Text style={styles.activityTitle}>Water Quality Report - Test Spring</Text>
            <Text style={styles.activityLocation}>East Khasi Hills - 2 hours ago</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderReports = () => {
    if (showReportForm) {
      if (reportType === 'water') {
        return renderWaterQualityForm();
      } else if (reportType === 'patient') {
        return renderPatientForm();
      }
    }

    return (
      <ScrollView style={styles.content}>
        <View style={styles.headerOrange}>
          <Text style={styles.headerTitle}>Submit and manage water quality reports</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Report Types</Text>
          
          <TouchableOpacity 
            style={styles.reportCard}
            onPress={() => { setReportType('water'); setShowReportForm(true); }}
          >
            <View style={[styles.cardIcon, { backgroundColor: '#2196F3' }]}>
              <Text style={styles.iconText}>💧</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Water Quality Report</Text>
              <Text style={styles.cardSubtitle}>Submit water testing data and quality assessments</Text>
            </View>
            <Text style={styles.chevron}>▶️</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.reportCard}
            onPress={() => { setReportType('patient'); setShowReportForm(true); }}
          >
            <View style={[styles.cardIcon, { backgroundColor: '#F44336' }]}>
              <Text style={styles.iconText}>🏥</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Patient Report</Text>
              <Text style={styles.cardSubtitle}>Report waterborne disease cases and health issues</Text>
            </View>
            <Text style={styles.chevron}>▶️</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Report Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>10</Text>
              <Text style={styles.statLabel}>Reports Submitted</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: '#4CAF50' }]}>8</Text>
              <Text style={styles.statLabel}>Reports Processed</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: '#FF9800' }]}>3</Text>
              <Text style={styles.statLabel}>Under Review</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: '#F44336' }]}>1</Text>
              <Text style={styles.statLabel}>High Priority</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderWaterQualityForm = () => (
    <ScrollView style={styles.content}>
      <View style={styles.formHeader}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => setShowReportForm(false)}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.formTitle}>Water Quality Report</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Collector Information</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Collector Name *</Text>
          <TextInput
            style={styles.input}
            value={waterQualityForm.collectorName}
            onChangeText={(value) => setWaterQualityForm(prev => ({ ...prev, collectorName: value }))}
            placeholder="Enter your name"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Contact Number *</Text>
          <TextInput
            style={styles.input}
            value={waterQualityForm.collectorContact}
            onChangeText={(value) => setWaterQualityForm(prev => ({ ...prev, collectorContact: value }))}
            placeholder="Enter contact number"
            keyboardType="phone-pad"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Testing Parameters</Text>
        
        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>pH Level *</Text>
            <TextInput
              style={styles.input}
              value={waterQualityForm.testingParameters.pH}
              onChangeText={(value) => setWaterQualityForm(prev => ({
                ...prev,
                testingParameters: { ...prev.testingParameters, pH: value }
              }))}
              placeholder="0-14"
              keyboardType="numeric"
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Turbidity (NTU) *</Text>
            <TextInput
              style={styles.input}
              value={waterQualityForm.testingParameters.turbidity}
              onChangeText={(value) => setWaterQualityForm(prev => ({
                ...prev,
                testingParameters: { ...prev.testingParameters, turbidity: value }
              }))}
              placeholder="0-1000"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Temperature (°C) *</Text>
            <TextInput
              style={styles.input}
              value={waterQualityForm.testingParameters.temperature}
              onChangeText={(value) => setWaterQualityForm(prev => ({
                ...prev,
                testingParameters: { ...prev.testingParameters, temperature: value }
              }))}
              placeholder="0-100"
              keyboardType="numeric"
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>TDS (mg/L) *</Text>
            <TextInput
              style={styles.input}
              value={waterQualityForm.testingParameters.tds}
              onChangeText={(value) => setWaterQualityForm(prev => ({
                ...prev,
                testingParameters: { ...prev.testingParameters, tds: value }
              }))}
              placeholder="0-2000"
              keyboardType="numeric"
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Visual Inspection</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Color *</Text>
          <TextInput
            style={styles.input}
            value={waterQualityForm.visualInspection.color}
            onChangeText={(value) => setWaterQualityForm(prev => ({
              ...prev,
              visualInspection: { ...prev.visualInspection, color: value }
            }))}
            placeholder="e.g., Clear, Cloudy, Brown, Yellow"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Odor *</Text>
          <TextInput
            style={styles.input}
            value={waterQualityForm.visualInspection.odor}
            onChangeText={(value) => setWaterQualityForm(prev => ({
              ...prev,
              visualInspection: { ...prev.visualInspection, odor: value }
            }))}
            placeholder="e.g., None, Chlorine, Fishy, Rotten"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Microscope Images</Text>
        
        <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
          <Text style={styles.imagePickerIcon}>🔬</Text>
          <Text style={styles.imagePickerText}>Add Microscope Image</Text>
        </TouchableOpacity>

        {waterQualityForm.microscopeImages.length > 0 && (
          <View style={styles.imageGrid}>
            {waterQualityForm.microscopeImages.map((image, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri: image.uri }} style={styles.image} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                >
                  <Text style={styles.removeImageText}>❌</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.submitButton} onPress={handleWaterQualitySubmit}>
          <Text style={styles.submitButtonText}>Submit Water Quality Report</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderPatientForm = () => (
    <ScrollView style={styles.content}>
      <View style={styles.formHeader}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => setShowReportForm(false)}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.formTitle}>Patient Report</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Patient Information</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Patient Name *</Text>
          <TextInput
            style={styles.input}
            value={patientForm.patientInfo.name}
            onChangeText={(value) => setPatientForm(prev => ({
              ...prev,
              patientInfo: { ...prev.patientInfo, name: value }
            }))}
            placeholder="Enter patient name"
          />
        </View>

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Age *</Text>
            <TextInput
              style={styles.input}
              value={patientForm.patientInfo.age}
              onChangeText={(value) => setPatientForm(prev => ({
                ...prev,
                patientInfo: { ...prev.patientInfo, age: value }
              }))}
              placeholder="Age"
              keyboardType="numeric"
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderContainer}>
              {['Male', 'Female', 'Other'].map((gender) => (
                <TouchableOpacity
                  key={gender}
                  style={[
                    styles.genderButton,
                    patientForm.patientInfo.gender === gender.toLowerCase() && styles.genderButtonSelected
                  ]}
                  onPress={() => setPatientForm(prev => ({
                    ...prev,
                    patientInfo: { ...prev.patientInfo, gender: gender.toLowerCase() }
                  }))}
                >
                  <Text style={[
                    styles.genderButtonText,
                    patientForm.patientInfo.gender === gender.toLowerCase() && styles.genderButtonTextSelected
                  ]}>
                    {gender}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Contact Number</Text>
          <TextInput
            style={styles.input}
            value={patientForm.patientInfo.contactNumber}
            onChangeText={(value) => setPatientForm(prev => ({
              ...prev,
              patientInfo: { ...prev.patientInfo, contactNumber: value }
            }))}
            placeholder="Patient contact number"
            keyboardType="phone-pad"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location Information</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Address *</Text>
          <TextInput
            style={styles.input}
            value={patientForm.location.address}
            onChangeText={(value) => setPatientForm(prev => ({
              ...prev,
              location: { ...prev.location, address: value }
            }))}
            placeholder="Enter location address"
            multiline
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>District</Text>
          <TextInput
            style={styles.input}
            value={patientForm.location.district}
            onChangeText={(value) => setPatientForm(prev => ({
              ...prev,
              location: { ...prev.location, district: value }
            }))}
            placeholder="Enter district"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Health Information</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Symptoms *</Text>
          <View style={styles.symptomsGrid}>
            {symptoms.map((symptom) => (
              <TouchableOpacity
                key={symptom}
                style={[
                  styles.symptomChip,
                  patientForm.healthInfo.symptoms.includes(symptom) && styles.symptomChipSelected
                ]}
                onPress={() => toggleSymptom(symptom)}
              >
                <Text style={[
                  styles.symptomChipText,
                  patientForm.healthInfo.symptoms.includes(symptom) && styles.symptomChipTextSelected
                ]}>
                  {symptom}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Suspected Disease</Text>
          <View style={styles.diseaseContainer}>
            {diseases.map((disease) => (
              <TouchableOpacity
                key={disease}
                style={[
                  styles.diseaseButton,
                  patientForm.healthInfo.suspectedDisease === disease && styles.diseaseButtonSelected
                ]}
                onPress={() => setPatientForm(prev => ({
                  ...prev,
                  healthInfo: { ...prev.healthInfo, suspectedDisease: disease }
                }))}
              >
                <Text style={[
                  styles.diseaseButtonText,
                  patientForm.healthInfo.suspectedDisease === disease && styles.diseaseButtonTextSelected
                ]}>
                  {disease}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Onset Date</Text>
            <TextInput
              style={styles.input}
              value={patientForm.healthInfo.onsetDate}
              onChangeText={(value) => setPatientForm(prev => ({
                ...prev,
                healthInfo: { ...prev.healthInfo, onsetDate: value }
              }))}
              placeholder="YYYY-MM-DD"
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Severity</Text>
            <View style={styles.severityContainer}>
              {['Mild', 'Moderate', 'Severe'].map((severity) => (
                <TouchableOpacity
                  key={severity}
                  style={[
                    styles.severityButton,
                    patientForm.healthInfo.severity === severity.toLowerCase() && styles.severityButtonSelected
                  ]}
                  onPress={() => setPatientForm(prev => ({
                    ...prev,
                    healthInfo: { ...prev.healthInfo, severity: severity.toLowerCase() }
                  }))}
                >
                  <Text style={[
                    styles.severityButtonText,
                    patientForm.healthInfo.severity === severity.toLowerCase() && styles.severityButtonTextSelected
                  ]}>
                    {severity}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Water Exposure Information</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Water Source</Text>
          <TextInput
            style={styles.input}
            value={patientForm.waterExposure.waterSource}
            onChangeText={(value) => setPatientForm(prev => ({
              ...prev,
              waterExposure: { ...prev.waterExposure, waterSource: value }
            }))}
            placeholder="e.g., River, Well, Tap, Pond"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Exposure Date</Text>
          <TextInput
            style={styles.input}
            value={patientForm.waterExposure.exposureDate}
            onChangeText={(value) => setPatientForm(prev => ({
              ...prev,
              waterExposure: { ...prev.waterExposure, exposureDate: value }
            }))}
            placeholder="When was the water consumed/contacted?"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Other People Exposed</Text>
          <TextInput
            style={styles.input}
            value={patientForm.waterExposure.otherExposed}
            onChangeText={(value) => setPatientForm(prev => ({
              ...prev,
              waterExposure: { ...prev.waterExposure, otherExposed: value }
            }))}
            placeholder="Number of other people who may be affected"
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Additional Notes</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={patientForm.additionalNotes}
          onChangeText={(value) => setPatientForm(prev => ({ ...prev, additionalNotes: value }))}
          placeholder="Any additional information about the case..."
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={[styles.submitButton, { backgroundColor: '#F44336' }]} onPress={handlePatientSubmit}>
          <Text style={styles.submitButtonText}>Submit Patient Report</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderEducation = () => (
    <ScrollView style={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎓 Education Modules</Text>
        
        <View style={styles.moduleCard}>
          <View style={styles.thumbnail}>
            <Text style={styles.playButton}>▶️</Text>
          </View>
          <View style={styles.moduleInfo}>
            <Text style={styles.moduleTitle}>Water Quality Testing at Home</Text>
            <Text style={styles.moduleDescription}>
              Learn simple methods to test water quality at home using basic tools and visual inspection techniques.
            </Text>
            <Text style={styles.duration}>Duration: 8:45</Text>
          </View>
        </View>

        <View style={styles.moduleCard}>
          <View style={styles.thumbnail}>
            <Text style={styles.playButton}>▶️</Text>
          </View>
          <View style={styles.moduleInfo}>
            <Text style={styles.moduleTitle}>Identifying Waterborne Diseases</Text>
            <Text style={styles.moduleDescription}>
              Understanding symptoms and early detection of common waterborne diseases.
            </Text>
            <Text style={styles.duration}>Duration: 12:30</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderQuery = () => (
    <ScrollView style={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💬 Query & Support</Text>
        
        <TouchableOpacity style={styles.faqButton}>
          <View style={styles.faqContent}>
            <Text style={styles.faqTitle}>Frequently Asked Questions</Text>
            <Text style={styles.faqDescription}>
              Find answers to common questions about water quality and health concerns.
            </Text>
          </View>
          <Text style={styles.chevron}>▶️</Text>
        </TouchableOpacity>

        <View style={styles.querySection}>
          <Text style={styles.sectionTitle}>Submit Your Query</Text>
          <TextInput
            style={styles.input}
            placeholder="Your Name"
            value={queryForm.name}
            onChangeText={(value) => setQueryForm(prev => ({ ...prev, name: value }))}
          />
          <TextInput
            style={styles.input}
            placeholder="Your Email (optional)"
            value={queryForm.email}
            onChangeText={(value) => setQueryForm(prev => ({ ...prev, email: value }))}
            keyboardType="email-address"
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Have a question about water quality or health concerns? Ask our experts..."
            multiline
            numberOfLines={6}
            value={queryForm.query}
            onChangeText={(value) => setQueryForm(prev => ({ ...prev, query: value }))}
          />
          <TouchableOpacity style={styles.submitButton} onPress={handleQuerySubmit}>
            <Text style={styles.submitButtonText}>Submit Query</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {activeTab === 'home' && renderHome()}
      {activeTab === 'reports' && renderReports()}
      {activeTab === 'education' && renderEducation()}
      {activeTab === 'query' && renderQuery()}
      
      <View style={styles.tabBar}>
        <TabButton title="Home" tabKey="home" emoji="🏠" />
        <TabButton title="Reports" tabKey="reports" emoji="📄" />
        <TabButton title="Education" tabKey="education" emoji="🎓" />
        <TabButton title="Query" tabKey="query" emoji="💬" />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    marginBottom: 80,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
  },
  headerOrange: {
    backgroundColor: '#FF9800',
    padding: 16,
  },
  headerTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
    fontSize: 16,
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
  mapPlaceholderText: {
    fontSize: 16,
    color: '#666',
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
  iconText: {
    fontSize: 20,
    color: 'white',
  },
  chevron: {
    fontSize: 16,
    color: '#666',
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
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  moduleCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
    overflow: 'hidden',
  },
  thumbnail: {
    height: 120,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    fontSize: 32,
  },
  moduleInfo: {
    padding: 16,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  moduleDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  duration: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  faqButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    elevation: 2,
  },
  faqContent: {
    flex: 1,
  },
  faqTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  faqDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  querySection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingBottom: 5,
    paddingTop: 5,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeTab: {
    borderTopWidth: 2,
    borderTopColor: '#2196F3',
  },
  tabEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  tabText: {
    fontSize: 12,
    color: '#666',
  },
  activeTabText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  // Form styles
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
    marginBottom: 16,
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#2196F3',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  imagePickerIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  imagePickerText: {
    fontSize: 16,
    color: '#2196F3',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  imageContainer: {
    position: 'relative',
    width: '48%',
    marginBottom: 8,
  },
  image: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    fontSize: 16,
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderButton: {
    flex: 1,
    padding: 8,
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    alignItems: 'center',
  },
  genderButtonSelected: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  genderButtonText: {
    fontSize: 14,
    color: '#666',
  },
  genderButtonTextSelected: {
    color: 'white',
  },
  symptomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  symptomChip: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    margin: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  symptomChipSelected: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  symptomChipText: {
    fontSize: 14,
    color: '#333',
  },
  symptomChipTextSelected: {
    color: 'white',
  },
  diseaseContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  diseaseButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    margin: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  diseaseButtonSelected: {
    backgroundColor: '#F44336',
    borderColor: '#F44336',
  },
  diseaseButtonText: {
    fontSize: 14,
    color: '#333',
  },
  diseaseButtonTextSelected: {
    color: 'white',
  },
  severityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  severityButton: {
    flex: 1,
    padding: 8,
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    alignItems: 'center',
  },
  severityButtonSelected: {
    backgroundColor: '#FF9800',
    borderColor: '#FF9800',
  },
  severityButtonText: {
    fontSize: 12,
    color: '#666',
  },
  severityButtonTextSelected: {
    color: 'white',
  },
});

export default SimpleApp;
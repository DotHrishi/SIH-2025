import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Picker,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { patientReportsAPI } from '../services/api';

const PatientReportFormScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    patientInfo: {
      name: '',
      age: '',
      gender: '',
      contactNumber: '',
      guardianName: '',
      guardianContact: '',
    },
    location: {
      coordinates: [],
      address: '',
      district: '',
      waterSource: '',
    },
    healthInfo: {
      symptoms: [],
      suspectedDisease: '',
      onsetDate: '',
      severity: 'mild',
      previousTreatment: '',
    },
    waterExposure: {
      waterSource: '',
      exposureDate: '',
      consumptionMethod: '',
      otherExposed: '',
    },
    additionalNotes: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);

  const symptoms = [
    'Diarrhea', 'Vomiting', 'Nausea', 'Abdominal Pain', 'Fever',
    'Dehydration', 'Headache', 'Fatigue', 'Loss of Appetite',
    'Muscle Cramps', 'Bloody Stool', 'Watery Stool'
  ];

  const diseases = [
    'Cholera', 'Typhoid', 'Hepatitis A', 'Hepatitis E', 'Dysentery',
    'Gastroenteritis', 'Diarrheal Disease', 'Other Waterborne Disease'
  ];

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required.');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const coords = [location.coords.longitude, location.coords.latitude];
      
      setCurrentLocation(location.coords);
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          coordinates: coords,
        }
      }));

      // Reverse geocoding
      try {
        let reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        
        if (reverseGeocode.length > 0) {
          const address = reverseGeocode[0];
          setFormData(prev => ({
            ...prev,
            location: {
              ...prev.location,
              address: `${address.street || ''} ${address.city || ''} ${address.region || ''}`.trim(),
              district: address.subregion || address.city || '',
            }
          }));
        }
      } catch (error) {
        console.error('Reverse geocoding error:', error);
      }
    } catch (error) {
      console.error('Location error:', error);
    }
  };

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      }
    }));
  };

  const handleDirectInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const toggleSymptom = (symptom) => {
    setFormData(prev => ({
      ...prev,
      healthInfo: {
        ...prev.healthInfo,
        symptoms: prev.healthInfo.symptoms.includes(symptom)
          ? prev.healthInfo.symptoms.filter(s => s !== symptom)
          : [...prev.healthInfo.symptoms, symptom]
      }
    }));
  };

  const validateForm = () => {
    if (!formData.patientInfo.name.trim()) {
      Alert.alert('Validation Error', 'Please enter patient name');
      return false;
    }
    if (!formData.patientInfo.age.trim()) {
      Alert.alert('Validation Error', 'Please enter patient age');
      return false;
    }
    if (!formData.location.address.trim()) {
      Alert.alert('Validation Error', 'Please enter location address');
      return false;
    }
    if (formData.healthInfo.symptoms.length === 0) {
      Alert.alert('Validation Error', 'Please select at least one symptom');
      return false;
    }
    return true;
  };

  const submitReport = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const reportData = {
        ...formData,
        reportType: 'patient',
        status: 'pending',
      };

      const response = await patientReportsAPI.create(reportData);
      
      if (response.data.success) {
        Alert.alert(
          'Success',
          'Patient report submitted successfully!',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        throw new Error(response.data.message || 'Failed to submit report');
      }
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Patient Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Patient Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.patientInfo.name}
              onChangeText={(value) => handleInputChange('patientInfo', 'name', value)}
              placeholder="Enter patient name"
            />
          </View>

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Age *</Text>
              <TextInput
                style={styles.input}
                value={formData.patientInfo.age}
                onChangeText={(value) => handleInputChange('patientInfo', 'age', value)}
                placeholder="Age"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.patientInfo.gender}
                  onValueChange={(value) => handleInputChange('patientInfo', 'gender', value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Gender" value="" />
                  <Picker.Item label="Male" value="male" />
                  <Picker.Item label="Female" value="female" />
                  <Picker.Item label="Other" value="other" />
                </Picker>
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contact Number</Text>
            <TextInput
              style={styles.input}
              value={formData.patientInfo.contactNumber}
              onChangeText={(value) => handleInputChange('patientInfo', 'contactNumber', value)}
              placeholder="Patient contact number"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Guardian Name</Text>
            <TextInput
              style={styles.input}
              value={formData.patientInfo.guardianName}
              onChangeText={(value) => handleInputChange('patientInfo', 'guardianName', value)}
              placeholder="Guardian/Parent name (if minor)"
            />
          </View>
        </View>

        {/* Location Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address *</Text>
            <TextInput
              style={styles.input}
              value={formData.location.address}
              onChangeText={(value) => handleInputChange('location', 'address', value)}
              placeholder="Enter location address"
              multiline
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>District</Text>
            <TextInput
              style={styles.input}
              value={formData.location.district}
              onChangeText={(value) => handleInputChange('location', 'district', value)}
              placeholder="Enter district"
            />
          </View>
        </View>

        {/* Health Information */}
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
                    formData.healthInfo.symptoms.includes(symptom) && styles.symptomChipSelected
                  ]}
                  onPress={() => toggleSymptom(symptom)}
                >
                  <Text style={[
                    styles.symptomChipText,
                    formData.healthInfo.symptoms.includes(symptom) && styles.symptomChipTextSelected
                  ]}>
                    {symptom}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Suspected Disease</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.healthInfo.suspectedDisease}
                onValueChange={(value) => handleInputChange('healthInfo', 'suspectedDisease', value)}
                style={styles.picker}
              >
                <Picker.Item label="Select Disease" value="" />
                {diseases.map((disease) => (
                  <Picker.Item key={disease} label={disease} value={disease} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Onset Date</Text>
              <TextInput
                style={styles.input}
                value={formData.healthInfo.onsetDate}
                onChangeText={(value) => handleInputChange('healthInfo', 'onsetDate', value)}
                placeholder="YYYY-MM-DD"
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Severity</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.healthInfo.severity}
                  onValueChange={(value) => handleInputChange('healthInfo', 'severity', value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Mild" value="mild" />
                  <Picker.Item label="Moderate" value="moderate" />
                  <Picker.Item label="Severe" value="severe" />
                </Picker>
              </View>
            </View>
          </View>
        </View>

        {/* Water Exposure */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Water Exposure Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Water Source</Text>
            <TextInput
              style={styles.input}
              value={formData.waterExposure.waterSource}
              onChangeText={(value) => handleInputChange('waterExposure', 'waterSource', value)}
              placeholder="e.g., River, Well, Tap, Pond"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Exposure Date</Text>
            <TextInput
              style={styles.input}
              value={formData.waterExposure.exposureDate}
              onChangeText={(value) => handleInputChange('waterExposure', 'exposureDate', value)}
              placeholder="When was the water consumed/contacted?"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Other People Exposed</Text>
            <TextInput
              style={styles.input}
              value={formData.waterExposure.otherExposed}
              onChangeText={(value) => handleInputChange('waterExposure', 'otherExposed', value)}
              placeholder="Number of other people who may be affected"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Additional Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.additionalNotes}
            onChangeText={(value) => handleDirectInputChange('additionalNotes', value)}
            placeholder="Any additional information about the case..."
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={submitReport}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Submitting...' : 'Submit Report'}
          </Text>
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
  },
  section: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
    marginBottom: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
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
  submitButton: {
    backgroundColor: '#F44336',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PatientReportFormScreen;
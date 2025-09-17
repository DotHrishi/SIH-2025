import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { waterReportsAPI, filesAPI } from '../services/api';

const WaterQualityFormScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    location: {
      coordinates: [],
      address: '',
      district: '',
      waterSource: '',
    },
    testingParameters: {
      pH: '',
      turbidity: '',
      dissolvedOxygen: '',
      temperature: '',
      conductivity: '',
      totalDissolvedSolids: '',
    },
    visualInspection: {
      color: '',
      odor: '',
      taste: '',
      clarity: '',
    },
    sampleCollection: {
      collectionDate: new Date().toISOString().split('T')[0],
      collectionTime: new Date().toTimeString().split(' ')[0],
      collectorName: '',
      collectorContact: '',
    },
    additionalNotes: '',
    images: [],
  });
  
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);

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

      // Reverse geocoding to get address
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
      Alert.alert('Error', 'Could not get current location');
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
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, result.assets[0]],
        }));
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Could not pick image');
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const validateForm = () => {
    if (!formData.location.address.trim()) {
      Alert.alert('Validation Error', 'Please enter the location address');
      return false;
    }
    if (!formData.location.waterSource.trim()) {
      Alert.alert('Validation Error', 'Please specify the water source');
      return false;
    }
    if (!formData.sampleCollection.collectorName.trim()) {
      Alert.alert('Validation Error', 'Please enter collector name');
      return false;
    }
    return true;
  };

  const submitReport = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Upload images first if any
      const imageUrls = [];
      for (const image of formData.images) {
        try {
          const formDataImage = new FormData();
          formDataImage.append('file', {
            uri: image.uri,
            type: 'image/jpeg',
            name: 'water-quality-image.jpg',
          });

          const uploadResponse = await filesAPI.upload(formDataImage);
          if (uploadResponse.data.success) {
            imageUrls.push(uploadResponse.data.data.url);
          }
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
        }
      }

      // Prepare report data
      const reportData = {
        ...formData,
        images: imageUrls,
        reportType: 'water_quality',
        status: 'pending',
      };

      const response = await waterReportsAPI.create(reportData);
      
      if (response.data.success) {
        Alert.alert(
          'Success',
          'Water quality report submitted successfully!',
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
        {/* Location Section */}
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

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Water Source *</Text>
            <TextInput
              style={styles.input}
              value={formData.location.waterSource}
              onChangeText={(value) => handleInputChange('location', 'waterSource', value)}
              placeholder="e.g., River, Well, Tap, Pond"
            />
          </View>

          {currentLocation && (
            <View style={styles.coordinatesInfo}>
              <Text style={styles.coordinatesText}>
                📍 Coordinates: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
              </Text>
            </View>
          )}
        </View>

        {/* Testing Parameters */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Testing Parameters</Text>
          
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>pH Level</Text>
              <TextInput
                style={styles.input}
                value={formData.testingParameters.pH}
                onChangeText={(value) => handleInputChange('testingParameters', 'pH', value)}
                placeholder="0-14"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Turbidity (NTU)</Text>
              <TextInput
                style={styles.input}
                value={formData.testingParameters.turbidity}
                onChangeText={(value) => handleInputChange('testingParameters', 'turbidity', value)}
                placeholder="0-1000"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Temperature (°C)</Text>
              <TextInput
                style={styles.input}
                value={formData.testingParameters.temperature}
                onChangeText={(value) => handleInputChange('testingParameters', 'temperature', value)}
                placeholder="0-100"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Dissolved Oxygen (mg/L)</Text>
              <TextInput
                style={styles.input}
                value={formData.testingParameters.dissolvedOxygen}
                onChangeText={(value) => handleInputChange('testingParameters', 'dissolvedOxygen', value)}
                placeholder="0-20"
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Visual Inspection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visual Inspection</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Color</Text>
            <TextInput
              style={styles.input}
              value={formData.visualInspection.color}
              onChangeText={(value) => handleInputChange('visualInspection', 'color', value)}
              placeholder="e.g., Clear, Cloudy, Brown, Yellow"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Odor</Text>
            <TextInput
              style={styles.input}
              value={formData.visualInspection.odor}
              onChangeText={(value) => handleInputChange('visualInspection', 'odor', value)}
              placeholder="e.g., None, Chlorine, Fishy, Rotten"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Clarity</Text>
            <TextInput
              style={styles.input}
              value={formData.visualInspection.clarity}
              onChangeText={(value) => handleInputChange('visualInspection', 'clarity', value)}
              placeholder="e.g., Clear, Slightly cloudy, Very cloudy"
            />
          </View>
        </View>

        {/* Sample Collection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sample Collection Information</Text>
          
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Collection Date</Text>
              <TextInput
                style={styles.input}
                value={formData.sampleCollection.collectionDate}
                onChangeText={(value) => handleInputChange('sampleCollection', 'collectionDate', value)}
                placeholder="YYYY-MM-DD"
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Collection Time</Text>
              <TextInput
                style={styles.input}
                value={formData.sampleCollection.collectionTime}
                onChangeText={(value) => handleInputChange('sampleCollection', 'collectionTime', value)}
                placeholder="HH:MM"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Collector Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.sampleCollection.collectorName}
              onChangeText={(value) => handleInputChange('sampleCollection', 'collectorName', value)}
              placeholder="Enter your name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contact Number</Text>
            <TextInput
              style={styles.input}
              value={formData.sampleCollection.collectorContact}
              onChangeText={(value) => handleInputChange('sampleCollection', 'collectorContact', value)}
              placeholder="Enter contact number"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Images */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Images</Text>
          
          <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
            <Ionicons name="camera" size={24} color="#2196F3" />
            <Text style={styles.imagePickerText}>Add Photo</Text>
          </TouchableOpacity>

          {formData.images.length > 0 && (
            <View style={styles.imageGrid}>
              {formData.images.map((image, index) => (
                <View key={index} style={styles.imageContainer}>
                  <Image source={{ uri: image.uri }} style={styles.image} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close-circle" size={24} color="#F44336" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Additional Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.additionalNotes}
            onChangeText={(value) => handleDirectInputChange('additionalNotes', value)}
            placeholder="Any additional observations or notes..."
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
  coordinatesInfo: {
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  coordinatesText: {
    fontSize: 14,
    color: '#2196F3',
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
  imagePickerText: {
    fontSize: 16,
    color: '#2196F3',
    marginLeft: 8,
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
  },
  submitButton: {
    backgroundColor: '#2196F3',
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

export default WaterQualityFormScreen;
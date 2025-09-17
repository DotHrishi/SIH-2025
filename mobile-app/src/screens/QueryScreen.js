import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { queriesAPI } from '../services/api';

const QueryScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('faq');
  const [queryText, setQueryText] = useState('');
  const [contactInfo, setContactInfo] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmitQuery = async () => {
    if (!queryText.trim()) {
      Alert.alert('Validation Error', 'Please enter your query');
      return;
    }

    if (!contactInfo.name.trim()) {
      Alert.alert('Validation Error', 'Please enter your name');
      return;
    }

    setLoading(true);
    try {
      const queryData = {
        query: queryText,
        contactInfo: contactInfo,
        type: 'general',
        status: 'pending',
      };

      const response = await queriesAPI.create(queryData);
      
      if (response.data.success) {
        Alert.alert(
          'Success',
          'Your query has been submitted successfully! Our experts will respond soon.',
          [
            {
              text: 'OK',
              onPress: () => {
                setQueryText('');
                setContactInfo({ name: '', email: '', phone: '' });
              },
            },
          ]
        );
      } else {
        throw new Error(response.data.message || 'Failed to submit query');
      }
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('Error', 'Failed to submit query. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFAQPress = () => {
    navigation.navigate('FAQ');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Query</Text>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'faq' && styles.activeTab]}
            onPress={() => setActiveTab('faq')}
          >
            <Ionicons name="help-circle" size={20} color={activeTab === 'faq' ? '#2196F3' : '#666'} />
            <Text style={[styles.tabText, activeTab === 'faq' && styles.activeTabText]}>FAQ</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'submit' && styles.activeTab]}
            onPress={() => setActiveTab('submit')}
          >
            <Ionicons name="chatbubble" size={20} color={activeTab === 'submit' ? '#2196F3' : '#666'} />
            <Text style={[styles.tabText, activeTab === 'submit' && styles.activeTabText]}>Submit Query</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'faq' ? (
          <View style={styles.content}>
            <TouchableOpacity style={styles.faqButton} onPress={handleFAQPress}>
              <View style={styles.faqContent}>
                <Text style={styles.faqTitle}>Frequently Asked Questions</Text>
                <Text style={styles.faqDescription}>
                  Find answers to common questions about water quality and health concerns.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#666" />
            </TouchableOpacity>

            <View style={styles.quickAccessSection}>
              <Text style={styles.sectionTitle}>Quick Access</Text>
              
              <TouchableOpacity style={styles.quickAccessItem}>
                <Ionicons name="water" size={20} color="#2196F3" />
                <Text style={styles.quickAccessText}>Water Quality Issues</Text>
                <Ionicons name="chevron-forward" size={16} color="#666" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickAccessItem}>
                <Ionicons name="medical" size={20} color="#F44336" />
                <Text style={styles.quickAccessText}>Health Concerns</Text>
                <Ionicons name="chevron-forward" size={16} color="#666" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickAccessItem}>
                <Ionicons name="flask" size={20} color="#4CAF50" />
                <Text style={styles.quickAccessText}>Testing Procedures</Text>
                <Ionicons name="chevron-forward" size={16} color="#666" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickAccessItem}>
                <Ionicons name="call" size={20} color="#FF9800" />
                <Text style={styles.quickAccessText}>Emergency Contacts</Text>
                <Ionicons name="chevron-forward" size={16} color="#666" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.content}>
            <View style={styles.submitSection}>
              <Text style={styles.sectionTitle}>Submit Your Query</Text>
              <Text style={styles.sectionDescription}>
                Have a question about water quality or health concerns? Submit your query and our experts will respond.
              </Text>

              {/* Contact Information */}
              <View style={styles.formSection}>
                <Text style={styles.formSectionTitle}>Contact Information</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={contactInfo.name}
                    onChangeText={(value) => setContactInfo(prev => ({ ...prev, name: value }))}
                    placeholder="Enter your name"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={styles.input}
                    value={contactInfo.email}
                    onChangeText={(value) => setContactInfo(prev => ({ ...prev, email: value }))}
                    placeholder="Enter your email"
                    keyboardType="email-address"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Phone Number</Text>
                  <TextInput
                    style={styles.input}
                    value={contactInfo.phone}
                    onChangeText={(value) => setContactInfo(prev => ({ ...prev, phone: value }))}
                    placeholder="Enter your phone number"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              {/* Query */}
              <View style={styles.formSection}>
                <Text style={styles.formSectionTitle}>Your Query</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={queryText}
                  onChangeText={setQueryText}
                  placeholder="Describe your question or concern in detail..."
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleSubmitQuery}
                disabled={loading}
              >
                <Text style={styles.submitButtonText}>
                  {loading ? 'Submitting...' : 'Submit Query'}
                </Text>
              </TouchableOpacity>

              {/* Help Text */}
              <View style={styles.helpSection}>
                <Ionicons name="information-circle" size={20} color="#2196F3" />
                <Text style={styles.helpText}>
                  Our experts typically respond within 24-48 hours. For urgent health emergencies, please contact local health authorities immediately.
                </Text>
              </View>
            </View>
          </View>
        )}
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
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  activeTabText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  faqButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  quickAccessSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
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
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 24,
  },
  quickAccessItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  quickAccessText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  submitSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  formSection: {
    marginBottom: 24,
  },
  formSectionTitle: {
    fontSize: 16,
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
    height: 120,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  helpSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
  },
  helpText: {
    flex: 1,
    fontSize: 14,
    color: '#2196F3',
    marginLeft: 8,
    lineHeight: 20,
  },
});

export default QueryScreen;
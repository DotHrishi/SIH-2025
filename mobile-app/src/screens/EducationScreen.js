import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const EducationScreen = ({ navigation }) => {
  const educationModules = [
    {
      id: 1,
      title: 'Water Quality Testing at Home',
      description: 'Learn simple methods to test water quality at home using basic tools and visual inspection techniques.',
      duration: '8:45',
      category: 'Testing',
      level: 'Beginner',
      target: 'General Public',
      thumbnail: null, // In a real app, you'd have actual video thumbnails
    },
    {
      id: 2,
      title: 'Identifying Waterborne Diseases',
      description: 'Understanding symptoms and early detection of common waterborne diseases in your community.',
      duration: '12:30',
      category: 'Health',
      level: 'Intermediate',
      target: 'Health Workers',
      thumbnail: null,
    },
    {
      id: 3,
      title: 'Water Purification Methods',
      description: 'Various methods to purify water at home including boiling, filtration, and chemical treatment.',
      duration: '15:20',
      category: 'Treatment',
      level: 'Beginner',
      target: 'General Public',
      thumbnail: null,
    },
    {
      id: 4,
      title: 'Community Water Safety',
      description: 'How to maintain water safety standards in your community and prevent contamination.',
      duration: '10:15',
      category: 'Prevention',
      level: 'Advanced',
      target: 'Community Leaders',
      thumbnail: null,
    },
  ];

  const handleVideoPress = (module) => {
    // In a real app, this would open a video player
    console.log('Playing video:', module.title);
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Testing': return '#2196F3';
      case 'Health': return '#F44336';
      case 'Treatment': return '#4CAF50';
      case 'Prevention': return '#FF9800';
      default: return '#666';
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'Beginner': return '#4CAF50';
      case 'Intermediate': return '#FF9800';
      case 'Advanced': return '#F44336';
      default: return '#666';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Education Modules</Text>
        </View>

        {/* Video Tutorials Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="play-circle" size={24} color="#2196F3" />
            <Text style={styles.sectionTitle}>Video Tutorials & Learning Resources</Text>
          </View>

          {educationModules.map((module) => (
            <TouchableOpacity
              key={module.id}
              style={styles.moduleCard}
              onPress={() => handleVideoPress(module)}
            >
              {/* Video Thumbnail */}
              <View style={styles.thumbnailContainer}>
                <View style={styles.thumbnail}>
                  <View style={styles.playButton}>
                    <Ionicons name="play" size={24} color="white" />
                  </View>
                </View>
                <View style={styles.duration}>
                  <Text style={styles.durationText}>{module.duration}</Text>
                </View>
              </View>

              {/* Module Info */}
              <View style={styles.moduleInfo}>
                <Text style={styles.moduleTitle}>{module.title}</Text>
                
                {/* Tags */}
                <View style={styles.tagsContainer}>
                  <View style={[styles.tag, { backgroundColor: getCategoryColor(module.category) }]}>
                    <Text style={styles.tagText}>{module.category}</Text>
                  </View>
                  <View style={[styles.tag, { backgroundColor: getLevelColor(module.level) }]}>
                    <Text style={styles.tagText}>{module.level}</Text>
                  </View>
                </View>

                <Text style={styles.moduleDescription}>{module.description}</Text>

                {/* Target Audience */}
                <View style={styles.targetContainer}>
                  <Ionicons name="people" size={16} color="#666" />
                  <Text style={styles.targetText}>Target: {module.target}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Additional Resources */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Resources</Text>
          
          <TouchableOpacity style={styles.resourceCard}>
            <View style={styles.resourceIcon}>
              <Ionicons name="document-text" size={24} color="#2196F3" />
            </View>
            <View style={styles.resourceInfo}>
              <Text style={styles.resourceTitle}>Water Quality Guidelines</Text>
              <Text style={styles.resourceDescription}>WHO standards and local guidelines for water quality assessment</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.resourceCard}>
            <View style={styles.resourceIcon}>
              <Ionicons name="medical" size={24} color="#F44336" />
            </View>
            <View style={styles.resourceInfo}>
              <Text style={styles.resourceTitle}>Disease Prevention Guide</Text>
              <Text style={styles.resourceDescription}>Comprehensive guide to preventing waterborne diseases</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.resourceCard}>
            <View style={styles.resourceIcon}>
              <Ionicons name="flask" size={24} color="#4CAF50" />
            </View>
            <View style={styles.resourceInfo}>
              <Text style={styles.resourceTitle}>Testing Kit Manual</Text>
              <Text style={styles.resourceDescription}>How to use water testing kits and interpret results</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.resourceCard}>
            <View style={styles.resourceIcon}>
              <Ionicons name="call" size={24} color="#FF9800" />
            </View>
            <View style={styles.resourceInfo}>
              <Text style={styles.resourceTitle}>Emergency Contacts</Text>
              <Text style={styles.resourceDescription}>Important phone numbers for health emergencies</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Quick Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Tips</Text>
          
          <View style={styles.tipCard}>
            <View style={styles.tipIcon}>
              <Ionicons name="bulb" size={20} color="#FF9800" />
            </View>
            <Text style={styles.tipText}>
              Always collect water samples in clean, sterilized containers for accurate testing results.
            </Text>
          </View>

          <View style={styles.tipCard}>
            <View style={styles.tipIcon}>
              <Ionicons name="bulb" size={20} color="#FF9800" />
            </View>
            <Text style={styles.tipText}>
              Boil water for at least 1 minute to kill most disease-causing organisms.
            </Text>
          </View>

          <View style={styles.tipCard}>
            <View style={styles.tipIcon}>
              <Ionicons name="bulb" size={20} color="#FF9800" />
            </View>
            <Text style={styles.tipText}>
              Report any unusual taste, color, or odor in your water supply immediately.
            </Text>
          </View>
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
  section: {
    margin: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  moduleCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  thumbnailContainer: {
    position: 'relative',
    height: 200,
    backgroundColor: '#e0e0e0',
  },
  thumbnail: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ccc',
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  duration: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  durationText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  moduleInfo: {
    padding: 16,
  },
  moduleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  tagText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  moduleDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  targetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  targetText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  resourceCard: {
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
  resourceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  resourceInfo: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  resourceDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  tipIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
});

export default EducationScreen;
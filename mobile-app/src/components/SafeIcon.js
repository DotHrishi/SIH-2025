import React from 'react';
import { Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SafeIcon = ({ name, size = 24, color = '#000', style, ...props }) => {
  try {
    return <Ionicons name={name} size={size} color={color} style={style} {...props} />;
  } catch (error) {
    // Fallback to text if icon fails to load
    const iconMap = {
      'home': '🏠',
      'home-outline': '🏠',
      'document-text': '📄',
      'document-text-outline': '📄',
      'school': '🎓',
      'school-outline': '🎓',
      'chatbubble': '💬',
      'chatbubble-outline': '💬',
      'search': '🔍',
      'notifications-outline': '🔔',
      'call-outline': '📞',
      'person-outline': '👤',
      'add': '➕',
      'chevron-forward': '▶️',
      'water': '💧',
      'medical': '🏥',
      'camera': '📷',
      'close-circle': '❌',
      'checkmark-circle': '✅',
      'help-circle': '❓',
      'information-circle': 'ℹ️',
      'chevron-up': '⬆️',
      'chevron-down': '⬇️',
      'play': '▶️',
      'play-circle': '▶️',
      'people': '👥',
      'document-text': '📄',
      'flask': '🧪',
      'bulb': '💡',
      'menu': '☰',
    };

    return (
      <Text style={[{ fontSize: size * 0.8, color }, style]}>
        {iconMap[name] || '•'}
      </Text>
    );
  }
};

export default SafeIcon;
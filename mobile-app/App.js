import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import EducationScreen from './src/screens/EducationScreen';
import QueryScreen from './src/screens/QueryScreen';
import ReportTypeScreen from './src/screens/ReportTypeScreen';
import WaterQualityFormScreen from './src/screens/WaterQualityFormScreen';
import PatientReportFormScreen from './src/screens/PatientReportFormScreen';
import FAQScreen from './src/screens/FAQScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack navigator for Reports flow
function ReportsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ReportsMain" 
        component={ReportsScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ReportType" 
        component={ReportTypeScreen}
        options={{ 
          title: 'Select Report Type',
          headerStyle: { backgroundColor: '#f8f9fa' },
          headerTintColor: '#333'
        }}
      />
      <Stack.Screen 
        name="WaterQualityForm" 
        component={WaterQualityFormScreen}
        options={{ 
          title: 'Water Quality Report',
          headerStyle: { backgroundColor: '#f8f9fa' },
          headerTintColor: '#333'
        }}
      />
      <Stack.Screen 
        name="PatientReportForm" 
        component={PatientReportFormScreen}
        options={{ 
          title: 'Patient Report',
          headerStyle: { backgroundColor: '#f8f9fa' },
          headerTintColor: '#333'
        }}
      />
    </Stack.Navigator>
  );
}

// Stack navigator for Query flow
function QueryStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="QueryMain" 
        component={QueryScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="FAQ" 
        component={FAQScreen}
        options={{ 
          title: 'Query',
          headerStyle: { backgroundColor: '#f8f9fa' },
          headerTintColor: '#333'
        }}
      />
    </Stack.Navigator>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Reports') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'Education') {
            iconName = focused ? 'school' : 'school-outline';
          } else if (route.name === 'Query') {
            iconName = focused ? 'chatbubble' : 'chatbubble-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          height: 60,
          paddingBottom: 5,
          paddingTop: 5,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Reports" component={ReportsStack} />
      <Tab.Screen name="Education" component={EducationScreen} />
      <Tab.Screen name="Query" component={QueryStack} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <PaperProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <TabNavigator />
      </NavigationContainer>
    </PaperProvider>
  );
}
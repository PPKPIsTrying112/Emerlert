import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import HomeScreen from './screens/HomeScreen';
import ContactsScreen from './screens/ContactsScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: { backgroundColor: '#111', borderTopColor: '#333' },
          tabBarActiveTintColor: '#ef4444',
          tabBarInactiveTintColor: '#888',
          headerShown: false,
        }}
      >
        <Tab.Screen
          name="SOS"
          component={HomeScreen}
          options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}></Text> }}
        />
        <Tab.Screen
          name="Contacts"
          component={ContactsScreen}
          options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}></Text> }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
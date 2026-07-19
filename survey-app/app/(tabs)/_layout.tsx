import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#8E7E6A', // Desert Khaki Gold (Primary Accent)
        tabBarInactiveTintColor: '#B6AEA2', // Muted Warm Sand (Secondary Accent)
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          backgroundColor: '#FFFFFF', // Crisp White Background
          borderTopColor: '#EFECE6', // Soft Sand Border
          borderTopWidth: 1.5,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      {/* 1. Dashboard */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "grid" : "grid-outline"} size={22} color={color} />
          ),
        }}
      />

      {/* 2. Camera */}
      <Tabs.Screen
        name="camera"
        options={{
          title: 'Camera',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "camera" : "camera-outline"} size={22} color={color} />
          ),
        }}
      />

      {/* 3. New Survey */}
      <Tabs.Screen
        name="new-survey"
        options={{
          title: 'New Survey',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "add-circle" : "add-circle-outline"} size={22} color={color} />
          ),
        }}
      />

      {/* 4. Contacts */}
      <Tabs.Screen
        name="contacts"
        options={{
          title: 'Contacts',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "people" : "people-outline"} size={22} color={color} />
          ),
        }}
      />

      {/* 5. Location */}
      <Tabs.Screen
        name="location"
        options={{
          title: 'Location',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "location" : "location-outline"} size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="clipboard"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="history"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="preview"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

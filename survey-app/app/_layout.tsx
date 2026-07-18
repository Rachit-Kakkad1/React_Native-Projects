import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Drawer } from 'expo-router/drawer';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Alert, StyleSheet, Text, View, Image } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

function CustomDrawerContent(props: any) {
  // Find which tab is active to highlight corresponding sidebar link
  const state = props.state;
  const activeRoute = state?.routes[state.index];
  const nestedState = activeRoute?.state;
  const activeTabName = nestedState?.routes[nestedState.index]?.name || 'index';

  const isDashboardActive = activeTabName === 'index';
  const isSurveyActive = activeTabName === 'new-survey';

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerScrollView}>
      {/* 1. Custom Profile Header - Minimalist Side-by-Side Design */}
      <View style={styles.drawerHeader}>
        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: 'https://res.cloudinary.com/dr84lv5ym/image/upload/v1784353123/ChatGPT_Image_Jul_18_2026_11_06_25_AM_skqy5i.png' }} 
            style={styles.avatarImage} 
          />
        </View>
        <View style={styles.headerTextContainer}>
          <Text style={styles.studentName} numberOfLines={1}>Rachit Kakkad</Text>
          <Text style={styles.studentInfo}>Roll: 108715</Text>
          <Text style={styles.studentBatch}>Batch: 2025-2029</Text>
        </View>
      </View>

      {/* 2. Custom Menu Navigation List (Google/Apple design system highlights) */}
      <View style={styles.listContainer}>
        {/* Dashboard Link */}
        <DrawerItem
          label="Dashboard"
          icon={({ size }) => (
            <Ionicons 
              name={isDashboardActive ? "grid" : "grid-outline"} 
              size={22} 
              color={isDashboardActive ? '#3B82F6' : '#64748B'} 
            />
          )}
          focused={isDashboardActive}
          onPress={() => props.navigation.navigate('(tabs)', { screen: 'index' })}
          activeTintColor="#3B82F6"
          inactiveTintColor="#64748B"
          activeBackgroundColor="#EFF6FF"
          labelStyle={{ fontSize: 14, fontWeight: '600', marginLeft: -8 }}
          style={{ borderRadius: 12, marginVertical: 4, paddingHorizontal: 8, marginHorizontal: 12 }}
        />
        
        {/* Survey Link */}
        <DrawerItem
          label="Survey"
          icon={({ size }) => (
            <Ionicons 
              name={isSurveyActive ? "document-text" : "document-text-outline"} 
              size={22} 
              color={isSurveyActive ? '#3B82F6' : '#64748B'} 
            />
          )}
          focused={isSurveyActive}
          onPress={() => props.navigation.navigate('(tabs)', { screen: 'new-survey' })}
          activeTintColor="#3B82F6"
          inactiveTintColor="#64748B"
          activeBackgroundColor="#EFF6FF"
          labelStyle={{ fontSize: 14, fontWeight: '600', marginLeft: -8 }}
          style={{ borderRadius: 12, marginVertical: 4, paddingHorizontal: 8, marginHorizontal: 12 }}
        />
      </View>
    </DrawerContentScrollView>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Drawer
          drawerContent={(props) => <CustomDrawerContent {...props} />}
          screenOptions={{
            headerShown: false,
            drawerActiveTintColor: '#3B82F6', // Modern Apple/Google Active Blue
            drawerInactiveTintColor: '#64748B', // Slate 500
            drawerActiveBackgroundColor: '#EFF6FF', // Soft Blue opacity background (Slate 50 style)
            drawerStyle: {
              width: 290,
              backgroundColor: '#FFFFFF',
            },
            drawerLabelStyle: {
              fontSize: 14,
              fontWeight: '600',
              marginLeft: -8, // Tighten spacing between icon and text label
            },
            drawerItemStyle: {
              borderRadius: 12,
              marginVertical: 4,
              paddingHorizontal: 8,
              marginHorizontal: 12,
            },
          }}
        >
          {/* We only register (tabs) as the entry screen. Clicking Dashboard in the Drawer will focus (tabs) */}
          <Drawer.Screen
            name="(tabs)"
            options={{
              drawerLabel: 'Dashboard',
              title: 'Dashboard',
              drawerIcon: ({ color, size }) => (
                <Ionicons name="grid-outline" size={size} color={color} />
              ),
            }}
          />
        </Drawer>
        <StatusBar style="auto" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  drawerScrollView: {
    paddingTop: 0,
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  drawerHeader: {
    backgroundColor: '#FFFFFF', // Pure minimalist white background
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9', // Subtle bottom border line
    marginBottom: 16,
  },
  avatarContainer: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1.5,
    borderColor: '#E2E8F0', // Thin border ring
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  headerTextContainer: {
    marginLeft: 16,
    flex: 1,
    justifyContent: 'center',
  },
  studentName: {
    color: '#0F172A', // Slate 900
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  studentInfo: {
    color: '#64748B', // Slate 500
    fontSize: 12,
    fontWeight: '500',
    marginTop: 3,
  },
  studentBatch: {
    color: '#94A3B8', // Slate 400
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  listContainer: {
    flex: 1,
  },
});

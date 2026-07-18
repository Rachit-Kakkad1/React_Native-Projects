import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  Pressable, 
  Alert,
  Image 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// Define the survey data type for the recent list
interface Survey {
  id: string;
  siteName: string;
  clientName: string;
  priority: 'High' | 'Medium' | 'Low';
  date: string;
  progress: number;
  tasksCount: string;
  location: string;
}

export default function DashboardScreen() {
  const navigation = useNavigation();

  // State to hold today's survey count dynamically
  const [surveyCount, setSurveyCount] = useState<number>(4);

  // Mock data for recent surveys
  const [recentSurveys] = useState<Survey[]>([
    {
      id: 'SRV-1024',
      siteName: 'Metro Hub Construction',
      clientName: 'Apex Infra Group',
      priority: 'High',
      date: '2026-07-18',
      progress: 0.85,
      tasksCount: '17/20',
      location: 'South Sector, Gate 3',
    },
    {
      id: 'SRV-1023',
      siteName: 'Solar Panel Grid B',
      clientName: 'CleanEnergy Corp',
      priority: 'Medium',
      date: '2026-07-17',
      progress: 0.50,
      tasksCount: '10/20',
      location: 'Roof Deck West',
    },
    {
      id: 'SRV-1022',
      siteName: 'Warehouse Safety Audit',
      clientName: 'LogiLink Logistics',
      priority: 'Low',
      date: '2026-07-15',
      progress: 1.00,
      tasksCount: '15/15',
      location: 'Central Depot',
    },
  ]);

  // Handler to open the sidebar drawer
  const handleOpenDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  // Helper to get priority badge color
  const getPriorityColor = (priority: 'High' | 'Medium' | 'Low') => {
    switch (priority) {
      case 'High':
        return { bg: '#FEF2F2', text: '#EF4444', border: '#EF4444' };
      case 'Medium':
        return { bg: '#FFFBEB', text: '#D97706', border: '#F59E0B' };
      case 'Low':
        return { bg: '#ECFDF5', text: '#059669', border: '#10B981' };
      default:
        return { bg: '#F1F5F9', text: '#64748B', border: '#E2E8F0' };
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 1. Custom Sticky App Header */}
      <View style={styles.header}>
        <Pressable onPress={handleOpenDrawer} style={styles.headerButton}>
          <Ionicons name="menu-outline" size={24} color="#8E7E6A" />
        </Pressable>
        <Text style={styles.headerTitle}>Smart Field Survey</Text>
        <View style={styles.headerAvatar}>
          <Image 
            source={{ uri: 'https://res.cloudinary.com/dr84lv5ym/image/upload/v1784353123/ChatGPT_Image_Jul_18_2026_11_06_25_AM_skqy5i.png' }} 
            style={styles.headerAvatarImage} 
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 2. Welcome Card with Elegant Accent Design */}
        <View style={styles.welcomeCard}>
          <View style={styles.welcomeTextContainer}>
            <Text style={styles.welcomeGreeting}>Overview</Text>
            <Text style={styles.welcomeUser}>Rachit Kakkad 👋</Text>
            <Text style={styles.welcomeSub}>Ready for today's field surveys? Ensure your location services and camera are enabled.</Text>
          </View>
        </View>

        {/* 3. Student Details Card with Divider Borders */}
        <View style={styles.studentCard}>
          <View style={styles.studentHeader}>
            <Ionicons name="school-outline" size={20} color="#3B82F6" />
            <Text style={styles.sectionTitle}>Student Details</Text>
          </View>
          <View style={styles.studentInfoGrid}>
            <View style={styles.studentRow}>
              <Text style={styles.studentLabel}>Name</Text>
              <Text style={styles.studentValue}>Rachit Kakkad</Text>
            </View>
            <View style={styles.studentRow}>
              <Text style={styles.studentLabel}>Roll Number</Text>
              <Text style={styles.studentValue}>108715</Text>
            </View>
            <View style={styles.studentRow}>
              <Text style={styles.studentLabel}>Batch</Text>
              <Text style={styles.studentValue}>2025-2029</Text>
            </View>
          </View>
        </View>

        {/* 4. Today's Survey Count Card */}
        <View style={styles.countCard}>
          <View style={styles.countLeft}>
            <Text style={styles.countLabel}>Today's Surveys</Text>
            <View style={styles.countRow}>
              <Text style={styles.countNumber}>{surveyCount}</Text>
              <Text style={styles.countSubtext}>completed</Text>
            </View>
          </View>
          <Pressable 
            style={styles.countIncrementBtn}
            onPress={() => {
              setSurveyCount(prev => prev + 1);
              Alert.alert("Survey Simulated", "You successfully added a survey to today's count!");
            }}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.countIncrementText}>Quick Add</Text>
          </Pressable>
        </View>

        {/* 4.5. Quick Action Cards */}
        <Text style={styles.mainSectionHeader}>Quick Actions</Text>
        <View style={styles.quickActionsRow}>
          <Pressable 
            style={styles.actionCard} 
            onPress={() => navigation.navigate('new-survey' as never)}
          >
            <View style={[styles.actionIconBg, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="document-text-outline" size={22} color="#3B82F6" />
            </View>
            <Text style={styles.actionCardTitle}>New Survey</Text>
            <Text style={styles.actionCardDesc}>Start a new inspection log</Text>
          </Pressable>

          <Pressable 
            style={styles.actionCard} 
            onPress={() => navigation.navigate('camera' as never)}
          >
            <View style={[styles.actionIconBg, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="camera-outline" size={22} color="#22C55E" />
            </View>
            <Text style={styles.actionCardTitle}>Camera</Text>
            <Text style={styles.actionCardDesc}>Capture and save site assets</Text>
          </Pressable>
        </View>

        {/* 5. Recent Survey Summary (Individual Cards with Color Indicators) */}
        <Text style={styles.mainSectionHeader}>Recent Survey Summary</Text>
        <View style={styles.recentList}>
          {recentSurveys.map((item) => {
            const colors = getPriorityColor(item.priority);
            return (
              <View key={item.id} style={[styles.surveyCard, { borderLeftColor: colors.border }]}>
                <View style={styles.surveyMain}>
                  {/* Title & Priority Badge */}
                  <View style={styles.surveyHeader}>
                    <Text style={styles.siteNameText} numberOfLines={1}>{item.siteName}</Text>
                    <View style={[styles.priorityBadge, { backgroundColor: colors.bg }]}>
                      <Text style={[styles.priorityBadgeText, { color: colors.text }]}>{item.priority}</Text>
                    </View>
                  </View>
                  
                  {/* Client name and Location details */}
                  <View style={styles.surveyDetailsContainer}>
                    <Text style={styles.clientNameText}>Client: {item.clientName}</Text>
                    <Text style={styles.locationText}>📍 {item.location}</Text>
                  </View>
                  
                  {/* Progress Bar & Task Count */}
                  <View style={styles.progressSection}>
                    <View style={styles.progressLabelRow}>
                      <Text style={styles.progressLabel}>Survey Progress</Text>
                      <Text style={styles.progressValueText}>{Math.round(item.progress * 100)}% ({item.tasksCount})</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${item.progress * 100}%`, backgroundColor: colors.border }]} />
                    </View>
                  </View>
                  
                  {/* Subtle Separator */}
                  <View style={styles.cardDivider} />

                  {/* Footer (ID & Date) */}
                  <View style={styles.surveyFooter}>
                    <View style={styles.idContainer}>
                      <Ionicons name="key-outline" size={12} color="#94A3B8" style={{ marginRight: 4 }} />
                      <Text style={styles.surveyIdText}>{item.id}</Text>
                    </View>
                    <View style={styles.dateContainer}>
                      <Ionicons name="calendar-outline" size={12} color="#64748B" style={{ marginRight: 4 }} />
                      <Text style={styles.surveyDateText}>{item.date}</Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5', // Warm Beige Alabaster Background
  },
  header: {
    flexDirection: 'row',
    height: 64,
    backgroundColor: '#FFFFFF', // Crisp White Header
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1.5,
    borderBottomColor: '#EFECE6',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FAF8F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C261F', // Charcoal Coffee
    letterSpacing: 0.4,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#8E7E6A', // Warm gold ring
    backgroundColor: '#FAF8F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  welcomeCard: {
    backgroundColor: '#8E7E6A', // Desert Khaki Gold Card
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EFECE6',
    shadowColor: '#8E7E6A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 3,
  },
  welcomeTextContainer: {
    zIndex: 2,
  },
  welcomeGreeting: {
    color: '#FAF8F5', // Soft white/beige welcome
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  welcomeUser: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 6,
    letterSpacing: 0.3,
  },
  welcomeSub: {
    color: '#F4F0E8', // Alabaster subtitle
    fontSize: 13,
    marginTop: 10,
    lineHeight: 20,
    fontWeight: '400',
  },
  studentCard: {
    backgroundColor: '#FFFFFF', // Crisp White Card
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#EFECE6',
    shadowColor: '#7C7267',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2C261F',
  },
  studentInfoGrid: {
    gap: 12,
  },
  studentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FAF8F5',
  },
  studentLabel: {
    fontSize: 13,
    color: '#7C7267', // Warm Taupe label
    fontWeight: '500',
  },
  studentValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2C261F', // Charcoal Coffee
  },
  countCard: {
    backgroundColor: '#FFFFFF', // Crisp White Card
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#EFECE6',
  },
  countLeft: {
    flexDirection: 'column',
  },
  countLabel: {
    fontSize: 11,
    color: '#7C7267',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.0,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
    gap: 6,
  },
  countNumber: {
    fontSize: 38,
    fontWeight: '800',
    color: '#2C261F',
  },
  countSubtext: {
    fontSize: 13,
    color: '#7C7267',
    fontWeight: '500',
  },
  countIncrementBtn: {
    backgroundColor: '#8E7E6A', // Desert Gold
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 30,
    gap: 4,
    shadowColor: '#8E7E6A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  countIncrementText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  mainSectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2C261F',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  recentList: {
    gap: 12,
  },
  surveyCard: {
    backgroundColor: '#FFFFFF', // Crisp White Card
    borderRadius: 20,
    borderLeftWidth: 4,
    borderWidth: 1.5,
    borderColor: '#EFECE6',
    overflow: 'hidden',
    shadowColor: '#7C7267',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  surveyMain: {
    padding: 18,
  },
  surveyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  siteNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2C261F',
    flex: 1,
    marginRight: 10,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 30,
  },
  priorityBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clientNameText: {
    fontSize: 13,
    color: '#7C7267',
    fontWeight: '500',
  },
  surveyDetailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 12,
    color: '#7C7267',
    fontWeight: '500',
  },
  progressSection: {
    marginTop: 4,
    marginBottom: 4,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 10,
    color: '#B6AEA2',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressValueText: {
    fontSize: 11,
    color: '#2C261F',
    fontWeight: '700',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#FAF8F5',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#FAF8F5',
    marginVertical: 12,
  },
  surveyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  idContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  surveyIdText: {
    fontSize: 11,
    color: '#B6AEA2',
    fontWeight: '600',
  },
  surveyDateText: {
    fontSize: 11,
    color: '#7C7267',
    fontWeight: '600',
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Crisp White Card
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#EFECE6',
    shadowColor: '#7C7267',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FAF8F5',
  },
  actionCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2C261F',
    marginBottom: 4,
  },
  actionCardDesc: {
    fontSize: 11,
    color: '#7C7267',
    lineHeight: 15,
  },
});

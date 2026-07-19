import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Pressable, 
  Alert, 
  TextInput, 
  FlatList, 
  ActivityIndicator,
  Platform,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRouter } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

interface SurveyRecord {
  id: string;
  siteName: string;
  clientName: string;
  priority: 'High' | 'Medium' | 'Low';
  date: string;
  progress: number;
  location: string;
  status: 'Draft' | 'Submitted';
}

export default function HistoryScreen() {
  const navigation = useNavigation();
  const router = useRouter();

  // Local storage mock surveys list
  const [surveys, setSurveys] = useState<SurveyRecord[]>([
    {
      id: 'SRV-1024',
      siteName: 'Terminal 2 Expansion',
      clientName: 'Metro Airport Authority',
      priority: 'High',
      date: '2026-07-18',
      progress: 0.85,
      location: '19.0760, 72.8777',
      status: 'Draft',
    },
    {
      id: 'SRV-1023',
      siteName: 'Solar Panel Grid B',
      clientName: 'CleanEnergy Corp',
      priority: 'Medium',
      date: '2026-07-17',
      progress: 0.50,
      location: '19.2183, 72.9780',
      status: 'Draft',
    },
    {
      id: 'SRV-1022',
      siteName: 'Warehouse Safety Audit',
      clientName: 'LogiLink Logistics',
      priority: 'Low',
      date: '2026-07-15',
      progress: 1.00,
      location: '19.1234, 72.8901',
      status: 'Submitted',
    },
    {
      id: 'SRV-1021',
      siteName: 'Dock Slip Restoration',
      clientName: 'Port Authority',
      priority: 'High',
      date: '2026-07-12',
      progress: 1.00,
      location: '19.0430, 72.8211',
      status: 'Submitted',
    },
    {
      id: 'SRV-1020',
      siteName: 'Highway Overpass Check',
      clientName: 'Dept of Infrastructure',
      priority: 'Medium',
      date: '2026-07-10',
      progress: 0.20,
      location: '19.1552, 72.9123',
      status: 'Draft',
    }
  ]);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<'ALL' | 'High' | 'Medium' | 'Low'>('ALL');

  // Loading animation state for CSV report export
  const [isExporting, setIsExporting] = useState(false);

  const handleOpenDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  // Get KPI Stats numbers
  const totalCount = surveys.length;
  const draftCount = surveys.filter(s => s.status === 'Draft').length;
  const submittedCount = surveys.filter(s => s.status === 'Submitted').length;

  // Filter lists based on search string and priority pill selections
  const filteredSurveys = surveys.filter(item => {
    const matchesSearch = item.siteName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = selectedPriority === 'ALL' || item.priority === selectedPriority;
    return matchesSearch && matchesPriority;
  });

  // Export survey logs as CSV Mock trigger
  const handleExportCSV = () => {
    setIsExporting(true);

    setTimeout(() => {
      setIsExporting(false);
      Alert.alert(
        "CSV Report Exported",
        "Survey audit data sheets 'survey_audit_report.csv' compiled successfully. Saved to local device storage.",
        [{ text: "OK" }]
      );
    }, 1800);
  };

  // Delete survey record with standard warning dialogs
  const handleDeleteSurvey = (id: string, siteName: string) => {
    Alert.alert(
      "Confirm Deletion",
      `Are you sure you want to permanently delete the survey logs for "${siteName}"? This action is irreversible.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: () => {
            setSurveys(prev => prev.filter(s => s.id !== id));
            Alert.alert("Deleted Successfully", "Survey log removed from board.");
          } 
        }
      ]
    );
  };

  // Launch Details View mapping
  const handleViewDetails = (id: string) => {
    router.push({
      pathname: '/preview',
      params: { id }
    });
  };

  // Priority color formats helpers
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
      {/* 1. Header */}
      <View style={styles.header}>
        <Pressable onPress={handleOpenDrawer} style={styles.headerButton}>
          <Ionicons name="menu-outline" size={24} color="#8E7E6A" />
        </Pressable>
        <Text style={styles.headerTitle}>Survey History</Text>
        
        {/* CSV export trigger */}
        <Pressable onPress={handleExportCSV} style={styles.headerButton}>
          <Ionicons name="download-outline" size={20} color="#8E7E6A" />
        </Pressable>
      </View>

      {isExporting ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#8E7E6A" />
          <Text style={styles.loaderText}>Compiling audit records...</Text>
          <Text style={styles.loaderSub}>Formatting coordinate data and exporting CSV report...</Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          
          {/* 2. Horizontal KPI Stats HUD */}
          <View style={styles.kpiPanel}>
            <View style={styles.kpiBox}>
              <Text style={styles.kpiVal}>{totalCount}</Text>
              <Text style={styles.kpiLabel}>Total Logged</Text>
            </View>
            <View style={[styles.kpiBox, { borderLeftWidth: 1.5, borderLeftColor: '#EFECE6' }]}>
              <Text style={[styles.kpiVal, { color: '#D97706' }]}>{draftCount}</Text>
              <Text style={styles.kpiLabel}>Drafts</Text>
            </View>
            <View style={[styles.kpiBox, { borderLeftWidth: 1.5, borderLeftColor: '#EFECE6' }]}>
              <Text style={[styles.kpiVal, { color: '#059669' }]}>{submittedCount}</Text>
              <Text style={styles.kpiLabel}>Published</Text>
            </View>
          </View>

          {/* 3. Search input bar */}
          <View style={styles.searchSection}>
            <View style={styles.searchContainer}>
              <Ionicons name="search-outline" size={18} color="#B6AEA2" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by site, client, or ID..."
                placeholderTextColor="#B6AEA2"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={16} color="#B6AEA2" />
                </Pressable>
              )}
            </View>

            {/* 4. Priority Filter Pills Row */}
            <View style={styles.priorityFilterRow}>
              {(['ALL', 'High', 'Medium', 'Low'] as const).map((lvl) => {
                const count = lvl === 'ALL' 
                  ? surveys.length 
                  : surveys.filter(s => s.priority === lvl).length;
                const isSelected = selectedPriority === lvl;
                
                return (
                  <Pressable
                    key={lvl}
                    style={[
                      styles.filterPill,
                      isSelected && styles.filterPillActive
                    ]}
                    onPress={() => setSelectedPriority(lvl)}
                  >
                    <Text style={[
                      styles.filterPillText,
                      isSelected && styles.filterPillTextActive
                    ]}>
                      {lvl === 'ALL' ? 'All' : lvl} ({count})
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* 5. FlatList Survey Listings */}
          <FlatList
            data={filteredSurveys}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="folder-open-outline" size={48} color="#B6AEA2" style={{ marginBottom: 10 }} />
                <Text style={styles.emptyTitle}>No Surveys Logged</Text>
                <Text style={styles.emptySubtitle}>No records found matching filters or search queries.</Text>
              </View>
            }
            renderItem={({ item }) => {
              const priorityColors = getPriorityColor(item.priority);
              return (
                <View style={[styles.surveyCard, { borderLeftColor: priorityColors.border }]}>
                  {/* Card Header site name & status */}
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.siteHeaderBox}>
                      <Text style={styles.siteNameText} numberOfLines={1}>{item.siteName}</Text>
                      <Text style={styles.clientNameText} numberOfLines={1}>{item.clientName}</Text>
                    </View>

                    {/* Status Badge */}
                    <View style={[
                      styles.statusBadge,
                      item.status === 'Submitted' ? styles.statusBadgeSub : styles.statusBadgeDraft
                    ]}>
                      <Text style={[
                        styles.statusBadgeText,
                        item.status === 'Submitted' ? { color: '#059669' } : { color: '#D97706' }
                      ]}>
                        {item.status}
                      </Text>
                    </View>
                  </View>

                  {/* Coordinates & Date Details */}
                  <View style={styles.cardInfoRow}>
                    <View style={styles.infoLabelItem}>
                      <Ionicons name="location-outline" size={13} color="#7C7267" style={{ marginRight: 4 }} />
                      <Text style={styles.infoValueText}>{item.location}</Text>
                    </View>

                    <View style={styles.infoLabelItem}>
                      <Ionicons name="calendar-outline" size={13} color="#7C7267" style={{ marginRight: 4 }} />
                      <Text style={styles.infoValueText}>{item.date}</Text>
                    </View>
                  </View>

                  {/* Survey Progress Slider representation */}
                  <View style={styles.progressRow}>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${item.progress * 100}%`, backgroundColor: priorityColors.border }]} />
                    </View>
                    <Text style={styles.progressText}>{Math.round(item.progress * 100)}%</Text>
                  </View>

                  {/* Card Actions Footer Grid */}
                  <View style={styles.cardFooterActions}>
                    <View style={styles.idBox}>
                      <Text style={styles.idText}>{item.id}</Text>
                    </View>

                    <View style={styles.actionButtonsBox}>
                      {/* Delete action */}
                      <Pressable 
                        style={styles.actionBtnDelete} 
                        onPress={() => handleDeleteSurvey(item.id, item.siteName)}
                      >
                        <Ionicons name="trash-outline" size={16} color="#EF4444" />
                      </Pressable>

                      {/* View details redirection */}
                      <Pressable 
                        style={styles.actionBtnDetails} 
                        onPress={() => handleViewDetails(item.id)}
                      >
                        <Ionicons name="eye-outline" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                        <Text style={styles.actionBtnDetailsText}>Preview</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            }}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  header: {
    flexDirection: 'row',
    height: 64,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1.5,
    borderBottomColor: '#EFECE6',
    zIndex: 20,
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
    color: '#2C261F',
    letterSpacing: 0.4,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loaderText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2C261F',
    marginTop: 18,
    marginBottom: 6,
  },
  loaderSub: {
    fontSize: 12,
    color: '#7C7267',
    fontWeight: '500',
    textAlign: 'center',
  },
  kpiPanel: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1.5,
    borderBottomColor: '#EFECE6',
    paddingVertical: 14,
  },
  kpiBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2C261F',
  },
  kpiLabel: {
    fontSize: 10,
    color: '#7C7267',
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  searchSection: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1.5,
    borderBottomColor: '#EFECE6',
    paddingVertical: 12,
    gap: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    borderWidth: 1.5,
    borderColor: '#EFECE6',
    borderRadius: 14,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: '#2C261F',
    fontSize: 14,
    fontWeight: '500',
  },
  priorityFilterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#FAF8F5',
    borderWidth: 1.5,
    borderColor: '#EFECE6',
  },
  filterPillActive: {
    borderColor: '#8E7E6A',
    backgroundColor: '#FAF8F5',
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7C7267',
  },
  filterPillTextActive: {
    color: '#8E7E6A',
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2C261F',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#7C7267',
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '500',
  },
  surveyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#EFECE6',
    borderLeftWidth: 5,
    padding: 14,
    shadowColor: '#7C7267',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  siteHeaderBox: {
    flex: 1,
    marginRight: 10,
  },
  siteNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2C261F',
  },
  clientNameText: {
    fontSize: 12,
    color: '#7C7267',
    fontWeight: '600',
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeDraft: {
    backgroundColor: '#FFFBEB',
  },
  statusBadgeSub: {
    backgroundColor: '#ECFDF5',
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  cardInfoRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 12,
  },
  infoLabelItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoValueText: {
    fontSize: 11,
    color: '#7C7267',
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F4F0E8',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2C261F',
    width: 28,
    textAlign: 'right',
  },
  cardFooterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#FAF8F5',
  },
  idBox: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFECE6',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  idText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 10,
    fontWeight: '700',
    color: '#8E7E6A',
  },
  actionButtonsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtnDelete: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
  },
  actionBtnDetails: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#8E7E6A',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnDetailsText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});

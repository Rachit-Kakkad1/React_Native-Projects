import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Pressable, 
  Alert, 
  TextInput, 
  ActivityIndicator, 
  ScrollView,
  Image,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useLocalSearchParams } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

interface SurveyDetail {
  id: string;
  siteName: string;
  clientName: string;
  priority: 'High' | 'Medium' | 'Low';
  date: string;
  progress: number;
  location: string;
  contactName: string;
  contactPhone: string;
  notes: string;
  status: 'Draft' | 'Submitted';
  photoUri: string | null;
}

export default function PreviewScreen() {
  const navigation = useNavigation();
  const params = useLocalSearchParams();

  // Initial mock survey data list
  const [surveysList, setSurveysList] = useState<SurveyDetail[]>([
    {
      id: 'SRV-1024',
      siteName: 'Terminal 2 Expansion',
      clientName: 'Metro Airport Authority',
      priority: 'High',
      date: '2026-07-18',
      progress: 0.85,
      location: '19.0760, 72.8777 (Accuracy: ±4.2m)',
      contactName: 'Rachit Kakkad',
      contactPhone: '+1 (800) 555-SOS1',
      notes: 'Foundation columns are reinforced. Concrete pour scheduled for Monday. Safety protocols are fully active.',
      status: 'Draft',
      photoUri: 'https://res.cloudinary.com/dr84lv5ym/image/upload/v1784353583/ChatGPT_Image_Jul_18_2026_11_06_25_AM_skqy5i.png',
    },
    {
      id: 'SRV-1023',
      siteName: 'Solar Panel Grid B',
      clientName: 'CleanEnergy Corp',
      priority: 'Medium',
      date: '2026-07-17',
      progress: 0.50,
      location: '19.2183, 72.9780 (Accuracy: ±6.8m)',
      contactName: 'John Doe',
      contactPhone: '+1 (555) 123-4567',
      notes: 'Inverters require calibration checks. Mount grids completed on Roof West.',
      status: 'Draft',
      photoUri: null,
    },
    {
      id: 'SRV-1022',
      siteName: 'Warehouse Safety Audit',
      clientName: 'LogiLink Logistics',
      priority: 'Low',
      date: '2026-07-15',
      progress: 1.00,
      location: '19.1234, 72.8901 (Accuracy: ±2.5m)',
      contactName: 'Sarah Connor',
      contactPhone: '+1 (555) 987-6543',
      notes: 'Fire extinguishers inspected and tagged. Emergency exits clear of obstacles.',
      status: 'Submitted',
      photoUri: null,
    }
  ]);

  // Selected survey state
  const [selectedSurveyId, setSelectedSurveyId] = useState<string>('SRV-1024');
  const [showSelectorDropdown, setShowSelectorDropdown] = useState(false);

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editSiteName, setEditSiteName] = useState('');
  const [editClientName, setEditClientName] = useState('');
  const [editPriority, setEditPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [editLocation, setEditLocation] = useState('');
  const [editContactName, setEditContactName] = useState('');
  const [editContactPhone, setEditContactPhone] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Submit animation/loading states
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load selected survey details into edit states
  const activeSurvey = surveysList.find(s => s.id === selectedSurveyId) || surveysList[0];

  // Watch for router changes to load selected survey
  useEffect(() => {
    if (params?.id) {
      setSelectedSurveyId(params.id as string);
    }
  }, [params?.id]);

  useEffect(() => {
    if (activeSurvey) {
      setEditSiteName(activeSurvey.siteName);
      setEditClientName(activeSurvey.clientName);
      setEditPriority(activeSurvey.priority);
      setEditLocation(activeSurvey.location);
      setEditContactName(activeSurvey.contactName);
      setEditContactPhone(activeSurvey.contactPhone);
      setEditNotes(activeSurvey.notes);
    }
  }, [selectedSurveyId, surveysList]);

  const handleOpenDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  // Toggle edit state
  const handleEditToggle = () => {
    if (isEditing) {
      // Save changes back to list
      setSurveysList(prev => prev.map(s => {
        if (s.id === selectedSurveyId) {
          return {
            ...s,
            siteName: editSiteName,
            clientName: editClientName,
            priority: editPriority,
            location: editLocation,
            contactName: editContactName,
            contactPhone: editContactPhone,
            notes: editNotes,
          };
        }
        return s;
      }));
      setIsEditing(false);
      Alert.alert("Changes Saved", "Survey details updated successfully.");
    } else {
      setIsEditing(true);
    }
  };

  // Trigger Survey submission
  const handleSubmitSurvey = () => {
    if (activeSurvey.status === 'Submitted') {
      Alert.alert("Already Submitted", "This survey log has already been locked and submitted to server.");
      return;
    }

    Alert.alert(
      "Confirm Submission",
      "Are you sure you want to finalize and submit this inspection report? This will lock all field entries.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Submit", 
          onPress: async () => {
            setIsSubmitting(true);
            
            // Simulate server upload lag
            setTimeout(() => {
              setSurveysList(prev => prev.map(s => {
                if (s.id === selectedSurveyId) {
                  return { ...s, status: 'Submitted' };
                }
                return s;
              }));
              setIsSubmitting(false);
              Alert.alert(
                "Submission Success", 
                "Inspection survey has been securely published to remote audit logs.",
                [{ text: "OK" }]
              );
            }, 1800);
          } 
        }
      ]
    );
  };

  // Format priority colors
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

  const priorityColors = getPriorityColor(activeSurvey.priority);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 1. Header */}
      <View style={styles.header}>
        <Pressable onPress={handleOpenDrawer} style={styles.headerButton}>
          <Ionicons name="menu-outline" size={24} color="#8E7E6A" />
        </Pressable>
        
        {/* Survey selection dropdown button */}
        <Pressable 
          onPress={() => setShowSelectorDropdown(prev => !prev)} 
          style={styles.dropdownSelector}
        >
          <Text style={styles.dropdownSelectorText}>{selectedSurveyId}</Text>
          <Ionicons name={showSelectorDropdown ? "chevron-up" : "chevron-down"} size={16} color="#8E7E6A" />
        </Pressable>

        <View style={{ width: 40 }} />
      </View>

      {/* 1.1 Dropdown list overlay */}
      {showSelectorDropdown && (
        <View style={styles.dropdownContainer}>
          {surveysList.map((s) => (
            <Pressable
              key={s.id}
              style={[
                styles.dropdownItem,
                selectedSurveyId === s.id && styles.dropdownItemActive
              ]}
              onPress={() => {
                setSelectedSurveyId(s.id);
                setShowSelectorDropdown(false);
                setIsEditing(false);
              }}
            >
              <View>
                <Text style={styles.dropdownItemText}>{s.siteName}</Text>
                <Text style={styles.dropdownItemSub}>{s.id} | {s.clientName}</Text>
              </View>
              {selectedSurveyId === s.id && (
                <Ionicons name="checkmark" size={16} color="#8E7E6A" />
              )}
            </Pressable>
          ))}
        </View>
      )}

      {isSubmitting ? (
        <View style={styles.submittingContainer}>
          <ActivityIndicator size="large" color="#8E7E6A" />
          <Text style={styles.submittingText}>Syncing inspection logs...</Text>
          <Text style={styles.submittingSub}>Uploading site coordinates and assets...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* 2. Survey Status Dashboard Card */}
          <View style={[styles.statusCard, activeSurvey.status === 'Submitted' && styles.statusCardSubmitted]}>
            <View style={styles.statusHeaderRow}>
              <View style={styles.statusLabelRow}>
                <Ionicons 
                  name={activeSurvey.status === 'Submitted' ? "cloud-done" : "document-text"} 
                  size={20} 
                  color={activeSurvey.status === 'Submitted' ? "#059669" : "#D97706"} 
                />
                <Text style={[
                  styles.statusTitle, 
                  activeSurvey.status === 'Submitted' ? { color: '#059669' } : { color: '#D97706' }
                ]}>
                  {activeSurvey.status === 'Submitted' ? 'PUBLISHED LOG' : 'DRAFT REPORT'}
                </Text>
              </View>

              <View style={[styles.priorityBadge, { backgroundColor: priorityColors.bg }]}>
                <Text style={[styles.priorityBadgeText, { color: priorityColors.text }]}>{activeSurvey.priority}</Text>
              </View>
            </View>

            {/* Site & Client Details layout */}
            <View style={styles.siteDetailsBox}>
              {isEditing ? (
                <View style={styles.editFormGrid}>
                  <View style={styles.editInputContainer}>
                    <Text style={styles.editInputLabel}>Site Name</Text>
                    <TextInput 
                      style={styles.editInput} 
                      value={editSiteName} 
                      onChangeText={setEditSiteName} 
                    />
                  </View>
                  <View style={styles.editInputContainer}>
                    <Text style={styles.editInputLabel}>Client Name</Text>
                    <TextInput 
                      style={styles.editInput} 
                      value={editClientName} 
                      onChangeText={setEditClientName} 
                    />
                  </View>
                </View>
              ) : (
                <>
                  <Text style={styles.siteNameText}>{activeSurvey.siteName}</Text>
                  <Text style={styles.clientNameText}>Client: {activeSurvey.clientName}</Text>
                </>
              )}
              <Text style={styles.dateText}>Date Logged: {activeSurvey.date}</Text>
            </View>
          </View>

          {/* 3. Site Photo Card */}
          <View style={styles.detailSectionCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBg, { backgroundColor: '#F4F0E8' }]}>
                <Ionicons name="image-outline" size={18} color="#8E7E6A" />
              </View>
              <Text style={styles.cardTitle}>Site Visual Evidence</Text>
            </View>

            {activeSurvey.photoUri ? (
              <View style={styles.photoFrame}>
                <Image source={{ uri: activeSurvey.photoUri }} style={styles.photo} />
              </View>
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera-outline" size={32} color="#B6AEA2" />
                <Text style={styles.photoPlaceholderText}>No photo references attached.</Text>
              </View>
            )}
          </View>

          {/* 4. Inspector Contact Details Card */}
          <View style={styles.detailSectionCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBg, { backgroundColor: '#F4F0E8' }]}>
                <Ionicons name="person-outline" size={18} color="#8E7E6A" />
              </View>
              <Text style={styles.cardTitle}>Assigned Contact Reference</Text>
            </View>

            {isEditing ? (
              <View style={styles.editFormGrid}>
                <View style={styles.editInputContainer}>
                  <Text style={styles.editInputLabel}>Contact Name</Text>
                  <TextInput 
                    style={styles.editInput} 
                    value={editContactName} 
                    onChangeText={setEditContactName} 
                  />
                </View>
                <View style={styles.editInputContainer}>
                  <Text style={styles.editInputLabel}>Contact Phone</Text>
                  <TextInput 
                    style={styles.editInput} 
                    value={editContactPhone} 
                    onChangeText={setEditContactPhone} 
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
            ) : (
              <View style={styles.contactDetailsBox}>
                <Text style={styles.contactNameText}>{activeSurvey.contactName}</Text>
                <Text style={styles.contactPhoneText}>{activeSurvey.contactPhone}</Text>
              </View>
            )}
          </View>

          {/* 5. GPS Coordinates Card */}
          <View style={styles.detailSectionCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBg, { backgroundColor: '#F4F0E8' }]}>
                <Ionicons name="location-outline" size={18} color="#8E7E6A" />
              </View>
              <Text style={styles.cardTitle}>Telemetry GPS Pin</Text>
            </View>

            {isEditing ? (
              <View style={styles.editInputContainer}>
                <Text style={styles.editInputLabel}>GPS Location coordinates</Text>
                <TextInput 
                  style={styles.editInput} 
                  value={editLocation} 
                  onChangeText={setEditLocation} 
                />
              </View>
            ) : (
              <View style={styles.locationDetailsBox}>
                <Ionicons name="pin" size={16} color="#EF4444" style={{ marginRight: 6 }} />
                <Text style={styles.locationText}>{activeSurvey.location}</Text>
              </View>
            )}
          </View>

          {/* 6. Surveyor Notes Card */}
          <View style={styles.detailSectionCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBg, { backgroundColor: '#F4F0E8' }]}>
                <Ionicons name="document-text-outline" size={18} color="#8E7E6A" />
              </View>
              <Text style={styles.cardTitle}>Surveyor Notes log</Text>
            </View>

            {isEditing ? (
              <View style={styles.editInputContainer}>
                <Text style={styles.editInputLabel}>Survey description notes</Text>
                <TextInput 
                  style={[styles.editInput, styles.editMultilineInput]} 
                  value={editNotes} 
                  onChangeText={setEditNotes} 
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            ) : (
              <Text style={styles.notesText}>{activeSurvey.notes}</Text>
            )}
          </View>

          {/* 7. Edit & Submit Actions Row */}
          <View style={styles.actionsContainer}>
            {/* Edit/Save Button */}
            <Pressable 
              style={[
                styles.actionBtn, 
                isEditing ? styles.actionBtnSave : styles.actionBtnEdit,
                activeSurvey.status === 'Submitted' && { opacity: 0.6 }
              ]} 
              onPress={handleEditToggle}
              disabled={activeSurvey.status === 'Submitted'}
            >
              <Ionicons 
                name={isEditing ? "save" : "create-outline"} 
                size={18} 
                color={isEditing ? "#FFFFFF" : "#8E7E6A"} 
                style={{ marginRight: 6 }} 
              />
              <Text style={[
                styles.actionBtnText, 
                isEditing ? { color: '#FFFFFF' } : { color: '#8E7E6A' }
              ]}>
                {isEditing ? 'Save Changes' : 'Edit Survey'}
              </Text>
            </Pressable>

            {/* Submit Survey button */}
            {!isEditing && (
              <Pressable 
                style={[
                  styles.submitBtn,
                  activeSurvey.status === 'Submitted' && styles.submitBtnLocked
                ]} 
                onPress={handleSubmitSurvey}
                disabled={activeSurvey.status === 'Submitted'}
              >
                <Ionicons 
                  name={activeSurvey.status === 'Submitted' ? "lock-closed-outline" : "paper-plane-outline"} 
                  size={18} 
                  color="#FFFFFF" 
                  style={{ marginRight: 6 }} 
                />
                <Text style={styles.submitBtnText}>
                  {activeSurvey.status === 'Submitted' ? 'Survey Submitted' : 'Submit Inspection'}
                </Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
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
  dropdownSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    borderWidth: 1.5,
    borderColor: '#EFECE6',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
    gap: 8,
  },
  dropdownSelectorText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8E7E6A',
  },
  dropdownContainer: {
    position: 'absolute',
    top: 64,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#EFECE6',
    zIndex: 99,
    shadowColor: '#7C7267',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FAF8F5',
  },
  dropdownItemActive: {
    backgroundColor: '#FAF8F5',
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2C261F',
  },
  dropdownItemSub: {
    fontSize: 11,
    color: '#7C7267',
    marginTop: 2,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  submittingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  submittingText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2C261F',
    marginTop: 18,
    marginBottom: 6,
  },
  submittingSub: {
    fontSize: 12,
    color: '#7C7267',
    fontWeight: '500',
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#EFECE6',
    borderLeftWidth: 5,
    borderLeftColor: '#D97706',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#7C7267',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  statusCardSubmitted: {
    borderLeftColor: '#059669',
  },
  statusHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.0,
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
  },
  siteDetailsBox: {
    gap: 4,
  },
  siteNameText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2C261F',
  },
  clientNameText: {
    fontSize: 14,
    color: '#7C7267',
    fontWeight: '600',
  },
  dateText: {
    fontSize: 11,
    color: '#B6AEA2',
    fontWeight: '700',
    marginTop: 4,
  },
  detailSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#EFECE6',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#7C7267',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2C261F',
  },
  photoFrame: {
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EFECE6',
    backgroundColor: '#FAF8F5',
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoPlaceholder: {
    height: 120,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#EFECE6',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    padding: 20,
  },
  photoPlaceholderText: {
    fontSize: 12,
    color: '#B6AEA2',
    fontWeight: '600',
    marginTop: 6,
  },
  contactDetailsBox: {
    gap: 4,
  },
  contactNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2C261F',
  },
  contactPhoneText: {
    fontSize: 13,
    color: '#7C7267',
    fontWeight: '600',
  },
  locationDetailsBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 13,
    color: '#2C261F',
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  notesText: {
    fontSize: 13,
    color: '#7C7267',
    lineHeight: 20,
    fontWeight: '500',
  },
  actionsContainer: {
    gap: 12,
    marginTop: 8,
  },
  actionBtn: {
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  actionBtnEdit: {
    borderColor: '#EFECE6',
    backgroundColor: '#FFFFFF',
  },
  actionBtnSave: {
    backgroundColor: '#059669', // Green for saving edits
    borderColor: '#059669',
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  submitBtn: {
    height: 48,
    backgroundColor: '#8E7E6A',
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8E7E6A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  submitBtnLocked: {
    backgroundColor: '#B6AEA2',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  editFormGrid: {
    gap: 12,
  },
  editInputContainer: {
    gap: 6,
  },
  editInputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7C7267',
  },
  editInput: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1.5,
    borderColor: '#EFECE6',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    color: '#2C261F',
    fontSize: 13,
    fontWeight: '600',
  },
  editMultilineInput: {
    height: 80,
    paddingTop: 8,
  },
});

import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TextInput, 
  Pressable, 
  Alert,
  Image,
  Platform,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function CreateSurveyScreen() {
  const navigation = useNavigation();

  // Form states
  const [siteName, setSiteName] = useState('');
  const [clientName, setClientName] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  
  // Date Picker state management
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Prefill with today's date (YYYY-MM-DD)
  const [dateObject, setDateObject] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Handler to open the sidebar drawer
  const handleOpenDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  // Date selection callback
  const onChangeDate = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDateObject(selectedDate);
      const formatted = selectedDate.toISOString().split('T')[0];
      setDate(formatted);
    }
  };

  // Form submission and validation
  const handleSubmit = () => {
    // Validate required fields
    if (!siteName.trim()) {
      Alert.alert("Validation Error", "Site Name is required.");
      return;
    }
    if (!clientName.trim()) {
      Alert.alert("Validation Error", "Client Name is required.");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Validation Error", "Description is required.");
      return;
    }

    // Success confirmation
    Alert.alert(
      "Survey Created Successfully",
      `Site: ${siteName}\nClient: ${clientName}\nPriority: ${priority}\nDate: ${date}`,
      [
        {
          text: "OK",
          onPress: () => {
            // Reset form
            setSiteName('');
            setClientName('');
            setDescription('');
            setPriority('Medium');
            setDate(new Date().toISOString().split('T')[0]);
            setDateObject(new Date());
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 1. Custom App Header */}
      <View style={styles.header}>
        <Pressable onPress={handleOpenDrawer} style={styles.headerButton}>
          <Ionicons name="menu-outline" size={24} color="#8E7E6A" />
        </Pressable>
        <Text style={styles.headerTitle}>Create Survey</Text>
        <View style={styles.headerAvatar}>
          <Image 
            source={{ uri: 'https://res.cloudinary.com/dr84lv5ym/image/upload/v1784353123/ChatGPT_Image_Jul_18_2026_11_06_25_AM_skqy5i.png' }} 
            style={styles.headerAvatarImage} 
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>New Inspection Form</Text>
          <Text style={styles.formSubtitle}>Enter site information and details below to log a new survey.</Text>

          {/* Site Name Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Site Name <Text style={styles.requiredStar}>*</Text></Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="business-outline" size={18} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Metro Hub Construction"
                placeholderTextColor="#94A3B8"
                value={siteName}
                onChangeText={setSiteName}
              />
            </View>
          </View>

          {/* Client Name Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Client Name <Text style={styles.requiredStar}>*</Text></Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={18} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Apex Infra Group"
                placeholderTextColor="#94A3B8"
                value={clientName}
                onChangeText={setClientName}
              />
            </View>
          </View>

          {/* Date Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Survey Date <Text style={styles.requiredStar}>*</Text></Text>
            <Pressable onPress={() => setShowDatePicker(true)} style={styles.inputWrapper}>
              <Ionicons name="calendar-outline" size={18} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#94A3B8"
                value={date}
                editable={false}
                pointerEvents="none"
              />
            </Pressable>
          </View>

          {/* Priority Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Priority Level</Text>
            <View style={styles.priorityRow}>
              {/* High Option */}
              <Pressable 
                style={[
                  styles.priorityButton, 
                  priority === 'High' && { backgroundColor: '#FEF2F2', borderColor: '#EF4444' }
                ]}
                onPress={() => setPriority('High')}
              >
                <Text style={[styles.priorityText, priority === 'High' && { color: '#EF4444', fontWeight: '700' }]}>High</Text>
              </Pressable>

              {/* Medium Option */}
              <Pressable 
                style={[
                  styles.priorityButton, 
                  priority === 'Medium' && { backgroundColor: '#FFFBEB', borderColor: '#F59E0B' }
                ]}
                onPress={() => setPriority('Medium')}
              >
                <Text style={[styles.priorityText, priority === 'Medium' && { color: '#F59E0B', fontWeight: '700' }]}>Medium</Text>
              </Pressable>

              {/* Low Option */}
              <Pressable 
                style={[
                  styles.priorityButton, 
                  priority === 'Low' && { backgroundColor: '#ECFDF5', borderColor: '#10B981' }
                ]}
                onPress={() => setPriority('Low')}
              >
                <Text style={[styles.priorityText, priority === 'Low' && { color: '#10B981', fontWeight: '700' }]}>Low</Text>
              </Pressable>
            </View>
          </View>

          {/* Description Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Survey Description <Text style={styles.requiredStar}>*</Text></Text>
            <View style={[styles.inputWrapper, styles.multilineWrapper]}>
              <TextInput
                style={[styles.textInput, styles.multilineInput]}
                placeholder="Describe site status, hazards, inspection checklist notes..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={description}
                onChangeText={setDescription}
              />
            </View>
          </View>

          {/* Submit Button */}
          <Pressable style={styles.submitBtn} onPress={handleSubmit}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
            <Text style={styles.submitBtnText}>Submit Survey</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Cross-platform Calendar Picker Dialog */}
      {Platform.OS === 'ios' ? (
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Date</Text>
                <Pressable onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.doneButtonText}>Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={dateObject}
                mode="date"
                display="spinner"
                onChange={onChangeDate}
                textColor="#0F172A"
              />
            </View>
          </View>
        </Modal>
      ) : (
        showDatePicker && (
          <DateTimePicker
            value={dateObject}
            mode="date"
            display="default"
            onChange={onChangeDate}
          />
        )
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5', // Warm Beige Alabaster
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
  formCard: {
    backgroundColor: '#FFFFFF', // Crisp White Card
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#EFECE6',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2C261F',
    marginBottom: 6,
  },
  formSubtitle: {
    fontSize: 12,
    color: '#7C7267', // Warm Taupe description
    lineHeight: 18,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7C7267', // Warm Taupe label
    marginBottom: 8,
  },
  requiredStar: {
    color: '#EF4444',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#EFECE6',
    borderRadius: 14,
    backgroundColor: '#FAF8F5', // Light Input background
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    height: 48,
    color: '#2C261F', // Dark text input
    fontSize: 14,
    fontWeight: '500',
  },
  multilineWrapper: {
    paddingVertical: 10,
  },
  multilineInput: {
    height: 120,
  },
  priorityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  priorityButton: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#EFECE6',
    backgroundColor: '#FAF8F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  priorityText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7C7267',
  },
  submitBtn: {
    backgroundColor: '#8E7E6A', // Desert Khaki Gold
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 24,
    gap: 6,
    marginTop: 8,
    shadowColor: '#8E7E6A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(44, 38, 31, 0.4)', // Warm overlay
  },
  modalContent: {
    backgroundColor: '#FFFFFF', // Crisp White Modal
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: '#EFECE6',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1.5,
    borderBottomColor: '#EFECE6',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C261F',
  },
  doneButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#8E7E6A',
  },
});

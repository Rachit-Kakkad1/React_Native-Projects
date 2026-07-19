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
  Platform,
  Share
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Location from 'expo-location';

interface NoteClipping {
  id: string;
  text: string;
  timestamp: string;
}

export default function ClipboardScreen() {
  const navigation = useNavigation();

  // Telemetry items state
  const [surveyId, setSurveyId] = useState('');
  const [gpsCoordinates, setGpsCoordinates] = useState<string>('Acquiring lock...');
  const [sosContact, setSosContact] = useState('+1 (800) 555-SOS1');

  // Clipboard inspector state
  const [currentClipboardText, setCurrentClipboardText] = useState<string>('[Empty or unread]');

  // Field Notes paste-bin state
  const [notesText, setNotesText] = useState('');
  const [savedNotes, setSavedNotes] = useState<NoteClipping[]>([
    { 
      id: '1', 
      text: 'Site inspection completed for sector B. Foundation stability looks solid.', 
      timestamp: '12:05 PM' 
    }
  ]);

  // Visual feedback states when cards are copied
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Focus effect: Refresh current clipboard text and fetch GPS coordinates on screen focus
  useEffect(() => {
    const unsubscribeFocus = navigation.addListener('focus', () => {
      refreshClipboardText();
      fetchCurrentGps();
    });

    // Generate unique survey ID on mount
    generateSurveyId();

    return unsubscribeFocus;
  }, [navigation]);

  const handleOpenDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  // Generate unique Survey ID
  const generateSurveyId = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const randomChar = chars[Math.floor(Math.random() * chars.length)] + chars[Math.floor(Math.random() * chars.length)];
    setSurveyId(`SRV-2026-${randomNum}${randomChar}`);
  };

  // Fetch current coordinates dynamically
  const fetchCurrentGps = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setGpsCoordinates(`${loc.coords.latitude.toFixed(5)}, ${loc.coords.longitude.toFixed(5)}`);
      } else {
        setGpsCoordinates('Permissions denied');
      }
    } catch (e) {
      setGpsCoordinates('GPS unavailable');
    }
  };

  // Read string value from device clipboard
  const refreshClipboardText = async () => {
    try {
      const content = await Clipboard.getStringAsync();
      setCurrentClipboardText(content.trim() ? content : '[System Clipboard Empty]');
    } catch (err) {
      setCurrentClipboardText('[Failed to read clipboard]');
    }
  };

  // Set clipboard value with flash card feedback animation
  const copyToClipboard = async (text: string, fieldKey: string) => {
    if (!text || text.includes('Acquiring') || text.includes('unavailable')) return;

    try {
      await Clipboard.setStringAsync(text);
      setCopiedField(fieldKey);
      setCurrentClipboardText(text);

      // Trigger standard success toast
      Alert.alert(
        "Copied to Clipboard",
        `"${text.length > 30 ? text.slice(0, 30) + '...' : text}" is copied successfully.`,
        [{ text: "OK" }],
        { cancelable: true }
      );

      // Reset copied card styling highlight after 2 seconds
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      Alert.alert("Copy Error", "Unable to write text to system clipboard.");
    }
  };

  // Clear clipboard data
  const clearClipboard = async () => {
    try {
      await Clipboard.setStringAsync('');
      setCurrentClipboardText('[System Clipboard Empty]');
      Alert.alert(
        "Clipboard Wiped",
        "Your device system clipboard data has been successfully cleared.",
        [{ text: "OK" }]
      );
    } catch (err) {
      Alert.alert("Error", "Could not clear clipboard.");
    }
  };

  // Quick insertion helpers for Field Notes
  const insertField = (textToInsert: string) => {
    setNotesText(prev => (prev ? `${prev} | ${textToInsert}` : textToInsert));
  };

  const insertClipboard = async () => {
    try {
      const content = await Clipboard.getStringAsync();
      if (content.trim()) {
        insertField(content);
      } else {
        Alert.alert("Paste Alert", "Clipboard is empty.");
      }
    } catch (err) {
      Alert.alert("Paste Fail", "Unable to read clipboard details.");
    }
  };

  const insertTimestamp = () => {
    const now = new Date();
    const formatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    insertField(formatted);
  };

  // Save Notes inside active listings
  const saveNote = () => {
    if (!notesText.trim()) {
      Alert.alert("Empty Note", "Please enter comments or insert telemetry data before saving.");
      return;
    }

    const now = new Date();
    const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newNote: NoteClipping = {
      id: Date.now().toString(),
      text: notesText.trim(),
      timestamp: formattedTime
    };

    setSavedNotes(prev => [newNote, ...prev]);
    setNotesText('');
    Alert.alert("Note Logged", "Field notes successfully cataloged on board.");
  };

  // Clear all saved notes
  const clearNotesHistory = () => {
    Alert.alert(
      "Clear Notes History",
      "Are you sure you want to delete all saved notes from this board?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Wipe All", 
          style: "destructive", 
          onPress: () => setSavedNotes([]) 
        }
      ]
    );
  };

  // Delete individual note clipping
  const deleteNote = (id: string) => {
    setSavedNotes(prev => prev.filter(n => n.id !== id));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 1. Header */}
      <View style={styles.header}>
        <Pressable onPress={handleOpenDrawer} style={styles.headerButton}>
          <Ionicons name="menu-outline" size={24} color="#8E7E6A" />
        </Pressable>
        <Text style={styles.headerTitle}>Clipboard Desk</Text>
        
        {/* Clear all history notes */}
        <Pressable 
          onPress={clearNotesHistory} 
          style={[styles.headerButton, savedNotes.length === 0 && { opacity: 0.5 }]}
          disabled={savedNotes.length === 0}
        >
          <Ionicons name="trash-bin-outline" size={20} color="#EF4444" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* 2. Real-time System Clipboard Inspector Card */}
        <View style={styles.inspectorCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBg, { backgroundColor: '#F4F0E8' }]}>
              <Ionicons name="eye-outline" size={18} color="#8E7E6A" />
            </View>
            <Text style={styles.cardTitle}>Live Clipboard Monitor</Text>
          </View>

          {/* Monospace clipboard string display */}
          <View style={styles.terminalContainer}>
            <Text style={styles.terminalText} numberOfLines={2}>
              {currentClipboardText}
            </Text>
          </View>

          <View style={styles.inspectorActions}>
            <Pressable style={styles.inspectorBtn} onPress={refreshClipboardText}>
              <Ionicons name="sync-outline" size={16} color="#8E7E6A" style={{ marginRight: 4 }} />
              <Text style={styles.inspectorBtnText}>Inspect Board</Text>
            </Pressable>

            <Pressable style={[styles.inspectorBtn, { borderColor: '#FEE2E2' }]} onPress={clearClipboard}>
              <Ionicons name="close-circle-outline" size={16} color="#EF4444" style={{ marginRight: 4 }} />
              <Text style={[styles.inspectorBtnText, { color: '#EF4444' }]}>Wipe Clipboard</Text>
            </Pressable>
          </View>
        </View>

        {/* 3. Telemetry Quick-Copy Grid */}
        <Text style={styles.sectionHeader}>Quick Copy Telemetry</Text>
        <View style={styles.copyGrid}>
          {/* Survey ID Copy Card */}
          <Pressable 
            style={[
              styles.copyCard, 
              copiedField === 'surveyId' && styles.copyCardSuccess
            ]}
            onPress={() => copyToClipboard(surveyId, 'surveyId')}
          >
            <View style={styles.copyCardHeader}>
              <Text style={styles.copyCardLabel}>Active Survey ID</Text>
              <Ionicons 
                name={copiedField === 'surveyId' ? "checkmark-circle" : "copy-outline"} 
                size={16} 
                color={copiedField === 'surveyId' ? "#10B981" : "#B6AEA2"} 
              />
            </View>
            <Text style={styles.copyCardValue}>{surveyId ? surveyId : 'Generating...'}</Text>
          </Pressable>

          {/* SOS Phone Number Copy Card */}
          <Pressable 
            style={[
              styles.copyCard, 
              copiedField === 'sosNumber' && styles.copyCardSuccess
            ]}
            onPress={() => copyToClipboard(sosContact, 'sosNumber')}
          >
            <View style={styles.copyCardHeader}>
              <Text style={styles.copyCardLabel}>Emergency SOS Number</Text>
              <Ionicons 
                name={copiedField === 'sosNumber' ? "checkmark-circle" : "copy-outline"} 
                size={16} 
                color={copiedField === 'sosNumber' ? "#10B981" : "#B6AEA2"} 
              />
            </View>
            <Text style={styles.copyCardValue}>{sosContact}</Text>
          </Pressable>

          {/* GPS Coordinates Copy Card */}
          <Pressable 
            style={[
              styles.copyCard, 
              copiedField === 'gpsCoords' && styles.copyCardSuccess,
              (gpsCoordinates.includes('Acquiring') || gpsCoordinates.includes('unavailable')) && { opacity: 0.6 }
            ]}
            onPress={() => copyToClipboard(gpsCoordinates, 'gpsCoords')}
            disabled={gpsCoordinates.includes('Acquiring') || gpsCoordinates.includes('unavailable')}
          >
            <View style={styles.copyCardHeader}>
              <Text style={styles.copyCardLabel}>Current GPS Coordinates</Text>
              <Ionicons 
                name={copiedField === 'gpsCoords' ? "checkmark-circle" : "copy-outline"} 
                size={16} 
                color={copiedField === 'gpsCoords' ? "#10B981" : "#B6AEA2"} 
              />
            </View>
            <Text style={styles.copyCardValue}>{gpsCoordinates}</Text>
          </Pressable>
        </View>

        {/* 4. Interactive Field Notes Paste-Bin */}
        <View style={styles.pasteBinCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBg, { backgroundColor: '#F4F0E8' }]}>
              <Ionicons name="document-text-outline" size={18} color="#8E7E6A" />
            </View>
            <Text style={styles.cardTitle}>Field Notes logger</Text>
          </View>

          <View style={styles.notesInputContainer}>
            <TextInput
              style={styles.notesInput}
              placeholder="Write site survey notes or use quick-insert tools below..."
              placeholderTextColor="#B6AEA2"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={notesText}
              onChangeText={setNotesText}
            />
          </View>

          {/* Quick-insert toolbar */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolbarScroll}>
            {/* Paste Board */}
            <Pressable style={styles.toolbarItem} onPress={insertClipboard}>
              <Ionicons name="clipboard-outline" size={14} color="#8E7E6A" />
              <Text style={styles.toolbarText}>Paste Clipboard</Text>
            </Pressable>

            {/* GPS insert */}
            <Pressable 
              style={[styles.toolbarItem, gpsCoordinates.includes('Acquiring') && { opacity: 0.6 }]} 
              onPress={() => !gpsCoordinates.includes('Acquiring') && insertField(gpsCoordinates)}
              disabled={gpsCoordinates.includes('Acquiring')}
            >
              <Ionicons name="location-outline" size={14} color="#8E7E6A" />
              <Text style={styles.toolbarText}>Insert GPS</Text>
            </Pressable>

            {/* SOS insert */}
            <Pressable style={styles.toolbarItem} onPress={() => insertField(sosContact)}>
              <Ionicons name="alert-circle-outline" size={14} color="#8E7E6A" />
              <Text style={styles.toolbarText}>Insert SOS</Text>
            </Pressable>

            {/* Timestamp insert */}
            <Pressable style={styles.toolbarItem} onPress={insertTimestamp}>
              <Ionicons name="time-outline" size={14} color="#8E7E6A" />
              <Text style={styles.toolbarText}>Insert Time</Text>
            </Pressable>
          </ScrollView>

          {/* Submit Note button */}
          <Pressable style={styles.saveNoteBtn} onPress={saveNote}>
            <Ionicons name="save-outline" size={18} color="#FFFFFF" />
            <Text style={styles.saveNoteBtnText}>Log Saved Note</Text>
          </Pressable>
        </View>

        {/* 5. Saved Clippings History Scroll */}
        {savedNotes.length > 0 && (
          <View style={styles.notesHistoryContainer}>
            <Text style={styles.sectionHeader}>Saved Note Clippings ({savedNotes.length})</Text>
            <View style={styles.notesList}>
              {savedNotes.map((note) => (
                <View key={note.id} style={styles.noteClippingCard}>
                  <View style={styles.noteClippingHeader}>
                    <View style={styles.noteTimeContainer}>
                      <Ionicons name="time-outline" size={12} color="#7C7267" style={{ marginRight: 4 }} />
                      <Text style={styles.noteTimeText}>{note.timestamp}</Text>
                    </View>
                    
                    <View style={styles.noteActions}>
                      {/* Copy note back */}
                      <Pressable 
                        style={styles.noteIconAction} 
                        onPress={() => copyToClipboard(note.text, `note-${note.id}`)}
                      >
                        <Ionicons name="copy-outline" size={14} color="#8E7E6A" />
                      </Pressable>
                      
                      {/* Delete note */}
                      <Pressable 
                        style={styles.noteIconAction} 
                        onPress={() => deleteNote(note.id)}
                      >
                        <Ionicons name="trash-outline" size={14} color="#EF4444" />
                      </Pressable>
                    </View>
                  </View>
                  <Text style={styles.noteBodyText}>{note.text}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
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
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  inspectorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#EFECE6',
    padding: 16,
    marginBottom: 20,
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
    fontSize: 15,
    fontWeight: '700',
    color: '#2C261F',
  },
  terminalContainer: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFECE6',
    borderRadius: 12,
    padding: 14,
    minHeight: 64,
    justifyContent: 'center',
    marginBottom: 14,
  },
  terminalText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    fontWeight: '700',
    color: '#7C7267',
  },
  inspectorActions: {
    flexDirection: 'row',
    gap: 10,
  },
  inspectorBtn: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EFECE6',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inspectorBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E7E6A',
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B6AEA2',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  copyGrid: {
    gap: 10,
    marginBottom: 20,
  },
  copyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#EFECE6',
    padding: 14,
    shadowColor: '#7C7267',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 1,
  },
  copyCardSuccess: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  copyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  copyCardLabel: {
    fontSize: 11,
    color: '#7C7267',
    fontWeight: '700',
  },
  copyCardValue: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14,
    fontWeight: '800',
    color: '#2C261F',
  },
  pasteBinCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#EFECE6',
    padding: 16,
    marginBottom: 24,
    shadowColor: '#7C7267',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  notesInputContainer: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1.5,
    borderColor: '#EFECE6',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  notesInput: {
    height: 100,
    color: '#2C261F',
    fontSize: 14,
    fontWeight: '500',
  },
  toolbarScroll: {
    gap: 8,
    paddingBottom: 6,
    marginBottom: 14,
  },
  toolbarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFECE6',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 4,
  },
  toolbarText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7C7267',
  },
  saveNoteBtn: {
    backgroundColor: '#8E7E6A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 22,
    gap: 6,
    shadowColor: '#8E7E6A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  saveNoteBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  notesHistoryContainer: {
    gap: 12,
  },
  notesList: {
    gap: 10,
  },
  noteClippingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#EFECE6',
    padding: 14,
  },
  noteClippingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noteTimeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7C7267',
  },
  noteActions: {
    flexDirection: 'row',
    gap: 10,
  },
  noteIconAction: {
    padding: 2,
  },
  noteBodyText: {
    fontSize: 13,
    color: '#2C261F',
    lineHeight: 18,
    fontWeight: '500',
  },
});

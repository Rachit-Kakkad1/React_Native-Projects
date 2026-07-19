import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Pressable, 
  Alert, 
  Image, 
  ActivityIndicator, 
  TextInput,
  FlatList,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  Modal,
  Share
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Contacts from 'expo-contacts';
import * as Clipboard from 'expo-clipboard';

export default function ContactsScreen() {
  const navigation = useNavigation();

  // Permissions and contacts state
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [allContacts, setAllContacts] = useState<any[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'ENGINEER' | 'INSPECTOR' | 'CLIENT'>('ALL');
  
  // Favorites and Blocked list states (stored by contact ID)
  const [favoritesList, setFavoritesList] = useState<string[]>([]);
  const [blockedList, setBlockedList] = useState<string[]>([]);
  const [showBlockedSection, setShowBlockedSection] = useState(false);

  // SOS Emergency Contact ID
  const [emergencyContactId, setEmergencyContactId] = useState<string | null>(null);

  // Expanded contact ID to display actions drawer
  const [expandedContactId, setExpandedContactId] = useState<string | null>(null);

  // Contact Creation Form Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newJobTitle, setNewJobTitle] = useState('Inspector'); // Mapped category

  // Alphabet list for letter filter tabs
  const alphabet = ["ALL", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")];

  useEffect(() => {
    checkPermissionStatus();
  }, []);

  const handleOpenDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  // Query device permissions
  const checkPermissionStatus = async () => {
    const { status } = await Contacts.getPermissionsAsync();
    setPermissionGranted(status === 'granted');
    if (status === 'granted') {
      loadContacts();
    }
  };

  const handleRequestPermission = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    setPermissionGranted(status === 'granted');
    if (status === 'granted') {
      loadContacts();
    }
  };

  // Query contacts from phone address book
  const loadContacts = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    
    try {
      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Image,
          Contacts.Fields.FirstName,
          Contacts.Fields.LastName,
          Contacts.Fields.JobTitle,
          Contacts.Fields.Emails,
        ],
      });

      if (data) {
        // Sort contacts alphabetically
        const sorted = data.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        setAllContacts(sorted);
        filterAndSearch(sorted, searchQuery, activeLetter, activeCategory, blockedList);
      }
    } catch (e) {
      Alert.alert("Permission Error", "Unable to read phone contacts.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Apply search, alphabetical filter, job category, and blocked constraints
  const filterAndSearch = (
    contacts: any[], 
    query: string, 
    letter: string | null, 
    category: 'ALL' | 'ENGINEER' | 'INSPECTOR' | 'CLIENT',
    blocked: string[]
  ) => {
    let result = [...contacts];

    // 1. Filter out blocked contacts from active directory
    result = result.filter(c => !blocked.includes(c.id));

    // 2. Filter by starting letter
    if (letter && letter !== "ALL") {
      result = result.filter(c => c.name && c.name.toUpperCase().startsWith(letter));
    }

    // 3. Filter by Category mapping (based on jobTitle keywords)
    if (category !== 'ALL') {
      result = result.filter(c => {
        const job = (c.jobTitle || '').toUpperCase();
        if (category === 'ENGINEER') return job.includes('ENGINEER') || job.includes('DEV') || job.includes('ARCHITECT');
        if (category === 'INSPECTOR') return job.includes('INSPECTOR') || job.includes('SURVEYOR') || job.includes('AUDITOR');
        if (category === 'CLIENT') return job.includes('CLIENT') || job.includes('OWNER') || job.includes('MANAGER');
        return true;
      });
    }

    // 4. Filter by query string
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(c => {
        const nameMatch = c.name && c.name.toLowerCase().includes(q);
        const numberMatch = c.phoneNumbers && c.phoneNumbers.some((p: any) => p.number && p.number.includes(q));
        return nameMatch || numberMatch;
      });
    }

    setFilteredContacts(result);
  };

  // Handle live search
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    filterAndSearch(allContacts, text, activeLetter, activeCategory, blockedList);
  };

  // Handle alphabetical letter selector
  const selectLetter = (letter: string) => {
    const selected = letter === "ALL" ? null : letter;
    setActiveLetter(selected);
    filterAndSearch(allContacts, searchQuery, selected, activeCategory, blockedList);
  };

  // Handle job category selector
  const selectCategory = (category: 'ALL' | 'ENGINEER' | 'INSPECTOR' | 'CLIENT') => {
    setActiveCategory(category);
    filterAndSearch(allContacts, searchQuery, activeLetter, category, blockedList);
  };

  // Star Favorites Pin toggle
  const toggleFavorite = (id: string) => {
    setFavoritesList(prev => {
      if (prev.includes(id)) {
        return prev.filter(fId => fId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Block a surveyor
  const blockContact = (id: string, name: string) => {
    Alert.alert(
      "Block Surveyor",
      `Are you sure you want to block ${name}? They will be hidden from your active list.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Block", 
          style: "destructive", 
          onPress: () => {
            const updatedBlocked = [...blockedList, id];
            setBlockedList(updatedBlocked);
            // Auto un-favorite if blocked
            setFavoritesList(prev => prev.filter(fId => fId !== id));
            // Auto remove from SOS if blocked
            if (emergencyContactId === id) setEmergencyContactId(null);
            setExpandedContactId(null);
            filterAndSearch(allContacts, searchQuery, activeLetter, activeCategory, updatedBlocked);
          } 
        }
      ]
    );
  };

  // Unblock a surveyor
  const unblockContact = (id: string) => {
    const updatedBlocked = blockedList.filter(bId => bId !== id);
    setBlockedList(updatedBlocked);
    filterAndSearch(allContacts, searchQuery, activeLetter, activeCategory, updatedBlocked);
  };

  // Copy contact details
  const copyNumber = async (number: string) => {
    try {
      await Clipboard.setStringAsync(number);
      Alert.alert("Copied Number", `${number} has been copied to your clipboard.`);
    } catch (e) {
      Alert.alert("Copy Failed", "Unable to copy contact number.");
    }
  };

  // Call contact via native dialer
  const handleCall = (number: string) => {
    Linking.openURL(`tel:${number}`).catch(() => {
      Alert.alert("Failed", "Unable to launch system dialer.");
    });
  };

  // SMS messaging
  const handleSms = (number: string) => {
    Linking.openURL(`sms:${number}`).catch(() => {
      Alert.alert("Failed", "Unable to launch SMS composer.");
    });
  };

  // Deep link chat directly on WhatsApp
  const handleWhatsApp = async (number: string) => {
    const cleanPhone = number.replace(/[^\d+]/g, '');
    const url = `whatsapp://send?phone=${cleanPhone}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        // Fallback to web chat if native WhatsApp is absent
        await Linking.openURL(`https://wa.me/${cleanPhone}`);
      }
    } catch (err) {
      Alert.alert("WhatsApp Fail", "Could not trigger WhatsApp link.");
    }
  };

  // Email contact with subject template
  const handleEmail = (email: string, name: string) => {
    Linking.openURL(`mailto:${email}?subject=Site%20Survey%20Reference&body=Hello%20${encodeURIComponent(name)},`).catch(() => {
      Alert.alert("Failed", "Unable to launch email composer.");
    });
  };

  // Export card info via Sharing API
  const handleShare = async (name: string, phone: string, jobTitle: string) => {
    try {
      await Share.share({
        message: `Inspector Contact Card:\nName: ${name}\nRole: ${jobTitle || 'Field Surveyor'}\nPhone: ${phone || 'N/A'}\nLog Source: Survey App`,
      });
    } catch (error) {
      Alert.alert("Share Failed", "Could not export contact card details.");
    }
  };

  // Set / Remove SOS Contact
  const toggleSOS = (id: string, name: string, phone: string) => {
    if (emergencyContactId === id) {
      setEmergencyContactId(null);
      Alert.alert("SOS Removed", `${name} is no longer your emergency contact.`);
    } else {
      if (!phone) {
        Alert.alert("SOS Error", "Cannot set a contact with no phone number as SOS.");
        return;
      }
      setEmergencyContactId(id);
      Alert.alert("SOS Set", `${name} has been set as your primary emergency contact.`);
    }
  };

  // Write new contact to the device's native address book
  const handleCreateContact = async () => {
    if (!newFirstName.trim()) {
      Alert.alert("Input Error", "Please provide a first name.");
      return;
    }
    if (!newPhone.trim()) {
      Alert.alert("Input Error", "Please provide a phone number.");
      return;
    }

    try {
      const contactObj = {
        [Contacts.Fields.FirstName]: newFirstName,
        [Contacts.Fields.LastName]: newLastName,
        [Contacts.Fields.PhoneNumbers]: [{ label: 'mobile', number: newPhone }],
        [Contacts.Fields.JobTitle]: newJobTitle,
        [Contacts.Fields.Emails]: newEmail ? [{ label: 'work', email: newEmail }] : [],
      };

      const newContactId = await Contacts.addContactAsync(contactObj as any);
      if (newContactId) {
        Alert.alert("Contact Created", `${newFirstName} has been saved directly to your phone contacts!`);
        // Reset state
        setNewFirstName('');
        setNewLastName('');
        setNewPhone('');
        setNewEmail('');
        setNewJobTitle('Inspector');
        setShowCreateModal(false);
        // Sync local list
        loadContacts();
      } else {
        Alert.alert("Sync Error", "Could not save contact to device database.");
      }
    } catch (err) {
      Alert.alert("Creation Failed", "Device denied contact creation request.");
    }
  };

  const getAvatarBadgeBg = (name: string) => {
    const code = name.charCodeAt(0) || 0;
    const colors = ['#E6DFD3', '#D6CDBB', '#CBBFA9', '#BCAE95', '#AF9F82', '#A29170'];
    return colors[code % colors.length];
  };

  // Render surveyor list card item
  const renderContactItem = ({ item }: { item: any }) => {
    const hasImage = !!item.imageAvailable && !!item.image?.uri;
    const hasPhone = !!item.phoneNumbers && item.phoneNumbers.length > 0;
    const primaryNumber = hasPhone ? item.phoneNumbers![0].number : null;
    const isExpanded = expandedContactId === item.id;
    const isFavorite = favoritesList.includes(item.id);
    const isSos = emergencyContactId === item.id;
    
    // Email checking
    const hasEmail = !!item.emails && item.emails.length > 0;
    const primaryEmail = hasEmail ? item.emails[0].email : null;

    // Get initials fallback
    const initials = item.name 
      ? item.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
      : '?';

    return (
      <View style={[styles.contactCard, isExpanded && styles.contactCardExpanded, isSos && styles.contactCardSosGlow]}>
        <Pressable 
          style={styles.contactHeaderRow}
          onPress={() => setExpandedContactId(isExpanded ? null : item.id)}
        >
          {/* Contact Avatar Image or Initials badge */}
          {hasImage ? (
            <Image source={{ uri: item.image?.uri }} style={styles.contactAvatar} />
          ) : (
            <View style={[styles.contactAvatarBadge, { backgroundColor: getAvatarBadgeBg(item.name || 'A') }]}>
              <Text style={styles.contactAvatarBadgeText}>{initials}</Text>
            </View>
          )}

          {/* Name & Primary Number details */}
          <View style={styles.contactInfo}>
            <View style={styles.nameHeaderRow}>
              <Text style={styles.contactName}>{item.name}</Text>
              {isSos && (
                <View style={styles.sosTag}>
                  <Text style={styles.sosTagText}>SOS</Text>
                </View>
              )}
            </View>
            <View style={styles.roleRow}>
              {item.jobTitle ? (
                <Text style={styles.jobTitleText} numberOfLines={1}>{item.jobTitle}</Text>
              ) : null}
              <Text style={[styles.contactPhone, !primaryNumber && styles.contactPhoneEmpty]}>
                {primaryNumber ? primaryNumber : 'No Number'}
              </Text>
            </View>
          </View>

          {/* Star Icon for Favorites Pinned toggle */}
          <Pressable style={styles.favoriteButton} onPress={() => toggleFavorite(item.id)}>
            <Ionicons 
              name={isFavorite ? "star" : "star-outline"} 
              size={20} 
              color={isFavorite ? "#8E7E6A" : "#B6AEA2"} 
            />
          </Pressable>
        </Pressable>

        {/* Expandable options drawer */}
        {isExpanded && (
          <View style={styles.optionsDrawer}>
            <View style={styles.cardDivider} />
            <View style={styles.actionsRow}>
              {/* Call button */}
              <Pressable 
                style={[styles.actionBtn, !primaryNumber && styles.actionBtnDisabled]}
                disabled={!primaryNumber}
                onPress={() => primaryNumber && handleCall(primaryNumber)}
              >
                <View style={[styles.actionIconBg, { backgroundColor: '#FAF8F5' }]}>
                  <Ionicons name="call" size={16} color="#8E7E6A" />
                </View>
                <Text style={styles.actionBtnText}>Call</Text>
              </Pressable>

              {/* Message button */}
              <Pressable 
                style={[styles.actionBtn, !primaryNumber && styles.actionBtnDisabled]}
                disabled={!primaryNumber}
                onPress={() => primaryNumber && handleSms(primaryNumber)}
              >
                <View style={[styles.actionIconBg, { backgroundColor: '#FAF8F5' }]}>
                  <Ionicons name="chatbubble-ellipses" size={16} color="#8E7E6A" />
                </View>
                <Text style={styles.actionBtnText}>SMS</Text>
              </Pressable>

              {/* WhatsApp button */}
              <Pressable 
                style={[styles.actionBtn, !primaryNumber && styles.actionBtnDisabled]}
                disabled={!primaryNumber}
                onPress={() => primaryNumber && handleWhatsApp(primaryNumber)}
              >
                <View style={[styles.actionIconBg, { backgroundColor: '#FAF8F5' }]}>
                  <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
                </View>
                <Text style={styles.actionBtnText}>WhatsApp</Text>
              </Pressable>
            </View>

            <View style={[styles.actionsRow, { marginTop: 8 }]}>
              {/* Email button */}
              <Pressable 
                style={[styles.actionBtn, !primaryEmail && styles.actionBtnDisabled]}
                disabled={!primaryEmail}
                onPress={() => primaryEmail && handleEmail(primaryEmail, item.name)}
              >
                <View style={[styles.actionIconBg, { backgroundColor: '#FAF8F5' }]}>
                  <Ionicons name="mail" size={16} color="#8E7E6A" />
                </View>
                <Text style={styles.actionBtnText}>Email</Text>
              </Pressable>

              {/* Set SOS toggle button */}
              <Pressable 
                style={[styles.actionBtn, isSos ? { borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' } : { borderColor: '#EFECE6' }]}
                onPress={() => toggleSOS(item.id, item.name, primaryNumber || '')}
              >
                <View style={[styles.actionIconBg, { backgroundColor: isSos ? '#FCA5A5' : '#FAF8F5' }]}>
                  <Ionicons name={isSos ? "alert-circle" : "alert-circle-outline"} size={16} color={isSos ? "#DC2626" : "#7C7267"} />
                </View>
                <Text style={[styles.actionBtnText, isSos && { color: '#DC2626' }]}>{isSos ? 'SOS Set' : 'Set SOS'}</Text>
              </Pressable>

              {/* Share button */}
              <Pressable 
                style={styles.actionBtn}
                onPress={() => handleShare(item.name, primaryNumber || '', item.jobTitle || '')}
              >
                <View style={[styles.actionIconBg, { backgroundColor: '#FAF8F5' }]}>
                  <Ionicons name="share-social" size={16} color="#8E7E6A" />
                </View>
                <Text style={styles.actionBtnText}>Share</Text>
              </Pressable>
            </View>

            {/* Block Button Row */}
            <View style={[styles.actionsRow, { marginTop: 8 }]}>
              <Pressable 
                style={[styles.actionBtn, { borderColor: '#FEE2E2', backgroundColor: '#FEF2F2', flex: 1 }]}
                onPress={() => blockContact(item.id, item.name)}
              >
                <View style={[styles.actionIconBg, { backgroundColor: '#FEE2E2' }]}>
                  <Ionicons name="ban-outline" size={16} color="#EF4444" />
                </View>
                <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Block Reference</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    );
  };

  const favoritesContactsList = allContacts.filter(c => favoritesList.includes(c.id));
  const blockedContactsList = allContacts.filter(c => blockedList.includes(c.id));
  const emergencyContact = allContacts.find(c => c.id === emergencyContactId);

  // Loading state
  if (permissionGranted === null) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8E7E6A" />
        <Text style={styles.loadingText}>Verifying address book permissions...</Text>
      </SafeAreaView>
    );
  }

  // Permission denied state
  if (!permissionGranted) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={handleOpenDrawer} style={styles.headerButton}>
            <Ionicons name="menu-outline" size={24} color="#8E7E6A" />
          </Pressable>
          <Text style={styles.headerTitle}>Contacts List</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.permissionContent}>
          <View style={styles.permissionIconBadge}>
            <Ionicons name="people-outline" size={48} color="#8E7E6A" />
          </View>
          <Text style={styles.permissionTitle}>Contacts Permission Required</Text>
          <Text style={styles.permissionSubtitle}>
            We require access to your native address book to display site contacts, log inspection reference names, and tag inspectors.
          </Text>
          <Pressable style={styles.permissionBtn} onPress={handleRequestPermission}>
            <Text style={styles.permissionBtnText}>Authorize Access</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 1. Header */}
      <View style={styles.header}>
        <Pressable onPress={handleOpenDrawer} style={styles.headerButton}>
          <Ionicons name="menu-outline" size={24} color="#8E7E6A" />
        </Pressable>
        <Text style={styles.headerTitle}>Contacts Database</Text>
        
        {/* Trigger Create Contact Modal button */}
        <Pressable onPress={() => setShowCreateModal(true)} style={styles.createTriggerButton}>
          <Ionicons name="add" size={22} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* 2. Search Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color="#7C7267" style={styles.searchIcon} />
          <TextInput
            placeholder="Search by name or number..."
            placeholderTextColor="#B6AEA2"
            value={searchQuery}
            onChangeText={handleSearch}
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={16} color="#B6AEA2" />
            </Pressable>
          )}
        </View>

        {/* 2.1 Category Pills list */}
        <View style={styles.categoryPillRow}>
          <Pressable 
            style={[styles.catPill, activeCategory === 'ALL' && styles.catPillActive]}
            onPress={() => selectCategory('ALL')}
          >
            <Text style={[styles.catPillText, activeCategory === 'ALL' && styles.catPillTextActive]}>All</Text>
          </Pressable>
          <Pressable 
            style={[styles.catPill, activeCategory === 'ENGINEER' && styles.catPillActive]}
            onPress={() => selectCategory('ENGINEER')}
          >
            <Text style={[styles.catPillText, activeCategory === 'ENGINEER' && styles.catPillTextActive]}>Engineers</Text>
          </Pressable>
          <Pressable 
            style={[styles.catPill, activeCategory === 'INSPECTOR' && styles.catPillActive]}
            onPress={() => selectCategory('INSPECTOR')}
          >
            <Text style={[styles.catPillText, activeCategory === 'INSPECTOR' && styles.catPillTextActive]}>Inspectors</Text>
          </Pressable>
          <Pressable 
            style={[styles.catPill, activeCategory === 'CLIENT' && styles.catPillActive]}
            onPress={() => selectCategory('CLIENT')}
          >
            <Text style={[styles.catPillText, activeCategory === 'CLIENT' && styles.catPillTextActive]}>Clients</Text>
          </Pressable>
        </View>

        {/* 2.2 Letter filter bar */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.letterScroll}
          style={styles.letterList}
        >
          {alphabet.map((letter) => {
            const isSelected = (activeLetter === null && letter === "ALL") || (activeLetter === letter);
            return (
              <Pressable 
                key={letter} 
                onPress={() => selectLetter(letter)}
                style={[styles.letterPill, isSelected && styles.letterPillActive]}
              >
                <Text style={[styles.letterText, isSelected && styles.letterTextActive]}>
                  {letter}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. Main directory FlatList */}
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#8E7E6A" />
          <Text style={styles.loaderText}>Acquiring survey references...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredContacts}
          keyExtractor={(item: any) => item.id}
          renderItem={renderContactItem}
          contentContainerStyle={styles.listScrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={isRefreshing} 
              onRefresh={() => loadContacts(true)}
              tintColor="#8E7E6A"
              colors={["#8E7E6A"]}
            />
          }
          ListHeaderComponent={
            <>
              {/* Pulsing Emergency SOS Call Panel */}
              {emergencyContact ? (
                <View style={styles.sosDialCard}>
                  <View style={styles.sosDialHeader}>
                    <View style={styles.sosBadgeDot} />
                    <Text style={styles.sosDialTitle}>EMERGENCY SOS SPEED DIAL</Text>
                  </View>
                  
                  <View style={styles.sosBodyRow}>
                    <View style={styles.sosInfo}>
                      <Text style={styles.sosName}>{emergencyContact.name}</Text>
                      <Text style={styles.sosPhone}>
                        {emergencyContact.phoneNumbers && emergencyContact.phoneNumbers.length > 0 
                          ? emergencyContact.phoneNumbers[0].number 
                          : 'No Number'}
                      </Text>
                    </View>
                    
                    {/* Pulsing Red button to trigger SOS Call */}
                    <Pressable 
                      style={styles.sosCallBtn}
                      onPress={() => {
                        const num = emergencyContact.phoneNumbers?.[0]?.number;
                        if (num) handleCall(num);
                      }}
                    >
                      <Ionicons name="call" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.sosCallText}>CALL SOS</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <View style={styles.sosInfoBanner}>
                  <Ionicons name="alert-circle-outline" size={16} color="#D97706" style={{ marginRight: 6 }} />
                  <Text style={styles.sosInfoBannerText}>
                    No SOS Contact. Expand any contact card below and select "Set SOS".
                  </Text>
                </View>
              )}

              {/* Pinned Favorites Bubble stories row */}
              {favoritesContactsList.length > 0 && (
                <View style={styles.favoritesSection}>
                  <Text style={styles.sectionHeader}>Pinned Surveyors</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.favScroll}>
                    {favoritesContactsList.map((c) => {
                      const hasImage = !!c.imageAvailable && !!c.image?.uri;
                      const initials = c.name 
                        ? c.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                        : '?';

                      return (
                        <Pressable 
                          key={c.id} 
                          onPress={() => setExpandedContactId(expandedContactId === c.id ? null : c.id)}
                          style={styles.favBubbleContainer}
                        >
                          <View style={styles.favBubbleRing}>
                            {hasImage ? (
                              <Image source={{ uri: c.image?.uri }} style={styles.favBubbleAvatar} />
                            ) : (
                              <View style={[styles.favBubbleAvatarBadge, { backgroundColor: getAvatarBadgeBg(c.name || 'F') }]}>
                                <Text style={styles.favBubbleAvatarText}>{initials}</Text>
                              </View>
                            )}
                            <View style={styles.starPinBadge}>
                              <Ionicons name="star" size={10} color="#FFFFFF" />
                            </View>
                          </View>
                          <Text style={styles.favBubbleName} numberOfLines={1}>{c.firstName || c.name?.split(' ')[0]}</Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* Main Directory references header */}
              {filteredContacts.length > 0 && (
                <Text style={[styles.sectionHeader, { marginTop: 10 }]}>All Directory References ({filteredContacts.length})</Text>
              )}
            </>
          }
          ListFooterComponent={
            <>
              {/* Blocked references section layout */}
              {blockedContactsList.length > 0 && (
                <View style={styles.blockedSection}>
                  <Pressable 
                    style={styles.blockedSectionHeader}
                    onPress={() => setShowBlockedSection(prev => !prev)}
                  >
                    <View style={styles.blockedHeaderLeft}>
                      <Ionicons name="ban-outline" size={18} color="#EF4444" />
                      <Text style={styles.blockedHeaderText}>Blocked Surveyors ({blockedList.length})</Text>
                    </View>
                    <Ionicons 
                      name={showBlockedSection ? "chevron-up" : "chevron-down"} 
                      size={18} 
                      color="#7C7267" 
                    />
                  </Pressable>

                  {showBlockedSection && (
                    <View style={styles.blockedContactsList}>
                      {blockedContactsList.map((c) => (
                        <View key={c.id} style={styles.blockedContactRow}>
                          <Text style={styles.blockedContactName}>{c.name}</Text>
                          <Pressable 
                            style={styles.unblockBtn}
                            onPress={() => unblockContact(c.id)}
                          >
                            <Ionicons name="checkmark-circle-outline" size={14} color="#059669" style={{ marginRight: 4 }} />
                            <Text style={styles.unblockBtnText}>Unblock</Text>
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color="#B6AEA2" />
              <Text style={styles.emptyTitle}>No Contacts Found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery || activeLetter || activeCategory !== 'ALL'
                  ? "We couldn't find any matches. Try adjusting your query or filters." 
                  : "Address book database is empty."}
              </Text>
            </View>
          }
        />
      )}

      {/* 4. Create Contact Modal Form */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Surveyor Profile</Text>
              <Pressable onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color="#2C261F" />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.formContainer} showsVerticalScrollIndicator={false}>
              {/* First Name Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>First Name <Text style={styles.requiredStar}>*</Text></Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter first name..."
                    placeholderTextColor="#B6AEA2"
                    value={newFirstName}
                    onChangeText={setNewFirstName}
                  />
                </View>
              </View>

              {/* Last Name Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Last Name</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter last name..."
                    placeholderTextColor="#B6AEA2"
                    value={newLastName}
                    onChangeText={setNewLastName}
                  />
                </View>
              </View>

              {/* Phone Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Phone Number <Text style={styles.requiredStar}>*</Text></Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter phone number..."
                    placeholderTextColor="#B6AEA2"
                    keyboardType="phone-pad"
                    value={newPhone}
                    onChangeText={setNewPhone}
                  />
                </View>
              </View>

              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter email address..."
                    placeholderTextColor="#B6AEA2"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={newEmail}
                    onChangeText={setNewEmail}
                  />
                </View>
              </View>

              {/* Job Title Category Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Role Designation</Text>
                <View style={styles.roleSelectionContainer}>
                  {['Inspector', 'Engineer', 'Client'].map((role) => (
                    <Pressable
                      key={role}
                      style={[styles.roleSelectBtn, newJobTitle === role && styles.roleSelectBtnActive]}
                      onPress={() => setNewJobTitle(role)}
                    >
                      <Text style={[styles.roleSelectText, newJobTitle === role && styles.roleSelectTextActive]}>
                        {role}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Submit button */}
              <Pressable style={styles.submitBtn} onPress={handleCreateContact}>
                <Ionicons name="checkmark-sharp" size={20} color="#FFFFFF" />
                <Text style={styles.submitBtnText}>Create reference</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#7C7267',
    fontWeight: '600',
    marginTop: 12,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loaderText: {
    fontSize: 13,
    color: '#7C7267',
    fontWeight: '600',
    marginTop: 12,
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
  createTriggerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8E7E6A', // Gold create button
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8E7E6A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C261F',
    letterSpacing: 0.4,
  },
  permissionContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  permissionIconBadge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#EFECE6',
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2C261F',
    marginBottom: 10,
    textAlign: 'center',
  },
  permissionSubtitle: {
    fontSize: 14,
    color: '#7C7267',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 28,
  },
  permissionBtn: {
    backgroundColor: '#8E7E6A',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 24,
    shadowColor: '#8E7E6A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  permissionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  searchSection: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1.5,
    borderBottomColor: '#EFECE6',
    paddingTop: 12,
    paddingBottom: 8,
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
  categoryPillRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 10,
    gap: 8,
  },
  catPill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  catPillActive: {
    backgroundColor: '#FAF8F5',
    borderColor: '#8E7E6A',
  },
  catPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7C7267',
  },
  catPillTextActive: {
    color: '#8E7E6A',
  },
  letterList: {
    marginTop: 8,
  },
  letterScroll: {
    paddingHorizontal: 16,
    gap: 8,
    height: 32,
  },
  letterPill: {
    paddingHorizontal: 12,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  letterPillActive: {
    backgroundColor: '#8E7E6A',
    borderColor: '#8E7E6A',
  },
  letterText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7C7267',
  },
  letterTextActive: {
    color: '#FFFFFF',
  },
  listScrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sosDialCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    padding: 14,
    marginBottom: 16,
  },
  sosDialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
  },
  sosBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  sosDialTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#991B1B',
    letterSpacing: 1.0,
  },
  sosBodyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sosInfo: {
    flex: 1,
  },
  sosName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#991B1B',
    marginBottom: 2,
  },
  sosPhone: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
  },
  sosCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  sosCallText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sosInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
  },
  sosInfoBannerText: {
    fontSize: 11,
    color: '#B45309',
    fontWeight: '600',
    flex: 1,
  },
  favoritesSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B6AEA2',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  favScroll: {
    gap: 14,
    paddingLeft: 4,
  },
  favBubbleContainer: {
    alignItems: 'center',
    width: 68,
  },
  favBubbleRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: '#8E7E6A',
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  favBubbleAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
  },
  favBubbleAvatarBadge: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favBubbleAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  starPinBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#8E7E6A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  favBubbleName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2C261F',
    marginTop: 6,
    textAlign: 'center',
  },
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#EFECE6',
    padding: 12,
    marginBottom: 10,
    shadowColor: '#7C7267',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 1,
  },
  contactCardExpanded: {
    borderColor: '#8E7E6A',
  },
  contactCardSosGlow: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FFF8F8',
  },
  contactHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  contactAvatarBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactAvatarBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  contactInfo: {
    marginLeft: 14,
    flex: 1,
  },
  nameHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  sosTag: {
    backgroundColor: '#DC2626',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  sosTagText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  contactName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2C261F',
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  jobTitleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E7E6A',
    backgroundColor: '#F4F0E8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  contactPhone: {
    fontSize: 12,
    color: '#7C7267',
    fontWeight: '500',
  },
  contactPhoneEmpty: {
    color: '#EF4444',
    fontStyle: 'italic',
  },
  favoriteButton: {
    padding: 8,
  },
  optionsDrawer: {
    marginTop: 10,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#EFECE6',
    marginBottom: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    borderWidth: 1,
    borderColor: '#EFECE6',
    borderRadius: 12,
    gap: 6,
  },
  actionBtnDisabled: {
    opacity: 0.4,
  },
  actionIconBg: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2C261F',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2C261F',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#7C7267',
    textAlign: 'center',
    lineHeight: 18,
  },
  blockedSection: {
    marginTop: 20,
    borderWidth: 1.5,
    borderColor: '#FEE2E2',
    backgroundColor: '#FFF5F5',
    borderRadius: 16,
    overflow: 'hidden',
  },
  blockedSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  blockedHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  blockedHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EF4444',
  },
  blockedContactsList: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 8,
  },
  blockedContactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FEE2E2',
  },
  blockedContactName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
  },
  unblockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  unblockBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(44, 38, 31, 0.4)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    borderWidth: 1.5,
    borderColor: '#EFECE6',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1.5,
    borderBottomColor: '#EFECE6',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2C261F',
  },
  formContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  inputContainer: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7C7267',
    marginBottom: 8,
  },
  requiredStar: {
    color: '#EF4444',
  },
  inputWrapper: {
    borderWidth: 1.5,
    borderColor: '#EFECE6',
    borderRadius: 14,
    backgroundColor: '#FAF8F5',
    paddingHorizontal: 14,
    height: 48,
    justifyContent: 'center',
  },
  textInput: {
    color: '#2C261F',
    fontSize: 14,
    fontWeight: '500',
  },
  roleSelectionContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  roleSelectBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#EFECE6',
    backgroundColor: '#FAF8F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleSelectBtnActive: {
    borderColor: '#8E7E6A',
  },
  roleSelectText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7C7267',
  },
  roleSelectTextActive: {
    color: '#8E7E6A',
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: '#8E7E6A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 24,
    gap: 6,
    marginTop: 10,
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
});

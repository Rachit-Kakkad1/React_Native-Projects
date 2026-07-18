import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Pressable, 
  Alert, 
  ActivityIndicator, 
  ScrollView,
  Dimensions,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Clipboard from 'expo-clipboard';
import MapView, { Marker } from 'react-native-maps';

export default function LocationScreen() {
  const navigation = useNavigation();

  // Location and permissions state
  const [permissionStatus, requestPermission] = Location.useForegroundPermissions();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-fetch location if permission is already granted
  useEffect(() => {
    if (permissionStatus?.granted) {
      refreshLocation();
    }
  }, [permissionStatus]);

  // Handler to open the sidebar drawer
  const handleOpenDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  // Fetch coordinates on-demand
  const refreshLocation = async () => {
    setIsRefreshing(true);
    setErrorMsg(null);
    try {
      // Ensure we request permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Location permission was denied by the user.');
        return;
      }

      // Fetch current coordinates with Balanced accuracy for efficiency
      const currentLoc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation(currentLoc);
    } catch (e) {
      setErrorMsg('Failed to fetch location. Please ensure device GPS is enabled.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Copy coordinates string to Clipboard
  const copyToClipboard = async () => {
    if (!location) return;

    const { latitude, longitude, accuracy } = location.coords;
    const locationString = `Latitude: ${latitude.toFixed(6)}, Longitude: ${longitude.toFixed(6)} (Accuracy: ±${accuracy?.toFixed(1)}m)`;
    
    try {
      await Clipboard.setStringAsync(locationString);
      Alert.alert(
        "Location Copied",
        "GPS coordinates have been successfully copied to your clipboard.",
        [{ text: "OK" }]
      );
    } catch (err) {
      Alert.alert("Copy Failed", "Unable to copy location coordinates.");
    }
  };

  // If permission is loading
  if (!permissionStatus) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8E7E6A" />
        <Text style={styles.loadingText}>Verifying GPS permissions...</Text>
      </SafeAreaView>
    );
  }

  // If permission is denied/not granted
  if (!permissionStatus.granted) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={handleOpenDrawer} style={styles.headerButton}>
            <Ionicons name="menu-outline" size={24} color="#8E7E6A" />
          </Pressable>
          <Text style={styles.headerTitle}>Location Services</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.permissionContent}>
          <View style={styles.permissionIconBadge}>
            <Ionicons name="location-outline" size={48} color="#8E7E6A" />
          </View>
          <Text style={styles.permissionTitle}>GPS Permission Required</Text>
          <Text style={styles.permissionSubtitle}>
            This module requires active location services to tag site coordinates, map inspect points, and verify survey accuracy.
          </Text>
          <Pressable style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>Enable Location</Text>
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
        <Text style={styles.headerTitle}>GPS Mapping</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 2. Embedded Map Card */}
        <View style={styles.mapCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBg, { backgroundColor: '#F4F0E8' }]}>
              <Ionicons name="map-outline" size={20} color="#8E7E6A" />
            </View>
            <Text style={styles.cardTitle}>Live Location Map</Text>
          </View>

          {/* Map view region */}
          <View style={styles.mapWrapper}>
            {location ? (
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                  latitudeDelta: 0.00922,
                  longitudeDelta: 0.00421,
                }}
                region={{
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                  latitudeDelta: 0.00922,
                  longitudeDelta: 0.00421,
                }}
                showsUserLocation={true}
              >
                <Marker
                  coordinate={{
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                  }}
                  title="Current Position"
                  description="Site survey coordinate point"
                />
              </MapView>
            ) : (
              <View style={styles.mapPlaceholder}>
                {isRefreshing ? (
                  <ActivityIndicator size="small" color="#8E7E6A" />
                ) : (
                  <Ionicons name="compass-outline" size={40} color="#B6AEA2" />
                )}
                <Text style={styles.mapPlaceholderText}>
                  {isRefreshing ? "Acquiring satellite lock..." : "Location coordinates unavailable."}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* 3. Coordinates Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBg, { backgroundColor: '#F4F0E8' }]}>
              <Ionicons name="locate-outline" size={20} color="#8E7E6A" />
            </View>
            <Text style={styles.cardTitle}>Telemetry Readings</Text>
          </View>

          {errorMsg && (
            <View style={styles.errorBanner}>
              <Ionicons name="warning-outline" size={16} color="#EF4444" style={{ marginRight: 6 }} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          {/* Coordinates grid values */}
          <View style={styles.coordinatesGrid}>
            {/* Latitude field */}
            <View style={styles.coordinateRow}>
              <Text style={styles.coordinateLabel}>Latitude</Text>
              <View style={styles.coordinateValueWrapper}>
                <Text style={styles.coordinateValue}>
                  {location ? location.coords.latitude.toFixed(6) : "—"}
                </Text>
              </View>
            </View>

            {/* Longitude field */}
            <View style={styles.coordinateRow}>
              <Text style={styles.coordinateLabel}>Longitude</Text>
              <View style={styles.coordinateValueWrapper}>
                <Text style={styles.coordinateValue}>
                  {location ? location.coords.longitude.toFixed(6) : "—"}
                </Text>
              </View>
            </View>
          </View>

          {/* Accuracy Badge indicator */}
          <View style={styles.cardDivider} />
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>GPS Accuracy</Text>
            {location ? (
              <View style={styles.accuracyBadge}>
                <Text style={styles.accuracyBadgeText}>
                  ±{location.coords.accuracy?.toFixed(1)} meters
                </Text>
              </View>
            ) : (
              <Text style={styles.metaValue}>Uncalibrated</Text>
            )}
          </View>
        </View>

        {/* 4. Telemetry Actions Footer */}
        <View style={styles.actionsContainer}>
          {/* Refresh GPS Button */}
          <Pressable 
            style={[styles.refreshBtn, isRefreshing && { opacity: 0.8 }]} 
            onPress={refreshLocation}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 6 }} />
            ) : (
              <Ionicons name="refresh-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            )}
            <Text style={styles.refreshBtnText}>
              {isRefreshing ? "Refreshing..." : "Refresh Location"}
            </Text>
          </Pressable>

          {/* Copy Coordinates Button */}
          <Pressable 
            style={[styles.copyBtn, !location && { opacity: 0.6 }]} 
            onPress={copyToClipboard}
            disabled={!location}
          >
            <Ionicons name="copy-outline" size={18} color="#8E7E6A" style={{ marginRight: 6 }} />
            <Text style={styles.copyBtnText}>Copy Coordinates</Text>
          </Pressable>
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
  header: {
    flexDirection: 'row',
    height: 64,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1.5,
    borderBottomColor: '#EFECE6', // Soft Sand border line
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
    color: '#2C261F', // Charcoal Coffee Title text
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
    backgroundColor: '#F4F0E8',
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
    backgroundColor: '#8E7E6A', // Warm Beige Gold primary accent
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
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  mapCard: {
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
  mapWrapper: {
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EFECE6',
    backgroundColor: '#FAF8F5',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  mapPlaceholderText: {
    fontSize: 13,
    color: '#B6AEA2',
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  detailsCard: {
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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },
  coordinatesGrid: {
    gap: 12,
  },
  coordinateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coordinateLabel: {
    fontSize: 13,
    color: '#7C7267',
    fontWeight: '600',
  },
  coordinateValueWrapper: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFECE6',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    minWidth: 140,
    alignItems: 'flex-end',
  },
  coordinateValue: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 13,
    fontWeight: '700',
    color: '#2C261F',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#EFECE6',
    marginVertical: 14,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 13,
    color: '#7C7267',
    fontWeight: '600',
  },
  metaValue: {
    fontSize: 13,
    color: '#B6AEA2',
    fontWeight: '600',
  },
  accuracyBadge: {
    backgroundColor: '#F4F0E8',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  accuracyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E7E6A',
  },
  actionsContainer: {
    gap: 12,
  },
  refreshBtn: {
    height: 48,
    backgroundColor: '#8E7E6A',
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8E7E6A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  refreshBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  copyBtn: {
    height: 48,
    backgroundColor: '#F4F0E8',
    borderWidth: 1.5,
    borderColor: '#EFECE6',
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  copyBtnText: {
    color: '#2C261F',
    fontSize: 15,
    fontWeight: '700',
  },
});

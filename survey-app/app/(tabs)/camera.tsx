import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Pressable, 
  Alert, 
  Image, 
  ActivityIndicator, 
  Platform,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, FlashMode } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { Accelerometer } from 'expo-sensors';

interface CapturedPhoto {
  uri: string;
  time: string;
}

export default function CameraScreen() {
  const navigation = useNavigation();
  const cameraRef = useRef<CameraView>(null);

  // Camera permissions
  const [permission, requestPermission] = useCameraPermissions();
  // Media library permissions
  const [libraryPermission, requestMediaPermission] = MediaLibrary.usePermissions({ writeOnly: true });

  // Camera settings
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  // Advanced camera controllers
  const [flash, setFlash] = useState<FlashMode>('off');
  const [zoom, setZoom] = useState(0);
  const [showGrid, setShowGrid] = useState(false);

  // Accelerometer tilt state
  const [accelData, setAccelData] = useState({ x: 0, y: 0, z: 0 });
  const [sensorSubscription, setSensorSubscription] = useState<any>(null);

  // Capture states
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
  const [captureTime, setCaptureTime] = useState<string | null>(null);

  // Session Capture History
  const [capturedPhotosList, setCapturedPhotosList] = useState<CapturedPhoto[]>([]);

  // Focus effect: Reset capture preview and subscribe to sensors on screen focus
  useEffect(() => {
    const unsubscribeFocus = navigation.addListener('focus', () => {
      setCapturedPhotoUri(null);
      setCaptureTime(null);
      setIsCameraReady(false);
      subscribeSensors();
    });

    const unsubscribeBlur = navigation.addListener('blur', () => {
      unsubscribeSensors();
    });

    return () => {
      unsubscribeFocus();
      unsubscribeBlur();
      unsubscribeSensors();
    };
  }, [navigation, sensorSubscription]);

  // Subscribe to Accelerometer sensor
  const subscribeSensors = () => {
    if (sensorSubscription) return;
    Accelerometer.setUpdateInterval(100); // 10 samples per second
    const sub = Accelerometer.addListener(data => {
      setAccelData(data);
    });
    setSensorSubscription(sub);
  };

  // Unsubscribe from Accelerometer sensor
  const unsubscribeSensors = () => {
    if (sensorSubscription) {
      sensorSubscription.remove();
      setSensorSubscription(null);
    }
  };

  // Calculate Roll & Pitch in degrees
  const getTiltAngles = () => {
    const { x, y, z } = accelData;
    // Calculate roll and pitch in radians then convert to degrees
    const roll = Math.atan2(y, z) * (180 / Math.PI);
    const pitch = Math.atan2(-x, Math.sqrt(y * y + z * z)) * (180 / Math.PI);
    return {
      roll: isNaN(roll) ? 0 : roll,
      pitch: isNaN(pitch) ? 0 : pitch
    };
  };

  const { roll, pitch } = getTiltAngles();
  // Perfectly level status (threshold of 2 degrees on roll and pitch)
  const isLevel = Math.abs(roll) < 2 && Math.abs(pitch) < 2;

  // Toggle flash modes
  const cycleFlash = () => {
    setFlash(current => {
      if (current === 'off') return 'on';
      if (current === 'on') return 'auto';
      return 'off';
    });
  };

  // Toggle camera direction
  const toggleFacing = () => {
    setIsCameraReady(false);
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  // Trigger snapshot capture
  const takePicture = async () => {
    if (!cameraRef.current || isCapturing) return;

    try {
      setIsCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });

      if (photo?.uri) {
        const now = new Date();
        const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        const newPhotoItem: CapturedPhoto = { uri: photo.uri, time: formattedTime };
        setCapturedPhotosList(prev => [newPhotoItem, ...prev]);

        setCapturedPhotoUri(photo.uri);
        setCaptureTime(formattedTime);

        // Save to gallery
        try {
          let hasPermission = libraryPermission?.granted;
          if (!hasPermission) {
            const permissionResponse = await requestMediaPermission();
            hasPermission = permissionResponse.granted;
          }

          if (hasPermission) {
            await MediaLibrary.saveToLibraryAsync(photo.uri);
          }
        } catch (saveError) {
          console.warn("MediaLibrary Save Failed", saveError);
        }
      }
    } catch (error) {
      Alert.alert("Capture Error", "Failed to take photo. Please try again.");
    } finally {
      setIsCapturing(false);
    }
  };

  // Delete captured photo with confirmation alert
  const handleDeletePhoto = (photoUriToDelete: string) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this captured photo permanently?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: () => {
            setCapturedPhotosList(prev => prev.filter(p => p.uri !== photoUriToDelete));
            if (capturedPhotoUri === photoUriToDelete) {
              setCapturedPhotoUri(null);
              setCaptureTime(null);
              setIsCameraReady(false);
            }
          } 
        }
      ]
    );
  };

  function onCameraReady() {
    setIsCameraReady(true);
  }

  const handleOpenDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  // Permission loading status
  if (!permission) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8E7E6A" />
        <Text style={styles.loadingText}>Verifying camera permissions...</Text>
      </SafeAreaView>
    );
  }

  // Permission denied state
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={handleOpenDrawer} style={styles.headerButton}>
            <Ionicons name="menu-outline" size={24} color="#8E7E6A" />
          </Pressable>
          <Text style={styles.headerTitle}>Camera Access</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.permissionContent}>
          <View style={styles.permissionIconBadge}>
            <Ionicons name="camera-outline" size={48} color="#8E7E6A" />
          </View>
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionSubtitle}>
            We need access to your camera stream to capture site photos, report inspections, and log hazards.
          </Text>
          <Pressable style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>Enable Camera</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 3. Photo Preview screen */}
      {capturedPhotoUri ? (
        <View style={styles.previewContainer}>
          <View style={styles.header}>
            <View style={{ width: 40 }} />
            <Text style={styles.headerTitle}>Photo Preview</Text>
            <Pressable 
              onPress={() => {
                setCapturedPhotoUri(null);
                setCaptureTime(null);
                setIsCameraReady(false);
              }} 
              style={styles.headerExitButton}
            >
              <Ionicons name="close-outline" size={24} color="#EF4444" />
            </Pressable>
          </View>

          <View style={styles.imageWrapper}>
            <Image source={{ uri: capturedPhotoUri }} style={styles.previewImage} />
            {captureTime && (
              <View style={styles.timeBadge}>
                <Ionicons name="time-outline" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.timeBadgeText}>Captured: {captureTime}</Text>
              </View>
            )}
          </View>

          <View style={styles.previewFooterCard}>
            <Text style={styles.previewInfoTitle}>Inspection Asset Captured</Text>
            <Text style={styles.previewInfoSubtitle}>
              Successfully saved to your phone gallery. Ensure it captures the site elements clearly.
            </Text>

            {capturedPhotosList.length > 1 && (
              <View style={styles.previewHistorySection}>
                <Text style={styles.historyTitle}>Other Session Captures</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.historyScroll}>
                  {capturedPhotosList.map((item) => {
                    const isSelected = item.uri === capturedPhotoUri;
                    return (
                      <Pressable 
                        key={item.uri} 
                        onPress={() => {
                          setCapturedPhotoUri(item.uri);
                          setCaptureTime(item.time);
                        }}
                        style={[styles.thumbnailWrapper, isSelected && styles.thumbnailWrapperSelected]}
                      >
                        <Image source={{ uri: item.uri }} style={styles.thumbnailImage} />
                        <Text style={styles.thumbnailTime}>{item.time.split(':')[0]}:{item.time.split(':')[1]}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            <View style={styles.actionsRow}>
              <Pressable style={styles.deleteBtn} onPress={() => handleDeletePhoto(capturedPhotoUri)}>
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                <Text style={styles.deleteBtnText}>Delete</Text>
              </Pressable>

              <Pressable 
                style={styles.retakeBtn} 
                onPress={() => {
                  setCapturedPhotoUri(null);
                  setCaptureTime(null);
                  setIsCameraReady(false);
                }}
              >
                <Ionicons name="refresh-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.retakeBtnText}>Retake</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : (
        // 4. Live Camera Stream Layout
        <View style={styles.cameraViewport}>
          <View style={styles.header}>
            <Pressable onPress={handleOpenDrawer} style={styles.headerButton}>
              <Ionicons name="menu-outline" size={24} color="#8E7E6A" />
            </Pressable>
            <Text style={styles.headerTitle}>Camera View</Text>
            <Pressable onPress={() => navigation.navigate('index' as never)} style={styles.headerExitButton}>
              <Ionicons name="close-outline" size={24} color="#EF4444" />
            </Pressable>
          </View>

          <View style={styles.cameraWrapper}>
            <CameraView 
              ref={cameraRef}
              style={styles.cameraView} 
              facing={facing}
              flash={flash}
              zoom={zoom}
              onCameraReady={onCameraReady}
            />

            {/* Spinner loading indicator while lens mounts */}
            {!isCameraReady && (
              <View style={styles.lensLoadingOverlay}>
                <ActivityIndicator size="large" color="#8E7E6A" />
                <Text style={styles.lensLoadingText}>Activating Camera Lens...</Text>
              </View>
            )}

            {/* 4.1. Rule-of-Thirds Grid Overlay */}
            {isCameraReady && showGrid && (
              <View style={styles.gridOverlayContainer} pointerEvents="none">
                <View style={styles.gridLineHorizontal} />
                <View style={[styles.gridLineHorizontal, { top: '66.6%' }]} />
                <View style={styles.gridLineVertical} />
                <View style={[styles.gridLineVertical, { left: '66.6%' }]} />
              </View>
            )}

            {/* 4.2. Advanced Bubble Level & Monospace Readings Overlay */}
            {isCameraReady && (
              <View style={styles.horizonOverlay} pointerEvents="none">
                {/* Bubble Level Gauge */}
                <View style={[styles.levelOuterCircle, isLevel && styles.levelOuterCircleSuccess]}>
                  {/* Static Crosshair indicators */}
                  <View style={styles.crosshairHorizontal} />
                  <View style={styles.crosshairVertical} />
                  
                  {/* Dynamic Moving Bubble dot based on raw Accelerometer x & y */}
                  <View 
                    style={[
                      styles.levelBubbleDot,
                      isLevel && styles.levelBubbleDotSuccess,
                      {
                        transform: [
                          { translateX: accelData.x * 25 },
                          { translateY: -accelData.y * 25 }
                        ]
                      }
                    ]} 
                  />
                </View>

                {/* Telemetry Tilt display */}
                <View style={styles.telemetryBadge}>
                  <Text style={[styles.telemetryText, isLevel && styles.telemetryTextSuccess]}>
                    ROLL: {roll.toFixed(1)}° | PITCH: {pitch.toFixed(1)}°
                  </Text>
                </View>
              </View>
            )}

            {/* 4.3. HUD Overlay Controls */}
            {isCameraReady && (
              <View style={styles.hudOverlay}>
                {/* Top Toolbar panel */}
                <View style={styles.topHudToolbar}>
                  {/* Flash toggle */}
                  <Pressable style={styles.hudIconBtn} onPress={cycleFlash}>
                    <Ionicons 
                      name={
                        flash === 'on' 
                          ? "flash" 
                          : flash === 'auto' 
                            ? "flash-sharp" 
                            : "flash-off"
                      } 
                      size={20} 
                      color="#FFFFFF" 
                    />
                    <Text style={styles.hudBtnLabel}>{flash.toUpperCase()}</Text>
                  </Pressable>

                  {/* Grid Toggle */}
                  <Pressable 
                    style={[styles.hudIconBtn, showGrid && styles.hudIconBtnActive]} 
                    onPress={() => setShowGrid(prev => !prev)}
                  >
                    <Ionicons name="grid-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.hudBtnLabel}>GRID</Text>
                  </Pressable>
                </View>

                <View style={styles.bottomHudContainer}>
                  {/* Zoom controls pill */}
                  <View style={styles.zoomContainer}>
                    <Pressable 
                      style={[styles.zoomPill, zoom === 0 && styles.zoomPillActive]} 
                      onPress={() => setZoom(0)}
                    >
                      <Text style={[styles.zoomText, zoom === 0 && { color: '#000000' }]}>1X</Text>
                    </Pressable>
                    <Pressable 
                      style={[styles.zoomPill, zoom === 0.2 && styles.zoomPillActive]} 
                      onPress={() => setZoom(0.2)}
                    >
                      <Text style={[styles.zoomText, zoom === 0.2 && { color: '#000000' }]}>2X</Text>
                    </Pressable>
                  </View>

                  {/* Session Capture History Reel */}
                  {capturedPhotosList.length > 0 && (
                    <View style={styles.historyContainer}>
                      <Text style={styles.historyTitle}>Session Capture History ({capturedPhotosList.length})</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.historyScroll}>
                        {capturedPhotosList.map((item) => (
                          <Pressable 
                            key={item.uri} 
                            onPress={() => {
                              setCapturedPhotoUri(item.uri);
                              setCaptureTime(item.time);
                            }}
                            style={styles.thumbnailWrapper}
                          >
                            <Image source={{ uri: item.uri }} style={styles.thumbnailImage} />
                            <Text style={styles.thumbnailTime}>{item.time.split(':')[0]}:{item.time.split(':')[1]}</Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  {/* Shutter controls */}
                  <View style={styles.controlsRow}>
                    <View style={styles.sideHudButtonPlaceholder} />

                    {/* Shutter Button */}
                    <Pressable 
                      style={({ pressed }) => [
                        styles.shutterBtnOuter,
                        pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] }
                      ]} 
                      onPress={takePicture}
                      disabled={isCapturing}
                    >
                      <View style={styles.shutterBtnInner} />
                    </Pressable>

                    {/* Lens Flip Button */}
                    <Pressable style={styles.lensFlipBtn} onPress={toggleFacing}>
                      <Ionicons name="camera-reverse-outline" size={26} color="#FFFFFF" />
                    </Pressable>
                  </View>
                </View>
              </View>
            )}
          </View>
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
  headerExitButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C261F',
    letterSpacing: 0.4,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#FAF8F5',
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
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 3,
  },
  permissionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  previewContainer: {
    flex: 1,
  },
  imageWrapper: {
    flex: 1,
    backgroundColor: '#090D16',
    margin: 16,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#EFECE6',
    position: 'relative',
    shadowColor: '#7C7267',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  timeBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  timeBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  previewFooterCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    borderTopWidth: 1.5,
    borderTopColor: '#EFECE6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 8,
  },
  previewInfoTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2C261F',
    marginBottom: 4,
  },
  previewInfoSubtitle: {
    fontSize: 12,
    color: '#7C7267',
    lineHeight: 18,
    marginBottom: 16,
  },
  previewHistorySection: {
    marginBottom: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderWidth: 1.5,
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
    borderRadius: 24,
    gap: 6,
  },
  deleteBtnText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '700',
  },
  retakeBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    backgroundColor: '#8E7E6A',
    borderRadius: 24,
    gap: 6,
    shadowColor: '#8E7E6A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  retakeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  cameraViewport: {
    flex: 1,
  },
  cameraWrapper: {
    flex: 1,
    backgroundColor: '#000000',
    margin: 16,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#334155',
    position: 'relative',
  },
  cameraView: {
    flex: 1,
  },
  lensLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FAF8F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lensLoadingText: {
    fontSize: 14,
    color: '#7C7267',
    fontWeight: '600',
    marginTop: 12,
  },
  gridOverlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gridLineHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    top: '33.3%',
  },
  gridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    left: '33.3%',
  },
  horizonOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 160,
    height: 160,
    marginLeft: -80,
    marginTop: -80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelOuterCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  levelOuterCircleSuccess: {
    borderColor: '#10B981',
    borderStyle: 'solid',
    borderWidth: 2,
  },
  crosshairHorizontal: {
    position: 'absolute',
    width: 12,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  crosshairVertical: {
    position: 'absolute',
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  levelBubbleDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#F59E0B',
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  levelBubbleDotSuccess: {
    backgroundColor: '#10B981',
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  telemetryBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  telemetryText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  telemetryTextSuccess: {
    color: '#10B981',
  },
  hudOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    padding: 20,
  },
  topHudToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hudIconBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  hudIconBtnActive: {
    backgroundColor: '#8E7E6A',
    borderColor: '#FFFFFF',
  },
  hudBtnLabel: {
    fontSize: 8,
    color: '#FFFFFF',
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: 0.3,
  },
  bottomHudContainer: {
    width: '100%',
    gap: 16,
  },
  zoomContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 20,
    padding: 4,
    alignSelf: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  zoomPill: {
    width: 36,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomPillActive: {
    backgroundColor: '#FFFFFF',
  },
  zoomText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  historyContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 18,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 236, 230, 0.5)',
  },
  historyTitle: {
    fontSize: 10,
    color: '#7C7267',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  historyScroll: {
    gap: 10,
  },
  thumbnailWrapper: {
    width: 54,
    height: 68,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    backgroundColor: '#000000',
    alignItems: 'center',
  },
  thumbnailWrapperSelected: {
    borderColor: '#8E7E6A',
    borderWidth: 2,
  },
  thumbnailImage: {
    width: '100%',
    height: 46,
    resizeMode: 'cover',
  },
  thumbnailTime: {
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: '700',
    marginTop: 3,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  sideHudButtonPlaceholder: {
    width: 48,
  },
  shutterBtnOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  shutterBtnInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
  },
  lensFlipBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
});

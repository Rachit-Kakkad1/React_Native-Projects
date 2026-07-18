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
  Modal,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';

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

  // Capture states
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
  const [captureTime, setCaptureTime] = useState<string | null>(null);

  // Session Capture History
  const [capturedPhotosList, setCapturedPhotosList] = useState<CapturedPhoto[]>([]);

  // Focus effect: Clear active preview when navigating back to Camera tab
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setCapturedPhotoUri(null);
      setCaptureTime(null);
      setIsCameraReady(false);
    });
    return unsubscribe;
  }, [navigation]);

  // Handler to open the sidebar drawer
  const handleOpenDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  // Flip camera lens
  const toggleFacing = () => {
    setIsCameraReady(false);
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  // Capture a photo
  const takePicture = async () => {
    if (!cameraRef.current || isCapturing) return;

    try {
      setIsCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });

      if (photo?.uri) {
        // Formulate current time
        const now = new Date();
        const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        // Add to history list (prepend to show latest first)
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
            // Remove from history list
            setCapturedPhotosList(prev => prev.filter(p => p.uri !== photoUriToDelete));
            
            // If the deleted photo is currently selected in preview, close the preview
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

  // Camera Ready state callback
  const onCameraReady = () => {
    setIsCameraReady(true);
  };

  // 1. Permission status loading
  if (!permission) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Verifying camera permissions...</Text>
      </SafeAreaView>
    );
  }

  // 2. Permission not granted state
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={handleOpenDrawer} style={styles.headerButton}>
            <Ionicons name="menu-outline" size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.headerTitle}>Camera Access</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.permissionContent}>
          <View style={styles.permissionIconBadge}>
            <Ionicons name="camera-outline" size={48} color="#3B82F6" />
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
      {/* 3. Photo Preview Screen Overlay */}
      {capturedPhotoUri ? (
        <View style={styles.previewContainer}>
          {/* Preview Header with Exit button to dismiss preview */}
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

          {/* Captured Image Viewport */}
          <View style={styles.imageWrapper}>
            <Image source={{ uri: capturedPhotoUri }} style={styles.previewImage} />
            
            {/* Timestamp Badge overlay */}
            {captureTime && (
              <View style={styles.timeBadge}>
                <Ionicons name="time-outline" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.timeBadgeText}>Captured: {captureTime}</Text>
              </View>
            )}
          </View>

          {/* Action Footer card */}
          <View style={styles.previewFooterCard}>
            <Text style={styles.previewInfoTitle}>Inspection Asset Captured</Text>
            <Text style={styles.previewInfoSubtitle}>
              Successfully saved to your phone gallery. Ensure it captures the site elements clearly.
            </Text>

            {/* History reel shown on preview screen as well so user can switch images */}
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
              {/* Delete Button */}
              <Pressable style={styles.deleteBtn} onPress={() => handleDeletePhoto(capturedPhotoUri)}>
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                <Text style={styles.deleteBtnText}>Delete</Text>
              </Pressable>

              {/* Retake Button */}
              <Pressable 
                style={styles.retakeBtn} 
                onPress={() => {
                  setCapturedPhotoUri(null);
                  setCaptureTime(null);
                  setIsCameraReady(false);
                }}
              >
                <Ionicons name="refresh-outline" size={18} color="#FFFFFF" />
                <Text style={styles.retakeBtnText}>Retake</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : (
        // 4. Live Camera Stream Layout
        <View style={styles.cameraViewport}>
          {/* Camera Header - Exit button redirects to Dashboard */}
          <View style={styles.header}>
            <Pressable onPress={handleOpenDrawer} style={styles.headerButton}>
              <Ionicons name="menu-outline" size={24} color="#FFFFFF" />
            </Pressable>
            <Text style={styles.headerTitle}>Camera View</Text>
            <Pressable onPress={() => navigation.navigate('index' as never)} style={styles.headerExitButton}>
              <Ionicons name="close-outline" size={24} color="#EF4444" />
            </Pressable>
          </View>

          {/* Camera Stream Viewport */}
          <View style={styles.cameraWrapper}>
            <CameraView 
              ref={cameraRef}
              style={styles.cameraView} 
              facing={facing}
              onCameraReady={onCameraReady}
            />

            {/* Spinner loading indicator while lens mounts */}
            {!isCameraReady && (
              <View style={styles.lensLoadingOverlay}>
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text style={styles.lensLoadingText}>Activating Camera Lens...</Text>
              </View>
            )}

            {/* Live Camera Overlays (HUD Controls positioned absolutely to prevent Metro Warnings) */}
            {isCameraReady && (
              <View style={styles.hudOverlay}>
                {/* Top lens guide description */}
                <View style={styles.lensGuideContainer}>
                  <Text style={styles.lensGuideText}>Align site target within the frame</Text>
                </View>

                <View style={styles.bottomHudContainer}>
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

                  {/* Shutter Controls segment */}
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
    backgroundColor: '#040712', // Midnight Obsidian
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#040712',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    height: 64,
    backgroundColor: '#070A13', // Midnight Obsidian Header
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1.5,
    borderBottomColor: '#1E293B',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0B0F1C',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
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
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#040712',
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
    backgroundColor: '#0B0F1C',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#1E293B',
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  permissionSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 28,
  },
  permissionBtn: {
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 24,
    shadowColor: '#3B82F6',
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
    backgroundColor: '#090D16', // Dark frame background
    margin: 16,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#1E293B',
    position: 'relative',
    shadowColor: '#3B82F6', // Sleek neon shadow halo
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
    backgroundColor: '#0B0F1C', // Midnight Obsidian Card
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    borderTopWidth: 1.5,
    borderTopColor: '#1E293B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 8,
  },
  previewInfoTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  previewInfoSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
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
    backgroundColor: '#3B82F6', // Upgraded to brand blue for primary confirmation
    borderRadius: 24,
    gap: 6,
    shadowColor: '#3B82F6',
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
    backgroundColor: '#070A13', // Obsidian loader background
    justifyContent: 'center',
    alignItems: 'center',
  },
  lensLoadingText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 12,
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
  lensGuideContainer: {
    alignSelf: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  lensGuideText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  bottomHudContainer: {
    width: '100%',
    gap: 16,
  },
  historyContainer: {
    backgroundColor: 'rgba(7, 11, 22, 0.8)', // Translucent obsidian
    borderRadius: 18,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  historyTitle: {
    fontSize: 10,
    color: '#94A3B8',
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
    borderColor: '#3B82F6', // Highlight selected preview thumbnail
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

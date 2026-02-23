import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  Dimensions,
  ScrollView,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useSelector, useDispatch } from "react-redux";
import { Video } from "expo-av";
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";

// Redux & Utils
import { updateVideoProgress } from "../redux/VideoProgressSlice";
import { decryptFile } from "../utils/DownloadManager";

const { width } = Dimensions.get('window');

const OfflinePlayer = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { videoId } = route.params;

  // Refs
  const videoRef = useRef(null);
  const lastPositionRef = useRef(0);
  const watchedMillisRef = useRef(0);
  const idleTimerRef = useRef(null);

  // State
  const [decryptedUri, setDecryptedUri] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isIdle, setIsIdle] = useState(false);
  const [localWatchedMillis, setLocalWatchedMillis] = useState(0);
  const [totalDurationMillis, setTotalDurationMillis] = useState(0);
  const [shouldResume, setShouldResume] = useState(true);

  // Selectors
  const videoData = useSelector((state) =>
    state.downloads.videos.find((v) => v.id === videoId)
  );
  const savedProgress = useSelector(state => 
    state.videoProgress.progressByVideo[videoId]
  );

  // --- 1. Inactivity Logic ---
  const resetIdleTimer = useCallback(() => {
    if (isIdle) {
      setIsIdle(false);
      videoRef.current?.playAsync();
    }
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    
    // 10 second idle window for offline learning
    idleTimerRef.current = setTimeout(() => {
      setIsIdle(true);
      videoRef.current?.pauseAsync();
    }, 10000);
  }, [isIdle]);

  // --- 2. Decryption & Setup ---
  useEffect(() => {
    let tempPath = null;

    const prepareVideo = async () => {
      if (!videoData?.localUri) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const result = await decryptFile(videoData.localUri);
        if (result) {
          tempPath = result;
          setDecryptedUri(result);
        }
      } catch (error) {
        Alert.alert("Security Error", "Could not verify secure video signature.");
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    prepareVideo();

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (tempPath) {
        FileSystem.deleteAsync(tempPath, { idempotent: true })
          .catch(err => console.log("Cleanup error:", err));
      }
    };
  }, [videoData]);

  // --- 3. Playback Handlers ---
  const onPlaybackStatusUpdate = (status) => {
    if (!status.isLoaded) return;

    if (status.durationMillis) setTotalDurationMillis(status.durationMillis);

    if (status.isPlaying) {
      resetIdleTimer(); // Keep resetting while playing
      const diff = status.positionMillis - lastPositionRef.current;
      if (diff > 0 && diff < 1500) {
        watchedMillisRef.current += diff;
        setLocalWatchedMillis(watchedMillisRef.current);
      }

      // Sync to Redux every ~3 seconds
      const currentSeconds = Math.floor(watchedMillisRef.current / 1000);
      const lastSavedSeconds = savedProgress?.watchedSeconds || 0;

      if (currentSeconds > lastSavedSeconds + 3) {
        dispatch(updateVideoProgress({
          videoId,
          watchedSeconds: currentSeconds,
          totalDuration: Math.floor(status.durationMillis / 1000),
          lastPosition: status.positionMillis
        }));
      }
    }
    lastPositionRef.current = status.positionMillis;
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#bb86fc" />
        <Text style={styles.statusText}>Initializing Secure Vault...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent />

      {/* Video Player Section */}
      <View style={styles.videoWrapper}>
        <Video
          ref={videoRef}
          source={{ uri: decryptedUri }}
          style={styles.video}
          useNativeControls={!isIdle}
          resizeMode="contain"
          shouldPlay={!isIdle}
          progressUpdateIntervalMillis={500}
          onPlaybackStatusUpdate={onPlaybackStatusUpdate}
          onLoad={() => {
            const target = savedProgress?.lastPosition || 0;
            if (shouldResume && target > 0) videoRef.current?.setPositionAsync(target);
            setShouldResume(false);
          }}
        />

        {/* Floating Back Button */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <BlurView intensity={20} tint="light" style={styles.backBtnBlur}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </BlurView>
        </TouchableOpacity>

        {/* Inactivity Blur Overlay */}
        {isIdle && (
          <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={resetIdleTimer}>
            <BlurView intensity={95} tint="dark" style={StyleSheet.absoluteFill}>
              <View style={styles.idleContent}>
                <Ionicons name="eye-off-outline" size={60} color="#bb86fc" />
                <Text style={styles.idleTitle}>Active Learning Paused</Text>
                <Text style={styles.idleSub}>Tap the screen to continue your lesson</Text>
              </View>
            </BlurView>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Progress Tracker Card */}
        <View style={styles.premiumCard}>
          <View style={styles.cardHeader}>
            <View style={styles.glowPoint} />
            <Text style={styles.cardTitle}>SESSION PROGRESS</Text>
            <View style={styles.offlineTag}>
              <Text style={styles.offlineTagText}>ENCRYPTED</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {totalDurationMillis > 0 ? Math.round((localWatchedMillis / totalDurationMillis) * 100) : 0}%
              </Text>
              <Text style={styles.statLabel}>COMPLETED</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {Math.floor(localWatchedMillis / 60000)}m {Math.floor((localWatchedMillis % 60000) / 1000)}s
              </Text>
              <Text style={styles.statLabel}>RETAINED</Text>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <LinearGradient
              colors={['#bb86fc', '#7c3aed']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.progressFill,
                { width: `${totalDurationMillis > 0 ? (localWatchedMillis / totalDurationMillis) * 100 : 0}%` }
              ]}
            />
          </View>
        </View>

        {/* Video Info Section */}
        <View style={styles.detailsSection}>
          <View style={styles.secureBadge}>
            <Ionicons name="shield-checkmark" size={16} color="#4ade80" />
            <Text style={styles.secureBadgeText}>PROTECTED CONTENT</Text>
          </View>
          <Text style={styles.videoTitle}>{videoData?.title}</Text>
          <Text style={styles.videoDesc}>
            This video is being streamed from your local encrypted storage. No data usage is required. 
            The playback environment is isolated to prevent unauthorized recording.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default OfflinePlayer;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050505" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#050505" },
  statusText: { color: "#bb86fc", marginTop: 15, fontSize: 14, letterSpacing: 1 },
  scrollView: { flex: 1 },
  
  // Video Section
  videoWrapper: { width: '100%', aspectRatio: 16/9, backgroundColor: '#000', zIndex: 5 },
  video: { flex: 1 },
  backBtn: { position: 'absolute', top: 45, left: 16, zIndex: 20 },
  backBtnBlur: { padding: 8, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  
  // Idle Overlay
  idleContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  idleTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 20 },
  idleSub: { color: '#888', fontSize: 14, marginTop: 8 },

  // Premium Card
  premiumCard: {
    backgroundColor: '#121212',
    marginHorizontal: 16,
    borderRadius: 24,
    padding: 20,
    marginTop: -25,
    borderWidth: 1,
    borderColor: '#222',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  glowPoint: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#bb86fc', marginRight: 10, shadowColor: '#bb86fc', shadowRadius: 5, shadowOpacity: 1 },
  cardTitle: { color: '#888', fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  offlineTag: { marginLeft: 'auto', backgroundColor: 'rgba(187, 134, 252, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  offlineTagText: { color: '#bb86fc', fontSize: 9, fontWeight: 'bold' },
  
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  statItem: { alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  statLabel: { color: '#555', fontSize: 10, fontWeight: 'bold', marginTop: 4 },
  verticalDivider: { width: 1, height: 40, backgroundColor: '#222' },
  
  progressTrack: { height: 6, backgroundColor: '#222', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },

  // Details Section
  detailsSection: { padding: 24 },
  secureBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  secureBadgeText: { color: '#4ade80', fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5 },
  videoTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
  videoDesc: { color: '#777', fontSize: 15, lineHeight: 24 }
});
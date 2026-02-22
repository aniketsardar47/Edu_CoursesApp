import React, { useState, useMemo, useRef, useCallback } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRoute, useNavigation, useIsFocused } from "@react-navigation/native";
import { Video } from "expo-av";
import { BlurView } from 'expo-blur';
import { Ionicons } from "@expo/vector-icons";
import { useDispatch } from "react-redux";

// Redux & Utils
import { addDownload } from "../redux/DownloadSlice";
import { createDownloadResumable, encryptFile, downloadMetadata } from "../utils/DownloadManager";
import { speakEnglishText, stopSpeech } from "../utils/TextToSpeech";
import * as Linking from "expo-linking";
import * as Sharing from "expo-sharing";
import * as FileSystemLegacy from "expo-file-system/legacy";

// Custom Hooks
import { useVideoMetadata } from "./hooks/useVideoMetadata";
import { useVideoInactivity } from "./hooks/useVideoInactivity";
import { useVideoTranslation } from "./hooks/useVideoTranslation";
import { useVideoProgress } from "./hooks/useVideoProgress";
import { renderFormattedText } from "./utils/FormattingUtils";

// Sub-Components
import VideoProgressCard from "./components/VideoProgressCard";
import VideoActionRow from "./components/VideoActionRow";
import VideoQualitySelector from "./components/VideoQualitySelector";
import VideoDescriptionSection from "./components/VideoDescriptionSection";
import VideoAttachmentsList from "./components/VideoAttachmentsList";

const VideoPlayer = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const dispatch = useDispatch();
  const { courseId, videoId } = route.params;

  const videoRef = useRef(null);
  const [quality, setQuality] = useState("Auto");
  const [localUri, setLocalUri] = useState(null);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [isManualOffline, setIsManualOffline] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  // 1. Meta & Env Hook
  const { videoData, batterySaverOn, speed, isConnected } = useVideoMetadata(courseId, videoId, quality === "Auto");

  // Helper to ensure URLs use the correct backend host
  const normalizeUrl = useCallback((url) => {
    if (!url) return url;
    const currentBackendIP = "10.107.25.116:7777";
    return url.replace(/10\.\d+\.\d+\.\d+:\d+/, currentBackendIP);
  }, []);

  // 2. Inactivity Hook
  const { isIdle, resetIdleTimer } = useVideoInactivity(videoRef);

  // 3. Translation Hook
  const {
    descriptionText,
    selectedLanguage,
    setSelectedLanguage,
    translating,
    loadingDescription,
    isOfflineCache,
    translateDescription
  } = useVideoTranslation(videoId, videoData, isConnected, isManualOffline, normalizeUrl);

  // 4. Progress Hook
  const {
    localWatchedMillis,
    totalDurationMillis,
    watchedPercentage,
    onPlaybackStatusUpdate,
    onLoad
  } = useVideoProgress(videoId, videoRef);

  // --- Core Utility Functions ---

  const currentUri = useMemo(() => {
    if (!videoData) return null;
    const res = videoData.resolutions || {};

    let activeQuality = quality;
    if (quality === "Auto") {
      if (speed < 1) activeQuality = "240p";
      else if (speed < 3) activeQuality = "360p";
      else activeQuality = "720p";
    }

    let url = res[activeQuality] || videoData.url;
    return normalizeUrl(url);
  }, [quality, speed, videoData, normalizeUrl]);

  const sourceUri = localUri || currentUri;

  const handleDownloadAction = async () => {
    if (isDownloading || !videoData) return;
    try {
      setIsDownloading(true);
      setDownloadProgress(0);

      const filename = videoData.title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
      const resumable = createDownloadResumable(videoData.url, filename, (p) => setDownloadProgress(p));

      const result = await resumable.downloadAsync();
      if (result?.uri) {
        const finalUri = await encryptFile(result.uri, filename);
        if (finalUri) {
          if (videoData.descriptionUrls) await downloadMetadata(videoId, videoData.descriptionUrls);
          dispatch(addDownload({
            id: videoId,
            courseId,
            title: videoData.title,
            localUri: finalUri,
            thumbnail: videoData.thumbnail || "https://via.placeholder.com/150",
            timestamp: new Date().toISOString(),
          }));
          Alert.alert("Success", "Video and translations downloaded for offline use!");
        }
      }
    } catch (error) {
      console.error("[VideoPlayer] Download Error:", error);
      Alert.alert("Error", "Download failed.");
    } finally {
      setIsDownloading(false);
    }
  };

  const shareVideo = async () => {
    try {
      if (!localUri) return Alert.alert("Download required", "Please download the video first");
      if (!(await Sharing.isAvailableAsync())) return Alert.alert("Not supported", "Sharing not supported");
      await Sharing.shareAsync(localUri, { mimeType: "video/mp4", dialogTitle: "Share video" });
    } catch (e) { Alert.alert("Error", "Failed to share video"); }
  };

  const downloadAttachment = async (url, fileName) => {
    try {
      const safeFileName = fileName.replace(/\s+/g, "_");
      const fileUri = FileSystemLegacy.documentDirectory + safeFileName;
      const result = await FileSystemLegacy.downloadAsync(url, fileUri);
      if (result.status === 200 && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(result.uri);
      }
    } catch { Alert.alert("Download Error", "Could not complete download."); }
  };

  const openAttachment = async (url) => {
    const supported = await Linking.canOpenURL(url);
    supported ? Linking.openURL(url) : Alert.alert("Cannot open file");
  };

  if (!videoData || !sourceUri) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#bb86fc" />
        <Text style={styles.loadingText}>Loading video...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} onTouchStart={resetIdleTimer}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Video Player Section */}
        <View style={[styles.videoWrapper, batterySaverOn && styles.batterySaverVideo]}>
          <Video
            ref={videoRef}
            source={{ uri: sourceUri }}
            style={styles.video}
            useNativeControls
            resizeMode="contain"
            shouldPlay={isFocused}
            progressUpdateIntervalMillis={100}
            onPlaybackStatusUpdate={onPlaybackStatusUpdate}
            onLoad={onLoad}
          />
          {isIdle && (
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill}>
              <View style={styles.idleOverlay}>
                <Ionicons name="play-circle" size={80} color="white" opacity={0.8} />
                <Text style={styles.idleText}>Tap to Resume Learning</Text>
              </View>
            </BlurView>
          )}
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.titleAccent} />
            <Text style={styles.videoTitle}>{videoData.title || "Video Lesson"}</Text>
          </View>
          <View style={styles.trackingContainer}>
            <Text style={[styles.trackingText, { color: Number(watchedPercentage) >= 99 ? "#4ade80" : "#bb86fc" }]}>
              {watchedPercentage}%
            </Text>
            <Text style={[styles.incompleteText, Number(watchedPercentage) >= 99 && { color: '#4ade80' }]}>
              {Number(watchedPercentage) >= 99 ? "Completed" : "In Progress"}
            </Text>
          </View>
        </View>

        {/* Modular Components */}
        <VideoProgressCard
          watchedPercentage={watchedPercentage}
          localWatchedMillis={localWatchedMillis}
          totalDurationMillis={totalDurationMillis}
        />

        <VideoActionRow
          isDownloading={isDownloading}
          downloadProgress={downloadProgress}
          onDownload={handleDownloadAction}
          localUri={localUri}
          onShare={shareVideo}
        />

        <VideoQualitySelector
          quality={quality}
          setQuality={setQuality}
          speed={speed}
          batterySaverOn={batterySaverOn}
        />

        <VideoDescriptionSection
          selectedLanguage={selectedLanguage}
          setSelectedLanguage={setSelectedLanguage}
          descriptionText={descriptionText}
          translating={translating}
          loadingDescription={loadingDescription}
          isOfflineCache={isOfflineCache}
          isManualOffline={isManualOffline}
          setIsManualOffline={setIsManualOffline}
          onTranslate={translateDescription}
          onSpeak={() => speakEnglishText(descriptionText)}
          onShowFullDesc={() => setShowFullDesc(true)}
        />

        <VideoAttachmentsList
          attachments={videoData.attachments}
          onOpen={openAttachment}
          onDownload={downloadAttachment}
        />

        {/* Quiz Button */}
        {videoData.quiz?.length > 0 && (
          <TouchableOpacity style={styles.quizBtn} onPress={() => navigation.navigate("QuizScreen", { quiz: videoData.quiz })}>
            <View style={styles.quizContent}>
              <Ionicons name="help-circle-outline" size={24} color="#fff" />
              <View style={styles.quizTextContainer}>
                <Text style={styles.quizBtnText}>Start Quiz</Text>
                <Text style={styles.quizSubText}>Test your knowledge</Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </View>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Full Description Modal */}
      <Modal visible={showFullDesc} transparent animationType="fade" onRequestClose={() => setShowFullDesc(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Full Description</Text>
              <TouchableOpacity onPress={() => { stopSpeech(); setShowFullDesc(false); }}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.normalText}>{renderFormattedText(descriptionText)}</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 30, paddingTop: 32 },
  loadingContainer: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#bb86fc", marginTop: 10 },
  videoWrapper: { width: "100%", aspectRatio: 16 / 9, backgroundColor: "#000", position: 'relative' },
  video: { width: "100%", height: "100%" },
  batterySaverVideo: { opacity: 0.7 },
  idleOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  idleText: { color: 'white', marginTop: 10, fontSize: 16, fontWeight: '600' },
  titleSection: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 18, backgroundColor: '#000', marginBottom: 16 },
  titleAccent: { width: 4, height: 24, backgroundColor: '#bb86fc', borderRadius: 2, marginRight: 12 },
  videoTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', flex: 1 },
  trackingContainer: { alignItems: 'flex-end' },
  trackingText: { fontSize: 16, fontWeight: '800' },
  incompleteText: { color: '#888', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', marginTop: 2 },
  quizBtn: { backgroundColor: '#7c3aed', marginHorizontal: 16, borderRadius: 20, padding: 20 },
  quizContent: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  quizTextContainer: { flex: 1 },
  quizBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  quizSubText: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '90%', maxHeight: '80%', backgroundColor: '#111', borderRadius: 25, overflow: 'hidden', borderWidth: 1, borderColor: '#333' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#222' },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  modalContent: { padding: 20 },
  normalText: { color: '#e0e0e0', fontSize: 15, lineHeight: 24 },
});

export default VideoPlayer;
import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from "react-native";
import { useRoute, useNavigation, useIsFocused } from "@react-navigation/native"; 
import { Video } from "expo-av";
import { downloadVideo } from "../utils/DownloadManager";
import * as FileSystemLegacy from "expo-file-system/legacy";
import * as Linking from "expo-linking";
import * as Sharing from "expo-sharing";
import { Ionicons } from "@expo/vector-icons";
import useRealtimeSpeed from "./useRealtimeSpeed";

const { width } = Dimensions.get("window");

const VideoPlayer = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { courseId, videoId } = route.params;

  const videoRef = useRef(null);
  const [videoData, setVideoData] = useState(null);
  const [quality, setQuality] = useState("Auto");
  const [localUri, setLocalUri] = useState(null);
  const [descriptionText, setDescriptionText] = useState("");
  const [loadingDescription, setLoadingDescription] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);

  // --- NEW STATE TO TRACK TIME ---
  const [lastPosition, setLastPosition] = useState(0);

  /* ================= FETCH VIDEO DATA ================= */
  useEffect(() => {
    if (!courseId || !videoId) return;
    fetch(`http://10.197.15.60:7777/api/videos/course/${courseId}/${videoId}`)
      .then((res) => res.json())
      .then(setVideoData)
      .catch((err) => console.error("Fetch error:", err));
  }, [courseId, videoId]);

  /* ================= FETCH DESCRIPTION ================= */
  useEffect(() => {
    const fetchDescription = async () => {
      if (!videoData?.descriptionUrl) return;
      try {
        setLoadingDescription(true);
        const response = await fetch(videoData.descriptionUrl);
        const text = await response.text();
        setDescriptionText(text);
      } catch {
        setDescriptionText("Description not available.");
      } finally {
        setLoadingDescription(false);
      }
    };
    fetchDescription();
  }, [videoData?.descriptionUrl]);

  /* ================= RESUME LOGIC ================= */
  const onReadyForDisplay = () => {
    if (videoRef.current && lastPosition > 0) {
      videoRef.current.setPositionAsync(lastPosition);
    }
  };

  const speed = useRealtimeSpeed(3000) ?? 0;

  const renderFormattedText = (text) => {
    if (!text) return null;
    const parts = text.split(/(\*[^*]+\*)/g);
    return parts.map((part, index) =>
      part.startsWith("*") && part.endsWith("*") ? (
        <Text key={index} style={styles.boldHighlight}>{part.slice(1, -1)}</Text>
      ) : (
        <Text key={index} style={styles.normalText}>{part}</Text>
      )
    );
  };

  const currentUri = useMemo(() => {
    if (!videoData) return null;
    const res = videoData.resolutions || {};
    if (quality === "Auto") {
      if (speed < 1) return res.p240 || videoData.url;
      if (speed < 3) return res.p360 || videoData.url;
      return res.p720 || videoData.url;
    }
    return res[quality.replace("p", "p")] || videoData.url;
  }, [quality, speed, videoData]);

  const sourceUri = localUri || currentUri;

  const shareVideo = async () => {
    try {
      if (!localUri) {
        Alert.alert("Download required", "Please download the video first");
        return;
      }
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("Not supported", "Sharing not supported on this device");
        return;
      }
      await Sharing.shareAsync(localUri, {
        mimeType: "video/mp4",
        dialogTitle: "Share video",
      });
    } catch (e) {
      Alert.alert("Error", "Failed to share video");
    }
  };

  const downloadAttachment = async (url, fileName) => {
    try {
      const safeFileName = fileName.replace(/\s+/g, "_");
      const fileUri = FileSystemLegacy.documentDirectory + safeFileName;
      const result = await FileSystemLegacy.downloadAsync(url, fileUri);
      if (result.status === 200 && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(result.uri);
      }
    } catch (error) {
      Alert.alert("Download Error", "Could not complete download.");
    }
  };

  const openAttachment = async (url) => {
    const supported = await Linking.canOpenURL(url);
    supported ? Linking.openURL(url) : Alert.alert("Cannot open file");
  };

  if (!videoData || !sourceUri) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading video...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 140 }}>
      {/* VIDEO */}
      <View style={styles.videoWrapper}>
        <Video
          ref={videoRef}
          source={{ uri: sourceUri }}
          style={styles.video}
          useNativeControls
          resizeMode="contain"
          shouldPlay={isFocused}
          // TRACK POSITION FREQUENTLY
          onPlaybackStatusUpdate={(status) => {
            if (status.isLoaded && status.isPlaying) {
              setLastPosition(status.positionMillis);
            }
          }}
          onReadyForDisplay={onReadyForDisplay}
        />
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={async () => {
            const uri = await downloadVideo(sourceUri, videoData.title);
            if (uri) {
              setLocalUri(uri);
              Alert.alert("Success", "Video downloaded successfully");
            } else {
              Alert.alert("Error", "Download failed");
            }
          }}
        >
          <Ionicons name="download-outline" size={20} color="#fff" />
          <Text style={styles.actionText}>Download</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.shareBtn, !localUri && { opacity: 0.5 }]}
          onPress={shareVideo}
          disabled={!localUri}
        >
          <Ionicons name="share-social-outline" size={20} color="#fff" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* QUALITY SELECTOR */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>SELECT QUALITY</Text>
        <View style={styles.buttonRow}>
          {["Auto", "240p", "360p", "720p"].map((q) => (
            <TouchableOpacity
              key={q}
              style={[styles.qualityBtn, quality === q && styles.activeBtn]}
              onPress={async () => {
                // CAPTURE POSITION IMMEDIATELY BEFORE SWITCHING
                if (videoRef.current) {
                  const status = await videoRef.current.getStatusAsync();
                  if (status.isLoaded) {
                    setLastPosition(status.positionMillis);
                  }
                }
                setQuality(q);
              }}
            >
              <Text style={quality === q ? styles.activeBtnText : styles.btnText}>{q}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.speedCard}>
          <Text style={styles.speedValue}>{speed.toFixed(1)} Mbps</Text>
        </View>
      </View>

      {/* DESCRIPTION */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>DESCRIPTION</Text>
        <Text numberOfLines={5} style={styles.descriptionText}>{descriptionText}</Text>
        {descriptionText.length > 200 && (
          <TouchableOpacity onPress={() => setShowFullDesc(true)}>
            <Text style={styles.readMore}>Read more</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ATTACHMENTS */}
      {Array.isArray(videoData.attachments) &&
        videoData.attachments.map((f) => (
          <View key={f._id} style={styles.attachmentRow}>
            <TouchableOpacity style={styles.attachmentDownloadBtn} onPress={() => downloadAttachment(f.downloadUrl, f.fileName)}>
              <Ionicons name="download-outline" size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.attachmentTextContainer} onPress={() => openAttachment(f.downloadUrl)}>
              <Text style={styles.attachmentName} numberOfLines={1}>{f.fileName}</Text>
              <Text style={styles.attachmentMeta}>{f.fileType.toUpperCase()} • {f.size.toFixed(2)} MB</Text>
            </TouchableOpacity>
          </View>
        ))}

      {/* QUIZ */}
      {videoData.quiz?.length > 0 && (
        <TouchableOpacity style={styles.quizBtn} onPress={() => navigation.navigate("QuizScreen", { quiz: videoData.quiz })}>
          <Ionicons name="help-circle-outline" size={20} color="#fff" />
          <Text style={styles.quizBtnText}>Start Quiz</Text>
        </TouchableOpacity>
      )}

      {/* FULL DESCRIPTION MODAL */}
      <Modal visible={showFullDesc} transparent animationType="fade" onRequestClose={() => setShowFullDesc(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.sectionTitle}>FULL DESCRIPTION</Text>
            <ScrollView style={styles.modalScrollView}><Text>{renderFormattedText(descriptionText)}</Text></ScrollView>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowFullDesc(false)}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

// Styles mapping...
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a1929", padding: 16, paddingTop: 40 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0a1929" },
  loadingText: { color: "#94a3b8", marginTop: 10 },
  videoWrapper: { width: "100%", aspectRatio: 16 / 9, backgroundColor: "#000", borderRadius: 16, overflow: "hidden" },
  video: { width: "100%", height: "100%" },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center" },
  overlayText: { color: "#fff", marginTop: 8, fontWeight: "bold" },
  actionRow: { flexDirection: "row", gap: 12, marginTop: 14 },
  actionBtn: { flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 12, borderRadius: 14, backgroundColor: "#2563eb" },
  shareBtn: { backgroundColor: "#16a34a" },
  actionText: { color: "#fff", fontWeight: "bold", marginLeft: 6 },
  card: { marginTop: 24, padding: 20, backgroundColor: "#1e2f4a", borderRadius: 20 },
  sectionTitle: { color: "#3b82f6", fontSize: 11, fontWeight: "bold", marginBottom: 12, letterSpacing: 1 },
  buttonRow: { flexDirection: "row", backgroundColor: "#0a1929", borderRadius: 12, padding: 4, marginBottom: 20 },
  qualityBtn: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 10 },
  activeBtn: { backgroundColor: "#3b82f6" },
  btnText: { color: "#94a3b8", fontWeight: "600" },
  activeBtnText: { color: "#fff", fontWeight: "700" },
  speedCard: { alignItems: "center", backgroundColor: "#0f172a", padding: 14, borderRadius: 15 },
  speedValue: { fontSize: 18, fontWeight: "700", color: "#fff" },
  descriptionText: { color: "#e5e7eb", fontSize: 14, lineHeight: 20 },
  readMore: { color: "#60a5fa", marginTop: 6, fontWeight: "600" },
  normalText: { color: "#e5e7eb", fontSize: 14, lineHeight: 20 },
  boldHighlight: { color: "#ffffff", fontWeight: "bold", paddingHorizontal: 4, borderRadius: 4 },
  attachmentRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: "#334155", backgroundColor: "#16263b", borderRadius: 12, marginBottom: 8 },
  attachmentDownloadBtn: { backgroundColor: "#2563eb", width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center", marginRight: 12 },
  attachmentTextContainer: { flex: 1, paddingLeft: 10, justifyContent: "center" },
  attachmentName: { color: "#ffffff", fontWeight: "600", fontSize: 14 },
  attachmentMeta: { color: "#94a3b8", fontSize: 12, marginTop: 2 },
  quizBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#7c3aed", paddingVertical: 14, borderRadius: 14, marginTop: 24 },
  quizBtnText: { color: "#fff", fontWeight: "bold", marginLeft: 8, fontSize: 16 },
  modalOverlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  modalBox: { width: "90%", height: "60%", backgroundColor: "#1e2f4a", borderRadius: 20, padding: 20, elevation: 10 },
  modalScrollView: { flex: 1, marginVertical: 15 },
  closeBtn: { marginTop: 16, alignSelf: "center", paddingVertical: 8, paddingHorizontal: 24, backgroundColor: "#2563eb", borderRadius: 10 },
  closeText: { color: "#fff", fontWeight: "bold" },
});

export default VideoPlayer;
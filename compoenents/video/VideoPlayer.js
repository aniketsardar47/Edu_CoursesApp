import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { Video } from "expo-av";
import * as FileSystem from "expo-file-system";
import useRealtimeSpeed from "./useRealtimeSpeed";

const { width } = Dimensions.get("window");

const VideoPlayer = () => {
  const route = useRoute();
  const { courseId, videoId } = route.params;

  const videoRef = useRef(null);

  const [videoData, setVideoData] = useState(null);
  const [quality, setQuality] = useState("Auto");
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [localUri, setLocalUri] = useState(null);
  const [isSwitching, setIsSwitching] = useState(false);

  const speed = useRealtimeSpeed(3000);

  /* ================= FETCH VIDEO DATA ================= */
  useEffect(() => {
    if (!courseId || !videoId) return;

    setVideoData(null);

    fetch(`http://10.107.25.116:7777/api/videos/course/${courseId}/${videoId}`)
      .then((res) => res.json())
      .then((data) => setVideoData(data))
      .catch((err) => console.error("Fetch error:", err));
  }, [courseId, videoId]);

  /* ================= VIDEO URI BASED ON QUALITY ================= */
  const currentUri = useMemo(() => {
    if (!videoData) return null;
    const res = videoData.resolutions;

    if (quality === "Auto") {
      if (speed < 1) return res?.p240 || videoData.url;
      if (speed < 3) return res?.p360 || videoData.url;
      return res?.p720 || videoData.url;
    }

    return {
      "240p": res?.p240 || videoData.url,
      "360p": res?.p360 || videoData.url,
      "720p": res?.p720 || videoData.url,
    }[quality];
  }, [quality, speed, videoData]);

  /* ================= LOCAL FILE PATH ================= */
  const getLocalPath = () =>
    `${FileSystem.documentDirectory}videos/course_${courseId}/video_${videoId}_${quality}.mp4`;

  /* ================= CHECK IF VIDEO IS DOWNLOADED ================= */
  useEffect(() => {
    const checkLocal = async () => {
      if (!currentUri) return;

      const info = await FileSystem.getInfoAsync(getLocalPath());
      if (info.exists) {
        setIsDownloaded(true);
        setLocalUri(info.uri);
      } else {
        setIsDownloaded(false);
        setLocalUri(null);
      }
    };
    checkLocal();
  }, [currentUri]);

  /* ================= DOWNLOAD VIDEO ================= */
  const downloadVideo = async () => {
    try {
      const dir = `${FileSystem.documentDirectory}videos/course_${courseId}`;
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

      const downloadResumable = FileSystem.createDownloadResumable(
        currentUri,
        getLocalPath(),
        {},
        (progress) => {
          const percent =
            progress.totalBytesWritten / progress.totalBytesExpectedToWrite;
          setDownloadProgress(percent);
        }
      );

      const result = await downloadResumable.downloadAsync();
      setLocalUri(result.uri);
      setIsDownloaded(true);
      setDownloadProgress(0);
      Alert.alert("Download Complete", "✅ Video downloaded successfully!");
    } catch (e) {
      console.error("Download error:", e);
      Alert.alert("Download Failed", "❌ Could not download the video.");
    }
  };

  const sourceUri = localUri || currentUri;

  /* ================= VIDEO SWITCHING ================= */
  useEffect(() => {
    if (!videoRef.current || !sourceUri) return;

    setIsSwitching(true);

    const statusUpdate = async () => {
      const status = await videoRef.current.getStatusAsync();
      const currentTime = status.positionMillis;

      await videoRef.current.loadAsync(
        { uri: sourceUri },
        { shouldPlay: true, positionMillis: currentTime }
      );

      setIsSwitching(false);
    };

    statusUpdate();
  }, [sourceUri]);

  /* ================= LOADING STATE ================= */
  if (!videoData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading video...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* VIDEO PLAYER */}
      <View style={styles.videoWrapper}>
        <Video
          ref={videoRef}
          source={{ uri: sourceUri }}
          style={styles.video}
          useNativeControls
          resizeMode="contain"
          shouldPlay
        />

        {isSwitching && (
          <View style={styles.overlay}>
            <ActivityIndicator color="#fff" />
            <Text style={styles.overlayText}>Switching Quality...</Text>
          </View>
        )}
      </View>

      {/* DOWNLOAD BUTTON */}
      <TouchableOpacity
        style={[styles.downloadBtn, isDownloaded && { backgroundColor: "#15803d" }]}
        disabled={isDownloaded}
        onPress={downloadVideo}
      >
        <Text style={styles.downloadText}>
          {isDownloaded ? "Downloaded ✔" : "Download Video"}
        </Text>
      </TouchableOpacity>

      {downloadProgress > 0 && (
        <View style={styles.progressBarBg}>
          <View
            style={[styles.progressBarFill, { width: `${downloadProgress * 100}%` }]}
          />
        </View>
      )}

      {/* QUALITY SELECTOR */}
      <View style={styles.card}>
        <Text style={styles.label}>SELECT QUALITY</Text>

        <View style={styles.buttonRow}>
          {["Auto", "240p", "360p", "720p"].map((res) => (
            <TouchableOpacity
              key={res}
              style={[styles.qualityBtn, quality === res && styles.activeBtn]}
              onPress={() => setQuality(res)}
            >
              <Text style={[styles.btnText, quality === res && styles.activeBtnText]}>
                {res}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* REAL-TIME NETWORK SPEED */}
        <View style={styles.speedCard}>
          <View style={styles.speedInfo}>
            <Text style={styles.speedValue}>{speed?.toFixed(1) || "0.0"}</Text>
            <Text style={styles.speedUnit}>Mbps</Text>
          </View>
          <Text style={styles.speedLabel}>REAL-TIME NETWORK SPEED</Text>
          <View style={styles.progressBarBg}>
            <View
              style={[styles.progressBarFill, { width: `${Math.min((speed / 10) * 100, 100)}%` }]}
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default VideoPlayer;

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#0a1929",
    padding: 16,
    paddingTop: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0a1929",
  },
  loadingText: { color: "#94a3b8", marginTop: 10 },

  videoWrapper: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#000",
    borderRadius: 16,
    overflow: "hidden",
  },
  video: { width: "100%", height: "100%" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  overlayText: { color: "#fff", marginTop: 8, fontWeight: "bold" },

  downloadBtn: {
    marginTop: 14,
    backgroundColor: "#16a34a",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  downloadText: { color: "#fff", fontWeight: "bold" },

  card: {
    marginTop: 24,
    padding: 20,
    backgroundColor: "#1e2f4a",
    borderRadius: 20,
  },
  label: {
    color: "#3b82f6",
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: "row",
    backgroundColor: "#0a1929",
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  qualityBtn: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 10 },
  activeBtn: { backgroundColor: "#3b82f6" },
  btnText: { color: "#94a3b8", fontWeight: "600" },
  activeBtnText: { color: "#fff" },

  speedCard: { alignItems: "center", backgroundColor: "#0f172a", padding: 15, borderRadius: 15 },
  speedInfo: { flexDirection: "row", alignItems: "baseline" },
  speedValue: { fontSize: 32, fontWeight: "800", color: "#fff" },
  speedUnit: { fontSize: 14, color: "#3b82f6", marginLeft: 4 },
  speedLabel: { fontSize: 9, color: "#64748b", marginTop: 2 },

  progressBarBg: {
    width: "100%",
    height: 4,
    backgroundColor: "#1e2f4a",
    borderRadius: 2,
    marginTop: 10,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#3b82f6",
  },
});


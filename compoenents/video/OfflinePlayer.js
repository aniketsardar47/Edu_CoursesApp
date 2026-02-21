import React, { useRef, useEffect, useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert 
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { Video } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import { decryptFile } from "../utils/DownloadManager";

const OfflinePlayer = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const videoRef = useRef(null);
  const { videoId } = route.params;

  const [decryptedUri, setDecryptedUri] = useState(null);
  const [loading, setLoading] = useState(true);

  const videoData = useSelector((state) => 
    state.downloads.videos.find((v) => v.id === videoId)
  );

  useEffect(() => {
    let tempPath = null;

    const prepareVideo = async () => {
      if (!videoData?.localUri) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // This creates a temp .mp4 copy from the .dat file
        const result = await decryptFile(videoData.localUri);
        if (result) {
          tempPath = result;
          setDecryptedUri(result);
        }
      } catch (error) {
        Alert.alert("Error", "Could not load the secure video file.");
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    prepareVideo();

    // Cleanup: Delete the temporary .mp4 copy when leaving
    return () => {
      if (tempPath) {
        FileSystem.deleteAsync(tempPath, { idempotent: true })
          .catch(err => console.log("Cleanup error:", err));
      }
    };
  }, [videoData]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#bb86fc" />
        <Text style={styles.statusText}>Preparing Secure Video...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{videoData?.title}</Text>
      </View>

      <View style={styles.videoWrapper}>
        <Video
          ref={videoRef}
          source={{ uri: decryptedUri }}
          style={styles.video}
          useNativeControls
          resizeMode="contain"
          shouldPlay
        />
      </View>

      <View style={styles.infoCard}>
        <View style={styles.offlineBadge}>
          <Ionicons name="shield-checkmark" size={16} color="#4ade80" />
          <Text style={styles.offlineText}>PROTECTED OFFLINE CONTENT</Text>
        </View>
        <Text style={styles.title}>{videoData?.title}</Text>
        <Text style={styles.desc}>
          This video is stored securely. The temporary playback file will be 
          automatically deleted when you exit this screen.
        </Text>
      </View>
    </View>
  );
};

export default OfflinePlayer;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0a0a0a" },
  header: { flexDirection: "row", alignItems: "center", paddingTop: 50, paddingBottom: 20, paddingHorizontal: 16, backgroundColor: "#121212" },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold", marginLeft: 15, flex: 1 },
  videoWrapper: { width: "100%", aspectRatio: 16 / 9, backgroundColor: "#000" },
  video: { width: "100%", height: "100%" },
  infoCard: { padding: 20, backgroundColor: "#121212", flex: 1 },
  offlineBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(74, 222, 128, 0.1)", padding: 8, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 15 },
  offlineText: { color: "#4ade80", fontSize: 12, fontWeight: "bold" },
  statusText: { color: "#bb86fc", marginTop: 10 },
  title: { color: "#fff", fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  desc: { color: "#888", fontSize: 14, lineHeight: 22 }
});
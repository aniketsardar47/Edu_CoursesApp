import React, { useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { Video } from "expo-av";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const OfflinePlayer = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const videoRef = useRef(null);
  
  const { videoId } = route.params;

  // Retrieve the specific video details from Redux
  const videoData = useSelector((state) => 
    state.downloads.videos.find((v) => v.id === videoId)
  );

  if (!videoData) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Video not found in downloads.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{videoData.title}</Text>
      </View>

      {/* Video Component */}
      <View style={styles.videoWrapper}>
        <Video
          ref={videoRef}
          source={{ uri: videoData.localUri }} // Playing the local file:// path
          style={styles.video}
          useNativeControls
          resizeMode="contain"
          shouldPlay
        />
      </View>

      {/* Offline Info Card */}
      <View style={styles.infoCard}>
        <View style={styles.offlineBadge}>
          <Ionicons name="airplane" size={16} color="#4ade80" />
          <Text style={styles.offlineText}>Playing from Local Storage</Text>
        </View>
        <Text style={styles.title}>{videoData.title}</Text>
        <Text style={styles.desc}>
          You are watching this video offline. No internet connection is being used.
        </Text>
      </View>
    </View>
  );
};

export default OfflinePlayer;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0a0a0a" },
  header: { 
    flexDirection: "row", 
    alignItems: "center", 
    paddingTop: 50, 
    paddingBottom: 20, 
    paddingHorizontal: 16,
    backgroundColor: "#121212" 
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold", marginLeft: 15, flex: 1 },
  videoWrapper: { width: "100%", aspectRatio: 16 / 9, backgroundColor: "#000" },
  video: { width: "100%", height: "100%" },
  infoCard: { padding: 20, backgroundColor: "#121212", flex: 1 },
  offlineBadge: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 6, 
    backgroundColor: "rgba(74, 222, 128, 0.1)", 
    padding: 8, 
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 15
  },
  offlineText: { color: "#4ade80", fontSize: 12, fontWeight: "bold" },
  title: { color: "#fff", fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  desc: { color: "#888", fontSize: 14, lineHeight: 22 },
  errorText: { color: "#fff", marginBottom: 20 },
  backBtn: { backgroundColor: "#bb86fc", padding: 12, borderRadius: 8 },
  backText: { color: "#000", fontWeight: "bold" }
});
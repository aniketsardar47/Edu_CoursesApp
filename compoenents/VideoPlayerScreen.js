import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  ScrollView,
} from "react-native";

import { useNavigation, useRoute, useIsFocused } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Video, ResizeMode } from "expo-av";
import * as Battery from "expo-battery";

const VideoPlayerScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { courseId, videoId } = route.params || {};

  const videoRef = useRef(null);

  const [videoData, setVideoData] = useState(null);
  const [courseVideos, setCourseVideos] = useState([]);
  const [quality, setQuality] = useState("Auto");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [networkSpeed, setNetworkSpeed] = useState(null);
  const [lastPosition, setLastPosition] = useState(0);

  const [batteryLevel, setBatteryLevel] = useState(null);
  const [batterySaverOn, setBatterySaverOn] = useState(false);

  /* ================= BATTERY ================= */
  useEffect(() => {
    Battery.getBatteryLevelAsync().then((level) => {
      const percent = Math.round(level * 100);
      setBatteryLevel(percent);
      setBatterySaverOn(percent <= 20);

      if (percent <= 20) {
        setQuality("240p");
      }
    });

    const sub = Battery.addBatteryLevelListener(({ batteryLevel }) => {
      const percent = Math.round(batteryLevel * 100);
      setBatteryLevel(percent);

      if (percent <= 20) {
        setBatterySaverOn(true);
        setQuality("240p");
      } else {
        setBatterySaverOn(false);
      }
    });

    return () => sub.remove();
  }, []);

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    const fetchVideo = async () => {
      try {
        setLoading(true);

        const res = await fetch(
          `http://10.197.15.60:7777/api/videos/course/${courseId}/${videoId}`
        );

        if (!res.ok) throw new Error("Video not found");
        const data = await res.json();
        setVideoData(data);

        const listRes = await fetch(
          `http://10.197.15.60:7777/api/videos/course/${courseId}`
        );

        const listData = await listRes.json();
        setCourseVideos(Array.isArray(listData) ? listData : []);

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    if (courseId && videoId) fetchVideo();
    else {
      setError("Invalid course or video ID");
      setLoading(false);
    }
  }, [courseId, videoId]);

  /* ================= NETWORK SPEED ================= */
  useEffect(() => {
    if (batterySaverOn) {
      setNetworkSpeed(null);
      return;
    }

    let interval;

    const checkSpeed = async () => {
      try {
        const startTime = Date.now();
        const response = await fetch(
          "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png"
        );
        const blob = await response.blob();
        const endTime = Date.now();

        const duration = (endTime - startTime) / 1000;
        const speedKbps = ((blob.size * 8) / duration / 1024).toFixed(2);

        setNetworkSpeed(`${speedKbps} kbps`);
      } catch {
        setNetworkSpeed("N/A");
      }
    };

    checkSpeed();
    interval = setInterval(checkSpeed, 5000);

    return () => clearInterval(interval);
  }, [batterySaverOn]);

  /* ================= RESUME POSITION ================= */
  const onReadyForDisplay = () => {
    if (videoRef.current && lastPosition > 0) {
      videoRef.current.setPositionAsync(lastPosition);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Loading video content...</Text>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (error || !videoData) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>⚠ {error}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const VIDEO_SOURCES = {
    Auto: videoData.url,
    "240p": videoData.resolutions?.p240,
    "360p": videoData.resolutions?.p360,
    "720p": videoData.resolutions?.p720,
  };

  const currentVideoUrl = VIDEO_SOURCES[quality] || videoData.url;

  return (
    <ScrollView style={styles.container}>

      {/* BACK BUTTON */}
      <TouchableOpacity
        style={styles.backRow}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="chevron-back" size={22} color="#ccc" />
        <Text style={styles.backText}>Back to Course</Text>
      </TouchableOpacity>

      {/* 🔥 TEXT FIRST SECTION */}
      <View style={styles.infoBox}>
        <Text style={styles.title}>{videoData.title}</Text>

        {batteryLevel !== null && (
          <Text style={styles.metaText}>
            Battery: {batteryLevel}% {batterySaverOn ? "(Saver ON)" : ""}
          </Text>
        )}

        {networkSpeed && (
          <Text style={styles.networkSpeed}>
            Speed: {networkSpeed}
          </Text>
        )}

        <Text style={styles.desc}>
          {videoData.description || "No description available."}
        </Text>
      </View>

      {/* 🎥 VIDEO */}
      <View style={styles.playerBox}>
        <Video
          ref={videoRef}
          source={{ uri: currentVideoUrl }}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={!batterySaverOn && isFocused}
          style={styles.video}
          onPlaybackStatusUpdate={(status) => {
            if (status.isLoaded) {
              setLastPosition(status.positionMillis);
            }
          }}
          onReadyForDisplay={onReadyForDisplay}
        />
      </View>

      {/* QUALITY SELECTOR */}
      <View style={styles.qualityRow}>
        {["Auto", "240p", "360p", "720p"].map((q) => (
          <TouchableOpacity
            key={q}
            disabled={batterySaverOn}
            onPress={() => setQuality(q)}
            style={[
              styles.qualityBtn,
              quality === q && styles.activeQuality,
              batterySaverOn && { opacity: 0.4 },
            ]}
          >
            <Text style={styles.qualityText}>{q}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>
        Course Videos ({courseVideos.length})
      </Text>

      <FlatList
        data={courseVideos}
        keyExtractor={(item) => item._id || item.id}
        renderItem={({ item, index }) => {
          const vid = item._id || item.id;
          const active = vid === videoId;

          return (
            <TouchableOpacity
              style={[styles.videoItem, active && styles.activeVideo]}
              onPress={() => {
                setLastPosition(0);
                navigation.navigate("VideoPlayer", { courseId, videoId: vid });
              }}
            >
              <Ionicons
                name="play-circle"
                size={22}
                color={active ? "#60a5fa" : "#9ca3af"}
              />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.lesson}>Lesson {index + 1}</Text>
                <Text style={styles.videoTitle}>{item.title}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        scrollEnabled={false}
      />
    </ScrollView>
  );
};

export default VideoPlayerScreen;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
    backgroundColor: "#0a1929",
    paddingHorizontal: 14,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0a1929",
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  metaText: {
    color: "#94a3b8",
    marginTop: 4,
    fontSize: 12,
  },
  desc: {
    color: "#cbd5e1",
    marginTop: 8,
    fontSize: 14,
  },
  error: { color: "#f87171", fontSize: 18 },
  back: { color: "#60a5fa", marginTop: 10 },
  backRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  backText: { color: "#ccc", marginLeft: 6 },
  infoBox: { marginBottom: 12 },
  playerBox: { backgroundColor: "#000", borderRadius: 14, overflow: "hidden" },
  video: { width: "100%", height: 220 },
  networkSpeed: { color: "#60a5fa", fontSize: 12, marginTop: 4 },
  qualityRow: { flexDirection: "row", gap: 8, marginVertical: 12 },
  qualityBtn: { padding: 8, backgroundColor: "#1e293b", borderRadius: 8 },
  activeQuality: { backgroundColor: "#2563eb" },
  qualityText: { color: "#fff", fontSize: 12 },
  sectionTitle: { color: "#fff", fontSize: 18, marginVertical: 10 },
  videoItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  activeVideo: { borderWidth: 1, borderColor: "#60a5fa" },
  lesson: { color: "#94a3b8", fontSize: 12 },
  videoTitle: { color: "#fff", fontSize: 14 },
});
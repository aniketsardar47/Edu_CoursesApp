import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const VideoPlayerScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { courseId, videoId } = route.params || {};

  const videoRef = useRef(null);

  const [videoData, setVideoData] = useState(null);
  const [courseVideos, setCourseVideos] = useState([]);
  const [quality, setQuality] = useState("Auto");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        setLoading(true);

        const res = await fetch(
          `http://192.168.0.100:7777/api/videos/course/${courseId}/${videoId}`
        );
        if (!res.ok) throw new Error("Video not found");
        const data = await res.json();
        setVideoData(data);

        const listRes = await fetch(
          `http://192.168.0.100:7777/api/videos/course/${courseId}`
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.text}>Loading video...</Text>
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

  const currentVideoUrl =
    VIDEO_SOURCES[quality] || videoData.url;

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <TouchableOpacity
        style={styles.backRow}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="chevron-back" size={22} color="#ccc" />
        <Text style={styles.backText}>Back to Course</Text>
      </TouchableOpacity>

      {/* Video Player */}
      <View style={styles.playerBox}>
        <Video
          ref={videoRef}
          source={{ uri: currentVideoUrl }}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay
          style={styles.video}
        />
      </View>

      {/* Video Info */}
      <View style={styles.infoBox}>
        <Text style={styles.title}>{videoData.title}</Text>
        <Text style={styles.desc}>
          {videoData.textContent || "No description"}
        </Text>
      </View>

      {/* Quality Selector */}
      <View style={styles.qualityRow}>
        {["Auto", "240p", "360p", "720p"].map((q) => (
          <TouchableOpacity
            key={q}
            onPress={() => setQuality(q)}
            style={[
              styles.qualityBtn,
              quality === q && styles.activeQuality,
            ]}
          >
            <Text style={styles.qualityText}>{q}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sidebar Videos */}
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
              style={[
                styles.videoItem,
                active && styles.activeVideo,
              ]}
              onPress={() =>
                navigation.replace("VideoPlayer", {
                  courseId,
                  videoId: vid,
                })
              }
            >
              <Ionicons
                name="play-circle"
                size={22}
                color={active ? "#60a5fa" : "#9ca3af"}
              />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.lesson}>
                  Lesson {index + 1}
                </Text>
                <Text style={styles.videoTitle}>
                  {item.title}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: "10%",
    backgroundColor: "#0a1929",
    padding: 14,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0a1929",
  },
  text: { color: "#fff", marginTop: 10 },
  error: { color: "#f87171", fontSize: 18 },
  back: { color: "#60a5fa", marginTop: 10 },

  backRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  backText: { color: "#ccc", marginLeft: 6 },

  playerBox: {
    backgroundColor: "#000",
    borderRadius: 14,
    overflow: "hidden",
  },
  video: {
    width: "100%",
    height: 220,
  },

  infoBox: {
    marginTop: 12,
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  desc: {
    color: "#cbd5e1",
    marginTop: 6,
  },

  qualityRow: {
    flexDirection: "row",
    gap: 8,
    marginVertical: 12,
  },
  qualityBtn: {
    padding: 8,
    backgroundColor: "#1e293b",
    borderRadius: 8,
  },
  activeQuality: {
    backgroundColor: "#2563eb",
  },
  qualityText: {
    color: "#fff",
    fontSize: 12,
  },

  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    marginVertical: 10,
  },

  videoItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  activeVideo: {
    borderWidth: 1,
    borderColor: "#60a5fa",
  },
  lesson: {
    color: "#94a3b8",
    fontSize: 12,
  },
  videoTitle: {
    color: "#fff",
    fontSize: 14,
  },
});


export default VideoPlayerScreen;

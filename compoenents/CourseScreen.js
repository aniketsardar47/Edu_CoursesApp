import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import VideoPlayerScreen from "./VideoPlayerScreen";
const CourseScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { courseId } = route.params || {};

  const [course, setCourse] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!courseId) {
      setError("Invalid course ID");
      setLoading(false);
      return;
    }

    Promise.all([
      fetch(`http://10.197.15.60:7777/api/courses/${courseId}`).then(res => {
        if (!res.ok) throw new Error("Course not found");
        return res.json();
      }),
      fetch(`http://10.197.15.60:7777/api/videos/course/${courseId}`).then(res => {
        if (!res.ok) throw new Error("Videos not found");
        return res.json();
      }),
    ])
      .then(([courseData, videosData]) => {
        setCourse(courseData);
        const list = Array.isArray(videosData)
          ? videosData
          : videosData.videos || [];
        setVideos(list);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [courseId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading course...</Text>
      </View>
    );
  }

  if (error || !course) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error || "Course not found"}</Text>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderVideo = ({ item, index }) => {
    const videoId = item._id || item.id;

    return (
      <TouchableOpacity
        style={styles.videoCard}
        onPress={() =>
          navigation.navigate("VideoPlayerScreen", {
            courseId,
            videoId,
          })
        }
      >
        <View style={styles.playIcon}>
          <Ionicons name="play-circle-outline" size={32} color="#60a5fa" />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.lesson}>Lesson {index + 1}</Text>
          <Text style={styles.videoTitle}>{item.title}</Text>
          <Text style={styles.videoDesc} numberOfLines={2}>
            {item.description}
          </Text>
        </View>

        <Text style={styles.duration}>{item.duration || "10:30"}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Back */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backRow}>
        <Ionicons name="chevron-back" size={22} color="#ccc" />
        <Text style={styles.backText}>Back to Courses</Text>
      </TouchableOpacity>

      {/* Course Header */}
      <View style={styles.header}>
        <Image
          source={{
            uri:
              course.thumbnail ||
              "https://images.unsplash.com/photo-1516321318423-f06f85e504b3",
          }}
          style={styles.thumbnail}
        />

        <Text style={styles.title}>{course.title}</Text>
        <Text style={styles.desc}>{course.description}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.meta}>{videos.length} Videos</Text>
          <Text style={styles.meta}>{course.duration || "Self-paced"}</Text>
          <Text style={styles.level}>{course.level || "Beginner"}</Text>
        </View>
      </View>

      {/* Videos */}
      <Text style={styles.sectionTitle}>Course Videos</Text>

      {videos.length === 0 ? (
        <Text style={styles.emptyText}>No videos available</Text>
      ) : (
        <FlatList
          data={videos}
          keyExtractor={(item) => item._id || item.id}
          renderItem={renderVideo}
          scrollEnabled={false}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: "10%",
    paddingBottom: "2%",
    backgroundColor: "#0a1929",
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0a1929",
  },
  loadingText: {
    color: "#fff",
    marginTop: 10,
  },
  errorText: {
    color: "#f87171",
    fontSize: 18,
    marginBottom: 16,
  },
  backBtn: {
    backgroundColor: "#3b82f6",
    padding: 10,
    borderRadius: 8,
  },
  backBtnText: {
    color: "#fff",
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  backText: {
    color: "#ccc",
    marginLeft: 6,
  },
  header: {
    backgroundColor: "#1e2f4a",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  thumbnail: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
  },
  desc: {
    color: "#cbd5e1",
    marginVertical: 8,
  },
  metaRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  meta: {
    color: "#94a3b8",
  },
  level: {
    color: "#60a5fa",
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  emptyText: {
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 20,
  },
  videoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
  },
  playIcon: {
    marginRight: 12,
  },
  lesson: {
    color: "#94a3b8",
    fontSize: 12,
  },
  videoTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  videoDesc: {
    color: "#94a3b8",
    fontSize: 13,
  },
  duration: {
    color: "#cbd5e1",
    fontSize: 12,
    marginLeft: 10,
  },
});


export default CourseScreen;

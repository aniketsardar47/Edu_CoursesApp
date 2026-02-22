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
import { useSelector } from "react-redux";

const CourseScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { courseId } = route.params || {};

  const [course, setCourse] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const videoProgress = useSelector(state => state.videoProgress.progressByVideo);

  useEffect(() => {
    if (!courseId) {
      setError("Invalid course ID");
      setLoading(false);
      return;
    }

    Promise.all([
      fetch(`http://10.107.25.116:7777/api/courses/${courseId}`).then(res => {
        if (!res.ok) throw new Error("Course not found");
        return res.json();
      }),
      fetch(`http://10.107.25.116:7777/api/videos/course/${courseId}`).then(res => {
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
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#bb86fc" />
          <Text style={styles.loadingText}>Loading course...</Text>
        </View>
      </View>
    );
  }

  if (error || !course) {
    return (
      <View style={styles.center}>
        <View style={styles.errorCard}>
          <Ionicons name="alert-circle" size={48} color="#bb86fc" />
          <Text style={styles.errorText}>{error || "Course not found"}</Text>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const renderVideo = ({ item, index }) => {
    const videoId = item._id || item.id;
    const progress = videoProgress[videoId];
    const isCompleted = progress && (progress.percentage >= 99 || progress.watchedSeconds >= progress.totalDuration);

    return (
      <TouchableOpacity
        style={[styles.videoCard, isCompleted && styles.completedVideoCard]}
        onPress={() =>
          navigation.navigate("VideoPlayerScreen", {
            courseId,
            videoId,
          })
        }
        activeOpacity={0.7}
      >
        <View style={styles.videoCardLeft}>
          <View style={[styles.videoIconContainer, isCompleted && styles.completedIconContainer]}>
            <Ionicons
              name={isCompleted ? "checkmark-done-circle" : "play"}
              size={24}
              color={isCompleted ? "#4ade80" : "#bb86fc"}
            />
          </View>

          <View style={styles.videoInfo}>
            <View style={[styles.lessonBadge, isCompleted && styles.completedLessonBadge]}>
              <Text style={[styles.lessonText, isCompleted && styles.completedLessonText]}>
                {isCompleted ? "Completed" : `Lesson ${index + 1}`}
              </Text>
            </View>
            <Text style={styles.videoTitle}>{item.title}</Text>
            <Text style={styles.videoDesc} numberOfLines={2}>
              {item.description || "No description available"}
            </Text>

            <View style={styles.videoMetaRow}>
              <View style={styles.videoMetaItem}>
                <Ionicons name="time-outline" size={12} color="#888" />
                <Text style={styles.videoMetaText}>{item.duration || "10:30"}</Text>
              </View>
              {progress && !isCompleted && (
                <View style={styles.videoMetaItem}>
                  <Ionicons name="stats-chart-outline" size={12} color="#bb86fc" />
                  <Text style={[styles.videoMetaText, { color: '#bb86fc' }]}>
                    {Math.round(progress.percentage)}% watched
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.playButton}>
          <Ionicons
            name={isCompleted ? "checkmark-circle" : "play-circle"}
            size={32}
            color={isCompleted ? "#4ade80" : "#bb86fc"}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backRow}
          activeOpacity={0.7}
        >
          <View style={styles.backIconContainer}>
            <Ionicons name="chevron-back" size={22} color="#bb86fc" />
          </View>
          <Text style={styles.backText}>Back to Courses</Text>
        </TouchableOpacity>

        {/* Course Header Card */}
        <View style={styles.headerCard}>
          <Image
            source={{
              uri:
                course.thumbnail ||
                "https://images.unsplash.com/photo-1516321318423-f06f85e504b3",
            }}
            style={styles.thumbnail}
          />

          <View style={styles.headerContent}>
            <Text style={styles.title}>{course.title}</Text>
            <Text style={styles.desc}>{course.description}</Text>

            <View style={styles.metaGrid}>
              <View style={styles.metaItem}>
                <Ionicons name="videocam-outline" size={16} color="#bb86fc" />
                <Text style={styles.metaText}>{videos.length} Videos</Text>
              </View>

              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={16} color="#bb86fc" />
                <Text style={styles.metaText}>{course.duration || "Self-placed"}</Text>
              </View>

              <View style={[styles.metaItem, styles.levelBadge]}>
                <Ionicons name="trending-up-outline" size={16} color="#bb86fc" />
                <Text style={styles.metaText}>{course.level || "Beginner"}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Videos Section */}
        <View style={styles.videosSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="list-outline" size={20} color="#bb86fc" />
            <Text style={styles.sectionTitle}>Course Videos</Text>
            <View style={styles.videoCountBadge}>
              <Text style={styles.videoCountText}>{videos.length}</Text>
            </View>
          </View>

          {videos.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="videocam-off-outline" size={48} color="#2a2a2a" />
              <Text style={styles.emptyText}>No videos available</Text>
            </View>
          ) : (
            <View style={styles.videoList}>
              {videos.map((item, index) => (
                <View key={item._id || item.id}>
                  {renderVideo({ item, index })}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  scrollContent: {
    paddingBottom: 30,
    paddingTop: 32,
  },
  center: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContent: {
    alignItems: "center",
  },
  loadingText: {
    color: "#bb86fc",
    marginTop: 12,
    fontSize: 16,
    fontWeight: "500",
  },
  errorCard: {
    backgroundColor: '#1a1a1a',
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  errorText: {
    color: "#f87171",
    fontSize: 16,
    marginTop: 12,
    marginBottom: 20,
    textAlign: 'center',
  },
  backBtn: {
    backgroundColor: '#7c3aed',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  backText: {
    color: "#bb86fc",
    fontSize: 15,
    fontWeight: "500",
  },
  headerCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  thumbnail: {
    width: "100%",
    height: 200,
  },
  headerContent: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  desc: {
    color: "#e0e0e0",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: '#0a0a0a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  metaText: {
    color: "#e0e0e0",
    fontSize: 13,
    fontWeight: "500",
  },
  levelBadge: {
    backgroundColor: 'rgba(187, 134, 252, 0.1)',
  },
  videosSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  videoCountBadge: {
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 'auto',
  },
  videoCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  videoList: {
    gap: 12,
  },
  videoCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  videoCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  videoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  videoInfo: {
    flex: 1,
  },
  lessonBadge: {
    backgroundColor: 'rgba(187, 134, 252, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginBottom: 4,
  },
  lessonText: {
    color: "#bb86fc",
    fontSize: 10,
    fontWeight: "600",
  },
  videoTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  videoDesc: {
    color: "#888",
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 6,
  },
  videoMetaRow: {
    flexDirection: "row",
    gap: 12,
  },
  videoMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  videoMetaText: {
    color: "#888",
    fontSize: 10,
  },
  playButton: {
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    gap: 12,
  },
  emptyText: {
    color: "#888",
    fontSize: 14,
  },
  completedVideoCard: {
    borderColor: 'rgba(74, 222, 128, 0.3)',
    backgroundColor: 'rgba(74, 222, 128, 0.05)',
  },
  completedIconContainer: {
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
  },
  completedLessonBadge: {
    backgroundColor: 'rgba(74, 222, 128, 0.2)',
  },
  completedLessonText: {
    color: '#4ade80',
  }
});

export default CourseScreen;
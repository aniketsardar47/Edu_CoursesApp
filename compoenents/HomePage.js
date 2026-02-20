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
import { useNavigation } from "@react-navigation/native";
import { BookOpen, Clock, Users, PlayCircle, Zap } from "lucide-react-native";
import * as Battery from "expo-battery";

const HomePage = () => {
  const navigation = useNavigation();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🔋 Battery state
  const [batteryLevel, setBatteryLevel] = useState(null);
  const [isBatterySaverOn, setIsBatterySaverOn] = useState(false);

  /* ================= BATTERY REAL-TIME SYNC ================= */
  useEffect(() => {
    let levelSub;
    let stateSub;

    const initBattery = async () => {
      try {
        const level = await Battery.getBatteryLevelAsync();
        const percent = Math.round(level * 100);
        setBatteryLevel(percent);
        setIsBatterySaverOn(percent <= 20);
      } catch (error) {
        console.log("Battery info not available");
      }
    };

    initBattery();

    // 🔋 Battery percentage changes
    const batteryLevelListener = Battery.addBatteryLevelListener(({ batteryLevel }) => {
      const percent = Math.round(batteryLevel * 100);
      setBatteryLevel(percent);
      setIsBatterySaverOn(percent <= 20);
    });

    // ⚡ Charging / unplugging detection
    const batteryStateListener = Battery.addBatteryStateListener(() => {
      Battery.getBatteryLevelAsync().then((level) => {
        const percent = Math.round(level * 100);
        setBatteryLevel(percent);
        setIsBatterySaverOn(percent <= 20);
      });
    });

    return () => {
      batteryLevelListener?.remove();
      batteryStateListener?.remove();
    };
  }, []);

  /* ================= FETCH COURSES ================= */
  useEffect(() => {
    fetch("http://10.197.15.60:7777/api/courses")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const list = Array.isArray(data)
          ? data
          : data.courses || data.data || [];
        setCourses(list);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  /* 🔄 LOADING */
  if (loading) {
    return (
      <View style={styles.center}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#bb86fc" />
          <Text style={styles.loadingText}>Loading courses...</Text>
        </View>
      </View>
    );
  }

  /* ❌ ERROR */
  if (error) {
    return (
      <View style={styles.center}>
        <View style={styles.errorCard}>
          <Zap size={48} color="#bb86fc" />
          <Text style={styles.errorText}>Error: {error}</Text>
          <Text style={styles.errorHint}>
            Make sure backend is running on port 7777
          </Text>
          <TouchableOpacity 
            style={styles.retryBtn}
            onPress={() => {
              setLoading(true);
              setError(null);
              // Retry logic would go here
            }}
          >
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /* 🚫 EMPTY */
  if (courses.length === 0) {
    return (
      <View style={styles.center}>
        <View style={styles.emptyCard}>
          <BookOpen size={48} color="#2a2a2a" />
          <Text style={styles.emptyText}>No courses found</Text>
        </View>
      </View>
    );
  }

  const getBatteryIcon = () => {
    if (batteryLevel <= 20) return "🔴";
    if (batteryLevel <= 50) return "🟡";
    return "🟢";
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Welcome Header with Purple Accent */}
        <View style={styles.headerSection}>
          <View style={styles.welcomeRow}>
            <View style={styles.welcomeAccent} />
            <View>
              <Text style={styles.heading}>Welcome to Edu_Course</Text>
              <Text style={styles.subHeading}>
                Choose a course to start learning
              </Text>
            </View>
          </View>
        </View>

        {/* 🔋 BATTERY STATUS CARD */}
        <View style={styles.batteryCard}>
          <View style={styles.batteryIconContainer}>
            <View style={[styles.batteryIcon, { backgroundColor: isBatterySaverOn ? '#bb86fc20' : '#4ade8020' }]}>
              <Text style={styles.batteryIconText}>{getBatteryIcon()}</Text>
            </View>
          </View>
          
          <View style={styles.batteryInfo}>
            <Text style={styles.batteryLabel}>
              Battery Level
            </Text>
            <View style={styles.batteryLevelRow}>
              <Text style={styles.batteryPercentage}>
                {batteryLevel ?? "--"}%
              </Text>
              <View style={[
                styles.batteryStatusBadge,
                { backgroundColor: isBatterySaverOn ? 'rgba(187, 134, 252, 0.1)' : 'rgba(74, 222, 128, 0.1)' }
              ]}>
                <Text style={[
                  styles.batteryStatusText,
                  { color: isBatterySaverOn ? "#bb86fc" : "#4ade80" }
                ]}>
                  {isBatterySaverOn ? "Saver Mode ON" : "Normal Mode"}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.batteryIndicator}>
            <View style={[styles.batteryFill, { width: `${batteryLevel || 0}%` }]} />
          </View>
        </View>

        {/* Courses Grid */}
        <View style={styles.coursesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Available Courses</Text>
            <View style={styles.courseCountBadge}>
              <Text style={styles.courseCountText}>{courses.length}</Text>
            </View>
          </View>

          <FlatList
            data={courses}
            keyExtractor={(item) => item._id || item.id}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.courseCard,
                  isBatterySaverOn && styles.batterySaverCard,
                ]}
                activeOpacity={0.8}
                onPress={() =>
                  navigation.navigate("CourseScreen", {
                    courseId: item._id || item.id,
                  })
                }
              >
                <Image
                  source={{
                    uri:
                      item.thumbnail ||
                      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3",
                  }}
                  style={styles.thumbnail}
                />

                <View style={styles.courseOverlay}>
                  <View style={styles.courseTag}>
                    <Text style={styles.courseTagText}>
                      {item.level || "Beginner"}
                    </Text>
                  </View>
                </View>

                <View style={styles.courseContent}>
                  <Text style={styles.courseTitle} numberOfLines={1}>
                    {item.title}
                  </Text>

                  <Text style={styles.courseDescription} numberOfLines={2}>
                    {item.description || "Learn the fundamentals and advance your skills"}
                  </Text>

                  {/* <View style={styles.courseMeta}>
                    <View style={styles.metaItem}>
                      <BookOpen size={12} color="#888" />
                      <Text style={styles.metaText}>
                        {item.videoCount || item.videos?.length || 0} lessons
                      </Text>
                    </View>

                    <View style={styles.metaItem}>
                      <Clock size={12} color="#888" />
                      <Text style={styles.metaText}>
                        {item.duration || "8h"}
                      </Text>
                    </View>
                  </View> */}

                  <View style={styles.courseFooter}>
                    <Text style={styles.coursePrice}>
                      {item.price ? `$${item.price}` : "Free"}
                    </Text>

                    <View style={styles.startButton}>
                      <PlayCircle size={14} color="#fff" />
                      <Text style={styles.startButtonText}>Start</Text>
                    </View>
                  </View>

                  {/* Students count indicator */}
                  {/* <View style={styles.studentsIndicator}>
                    <Users size={10} color="#bb86fc" />
                    <Text style={styles.studentsText}>
                      {item.students || "1.2k"} students
                    </Text>
                  </View> */}
                </View>

                {isBatterySaverOn && (
                  <View style={styles.batterySaverIndicator}>
                    <Zap size={12} color="#bb86fc" />
                  </View>
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default HomePage;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  scrollContent: {
    paddingBottom: 30,
    
    paddingTop:32,
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
    marginBottom: 8,
    textAlign: 'center',
  },
  errorHint: {
    color: "#888",
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryBtn: {
    backgroundColor: '#7c3aed',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#1a1a1a',
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    gap: 12,
  },
  emptyText: {
    color: "#888",
    fontSize: 16,
  },
  headerSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  welcomeAccent: {
    width: 4,
    height: 40,
    backgroundColor: '#bb86fc',
    borderRadius: 2,
  },
  heading: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  subHeading: {
    color: "#888",
    fontSize: 14,
  },
  batteryCard: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 16,
    marginVertical: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  batteryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  batteryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  batteryIconText: {
    fontSize: 20,
  },
  batteryInfo: {
    marginBottom: 12,
  },
  batteryLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 4,
  },
  batteryLevelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  batteryPercentage: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  batteryStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  batteryStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  batteryIndicator: {
    height: 4,
    backgroundColor: '#0a0a0a',
    borderRadius: 2,
    overflow: 'hidden',
  },
  batteryFill: {
    height: '100%',
    backgroundColor: '#bb86fc',
    borderRadius: 2,
  },
  coursesSection: {
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  courseCountBadge: {
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  courseCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  columnWrapper: {
    gap: 12,
    marginBottom: 12,
  },
  courseCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: '#2a2a2a',
    position: 'relative',
  },
  batterySaverCard: {
    opacity: 0.85,
  },
  thumbnail: {
    height: 100,
    width: "100%",
  },
  courseOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  courseTag: {
    backgroundColor: 'rgba(187, 134, 252, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  courseTagText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  courseContent: {
    padding: 12,
  },
  courseTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 4,
  },
  courseDescription: {
    color: "#888",
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 8,
  },
  courseMeta: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    color: "#888",
    fontSize: 10,
  },
  courseFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  coursePrice: {
    color: "#bb86fc",
    fontSize: 16,
    fontWeight: "bold",
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#7c3aed",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  startButtonText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  studentsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  studentsText: {
    color: '#888',
    fontSize: 9,
  },
  batterySaverIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    padding: 4,
  },
});
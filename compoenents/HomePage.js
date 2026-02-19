import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { BookOpen, Clock, Users, PlayCircle } from "lucide-react-native";
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
      const level = await Battery.getBatteryLevelAsync();
      const percent = Math.round(level * 100);
      setBatteryLevel(percent);
      setIsBatterySaverOn(percent <= 20);
    };

    initBattery();

    // 🔋 Battery percentage changes
    levelSub = Battery.addBatteryLevelListener(({ batteryLevel }) => {
      const percent = Math.round(batteryLevel * 100);
      setBatteryLevel(percent);
      setIsBatterySaverOn(percent <= 20);
    });

    // ⚡ Charging / unplugging detection
    stateSub = Battery.addBatteryStateListener(() => {
      Battery.getBatteryLevelAsync().then((level) => {
        const percent = Math.round(level * 100);
        setBatteryLevel(percent);
        setIsBatterySaverOn(percent <= 20);
      });
    });

    return () => {
      levelSub?.remove();
      stateSub?.remove();
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
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading courses...</Text>
      </View>
    );
  }

  /* ❌ ERROR */
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <Text style={styles.errorHint}>
          Make sure backend is running on port 7777
        </Text>
      </View>
    );
  }

  /* 🚫 EMPTY */
  if (courses.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No courses found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 🔋 BATTERY STATUS */}
      <View style={styles.batteryBox}>
        <Text style={styles.batteryText}>
          🔋 Battery: {batteryLevel ?? "--"}%
        </Text>

        <Text
          style={[
            styles.batteryStatus,
            { color: isBatterySaverOn ? "#f87171" : "#34d399" },
          ]}
        >
          {isBatterySaverOn
            ? "Battery Saver ON (Auto ≤ 20%)"
            : "Battery Saver OFF"}
        </Text>
      </View>

      <Text style={styles.heading}>Welcome to LearnHub</Text>
      <Text style={styles.subHeading}>
        Choose a course to start learning
      </Text>

      <FlatList
        data={courses}
        keyExtractor={(item) => item._id || item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 14 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.card,
              isBatterySaverOn && { opacity: 0.85 },
            ]}
            activeOpacity={0.8}
            onPress={() =>
              navigation.navigate("CourseScreen", {
                courseId: item._id || item.id,
                batterySaver: isBatterySaverOn,
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

            <View style={styles.cardBody}>
              <Text style={styles.title} numberOfLines={1}>
                {item.title}
              </Text>

              <Text style={styles.description} numberOfLines={2}>
                {item.description || "Learn the fundamentals and advance"}
              </Text>

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <BookOpen size={14} color="#9ca3af" />
                  <Text style={styles.metaText}>
                    {item.videoCount || item.videos?.length || 0}
                  </Text>
                </View>

                <View style={styles.metaItem}>
                  <Clock size={14} color="#9ca3af" />
                  <Text style={styles.metaText}>
                    {item.duration || "8h"}
                  </Text>
                </View>

                <View style={styles.metaItem}>
                  <Users size={14} color="#9ca3af" />
                  <Text style={styles.metaText}>
                    {item.students || "1.2k"}
                  </Text>
                </View>
              </View>

              <View style={styles.footer}>
                <Text style={styles.price}>
                  {item.price ? `$${item.price}` : "Free"}
                </Text>

                <View style={styles.startBtn}>
                  <PlayCircle size={16} color="#fff" />
                  <Text style={styles.startText}>Start</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export default HomePage;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: "50%",
    backgroundColor: "#0a1929",
    padding: 16,
  },
  center: {
    flex: 1,
    backgroundColor: "#0a1929",
    justifyContent: "center",
    alignItems: "center",
  },
  heading: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 6,
  },
  subHeading: {
    color: "#9ca3af",
    marginBottom: 20,
  },
  loadingText: {
    color: "#e5e7eb",
    marginTop: 12,
  },
  errorText: {
    color: "#f87171",
    fontSize: 18,
  },
  errorHint: {
    color: "#9ca3af",
    marginTop: 6,
  },
  emptyText: {
    color: "#fff",
    fontSize: 18,
  },
  card: {
    flex: 1,
    backgroundColor: "#1e2f4a",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 14,
  },
  thumbnail: {
    height: 120,
    width: "100%",
  },
  cardBody: {
    padding: 12,
  },
  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  description: {
    color: "#d1d5db",
    fontSize: 12,
    marginVertical: 6,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    color: "#9ca3af",
    fontSize: 12,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  price: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#3b82f6",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  startText: {
    color: "#fff",
    fontSize: 12,
  },
  batteryBox: {
    backgroundColor: "#16263b",
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  batteryText: {
    color: "#fff",
    fontSize: 14,
  },
  batteryStatus: {
    marginTop: 4,
    fontWeight: "bold",
  },
});

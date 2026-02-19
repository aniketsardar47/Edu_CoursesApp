import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { useVideoPlayer, VideoView } from "expo-video";
import useRealtimeSpeed from "./useRealtimeSpeed";

const { width } = Dimensions.get("window");

const VideoPlayer = () => {
  const route = useRoute();

  // ✅ GET PARAMS FROM NAVIGATION
  const { courseId, videoId } = route.params;

  const [quality, setQuality] = useState("Auto");
  const [videoData, setVideoData] = useState(null);
  const [isSwitching, setIsSwitching] = useState(false);

  const speed = useRealtimeSpeed(3000);

  // ✅ FETCH VIDEO USING courseId & videoId
  useEffect(() => {
    if (!courseId || !videoId) return;

    setVideoData(null); // reset when video changes

    fetch(
      `http://10.107.25.116:7777/api/videos/course/${courseId}/${videoId}`
    )
      .then((res) => res.json())
      .then((data) => setVideoData(data))
      .catch((err) => console.error("Fetch error:", err));
  }, [courseId, videoId]);

  // ✅ SELECT QUALITY BASED ON SPEED
  const currentUri = useMemo(() => {
    if (!videoData) return null;

    const res = videoData.resolutions;

    if (quality === "Auto") {
      if (speed < 1) return res?.p240;
      if (speed < 3) return res?.p360;
      return res?.p720;
    }

    const mapping = {
      "240p": res?.p240,
      "360p": res?.p360,
      "720p": res?.p720,
    };

    return mapping[quality];
  }, [quality, speed, videoData]);

  // ✅ INIT PLAYER
  const player = useVideoPlayer(currentUri, (p) => {
    p.play();
  });

  // ✅ SMOOTH QUALITY SWITCH
  useEffect(() => {
    if (!player || !currentUri) return;

    setIsSwitching(true);
    const currentTime = player.currentTime || 0;

    player.replace(currentUri);

    const timer = setTimeout(() => {
      player.currentTime = currentTime;
      player.play();
      setIsSwitching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [currentUri]);

  // ✅ LOADING STATE
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
      {/* VIDEO */}
      <View style={styles.videoWrapper}>
        
        <VideoView
          key={videoId} // ✅ force reload on lesson change
          player={player}
          
          style={styles.video}
          allowsFullscreen
          nativeControls
        />

        {isSwitching && (
          <View style={styles.overlay}>
            <ActivityIndicator color="#fff" />
            <Text style={styles.overlayText}>Optimizing...</Text>
          </View>
        )}
      </View>

      {/* QUALITY SELECTOR */}
      <View style={styles.card}>
        <Text style={styles.label}>SELECT QUALITY</Text>

        <View style={styles.buttonRow}>
          {["Auto", "240p", "360p", "720p"].map((res) => (
            <TouchableOpacity
              key={res}
              activeOpacity={0.7}
              style={[
                styles.qualityBtn,
                quality === res && styles.activeBtn,
              ]}
              onPress={() => setQuality(res)}
            >
              <Text
                style={[
                  styles.btnText,
                  quality === res && styles.activeBtnText,
                ]}
              >
                {res}
              </Text>


            </TouchableOpacity>
          ))}
        </View>
         
            
    
        {/* SPEED SECTION */}
        <View style={styles.speedCard}>
          <View style={styles.speedInfo}>
            <Text style={styles.speedValue}>
              {speed?.toFixed(1) || "0.0"}
            </Text>
            <Text style={styles.speedUnit}>Mbps</Text>
          </View>

          <Text style={styles.speedLabel}>
            REAL-TIME NETWORK SPEED
          </Text>

          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${Math.min((speed / 10) * 100, 100)}%`,
                },
              ]}
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default VideoPlayer;

const styles = StyleSheet.create({ container: { flex: 1, paddingTop: "50%", backgroundColor: "#0a1929", padding: 16 }, loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0a1929" }, loadingText: { color: "#94a3b8", marginTop: 10, fontWeight: "500" }, // Video Styles
 videoWrapper: { width: "100%", aspectRatio: 16 / 9, backgroundColor: "#000", borderRadius: 16, overflow: "hidden", elevation: 5 }, video: { width: "100%", height: "100%" }, overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }, overlayText: { color: 'white', marginTop: 8, fontSize: 12, fontWeight: 'bold' }, 
 card: { marginTop: 24, padding: 20, backgroundColor: "#1e2f4a", borderRadius: 20, borderWidth: 1, borderColor: "#2d3f5e" }, label: { color: "#3b82f6", fontSize: 10, fontWeight: "bold", letterSpacing: 1.5, marginBottom: 12 }, 
 buttonRow: { flexDirection: 'row', backgroundColor: '#0a1929', borderRadius: 12, padding: 4, marginBottom: 24 }, qualityBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 }, activeBtn: { backgroundColor: '#3b82f6' }, btnText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' }, activeBtnText: { color: '#ffffff' },
 speedCard: { alignItems: 'center', backgroundColor: '#0f172a', padding: 15, borderRadius: 15 }, speedInfo: { flexDirection: 'row', alignItems: 'baseline' }, speedValue: { fontSize: 32, fontWeight: '800', color: '#fff' }, speedUnit: { fontSize: 14, color: '#3b82f6', marginLeft: 4, fontWeight: 'bold' }, speedLabel: { fontSize: 9, color: '#64748b', marginTop: 2, letterSpacing: 1 },
 progressBarBg: { width: '100%', height: 4, backgroundColor: '#1e2f4a', borderRadius: 2, marginTop: 15, overflow: 'hidden' }, progressBarFill: { height: '100%', backgroundColor: '#3b82f6' } });



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

    if (percent <= 20) {
      setBatterySaverOn(true);
      setQuality("240p");
    } else {
      setBatterySaverOn(false);
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
          `http://10.107.25.116:7777/api/videos/course/${courseId}/${videoId}`
        );

        if (!res.ok) throw new Error("Video not found");
        const data = await res.json();
        setVideoData(data);

        const listRes = await fetch(
          `http://10.107.25.116:7777/api/videos/course/${courseId}`
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
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#bb86fc" />
          <Text style={styles.loadingText}>Loading video content...</Text>
        </View>
      </View>
    );
  }

  if (error || !videoData) {
    return (
      <View style={styles.center}>
        <View style={styles.errorCard}>
          <Ionicons name="alert-circle" size={48} color="#bb86fc" />
          <Text style={styles.error}>⚠ {error}</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
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
    <View style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Back Button with Purple Accent */}
        <TouchableOpacity
          style={styles.backRow}
          onPress={() => navigation.goBack()}
        >
          <View style={styles.backIconContainer}>
            <Ionicons name="chevron-back" size={22} color="#bb86fc" />
          </View>
          <Text style={styles.backText}>Back to Course</Text>
        </TouchableOpacity>

        {/* Title Section with Purple Accent */}
        <View style={styles.titleSection}>
          <View style={styles.titleAccent} />
          <View style={styles.titleContent}>
            <Text style={styles.title}>{videoData.title}</Text>
            
            {/* Battery and Speed Info in Row */}
            <View style={styles.infoRow}>
              {batteryLevel !== null && (
                <View style={styles.infoChip}>
                  <Ionicons 
                    name={batterySaverOn ? "battery-dead" : "battery-full"} 
                    size={14} 
                    color={batterySaverOn ? "#bb86fc" : "#4ade80"} 
                  />
                  <Text style={[styles.infoChipText, batterySaverOn && styles.batteryWarning]}>
                    {batteryLevel}% {batterySaverOn ? "(Saver)" : ""}
                  </Text>
                </View>
              )}

              {networkSpeed && (
                <View style={styles.infoChip}>
                  <Ionicons name="speedometer" size={14} color="#bb86fc" />
                  <Text style={styles.infoChipText}>{networkSpeed}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Video Player Card */}
        <View style={styles.playerCard}>
          <View style={[styles.playerBox, batterySaverOn && styles.batterySaverVideo]}>
            <Video
              ref={videoRef}
              source={{ uri: currentVideoUrl }}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay={isFocused}
              style={styles.video}
              onPlaybackStatusUpdate={(status) => {
                if (status.isLoaded) {
                  setLastPosition(status.positionMillis);
                }
              }}
              onReadyForDisplay={onReadyForDisplay}
            />
            {/* {batterySaverOn && (
              <View style={styles.batterySaverOverlay}>
                <Ionicons name="battery-dead" size={32} color="#bb86fc" />
                <Text style={styles.batterySaverText}>Battery Saver Mode Active</Text>
              </View>
            )} */}
          </View>
        </View>

        {/* Quality Selector - Matching Previous Design */}
        <View style={styles.qualityCard}>
          <View style={styles.qualityHeader}>
            <Ionicons name="settings-outline" size={18} color="#bb86fc" />
            <Text style={styles.qualityHeaderText}>VIDEO QUALITY</Text>
          </View>
          
          <View style={styles.qualityContainer}>
            {["Auto", "240p", "360p", "720p"].map((q) => (
              <TouchableOpacity
                key={q}
                disabled={batterySaverOn}
                onPress={() => setQuality(q)}
                style={[
                  styles.qualityBtn,
                  quality === q && styles.activeQuality,
                  batterySaverOn && styles.disabledQuality,
                ]}
              >
                {quality === q && (
                  <View style={styles.qualityIndicator}>
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  </View>
                )}
                <Text style={[
                  styles.qualityText,
                  quality === q && styles.activeQualityText
                ]}>
                  {q}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Description Card */}
        {/* <View style={styles.descriptionCard}>
          <View style={styles.descriptionHeader}>
            <Ionicons name="document-text-outline" size={18} color="#bb86fc" />
            <Text style={styles.descriptionHeaderText}>DESCRIPTION</Text>
          </View>
          
          <View style={styles.descriptionContent}>
            <Text style={styles.description}>
              {videoData.description || "No description available."}
            </Text>
          </View>
        </View> */}

        {/* Course Videos Section */}
        <View style={styles.playlistSection}>
          <View style={styles.playlistHeader}>
            <Ionicons name="list-outline" size={18} color="#bb86fc" />
            <Text style={styles.playlistHeaderText}>
              Course Videos ({courseVideos.length})
            </Text>
          </View>

          <View style={styles.playlistContainer}>
            {courseVideos.map((item, index) => {
              const vid = item._id || item.id;
              const active = vid === videoId;

              return (
                <TouchableOpacity
                  key={vid}
                  style={[
                    styles.playlistItem,
                    active && styles.activePlaylistItem
                  ]}
                  onPress={() => {
                    setLastPosition(0);
                    navigation.navigate("VideoPlayer", { courseId, videoId: vid });
                  }}
                >
                  <View style={styles.playlistItemLeft}>
                    <View style={[
                      styles.playlistIconContainer,
                      active && styles.activePlaylistIcon
                    ]}>
                      <Ionicons
                        name={active ? "play" : "play-outline"}
                        size={18}
                        color={active ? "#fff" : "#888"}
                      />
                    </View>
                    <View style={styles.playlistItemInfo}>
                      <Text style={styles.lessonNumber}>
                        Lesson {index + 1}
                      </Text>
                      <Text style={[
                        styles.playlistItemTitle,
                        active && styles.activePlaylistItemTitle
                      ]}>
                        {item.title}
                      </Text>
                    </View>
                  </View>
                  
                  {active && (
                    <View style={styles.activeIndicator}>
                      <Ionicons name="radio-button-on" size={16} color="#bb86fc" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default VideoPlayerScreen;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollContent: {
    paddingBottom: 30,
    paddingTop:32,
  },
  center: {
    flex: 1,
    backgroundColor: '#0a0a0a',
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
  error: {
    color: "#f87171",
    fontSize: 16,
    marginTop: 12,
    marginBottom: 20,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#7c3aed',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  backButtonText: {
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
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#121212',
    marginTop: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  titleAccent: {
    width: 4,
    height: 40,
    backgroundColor: '#bb86fc',
    borderRadius: 2,
    marginRight: 12,
  },
  titleContent: {
    flex: 1,
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  infoChipText: {
    color: '#888',
    fontSize: 11,
    fontWeight: '500',
  },
  batteryWarning: {
    color: '#bb86fc',
  },
  playerCard: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  playerBox: {
    backgroundColor: "#000",
    borderRadius: 16,
    overflow: "hidden",
    aspectRatio: 16 / 9,
    position: 'relative',
  },
  batterySaverVideo: {
    opacity: 0.7,
  },
  batterySaverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 10, 10, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  batterySaverText: {
    color: '#fff',
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  video: {
    width: "100%",
    height: "100%",
  },
  qualityCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  qualityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  qualityHeaderText: {
    color: "#bb86fc",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
  },
  qualityContainer: {
    flexDirection: 'row',
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 4,
  },
  qualityBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    position: 'relative',
  },
  activeQuality: {
    backgroundColor: '#bb86fc',
    shadowColor: '#bb86fc',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  disabledQuality: {
    opacity: 0.4,
  },
  qualityIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#9d4edd',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1a1a1a',
  },
  qualityText: {
    color: '#888',
    fontWeight: '600',
    fontSize: 14,
  },
  activeQualityText: {
    color: '#fff',
    fontWeight: '700',
  },
  // descriptionCard: {
  //   backgroundColor: '#1a1a1a',
  //   borderRadius: 16,
  //   marginHorizontal: 16,
  //   marginTop: 16,
  //   padding: 16,
  //   borderWidth: 1,
  //   borderColor: '#2a2a2a',
  // },
  // descriptionHeader: {
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   gap: 8,
  //   marginBottom: 12,
  // },
  // descriptionHeaderText: {
  //   color: "#bb86fc",
  //   fontSize: 13,
  //   fontWeight: "700",
  //   letterSpacing: 1,
  // },
  // descriptionContent: {
  //   backgroundColor: '#0a0a0a',
  //   borderRadius: 12,
  //   padding: 12,
  // },
  // description: {
  //   color: "#e0e0e0",
  //   fontSize: 14,
  //   lineHeight: 22,
  // },
  playlistSection: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  playlistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  playlistHeaderText: {
    color: "#bb86fc",
    fontSize: 16,
    fontWeight: "700",
  },
  playlistContainer: {
    gap: 8,
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  activePlaylistItem: {
    borderColor: '#bb86fc',
    backgroundColor: '#1f1f1f',
  },
  playlistItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  playlistIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activePlaylistIcon: {
    backgroundColor: '#7c3aed',
  },
  playlistItemInfo: {
    flex: 1,
  },
  lessonNumber: {
    color: "#888",
    fontSize: 11,
    marginBottom: 2,
  },
  playlistItemTitle: {
    color: "#e0e0e0",
    fontSize: 14,
    fontWeight: "500",
  },
  activePlaylistItemTitle: {
    color: "#fff",
    fontWeight: "600",
  },
  activeIndicator: {
    marginLeft: 8,
  },
});

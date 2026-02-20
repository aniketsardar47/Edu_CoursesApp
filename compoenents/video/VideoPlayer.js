import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from "react-native";
import { useRoute, useNavigation, useIsFocused } from "@react-navigation/native"; 
import { Video } from "expo-av";
import { downloadVideo } from "../utils/DownloadManager";
import * as FileSystemLegacy from "expo-file-system/legacy";
import * as Linking from "expo-linking";
import * as Sharing from "expo-sharing";
import { Ionicons } from "@expo/vector-icons";
import useRealtimeSpeed from "./useRealtimeSpeed";
import * as Battery from "expo-battery"; 

const { width } = Dimensions.get("window");

const VideoPlayer = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const isFocused = useIsFocused(); 
  const { courseId, videoId } = route.params;

  const videoRef = useRef(null);
  const [videoData, setVideoData] = useState(null);
  const [quality, setQuality] = useState("Auto");
  const [localUri, setLocalUri] = useState(null);
  const [descriptionText, setDescriptionText] = useState("");
  const [loadingDescription, setLoadingDescription] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);

  const [batterySaverOn, setBatterySaverOn] = useState(false);
  
  const rawSpeed = useRealtimeSpeed(3000) ?? 0;
  const speed = batterySaverOn ? 0 : rawSpeed;

   useEffect(() => {
    Battery.getBatteryLevelAsync().then((level) => {
      const percent = Math.round(level * 100);
      if (percent <= 20) {
        setBatterySaverOn(true);
        setQuality("240p");
      }
    });

    const sub = Battery.addBatteryLevelListener(({ batteryLevel }) => {
      const percent = Math.round(batteryLevel * 100);
      if (percent <= 20) {
        setBatterySaverOn(true);
        setQuality("240p");
        videoRef.current?.pauseAsync();
      } else {
        setBatterySaverOn(false);
      }
    });

    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!courseId || !videoId) return;
    fetch(`http://10.197.15.60:7777/api/videos/course/${courseId}/${videoId}`)
      .then((res) => res.json())
      .then(setVideoData)
      .catch((err) => console.error("Fetch error:", err));
  }, [courseId, videoId]);

  useEffect(() => {
    const fetchDescription = async () => {
      if (!videoData?.descriptionUrl) return;
      try {
        setLoadingDescription(true);
        const response = await fetch(videoData.descriptionUrl);
        const text = await response.text();
        setDescriptionText(text);
      } catch {
        setDescriptionText("Description not available.");
      } finally {
        setLoadingDescription(false);
      }
    };
    fetchDescription();
  }, [videoData?.descriptionUrl]);

  const renderFormattedText = (text) => {
    if (!text) return null;
    const parts = text.split(/(\*[^*]+\*)/g);
    return parts.map((part, index) =>
      part.startsWith("*") && part.endsWith("*") ? (
        <Text key={index} style={styles.boldHighlight}>{part.slice(1, -1)}</Text>
      ) : (
        <Text key={index} style={styles.normalText}>{part}</Text>
      )
    );
  };

  const currentUri = useMemo(() => {
    if (!videoData) return null;
    const res = videoData.resolutions || {};
    if (quality === "Auto") {
      if (speed < 1) return res.p240 || videoData.url;
      if (speed < 3) return res.p360 || videoData.url;
      return res.p720 || videoData.url;
    }
    return res[quality.replace("p", "p")] || videoData.url;
  }, [quality, speed, videoData]);

  const sourceUri = localUri || currentUri;

  const shareVideo = async () => {
    try {
      if (!localUri) {
        Alert.alert("Download required", "Please download the video first");
        return;
      }
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("Not supported", "Sharing not supported on this device");
        return;
      }
      await Sharing.shareAsync(localUri, {
        mimeType: "video/mp4",
        dialogTitle: "Share video",
      });
    } catch (e) {
      Alert.alert("Error", "Failed to share video");
    }
  };

  const downloadAttachment = async (url, fileName) => {
    try {
      const safeFileName = fileName.replace(/\s+/g, "_");
      const fileUri = FileSystemLegacy.documentDirectory + safeFileName;
      const result = await FileSystemLegacy.downloadAsync(url, fileUri);
      if (result.status === 200 && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(result.uri);
      }
    } catch (error) {
      Alert.alert("Download Error", "Could not complete download.");
    }
  };

  const openAttachment = async (url) => {
    const supported = await Linking.canOpenURL(url);
    supported ? Linking.openURL(url) : Alert.alert("Cannot open file");
  };

  if (!videoData || !sourceUri) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#bb86fc" />
          <Text style={styles.loadingText}>Loading video...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Video Player */}
        <View style={[styles.videoWrapper, batterySaverOn && styles.batterySaverVideo]}>
          <Video
            ref={videoRef}
            source={{ uri: sourceUri }}
            style={styles.video}
            useNativeControls
            resizeMode="contain"
            shouldPlay={!batterySaverOn && isFocused}
          />
          {batterySaverOn && (
            <View style={styles.batterySaverOverlay}>
              <Ionicons name="battery-dead" size={32} color="#bb86fc" />
              <Text style={styles.batterySaverText}>Battery Saver Mode Active</Text>
            </View>
          )}
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <View style={styles.titleAccent} />
          <Text style={styles.videoTitle}>{videoData.title || "Video Lesson"}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={async () => {
              const uri = await downloadVideo(sourceUri, videoData.title);
              if (uri) {
                setLocalUri(uri);
                Alert.alert("Success", "Video downloaded successfully");
              } else {
                Alert.alert("Error", "Download failed");
              }
            }}
          >
            <View style={[styles.actionContent, styles.downloadBtn]}>
              <Ionicons name="download-outline" size={22} color="#fff" />
              <Text style={styles.actionText}>Download</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, !localUri && styles.disabledBtn]}
            onPress={shareVideo}
            disabled={!localUri}
          >
            <View style={[styles.actionContent, !localUri ? styles.disabledShareBtn : styles.shareBtn]}>
              <Ionicons name="share-social-outline" size={22} color="#fff" />
              <Text style={styles.actionText}>Share</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Quality Selector */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="settings-outline" size={18} color="#bb86fc" />
            <Text style={styles.sectionTitle}>VIDEO QUALITY</Text>
          </View>
          
          <View style={styles.qualityContainer}>
            {["Auto", "240p", "360p", "720p"].map((q) => (
              <TouchableOpacity
                key={q}
                disabled={batterySaverOn}
                style={[
                  styles.qualityOption,
                  quality === q && styles.activeQuality,
                  batterySaverOn && styles.disabledQuality,
                ]}
                onPress={() => setQuality(q)}
              >
                {quality === q && (
                  <View style={styles.qualityIndicator}>
                    <Ionicons name="checkmark" size={14} color="#fff" />
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

          {!batterySaverOn && (
            <View style={styles.speedContainer}>
              <View style={styles.speedIconContainer}>
                <Ionicons name="speedometer-outline" size={20} color="#bb86fc" />
              </View>
              <View style={styles.speedInfo}>
                <Text style={styles.speedLabel}>Current Speed</Text>
                <Text style={styles.speedValue}>{speed.toFixed(1)} Mbps</Text>
              </View>
            </View>
          )}
        </View>

        {/* Description Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text-outline" size={18} color="#bb86fc" />
            <Text style={styles.sectionTitle}>DESCRIPTION</Text>
          </View>
          
          <View style={styles.descriptionContainer}>
            {loadingDescription ? (
              <ActivityIndicator size="small" color="#bb86fc" />
            ) : (
              <>
                <Text numberOfLines={5} style={styles.descriptionText}>
                  {descriptionText}
                </Text>
                {descriptionText.length > 200 && (
                  <TouchableOpacity onPress={() => setShowFullDesc(true)} style={styles.readMoreBtn}>
                    <Text style={styles.readMoreText}>Read More</Text>
                    <Ionicons name="arrow-forward" size={16} color="#bb86fc" />
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>

        {/* Attachments Section */}
        {Array.isArray(videoData.attachments) && videoData.attachments.length > 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="attach-outline" size={18} color="#bb86fc" />
              <Text style={styles.sectionTitle}>ATTACHMENTS</Text>
            </View>
            
            {videoData.attachments.map((f, index) => (
              <View key={f._id} style={[
                styles.attachmentItem,
                index < videoData.attachments.length - 1 && styles.attachmentBorder
              ]}>
                <View style={styles.attachmentIcon}>
                  <Ionicons 
                    name={f.fileType === 'pdf' ? 'document-pdf' : 'document'} 
                    size={24} 
                    color="#bb86fc" 
                  />
                </View>
                
                <TouchableOpacity 
                  style={styles.attachmentContent}
                  onPress={() => openAttachment(f.downloadUrl)}
                >
                  <Text style={styles.attachmentName} numberOfLines={1}>
                    {f.fileName}
                  </Text>
                  <Text style={styles.attachmentMeta}>
                    {f.fileType.toUpperCase()} • {f.size.toFixed(2)} MB
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.attachmentDownload}
                  onPress={() => downloadAttachment(f.downloadUrl, f.fileName)}
                >
                  <Ionicons name="download" size={20} color="#bb86fc" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Quiz Button */}
        {videoData.quiz?.length > 0 && (
          <TouchableOpacity 
            style={styles.quizBtn}
            onPress={() => navigation.navigate("QuizScreen", { quiz: videoData.quiz })}
          >
            <View style={styles.quizContent}>
              <Ionicons name="help-circle-outline" size={24} color="#fff" />
              <View style={styles.quizTextContainer}>
                <Text style={styles.quizBtnText}>Start Quiz</Text>
                <Text style={styles.quizSubText}>Test your knowledge</Text>
              </View>
              <View style={styles.quizArrow}>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Full Description Modal */}
        <Modal 
          visible={showFullDesc} 
          transparent 
          animationType="fade" 
          onRequestClose={() => setShowFullDesc(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Full Description</Text>
                <TouchableOpacity onPress={() => setShowFullDesc(false)} style={styles.modalCloseBtn}>
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                {renderFormattedText(descriptionText)}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
    paddingTop:32,
  },
  loadingContainer: {
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
  videoWrapper: {
    width: "100%",
    paddingHorizontal: 10,
    aspectRatio: 16 / 9,
    backgroundColor: "#000",
    position: "relative",
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
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#121212',
    marginTop: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  titleAccent: {
    width: 4,
    height: 24,
    backgroundColor: '#bb86fc',
    borderRadius: 2,
    marginRight: 12,
  },
  videoTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    letterSpacing: 0.5,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    marginTop: 16,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  actionContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  downloadBtn: {
    backgroundColor: '#7c3aed',
  },
  shareBtn: {
    backgroundColor: '#9d4edd',
  },
  disabledShareBtn: {
    backgroundColor: '#333333',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  actionText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  sectionCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
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
    marginBottom: 16,
  },
  qualityOption: {
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
  speedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 12,
  },
  speedIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  speedInfo: {
    flex: 1,
  },
  speedLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 2,
  },
  speedValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  descriptionContainer: {
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 12,
  },
  descriptionText: {
    color: "#e0e0e0",
    fontSize: 14,
    lineHeight: 22,
  },
  readMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 4,
  },
  readMoreText: {
    color: '#bb86fc',
    fontSize: 14,
    fontWeight: '600',
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  attachmentBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  attachmentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  attachmentContent: {
    flex: 1,
    marginRight: 12,
  },
  attachmentName: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
    marginBottom: 2,
  },
  attachmentMeta: {
    color: "#888",
    fontSize: 12,
  },
  attachmentDownload: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quizBtn: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#7c3aed',
    elevation: 5,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  quizContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  quizTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  quizBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  quizSubText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    marginTop: 2,
  },
  quizArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '70%',
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
    backgroundColor: '#121212',
  },
  modalTitle: {
    color: '#bb86fc',
    fontSize: 18,
    fontWeight: '700',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalContent: {
    padding: 16,
    maxHeight: 400,
  },
  normalText: {
    color: "#e0e0e0",
    fontSize: 14,
    lineHeight: 22,
  },
  boldHighlight: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
    lineHeight: 22,
  },
});

export default VideoPlayer;
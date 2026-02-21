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
  Platform,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useRoute, useNavigation, useIsFocused } from "@react-navigation/native";
import { Video } from "expo-av";
import { downloadVideo } from "../utils/DownloadManager";
import * as FileSystemLegacy from "expo-file-system/legacy";
import * as Linking from "expo-linking";
import * as Sharing from "expo-sharing";
import { Ionicons } from "@expo/vector-icons";
import useRealtimeSpeed from "./useRealtimeSpeed";
import * as Battery from "expo-battery";
import { BlurView } from 'expo-blur';
import { useDispatch, useSelector } from "react-redux"; // ADD THIS
import { addDownload } from "../redux/DownloadSlice";
import { updateVideoProgress } from "../redux/VideoProgressSlice";
import { createDownloadResumable, encryptFile } from "../utils/DownloadManager";
import { speakEnglishText, stopSpeech } from "../utils/TextToSpeech";

const { width } = Dimensions.get("window");

const VideoPlayer = () => {
  const dispatch = useDispatch();
  const route = useRoute();
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { courseId, videoId } = route.params;

  const videoRef = useRef(null);
  const [videoData, setVideoData] = useState(null);
  const [quality, setQuality] = useState("Auto");
  const [localUri, setLocalUri] = useState(null);
  const [descriptionText, setDescriptionText] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [originalText, setOriginalText] = useState("");
  const [translating, setTranslating] = useState(false);
  const [loadingDescription, setLoadingDescription] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [shouldResume, setShouldResume] = useState(true); // Default to true to check for saved position
  const [isIdle, setIsIdle] = useState(false);
  const idleTimerRef = useRef(null);

  // Ref to track last playback position for engagement calculation
  const lastPositionRef = useRef(0);
  // Ref to track total watched milliseconds in current session or overall
  const watchedMillisRef = useRef(0);
  // Local state to drive UI progress dynamically with ms precision
  const [localWatchedMillis, setLocalWatchedMillis] = useState(0);
  const [totalDurationMillis, setTotalDurationMillis] = useState(0);

  const savedProgress = useSelector(state => state.videoProgress.progressByVideo[videoId]);

  // Set initial watched time from Redux if it exists
  useEffect(() => {
    if (savedProgress) {
      watchedMillisRef.current = savedProgress.watchedSeconds * 1000;
      setLocalWatchedMillis(savedProgress.watchedSeconds * 1000);
      setTotalDurationMillis(savedProgress.totalDuration * 1000);
      lastPositionRef.current = savedProgress.lastPosition;
      setPlaybackPosition(savedProgress.lastPosition); // Set initial local position
    } else {
      watchedMillisRef.current = 0;
      setLocalWatchedMillis(0);
      setTotalDurationMillis(0);
      lastPositionRef.current = 0;
      setPlaybackPosition(0);
    }
    setShouldResume(true); // Always allow resume when video changes
  }, [videoId]);

  const [downloadProgress, setDownloadProgress] = useState(0); // 0 to 1
  const [isDownloading, setIsDownloading] = useState(false);

  const [batterySaverOn, setBatterySaverOn] = useState(false);

  const rawSpeed = useRealtimeSpeed(3000) ?? 0;
  const speed = batterySaverOn ? 0 : rawSpeed;



  const resetIdleTimer = () => {
    // If it was blurred, remove blur and play
    if (isIdle) {
      setIsIdle(false);
      videoRef.current?.playAsync();
    }

    // Clear existing timer
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

    // Set new timer for 10 seconds
    idleTimerRef.current = setTimeout(() => {
      handleInactivity();
    }, 10000);
  };

  const handleInactivity = () => {
    setIsIdle(true);
    // Pause video after the 3-second delay you requested
    setTimeout(() => {
      videoRef.current?.pauseAsync();
    }, 30000);
  };

  // Initialize timer on mount
  useEffect(() => {
    resetIdleTimer();
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  useEffect(() => {
    Battery.getBatteryLevelAsync().then((level) => {
      const percent = Math.round(level * 100);
      if (percent <= 20) {
        setBatterySaverOn(true);
        setQuality("240p");
      } else {
        setBatterySaverOn(false);
      }
    });

    const sub = Battery.addBatteryLevelListener(({ batteryLevel }) => {
      const percent = Math.round(batteryLevel * 100);
      if (percent <= 20) {
        setBatterySaverOn(true);
        setQuality("240p"); // ✅ force 240p
      } else {
        setBatterySaverOn(false);
      }
    });

    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!courseId || !videoId) return;
    fetch(`http://10.197.15.102:7777/api/videos/course/${courseId}/${videoId}`)
      .then((res) => res.json())
      .then(setVideoData)
      .catch((err) => console.error("Fetch error:", err));
  }, [courseId, videoId]);

  //   useEffect(() => {
  //   const fetchDescription = async () => {
  //     if (!videoData?.descriptionUrl) return;
  //     try {
  //       setLoadingDescription(true);
  //       const response = await fetch(videoData.descriptionUrl);
  //       const text = await response.text();

  //       setDescriptionText(text);
  //       setOriginalText(text); // IMPORTANT: store original text

  //     } catch {
  //       setDescriptionText("Description not available.");
  //     } finally {
  //       setLoadingDescription(false);
  //     }
  //   };
  //   fetchDescription();
  // }, [videoData?.descriptionUrl]);

  useEffect(() => {
    const fetchInitialDescription = async () => {
      // Note: checking for english inside the new descriptionUrls object
      if (!videoData?.descriptionUrls?.english) {
        // Fallback to legacy single URL if present
        if (videoData?.descriptionUrl) {
          try {
            setLoadingDescription(true);
            const response = await fetch(videoData.descriptionUrl);
            const text = await response.text();
            setDescriptionText(text);
            setOriginalText(text);
          } catch (error) {
            console.error("Error fetching legacy description:", error);
          } finally {
            setLoadingDescription(false);
          }
        }
        return;
      }

      try {
        setLoadingDescription(true);
        const response = await fetch(videoData.descriptionUrls.english);
        const text = await response.text();

        setDescriptionText(text);
        setOriginalText(text); // Keep English as the reference
        setSelectedLanguage("en"); // Reset picker to English on video change
      } catch (error) {
        console.error("Error fetching description:", error);
        setDescriptionText("Description not available.");
      } finally {
        setLoadingDescription(false);
      }
    };

    fetchInitialDescription();
  }, [videoData?.descriptionUrls?.english, videoData?.descriptionUrl]);

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

  useEffect(() => {
    if (sourceUri) {
      setShouldResume(true);
    }
  }, [sourceUri]);

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

  const translateDescription = async (targetLang) => {
    if (!videoData?.descriptionUrls) {
      // Legacy API-based translation fallback if descriptionUrls is missing
      if (!originalText) return;

      const languageMap = {
        en: "English",
        hi: "Hindi",
        mr: "Marathi",
        te: "Telugu",
        ta: "Tamil",
      };

      if (targetLang === "en") {
        setDescriptionText(originalText);
        return;
      }

      try {
        setTranslating(true);
        const response = await fetch(
          "http://10.197.15.102:7777/api/translate/translate",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              text: originalText,
              target: languageMap[targetLang],
            }),
          }
        );
        const data = await response.json();
        if (data.translatedText) {
          setDescriptionText(data.translatedText);
        } else {
          Alert.alert("Translation failed");
        }
      } catch (error) {
        console.log("Translation Error:", error);
        Alert.alert("Translation Failed");
      } finally {
        setTranslating(false);
      }
      return;
    }

    // Map the picker values (en, hi, etc.) to your JSON keys (english, hindi, etc.)
    const languageMap = {
      en: "english",
      hi: "hindi",
      mr: "marathi",
      te: "telugu",
      ta: "tamil",
    };

    const targetKey = languageMap[targetLang];
    const targetUrl = videoData.descriptionUrls[targetKey];

    if (!targetUrl) {
      Alert.alert("Error", "Translation file not found for this language.");
      return;
    }

    try {
      setTranslating(true);

      // Fetch the text file directly from the URL (ImageKit)
      const response = await fetch(targetUrl);
      const text = await response.text();

      if (text) {
        setDescriptionText(text);
      } else {
        Alert.alert("Error", "Translation file is empty.");
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      Alert.alert("Failed", "Could not load the translated description.");
    } finally {
      setTranslating(false);
    }
  };


  const handleSpeakDescription = () => {
    console.log("Speaking text:", descriptionText);

    if (selectedLanguage !== "en") {
      Alert.alert("Text to Speech available only in English");
      return;
    }

    if (!descriptionText || descriptionText.trim().length === 0) {
      Alert.alert("No text available to speak");
      return;
    }

    speakEnglishText(descriptionText);
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

  const handleDownloadAction = async () => {
    if (isDownloading) return;

    try {
      setIsDownloading(true);
      setDownloadProgress(0);

      const filename = videoData.title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
      const resumable = createDownloadResumable(
        videoData.url,
        filename,
        (progress) => setDownloadProgress(progress)
      );

      const result = await resumable.downloadAsync();

      if (result && result.uri) {
        // Move to dedicated folder and encrypt
        const finalUri = await encryptFile(result.uri, filename);

        if (finalUri) {
          dispatch(addDownload({
            id: videoId,
            courseId: courseId,
            title: videoData.title,
            localUri: finalUri, // This will now be .../CourseDownloads/filename.dat
            thumbnail: videoData.thumbnail || "https://via.placeholder.com/150",
            timestamp: new Date().toISOString(),
          }));
          Alert.alert("Success", "Video downloaded to secure folder!");
        }
      }
    } catch (error) {
      console.error("Download Error:", error);
      Alert.alert("Error", "Download failed.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <View style={styles.container} onTouchStart={resetIdleTimer}>
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
            shouldPlay={isFocused}
            progressUpdateIntervalMillis={100} // Smooth updates for UI
            onPlaybackStatusUpdate={(status) => {
              if (status.isLoaded) {
                setPlaybackPosition(status.positionMillis);
                if (status.durationMillis) {
                  setTotalDurationMillis(status.durationMillis);
                }

                // --- Engagement Tracking Logic ---
                if (status.isPlaying) {
                  const diff = status.positionMillis - lastPositionRef.current;

                  // If the difference is small and positive (e.g., between 0 and 1500ms), 
                  // it's likely normal playback, so we count it as engagement.
                  if (diff > 0 && diff < 1500) {
                    watchedMillisRef.current += diff;
                    setLocalWatchedMillis(watchedMillisRef.current);
                  }

                  // Periodically update Redux (every 3 seconds of engagement)
                  const currentSeconds = Math.floor(watchedMillisRef.current / 1000);
                  const lastSavedSeconds = savedProgress?.watchedSeconds || 0;
                  const totalDurationSeconds = Math.floor(status.durationMillis / 1000);

                  if (currentSeconds > lastSavedSeconds + 3) {
                    console.log(`Updating progress for ${videoId}: ${currentSeconds}s`);
                    dispatch(updateVideoProgress({
                      videoId,
                      watchedSeconds: currentSeconds,
                      totalDuration: totalDurationSeconds,
                      lastPosition: status.positionMillis
                    }));
                  }
                }

                if (status.didJustFinish) {
                  console.log(`Video finished: ${videoId}`);
                  const durationSeconds = Math.floor(status.durationMillis / 1000);

                  // Force 100% watched on finish
                  watchedMillisRef.current = status.durationMillis;
                  setLocalWatchedMillis(status.durationMillis);

                  dispatch(updateVideoProgress({
                    videoId,
                    watchedSeconds: durationSeconds,
                    totalDuration: durationSeconds,
                    lastPosition: status.durationMillis
                  }));
                }
                lastPositionRef.current = status.positionMillis;
              }
            }}
            onLoad={(status) => {
              console.log(`Video loaded. shouldResume: ${shouldResume}, local: ${playbackPosition}, saved: ${savedProgress?.lastPosition}`);

              // Priority 1: If it's a reload (shouldResume is true but we already have a session playbackPosition)
              // Priority 2: If it's the initial load for this video (shouldResume is true, using saved position)

              const targetPosition = playbackPosition > 0 ? playbackPosition : (savedProgress?.lastPosition || 0);

              if (shouldResume && targetPosition > 0) {
                videoRef.current?.setPositionAsync(targetPosition);
              }

              if (isFocused) {
                videoRef.current?.playAsync();
              }

              setShouldResume(false);
            }}
          />
          {isIdle && (
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill}>
              <View style={styles.idleOverlay}>
                <Ionicons name="play-circle" size={80} color="white" opacity={0.8} />
                <Text style={styles.idleText}>Tap to Resume Learning</Text>
              </View>
            </BlurView>
          )}
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <View style={styles.titleAccent} />
          <Text style={styles.videoTitle}>{videoData.title || "Video Lesson"}</Text>
        </View>

        {/* Learning Progress Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="analytics-outline" size={18} color="#bb86fc" />
            <Text style={styles.sectionTitle}>LEARNING PROGRESS</Text>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.learningProgressBarBg}>
              <View
                style={[
                  styles.learningProgressBarFill,
                  {
                    width: `${totalDurationMillis > 0 ? Math.min((localWatchedMillis / totalDurationMillis) * 100, 100) : 0}%`
                  }
                ]}
              />
            </View>
            <View style={styles.progressInfo}>
              <Text style={styles.progressText}>
                {totalDurationMillis > 0 ? Math.round(Math.min((localWatchedMillis / totalDurationMillis) * 100, 100)) : 0}% Completed
              </Text>
              <Text style={styles.progressText}>
                {Math.floor(localWatchedMillis / 1000)}s / {Math.floor(totalDurationMillis / 1000)}s
              </Text>
            </View>
          </View>

          {totalDurationMillis > 0 && localWatchedMillis >= totalDurationMillis && (
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#4ade80" />
              <Text style={styles.completedText}>Lesson Completed</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, isDownloading && styles.disabledBtn]}
            onPress={handleDownloadAction}
            disabled={isDownloading}
          >
            <View style={[styles.actionContent, styles.downloadBtn]}>
              {isDownloading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="download-outline" size={22} color="#fff" />
              )}
              <Text style={styles.actionText}>
                {isDownloading ? `${Math.round(downloadProgress * 100)}%` : "Download"}
              </Text>
            </View>

            {/* Progress Bar Background */}
            {isDownloading && (
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarFill, { width: `${downloadProgress * 100}%` }]} />
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, !localUri && styles.disabledBtn]}
            onPress={shareVideo}
            disabled={!localUri || isDownloading}
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
                onPress={() => {
                  setShouldResume(true);
                  setQuality(q);
                }}
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
                <Text style={styles.speedLabel}>Network Speed</Text>
                {/* Multiply Mbps by 1000 to get kbps */}
                <Text style={styles.speedValue}>
                  {Math.round(speed * 100)} kbps
                </Text>
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

          {/* NEW: Styled Language Display Card */}
          <View style={styles.languageDisplayCard}>
            <Text style={styles.selectedLanguageText}>
              {selectedLanguage === 'en' ? 'English' :
                selectedLanguage === 'hi' ? 'Hindi' :
                  selectedLanguage === 'mr' ? 'Marathi' :
                    selectedLanguage === 'te' ? 'Telugu' : 'Tamil'}
            </Text>

            {/* Hidden Picker that triggers on tap of the arrow */}
            <View style={styles.pickerOverlayContainer}>
              <Picker
                selectedValue={selectedLanguage}
                dropdownIconColor="#bb86fc"
                style={styles.hiddenPicker}
                onValueChange={(itemValue) => {
                  setSelectedLanguage(itemValue);
                  translateDescription(itemValue);
                }}
              >
                <Picker.Item label="English" value="en" />
                <Picker.Item label="Hindi" value="hi" />
                <Picker.Item label="Marathi" value="mr" />
                <Picker.Item label="Telugu" value="te" />
                <Picker.Item label="Tamil" value="ta" />
              </Picker>
            </View>
          </View>

          <View style={styles.descriptionContainer}>
            {loadingDescription || translating ? (
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

                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  {selectedLanguage === "en" && (
                    <TouchableOpacity onPress={handleSpeakDescription}>
                      <Ionicons name="volume-high-outline" size={22} color="#bb86fc" />
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    onPress={() => {
                      stopSpeech();
                      setShowFullDesc(false);
                    }}
                    style={styles.modalCloseBtn}
                  >
                    <Ionicons name="close" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                {renderFormattedText(descriptionText)}
              </ScrollView>
            </View>
          </View>
        </Modal>

      </ScrollView>
      {
        isIdle && (
          <BlurView
            intensity={60}
            tint="dark"
            style={[StyleSheet.absoluteFill, { zIndex: 999 }]}
          />
        )
      }
    </View >
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
    paddingTop: 32,
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
  progressContainer: {
    marginTop: 8,
  },
  learningProgressBarBg: {
    height: 8,
    backgroundColor: '#0a0a0a',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  learningProgressBarFill: {
    height: '100%',
    backgroundColor: '#bb86fc',
    borderRadius: 4,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    padding: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  completedText: {
    color: '#4ade80',
    fontSize: 12,
    fontWeight: '700',
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
  progressBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#fff', // White bar on top of the purple button
  },
  disabledBtn: {
    opacity: 0.8, // Less transparent so the progress is visible
  },
  idleOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  idleText: {
    color: 'white',
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
  },
  languagePickerWrapper: {
    backgroundColor: "#0a0a0a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    marginBottom: 15,
    overflow: "hidden",
  },

  languagePicker: {
    color: "#ffffff",
    height: 50,
  },

  languagePickerItem: {
    color: "#ffffff",
  },
  languageDisplayCard: {
    backgroundColor: "#0a0a0a",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    paddingHorizontal: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  selectedLanguageText: {
    color: "#ffffff",
    fontSize: 16, // Matches the large text in your image
    fontWeight: "400",
  },
  pickerOverlayContainer: {
    position: 'absolute',
    right: 10,
    top: 0,
    bottom: 0,
    width: 50, // Only covers the arrow area
    justifyContent: 'center',
  },
  hiddenPicker: {
    width: '100%',
    color: 'transparent', // Keeps only the arrow visible on Android
    opacity: 1,
  },
  // Ensure descriptionContainer is updated for better spacing
  descriptionContainer: {
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 15,
    minHeight: 100, // Provides a clean empty state like your image
  },
});

export default VideoPlayer; 
import React, { useRef, useState } from "react";
import { View, StyleSheet, ActivityIndicator, Dimensions } from "react-native";
import { Video, ResizeMode } from "expo-av";

/**
 * @description A formal, responsive Video Player component using expo-av.
 * This version eliminates hardcoded padding in favor of flexbox centering.
 */
const VideoPlayer = () => {
  const videoRef = useRef(null);
  const [status, setStatus] = useState({});

  return (
    <View style={styles.container}>
      <View style={styles.videoWrapper}>
        <Video
          ref={videoRef}
          source={{
            uri: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
          }}
          style={styles.video}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay
          isLooping
          onPlaybackStatusUpdate={(status) => setStatus(() => status)}
        />
      </View>
    </View>
  );
};

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000", // Standard cinematic background
    justifyContent: "center", 
    alignItems: "center",
  },
  videoWrapper: {
    width: "100%",
    aspectRatio: 16 / 9, // Maintains formal video proportions
    backgroundColor: "#1a1a1a",
    elevation: 5,         // Subtle shadow for Android
    shadowColor: "#000",  // Shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  video: {
    flex: 1,
  },
});

export default VideoPlayer;
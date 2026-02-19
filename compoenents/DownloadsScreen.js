import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { Video } from "expo-av";
import { getDownloadedVideos } from "./utils/DownloadManager";

const DownloadsScreen = () => {
  const [downloads, setDownloads] = useState([]);

  useEffect(() => {
    const loadDownloads = async () => {
      const data = await getDownloadedVideos();
      setDownloads(data);
    };
    loadDownloads();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>My Downloads</Text>

      <FlatList
        data={downloads}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <Video
              source={{ uri: item.uri }}
              useNativeControls
              resizeMode="contain"
              style={styles.video}
            />
          </View>
        )}
      />
    </View>
  );
};

export default DownloadsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a1929",
    padding: 16,
    paddingTop: "15%",
  },
  heading: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#1e293b",
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  title: {
    color: "#fff",
    marginBottom: 8,
  },
  video: {
    width: "100%",
    height: 200,
  },
});

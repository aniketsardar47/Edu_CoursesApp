import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { getDownloads } from "./utils/DownloadManager";
import { Video, ResizeMode } from "expo-av";

const MyDownloads = () => {
  const [downloads, setDownloads] = useState([]);

  useEffect(() => {
    const fetchDownloads = async () => {
      const list = await getDownloads();
      setDownloads(list);
    };
    fetchDownloads();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>📥 My Downloads</Text>
      {downloads.length === 0 ? (
        <Text style={styles.empty}>No downloads yet</Text>
      ) : (
        <FlatList
          data={downloads}
          keyExtractor={(item) => item.uri}
          renderItem={({ item }) => (
            <View style={styles.videoBox}>
              <Text style={styles.title}>{item.name}</Text>
              <Video
                source={{ uri: item.uri }}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                style={styles.video}
              />
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a1929", padding: 14 },
  heading: { fontSize: 22, fontWeight: "bold", color: "#fff", marginBottom: 10 },
  empty: { color: "#ccc", textAlign: "center", marginTop: 20 },
  videoBox: { marginBottom: 20, backgroundColor: "#1e293b", padding: 10, borderRadius: 12 },
  title: { color: "#fff", marginBottom: 6 },
  video: { width: "100%", height: 200, borderRadius: 10 },
});

export default MyDownloads;

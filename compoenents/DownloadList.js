import React from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  Alert 
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { removeDownload } from '../compoenents/redux/DownloadSlice'; // Adjust path
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const DownloadsList = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  
  // Get data from Redux
  const downloadedVideos = useSelector((state) => state.downloads.videos);

  const handleDelete = (id) => {
    Alert.alert(
      "Remove Download",
      "Are you sure you want to delete this video from offline storage?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: () => dispatch(removeDownload(id)) 
        }
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <TouchableOpacity 
        style={styles.contentRow}
        // In HomePage.jsx
onPress={() => navigation.navigate("OfflinePlayer", { videoId: item.id })}
      >
        <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.meta}>Offline Mode Ready</Text>
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity 
        onPress={() => handleDelete(item.id)}
        style={styles.deleteBtn}
      >
        <Ionicons name="trash-outline" size={22} color="#ff4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Downloads</Text>
        <Text style={styles.countText}>{downloadedVideos.length}</Text>
      </View>

      {downloadedVideos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cloud-download-outline" size={80} color="#333" />
          <Text style={styles.emptyText}>No downloaded videos yet.</Text>
        </View>
      ) : (
        <FlatList
          data={downloadedVideos}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
        />
      )}
    </View>
  );
};

export default DownloadsList;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 20, 
    paddingTop: 50, 
    backgroundColor: '#121212' 
  },
  headerTitle: { 
    color: '#fff', 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginLeft: 15, 
    flex: 1 
  },
  countText: { 
    color: '#bb86fc', 
    fontWeight: 'bold', 
    fontSize: 18 
  },
  card: { 
    backgroundColor: '#1a1a1a', 
    borderRadius: 12, 
    marginBottom: 12, 
    flexDirection: 'row', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a'
  },
  contentRow: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 10 },
  thumbnail: { width: 100, height: 60, borderRadius: 8 },
  info: { marginLeft: 12, flex: 1 },
  title: { color: '#fff', fontWeight: '600', fontSize: 14 },
  meta: { color: '#4ade80', fontSize: 11, marginTop: 4 },
  deleteBtn: { padding: 15 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#666', marginTop: 15, fontSize: 16 }
});
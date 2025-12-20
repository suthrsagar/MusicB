import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import axios from 'axios';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const BASE_URL = 'http://10.206.215.196:5000';

const HomeScreen = () => {
  const navigation = useNavigation();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSongs = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/song`);
      setSongs(response.data);
    } catch (error) {
      console.error('Error fetching songs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSongs();
  }, []);

  // Reload songs whenever the screen comes into focus (e.g., after upload)
  useFocusEffect(
    useCallback(() => {
      fetchSongs();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchSongs();
  };

  const renderSongItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('PlayerScreen', { song: item })}
      activeOpacity={0.8}
    >
      <View style={styles.cardImageContainer}>
        <Ionicons name="musical-notes" size={40} color="#fff" />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.songTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.artistName} numberOfLines={1}>
          {item.artist}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Discover Music</Text>
      {songs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No songs found.</Text>
          <Text style={styles.subText}>Upload songs & wait for approval!</Text>
        </View>
      ) : (
        <FlatList
          data={songs}
          keyExtractor={(item) => item._id}
          renderItem={renderSongItem}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  header: {
    fontSize: 26,
    fontWeight: '800',
    color: '#333',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingBottom: 20,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  cardImageContainer: {
    height: 120,
    backgroundColor: '#007bff', // You can change this to a gradient if you add a library, or use random colors
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  cardContent: {
    padding: 12,
  },
  songTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  artistName: {
    fontSize: 13,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
  },
  subText: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
  },
});
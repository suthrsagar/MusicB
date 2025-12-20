import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import axios from 'axios';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../../theme';

import { BASE_URL } from '../../services/apiConfig';

import { useMusic } from '../../context/MusicContext';

const HomeScreen = () => {
  const navigation = useNavigation();
  const { playSong } = useMusic();
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

  // Reload songs whenever the screen comes into focus
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
      onPress={() => {
        playSong(item, songs); // Pass current list as queue
        navigation.navigate('PlayerScreen', { song: item, playlist: songs });
      }}
      activeOpacity={0.9}
    >
      <View style={styles.cardImageContainer}>
        <Ionicons name="musical-notes" size={40} color="#fff" />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.songTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.artistName} numberOfLines={1}>
          {item.artist || 'Unknown Artist'}
        </Text>
      </View>
      <View style={styles.playIconOverlay}>
        <Ionicons name="play-circle" size={30} color={theme.colors.primary} />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      <Text style={styles.header}>Discover</Text>
      {songs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="musical-note-outline" size={60} color={theme.colors.textSecondary} />
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
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
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
    backgroundColor: theme.colors.background,
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  header: {
    ...theme.typography.header,
    color: theme.colors.text,
    marginBottom: 20,
    marginTop: 10,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  listContainer: {
    paddingBottom: 20,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  card: {
    width: '47%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.layout.borderRadius,
    marginBottom: 20,
    ...theme.shadows.soft,
    overflow: 'hidden',
    position: 'relative',
  },
  cardImageContainer: {
    height: 120,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: theme.layout.borderRadius,
    borderTopRightRadius: theme.layout.borderRadius,
  },
  cardContent: {
    padding: 12,
  },
  songTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  artistName: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  playIconOverlay: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: theme.colors.surface,
    borderRadius: 15,
    elevation: 2,
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
    color: theme.colors.text,
    marginTop: 10,
  },
  subText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 5,
  },
});
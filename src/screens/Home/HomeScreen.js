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
  Alert,
  Image,
} from 'react-native';
import axios from 'axios';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../../theme';

import { BASE_URL } from '../../services/apiConfig';

import { useMusic } from '../../context/MusicContext';
import RoundedLoader from '../../components/RoundedLoader';
import CustomAlert from '../../components/CustomAlert';
import RealisticLoader from '../../components/RealisticLoader';

const SongItem = React.memo(({ item, onPress }) => (
  <TouchableOpacity
    style={styles.card}
    onPress={() => onPress(item)}
    activeOpacity={0.9}
  >
    <View style={styles.cardImageContainer}>
      {item.coverImage ? (
        <Image
          source={{ uri: item.coverImage }}
          style={styles.coverImage}
          resizeMode="cover"
        />
      ) : (
        <Ionicons name="musical-notes" size={40} color="#fff" />
      )}
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
));

const HomeScreen = () => {
  const navigation = useNavigation();
  const { playSong } = useMusic();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'info' });

  const showAlert = (title, message, type = 'info') => {
    setAlertConfig({ visible: true, title, message, type });
  };

  const fetchSongs = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/song`);
      setSongs(response.data);
    } catch (error) {
      console.error('Error fetching songs:', error);
      if (!error.response) {
        // Network error / Offline
        showAlert('Offline Mode', 'You are currently offline. Check your downloaded songs in the Downloads tab!', 'info');
      } else {
        const msg = error.response?.data?.msg || error.message || 'Failed to load songs';
        showAlert('Error', msg, 'error');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSongs();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchSongs();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchSongs();
  };

  const handlePress = useCallback((item) => {
    playSong(item, songs);
    navigation.navigate('PlayerScreen', { song: item, playlist: songs });
  }, [songs]);

  const renderSongItem = useCallback(({ item }) => (
    <SongItem item={item} onPress={handlePress} />
  ), [handlePress]);

  if (loading) {
    return <RealisticLoader message="Discovering Music..." />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      <Text style={styles.header}>New Songs </Text>
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
          initialNumToRender={6}
          maxToRenderPerBatch={10}
          windowSize={10}
          removeClippedSubviews={true}
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
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
      />
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 20,
    ...theme.typography.header,
    color: theme.colors.text,
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
    overflow: 'hidden'
  },
  coverImage: {
    width: '100%',
    height: '100%'
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
  songCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
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
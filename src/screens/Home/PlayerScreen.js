import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Alert,
  PermissionsAndroid,
  Image,
  Platform
} from 'react-native';
import RNFS from 'react-native-fs';
import Slider from '@react-native-community/slider';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../../theme';
import { useMusic } from '../../context/MusicContext';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { BASE_URL } from '../../services/apiConfig';

const PlayerScreen = ({ route, navigation }) => {
  // Player fixed
  const { song, playlist } = route.params || {};
  const {
    currentSong,
    isPlaying,
    loading,
    progress,
    playSong,
    togglePlayPause,
    seekTo,
    playNext,
    playPrev
  } = useMusic();

  // ... (rest of code)

  /* Controls removed from here */

  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [viewsCount, setViewsCount] = useState(0);

  // Handle new song selection from other screens
  useEffect(() => {
    if (song) {
      // Only play if the requested song is not already the current one
      if (!currentSong || currentSong.fileId !== song.fileId) {
        playSong(song, playlist || []);
      }
    }
  }, [song]); // Only run when the route param 'song' changes

  // If no song is playing and no song passed, go back
  if (!currentSong && !song) {
    // navigation.goBack(); // Optional: might loop if not careful
    return null;
  }

  // Use either the passed song (initially) or the context song
  const activeSong = currentSong || song;

  // Check Like status on load
  // Check Like status on load
  useEffect(() => {
    const fetchSongDetails = async () => {
      if (!activeSong) return;
      try {
        const token = await AsyncStorage.getItem('token');

        // 1. Record View (Unique listener)
        if (token) {
          axios.post(`${BASE_URL}/api/song/view/${activeSong._id}`, {}, {
            headers: { 'x-auth-token': token }
          }).catch(e => console.log("View record error", e));
        }

        // 2. Fetch fresh song data
        const songRes = await axios.get(`${BASE_URL}/api/song/${activeSong._id}`);
        setViewsCount(songRes.data.views ? songRes.data.views.length : 0);
        setLikesCount(songRes.data.likes ? songRes.data.likes.length : 0);

        // 3. Check if I liked it
        if (token) {
          const profileRes = await axios.get(`${BASE_URL}/api/profile`, {
            headers: { 'x-auth-token': token }
          });
          const myId = profileRes.data._id;

          if (songRes.data.likes && songRes.data.likes.includes(myId)) {
            setLiked(true);
          } else {
            setLiked(false);
          }
        }
      } catch (e) { }
    }
    fetchSongDetails();
  }, [activeSong]);


  const handleLike = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Login Required', 'Please login to like this song.');
        return;
      }

      const res = await axios.put(`${BASE_URL}/api/song/like/${activeSong._id}`, {}, {
        headers: { 'x-auth-token': token }
      });

      // Toggle UI
      setLiked(!liked);
      // Backend returns new likes array, so use that length
      setLikesCount(res.data.likes.length);

    } catch (e) {
      console.error(e);
      const msg = e.response?.data?.msg || 'Could not like song';
      Alert.alert('Like Error', msg);
    }
  };


  if (!activeSong) return null;

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "00:00";
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' + sec : sec}`;
  };

  const downloadSong = async () => {
    if (!activeSong) return;

    try {
      // 1. Check Permissions (Android)
      if (Platform.OS === 'android' && Platform.Version < 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'App needs access to store downloaded songs.',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'Storage permission is required to download.');
          return;
        }
      }

      // 2. Define Path
      const fileName = `${activeSong.title.replace(/[^a-zA-Z0-9]/g, '_')}.mp3`;
      const path = `${RNFS.DownloadDirectoryPath}/${fileName}`;
      const streamUrl = `${BASE_URL}/api/song/stream/${activeSong.fileId}`;
      const token = await AsyncStorage.getItem('token');

      // 3. Start Download
      Alert.alert('Downloading', `Started downloading ${activeSong.title}...`);

      const options = {
        fromUrl: streamUrl,
        toFile: path,
        headers: token ? { 'x-auth-token': token } : {},
        background: true,
        discretionary: true,
        begin: (res) => {
          // console.log('Download has begun', res);
        },
        progress: (res) => {
          // console.log((res.bytesWritten / res.contentLength));
        }
      };

      const ret = RNFS.downloadFile(options);

      ret.promise.then((res) => {
        Alert.alert('Download Complete', `Saved to ${path}`);
      }).catch((err) => {
        console.error(err);
        Alert.alert('Download Failed', 'Could not save the file.');
      });

    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'An error occurred while downloading.');
    }
  };

  const handleMenu = () => {
    Alert.alert(
      'Options',
      'Select an action',
      [
        { text: 'Download Song', onPress: downloadSong },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Ionicons name="chevron-down" size={30} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Now Playing</Text>
        <TouchableOpacity style={styles.iconButton} onPress={handleMenu}>
          <Ionicons name="ellipsis-horizontal" size={30} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Album Art Placeholder */}
      <View style={styles.artworkContainer}>
        <View style={styles.artwork}>
          <Ionicons name="musical-notes" size={100} color="#fff" />
        </View>
      </View>

      {/* Song Info */}
      <View style={styles.infoContainer}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '80%' }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>{activeSong.title}</Text>
            <Text style={styles.artist} numberOfLines={1}>{activeSong.artist}</Text>
          </View>

          <TouchableOpacity onPress={handleLike} style={{ padding: 10, alignItems: 'center' }}>
            <Ionicons name={liked ? "heart" : "heart-outline"} size={28} color={liked ? theme.colors.error : theme.colors.textSecondary} />
            <Text style={{ fontSize: 12, color: theme.colors.textSecondary, fontWeight: '600', marginTop: 2 }}>
              {likesCount}
            </Text>
          </TouchableOpacity>
        </View>

        {/* View/Play Count Display (Optional) */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
          <Ionicons name="play" size={12} color={theme.colors.textSecondary} />
          <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginLeft: 4 }}>
            {viewsCount + (isPlaying ? 1 : 0)} Plays
          </Text>
        </View>
      </View>

      {/* Slider */}
      <View style={styles.sliderContainer}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={progress.duration || 1}
          value={progress.position}
          minimumTrackTintColor={theme.colors.primary}
          maximumTrackTintColor={theme.colors.border}
          thumbTintColor={theme.colors.primary}
          onSlidingComplete={seekTo}
        />
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formatTime(progress.position)}</Text>
          <Text style={styles.timeText}>{formatTime(progress.duration)}</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.secondaryControl} onPress={playPrev}>
          <Ionicons name="play-skip-back" size={30} color={theme.colors.text} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.playButton} onPress={togglePlayPause} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" size="large" />
          ) : (
            <Ionicons name={isPlaying ? "pause" : "play"} size={45} color="#fff" />
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryControl} onPress={playNext}>
          <Ionicons name="play-skip-forward" size={30} color={theme.colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PlayerScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 20,
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  iconButton: {
    padding: 10,
  },
  artworkContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  artwork: {
    width: 280,
    height: 280,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 20,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text,
    textAlign: 'left',
  },
  artist: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontWeight: '500',
    textAlign: 'left',
  },
  sliderContainer: {
    marginBottom: 30,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  timeText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 40,
    elevation: 10,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 }
  },
  secondaryControl: {
    padding: 10,
  }
});
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
  Platform,
  Modal,
  FlatList
} from 'react-native';
import RNFS from 'react-native-fs';
import Slider from '@react-native-community/slider';
import Ionicons from 'react-native-vector-icons/Ionicons';
import VolumeController from '../../components/VolumeController';
import { theme } from '../../theme';
import { useMusic } from '../../context/MusicContext';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { BASE_URL } from '../../services/apiConfig';

const PlayerScreen = ({ route, navigation }) => {
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

  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [viewsCount, setViewsCount] = useState(0);

  const [sleepTimer, setSleepTimer] = useState(null);
  const [showSleepModal, setShowSleepModal] = useState(false);

  useEffect(() => {
    let timer;
    if (sleepTimer !== null && isPlaying) {

      const ms = sleepTimer * 60 * 1000;
      timer = setTimeout(() => {
        if (isPlaying) togglePlayPause();
        setSleepTimer(null);
        Alert.alert('Sleep Timer', 'Music stopped.');
      }, ms);
    }
    return () => clearTimeout(timer);
  }, [sleepTimer, isPlaying]);


  useEffect(() => {
    if (song) {
      if (!currentSong || currentSong.fileId !== song.fileId) {
        playSong(song, playlist || []);
      }
    }
  }, [song]);

  if (!currentSong && !song) {
    return null;
  }

  const activeSong = currentSong || song;

  useEffect(() => {
    const fetchSongDetails = async () => {
      if (!activeSong) return;
      try {
        const token = await AsyncStorage.getItem('token');

        if (token) {
          axios.post(`${BASE_URL}/api/song/view/${activeSong._id}`, {}, {
            headers: { 'x-auth-token': token }
          }).catch(e => console.log("View record error", e));
        }

        const songRes = await axios.get(`${BASE_URL}/api/song/${activeSong._id}`);
        setViewsCount(songRes.data.views ? songRes.data.views.length : 0);
        setLikesCount(songRes.data.likes ? songRes.data.likes.length : 0);

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

      setLiked(!liked);
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
      // Internal storage doesn't require public storage permissions on modern Android
      // But we check just in case for older versions if they used a different path logic

      const downloadDir = `${RNFS.DocumentDirectoryPath}/downloads`;
      const existsDir = await RNFS.exists(downloadDir);
      if (!existsDir) {
        await RNFS.mkdir(downloadDir);
      }

      const fileName = `${activeSong._id}.mp3`; // Use ID for uniqueness in internal storage
      const path = `${downloadDir}/${fileName}`;
      const streamUrl = `${BASE_URL}/api/song/stream/${activeSong.fileId}`;
      const token = await AsyncStorage.getItem('token');

      Alert.alert('Downloading', `Adding ${activeSong.title} to your library...`);

      const options = {
        fromUrl: streamUrl,
        toFile: path,
        headers: token ? { 'x-auth-token': token } : {},
        background: true,
        discretionary: true,
      };

      const ret = RNFS.downloadFile(options);

      ret.promise.then(async (res) => {
        try {
          const stored = await AsyncStorage.getItem('downloadedSongs');
          const downloads = stored ? JSON.parse(stored) : [];

          const newDownload = {
            id: activeSong._id,
            title: activeSong.title,
            artist: activeSong.artist,
            coverImage: activeSong.coverImage,
            filePath: path,
            fileId: activeSong.fileId,
            downloadDate: new Date().toISOString()
          };

          const exists = downloads.some(d => d.id === activeSong._id);
          if (!exists) {
            downloads.push(newDownload);
            await AsyncStorage.setItem('downloadedSongs', JSON.stringify(downloads));
          }

          Alert.alert('Download Complete', 'Song saved to your app library.');
        } catch (err) {
          console.error("Error saving metadata", err);
        }
      }).catch((err) => {
        console.error(err);
        Alert.alert('Download Failed', 'Could not save the file.');
      });

    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'An error occurred while downloading.');
    }
  };

  const renderSleepTimerModal = () => (
    <Modal
      transparent={true}
      visible={showSleepModal}
      animationType="fade"
      onRequestClose={() => setShowSleepModal(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowSleepModal(false)}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Sleep Timer</Text>

          {[
            { label: 'Off', value: null },
            { label: '10 Minutes', value: 10 },
            { label: '30 Minutes', value: 30 },
            { label: '60 Minutes', value: 60 },
          ].map((option) => (
            <TouchableOpacity
              key={option.label}
              style={[
                styles.modalOption,
                sleepTimer === option.value && styles.modalOptionSelected
              ]}
              onPress={() => {
                setSleepTimer(option.value);
                setShowSleepModal(false);
                if (option.value) Alert.alert('Sleep Timer Set', `Playback will stop in ${option.label}`);
              }}
            >
              <Text style={[
                styles.modalOptionText,
                sleepTimer === option.value && styles.modalOptionTextSelected
              ]}>{option.label}</Text>
              {sleepTimer === option.value && (
                <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );


  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [myPlaylists, setMyPlaylists] = useState([]);

  const fetchPlaylists = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Login Required', 'Please login to add to playlist.');
        return;
      }
      const res = await axios.get(`${BASE_URL}/api/playlist/me`, {
        headers: { 'x-auth-token': token }
      });
      setMyPlaylists(res.data);
      setShowPlaylistModal(true);
    } catch (e) {
      Alert.alert('Error', 'Could not fetch playlists');
    }
  };

  const addToPlaylist = async (playlistId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.put(`${BASE_URL}/api/playlist/add/${playlistId}`,
        { songId: activeSong._id },
        { headers: { 'x-auth-token': token } }
      );
      Alert.alert('Success', 'Song added to playlist');
      setShowPlaylistModal(false);
    } catch (e) {
      Alert.alert('Error', 'Could not add to playlist');
    }
  };

  const renderPlaylistModal = () => (
    <Modal
      transparent={true}
      visible={showPlaylistModal}
      animationType="slide"
      onRequestClose={() => setShowPlaylistModal(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowPlaylistModal(false)}
      >
        <View style={[styles.modalContent, { maxHeight: '60%' }]}>
          <Text style={styles.modalTitle}>Add to Playlist</Text>
          {myPlaylists.length === 0 ? (
            <Text style={{ textAlign: 'center', marginVertical: 20, color: theme.colors.textSecondary }}>No playlists found. Create one in the Playlist tab.</Text>
          ) : (
            <FlatList
              data={myPlaylists}
              keyExtractor={item => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalOption} onPress={() => addToPlaylist(item._id)}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 15 }}>
                      <Ionicons name="musical-note" size={20} color="#fff" />
                    </View>
                    <View>
                      <Text style={styles.modalOptionText}>{item.name}</Text>
                      <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>{item.songs?.length || 0} Songs</Text>
                    </View>
                  </View>
                  <Ionicons name="add-circle-outline" size={24} color={theme.colors.primary} />
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />


      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Ionicons name="chevron-down" size={30} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Now Playing</Text>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity style={styles.iconButton} onPress={downloadSong}>
            <Ionicons name="cloud-download-outline" size={28} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      </View>


      <View style={styles.artworkContainer}>
        <View style={styles.artwork}>
          {activeSong.coverImage ? (
            <Image source={{ uri: activeSong.coverImage }} style={styles.coverImage} resizeMode="cover" />
          ) : (
            <Ionicons name="musical-notes" size={100} color="#fff" />
          )}
        </View>
      </View>


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


        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
          <Ionicons name="play" size={12} color={theme.colors.textSecondary} />
          <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginLeft: 4 }}>
            {viewsCount + (isPlaying ? 1 : 0)} Plays
          </Text>
        </View>
      </View>


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


      <View style={styles.footerOptions}>
        <TouchableOpacity style={styles.footerBtn} onPress={fetchPlaylists}>
          <Ionicons name="add-circle-outline" size={26} color={theme.colors.text} />
          <Text style={styles.footerBtnText}>Playlist</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.footerBtn} onPress={() => setShowSleepModal(true)}>
          <Ionicons name="timer-outline" size={26} color={theme.colors.text} />
          <Text style={styles.footerBtnText}>Timer</Text>
        </TouchableOpacity>
      </View>
      {renderSleepTimerModal()}
      {renderPlaylistModal()}
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
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%'
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: theme.colors.text
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  modalOptionSelected: {
    backgroundColor: theme.colors.primary + '10',
    paddingHorizontal: 10,
    marginHorizontal: -10,
    borderRadius: 10,
    borderBottomWidth: 0
  },
  modalOptionText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  modalOptionTextSelected: {
    color: theme.colors.primary,
    fontWeight: 'bold'
  },
  footerOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    paddingHorizontal: 30
  },
  footerBtn: {
    alignItems: 'center',
    padding: 10
  },
  footerBtnText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 5,
    fontWeight: '600'
  }
});
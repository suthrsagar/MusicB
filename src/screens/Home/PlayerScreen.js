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
  FlatList,
  Dimensions
} from 'react-native';
import RNFS from 'react-native-fs';
import Slider from '@react-native-community/slider';
import Ionicons from 'react-native-vector-icons/Ionicons';
import VolumeController from '../../components/VolumeController';
import { theme } from '../../theme';
import { useMusic } from '../../context/MusicContext';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RoundedLoader from '../../components/RoundedLoader';
import CustomAlert from '../../components/CustomAlert';

import { BASE_URL } from '../../services/apiConfig';

const { width } = Dimensions.get('window');

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
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'info' });

  const showAlert = (title, message, type = 'info') => {
    setAlertConfig({ visible: true, title, message, type });
  };

  useEffect(() => {
    let timer;
    if (sleepTimer !== null && isPlaying) {

      const ms = sleepTimer * 60 * 1000;
      timer = setTimeout(() => {
        if (isPlaying) togglePlayPause();
        setSleepTimer(null);
        showAlert('Sleep Timer', 'Music stopped.', 'info');
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
        showAlert('Login Required', 'Please login to like this song.', 'error');
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
      showAlert('Like Error', msg, 'error');
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

      setIsDownloading(true);
      setDownloadProgress(0);

      const options = {
        fromUrl: streamUrl,
        toFile: path,
        headers: token ? { 'x-auth-token': token } : {},
        background: true,
        discretionary: true,
        progress: (res) => {
          const progress = (res.bytesWritten / res.contentLength) * 100;
          setDownloadProgress(progress);
        }
      };

      const ret = RNFS.downloadFile(options);

      ret.promise.then(async (res) => {
        setIsDownloading(false);
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

          showAlert('Download Complete', 'Song saved to your app library.', 'success');
        } catch (err) {
          console.error("Error saving metadata", err);
        }
      }).catch((err) => {
        setIsDownloading(false);
        console.error(err);
        showAlert('Download Failed', 'Could not save the file.', 'error');
      });

    } catch (e) {
      setIsDownloading(false);
      console.error(e);
      showAlert('Error', 'An error occurred while downloading.', 'error');
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
                if (option.value) showAlert('Sleep Timer Set', `Playback will stop in ${option.label}`, 'info');
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
        showAlert('Login Required', 'Please login to add to playlist.', 'error');
        return;
      }
      const res = await axios.get(`${BASE_URL}/api/playlist/me`, {
        headers: { 'x-auth-token': token }
      });
      setMyPlaylists(res.data);
      setShowPlaylistModal(true);
    } catch (e) {
      showAlert('Error', 'Could not fetch playlists', 'error');
    }
  };

  const addToPlaylist = async (playlistId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.put(`${BASE_URL}/api/playlist/add/${playlistId}`,
        { songId: activeSong._id },
        { headers: { 'x-auth-token': token } }
      );
      showAlert('Success', 'Song added to playlist', 'success');
      setShowPlaylistModal(false);
    } catch (e) {
      showAlert('Error', 'Could not add to playlist', 'error');
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
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Blurred Background */}
      <View style={StyleSheet.absoluteFill}>
        {activeSong.coverImage ? (
          <Image
            source={{ uri: activeSong.coverImage }}
            style={styles.backgroundImage}
            blurRadius={Platform.OS === 'ios' ? 20 : 10}
          />
        ) : (
          <View style={[styles.backgroundImage, { backgroundColor: '#121212' }]} />
        )}
        <View style={styles.backgroundOverlay} />
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Ionicons name="chevron-down" size={32} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Now Playing</Text>
          <TouchableOpacity style={styles.iconButton} onPress={downloadSong}>
            <Ionicons name="cloud-download-outline" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.artworkContainer}>
          <View style={styles.artworkShadow}>
            <View style={styles.artwork}>
              {activeSong.coverImage ? (
                <Image source={{ uri: activeSong.coverImage }} style={styles.coverImage} resizeMode="cover" />
              ) : (
                <Ionicons name="musical-notes" size={120} color="rgba(255,255,255,0.3)" />
              )}
            </View>
          </View>

          {isDownloading && (
            <View style={styles.loaderOverlay}>
              <RoundedLoader percentage={downloadProgress} size={150} />
            </View>
          )}
        </View>

        <View style={styles.glassContainer}>
          <View style={styles.infoContainer}>
            <View style={styles.titleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title} numberOfLines={1}>{activeSong.title}</Text>
                <Text style={styles.artist} numberOfLines={1}>{activeSong.artist}</Text>
              </View>
              <TouchableOpacity onPress={handleLike} style={styles.likeBtn}>
                <Ionicons name={liked ? "heart" : "heart-outline"} size={32} color={liked ? "#FF4B4B" : "#fff"} />
                <Text style={styles.likesText}>{likesCount}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.statsRow}>
              <Ionicons name="play" size={14} color="rgba(255,255,255,0.5)" />
              <Text style={styles.statsText}>{viewsCount + (isPlaying ? 1 : 0)} Plays</Text>
            </View>
          </View>

          <View style={styles.sliderSection}>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={progress.duration || 1}
              value={progress.position}
              minimumTrackTintColor={theme.colors.primary}
              maximumTrackTintColor="rgba(255,255,255,0.2)"
              thumbTintColor="#fff"
              onSlidingComplete={seekTo}
            />
            <View style={styles.timeRow}>
              <Text style={styles.timeText}>{formatTime(progress.position)}</Text>
              <Text style={styles.timeText}>{formatTime(progress.duration)}</Text>
            </View>
          </View>

          <View style={styles.controlsRow}>
            <TouchableOpacity style={styles.sideControl} onPress={playPrev}>
              <Ionicons name="play-back" size={35} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.mainPlayBtn} onPress={togglePlayPause} disabled={loading}>
              <View style={styles.playInner}>
                {loading ? (
                  <ActivityIndicator color="#fff" size="large" />
                ) : (
                  <Ionicons name={isPlaying ? "pause" : "play"} size={50} color="#fff" style={!isPlaying && { marginLeft: 5 }} />
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sideControl} onPress={playNext}>
              <Ionicons name="play-forward" size={35} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.footerActions}>
            <TouchableOpacity style={styles.footerActionBtn} onPress={fetchPlaylists}>
              <Ionicons name="list" size={24} color="#fff" />
              <Text style={styles.footerActionText}>Playlist</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.footerActionBtn} onPress={() => setShowSleepModal(true)}>
              <Ionicons name="timer-outline" size={24} color="#fff" />
              <Text style={styles.footerActionText}>{sleepTimer ? `${sleepTimer}m` : 'Timer'}</Text>
            </TouchableOpacity>
            <VolumeController />
          </View>
        </View>
      </View>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
      />
      {renderSleepTimerModal()}
      {renderPlaylistModal()}
    </View>
  );
};

export default PlayerScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    opacity: 0.5,
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  content: {
    flex: 1,
    paddingTop: StatusBar.currentHeight + 20,
    paddingHorizontal: 25,
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  artworkContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginVertical: 30,
  },
  artworkShadow: {
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 25,
  },
  artwork: {
    width: width * 0.75,
    height: width * 0.75,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
    zIndex: 10,
  },
  glassContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 35,
    padding: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  infoContainer: {
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  artist: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
    marginTop: 4,
  },
  likeBtn: {
    alignItems: 'center',
    marginLeft: 15,
  },
  likesText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  statsText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginLeft: 6,
    fontWeight: '600',
  },
  sliderSection: {
    marginVertical: 15,
  },
  slider: {
    width: '100%',
    height: 30,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -5,
  },
  timeText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 15,
  },
  mainPlayBtn: {
    width: 85,
    height: 85,
    borderRadius: 43,
    backgroundColor: theme.colors.primary,
    padding: 3,
  },
  playInner: {
    flex: 1,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  sideControl: {
    width: 55,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  footerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 20,
  },
  footerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  footerActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    padding: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
    color: '#fff',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  modalOptionSelected: {
    backgroundColor: 'rgba(67, 24, 255, 0.15)',
    paddingHorizontal: 15,
    marginHorizontal: -15,
    borderRadius: 15,
    borderBottomWidth: 0,
  },
  modalOptionText: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.8)',
  },
  modalOptionTextSelected: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
});
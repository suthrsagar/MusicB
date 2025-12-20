import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import SoundPlayer from 'react-native-sound-player';
import Slider from '@react-native-community/slider';
import Ionicons from 'react-native-vector-icons/Ionicons';

const BASE_URL = 'http://10.206.215.196:5000';

const PlayerScreen = ({ route, navigation }) => {
  const { song } = route.params || {};
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState({ currentTime: 0, duration: 0 });

  useEffect(() => {
    if (!song) {
      Alert.alert('Error', 'No song selected');
      navigation.goBack();
      return;
    }

    // Subscribe to events
    const onFinishedLoadingURL = SoundPlayer.addEventListener('FinishedLoadingURL', ({ success, url }) => {
      setLoading(false);
      setIsPlaying(success);
    });

    const onFinishedPlaying = SoundPlayer.addEventListener('FinishedPlaying', ({ success }) => {
      setIsPlaying(false);
      SoundPlayer.seek(0); // Reset to start
    });

    // Start playing
    try {
      const streamUrl = `${BASE_URL}/api/song/stream/${song.fileId}`;
      SoundPlayer.playUrl(streamUrl);
      setLoading(true);
    } catch (e) {
      Alert.alert('Error', 'Cannot play this song');
      console.log('cannot play the song file', e);
      setLoading(false);
    }

    // Get Info Loop (for slider)
    const interval = setInterval(async () => {
      try {
        const info = await SoundPlayer.getInfo();
        if (info) {
          setInfo({
            currentTime: info.currentTime,
            duration: info.duration
          });
        }
      } catch (e) {
        // console.log('getError', e);
      }
    }, 1000);

    return () => {
      onFinishedLoadingURL.remove();
      onFinishedPlaying.remove();
      try {
        SoundPlayer.stop();
      } catch (e) { }
      clearInterval(interval);
    };
  }, [song]);

  const togglePlayPause = () => {
    try {
      if (isPlaying) {
        SoundPlayer.pause();
        setIsPlaying(false);
      } else {
        SoundPlayer.resume();
        setIsPlaying(true);
      }
    } catch (e) {
      console.log('Create Error', e);
    }
  };

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' + sec : sec}`;
  };

  if (!song) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-down" size={30} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Now Playing</Text>
        <Ionicons name="ellipsis-horizontal" size={30} color="#333" />
      </View>

      {/* Album Art Placeholder */}
      <View style={styles.artworkContainer}>
        <View style={styles.artwork}>
          <Ionicons name="musical-notes" size={80} color="#fff" />
        </View>
      </View>

      {/* Song Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={1}>{song.title}</Text>
        <Text style={styles.artist} numberOfLines={1}>{song.artist}</Text>
      </View>

      {/* Slider */}
      <View style={styles.sliderContainer}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={info.duration || 1}
          value={info.currentTime}
          minimumTrackTintColor="#007bff"
          maximumTrackTintColor="#ccc"
          thumbTintColor="#007bff"
          onSlidingComplete={(val) => SoundPlayer.seek(val)}
        />
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formatTime(info.currentTime)}</Text>
          <Text style={styles.timeText}>{formatTime(info.duration)}</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity>
          <Ionicons name="play-skip-back" size={35} color="#333" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.playButton} onPress={togglePlayPause} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" size="large" />
          ) : (
            <Ionicons name={isPlaying ? "pause" : "play"} size={40} color="#fff" />
          )}
        </TouchableOpacity>

        <TouchableOpacity>
          <Ionicons name="play-skip-forward" size={35} color="#333" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PlayerScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  artworkContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  artwork: {
    width: 250,
    height: 250,
    borderRadius: 20,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  artist: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  sliderContainer: {
    marginBottom: 20,
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
    color: '#888',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginTop: 10,
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
});
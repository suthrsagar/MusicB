import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, StatusBar, Image } from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../../theme';

import { BASE_URL } from '../../services/apiConfig';
import { useMusic } from '../../context/MusicContext';
import PremiumLoader from '../../components/PremiumLoader';

export default function SearchScreen() {
  const navigation = useNavigation();
  const [query, setQuery] = useState('');
  const [allSongs, setAllSongs] = useState([]);
  const [filteredSongs, setFilteredSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const { playSong } = useMusic();

  useEffect(() => {
    fetchSongs();
  }, []);

  const fetchSongs = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/api/song`);
      setAllSongs(response.data);
      setFilteredSongs(response.data);
    } catch (error) {
      console.error('Error fetching songs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (query.trim() === '') {
      setFilteredSongs(allSongs);
    } else {
      const lowerQuery = query.toLowerCase();
      const filtered = allSongs.filter((song) => {
        const titleMatch = song.title?.toLowerCase().includes(lowerQuery);
        const artistMatch = song.artist?.toLowerCase().includes(lowerQuery);
        const albumMatch = song.album?.toLowerCase().includes(lowerQuery);
        return titleMatch || artistMatch || albumMatch;
      });
      setFilteredSongs(filtered);
    }
  }, [query, allSongs]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => {
        playSong(item, allSongs);
      }}
    >
      <View style={styles.iconContainer}>
        {item.coverImage ? (
          <Image source={{ uri: item.coverImage }} style={styles.coverImage} />
        ) : (
          <Ionicons name="musical-notes-outline" size={24} color={theme.colors.primary} />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.songTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.artist} numberOfLines={1}>{item.artist}</Text>
      </View>
      <View style={styles.playIcon}>
        <Ionicons name="play" size={20} color="#fff" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Invisible closer for the top transparent area if needed, or just the background */}
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => navigation.goBack()} />

      <View style={styles.contentContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="rgba(0,0,0,0.5)" />

        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Search</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close-circle" size={30} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchBarContainer}>
          <Ionicons name="search-outline" size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.input}
            placeholder="Search by Song, Artist, or Album..."
            placeholderTextColor={theme.colors.textSecondary}
            value={query}
            onChangeText={setQuery}
            autoFocus={true}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <View style={{ marginTop: 20, alignItems: 'center' }}>
            <PremiumLoader size={40} />
          </View>
        ) : (
          <FlatList
            data={filteredSongs}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.noResult}>
                <Ionicons name="search" size={50} color={theme.colors.border} />
                <Text style={{ color: theme.colors.textSecondary, marginTop: 10 }}>
                  No results found for "{query}"
                </Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)', // Dimmed background
    justifyContent: 'flex-end', // Align content to bottom? Or user said "half screen", maybe top? Let's do a top sheet or center. User usually expects search at top. Let's do top half.
    // Actually, "half homescreen" usually implies a bottom sheet or a top drawer. Given search bar is at top, let's make it a Top Sheet.
    justifyContent: 'flex-start',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  contentContainer: {
    height: '60%', // Takes up top 60% of screen
    backgroundColor: theme.colors.background,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 10,
    elevation: 10,
    ...theme.shadows.medium,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 10 // safe area fix might be needed
  },
  headerTitle: {
    ...theme.typography.header,
    color: theme.colors.text,
    fontSize: 24,
    marginBottom: 0
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.layout.borderRadius,
    paddingHorizontal: 15,
    height: 50,
    ...theme.shadows.soft,
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: theme.colors.text,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.layout.borderRadius,
    marginBottom: 15,
    ...theme.shadows.soft,
  },
  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: theme.colors.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    overflow: 'hidden'
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover'
  },
  songTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  artist: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  playIcon: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noResult: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
});

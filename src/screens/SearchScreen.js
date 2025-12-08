import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity } from 'react-native';

const allSongs = []; // No default songs

export default function SearchScreen() {
  const [query, setQuery] = useState('');

  const filteredSongs = allSongs.filter((song) =>
    song.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <View style={styles.container}>

      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.input}
          placeholder="Search songs or artists..."
          placeholderTextColor="#888"
          value={query}
          onChangeText={(text) => setQuery(text)}
        />
      </View>

      {/* Songs List */}
      {filteredSongs.length > 0 ? (
        <FlatList
          data={filteredSongs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} activeOpacity={0.7}>
              <Text style={styles.songTitle}>{item.title}</Text>
              <Text style={styles.artist}>{item.artist}</Text>
            </TouchableOpacity>
          )}
        />
      ) : (
        <View style={styles.noResult}>
          <Text style={{ color: '#6B7280' }}>No songs available</Text>
        </View>
      )}


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 15,
  },
  searchBarContainer: {
    marginBottom: 15,
  },
  input: {
    width: '100%',
    padding: 14,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  card: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  artist: {
    fontSize: 14,
    color: '#6B7280',
  },
  noResult: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  adBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#4B5563',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
});

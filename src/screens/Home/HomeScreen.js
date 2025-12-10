import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, ScrollView } from 'react-native';

export default function HomeScreen({ navigation }) {

  const songs = [
    { id: '1', name: 'Softy Love', file: 'song1.mp3', image: require('../../assest/image/logo.png') },
    { id: '2', name: 'Calm Melody', file: 'song1.mp3', image: require('../../assest/image/logo.png') },
    { id: '3', name: 'Relax Vibes', file: 'song1.mp3', image: require('../../assest/image/logo.png') },
  ];

  const openPlayer = (song, index) => {
    navigation.navigate("PlayerScreen", { song, index, songs });
  };

  return (
    <ScrollView style={styles.container}>

      {/* Header */}
      <Text style={styles.header}>Good Evening 👋</Text>

      {/* Recommended Row (Spotify Style) */}
      <Text style={styles.sectionTitle}>Recommended For You</Text>
      <FlatList
        horizontal
        data={songs}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <TouchableOpacity style={styles.horizontalCard} onPress={() => openPlayer(item, index)}>
            <Image source={item.image} style={styles.horizontalImage} />
            <Text style={styles.horizontalText}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />

      {/* All Songs List */}
      <Text style={styles.sectionTitle}>All Songs</Text>
      <FlatList
        scrollEnabled={false}
        data={songs}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <TouchableOpacity style={styles.songItem} onPress={() => openPlayer(item, index)}>
            <Image source={item.image} style={styles.songImage} />
            <Text style={styles.songText}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#0d0d0d",
    flex: 1
  },

  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: "#fff",
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: "#fff",
    marginVertical: 12,
  },

  /* Horizontal Spotify Cards */
  horizontalCard: {
    marginRight: 15,
    backgroundColor: "#1c1c1c",
    borderRadius: 16,
    padding: 10,
    width: 140,
    alignItems: "center",
  },

  horizontalImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },

  horizontalText: {
    color: "#fff",
    marginTop: 8,
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },

  /* List Item (Spotify Style) */
  songItem: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: "#1b1b1b",
    borderRadius: 14,
    marginBottom: 12,
    alignItems: 'center',
  },

  songImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
  },

  songText: {
    marginLeft: 15,
    fontSize: 18,
    color: "#fff",
    fontWeight: "500",
  },
});

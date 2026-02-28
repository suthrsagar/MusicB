import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, StatusBar, ActivityIndicator, Platform } from 'react-native';
import { theme } from '../../theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../services/apiConfig';
import { useMusic } from '../../context/MusicContext';

const PlaylistDetailScreen = ({ route, navigation }) => {
    const { playlistId } = route.params;
    const [playlist, setPlaylist] = useState(null);
    const [loading, setLoading] = useState(true);
    const { playSong, currentSong, isPlaying } = useMusic();

    useEffect(() => {
        fetchPlaylistDetails();
    }, []);

    const fetchPlaylistDetails = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await axios.get(`${BASE_URL}/api/playlist/${playlistId}`, {
                headers: { 'x-auth-token': token }
            });
            setPlaylist(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handlePlaySong = (song, index) => {

        playSong(song, playlist.songs);
    };

    const renderSongItem = ({ item, index }) => {
        const isActive = currentSong && currentSong._id === item._id;
        return (
            <TouchableOpacity style={styles.songItem} onPress={() => handlePlaySong(item, index)}>
                <Image
                    source={item.coverImage ? { uri: item.coverImage } : require('../../assest/image/logo.png')}
                    style={styles.songImage}
                />
                <View style={styles.songInfo}>
                    <Text style={[styles.songTitle, isActive && { color: theme.colors.primary }]}>
                        {item.title}
                    </Text>
                    <Text style={styles.songArtist}>{item.artist}</Text>
                </View>
                {isActive && (
                    <Ionicons name={isPlaying ? "musical-notes" : "pause"} size={20} color={theme.colors.primary} />
                )}
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (!playlist) {
        return (
            <View style={styles.center}>
                <Text>Playlist not found</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />


            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <View style={styles.coverBox}>
                        <Ionicons name="musical-notes" size={50} color="#fff" />
                    </View>
                    <Text style={styles.title}>{playlist.name}</Text>
                    <Text style={styles.subtitle}>{playlist.songs.length} Songs</Text>
                </View>


                {playlist.songs.length > 0 && (
                    <TouchableOpacity
                        style={styles.playAllBtn}
                        onPress={() => handlePlaySong(playlist.songs[0], 0)}
                    >
                        <Ionicons name="play" size={24} color="#fff" />
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.listContainer}>
                <FlatList
                    data={playlist.songs}
                    renderItem={renderSongItem}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyBox}>
                            <Text style={styles.emptyText}>This playlist is empty.</Text>
                            <Text style={styles.emptySub}>Add songs from the player.</Text>
                        </View>
                    }
                />
            </View>
        </View>
    );
};

export default PlaylistDetailScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    header: {
        height: 280,
        backgroundColor: theme.colors.primary,
        justifyContent: 'flex-end',
        padding: 20,
        position: 'relative'
    },
    backBtn: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 20,
        left: 20,
        zIndex: 10,
        padding: 10,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 20
    },
    headerInfo: {
        alignItems: 'center',
        marginBottom: 20
    },
    coverBox: {
        width: 100,
        height: 100,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 5
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)'
    },
    playAllBtn: {
        position: 'absolute',
        bottom: -25,
        right: 30,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: theme.colors.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 5
    },
    listContainer: {
        flex: 1,
        marginTop: 30
    },
    listContent: {
        padding: 20,
        paddingBottom: 100
    },
    songItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20
    },
    songImage: {
        width: 50,
        height: 50,
        borderRadius: 10,
        backgroundColor: '#eee'
    },
    songInfo: {
        flex: 1,
        marginLeft: 15
    },
    songTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 4
    },
    songArtist: {
        fontSize: 12,
        color: theme.colors.textSecondary
    },
    emptyBox: {
        alignItems: 'center',
        marginTop: 50,
        opacity: 0.6
    },
    emptyText: {
        fontSize: 16,
        color: theme.colors.text
    },
    emptySub: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginTop: 5
    }
});

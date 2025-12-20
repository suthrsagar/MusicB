import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useMusic } from '../context/MusicContext';
import { theme } from '../theme';

const MiniPlayer = () => {
    const navigation = useNavigation();
    const { currentSong, isPlaying, togglePlayPause, loading } = useMusic();

    if (!currentSong) return null;

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={() => navigation.navigate('PlayerScreen')}
            activeOpacity={0.9}
        >
            <View style={styles.artwork}>
                <Ionicons name="musical-notes" size={24} color="#fff" />
            </View>

            <View style={styles.textContainer}>
                <Text style={styles.title} numberOfLines={1}>{currentSong.title}</Text>
                <Text style={styles.artist} numberOfLines={1}>{currentSong.artist}</Text>
            </View>

            <TouchableOpacity onPress={togglePlayPause} style={styles.playButton}>
                {loading ? (
                    <ActivityIndicator color={theme.colors.primary} size="small" />
                ) : (
                    <Ionicons name={isPlaying ? "pause" : "play"} size={28} color={theme.colors.text} />
                )}
            </TouchableOpacity>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface || '#fff', // fallback
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border || '#eee',
        // Shadow (Elevation) to separate from content
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    artwork: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: theme.colors.primary || '#6200ee',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center'
    },
    title: {
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.colors.text || '#000'
    },
    artist: {
        fontSize: 12,
        color: theme.colors.textSecondary || '#666'
    },
    playButton: {
        padding: 5
    }
});

export default MiniPlayer;

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useMusic } from '../context/MusicContext';
import { theme } from '../theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const MiniPlayer = () => {
    const { currentSong, isPlaying, togglePlayPause, loading, closePlayer, playNext } = useMusic();
    const navigation = useNavigation();

    if (!currentSong) return null;

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={() => navigation.navigate('PlayerScreen', { song: currentSong })}
            activeOpacity={0.9}
        >
            <View style={styles.leftSection}>
                <View style={styles.artBox}>
                    <Ionicons name="musical-notes" size={20} color="#fff" />
                </View>
                <View style={styles.info}>
                    <Text style={styles.title} numberOfLines={1}>{currentSong.title}</Text>
                    <Text style={styles.artist} numberOfLines={1}>{currentSong.artist}</Text>
                </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity style={styles.playBtn} onPress={togglePlayPause}>
                    {loading ? (
                        <ActivityIndicator color={theme.colors.primary} size="small" />
                    ) : (
                        <Ionicons
                            name={isPlaying ? "pause" : "play"}
                            size={28}
                            color={theme.colors.primary}
                        />
                    )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.nextBtn} onPress={playNext}>
                    <Ionicons name="play-skip-forward" size={20} color={theme.colors.text} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.closeBtn} onPress={closePlayer}>
                    <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 90, // Above the tab bar (height ~70 + margin 20)
        left: 20,
        right: 20,
        height: 65,
        backgroundColor: theme.colors.surface, // Use surface color for contrast
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)'
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    artBox: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    info: {
        flex: 1,
    },
    title: {
        fontWeight: 'bold',
        fontSize: 14,
        color: theme.colors.text,
        marginBottom: 2,
    },
    artist: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    playBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        borderRadius: 20,
    },
    nextBtn: {
        marginLeft: 10,
        padding: 5
    },
    closeBtn: {
        marginLeft: 10,
        padding: 5
    }
});

export default MiniPlayer;

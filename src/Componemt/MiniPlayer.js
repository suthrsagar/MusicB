import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image, PanResponder, Animated } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useMusic } from '../context/MusicContext';
import { theme } from '../theme';

const MiniPlayer = () => {
    const navigation = useNavigation();
    const { currentSong, isPlaying, togglePlayPause, loading, playNext, closePlayer } = useMusic();

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => {

                return Math.abs(gestureState.dy) > 10 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy < -30) {

                    navigation.navigate('PlayerScreen');
                }
            }
        })
    ).current;

    if (!currentSong) return null;

    return (
        <View style={styles.outerContainer} {...panResponder.panHandlers}>
            <TouchableOpacity
                style={styles.container}
                onPress={() => navigation.navigate('PlayerScreen')}
                activeOpacity={0.9}
            >
                <View style={styles.artwork}>
                    {currentSong.coverImage ? (
                        <Image source={{ uri: currentSong.coverImage }} style={styles.coverImage} resizeMode="cover" />
                    ) : (
                        <Ionicons name="musical-notes" size={20} color="#fff" />
                    )}
                </View>

                <View style={styles.textContainer}>
                    <Text style={styles.title} numberOfLines={1}>{currentSong.title}</Text>
                    <Text style={styles.artist} numberOfLines={1}>{currentSong.artist}</Text>
                </View>

                <View style={styles.controls}>
                    <TouchableOpacity onPress={togglePlayPause} style={styles.controlButton}>
                        {loading ? (
                            <ActivityIndicator color={theme.colors.primary} size="small" />
                        ) : (
                            <Ionicons name={isPlaying ? "pause" : "play"} size={26} color={theme.colors.text} />
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={playNext} style={styles.controlButton}>
                        <Ionicons name="play-skip-forward" size={24} color={theme.colors.text} />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={closePlayer} style={styles.controlButton}>
                        <Ionicons name="close-circle" size={24} color={theme.colors.error} />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    outerContainer: {
        position: 'absolute',
        bottom: 105,
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingHorizontal: 15,
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        padding: 12,
        borderRadius: 20,
        width: '100%',
        ...theme.shadows.medium,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    artwork: {
        width: 45,
        height: 45,
        borderRadius: 12,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        overflow: 'hidden'
    },
    coverImage: {
        width: '100%',
        height: '100%'
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center'
    },
    title: {
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.colors.text
    },
    artist: {
        fontSize: 12,
        color: theme.colors.textSecondary
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    controlButton: {
        padding: 8,
        marginLeft: 2,
    }
});

export default MiniPlayer;

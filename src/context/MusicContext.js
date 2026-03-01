import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import TrackPlayer, {
    AppKilledPlaybackBehavior,
    Capability,
    Event,
    RepeatMode,
    State,
    usePlaybackState,
    useProgress,
    useTrackPlayerEvents
} from 'react-native-track-player';
import { Alert, Platform } from 'react-native';
import RNFS from 'react-native-fs';

const MusicContext = createContext();

import { BASE_URL } from '../services/apiConfig';

const events = [
    Event.PlaybackState,
    Event.PlaybackError,
    Event.PlaybackQueueEnded,
    Event.PlaybackTrackChanged,
];

export const MusicProvider = ({ children }) => {
    const [currentSong, setCurrentSong] = useState(null);
    const [queue, setQueue] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [isPlayerReady, setIsPlayerReady] = useState(false);
    const [loading, setLoading] = useState(false);

    const playBackState = usePlaybackState();
    const progress = useProgress();

    const isPlaying = playBackState.state === State.Playing || playBackState.state === State.Buffering;

    const queueRef = useRef([]);
    const currentIndexRef = useRef(-1);

    useEffect(() => {
        queueRef.current = queue;
        currentIndexRef.current = currentIndex;
    }, [queue, currentIndex]);

    useEffect(() => {
        const setupPlayer = async () => {
            let isSetup = false;
            try {
                await TrackPlayer.getCurrentTrack();
                isSetup = true;
            } catch {
                await TrackPlayer.setupPlayer();
                await TrackPlayer.updateOptions({
                    android: {
                        appKilledPlaybackBehavior: AppKilledPlaybackBehavior.ContinuePlayback,
                    },
                    capabilities: [
                        Capability.Play,
                        Capability.Pause,
                        Capability.SkipToNext,
                        Capability.SkipToPrevious,
                        Capability.Stop,
                        Capability.SeekTo
                    ],
                    compactCapabilities: [
                        Capability.Play,
                        Capability.Pause,
                        Capability.SkipToNext,
                        Capability.SkipToPrevious
                    ],
                });
                isSetup = true;
            } finally {
                setIsPlayerReady(isSetup);
            }
        };

        setupPlayer();

        return () => { };
    }, []);

    useTrackPlayerEvents(events, async (event) => {
        if (event.type === Event.PlaybackError) {
            console.warn('Playback error', event.error);
        }

        if (event.type === Event.PlaybackTrackChanged) {
            setLoading(false);
            if (event.nextTrack !== null && event.nextTrack !== undefined) {
                const track = await TrackPlayer.getTrack(event.nextTrack);
                if (track && track.originalSong) {
                    setCurrentSong(track.originalSong);
                    // Update current index based on queue
                    const newIdx = queueRef.current.findIndex(s => s.fileId === track.originalSong.fileId);
                    if (newIdx !== -1) {
                        setCurrentIndex(newIdx);
                    }
                }
            }
        }

        if (event.type === Event.PlaybackQueueEnded && event.position > 0) {
            // Handle next if auto-next is desired, but TrackPlayer automatically advances if queue has items.
            // If queue ended, we can playNextInternal to loop or just stop. 
            playNextInternal();
        }
    });

    const getPlaySource = async (song) => {
        if (song.filePath) {
            const exists = await RNFS.exists(song.filePath);
            if (exists) {
                return song.filePath.startsWith('file://') ? song.filePath : `file://${song.filePath}`;
            }
        }
        return `${BASE_URL}/api/song/stream/${song.fileId}`;
    };

    const convertToTrack = async (song) => {
        const url = await getPlaySource(song);
        return {
            id: song.fileId,
            url: url,
            title: song.title || 'Unknown Title',
            artist: song.artist?.name || 'Unknown Artist',
            artwork: song.imageUrl ? `${BASE_URL}${song.imageUrl}` : undefined,
            originalSong: song // Save original data for UI sync
        };
    };

    const playSong = async (song, playlistList = []) => {
        if (!isPlayerReady) return;
        try {
            setLoading(true);
            setCurrentSong(song);

            let newQueue = playlistList.length > 0 ? playlistList : [song];
            setQueue(newQueue);

            const newIndex = newQueue.findIndex(s => s.fileId === song.fileId);
            setCurrentIndex(newIndex !== -1 ? newIndex : 0);

            // Convert all to tracks
            const tracks = await Promise.all(newQueue.map(s => convertToTrack(s)));

            await TrackPlayer.reset();
            await TrackPlayer.add(tracks);

            if (newIndex !== -1 && newIndex !== 0) {
                await TrackPlayer.skip(newIndex);
            }

            await TrackPlayer.play();

        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Cannot play this song');
            setLoading(false);
        }
    };

    const playNextInternal = async () => {
        if (!isPlayerReady) return;
        try {
            await TrackPlayer.skipToNext();
        } catch (e) {
            console.log("Error playing next", e);
            // If at end of queue, wrap around
            const currentQueue = queueRef.current;
            if (currentQueue.length > 0) {
                await TrackPlayer.skip(0);
                await TrackPlayer.play();
            }
        }
    };

    const playNext = () => playNextInternal();

    const playPrev = async () => {
        if (!isPlayerReady) return;
        try {
            const position = await TrackPlayer.getPosition();
            if (position > 3) {
                await TrackPlayer.seekTo(0);
                return;
            }
            await TrackPlayer.skipToPrevious();
        } catch (e) {
            console.log("Error playing prev", e);
            const currentQueue = queueRef.current;
            if (currentQueue.length > 0) {
                await TrackPlayer.skip(currentQueue.length - 1);
                await TrackPlayer.play();
            }
        }
    };

    const togglePlayPause = async () => {
        if (!currentSong || !isPlayerReady) return;
        try {
            if (playBackState.state === State.Playing) {
                await TrackPlayer.pause();
            } else {
                await TrackPlayer.play();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const seekTo = async (seconds) => {
        if (!isPlayerReady) return;
        try {
            await TrackPlayer.seekTo(seconds);
        } catch (e) { console.error(e); }
    };

    const closePlayer = async () => {
        if (!isPlayerReady) return;
        try {
            await TrackPlayer.reset();
            setCurrentSong(null);
            setQueue([]);
            setCurrentIndex(-1);
        } catch (e) { }
    };

    return (
        <MusicContext.Provider value={{
            currentSong,
            isPlaying,
            loading,
            progress: { position: progress.position, duration: progress.duration },
            playSong,
            playNext,
            playPrev,
            togglePlayPause,
            seekTo,
            closePlayer,
            isPlayerReady
        }}>
            {children}
        </MusicContext.Provider>
    );
};

export const useMusic = () => useContext(MusicContext);

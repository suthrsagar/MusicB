import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import SoundPlayer from 'react-native-sound-player';
import { Alert, Platform } from 'react-native';
import RNFS from 'react-native-fs';

const MusicContext = createContext();

import { BASE_URL } from '../services/apiConfig';

export const MusicProvider = ({ children }) => {
    const [currentSong, setCurrentSong] = useState(null);
    const [queue, setQueue] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState({ position: 0, duration: 0 });

    const queueRef = useRef([]);
    const currentIndexRef = useRef(-1);


    useEffect(() => {
        queueRef.current = queue;
        currentIndexRef.current = currentIndex;
    }, [queue, currentIndex]);

    useEffect(() => {

        const onFinishedLoadingURL = SoundPlayer.addEventListener('FinishedLoadingURL', ({ success, url }) => {
            setLoading(false);
            if (success) {
                setIsPlaying(true);
            }
        });

        const onFinishedPlaying = SoundPlayer.addEventListener('FinishedPlaying', ({ success }) => {
            setIsPlaying(false);

            setTimeout(() => {
                playNextInternal();
            }, 500);
        });


        const interval = setInterval(async () => {
            if (isPlaying) {
                try {
                    const info = await SoundPlayer.getInfo();
                    if (info) {
                        setProgress({ position: info.currentTime, duration: info.duration });
                    }
                } catch (e) { }
            }
        }, 1000);

        return () => {
            onFinishedLoadingURL.remove();
            onFinishedPlaying.remove();
            clearInterval(interval);
        };
    }, [isPlaying]);

    const getPlaySource = async (song) => {
        if (song.filePath) {
            const exists = await RNFS.exists(song.filePath);
            if (exists) {
                // Ensure file:// prefix for local files on Android
                return song.filePath.startsWith('file://') ? song.filePath : `file://${song.filePath}`;
            }
        }
        return `${BASE_URL}/api/song/stream/${song.fileId}`;
    };

    const playSong = async (song, playlistList = []) => {
        try {
            setLoading(true);
            setCurrentSong(song);


            if (playlistList.length > 0) {
                setQueue(playlistList);
                const newIndex = playlistList.findIndex(s => s.fileId === song.fileId);
                setCurrentIndex(newIndex !== -1 ? newIndex : 0);
            } else {
                setQueue([song]);
                setCurrentIndex(0);
            }

            const source = await getPlaySource(song);


            try { SoundPlayer.stop(); } catch (e) { }


            setTimeout(() => {
                SoundPlayer.playUrl(source);
            }, 100);

        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Cannot play this song');
            setLoading(false);
            setIsPlaying(false);
        }
    };

    const playNextInternal = async () => {
        const currentQueue = queueRef.current;
        const currentIdx = currentIndexRef.current;

        if (currentQueue.length === 0) return;

        let nextIndex = currentIdx + 1;


        if (nextIndex >= currentQueue.length) {
            nextIndex = 0;
        }

        const nextSong = currentQueue[nextIndex];


        setCurrentIndex(nextIndex);
        setCurrentSong(nextSong);
        setLoading(true);

        try {
            const source = await getPlaySource(nextSong);
            try { SoundPlayer.stop(); } catch (e) { }
            setTimeout(() => {
                SoundPlayer.playUrl(source);
            }, 100);
        } catch (e) {
            console.log("Error playing next", e);
            setLoading(false);
        }
    };

    const playNext = () => playNextInternal();

    const playPrev = async () => {
        const currentQueue = queueRef.current;
        const currentIdx = currentIndexRef.current;

        if (currentQueue.length === 0) return;


        try {
            const info = await SoundPlayer.getInfo();
            if (info && info.currentTime > 3) {
                SoundPlayer.seek(0);
                return;
            }
        } catch (e) { }

        let prevIndex = currentIdx - 1;
        if (prevIndex < 0) {
            prevIndex = currentQueue.length - 1;
        }

        const prevSong = currentQueue[prevIndex];

        setCurrentIndex(prevIndex);
        setCurrentSong(prevSong);
        setLoading(true);

        try {
            const source = await getPlaySource(prevSong);
            try { SoundPlayer.stop(); } catch (e) { }
            setTimeout(() => {
                SoundPlayer.playUrl(source);
            }, 100);
        } catch (e) {
            console.log("Error playing prev", e);
            setLoading(false);
        }
    };

    const togglePlayPause = () => {
        if (!currentSong) return;

        try {
            if (isPlaying) {
                SoundPlayer.pause();
                setIsPlaying(false);
            } else {
                SoundPlayer.resume();
                setIsPlaying(true);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const seekTo = (seconds) => {
        try {
            SoundPlayer.seek(seconds);
        } catch (e) { console.error(e); }
    };

    const closePlayer = () => {
        try {
            SoundPlayer.stop();
            setIsPlaying(false);
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
            progress,
            playSong,
            playNext,
            playPrev,
            togglePlayPause,
            seekTo,
            closePlayer
        }}>
            {children}
        </MusicContext.Provider>
    );
};

export const useMusic = () => useContext(MusicContext);

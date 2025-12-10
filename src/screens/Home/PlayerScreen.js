import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import Sound from 'react-native-sound';

Sound.setCategory('Playback');

export default function PlayerScreen({ route, navigation }) {
    const { song, index, songs } = route.params;

    const soundRef = useRef(null);
    const intervalRef = useRef(null);

    const [currentIndex, setCurrentIndex] = useState(index);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);

    // Play Song
    const loadAndPlay = () => {
        stopSong(() => {
            const selected = songs[currentIndex];

            const sound = new Sound(selected.file, Sound.MAIN_BUNDLE, (err) => {
                if (err) return;

                soundRef.current = sound;
                setDuration(sound.getDuration());
                setIsPlaying(true);

                sound.play(() => nextSong());
            });

            startTimer();
        });
    };

    // Timer
    const startTimer = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);

        intervalRef.current = setInterval(() => {
            if (soundRef.current && isPlaying) {
                soundRef.current.getCurrentTime(sec => setProgress(sec));
            }
        }, 500);
    };

    // Stop Song
    const stopSong = (cb) => {
        if (soundRef.current) {
            soundRef.current.stop(() => {
                soundRef.current.release();
                soundRef.current = null;
                progress(0);
                cb && cb();
            });
        } else cb && cb();
    };

    // Play / Pause
    const togglePlay = () => {
        if (!soundRef.current) return loadAndPlay();

        if (isPlaying) {
            soundRef.current.pause();
            setIsPlaying(false);
        } else {
            soundRef.current.play();
            setIsPlaying(true);
        }
    };

    // Next Song
    const nextSong = () => {
        let next = currentIndex + 1;
        if (next >= songs.length) next = 0;
        setCurrentIndex(next);
    };

    // Previous Song
    const prevSong = () => {
        let prev = currentIndex - 1;
        if (prev < 0) prev = songs.length - 1;
        setCurrentIndex(prev);
    };

    // Seek
    const seek = (value) => {
        if (soundRef.current) {
            soundRef.current.setCurrentTime(value);
            setProgress(value);
        }
    };

    // Convert Time
    const time = (sec) => {
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${s < 10 ? '0' + s : s}`;
    };

    useEffect(() => {
        loadAndPlay();
        return () => stopSong();
    }, [currentIndex]);

    const currentSong = songs[currentIndex];

    return (
        <View style={styles.container}>

            <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.back}>⬅ Back</Text>
            </TouchableOpacity>

            <Image source={currentSong.image} style={styles.cover} />

            <Text style={styles.title}>{currentSong.name}</Text>

            <Slider
                value={progress}
                minimumValue={0}
                maximumValue={duration}
                onSlidingComplete={seek}
                minimumTrackTintColor="#ff7043"
                maximumTrackTintColor="#ddd"
                thumbTintColor="#ff7043"
            />

            <View style={styles.timeRow}>
                <Text>{time(progress)}</Text>
                <Text>{time(duration)}</Text>
            </View>

            <View style={styles.controls}>
                <TouchableOpacity onPress={prevSong}><Text style={styles.btn}>⏮</Text></TouchableOpacity>
                <TouchableOpacity onPress={togglePlay}><Text style={styles.btn}>{isPlaying ? "⏸" : "▶️"}</Text></TouchableOpacity>
                <TouchableOpacity onPress={nextSong}><Text style={styles.btn}>⏭</Text></TouchableOpacity>
            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff", padding: 20 },
    back: { fontSize: 18, marginBottom: 10 },
    cover: { width: "100%", height: 300, borderRadius: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginVertical: 20, textAlign: "center" },
    timeRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 5 },
    controls: { flexDirection: "row", justifyContent: "space-around", marginTop: 30 },
    btn: { fontSize: 32, padding: 10 },
});

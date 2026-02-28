import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions, StatusBar, Text } from 'react-native';
import { theme } from '../../theme';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const SplashScreen = () => {
    const navigation = useNavigation();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.3)).current;
    const textAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 4,
                useNativeDriver: true,
            }),
            Animated.timing(textAnim, {
                toValue: 0,
                duration: 800,
                delay: 500,
                useNativeDriver: true,
            })
        ]).start();

        const checkAuth = async () => {
            const token = await AsyncStorage.getItem('token');
            const storedDownloads = await AsyncStorage.getItem('downloadedSongs');
            const hasDownloads = storedDownloads ? JSON.parse(storedDownloads).length > 0 : false;

            setTimeout(() => {
                // If token exists, we always try to enter the app (profile will load from cache if offline)
                // If no token but has downloads, allow entering the app for offline playback
                if (token || hasDownloads) {
                    navigation.replace('Tabs');
                } else {
                    navigation.replace('LoginProfile');
                }
            }, 2500);
        };

        checkAuth();
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

            <View style={[styles.circle, { top: -50, right: -50, backgroundColor: theme.colors.secondary }]} />
            <View style={[styles.circle, { bottom: -100, left: -100, width: 300, height: 300, backgroundColor: theme.colors.primary, opacity: 0.1 }]} />

            <View style={styles.content}>
                <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }, { translateY: textAnim }] }}>
                    <Text style={styles.appName}>MusicZ</Text>
                    <Text style={styles.tagline}>Music for Entertainment</Text>
                </Animated.View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
    },
    appName: {
        fontSize: 48,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 4,
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 10,
    },
    tagline: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 10,
        fontWeight: '600',
        letterSpacing: 2,
        textTransform: 'uppercase',
        textAlign: 'center',
    },
    circle: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        opacity: 0.2,
    }
});

export default SplashScreen;

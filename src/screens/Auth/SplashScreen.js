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
        // Start animations
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

        // Check auth and navigate
        const checkAuth = async () => {
            const token = await AsyncStorage.getItem('token');
            setTimeout(() => {
                if (token) {
                    navigation.replace('Tabs');
                } else {
                    navigation.replace('LoginProfile');
                }
            }, 2500); // 2.5 seconds splash
        };

        checkAuth();
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

            {/* Background Decorative Circles */}
            <View style={[styles.circle, { top: -50, right: -50, backgroundColor: theme.colors.secondary }]} />
            <View style={[styles.circle, { bottom: -100, left: -100, width: 300, height: 300, backgroundColor: theme.colors.primary, opacity: 0.1 }]} />

            <View style={styles.content}>
                <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
                    <Animated.Image
                        source={require('../../assest/image/logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </Animated.View>

                <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: textAnim }] }}>
                    <Text style={styles.appName}>MoiveB</Text>
                    <Text style={styles.tagline}>Pulse of Entertainment</Text>
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
    logo: {
        width: 150,
        height: 150,
        borderRadius: 40,
        marginBottom: 20,
    },
    appName: {
        fontSize: 32,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 2,
    },
    tagline: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.7)',
        marginTop: 5,
        fontWeight: '500',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
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

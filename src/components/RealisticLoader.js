import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { theme } from '../theme';

const { width } = Dimensions.get('window');

const RealisticLoader = ({ message = "Loading MusicZ..." }) => {
    const spinValue = new Animated.Value(0);
    const pulseValue = new Animated.Value(0.8);

    useEffect(() => {
        Animated.loop(
            Animated.timing(spinValue, {
                toValue: 1,
                duration: 2000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseValue, {
                    toValue: 1.2,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseValue, {
                    toValue: 0.8,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={styles.container}>
            <View style={styles.loaderWrapper}>
                <Animated.View style={[styles.glow, { transform: [{ scale: pulseValue }] }]} />
                <Animated.View style={[styles.ring, { transform: [{ rotate: spin }] }]} />
                <View style={styles.centerDot} />
            </View>
            <Text style={styles.text}>{message}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
    },
    loaderWrapper: {
        width: 100,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    glow: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: theme.colors.primary,
        opacity: 0.3,
    },
    ring: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 4,
        borderColor: theme.colors.primary,
        borderTopColor: 'transparent',
        borderLeftColor: 'rgba(255,255,255,0.1)',
    },
    centerDot: {
        position: 'absolute',
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#fff',
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
    },
    text: {
        marginTop: 30,
        color: theme.colors.text,
        fontSize: 18,
        fontWeight: '600',
        letterSpacing: 2,
        opacity: 0.8,
        textTransform: 'uppercase',
    },
});

export default RealisticLoader;

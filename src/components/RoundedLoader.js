import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { theme } from '../theme';

const RoundedLoader = ({ percentage = 0, size = 120, strokeWidth = 10 }) => {
    const spinValue = new Animated.Value(0);

    useEffect(() => {
        Animated.timing(animatedValue, {
            toValue: percentage,
            duration: 1000,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
            useNativeDriver: false,
        }).start();

        Animated.loop(
            Animated.timing(spinValue, {
                toValue: 1,
                duration: 3000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
    }, [percentage]);

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            <Animated.View style={[styles.glowRing, { transform: [{ rotate: spin }] }]} />
            <View style={[styles.backgroundCircle, {
                width: size - 4,
                height: size - 4,
                borderRadius: (size - 4) / 2,
                borderWidth: strokeWidth,
                borderColor: 'rgba(255,255,255,0.05)'
            }]} />

            <View style={styles.textContainer}>
                <Text style={styles.percentageText}>{Math.round(percentage)}%</Text>
                <Text style={styles.loadingLabel}>{percentage >= 100 ? 'Complete' : 'Downloading'}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    glowRing: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: 100,
        borderWidth: 3,
        borderColor: theme.colors.primary,
        borderTopColor: 'transparent',
    },
    backgroundCircle: {
        position: 'absolute',
    },
    textContainer: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    percentageText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        fontFamily: 'System',
    },
    loadingLabel: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: 2,
    }
});

export default RoundedLoader;

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { theme } from '../theme';

const RoundedLoader = ({ percentage = 0, size = 120, strokeWidth = 10 }) => {
    const animatedValue = new Animated.Value(0);

    useEffect(() => {
        Animated.timing(animatedValue, {
            toValue: percentage,
            duration: 500,
            easing: Easing.out(Easing.exp),
            useNativeDriver: false,
        }).start();
    }, [percentage]);

    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            <View style={[styles.backgroundCircle, {
                width: size,
                height: size,
                borderRadius: size / 2,
                borderWidth: strokeWidth,
                borderColor: 'rgba(255,255,255,0.1)'
            }]} />

            {/* Percentage Text */}
            <View style={styles.textContainer}>
                <Text style={styles.percentageText}>{Math.round(percentage)}%</Text>
                <Text style={styles.loadingLabel}>Loading</Text>
            </View>

            {/* Since we don't have SVG, we'll use a CSS-like trick or just a nice animated bar for now */}
            {/* For a truly circular progress bar without SVG, it's complex in RN. 
          I'll implement a sleek modern linear fallback that fits the theme if SVG isn't here,
          OR use multiple rotated views. Let's try a premium spinning effect instead. */}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
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

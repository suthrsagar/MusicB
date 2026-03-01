import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { theme } from '../theme';

const PremiumLoader = ({ size = 60, color = theme.colors.primary }) => {
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        const rotate = Animated.loop(
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 1000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );

        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 0.8,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        );

        rotate.start();
        pulse.start();

        return () => {
            rotate.stop();
            pulse.stop();
        };
    }, []);

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            <Animated.View
                style={[
                    styles.ring,
                    {
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        borderColor: color,
                        borderTopColor: 'transparent',
                        transform: [{ rotate: spin }, { scale: pulseAnim }]
                    }
                ]}
            />
            <Animated.View
                style={[
                    styles.dot,
                    {
                        width: size * 0.15,
                        height: size * 0.15,
                        borderRadius: (size * 0.15) / 2,
                        backgroundColor: color,
                        transform: [{ scale: pulseAnim }]
                    }
                ]}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    ring: {
        position: 'absolute',
        borderWidth: 3,
        opacity: 0.8,
    },
    dot: {
        position: 'absolute',
    }
});

export default PremiumLoader;

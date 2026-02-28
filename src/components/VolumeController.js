import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { VolumeManager } from 'react-native-volume-manager';
import Slider from '@react-native-community/slider';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';

const VolumeController = () => {
    const [volume, setVolume] = useState(0.5);

    const opacity = useSharedValue(0);
    const display = useSharedValue('none');
    const timerRef = React.useRef(null);
    const scale = useSharedValue(1);


    const showController = () => {
        'worklet';
        display.value = 'flex';
        opacity.value = withSpring(1);


    };

    const scheduleHide = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            opacity.value = withTiming(0, { duration: 500 }, () => {
                display.value = 'none';
            });
        }, 3000);
    }, []);

    const onVolumeChange = useCallback((newVolume) => {
        setVolume(newVolume);

        display.value = 'flex';
        opacity.value = withSpring(1);
        scheduleHide();
    }, [scheduleHide]);

    useEffect(() => {
        const initVolume = async () => {
            try {
                const currentVolume = await VolumeManager.getVolume();
                if (typeof currentVolume === 'number') {
                    setVolume(currentVolume);
                } else if (currentVolume && typeof currentVolume.volume === 'number') {
                    setVolume(currentVolume.volume);
                }
                await VolumeManager.showNativeVolumeUI({ enabled: false });
            } catch (error) {
                console.warn("Failed to get volume", error);
            }
        };

        initVolume();

        const volumeListener = VolumeManager.addVolumeListener((result) => {
            onVolumeChange(result.volume);
        });

        return () => {
            volumeListener.remove();
            VolumeManager.showNativeVolumeUI({ enabled: true });
        };
    }, [onVolumeChange]);

    const handleManualChange = async (value) => {
        setVolume(value);
        scheduleHide();
        try {
            await VolumeManager.setVolume(value);
        } catch (e) {
            console.warn("Failed to set volume", e);
        }
    };

    const increaseVolume = async () => {
        const newVol = Math.min(volume + 0.05, 1);
        await handleManualChange(newVol);
        animateButton();
    };

    const decreaseVolume = async () => {
        const newVol = Math.max(volume - 0.05, 0);
        await handleManualChange(newVol);
        animateButton();
    };

    const animateButton = () => {
        scale.value = withSpring(1.2, {}, () => {
            scale.value = withSpring(1);
        });
    };


    const containerAnimatedStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
            display: display.value,
        };
    });


    const buttonAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
        };
    });

    return (
        <Animated.View style={[styles.container, containerAnimatedStyle]}>
            <View style={styles.header}>
                <Text style={styles.percentage}>{Math.round(volume * 100)}%</Text>
            </View>

            <View style={styles.verticalControls}>
                <TouchableOpacity onPress={increaseVolume} style={styles.button}>
                    <Animated.View style={buttonAnimatedStyle}>
                        <Icon name="add-circle-outline" size={24} color="#A3AED0" />
                    </Animated.View>
                </TouchableOpacity>

                <View style={styles.verticalSliderContainer}>
                    <Slider
                        style={styles.verticalSlider}
                        value={volume}
                        minimumValue={0}
                        maximumValue={1}
                        step={0.01}
                        onValueChange={handleManualChange}
                        minimumTrackTintColor="#4318FF"
                        maximumTrackTintColor="#EFF4FB"
                        thumbTintColor="#4318FF"
                    />
                </View>

                <TouchableOpacity onPress={decreaseVolume} style={styles.button}>
                    <Animated.View style={buttonAnimatedStyle}>
                        <Icon name="remove-circle-outline" size={24} color="#A3AED0" />
                    </Animated.View>
                </TouchableOpacity>
            </View>

            <View style={styles.iconIndicator}>
                <Icon
                    name={volume === 0 ? "volume-mute" : volume < 0.5 ? "volume-low" : "volume-high"}
                    size={20}
                    color={volume === 0 ? "#EE5D50" : "#4318FF"}
                />
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 10,
        top: '30%',
        zIndex: 9999,
        backgroundColor: '#FFFFFF',
        borderRadius: 30,
        paddingVertical: 20,
        paddingHorizontal: 12,
        shadowColor: "#4318FF",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 250,
    },
    header: {
        marginBottom: 10,
        alignItems: 'center',
    },
    percentage: {
        color: '#1B254B',
        fontSize: 12,
        fontWeight: '700',
    },
    verticalControls: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
    },
    verticalSliderContainer: {
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 10,
        width: 40,
    },
    verticalSlider: {
        width: 150,
        height: 40,
        transform: [{ rotate: '-90deg' }],
    },
    button: {
        padding: 5,
    },
    iconIndicator: {
        marginTop: 10,
        alignItems: 'center',
    }
});

export default VolumeController;

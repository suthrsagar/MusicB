import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  Animated,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { VolumeManager } from 'react-native-volume-manager';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Custom Hook for Volume
const useSystemVolume = () => {
  const [volume, setVolume] = useState(0);

  useEffect(() => {
    // Initial fetch
    VolumeManager.getVolume().then((result) => {
      // API adjustment: sometimes returns object { volume: number } or just number
      const vol = typeof result === 'object' ? result.volume : result;
      setVolume(vol || 0);
    });

    // Listener for hardware buttons
    const listener = VolumeManager.addVolumeListener((result) => {
      const vol = typeof result === 'object' ? result.volume : result;
      setVolume(vol || 0);
    });

    return () => {
      if (listener?.remove) listener.remove();
    };
  }, []);

  const changeVolume = async (newVolume) => {
    // Clamp between 0 and 1
    const clamped = Math.max(0, Math.min(1, newVolume));
    await VolumeManager.setVolume(clamped);
    setVolume(clamped);
  };

  return { volume, changeVolume };
};

const VolumeController = () => {
  const { volume, changeVolume } = useSystemVolume();
  const [sliderWidth, setSliderWidth] = useState(0);
  
  // Animation values
  const fillWidth = useRef(new Animated.Value(0)).current;
  const knobScale = useRef(new Animated.Value(1)).current;

  // Sync animation with volume state
  useEffect(() => {
    if (sliderWidth > 0) {
      Animated.timing(fillWidth, {
        toValue: volume * sliderWidth,
        duration: 100,
        useNativeDriver: false,
      }).start();
    }
  }, [volume, sliderWidth]);

  // Handle Plus/Minus
  const handleIncrease = () => changeVolume(volume + 0.05); // +5%
  const handleDecrease = () => changeVolume(volume - 0.05); // -5%

  // PanResponder for drag interaction
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      
      onPanResponderGrant: (evt) => {
        // Animate Knob
        Animated.spring(knobScale, {
          toValue: 1.3,
          useNativeDriver: true,
        }).start();
        
        // Handle immediate tap jump
        handleGesture(evt.nativeEvent.locationX);
      },
      
      onPanResponderMove: (evt, gestureState) => {
        // We need to calculate position relative to the view
        // Ideally we use layout measurements.
        // Simplified: use gestureState.moveX - viewOffset
        // But getting viewOffset is hard without onLayout loop.
        // Easier: rely on evt.nativeEvent.locationX for generic touches,
        // but for dragging out of bounds, we need accumulation.
        
        // Let's use a simplified approach that works well for these sliders:
        // Update based on previous drag + delta? No, volume is absolute.
        
        // Correct approach for simple custom sliders:
        // We assume the user taps/drags on the slider container.
        // Note: evt.nativeEvent.locationX is relative to the TARGET.
        // If target is the knob, it messes up.
        // So we put PanResponder on the Container (Track).
        
        handleGesture(evt.nativeEvent.locationX); // This works if we only tap/drag strictly inside.
        // For better robust dragging, we usually capture the start volume and map dx to volume delta.
      },

      onPanResponderRelease: () => {
        Animated.spring(knobScale, {
          toValue: 1,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  // The helper to calculate volume from X coordinate
  const handleGesture = (x) => {
    if (sliderWidth === 0) return;
    const newVolume = x / sliderWidth;
    changeVolume(newVolume);
  };
  
  // Refined gesture handler using dx for smoother sliding if started on knob?
  // Actually, for this component, putting PanResponder on the track View is best.
  // But nativeEvent.locationX resets if we slide over a child (like the knob).
  // Strategy: Use an overlay transparent View on top of everything to catch gestures.

  return (
    <View style={styles.container}>
      {/* Header / Label (Optional, clean look maybe just icons) */}
      <View style={styles.row}>
        
        {/* Decrease Button */}
        <TouchableOpacity onPress={handleDecrease} style={styles.iconButton}>
          <Ionicons name="remove" size={20} color="#B0B0B0" />
        </TouchableOpacity>

        {/* Slider Container */}
        <View 
          style={styles.sliderContainer}
          onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
        >
          {/* Background Track */}
          <View style={styles.trackBackground} />

          {/* Fill Track */}
          <Animated.View 
            style={[
              styles.trackFill, 
              { width: fillWidth }
            ]} 
          />
          
          {/* Knob */}
          <Animated.View 
            style={[
              styles.knob,
              {
                transform: [
                  { translateX: fillWidth }, // Move knob with fill
                  { scale: knobScale }
                ],
                // Center the knob on the end of the fill
                marginLeft: -8, // Half of knob size (16/2)
              }
            ]}
          />

          {/* Invisible Touch Area Overlay */}
          <View
            style={styles.touchArea}
            {...panResponder.panHandlers}
          />
        </View>

        {/* Increase Button */}
        <TouchableOpacity onPress={handleIncrease} style={styles.iconButton}>
          <Ionicons name="add" size={20} color="#B0B0B0" />
        </TouchableOpacity>

        {/* Percentage Text (Optional Premium Detail) */}
        <Text style={styles.percentageText}>
          {Math.round(volume * 100)}%
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E1E2C', // Dark premium background
    borderRadius: 20,
    padding: 15,
    marginVertical: 10,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8, // Android shadow
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderContainer: {
    flex: 1,
    height: 40, // Touch area height
    justifyContent: 'center',
    marginHorizontal: 15,
    position: 'relative',
  },
  trackBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: '#3A3A4A',
    borderRadius: 3,
  },
  trackFill: {
    position: 'absolute',
    left: 0,
    height: 6,
    backgroundColor: '#E01E5A', // Premium Accent Color (Hot Pink/Red type)
    borderRadius: 3,
  },
  knob: {
    position: 'absolute',
    left: 0, // Animated via translateX
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  touchArea: {
    ...StyleSheet.absoluteFillObject,
    // Transparent overlay to catch touches
  },
  percentageText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    width: 35, // Fixed width to prevent jitter
    textAlign: 'center',
    marginLeft: 5,
  }
});

export default VolumeController;

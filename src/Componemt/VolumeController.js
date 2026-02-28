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


const useSystemVolume = () => {
  const [volume, setVolume] = useState(0);

  useEffect(() => {

    VolumeManager.getVolume().then((result) => {

      const vol = typeof result === 'object' ? result.volume : result;
      setVolume(vol || 0);
    });


    const listener = VolumeManager.addVolumeListener((result) => {
      const vol = typeof result === 'object' ? result.volume : result;
      setVolume(vol || 0);
    });

    return () => {
      if (listener?.remove) listener.remove();
    };
  }, []);

  const changeVolume = async (newVolume) => {

    const clamped = Math.max(0, Math.min(1, newVolume));
    await VolumeManager.setVolume(clamped);
    setVolume(clamped);
  };

  return { volume, changeVolume };
};

const VolumeController = () => {
  const { volume, changeVolume } = useSystemVolume();
  const [sliderWidth, setSliderWidth] = useState(0);


  const fillWidth = useRef(new Animated.Value(0)).current;
  const knobScale = useRef(new Animated.Value(1)).current;


  useEffect(() => {
    if (sliderWidth > 0) {
      Animated.timing(fillWidth, {
        toValue: volume * sliderWidth,
        duration: 100,
        useNativeDriver: false,
      }).start();
    }
  }, [volume, sliderWidth]);


  const handleIncrease = () => changeVolume(volume + 0.05);
  const handleDecrease = () => changeVolume(volume - 0.05);


  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (evt) => {

        Animated.spring(knobScale, {
          toValue: 1.3,
          useNativeDriver: true,
        }).start();


        handleGesture(evt.nativeEvent.locationX);
      },

      onPanResponderMove: (evt, gestureState) => {
        handleGesture(evt.nativeEvent.locationX);
      },

      onPanResponderRelease: () => {
        Animated.spring(knobScale, {
          toValue: 1,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;


  const handleGesture = (x) => {
    if (sliderWidth === 0) return;
    const newVolume = x / sliderWidth;
    changeVolume(newVolume);
  };



  return (
    <View style={styles.container}>

      <View style={styles.row}>


        <TouchableOpacity onPress={handleDecrease} style={styles.iconButton}>
          <Ionicons name="remove" size={20} color="#B0B0B0" />
        </TouchableOpacity>


        <View
          style={styles.sliderContainer}
          onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
        >

          <View style={styles.trackBackground} />


          <Animated.View
            style={[
              styles.trackFill,
              { width: fillWidth }
            ]}
          />


          <Animated.View
            style={[
              styles.knob,
              {
                transform: [
                  { translateX: fillWidth },
                  { scale: knobScale }
                ],
                marginLeft: -8,
              }
            ]}
          />


          <View
            style={styles.touchArea}
            {...panResponder.panHandlers}
          />
        </View>


        <TouchableOpacity onPress={handleIncrease} style={styles.iconButton}>
          <Ionicons name="add" size={20} color="#B0B0B0" />
        </TouchableOpacity>


        <Text style={styles.percentageText}>
          {Math.round(volume * 100)}%
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E1E2C',
    borderRadius: 20,
    padding: 15,
    marginVertical: 10,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
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
    height: 40,
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
    backgroundColor: '#E01E5A',
    borderRadius: 3,
  },
  knob: {
    position: 'absolute',
    left: 0,
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

  },
  percentageText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    width: 35,
    textAlign: 'center',
    marginLeft: 5,
  }
});

export default VolumeController;

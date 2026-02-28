import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar, useColorScheme } from 'react-native';
import MainNavigator from './src/navigation/MainNavigator';
import { MusicProvider } from './src/context/MusicContext';
import messaging from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform, ToastAndroid, Alert, AppState } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './src/services/apiConfig';
import VolumeController from './src/components/VolumeController';

const App = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const navigationRef = useRef<any>(null);

  useEffect(() => {
    const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
      Alert.alert(
        `🔔 ${remoteMessage.notification?.title || 'New Notification'}`,
        remoteMessage.notification?.body || 'You have a new message!',
        [
          { text: 'Later', style: 'cancel' },
          { text: 'Open', onPress: () => navigationRef.current?.navigate('NotificationScreen') }
        ]
      );
    });

    const requestPermission = async () => {
      try {
        if (Platform.OS === 'android') {
          if (Platform.Version >= 33) {
            await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
          }
          const authStatus = await messaging().requestPermission();
          const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL;
          if (enabled) {
            await messaging().subscribeToTopic('all_users');
          }
        }
      } catch (error) {
      }
    };
    requestPermission();

    const unsubscribe = messaging().onNotificationOpenedApp(remoteMessage => {
      if (remoteMessage) {
        navigationRef.current?.navigate('NotificationScreen');
      }
    });

    messaging().getInitialNotification().then(remoteMessage => {
      if (remoteMessage) {
        setTimeout(() => {
          navigationRef.current?.navigate('NotificationScreen');
        }, 1000);
      }
    });

    return () => {
      unsubscribe();
      unsubscribeForeground();
    };
  }, []);

  useEffect(() => {
    const handleAppStateChange = async (nextAppState: string) => {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      if (nextAppState === 'active') {
        try {
          await axios.post(`${BASE_URL}/api/auth/status/online`, {}, {
            headers: { 'x-auth-token': token }
          });
        } catch (e) { }
      } else if (nextAppState.match(/inactive|background/)) {
        try {
          await axios.post(`${BASE_URL}/api/auth/status/offline`, {}, {
            headers: { 'x-auth-token': token }
          });
        } catch (e) { }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Set initial status
    handleAppStateChange('active');

    return () => {
      subscription.remove();
      // Attempt to set offline on unmount (may not always fire on kill)
      handleAppStateChange('background');
    };
  }, []);

  useEffect(() => {
    // Add interceptor to handle session expiration globally
    const interceptor = axios.interceptors.response.use(
      response => response,
      async error => {
        if (error.response && error.response.status === 401) {
          const msg = error.response.data?.msg || '';
          if (msg.includes('Session expired') || msg.includes('other device')) {
            await AsyncStorage.removeItem('token');
            Alert.alert('Session Expired', 'You are logged in on another device. Please login again.', [
              {
                text: 'OK', onPress: () => navigationRef.current?.reset({
                  index: 0,
                  routes: [{ name: 'Auth' }], // Assuming 'Auth' is the stack or Login screen name
                })
              }
            ]);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <MusicProvider>
        <NavigationContainer ref={navigationRef}>
          <MainNavigator />
        </NavigationContainer>
        <VolumeController />
      </MusicProvider>
    </SafeAreaProvider>
  );
};

export default App;

import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar, useColorScheme } from 'react-native';
import MainNavigator from './src/navigation/MainNavigator';
import { MusicProvider } from './src/context/MusicContext';
import messaging from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform, ToastAndroid, Alert } from 'react-native';

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

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <MusicProvider>
        <NavigationContainer ref={navigationRef}>
          <MainNavigator />
        </NavigationContainer>
      </MusicProvider>
    </SafeAreaProvider>
  );
};

export default App;

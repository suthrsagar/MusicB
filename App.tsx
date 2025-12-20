import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar, useColorScheme } from 'react-native';
import MainNavigator from './src/navigation/MainNavigator';
import { MusicProvider } from './src/context/MusicContext';
import messaging from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform, ToastAndroid } from 'react-native';

const App = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const navigationRef = useRef<any>(null);

  useEffect(() => {
    // Handle Foreground Notifications
    const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
      console.log('Foreground message received:', remoteMessage);
      if (Platform.OS === 'android') {
        ToastAndroid.show(
          `🔔 ${remoteMessage.notification?.title || 'New Notification'}`,
          ToastAndroid.LONG
        );
      }
    });

    // Request permission for Android 13+
    const requestPermission = async () => {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      }
    };
    requestPermission();

    // Subscribe to global topic for broadcasts
    messaging()
      .subscribeToTopic('all_users')
      .then(() => console.log('Subscribed to all_users topic!'));

    // Handle Notification Tap (Background -> Foreground)
    const unsubscribe = messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Notification caused app to open from background:', remoteMessage);
      if (remoteMessage) {
        // Navigate to NotificationScreen (or any screen)
        navigationRef.current?.navigate('NotificationScreen');
      }
    });

    // Handle Notification Tap (Quit -> Foreground)
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('Notification caused app to open from quit state:', remoteMessage);
          // We need a small delay to ensure navigator is mounted/ready
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

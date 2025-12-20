// FCMTokenService.js
import messaging from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform, Alert } from 'react-native';

// Function to request notification permission and get FCM token
export const getFCMToken = async () => {
    try {
        // Android 13+ permission
        if (Platform.OS === 'android' && Platform.Version >= 33) {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
            );
            if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                console.log('Notification permission denied');
                return null;
            }
        }

        // Get FCM token
        const fcmToken = await messaging().getToken();
        console.log('🔥 FCM TOKEN:', fcmToken);
        return fcmToken;
    } catch (error) {
        console.log('Error getting FCM token:', error);
        return null;
    }
};

// Optional: Listen for token refresh
export const listenForFCMTokenRefresh = () => {
    messaging().onTokenRefresh(token => {
        console.log('♻️ New FCM Token:', token);
    });
};

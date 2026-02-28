import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import messaging from '@react-native-firebase/messaging';
import { Alert } from 'react-native';

import TabNavigator from './TabNavigator';

import HomeScreen from '../screens/Home/HomeScreen.js';
import PlayerScreen from '../screens/Home/PlayerScreen.js';
import ProfileScreen from '../screens/Settings/ProfileScreen.js';

import SongUploadScreen from '../screens/Settings/SongUploadScreen.js';
import AdminDashboard from '../screens/Admin/AdminDashboard';
import ManageUsersScreen from '../screens/Admin/ManageUsersScreen';
import ManageSongsScreen from '../screens/Admin/ManageSongsScreen';
import NotificationScreen from '../screens/Notifications/NotificationScreen';
import SendNotificationScreen from '../screens/Admin/SendNotificationScreen';
import MonetizationScreen from '../screens/Admin/MonetizationScreen';
import AnalyticsScreen from '../screens/Admin/AnalyticsScreen';

import SplashScreen from '../screens/Auth/SplashScreen';
import SupportChatScreen from '../screens/Settings/SupportChatScreen';
import AdminFeedbackScreen from '../screens/Admin/AdminFeedbackScreen';
import AdminChatScreen from '../screens/Admin/AdminChatScreen';
import Premium from '../screens/premium/Premium';
import PlaylistDetailScreen from '../screens/Playlist/PlaylistDetailScreen';
import SearchScreen from '../screens/Search/SearchScreen';

const Stack = createNativeStackNavigator();

const MainNavigator = () => {

    useEffect(() => {
        const requestUserPermission = async () => {
            try {
                const authStatus = await messaging().requestPermission();
                const enabled =
                    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

                if (enabled) {
                    await messaging().subscribeToTopic('all_users');
                }
            } catch (error) {
            }
        };

        requestUserPermission();

        const unsubscribe = messaging().onMessage(async remoteMessage => {
            Alert.alert(
                `🔔 ${remoteMessage.notification?.title || 'New Notification'}`,
                remoteMessage.notification?.body || 'You have a new message!',
                [
                    { text: 'Later', style: 'cancel' },
                    {
                        text: 'View',
                        onPress: () => {
                        }
                    }
                ]
            );
        });

        messaging().setBackgroundMessageHandler(async remoteMessage => {
        });

        return unsubscribe;
    }, []);


    return (
        <Stack.Navigator
            initialRouteName="SplashScreen"
            screenOptions={{
                headerStyle: {
                    backgroundColor: '#FFFFFF',
                },
                headerTintColor: '#000000',
            }}
        >
            <Stack.Screen
                name="SplashScreen"
                component={SplashScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="LoginProfile"
                component={ProfileScreen}
                options={{ headerShown: false }}
            />

            <Stack.Screen
                name="Tabs"
                component={TabNavigator}
                options={{ headerShown: false }}
            />

            <Stack.Screen
                name="SongUploadScreen"
                component={SongUploadScreen}
                options={{ headerShown: false }}
            />

            <Stack.Screen
                name="HomeScreen"
                component={HomeScreen}
                options={{ headerShown: false }}
            />

            <Stack.Screen
                name="PlayerScreen"
                component={PlayerScreen}
                options={{ headerShown: false }}
            />

            <Stack.Screen
                name="ProfileScreen"
                component={ProfileScreen}
                options={{
                    headerShown: false,
                    title: 'Profile',
                }}
            />

            <Stack.Screen
                name="AdminDashboard"
                component={AdminDashboard}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="ManageUsers"
                component={ManageUsersScreen}
                options={{ title: 'Manage Users' }}
            />
            <Stack.Screen
                name="ManageSongs"
                component={ManageSongsScreen}
                options={{ title: 'Manage Songs' }}
            />

            <Stack.Screen
                name="NotificationScreen"
                component={NotificationScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="SendNotification"
                component={SendNotificationScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="MonetizationScreen"
                component={MonetizationScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="AnalyticsScreen"
                component={AnalyticsScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="SupportChatScreen"
                component={SupportChatScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="AdminFeedbackScreen"
                component={AdminFeedbackScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="AdminChatScreen"
                component={AdminChatScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="Premium"
                component={Premium}
                options={{ headerShown: false }}
            />

            <Stack.Screen
                name="PlaylistDetailScreen"
                component={PlaylistDetailScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="Search"
                component={SearchScreen}
                options={{
                    headerShown: false,
                    presentation: 'transparentModal',
                    animation: 'fade',
                }}
            />
        </Stack.Navigator>
    );
};

export default MainNavigator;

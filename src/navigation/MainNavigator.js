import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

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

const Stack = createNativeStackNavigator();

const MainNavigator = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [initialRoute, setInitialRoute] = useState('LoginProfile');

    useEffect(() => {
        const checkToken = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                if (token) {
                    setInitialRoute('Tabs');
                } else {
                    setInitialRoute('LoginProfile');
                }
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        checkToken();
    }, []);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    return (
        <Stack.Navigator
            initialRouteName={initialRoute}
            screenOptions={{
                headerStyle: {
                    backgroundColor: '#FFFFFF',
                },
                headerTintColor: '#000000',
            }}
        >
            {/* ⭐ Login/Profile Screen (Route for unauthenticated users) */}
            <Stack.Screen
                name="LoginProfile"
                component={ProfileScreen}
                options={{ headerShown: false }}
            />

            {/* ⭐ Main App Tabs */}
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

            {/* ⭐ HomeScreen now in Tabs, but kept here if direct nav needed (though usually not) */}
            <Stack.Screen
                name="HomeScreen"
                component={HomeScreen}
                options={{ headerShown: false }}
            />

            {/* ⭐ PlayerScreen */}
            <Stack.Screen
                name="PlayerScreen"
                component={PlayerScreen}
                options={{ headerShown: false }}
            />

            {/* ⭐ Profile Screen as accessed from Tabs (optional, but TabNavigator usually handles it) */}
            <Stack.Screen
                name="ProfileScreen"
                component={ProfileScreen}
                options={{
                    headerShown: false,
                    title: 'Profile',
                }}
            />

            {/* ⭐ Admin Screens */}
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

            {/* ⭐ Notification Screens */}
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

        </Stack.Navigator>
    );
};

export default MainNavigator;

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import Tab Navigator
import TabNavigator from './TabNavigator';

import HomeScreen from '../screens/Home/HomeScreen.js';
import PlayerScreen from '../screens/Home/PlayerScreen.js';
import ProfileScreen from '../screens/Settings/ProfileScreen.js';

const Stack = createNativeStackNavigator();

const MainNavigator = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: {
                    backgroundColor: '#FFFFFF',
                },
                headerTintColor: '#000000',
            }}
        >

            {/* ⭐ सबसे पहले Tabs होना जरूरी है */}
            <Stack.Screen
                name="Tabs"
                component={TabNavigator}
                options={{ headerShown: false }}
            />

            {/* ⭐ HomeScreen अब Tabs के अंदर है */}
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

            {/* ⭐ Profile Screen */}
            <Stack.Screen
                name="ProfileScreen"
                component={ProfileScreen}
                options={{
                    headerShown: false,
                    title: 'Profile',
                }}
            />

        </Stack.Navigator>
    );
};

export default MainNavigator;

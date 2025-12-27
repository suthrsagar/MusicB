import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import { theme } from '../theme';

import HomeScreen from '../screens/Home/HomeScreen';

import PlaylistScreen from '../screens/Playlist/PlaylistScreen';
import ProfileScreen from '../screens/Settings/ProfileScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';
import Header from '../Componemt/hedder';


import { View } from 'react-native';
import MiniPlayer from '../Componemt/MiniPlayer';
import DownloadScreen from '../screens/Downloads/DownloadScreen';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <Tab.Navigator
                screenOptions={({ route }) => ({
                    tabBarIcon: ({ focused, color, size }) => {
                        let iconName;
                        if (route.name === 'Home') {
                            iconName = focused ? 'home' : 'home-outline';
                        } else if (route.name === 'Playlist') {
                            iconName = focused ? 'musical-notes' : 'musical-notes-outline';
                        } else if (route.name === 'Profile') {
                            iconName = focused ? 'person' : 'person-outline';
                        } else if (route.name === 'Settings') {
                            iconName = focused ? 'settings' : 'settings-outline';
                        } else if (route.name === 'Downloads') {
                            iconName = focused ? 'cloud-download' : 'cloud-download-outline';
                        }

                        return <Icon name={iconName} size={size} color={color} />;
                    },
                    tabBarActiveTintColor: theme.colors.primary,
                    tabBarInactiveTintColor: theme.colors.textSecondary,
                    tabBarShowLabel: false,
                    tabBarStyle: {
                        backgroundColor: theme.colors.surface,
                        borderTopColor: 'transparent',
                        elevation: 0,
                        height: 70,
                        marginBottom: 20,
                        marginHorizontal: 15,
                        borderRadius: 25,
                        position: 'absolute',
                        ...theme.shadows.medium,
                        paddingBottom: 0,
                    },
                    header: () => <Header />,
                    headerShown: true,
                })}
            >
                <Tab.Screen name="Home" component={HomeScreen} />
                <Tab.Screen name="Playlist" component={PlaylistScreen} />
                <Tab.Screen name="Downloads" component={DownloadScreen} />
                <Tab.Screen name="Profile" component={ProfileScreen} />
                <Tab.Screen name="Settings" component={SettingsScreen} />
            </Tab.Navigator>
            <MiniPlayer />
        </View>
    );
};

export default TabNavigator;

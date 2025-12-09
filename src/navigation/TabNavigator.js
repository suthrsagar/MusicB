import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

// Import Screens
import HomeScreen from '../screens/Home/HomeScreen';
import SearchScreen from '../screens/Search/SearchScreen';
import Premium from '../screens/premium/Premium';
import SettingsScreen from '../screens/Settings/SettingsScreen'; // ✅ NEW

// Import Header
import Header from '../Componemt/hedder';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'Home') {
                        iconName = focused ? 'home' : 'home-outline';
                    }
                    else if (route.name === 'Search') {
                        iconName = focused ? 'search' : 'search-outline';
                    }
                    else if (route.name === 'Premium') {
                        iconName = focused ? 'star' : 'star-outline';
                    }
                    else if (route.name === 'Settings') {
                        iconName = focused ? 'settings' : 'settings-outline'; // ✅ Changed Icon
                    }

                    return <Icon name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#000000',
                tabBarInactiveTintColor: '#020202ff',
                tabBarStyle: {
                    backgroundColor: '#ECF4E8',
                    borderTopColor: '#f0f0f0',
                    elevation: 8,
                    height: 70,
                    paddingBottom: 5,
                    paddingTop: 5,
                },
                header: () => <Header />,
                headerShown: true,
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Search" component={SearchScreen} />

            <Tab.Screen
                name="Premium"
                component={Premium}
            // listeners={{
            //     tabPress: (e) => {
            //         e.preventDefault();
            //         Alert.alert("Coming Soon", "Premium features are coming soon!");
            //     },
            // }}
            />

            {/* ✅ Profile Removed — Settings Added */}
            <Tab.Screen name="Settings" component={SettingsScreen} />

        </Tab.Navigator>
    );
};

export default TabNavigator;

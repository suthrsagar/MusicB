import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import Tab Navigator
import TabNavigator from './TabNavigator';

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
            {/* The Tab Navigator is the first screen in the stack */}
            <Stack.Screen
                name="Tabs"
                component={TabNavigator}
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


        </Stack.Navigator>
    );
};

export default MainNavigator;

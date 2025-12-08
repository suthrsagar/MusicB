import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import Tab Navigator
import TabNavigator from './TabNavigator';

// Import Stack Screens
import DetailsScreen from '../screens/DetailsScreen';
import ResultScreen from '../screens/ResultScreen';
import SettingsScreen from '../screens/SettingsScreen';

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

            {/* These screens are pushed on top of the tabs */}
            <Stack.Screen name="Details" component={DetailsScreen} />
            <Stack.Screen name="Result" component={ResultScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
        </Stack.Navigator>
    );
};

export default MainNavigator;

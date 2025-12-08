import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar, useColorScheme } from 'react-native';
import MainNavigator from './src/navigation/MainNavigator';

const App = () => {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <NavigationContainer>
        <MainNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;

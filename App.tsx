import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar, useColorScheme } from 'react-native';
import MainNavigator from './src/navigation/MainNavigator';
import { MusicProvider } from './src/context/MusicContext';

const App = () => {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <MusicProvider>
        <NavigationContainer>
          <MainNavigator />
        </NavigationContainer>
      </MusicProvider>
    </SafeAreaProvider>
  );
};

export default App;

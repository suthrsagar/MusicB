import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsScreen = ({ navigation }) => {

  const handleUploadPress = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        navigation.navigate('SongUploadScreen');
      } else {
        Alert.alert(
          'Login Required',
          'You must be logged in to upload songs.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Login', onPress: () => navigation.navigate('ProfileScreen') }
          ]
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View style={styles.container}>

      <TouchableOpacity
        style={styles.btn}
        onPress={handleUploadPress}
      >
        <Text style={styles.btnText}>Upload Songs</Text>
      </TouchableOpacity>

    </View>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  btn: {
    backgroundColor: '#e2dedeff',
    paddingVertical: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  btnText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '600',
  },
});
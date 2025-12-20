import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { pick, types, isCancel } from '@react-native-documents/picker'; // Corrected import
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

const SongUploadScreen = () => {
  const navigation = useNavigation();

  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [genre, setGenre] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Check for User Token on Mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          Alert.alert(
            'Authentication Error',
            'You need to be logged in to upload songs.',
            [{ text: 'Go to Login', onPress: () => navigation.navigate('ProfileScreen') }]
          );
        }
      } catch (error) {
        console.error('Auth check failed', error);
      }
    };
    checkAuth();
  }, [navigation]);

  // Pick Audio File
  const handlePickDocument = async () => {
    try {
      // Use the named export 'pick' directly
      const result = await pick({
        type: [types.audio],
        allowMultiSelection: false,
      });

      // result is an array
      const pickedFile = result[0];
      setFile(pickedFile);

      // Auto-fill Title from filename if empty
      // Example: "MySong.mp3" -> "MySong"
      if (!title && pickedFile.name) {
        const nameWithoutExt = pickedFile.name.lastIndexOf('.') > 0
          ? pickedFile.name.substring(0, pickedFile.name.lastIndexOf('.'))
          : pickedFile.name;
        setTitle(nameWithoutExt);
      }
    } catch (err) {
      if (isCancel(err)) {
        console.log('User cancelled picker');
      } else {
        Alert.alert('Error', 'Failed to pick file: ' + (err.message || err));
      }
    }
  };

  // Upload Song
  const handleUpload = async () => {
    if (!file) {
      Alert.alert('Validation Error', 'Please pick an audio file.');
      return;
    }
    if (!title || !artist) {
      Alert.alert('Validation Error', 'Song Title and Artist Name are required.');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'User not authenticated. Please login.');
        navigation.navigate('ProfileScreen');
        setLoading(false);
        return;
      }

      const formData = new FormData();
      // Field name must match backend multer config (router.post(..., upload.single('song')))
      formData.append('song', {
        uri: file.uri,
        name: file.name,
        type: file.type || 'audio/mpeg',
      });
      formData.append('title', title);
      formData.append('artist', artist);
      if (album) formData.append('album', album);
      if (genre) formData.append('genre', genre);

      const response = await axios.post('http://10.206.215.196:5000/api/song/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'x-auth-token': token,
        },
      });

      if (response.status === 200 || response.status === 201) {
        Alert.alert('Success', 'Song uploaded successfully!', [
          { text: 'OK', onPress: resetForm }
        ]);
      } else {
        Alert.alert('Error', `Upload failed with status: ${response.status}`);
      }
    } catch (error) {
      console.error('Upload Error:', error);

      if (error.response && (error.response.status === 401 || error.response.data?.msg === 'Token is not valid')) {
        Alert.alert('Session Expired', 'Your session has expired. Please login again.', [
          {
            text: 'OK',
            onPress: async () => {
              await AsyncStorage.removeItem('token');
              navigation.navigate('ProfileScreen');
            }
          }
        ]);
        return;
      }

      const msg = error.response?.data?.msg || error.message || 'Something went wrong';
      Alert.alert('Upload Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setArtist('');
    setAlbum('');
    setGenre('');
    setFile(null);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Upload New Song</Text>

      {/* File Picker Section */}
      <TouchableOpacity style={styles.pickButton} onPress={handlePickDocument}>
        <Text style={styles.buttonText}>
          {file ? `Selected: ${file.name}` : 'Pick Audio File'}
        </Text>
      </TouchableOpacity>

      {/* Form Inputs */}
      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Song Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter Song Title"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Artist Name *</Text>
          <TextInput
            style={styles.input}
            value={artist}
            onChangeText={setArtist}
            placeholder="Enter Artist Name"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Album (Optional)</Text>
          <TextInput
            style={styles.input}
            value={album}
            onChangeText={setAlbum}
            placeholder="Enter Album Name"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Genre (Optional)</Text>
          <TextInput
            style={styles.input}
            value={genre}
            onChangeText={setGenre}
            placeholder="Enter Genre"
            placeholderTextColor="#999"
          />
        </View>
      </View>

      {/* Upload Button */}
      {loading ? (
        <ActivityIndicator size="large" color="#007bff" style={styles.loader} />
      ) : (
        <TouchableOpacity
          style={[
            styles.uploadButton,
            (!file || !title || !artist) && styles.disabledButton,
          ]}
          onPress={handleUpload}
          disabled={!file || !title || !artist}
        >
          <Text style={styles.buttonText}>Upload Song</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flexGrow: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  pickButton: {
    backgroundColor: '#28a745',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 25,
    elevation: 3, // Shadow for Android
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  uploadButton: {
    backgroundColor: '#007bff',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  disabledButton: {
    backgroundColor: '#a0a0a0',
    elevation: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  formContainer: {
    marginBottom: 10,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    color: '#555',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  loader: {
    marginTop: 20,
  },
});

export default SongUploadScreen;

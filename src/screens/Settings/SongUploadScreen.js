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
  StatusBar
} from 'react-native';
import { pick, types, isCancel } from '@react-native-documents/picker';
import { launchImageLibrary } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../../theme';
import { BASE_URL } from '../../services/apiConfig';

const SongUploadScreen = () => {
  const navigation = useNavigation();

  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');

  const [file, setFile] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          setIsLoggedIn(false);
          Alert.alert(
            'Authentication Required',
            'Please login to upload your songs and share them with the world!',
            [{ text: 'Go to Login', onPress: () => navigation.navigate('Profile') }]
          );
        } else {
          setIsLoggedIn(true);
        }
      } catch (error) {
        setIsLoggedIn(false);
      }
    };
    checkAuth();
  }, [navigation]);

  const handlePickDocument = async () => {
    try {
      const result = await pick({
        type: [types.audio],
        allowMultiSelection: false,
      });

      const pickedFile = result[0];
      setFile(pickedFile);

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

  const handlePickCover = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, res => {
      if (res.didCancel) return;
      if (res.assets?.length) {
        setCoverImage(res.assets[0]);
      }
    });
  };

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
        navigation.navigate('Profile');
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('song', {
        uri: file.uri,
        name: file.name,
        type: file.type || 'audio/mpeg',
      });
      if (coverImage) {
        formData.append('coverImage', {
          uri: coverImage.uri,
          type: coverImage.type || 'image/jpeg',
          name: coverImage.fileName || 'cover.jpg'
        });
      }

      formData.append('title', title);
      formData.append('artist', artist);
      if (album) formData.append('album', album);

      const response = await axios.post(`${BASE_URL}/api/song/upload`, formData, {
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
    setFile(null);
    setCoverImage(null);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Content</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Song Information</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Enter Song Name *</Text>
          <TextInput
            style={[styles.input, !isLoggedIn && { opacity: 0.5 }]}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Summer Vibes"
            placeholderTextColor={theme.colors.textSecondary}
            editable={isLoggedIn}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Artist Name *</Text>
          <TextInput
            style={[styles.input, !isLoggedIn && { opacity: 0.5 }]}
            value={artist}
            onChangeText={setArtist}
            placeholder="e.g. John Doe"
            placeholderTextColor={theme.colors.textSecondary}
            editable={isLoggedIn}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
            <Text style={styles.label}>Album (Opt)</Text>
            <TextInput
              style={[styles.input, !isLoggedIn && { opacity: 0.5 }]}
              value={album}
              onChangeText={setAlbum}
              placeholder="e.g. Hits"
              placeholderTextColor={theme.colors.textSecondary}
              editable={isLoggedIn}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Song Cover (Optional)</Text>
        <TouchableOpacity
          style={[styles.pickButton, !isLoggedIn && styles.disabledButton]}
          onPress={handlePickCover}
          disabled={!isLoggedIn}
        >
          <Ionicons name={coverImage ? "image" : "image-outline"} size={24} color={coverImage ? theme.colors.success : isLoggedIn ? theme.colors.primary : theme.colors.textSecondary} />
          <Text style={[styles.pickButtonText, coverImage && { color: theme.colors.success }, !isLoggedIn && { color: theme.colors.textSecondary }]}>
            {coverImage ? 'Cover Selected' : 'Choose Cover Image'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Audio File</Text>
        <TouchableOpacity
          style={[styles.pickButton, !isLoggedIn && styles.disabledButton]}
          onPress={handlePickDocument}
          disabled={!isLoggedIn}
        >
          <Ionicons name={file ? "checkmark-circle" : "musical-note"} size={24} color={file ? theme.colors.success : isLoggedIn ? theme.colors.primary : theme.colors.textSecondary} />
          <Text style={[styles.pickButtonText, file && { color: theme.colors.success }, !isLoggedIn && { color: theme.colors.textSecondary }]}>
            {file ? file.name : 'Choose Audio File'}
          </Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 20 }} />
        ) : (
          <TouchableOpacity
            style={[
              styles.uploadButton,
              (!file || !title || !artist || !isLoggedIn) && styles.disabledButton,
            ]}
            onPress={handleUpload}
            disabled={!file || !title || !artist || !isLoggedIn}
          >
            <Text style={styles.uploadButtonText}>Upload Song</Text>
          </TouchableOpacity>
        )}

        {!isLoggedIn && (
          <TouchableOpacity
            style={[styles.uploadButton, { marginTop: 15, backgroundColor: theme.colors.secondary }]}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.uploadButtonText}>Sign In to Upload</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

export default SongUploadScreen;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flexGrow: 1,
    backgroundColor: theme.colors.background,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    ...theme.typography.header,
    fontSize: 24,
    color: theme.colors.text,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.layout.borderRadius,
    padding: 20,
    ...theme.shadows.medium,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 15,
    marginTop: 10,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: theme.colors.textSecondary,
  },
  input: {
    backgroundColor: theme.colors.inputBackground,
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  row: {
    flexDirection: 'row',
  },
  pickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
    marginBottom: 20,
    backgroundColor: '#F4F7FE',
  },
  pickButtonText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  uploadButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    ...theme.shadows.medium,
  },
  disabledButton: {
    backgroundColor: theme.colors.textSecondary,
    opacity: 0.5,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

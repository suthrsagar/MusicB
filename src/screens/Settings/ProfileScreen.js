import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { launchImageLibrary } from 'react-native-image-picker';

const BASE_URL = 'http://10.203.126.196:5000';
const API_URL = `${BASE_URL}/api`;

const ProfileScreen = ({ navigation }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [imageUri, setImageUri] = useState(null);

  const [profile, setProfile] = useState(null);

  const api = axios.create({ baseURL: API_URL });

  // 🔐 Attach token to every request
  api.interceptors.request.use(async config => {
    const token = await AsyncStorage.getItem('token');
    if (token) config.headers['x-auth-token'] = token;
    return config;
  });

  // 🔁 Check login on mount
  useEffect(() => {
    const init = async () => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        setIsLoggedIn(true);
        await fetchProfile();
      }
      setLoading(false);
    };
    init();
  }, []);

  // 📸 Permission
  const requestPermission = async () => {
    if (Platform.OS === 'android') {
      const permission =
        Platform.Version >= 33
          ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
          : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
      const granted = await PermissionsAndroid.request(permission);
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  // 📷 Pick image
  const pickImage = async () => {
    const ok = await requestPermission();
    if (!ok) {
      Alert.alert('Permission denied');
      return;
    }

    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, res => {
      if (res.assets?.length) {
        setImageUri(res.assets[0].uri);
      }
    });
  };

  // 📝 Register (with image)
  const handleRegister = async () => {
    if (!username || !email || !password || !imageUri) {
      Alert.alert('All fields & profile photo required');
      return;
    }

    setBtnLoading(true);
    try {
      // Register user
      await api.post('/register', { username, email, password });

      // Login immediately
      const loginRes = await api.post('/login', { email, password });
      await AsyncStorage.setItem('token', loginRes.data.token);

      // Upload profile photo
      const formData = new FormData();
      formData.append('avatar', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'avatar.jpg',
      });

      await api.post('/profile/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setIsLoggedIn(true);
      await fetchProfile();
      resetForm();
      Alert.alert('Success', 'Account created and photo uploaded');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.msg || 'Registration failed');
    } finally {
      setBtnLoading(false);
    }
  };

  // 🔐 Login
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Email & password required');
      return;
    }

    setBtnLoading(true);
    try {
      const res = await api.post('/login', { email, password });
      await AsyncStorage.setItem('token', res.data.token);
      setIsLoggedIn(true);
      await fetchProfile();
    } catch {
      Alert.alert('Login failed');
    } finally {
      setBtnLoading(false);
    }
  };

  // 👤 Fetch profile
  const fetchProfile = async () => {
    try {
      const res = await api.get('/profile'); // logged-in user only
      setProfile(res.data);
    } catch {
      Alert.alert('Profile load failed');
    }
  };

  // 🚪 Logout
  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    setIsLoggedIn(false);
    setProfile(null);
    resetForm();
  };

  const resetForm = () => {
    setUsername('');
    setEmail('');
    setPassword('');
    setImageUri(null);
  };

  // ⏳ Loader
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // 🔐 Login/Register UI
  if (!isLoggedIn) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>
          {isRegister ? 'Create Account' : 'Login'}
        </Text>

        {isRegister && (
          <>
            <TextInput
              style={styles.input}
              placeholder="Username"
              value={username}
              onChangeText={setUsername}
            />

            <TouchableOpacity style={styles.imageBox} onPress={pickImage}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.avatar} />
              ) : (
                <Text>Select Profile Photo *</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={isRegister ? handleRegister : handleLogin}
        >
          {btnLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>
              {isRegister ? 'Sign Up' : 'Login'}
            </Text>
          )}
        </TouchableOpacity>

        <Text style={styles.link} onPress={() => setIsRegister(!isRegister)}>
          {isRegister
            ? 'Already have account? Login'
            : 'Create new account'}
        </Text>
      </ScrollView>
    );
  }

  // 🏠 Your Profile (logged-in user)
  const getAvatarUrl = () => {
    if (!profile || !profile.avatar || profile.avatar === '') return null;
    return profile.avatar.startsWith('http')
      ? profile.avatar
      : `${BASE_URL}/${profile.avatar}`;
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Your Profile</Text>

      {profile && (
        <View style={styles.card}>
          <Image
            source={
              getAvatarUrl()
                ? { uri: getAvatarUrl() }
                : require('../../assest/image/logo.png')
            }
            style={styles.avatar}
          />
          <Text style={styles.info}>Username: {profile.username}</Text>
          <Text style={styles.info}>Email: {profile.email}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#ef4444' }]}
        onPress={handleLogout}
      >
        <Text style={styles.btnText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 26, fontWeight: '700', textAlign: 'center', marginBottom: 20 },
  input: { borderWidth: 1, borderRadius: 10, padding: 14, marginBottom: 15 },
  button: { backgroundColor: '#4f46e5', padding: 15, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '600' },
  link: { textAlign: 'center', marginTop: 15, color: '#2563eb' },
  card: { alignItems: 'center', marginBottom: 20 },
  info: { fontSize: 16, marginTop: 5 },
  imageBox: {
    height: 150,
    width: 150,
    borderRadius: 75,
    backgroundColor: '#e5e7eb',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatar: { width: 150, height: 150, borderRadius: 75 },
});

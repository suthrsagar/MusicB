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
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { launchImageLibrary } from 'react-native-image-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../../theme';

const BASE_URL = 'http://10.206.215.196:5000';
const API_URL = `${BASE_URL}/api`;

const ProfileScreen = ({ navigation }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);

  // Auth Form State
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [imageUri, setImageUri] = useState(null);

  // Profile Data
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

  // 📷 Pick image (For Registration)
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

  // 📝 Register
  const handleRegister = async () => {
    if (!username || !email || !password || !imageUri) {
      Alert.alert('All fields & profile photo required');
      return;
    }
    setBtnLoading(true);
    try {
      await api.post('/register', { username, email, password });
      const loginRes = await api.post('/login', { email, password });
      await AsyncStorage.setItem('token', loginRes.data.token);

      const formData = new FormData();
      formData.append('avatar', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'avatar.jpg',
      });
      await api.post('/profile/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data', 'x-auth-token': loginRes.data.token },
      });

      Alert.alert('Success', 'Account created!');
      setIsLoggedIn(true);
      await fetchProfile();
      navigation.replace('Tabs');
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
      navigation.replace('Tabs');
    } catch (err) {
      Alert.alert('Failed', err.response?.data?.msg || 'Login failed');
    } finally {
      setBtnLoading(false);
    }
  };

  // 👤 Fetch
  const fetchProfile = async () => {
    try {
      const res = await api.get('/profile');
      setProfile(res.data);
    } catch {
      Alert.alert('Error', 'Could not load profile');
    }
  };

  //  Logout
  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    setIsLoggedIn(false);
    setProfile(null);
    setUsername(''); setEmail(''); setPassword(''); setImageUri(null);
    navigation.reset({ index: 0, routes: [{ name: 'LoginProfile' }] });
  };

  const getAvatarUrl = () => {
    if (!profile || !profile.avatar) return null;
    return profile.avatar.startsWith('http') ? profile.avatar : `${BASE_URL}/${profile.avatar}`;
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // --- LOGIN / REGISTER VIEW ---
  if (!isLoggedIn) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>
          {isRegister ? 'Create Account' : 'Login'}
        </Text>

        {isRegister && (
          <>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color={theme.colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor={theme.colors.textSecondary}
                value={username}
                onChangeText={setUsername}
              />
            </View>

            <TouchableOpacity style={styles.imageBox} onPress={pickImage}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.avatar} />
              ) : (
                <View style={{ alignItems: 'center' }}>
                  <Ionicons name="camera-outline" size={30} color={theme.colors.textSecondary} />
                  <Text style={{ color: theme.colors.textSecondary }}>Select Profile Photo *</Text>
                </View>
              )}
            </TouchableOpacity>
          </>
        )}

        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color={theme.colors.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={theme.colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color={theme.colors.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={theme.colors.textSecondary}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={isRegister ? handleRegister : handleLogin}
          disabled={btnLoading}
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

  // --- PROFILE VIEW (DISPLAY ONLY) ---
  if (isLoggedIn && !profile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.profileContainer}>
      <View style={styles.bgDecorCircle} />

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <Image source={getAvatarUrl() ? { uri: getAvatarUrl() } : require('../../assest/image/logo.png')} style={styles.profileImage} />
        </View>

        <Text style={styles.profileName}>{profile?.username || 'User'}</Text>
        <Text style={styles.profileEmail}>{profile?.email || 'No Email'}</Text>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <View style={styles.iconCircle}><Ionicons name="person" size={18} color={theme.colors.primary} /></View>
          <View>
            <Text style={styles.infoLabel}>Username</Text>
            <Text style={styles.infoValue}>{profile?.username || 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.iconCircle}><Ionicons name="mail" size={18} color={theme.colors.primary} /></View>
          <View>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{profile?.email || 'N/A'}</Text>
          </View>
        </View>
      </View>

      {/* Library Buttons */}
      <View style={{ width: '85%', marginBottom: 20 }}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => Alert.alert('Coming Soon', 'Playlists feature is under development!')}
        >
          <View style={[styles.menuIconBox, { backgroundColor: '#E8EAF6' }]}>
            <Ionicons name="list" size={22} color={theme.colors.primary} />
          </View>
          <Text style={styles.menuText}>My Playlists</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, { marginTop: 10 }]}
          onPress={() => Alert.alert('Coming Soon', 'Liked Songs feature is under development!')}
        >
          <View style={[styles.menuIconBox, { backgroundColor: '#FFEBEE' }]}>
            <Ionicons name="heart" size={22} color={theme.colors.error} />
          </View>
          <Text style={styles.menuText}>Liked Songs</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Admin Button */}
      {profile?.role === 'admin' && (
        <TouchableOpacity style={styles.adminBtn} onPress={() => navigation.navigate('AdminDashboard')}>
          <Ionicons name="shield-checkmark" size={20} color="#FF8F00" style={{ marginRight: 10 }} />
          <Text style={styles.adminBtnText}>Admin Panel</Text>
        </TouchableOpacity>
      )}



      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={22} color={theme.colors.error} style={{ marginRight: 10 }} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <Text style={styles.versionText}>App Version 1.0.0</Text>
    </ScrollView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: theme.colors.background },
  center: { flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' },

  // Auth Styles
  title: { fontSize: 28, fontWeight: '800', textAlign: 'center', marginBottom: 30, color: theme.colors.text },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: 12, paddingHorizontal: 15, marginBottom: 15, height: 55, ...theme.shadows.soft },
  input: { flex: 1, marginLeft: 10, color: theme.colors.text, fontSize: 16 },
  button: { backgroundColor: theme.colors.primary, padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 10, ...theme.shadows.medium },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  link: { textAlign: 'center', marginTop: 20, color: theme.colors.primary, fontWeight: '600' },
  imageBox: { height: 150, width: 150, borderRadius: 75, backgroundColor: theme.colors.surface, alignSelf: 'center', justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 2, borderColor: theme.colors.border, borderStyle: 'dashed' },
  avatar: { width: 140, height: 140, borderRadius: 70 },

  // Profile Specific Styles
  profileContainer: { flexGrow: 1, backgroundColor: theme.colors.background, alignItems: 'center', paddingVertical: 40 },
  bgDecorCircle: { position: 'absolute', top: -150, width: 400, height: 400, borderRadius: 200, backgroundColor: 'rgba(67, 24, 255, 0.05)', alignSelf: 'center' },
  profileCard: { width: '85%', backgroundColor: theme.colors.surface, borderRadius: 24, padding: 25, alignItems: 'center', marginBottom: 20, ...theme.shadows.medium },
  avatarContainer: { marginBottom: 15, position: 'relative' },
  profileImage: { width: 110, height: 110, borderRadius: 55, borderWidth: 4, borderColor: theme.colors.surface },
  profileName: { fontSize: 24, fontWeight: '800', color: theme.colors.text, marginBottom: 5 },
  profileEmail: { fontSize: 16, color: theme.colors.textSecondary, marginBottom: 20, fontWeight: '500' },
  divider: { width: '100%', height: 1, backgroundColor: theme.colors.border, marginBottom: 20 },

  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, width: '100%' },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F4F7FE', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  infoLabel: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: '600', textTransform: 'uppercase' },
  infoValue: { fontSize: 16, color: theme.colors.text, fontWeight: '500' },

  adminBtn: { flexDirection: 'row', width: '85%', backgroundColor: '#FFF8E1', paddingVertical: 15, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 15, borderColor: '#FFC107', borderWidth: 1 },
  adminBtnText: { color: '#FF8F00', fontWeight: 'bold', fontSize: 16 },
  logoutBtn: { flexDirection: 'row', width: '85%', backgroundColor: theme.colors.surface, paddingVertical: 15, borderRadius: 16, justifyContent: 'center', alignItems: 'center', ...theme.shadows.soft, borderWidth: 1, borderColor: '#FEE2E2' },
  logoutText: { color: theme.colors.error, fontWeight: 'bold', fontSize: 16 },
  versionText: { marginTop: 30, color: theme.colors.textSecondary, fontSize: 12 },

  // Menu Styles
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, padding: 15, borderRadius: 16, ...theme.shadows.soft, justifyContent: 'space-between' },
  menuIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuText: { fontSize: 16, color: theme.colors.text, fontWeight: '600', flex: 1 },

  // About Styles
  aboutCard: { width: '85%', backgroundColor: theme.colors.surface, borderRadius: 24, padding: 20, marginBottom: 20, ...theme.shadows.soft },
  aboutTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.textSecondary, marginBottom: 15, textTransform: 'uppercase' },
  aboutContent: { flexDirection: 'row', alignItems: 'center' },
  aboutImage: { width: 60, height: 60, borderRadius: 30, backgroundColor: theme.colors.background },
  aboutName: { fontSize: 18, fontWeight: 'bold', color: theme.colors.text },
  aboutRole: { fontSize: 14, color: theme.colors.textSecondary, marginBottom: 2 },
  aboutInsta: { fontSize: 14, color: theme.colors.primary, fontWeight: '600' },
});

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
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { launchImageLibrary } from 'react-native-image-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../../theme';

import { BASE_URL } from '../../services/apiConfig';
const API_URL = `${BASE_URL}/api/`;

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

  api.interceptors.request.use(async config => {
    const token = await AsyncStorage.getItem('token');
    if (token) config.headers['x-auth-token'] = token;
    return config;
  });

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

  const handleRegister = async () => {
    if (!username || !email || !password || !imageUri) {
      Alert.alert('All fields & profile photo required');
      return;
    }
    setBtnLoading(true);
    try {
      await api.post('register', { username, email, password });
      const loginRes = await api.post('login', { email, password });
      await AsyncStorage.setItem('token', loginRes.data.token);

      const formData = new FormData();
      formData.append('avatar', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'avatar.jpg',
      });
      await api.post('profile/photo', formData, {
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

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Email & password required');
      return;
    }
    setBtnLoading(true);
    try {
      const res = await api.post('login', { email, password });
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

  const fetchProfile = async () => {
    try {
      const res = await api.get('profile');
      setProfile(res.data);
    } catch (err) {
      console.error('Fetch Profile Error:', err);
      if (err.response?.status === 401 || err.response?.status === 404) {
        handleLogout();
      } else {
        Alert.alert('Error', 'Could not load profile. Please check your connection.');
      }
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    setIsLoggedIn(false);
    setProfile(null);
    setUsername(''); setEmail(''); setPassword(''); setImageUri(null);
    navigation.reset({ index: 0, routes: [{ name: 'LoginProfile' }] });
  };

  const getAvatarUrl = () => {
    if (!profile || !profile.avatar) return null;

    if (profile.avatar.startsWith('http')) {
      return `${profile.avatar}${profile.avatar.includes('?') ? '&' : '?'}t=${new Date().getTime()}`;
    }

    if (profile.avatar.includes('avatar-')) {
      return `${BASE_URL}/api/avatar/${profile.avatar}?t=${new Date().getTime()}`;
    }

    const cleanPath = profile.avatar.startsWith('/') ? profile.avatar : `/${profile.avatar}`;
    return `${BASE_URL}${cleanPath}?t=${new Date().getTime()}`;
  };

  const handleUpdateProfilePhoto = async () => {
    const ok = await requestPermission();
    if (!ok) {
      Alert.alert('Permission denied');
      return;
    }

    launchImageLibrary({ mediaType: 'photo', quality: 0.7 }, async res => {
      if (res.didCancel) return;
      if (res.assets?.length) {
        const selectedImage = res.assets[0];
        setBtnLoading(true);

        try {
          const formData = new FormData();
          formData.append('avatar', {
            uri: selectedImage.uri,
            type: selectedImage.type || 'image/jpeg',
            name: selectedImage.fileName || 'profile.jpg',
          });

          const response = await api.post('profile/photo', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

          if (response.data && response.data.avatar) {
            setProfile(prev => ({ ...prev, avatar: response.data.avatar }));
            Alert.alert('Success', 'Profile photo updated successfully!');
          }
        } catch (err) {
          console.error('Upload Error:', err.response?.data || err.message);
          Alert.alert('Error', err.response?.data?.msg || 'Could not upload photo');
        } finally {
          setBtnLoading(false);
        }
      }
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!isLoggedIn) {
    return (
      <View style={styles.authWrapper}>
        <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

        <View style={styles.topGradient} />
        <View style={styles.blurCircle1} />
        <View style={styles.blurCircle2} />

        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.authHeader}>
            <View style={styles.logoCircle}>
              <Ionicons name="musical-notes" size={50} color="#fff" />
            </View>
            <Text style={styles.welcomeTitle}>Welcome to MusicZ</Text>
            <Text style={styles.subSubtitle}>
              {isRegister
                ? "Join the community and start your musical journey today."
                : "Your personal music universe is just one login away."}
            </Text>
          </View>

          <View style={styles.authCard}>
            <Text style={styles.formTitle}>
              {isRegister ? 'Create Account' : 'Sign In'}
            </Text>

            {isRegister && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Username</Text>
                  <View style={styles.inputField}>
                    <Ionicons name="person-outline" size={20} color={theme.colors.textSecondary} />
                    <TextInput
                      style={styles.field}
                      placeholder="Name "
                      placeholderTextColor="#999"
                      value={username}
                      onChangeText={setUsername}
                    />
                  </View>
                </View>

                <View style={[styles.inputGroup, { alignItems: 'center', marginVertical: 10 }]}>
                  <TouchableOpacity style={styles.premiumImageBox} onPress={pickImage}>
                    {imageUri ? (
                      <Image source={{ uri: imageUri }} style={styles.premiumAvatar} />
                    ) : (
                      <View style={{ alignItems: 'center' }}>
                        <Ionicons name="camera" size={32} color={theme.colors.primary} />
                        <Text style={styles.photoHint}>Profile Photo</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={styles.inputField}>
                <Ionicons name="mail-outline" size={20} color={theme.colors.textSecondary} />
                <TextInput
                  style={styles.field}
                  placeholder="Enter email"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputField}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.colors.textSecondary} />
                <TextInput
                  style={styles.field}
                  placeholder="Enter password"
                  placeholderTextColor="#999"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, btnLoading && { opacity: 0.8 }]}
              onPress={isRegister ? handleRegister : handleLogin}
              disabled={btnLoading}
            >
              {btnLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.primaryBtnText}>
                    {isRegister ? 'Sign Up' : 'Continue'}
                  </Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 10 }} />
                </>
              )}
            </TouchableOpacity>

            <View style={styles.footerLinks}>
              <Text style={styles.footerText}>
                {isRegister ? "Already have an account? " : "Don't have an account? "}
              </Text>
              <TouchableOpacity onPress={() => setIsRegister(!isRegister)}>
                <Text style={styles.footerLinkText}>
                  {isRegister ? 'Log In' : 'Join Now'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: 30, alignItems: 'center' }}>
              <Text style={styles.termsText}>
                By continuing, you agree to MusicZ's
              </Text>
              <Text style={[styles.termsText, { fontWeight: '700', textDecorationLine: 'underline' }]}>
                Terms of Service & Privacy Policy
              </Text>
            </View>
          </View>

          {/* Feature Highlight */}
          <View style={styles.featureRow}>
            <View style={styles.featItem}>
              <Ionicons name="flash" size={16} color={theme.colors.primary} />
              <Text style={styles.featText}>Ad-free</Text>
            </View>
            <View style={styles.featDivider} />
            <View style={styles.featItem}>
              <Ionicons name="headset" size={16} color={theme.colors.primary} />
              <Text style={styles.featText}>HD Audio</Text>
            </View>
            <View style={styles.featDivider} />
            <View style={styles.featItem}>
              <Ionicons name="cloud-download" size={16} color={theme.colors.primary} />
              <Text style={styles.featText}>Offline</Text>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    );
  }

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

      <View style={styles.profileCard}>
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={handleUpdateProfilePhoto}
          activeOpacity={0.8}
        >
          <Image
            key={profile?.avatar}
            source={getAvatarUrl() ? { uri: getAvatarUrl() } : require('../../assest/image/logo.png')}
            style={styles.profileImage}
          />
          <View style={styles.editBadge}>
            <Ionicons name="camera" size={16} color="#fff" />
          </View>
        </TouchableOpacity>

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

  // --- PREMIUM AUTH STYLES (LIGHT) ---
  authWrapper: {
    flex: 1,
    backgroundColor: '#F7F9FC', // Light blueish gray
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 450,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
    ...theme.shadows.soft,
  },
  blurCircle1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: theme.colors.primary,
    opacity: 0.05,
  },
  blurCircle2: {
    position: 'absolute',
    bottom: 150,
    left: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.secondary,
    opacity: 0.1,
  },
  scrollContainer: {
    paddingHorizontal: 25,
    paddingTop: Platform.OS === 'ios' ? 60 : 70,
    paddingBottom: 40,
  },
  authHeader: {
    alignItems: 'center',
    marginBottom: 35,
  },
  logoCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  welcomeTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subSubtitle: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 30,
  },
  authCard: {
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 25,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    borderWidth: 1,
    borderColor: '#F0F3F9',
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 25,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
    opacity: 0.6,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F9FC',
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 56,
    borderWidth: 1,
    borderColor: '#E8EDF5',
  },
  field: {
    flex: 1,
    marginLeft: 12,
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  primaryBtn: {
    backgroundColor: theme.colors.primary,
    height: 58,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    elevation: 6,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
  },
  footerText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  footerLinkText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  featItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: 6,
    fontWeight: '700',
  },
  featDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D9E6',
    marginHorizontal: 15,
  },
  premiumImageBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F7F9FC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
  },
  premiumAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  photoHint: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginTop: 4,
    fontWeight: '800',
  },
  termsText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    textAlign: 'center',
  },

  // Auth Styles (Old - Deprecated but kept for safety if needed internally)
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
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
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

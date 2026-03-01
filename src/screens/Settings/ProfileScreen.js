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
  Modal,
} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { launchImageLibrary } from 'react-native-image-picker';
import { useMusic } from '../../context/MusicContext';
import PremiumLoader from '../../components/PremiumLoader';
import CustomAlert from '../../components/CustomAlert';

import { BASE_URL } from '../../services/apiConfig';
const API_URL = `${BASE_URL}/api/`;

const ProfileScreen = ({ navigation }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRegister, setIsRegister] = useState(true);
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [error, setError] = useState('');


  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [profile, setProfile] = useState(null);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null,
    cancelable: false
  });

  const showAlert = (title, message, type = 'info', onConfirm = null, cancelable = false) => {
    setAlertConfig({ visible: true, title, message, type, onConfirm, cancelable });
  };

  const { closePlayer } = useMusic();

  const api = axios.create({ baseURL: API_URL });

  api.interceptors.request.use(async config => {
    const token = await AsyncStorage.getItem('token');
    if (token) config.headers['x-auth-token'] = token;
    return config;
  });

  useEffect(() => {
    const init = async () => {
      const token = await AsyncStorage.getItem('token');
      const cached = await AsyncStorage.getItem('cachedProfile');

      if (cached) {
        setProfile(JSON.parse(cached));
        setIsLoggedIn(true);
      }

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
      showAlert('Permission Denied', 'Please grant storage permissions to pick an image.', 'error');
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
      showAlert('Required Fields', 'All fields and a profile photo are mandatory for registration.', 'warning');
      return;
    }
    setBtnLoading(true);
    try {
      await api.post('register', { username, email, password });
      const loginRes = await api.post('login', { email, password });
      await AsyncStorage.setItem('token', loginRes.data.token);

      if (imageUri) {
        const formData = new FormData();
        formData.append('avatar', {
          uri: imageUri,
          type: 'image/jpeg',
          name: 'avatar.jpg',
        });
        await api.post('profile/photo', formData, {
          headers: { 'Content-Type': 'multipart/form-data', 'x-auth-token': loginRes.data.token },
        });
      }

      showAlert('Success', 'Account created! Welcome to MusicZ.', 'success');
      navigation.replace('Tabs');
    } catch (err) {
      setError(err.response?.data?.msg || 'Registration failed');

    } finally {
      setBtnLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showAlert('Required Fields', 'Email and password are required to login.', 'warning');
      return;
    }
    setBtnLoading(true);
    try {
      const res = await api.post('login', { email, password });
      await AsyncStorage.setItem('token', res.data.token);
      navigation.replace('Tabs');
    } catch (err) {
      setError(err.response?.data?.msg || 'Login failed');

    } finally {
      setBtnLoading(false);
    }
  };

  const fetchProfile = async (explicitToken) => {
    try {
      const res = await api.get('profile');
      setProfile(res.data);
      await AsyncStorage.setItem('cachedProfile', JSON.stringify(res.data));


      try {
        if (res.data.role === 'admin') {
          await messaging().subscribeToTopic('admin_notifications');
        } else {
          try {
            await messaging().unsubscribeFromTopic('admin_notifications');
          } catch (e) { }
        }
      } catch (e) { console.log('Topic Sub Error', e); }

    } catch (err) {
      console.error('Fetch Profile Error:', err);
      // Offline check - don't logout if it's just a network error
      if (err.response) {
        if (err.response.status === 401 || err.response.status === 404) {
          handleLogout();
        } else {
          showAlert('Sync Error', 'Could not sync profile with server. Showing cached data.', 'error');
        }
      } else {
        // No response means network error / offline
        console.log('App appears to be offline, using cached profile');
      }
    }
  };

  const handleLogout = async () => {
    showAlert(
      'Logout',
      'Are you sure you want to logout?',
      'warning',
      async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('cachedProfile');
        setIsLoggedIn(false);
        setProfile(null);
        setUsername(''); setEmail(''); setPassword(''); setImageUri(null);
        try {
          closePlayer();
          await messaging().unsubscribeFromTopic('admin_notifications');
        } catch (e) { }
        navigation.reset({ index: 0, routes: [{ name: 'LoginProfile' }] });
      },
      true
    );
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
      showAlert('Permission Denied', 'Storage permission is required to update photo.', 'error');
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
            showAlert('Success', 'Profile photo updated successfully!', 'success');
          }
        } catch (err) {
          console.error('Upload Error:', err.response?.data || err.message);
          showAlert('Upload Failed', err.response?.data?.msg || 'Could not upload photo', 'error');
        } finally {
          setBtnLoading(false);
        }
      }
    });
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      showAlert('Error', 'Please fill all fields', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlert('Error', 'New passwords do not match', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showAlert('Error', 'Password must be at least 6 characters', 'error');
      return;
    }

    setBtnLoading(true);
    try {
      await api.post('change-password', { oldPassword, newPassword });
      showAlert('Success', 'Password updated successfully', 'success');
      setShowPasswordModal(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showAlert('Error', err.response?.data?.msg || 'Failed to update password', 'error');
    } finally {
      setBtnLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <PremiumLoader size={60} />
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
          style={{ backgroundColor: theme.colors.background }}
        >
          <View style={styles.authHeader}>
            <View style={styles.logoCircle}>
              <Ionicons name="musical-notes" size={50} color="#fff" />
            </View>
            <Text style={[styles.welcomeTitle, { color: '#fff' }]}>Welcome to MusicZ</Text>
            <Text style={styles.subSubtitle}>
              {isRegister
                ? "Join the community and start your musical journey today."
                : "Your personal music universe is just one login away."}
            </Text>
          </View>

          <View style={[styles.authCard, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }]}>
            <Text style={[styles.formTitle, { color: '#fff' }]}>
              {isRegister ? 'Create Account' : 'Login'}
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
                  onChangeText={(t) => { setEmail(t); setError(''); }}
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
                  onChangeText={(t) => { setPassword(t); setError(''); }}
                />
              </View>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.primaryBtn, btnLoading && { opacity: 0.8 }]}
              onPress={isRegister ? handleRegister : handleLogin}
              disabled={btnLoading}
            >
              {btnLoading ? (
                <PremiumLoader size={24} color="#fff" />
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
                  {isRegister ? 'Login' : 'Create New Account'}
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
        <PremiumLoader size={50} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.profileContainer} style={{ backgroundColor: theme.colors.background }}>
      <View style={styles.bgDecorCircle} />

      <View style={[styles.profileCard, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }]}>
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


      <View style={{ width: '85%', marginBottom: 20 }}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setShowPasswordModal(true)}
        >
          <View style={[styles.menuIconBox, { backgroundColor: '#E3F2FD' }]}>
            <Ionicons name="key" size={22} color="#1565C0" />
          </View>
          <Text style={styles.menuText}>Change Password</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>


      {profile?.role === 'admin' && (
        <TouchableOpacity style={styles.adminBtn} onPress={() => navigation.navigate('AdminDashboard')}>
          <Ionicons name="shield-checkmark" size={20} color="#FF8F00" style={{ marginRight: 10 }} />
          <Text style={styles.adminBtnText}>Admin Panel</Text>
        </TouchableOpacity>
      )}




      <View style={{ flex: 1 }} />


      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={22} color={theme.colors.error} style={{ marginRight: 10 }} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <Text style={styles.versionText}>App Version 1.0.0</Text>


      <Modal
        visible={showPasswordModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Current Password"
              secureTextEntry
              value={oldPassword}
              onChangeText={setOldPassword}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="New Password"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Confirm New Password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#ccc' }]}
                onPress={() => setShowPasswordModal(false)}
              >
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: theme.colors.primary }]}
                onPress={handleChangePassword}
                disabled={btnLoading}
              >
                {btnLoading ? <PremiumLoader size={20} color="#fff" /> : <Text style={[styles.modalBtnText, { color: '#fff' }]}>Update</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        confirmText={alertConfig.cancelable ? (alertConfig.title === 'Logout' ? 'Logout' : 'Confirm') : 'OK'}
        onClose={() => {
          setAlertConfig({ ...alertConfig, visible: false });
          if (alertConfig.onConfirm) alertConfig.onConfirm();
        }}
        onCancel={alertConfig.cancelable ? () => setAlertConfig({ ...alertConfig, visible: false }) : null}
      />
    </ScrollView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: theme.colors.background },
  center: { flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' },


  authWrapper: {
    flex: 1,
    backgroundColor: '#F7F9FC',
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


  title: { fontSize: 28, fontWeight: '800', textAlign: 'center', marginBottom: 30, color: theme.colors.text },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: 12, paddingHorizontal: 15, marginBottom: 15, height: 55, ...theme.shadows.soft },
  input: { flex: 1, marginLeft: 10, color: theme.colors.text, fontSize: 16 },
  button: { backgroundColor: theme.colors.primary, padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 10, ...theme.shadows.medium },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  link: { textAlign: 'center', marginTop: 20, color: theme.colors.primary, fontWeight: '600' },
  imageBox: { height: 150, width: 150, borderRadius: 75, backgroundColor: theme.colors.surface, alignSelf: 'center', justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 2, borderColor: theme.colors.border, borderStyle: 'dashed' },
  avatar: { width: 140, height: 140, borderRadius: 70 },


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

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#fff', borderRadius: 20, padding: 20, alignItems: 'center', elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: theme.colors.text },
  modalInput: { width: '100%', height: 50, borderWidth: 1, borderColor: '#ddd', borderRadius: 12, paddingHorizontal: 15, marginBottom: 15, color: '#000' },
  modalBtnRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 10 },
  modalBtn: { flex: 1, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginHorizontal: 5 },
  modalBtnText: { fontWeight: 'bold', color: '#333' },
  errorText: {
    color: theme.colors.error,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '600'
  }
});

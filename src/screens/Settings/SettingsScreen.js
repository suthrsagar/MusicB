import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ScrollView,
  StatusBar,
  Linking,
  Image,
  Modal,
  TextInput,
  ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../../theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { BASE_URL } from '../../services/apiConfig';

const SettingsScreen = ({ navigation }) => {

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('feedback');
  const [feedbackText, setFeedbackText] = useState('');
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasRated, setHasRated] = useState(false);

  React.useEffect(() => {
    checkRatingStatus();
  }, []);

  const checkRatingStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const res = await axios.get(`${BASE_URL}/api/feedback/check-rating`, {
        headers: { 'x-auth-token': token }
      });
      setHasRated(res.data.hasRated);
    } catch (e) {

    }
  };


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

  const openAppInfo = () => {

    Alert.alert("App Info", "Music App\nVersion: 1.0.0\ ");
  };

  const openFeedbackModal = (type) => {
    setModalType(type);
    setFeedbackText('');
    setRating(0);
    setModalVisible(true);
  };

  const submitFeedback = async () => {
    if ((modalType !== 'rate' && !feedbackText.trim()) || (modalType === 'rate' && rating === 0)) {
      Alert.alert('Missing Info', 'Please fill in the required fields.');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');


      let userId = null;
      if (token) {
        const profile = await axios.get(`${BASE_URL}/api/profile`, { headers: { 'x-auth-token': token } });
        userId = profile.data._id;
      }

      await axios.post(`${BASE_URL}/api/feedback`, {
        type: modalType,
        message: feedbackText,
        rating: modalType === 'rate' ? rating : undefined,
        userId
      });

      setModalVisible(false);
      if (modalType === 'rate') setHasRated(true);
      Alert.alert('Success', 'Thank you! Your response has been sent to the Admin.');
    } catch (e) {
      console.error(e);
      if (e.response && e.response.status === 400) {
        Alert.alert('Notice', e.response.data.msg || 'You have already rated the app!');
      } else {
        Alert.alert('Error', 'Failed to send. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };



  const renderModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {modalType === 'rate' ? 'Rate App' : modalType === 'help' ? 'Help & Support' : 'Feedback'}
          </Text>

          {modalType === 'rate' && (
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Ionicons
                    name={rating >= star ? "star" : "star-outline"}
                    size={32}
                    color={rating >= star ? "#FFC107" : theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TextInput
            style={[styles.input, { height: modalType === 'rate' ? 60 : 120 }]}
            placeholder={modalType === 'rate' ? "Optional comment..." : "Type your message here..."}
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            value={feedbackText}
            onChangeText={setFeedbackText}
            textAlignVertical="top"
          />

          <View style={styles.modalActions}>
            <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalBtn, styles.submitBtn]} onPress={submitFeedback} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalBtnText}>Submit</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );



  return (
    <ScrollView contentContainerStyle={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      <Text style={styles.header}>Settings</Text>


      <View style={styles.card}>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Premium')}>
          <View style={styles.menuIconInfo}>
            <View style={[styles.iconBox, { backgroundColor: '#FFECB3' }]}>
              <Ionicons name="diamond-outline" size={22} color="#FFC107" />
            </View>
            <View>
              <Text style={styles.menuText}>Get Premium</Text>
              <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>Ad-free, HQ Audio & More</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>


      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Content</Text>
        <TouchableOpacity style={styles.menuItem} onPress={handleUploadPress}>
          <View style={styles.menuIconInfo}>
            <View style={[styles.iconBox, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="cloud-upload-outline" size={22} color={theme.colors.primary} />
            </View>
            <Text style={styles.menuText}>Upload Songs</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>


      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Support</Text>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('SupportChatScreen')}>
          <View style={styles.menuIconInfo}>
            <View style={[styles.iconBox, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="help-buoy-outline" size={22} color={theme.colors.success} />
            </View>
            <Text style={styles.menuText}>Help & Support</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        {!hasRated && (
          <TouchableOpacity style={styles.menuItem} onPress={() => openFeedbackModal('rate')}>
            <View style={styles.menuIconInfo}>
              <View style={[styles.iconBox, { backgroundColor: '#FFF8E1' }]}>
                <Ionicons name="star-outline" size={22} color="#FFC107" />
              </View>
              <Text style={styles.menuText}>Rate App</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>



      <View style={styles.card}>
        <Text style={styles.sectionTitle}>About App</Text>


        <TouchableOpacity style={styles.menuItem} onPress={openAppInfo}>
          <View style={styles.menuIconInfo}>
            <View style={[styles.iconBox, { backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="information-circle-outline" size={22} color="#9C27B0" />
            </View>
            <Text style={styles.menuText}>App Info</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.divider} />

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
          <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: theme.colors.background, marginRight: 15, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
            <Image
              source={{ uri: 'https://instagram.fjdh1-3.fna.fbcdn.net/v/t51.2885-19/475284433_1686431242278803_1390820093851091504_n.jpg?stp=dst-jpg_s150x150_tt6&efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLmRqYW5nby4xMDgwLmMyIn0&_nc_ht=instagram.fjdh1-3.fna.fbcdn.net&_nc_cat=111&_nc_oc=Q6cZ2QFL3d3aBFi3XFCkP_qNjhb6mmhMQqRjS2PY-kuC_8dVS_mdtchiejU_trGY09KMlcA&_nc_ohc=cUkdoGNnYZwQ7kNvwEK1eVX&_nc_gid=LQJvbGaBXhXctvHgh7dqpA&edm=ALGbJPMBAAAA&ccb=7-5&oh=00_AflBu87GinU3AnX5Z_Z-Qr17WzbkSUxiTLdn-j3S1awVIA&oe=694C847B&_nc_sid=7d3ac5' }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          </View>
          <View>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.colors.text }}>Sagar Jangid</Text>
            <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>Developer</Text>
            <TouchableOpacity
              onPress={() => Linking.openURL('https://instagram.fudr2-1.fna.fbcdn.net/v/t51.2885-19/475284433_1686431242278803_1390820093851091504_n.jpg?stp=dst-jpg_s150x150_tt6&efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLmRqYW5nby4xMDgwLmMxIn0&_nc_ht=instagram.fudr2-1.fna.fbcdn.net&_nc_cat=111&_nc_oc=Q6cZ2QHjMoL2ETf0AzHwqsEIOHrbhj5_r3Nc4SGSZyiFLGXcX8mH0V12EClYsjfxiU1xzs_qDJhbI7qROtFdwqxrImPH&_nc_ohc=75eHYvCTKb8Q7kNvwFp5PgC&_nc_gid=qZLaZ_mahmYR6BCsRsj76A&edm=AP4sbd4BAAAA&ccb=7-5&oh=00_Afmj5-iUhW7L5UxuRg3ODP3iJ9hPbV_Ez-J-_PFSDbD91Q&oe=6955BEFB&_nc_sid=7a9f4b')}
              style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}
            >
              <Ionicons name="logo-instagram" size={12} color="#E1306C" />
              <Text style={{ color: theme.colors.primary, fontSize: 12, fontWeight: '600', marginLeft: 4 }}>Sagar_jangid710</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {renderModal()}
    </ScrollView>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: theme.colors.background,
    paddingBottom: 150,
  },
  header: {
    ...theme.typography.header,
    color: theme.colors.text,
    marginBottom: 20,
    marginTop: 10,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    ...theme.shadows.soft,
  },
  sectionTitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '700',
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,

  },
  menuIconInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuText: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 10
  },


  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    elevation: 5
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: theme.colors.text
  },
  input: {
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    color: theme.colors.text
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  modalBtn: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5
  },
  cancelBtn: {
    backgroundColor: '#F5F5F5'
  },
  submitBtn: {
    backgroundColor: theme.colors.primary
  },
  modalBtnText: {
    fontWeight: 'bold',
    color: theme.colors.text
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20
  }
});
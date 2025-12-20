import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ScrollView, StatusBar, Linking, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../../theme';
import Ionicons from 'react-native-vector-icons/Ionicons';

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
    <ScrollView contentContainerStyle={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      <Text style={styles.header}>Settings</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Content Management</Text>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleUploadPress}
        >
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
        <Text style={styles.sectionTitle}>App Info</Text>
        <View style={styles.menuItem}>
          <View style={styles.menuIconInfo}>
            <View style={[styles.iconBox, { backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="information-circle-outline" size={22} color="#9C27B0" />
            </View>
            <Text style={styles.menuText}>Version</Text>
          </View>
          <Text style={styles.versionText}>1.0.0</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>About Developer</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: theme.colors.background, marginRight: 15, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
            <Image
              source={{ uri: 'https://instagram.fjdh1-3.fna.fbcdn.net/v/t51.2885-19/475284433_1686431242278803_1390820093851091504_n.jpg?stp=dst-jpg_s150x150_tt6&efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLmRqYW5nby4xMDgwLmMyIn0&_nc_ht=instagram.fjdh1-3.fna.fbcdn.net&_nc_cat=111&_nc_oc=Q6cZ2QFL3d3aBFi3XFCkP_qNjhb6mmhMQqRjS2PY-kuC_8dVS_mdtchiejU_trGY09KMlcA&_nc_ohc=cUkdoGNnYZwQ7kNvwEK1eVX&_nc_gid=LQJvbGaBXhXctvHgh7dqpA&edm=ALGbJPMBAAAA&ccb=7-5&oh=00_AflBu87GinU3AnX5Z_Z-Qr17WzbkSUxiTLdn-j3S1awVIA&oe=694C847B&_nc_sid=7d3ac5' }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          </View>
          <View>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.colors.text }}>Sagar Jangid</Text>
            <Text style={{ fontSize: 14, color: theme.colors.textSecondary }}>Full Stack Developer</Text>
            <TouchableOpacity
              onPress={() => Linking.openURL('https://www.instagram.com/Sagar_jangid710')}
              style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}
            >
              <Ionicons name="logo-instagram" size={14} color="#E1306C" />
              <Text style={{ color: theme.colors.primary, fontSize: 13, fontWeight: '600', marginLeft: 4 }}>Sagar_jangid710</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>



    </ScrollView>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: theme.colors.background,
  },
  header: {
    ...theme.typography.header,
    color: theme.colors.text,
    marginBottom: 30,
    marginTop: 10,
  },
  card: { // Reusing 'card' style from theme concept, specifically for menu groups
    backgroundColor: theme.colors.surface,
    borderRadius: theme.layout.borderRadius,
    padding: 20,
    marginBottom: 20,
    ...theme.shadows.soft,
  },
  sectionTitle: {
    fontSize: 14,
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
  versionText: {
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
});
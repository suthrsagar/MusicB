import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView } from 'react-native';

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [downloadWifi, setDownloadWifi] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <ScrollView style={styles.container}>
    

      {/* Account Section */}
      <Text style={styles.sectionTitle}>Account</Text>
      <TouchableOpacity style={styles.item}>
        <Text style={styles.itemText}>Edit Profile</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.item}>
        <Text style={styles.itemText}>Manage Subscription</Text>
      </TouchableOpacity>

      {/* Playback Settings */}
      <Text style={styles.sectionTitle}>Playback</Text>
      <View style={styles.switchItem}>
        <Text style={styles.itemText}>Allow Notifications</Text>
        <Switch value={notifications} onValueChange={setNotifications} />
      </View>
      <View style={styles.switchItem}>
        <Text style={styles.itemText}>Download using Wi-Fi only</Text>
        <Switch value={downloadWifi} onValueChange={setDownloadWifi} />
      </View>

      {/* Appearance */}
      <Text style={styles.sectionTitle}>Appearance</Text>
      <View style={styles.switchItem}>
        <Text style={styles.itemText}>Dark Mode</Text>
        <Switch value={darkMode} onValueChange={setDarkMode} />
      </View>

      {/* Storage */}
      <Text style={styles.sectionTitle}>Storage</Text>
      <TouchableOpacity style={styles.item}>
        <Text style={styles.itemText}>Clear Cache</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.item}>
        <Text style={styles.itemText}>Manage Downloads</Text>
      </TouchableOpacity>

      {/* Support */}
      <Text style={styles.sectionTitle}>Support</Text>
      <TouchableOpacity style={styles.item}>
        <Text style={styles.itemText}>Help & Support</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.item}>
        <Text style={styles.itemText}>Privacy Policy</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.item}>
        <Text style={styles.itemText}>Terms & Conditions</Text>
      </TouchableOpacity>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#444',
    marginTop: 20,
    marginBottom: 10,
  },
  item: {
    backgroundColor: '#f3f3f3',
    padding: 12,
    borderRadius: 10,
    marginVertical: 5,
  },
  itemText: {
    fontSize: 16,
    color: '#333',
  },
  switchItem: {
    backgroundColor: '#f3f3f3',
    padding: 12,
    borderRadius: 10,
    marginVertical: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoutBtn: {
    backgroundColor: '#ff4d4d',
    padding: 14,
    borderRadius: 12,
    marginVertical: 20,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

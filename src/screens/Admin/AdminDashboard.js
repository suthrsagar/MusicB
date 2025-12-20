import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const BASE_URL = 'http://10.206.215.196:5000';

const AdminDashboard = () => {
    const navigation = useNavigation();
    const [stats, setStats] = useState({ users: 0, songs: 0 });
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await axios.get(`${BASE_URL}/api/admin/stats`, {
                headers: { 'x-auth-token': token }
            });
            setStats(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to fetch admin stats');
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchStats();
        }, [])
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#007bff" />
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Admin Dashboard</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{stats.users}</Text>
                    <Text style={styles.statLabel}>Total Users</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{stats.songs}</Text>
                    <Text style={styles.statLabel}>Total Songs</Text>
                </View>
            </View>

            <View style={styles.menuContainer}>
                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => navigation.navigate('ManageUsers')}
                >
                    <Ionicons name="people" size={30} color="#fff" />
                    <Text style={styles.menuText}>Manage Users</Text>
                    <Ionicons name="chevron-forward" size={24} color="#ddd" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.menuItem, { backgroundColor: '#dc3545' }]}
                    onPress={() => navigation.navigate('ManageSongs')}
                >
                    <Ionicons name="musical-notes" size={30} color="#fff" />
                    <Text style={styles.menuText}>Manage Songs</Text>
                    <Ionicons name="chevron-forward" size={24} color="#ddd" />
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

export default AdminDashboard;

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#f5f5f5',
        padding: 20,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    statCard: {
        width: '48%',
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
        elevation: 3,
    },
    statNumber: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#007bff',
    },
    statLabel: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
    },
    menuContainer: {
        marginTop: 10,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#28a745',
        padding: 20,
        borderRadius: 12,
        marginBottom: 15,
        elevation: 3,
    },
    menuText: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
        marginLeft: 15,
    },
});

import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert, ScrollView, StatusBar } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../../theme';

import { BASE_URL } from '../../services/apiConfig';

const AdminDashboard = () => {
    const navigation = useNavigation();
    const [stats, setStats] = useState({ users: 0, songs: 0, online: 0 });
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
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Admin Dashboard</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.statsContainer}>
                <View style={[styles.statCard, { width: '31%' }]}>
                    <View style={[styles.statIconBox, { backgroundColor: 'rgba(67, 24, 255, 0.1)' }]}>
                        <Ionicons name="people" size={20} color={theme.colors.primary} />
                    </View>
                    <Text style={styles.statNumber}>{stats.users}</Text>
                    <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={[styles.statCard, { width: '31%' }]}>
                    <View style={[styles.statIconBox, { backgroundColor: 'rgba(5, 205, 153, 0.1)' }]}>
                        <Ionicons name="musical-notes" size={20} color={theme.colors.success} />
                    </View>
                    <Text style={[styles.statNumber, { color: theme.colors.success }]}>{stats.songs}</Text>
                    <Text style={styles.statLabel}>Songs</Text>
                </View>
                <View style={[styles.statCard, { width: '31%' }]}>
                    <View style={[styles.statIconBox, { backgroundColor: 'rgba(0, 200, 83, 0.1)' }]}>
                        <Ionicons name="radio" size={20} color="#00C853" />
                    </View>
                    <Text style={[styles.statNumber, { color: '#00C853' }]}>{stats.online}</Text>
                    <Text style={styles.statLabel}>Online</Text>
                </View>
            </View>

            <Text style={styles.sectionHeader}>Management Actions</Text>

            <View style={styles.menuContainer}>
                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => navigation.navigate('ManageUsers')}
                >
                    <View style={[styles.menuIconBox, { backgroundColor: 'rgba(67, 24, 255, 0.1)' }]}>
                        <Ionicons name="people-circle-outline" size={28} color={theme.colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.menuText}>Manage Users</Text>
                        <Text style={styles.menuSubText}>View, ban, or unban users</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => navigation.navigate('ManageSongs')}
                >
                    <View style={[styles.menuIconBox, { backgroundColor: 'rgba(255, 86, 48, 0.1)' }]}>
                        <Ionicons name="musical-note-outline" size={28} color={theme.colors.error} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.menuText}>Manage Songs</Text>
                        <Text style={styles.menuSubText}>Approve pending or delete songs</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => navigation.navigate('SendNotification')}
                >
                    <View style={[styles.menuIconBox, { backgroundColor: 'rgba(255, 193, 7, 0.1)' }]}>
                        <Ionicons name="notifications-outline" size={28} color="#FFC107" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.menuText}>Send Notifications</Text>
                        <Text style={styles.menuSubText}>Broadcast updates to all users</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => navigation.navigate('AdminFeedbackScreen')}
                >
                    <View style={[styles.menuIconBox, { backgroundColor: 'rgba(33, 150, 243, 0.1)' }]}>
                        <Ionicons name="chatbubbles-outline" size={28} color="#2196F3" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.menuText}>Support Messages</Text>
                        <Text style={styles.menuSubText}>View and reply to user chats</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
            </View>

            <Text style={styles.sectionHeader}>Business & Analytics</Text>
            <View style={styles.menuContainer}>
                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => navigation.navigate('AnalyticsScreen')}
                >
                    <View style={[styles.menuIconBox, { backgroundColor: 'rgba(0, 200, 83, 0.1)' }]}>
                        <Ionicons name="bar-chart-outline" size={28} color="#00C853" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.menuText}>App Analytics</Text>
                        <Text style={styles.menuSubText}>See insights, streams & revenue</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => navigation.navigate('MonetizationScreen')}
                >
                    <View style={[styles.menuIconBox, { backgroundColor: 'rgba(255, 171, 0, 0.1)' }]}>
                        <Ionicons name="wallet-outline" size={28} color="#FFAB00" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.menuText}>Monetization</Text>
                        <Text style={styles.menuSubText}>Ads, Plans & Artist Payouts</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
            </View>
        </ScrollView >
    );
};

export default AdminDashboard;

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: theme.colors.background,
        padding: 20,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
        marginTop: 10,
    },
    headerTitle: {
        ...theme.typography.header,
        color: theme.colors.text,
        fontSize: 20,
    },
    backButton: {
        padding: 5,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 40,
    },
    statCard: {
        width: '48%',
        backgroundColor: theme.colors.surface,
        padding: 20,
        borderRadius: 20,
        ...theme.shadows.medium,
        alignItems: 'flex-start',
    },
    statIconBox: {
        width: 45,
        height: 45,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    statNumber: {
        fontSize: 28,
        fontWeight: '800',
        color: theme.colors.primary,
        marginBottom: 5,
    },
    statLabel: {
        fontSize: 14,
        color: theme.colors.textSecondary,
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text,
        marginBottom: 15,
    },
    menuContainer: {
        paddingBottom: 20,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        padding: 20,
        borderRadius: 16,
        marginBottom: 20,
        ...theme.shadows.soft,
    },
    menuIconBox: {
        width: 50,
        height: 50,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    menuText: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text,
    },
    menuSubText: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginTop: 3,
    },
});

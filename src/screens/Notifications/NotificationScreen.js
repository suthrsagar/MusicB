import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, StatusBar, TouchableOpacity, Alert } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../../theme';
import { useNavigation } from '@react-navigation/native';
import PremiumLoader from '../../components/PremiumLoader';

import { BASE_URL } from '../../services/apiConfig';

const NotificationScreen = () => {
    const navigation = useNavigation();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/api/notifications`);
            setNotifications(res.data);


            if (res.data.length > 0) {
                const latestTime = res.data[0].createdAt;
                await AsyncStorage.setItem('lastReadNotificationTime', latestTime);
            }

            setLoading(false);
        } catch (err) {
            console.error('Fetch error:', err);
            const msg = err.response?.data?.msg || err.message || 'Failed to load notifications';
            Alert.alert('Error', msg);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.iconBox}>
                <Ionicons name="notifications" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.content}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.message}>{item.message}</Text>
                <Text style={styles.time}>{new Date(item.createdAt).toDateString()}</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />


            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 5 }}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notifications</Text>
                <View style={{ width: 30 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <PremiumLoader size={50} />
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={item => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Ionicons name="notifications-off-outline" size={60} color={theme.colors.textSecondary} />
                            <Text style={styles.emptyText}>No notifications yet</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

export default NotificationScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: theme.colors.surface,
        ...theme.shadows.soft,
        marginBottom: 10,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text
    },
    list: {
        padding: 20,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50
    },
    card: {
        flexDirection: 'row',
        backgroundColor: theme.colors.surface,
        padding: 15,
        borderRadius: 16,
        marginBottom: 15,
        alignItems: 'flex-start',
        ...theme.shadows.soft
    },
    iconBox: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: 'rgba(67, 24, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text,
        marginBottom: 4,
    },
    message: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginBottom: 8,
        lineHeight: 20,
    },
    time: {
        fontSize: 12,
        color: '#aaa',
    },
    emptyText: {
        marginTop: 15,
        fontSize: 16,
        color: theme.colors.textSecondary
    }
});

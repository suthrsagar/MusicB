import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, StatusBar, ScrollView } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../../theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

import { BASE_URL } from '../../services/apiConfig';

const SendNotificationScreen = () => {
    const navigation = useNavigation();
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [notifications, setNotifications] = useState([]);

    const fetchNotifications = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/api/notifications`);
            setNotifications(res.data);
        } catch (err) {
            console.error('Fetch error', err);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleSend = async () => {
        if (!title.trim() || !message.trim()) {
            Alert.alert('⚠️ Missing Fields', 'Title and Message are both required.');
            return;
        }

        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            console.log('📡 Sending Push Notification Request...');

            const response = await axios.post(`${BASE_URL}/api/notifications`,
                { title, message },
                {
                    headers: { 'x-auth-token': token },
                    timeout: 10000 // 10 second timeout
                }
            );

            console.log('✅ Server Response:', response.data);
            Alert.alert('🚀 Blast Sent!', 'Your notification has been Notification to all users successfully.');
            setTitle('');
            setMessage('');
            fetchNotifications();
        } catch (err) {
            console.error('❌ Notification Error:', err);
            const errorMsg = err.response?.data?.msg || err.message || 'Unknown error occurred';
            Alert.alert('❌ Dispatch Failed', `Status: ${err.response?.status}\nError: ${errorMsg}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        Alert.alert(
            'Delete Record?',
            'This will remove it from the history list, but sent notifications cannot be "unsent" from devices.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem('token');
                            await axios.delete(`${BASE_URL}/api/notifications/${id}`, {
                                headers: { 'x-auth-token': token }
                            });
                            fetchNotifications();
                        } catch (err) {
                            Alert.alert('Error', 'Failed to delete record');
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <StatusBar barStyle="dark-content" backgroundColor={theme.colors.surface} />

            {/* Custom Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Push Center</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Send Card */}
                <View style={styles.formCard}>
                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle-outline" size={20} color={theme.colors.primary} />
                        <Text style={styles.infoText}>This will be sent as a high-priority push notification to all app users.</Text>
                    </View>

                    <Text style={styles.label}>Notification Title</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. New Hits Uploaded! 🎶"
                        placeholderTextColor="#999"
                        value={title}
                        onChangeText={setTitle}
                    />

                    <Text style={styles.label}>Message Body</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="What would you like to say?..."
                        placeholderTextColor="#999"
                        value={message}
                        onChangeText={setMessage}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />

                    <TouchableOpacity
                        style={[styles.sendBtn, loading && { opacity: 0.7 }]}
                        onPress={handleSend}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Text style={styles.btnText}>Send Notification</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* History Section */}
                <View style={styles.historySection}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>Sent History</Text>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{notifications.length}</Text>
                        </View>
                    </View>

                    {notifications.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="notifications-off-outline" size={40} color="#ccc" />
                            <Text style={styles.emptyStateText}>No notifications sent yet</Text>
                        </View>
                    ) : (
                        notifications.map((item) => (
                            <View key={item._id} style={styles.historyCard}>
                                <View style={styles.historyIconBox}>
                                    <Ionicons name="notifications" size={20} color={theme.colors.primary} />
                                </View>
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={styles.historyCardTitle}>{item.title}</Text>
                                    <Text style={styles.historyCardMsg} numberOfLines={2}>{item.message}</Text>
                                    <Text style={styles.historyCardDate}>
                                        {new Date(item.createdAt || item.date).toLocaleDateString(undefined, {
                                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                        })}
                                    </Text>
                                </View>
                                <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.deleteBtn}>
                                    <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
                                </TouchableOpacity>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

export default SendNotificationScreen;

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingTop: 15,
        paddingBottom: 15,
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text,
    },
    formCard: {
        margin: 20,
        padding: 20,
        backgroundColor: theme.colors.surface,
        borderRadius: 24,
        ...theme.shadows.medium,
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: 'rgba(67, 24, 255, 0.05)',
        padding: 12,
        borderRadius: 12,
        marginBottom: 20,
        alignItems: 'center',
    },
    infoText: {
        flex: 1,
        fontSize: 12,
        color: theme.colors.primary,
        marginLeft: 8,
        fontWeight: '500',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        backgroundColor: theme.colors.background,
        borderRadius: 16,
        padding: 15,
        fontSize: 15,
        color: theme.colors.text,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    textArea: {
        height: 100,
    },
    sendBtn: {
        flexDirection: 'row',
        backgroundColor: theme.colors.primary,
        height: 56,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 5,
        ...theme.shadows.primary,
    },
    btnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    historySection: {
        paddingHorizontal: 20,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text,
    },
    badge: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        marginLeft: 10,
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    historyCard: {
        flexDirection: 'row',
        backgroundColor: theme.colors.surface,
        borderRadius: 18,
        padding: 15,
        marginBottom: 12,
        alignItems: 'center',
        ...theme.shadows.soft,
    },
    historyIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(67, 24, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    historyCardTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.text,
    },
    historyCardMsg: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
    historyCardDate: {
        fontSize: 11,
        color: theme.colors.textSecondary,
        marginTop: 4,
        fontStyle: 'italic',
    },
    deleteBtn: {
        padding: 8,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 50,
    },
    emptyStateText: {
        marginTop: 10,
        color: theme.colors.textSecondary,
        fontSize: 14,
    }
});

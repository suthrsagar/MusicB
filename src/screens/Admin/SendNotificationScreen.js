import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    StatusBar,
    ScrollView,
    RefreshControl,
    PermissionsAndroid,
    Platform
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../../theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { BASE_URL } from '../../services/apiConfig';
import messaging from '@react-native-firebase/messaging';

const API_URL = `${BASE_URL}/api/notifications`;

const SendNotificationScreen = () => {
    const navigation = useNavigation();
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        const setupFCM = async () => {
            try {
                if (Platform.OS === 'android' && Platform.Version >= 33) {
                    await PermissionsAndroid.request(
                        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
                    );
                }

                await messaging().getToken();
                await messaging().subscribeToTopic('all_users');

                const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
                    Alert.alert(
                        remoteMessage.notification?.title || 'Notification',
                        remoteMessage.notification?.body || ''
                    );
                });

                const unsubscribeNotificationOpened = messaging().onNotificationOpenedApp(() => { });

                messaging().getInitialNotification().then(() => { });

                return () => {
                    unsubscribeForeground();
                    unsubscribeNotificationOpened();
                };
            } catch (e) { }
        };

        setupFCM();
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await axios.get(API_URL);
            setNotifications(res.data);
        } catch (e) { }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchNotifications();
        setRefreshing(false);
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleSend = async () => {
        if (!title.trim() || !message.trim()) {
            Alert.alert('Missing Fields', 'Title and Message required');
            return;
        }

        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            await axios.post(
                API_URL,
                { title, message, imageUrl },
                { headers: { 'x-auth-token': token } }
            );

            Alert.alert('Success', 'Notification sent');
            setTitle('');
            setMessage('');
            setImageUrl('');
            fetchNotifications();
        } catch (err) {
            Alert.alert('Error', 'Failed to send notification');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        Alert.alert('Delete?', 'Confirm delete', [
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
                    } catch (e) { }
                }
            }
        ]);
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <StatusBar barStyle="dark-content" backgroundColor={theme.colors.surface} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Push Center</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <View style={styles.formCard}>
                    <Text style={styles.label}>Title</Text>
                    <TextInput style={styles.input} value={title} onChangeText={setTitle} />

                    <Text style={styles.label}>Image URL</Text>
                    <TextInput style={styles.input} value={imageUrl} onChangeText={setImageUrl} />

                    <Text style={styles.label}>Message</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={message}
                        onChangeText={setMessage}
                        multiline
                    />

                    <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={loading}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Send</Text>}
                    </TouchableOpacity>
                </View>

                <View style={styles.historySection}>
                    {notifications.map((item) => (
                        <View key={item._id} style={styles.historyCard}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.historyCardTitle}>{item.title}</Text>
                                <Text style={styles.historyCardMsg}>{item.message}</Text>
                            </View>
                            <TouchableOpacity onPress={() => handleDelete(item._id)}>
                                <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
};

export default SendNotificationScreen;

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        padding: 15,
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center'
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700'
    },
    formCard: {
        margin: 20,
        padding: 20,
        borderRadius: 20,
        backgroundColor: theme.colors.surface
    },
    label: {
        marginBottom: 6,
        fontWeight: '600'
    },
    input: {
        borderWidth: 1,
        borderRadius: 14,
        padding: 14,
        marginBottom: 15
    },
    textArea: {
        height: 100
    },
    sendBtn: {
        height: 56,
        borderRadius: 18,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center'
    },
    btnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700'
    },
    historySection: {
        paddingHorizontal: 20
    },
    historyCard: {
        flexDirection: 'row',
        padding: 15,
        borderRadius: 16,
        marginBottom: 10,
        backgroundColor: theme.colors.surface
    },
    historyCardTitle: {
        fontWeight: '700'
    },
    historyCardMsg: {
        fontSize: 13
    }
});

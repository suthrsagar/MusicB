import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
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
import PremiumLoader from '../../components/PremiumLoader';

const API_URL = `${BASE_URL}/api/notifications`;

const SendNotificationScreen = () => {
    const navigation = useNavigation();
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [notifications, setNotifications] = useState([]);

    const setupFCM = async () => {
        try {
            if (Platform.OS === 'android' && Platform.Version >= 33) {
                await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
                );
            }

            await messaging().getToken();
            await messaging().subscribeToTopic('all_users');
        } catch (e) { }
    };

    useEffect(() => {
        setupFCM();
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await axios.get(API_URL);
            setNotifications(res.data);
        } catch (e) { console.log(e); }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchNotifications();
        setRefreshing(false);
    };

    const handleSend = async () => {
        if (!title.trim() || !message.trim()) {
            Alert.alert('Missing Fields', 'Please enter both title and message');
            return;
        }

        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            await axios.post(
                API_URL,
                { title, message },
                { headers: { 'x-auth-token': token } }
            );

            Alert.alert('Success', 'Notification sent successfully to all users! 🚀');
            setTitle('');
            setMessage('');
            fetchNotifications();
        } catch (err) {
            Alert.alert('Error', 'Failed to send notification. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        Alert.alert('Delete Notification', 'Are you sure you want to delete this from history?', [
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
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />


            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Push Center</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
                }
                showsVerticalScrollIndicator={false}
            >

                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="chatbubble-ellipses" size={20} color={theme.colors.primary} />
                        </View>
                        <Text style={styles.cardTitle}>Compose Message</Text>
                    </View>

                    <Text style={styles.inputLabel}>Title</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="text" size={18} color={theme.colors.textSecondary} />
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. New Song Alert!"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={title}
                            onChangeText={setTitle}
                        />
                    </View>

                    <Text style={styles.inputLabel}>Message</Text>
                    <View style={[styles.inputContainer, styles.textAreaContainer]}>
                        <Ionicons name="create-outline" size={18} color={theme.colors.textSecondary} style={{ marginTop: 12 }} />
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Type your message here..."
                            placeholderTextColor={theme.colors.textSecondary}
                            value={message}
                            onChangeText={setMessage}
                            multiline
                            textAlignVertical="top"
                        />
                    </View>

                    <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={loading} activeOpacity={0.8}>
                        {loading ? (
                            <PremiumLoader size={24} color="#fff" />
                        ) : (
                            <>
                                <Text style={styles.sendBtnText}>Send Notification</Text>
                                <Ionicons name="paper-plane" size={18} color="#fff" style={{ marginLeft: 8 }} />
                            </>
                        )}
                    </TouchableOpacity>
                </View>


                <Text style={styles.sectionTitle}>Recent History</Text>

                {notifications.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="notifications-off-outline" size={40} color={theme.colors.border} />
                        <Text style={styles.emptyText}>No notifications sent yet</Text>
                    </View>
                ) : (
                    notifications.map((item) => (
                        <View key={item._id} style={styles.historyItem}>
                            <View style={styles.historyIconBox}>
                                <Ionicons name="notifications" size={18} color="#fff" />
                            </View>
                            <View style={styles.historyContent}>
                                <Text style={styles.historyTitle}>{item.title}</Text>
                                <Text style={styles.historyMessage} numberOfLines={2}>{item.message}</Text>
                                {item.createdAt && (
                                    <Text style={styles.historyDate}>
                                        {new Date(item.createdAt).toLocaleDateString()}
                                    </Text>
                                )}
                            </View>
                            <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.deleteBtn}>
                                <Ionicons name="trash-outline" size={18} color={theme.colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    ))
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

export default SendNotificationScreen;

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
        paddingTop: 15,
        paddingBottom: 15,
        backgroundColor: theme.colors.surface,
        ...theme.shadows.soft,
        zIndex: 10,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    content: {
        padding: 20,
        paddingBottom: 50,
    },
    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: 24,
        padding: 24,
        ...theme.shadows.medium,
        marginBottom: 30,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 8,
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        borderRadius: 16,
        paddingHorizontal: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#EFEFEF',
    },
    textAreaContainer: {
        alignItems: 'flex-start',
        height: 120,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: theme.colors.text,
        marginLeft: 10,
        paddingVertical: Platform.OS === 'ios' ? 16 : 12,
    },
    textArea: {
        height: '100%',
        textAlignVertical: 'top',
        paddingTop: Platform.OS === 'ios' ? 16 : 12,
    },
    sendBtn: {
        backgroundColor: theme.colors.primary,
        borderRadius: 16,
        height: 56,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadows.medium,
    },
    sendBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 15,
        marginLeft: 4,
    },
    historyItem: {
        flexDirection: 'row',
        backgroundColor: theme.colors.surface,
        padding: 16,
        borderRadius: 18,
        marginBottom: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F5F5F5',
    },
    historyIconBox: {
        width: 42,
        height: 42,
        borderRadius: 14,
        backgroundColor: theme.colors.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    historyContent: {
        flex: 1,
    },
    historyTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.text,
        marginBottom: 4,
    },
    historyMessage: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        marginBottom: 4,
    },
    historyDate: {
        fontSize: 11,
        color: theme.colors.border,
    },
    deleteBtn: {
        padding: 8,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 40,
        opacity: 0.7
    },
    emptyText: {
        marginTop: 10,
        color: theme.colors.textSecondary,
        fontSize: 14,
    }
});

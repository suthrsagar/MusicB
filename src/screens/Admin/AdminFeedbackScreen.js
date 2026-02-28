import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity, Alert, StatusBar } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../../theme';
import { BASE_URL } from '../../services/apiConfig';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';

const AdminFeedbackScreen = ({ navigation }) => {
    const [chats, setChats] = useState([]);
    const [feedbacks, setFeedbacks] = useState([]);
    const [viewMode, setViewMode] = useState('chats');
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        React.useCallback(() => {
            fetchData();
        }, [viewMode])
    );

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');

            if (viewMode === 'chats') {
                const res = await axios.get(`${BASE_URL}/api/support/admin/all`, {
                    headers: { 'x-auth-token': token }
                });
                setChats(res.data);
            } else {
                const res = await axios.get(`${BASE_URL}/api/feedback/all`, {
                    headers: { 'x-auth-token': token }
                });
                setFeedbacks(res.data);
            }
            setLoading(false);
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to fetch data');
            setLoading(false);
        }
    };

    const renderChat = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('AdminChatScreen', { userId: item.userId, username: item.username })}
        >
            <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                    <Ionicons name="chatbubbles" size={20} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.usernameText}>{item.username}</Text>
                    <Text style={styles.dateText}>{new Date(item.lastUpdated).toDateString()}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </View>
            <View style={styles.cardContent}>
                <Text numberOfLines={1} style={styles.messageText}>
                    {item.lastMessage || 'No messages yet'}
                </Text>
            </View>
        </TouchableOpacity>
    );

    const renderFeedback = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: item.type === 'rate' ? '#FFC107' : theme.colors.primary }]}>
                    <Ionicons name={item.type === 'rate' ? "star" : "chatbubble"} size={20} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.usernameText}>{item.username || 'Anonymous'}</Text>
                    <Text style={styles.dateText}>{new Date(item.createdAt).toDateString()}</Text>
                </View>
            </View>

            <View style={styles.cardContent}>
                {item.type === 'rate' && (
                    <View style={styles.ratingRow}>
                        {[1, 2, 3, 4, 5].map(star => (
                            <Ionicons
                                key={star}
                                name={star <= item.rating ? "star" : "star-outline"}
                                size={16}
                                color="#FFC107"
                            />
                        ))}
                    </View>
                )}
                {item.message && (
                    <Text style={styles.messageText}>{item.message}</Text>
                )}
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Support Inbox</Text>
            </View>

            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, viewMode === 'chats' && styles.activeTab]}
                    onPress={() => setViewMode('chats')}
                >
                    <Text style={[styles.tabText, viewMode === 'chats' && styles.activeTabText]}>Chats</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, viewMode === 'ratings' && styles.activeTab]}
                    onPress={() => setViewMode('ratings')}
                >
                    <Text style={[styles.tabText, viewMode === 'ratings' && styles.activeTabText]}>Ratings</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={viewMode === 'chats' ? chats : feedbacks}
                    renderItem={viewMode === 'chats' ? renderChat : renderFeedback}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={() => (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="file-tray-outline" size={60} color={theme.colors.textSecondary} />
                            <Text style={styles.emptyText}>No data found.</Text>
                        </View>
                    )}
                />
            )}
        </View>
    );
};

export default AdminFeedbackScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        paddingTop: 10,
    },
    backBtn: {
        marginRight: 20
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 10
    },
    tab: {
        marginRight: 15,
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
        backgroundColor: theme.colors.surface
    },
    activeTab: {
        backgroundColor: theme.colors.primary
    },
    tabText: {
        color: theme.colors.text,
        fontWeight: '600'
    },
    activeTabText: {
        color: '#fff'
    },
    listContent: {
        padding: 20,
    },
    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: 15,
        padding: 20,
        marginBottom: 15,
        ...theme.shadows.soft,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15
    },
    usernameText: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text
    },
    dateText: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginTop: 2
    },
    cardContent: {
        paddingLeft: 55
    },
    messageText: {
        fontSize: 14,
        color: theme.colors.textSecondary,
    },
    ratingRow: {
        flexDirection: 'row',
        marginBottom: 5
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 50
    },
    emptyText: {
        marginTop: 10,
        color: theme.colors.textSecondary,
        fontSize: 16
    }
});

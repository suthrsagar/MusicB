import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, Alert, StatusBar, Image } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../../theme';

import { BASE_URL } from '../../services/apiConfig';

const ManageUsersScreen = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const getAvatarUrl = (avatarPath) => {
        if (!avatarPath) return null;
        if (avatarPath.startsWith('http')) return avatarPath;
        if (avatarPath.includes('avatar-')) return `${BASE_URL}/api/avatar/${avatarPath}`;
        return `${BASE_URL}${avatarPath.startsWith('/') ? '' : '/'}${avatarPath}`;
    };

    const fetchUsers = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await axios.get(`${BASE_URL}/api/admin/users`, {
                headers: { 'x-auth-token': token }
            });
            setUsers(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to fetch users');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const toggleBan = async (id, currentStatus) => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await axios.put(`${BASE_URL}/api/admin/users/${id}/ban`, {}, {
                headers: { 'x-auth-token': token }
            });

            Alert.alert('Success', res.data.msg);
            fetchUsers();
        } catch (err) {
            Alert.alert('Error', err.response?.data?.msg || 'Action failed');
        }
    };

    const handleDelete = async (id) => {
        Alert.alert(
            'Delete User',
            'Are you sure? This will delete the user and all their uploaded songs.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem('token');
                            await axios.delete(`${BASE_URL}/api/admin/users/${id}`, {
                                headers: { 'x-auth-token': token }
                            });
                            Alert.alert('Deleted', 'User removed successfully');
                            fetchUsers();
                        } catch (err) {
                            Alert.alert('Error', err.response?.data?.msg || 'Delete failed');
                        }
                    }
                }
            ]
        );
    };

    const makeAdmin = async (id) => {
        Alert.alert(
            'Promote to Admin',
            'Are you sure you want to make this user an Admin? They will have full access.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Promote',
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem('token');
                            const res = await axios.put(`${BASE_URL}/api/admin/users/${id}/make-admin`, {}, {
                                headers: { 'x-auth-token': token }
                            });
                            Alert.alert('Success', res.data.msg);
                            fetchUsers();
                        } catch (err) {
                            Alert.alert('Error', err.response?.data?.msg || 'Promotion failed');
                        }
                    }
                }
            ]
        );
    };

    const removeAdmin = async (id) => {
        Alert.alert(
            'Remove Admin',
            'Are you sure? This will remove their admin privileges.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem('token');
                            const res = await axios.put(`${BASE_URL}/api/admin/users/${id}/remove-admin`, {}, {
                                headers: { 'x-auth-token': token }
                            });
                            Alert.alert('Success', res.data.msg);
                            fetchUsers();
                        } catch (err) {
                            Alert.alert('Error', err.response?.data?.msg || 'Action failed');
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }) => (
        <View style={styles.userCard}>
            {item.avatar ? (
                <Image source={{ uri: getAvatarUrl(item.avatar) }} style={styles.avatar} />
            ) : (
                <View style={styles.iconBox}>
                    <Ionicons name="person" size={20} color={theme.colors.primary} />
                </View>
            )}

            <View style={styles.userInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.username}>{item.username}</Text>
                    {item.role === 'admin' && (
                        <View style={styles.adminBadge}>
                            <Text style={styles.adminBadgeText}>ADMIN</Text>
                        </View>
                    )}
                </View>
                <Text style={styles.email}>{item.email}</Text>
                <Text style={styles.userId}>ID: {item._id}</Text>

                <View style={styles.statusRow}>
                    <View style={[styles.statusDot, { backgroundColor: item.isOnline ? theme.colors.success : '#ccc' }]} />
                    <Text style={[styles.statusText, { color: item.isOnline ? theme.colors.success : theme.colors.textSecondary }]}>
                        {item.isOnline ? 'Online' : 'Offline'}
                    </Text>
                    <Text style={[styles.statusText, { marginLeft: 10, color: item.isBanned ? theme.colors.error : theme.colors.success }]}>
                        |  {item.isBanned ? 'Banned' : 'Active'}
                    </Text>
                </View>
            </View>

            {item.role !== 'admin' ? (
                <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#2196F3', marginRight: 8 }]}
                        onPress={() => makeAdmin(item._id)}
                    >
                        <Ionicons name="shield-checkmark" size={16} color="#fff" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: item.isBanned ? theme.colors.success : '#FFA000', marginRight: 8 }]}
                        onPress={() => toggleBan(item._id, item.isBanned)}
                    >
                        <Ionicons name={item.isBanned ? "checkmark-circle" : "ban"} size={16} color="#fff" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: theme.colors.error }]}
                        onPress={() => handleDelete(item._id)}
                    >
                        <Ionicons name="trash" size={16} color="#fff" />
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: theme.colors.error, marginRight: 8 }]}
                        onPress={() => removeAdmin(item._id)}
                    >
                        <Ionicons name="shield-outline" size={16} color="#fff" />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
            <Text style={styles.header}>Manage Users</Text>
            <FlatList
                data={users}
                keyExtractor={item => item._id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
};

export default ManageUsersScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
        ...theme.typography.header,
        color: theme.colors.text,
        marginBottom: 20,
        marginTop: 10,
    },
    list: {
        paddingBottom: 20,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        padding: 15,
        borderRadius: 16,
        marginBottom: 15,
        ...theme.shadows.soft,
    },
    iconBox: {
        width: 45,
        height: 45,
        borderRadius: 12,
        backgroundColor: theme.colors.inputBackground,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    userInfo: {
        flex: 1,
    },
    username: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text,
    },
    adminBadge: {
        marginLeft: 8,
        backgroundColor: '#FFF8E1',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#FFC107',
    },
    adminBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#FF8F00',
    },
    email: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        marginVertical: 2,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 2,
    },
    actionBtn: {
        width: 38,
        height: 38,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatar: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        marginRight: 15
    },
    userId: {
        fontSize: 10,
        color: theme.colors.textSecondary,
        marginVertical: 2,
        fontFamily: 'monospace'
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6
    }
});

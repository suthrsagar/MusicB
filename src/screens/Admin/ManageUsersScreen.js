import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';

const BASE_URL = 'http://10.206.215.196:5000';

const ManageUsersScreen = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

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

            // Update local state
            setUsers(users.map(user =>
                user._id === id ? { ...user, isBanned: res.data.isBanned } : user
            ));

        } catch (err) {
            Alert.alert('Error', err.response?.data?.msg || 'Action failed');
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.userItem}>
            <View style={styles.userInfo}>
                <Text style={styles.username}>{item.username} {item.role === 'admin' ? '(Admin)' : ''}</Text>
                <Text style={styles.email}>{item.email}</Text>
                <Text style={[styles.status, { color: item.isBanned ? 'red' : 'green' }]}>
                    {item.isBanned ? 'Banned' : 'Active'}
                </Text>
            </View>

            {item.role !== 'admin' && (
                <TouchableOpacity
                    style={[styles.banButton, { backgroundColor: item.isBanned ? '#28a745' : '#dc3545' }]}
                    onPress={() => toggleBan(item._id, item.isBanned)}
                >
                    <Text style={styles.btnText}>{item.isBanned ? 'Unban' : 'Ban'}</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#007bff" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Manage Users</Text>
            <FlatList
                data={users}
                keyExtractor={item => item._id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
            />
        </View>
    );
};

export default ManageUsersScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
    },
    list: {
        paddingBottom: 20,
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        elevation: 2,
    },
    userInfo: {
        flex: 1,
    },
    username: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    email: {
        fontSize: 14,
        color: '#666',
        marginVertical: 2,
    },
    status: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    banButton: {
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 6,
    },
    btnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
});

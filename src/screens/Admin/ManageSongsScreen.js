import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, Alert, StatusBar } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../../theme';

const BASE_URL = 'http://10.206.215.196:5000';

const ManageSongsScreen = () => {
    const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'all'
    const [songs, setSongs] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchSongs = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            let url = `${BASE_URL}/api/song`; // Public approved songs

            if (activeTab === 'pending') {
                url = `${BASE_URL}/api/admin/songs/pending`;
            }

            const res = await axios.get(url, {
                headers: { 'x-auth-token': token }
            });
            setSongs(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to fetch songs');
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchSongs();
        }, [activeTab])
    );

    const approveSong = async (id) => {
        try {
            const token = await AsyncStorage.getItem('token');
            await axios.put(`${BASE_URL}/api/admin/songs/${id}/approve`, {}, {
                headers: { 'x-auth-token': token }
            });
            Alert.alert('Success', 'Song Approved');
            setSongs(songs.filter(s => s._id !== id));
        } catch (err) {
            Alert.alert('Error', err.response?.data?.msg || 'Approval failed');
        }
    };

    const deleteSong = async (id, isReject = false) => {
        Alert.alert(
            isReject ? 'Reject Song' : 'Delete Song',
            `Are you sure you want to ${isReject ? 'REJECT' : 'delete'} this song?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: isReject ? 'Reject' : 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem('token');
                            await axios.delete(`${BASE_URL}/api/admin/songs/${id}`, {
                                headers: { 'x-auth-token': token }
                            });

                            Alert.alert('Success', isReject ? 'Song Rejected' : 'Song deleted');
                            setSongs(songs.filter(song => song._id !== id));
                        } catch (err) {
                            Alert.alert('Error', err.response?.data?.msg || 'Action failed');
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }) => (
        <View style={styles.songCard}>
            <View style={[styles.iconBox, { backgroundColor: item.status === 'pending' ? '#FFC107' : theme.colors.success }]}>
                <Ionicons name="musical-note" size={20} color="#fff" />
            </View>
            <View style={styles.songInfo}>
                <Text style={styles.songTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.artistName} numberOfLines={1}>{item.artist}</Text>
                {item.uploader && (
                    <Text style={styles.uploader}>By: {item.uploader.username || 'Unknown'}</Text>
                )}
            </View>

            <View style={styles.actions}>
                {activeTab === 'pending' && (
                    <TouchableOpacity onPress={() => approveSong(item._id)} style={styles.actionBtn}>
                        <Ionicons name="checkmark-circle" size={30} color={theme.colors.success} />
                    </TouchableOpacity>
                )}

                <TouchableOpacity onPress={() => deleteSong(item._id, activeTab === 'pending')}>
                    <Ionicons name={activeTab === 'pending' ? "close-circle" : "trash"} size={30} color={theme.colors.error} />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
            <Text style={styles.header}>Manage Songs</Text>

            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
                    onPress={() => setActiveTab('pending')}
                >
                    <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>Pending</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'all' && styles.activeTab]}
                    onPress={() => setActiveTab('all')}
                >
                    <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>Approved</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={songs}
                    keyExtractor={item => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Ionicons name="musical-notes-outline" size={50} color={theme.colors.border} />
                            <Text style={styles.emptyText}>No songs found</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

export default ManageSongsScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        padding: 20,
    },
    header: {
        ...theme.typography.header,
        color: theme.colors.text,
        marginBottom: 20,
        marginTop: 10,
    },
    tabs: {
        flexDirection: 'row',
        padding: 5,
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        marginBottom: 20,
        ...theme.shadows.soft,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeTab: {
        backgroundColor: theme.colors.background, // Or a light primary tint
    },
    tabText: {
        color: theme.colors.textSecondary,
        fontWeight: '600',
    },
    activeTabText: {
        color: theme.colors.primary,
        fontWeight: 'bold',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
    list: {
        paddingBottom: 40,
    },
    songCard: {
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
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    songInfo: {
        flex: 1,
    },
    songTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text,
    },
    artistName: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
    uploader: {
        fontSize: 12,
        color: theme.colors.border,
        marginTop: 2,
        fontStyle: 'italic',
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionBtn: {
        marginRight: 15,
    },
    emptyText: {
        fontSize: 16,
        color: theme.colors.textSecondary,
        marginTop: 10,
    }
});

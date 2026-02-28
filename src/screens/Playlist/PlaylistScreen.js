import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, StatusBar, FlatList, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { theme } from '../../theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { BASE_URL } from '../../services/apiConfig';

const PlaylistScreen = ({ navigation }) => {
    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [creating, setCreating] = useState(false);

    const fetchPlaylists = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }
            const res = await axios.get(`${BASE_URL}/api/playlist/me`, {
                headers: { 'x-auth-token': token }
            });
            setPlaylists(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchPlaylists();
        }, [])
    );

    const createPlaylist = async () => {
        if (!newPlaylistName.trim()) return;
        setCreating(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await axios.post(`${BASE_URL}/api/playlist/create`,
                { name: newPlaylistName, isPrivate: true },
                { headers: { 'x-auth-token': token } }
            );
            setPlaylists([res.data, ...playlists]);
            setModalVisible(false);
            setNewPlaylistName('');
        } catch (error) {
            Alert.alert('Error', 'Could not create playlist');
        } finally {
            setCreating(false);
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.playlistItem}
            onPress={() => navigation.navigate('PlaylistDetailScreen', { playlistId: item._id })}
        >
            <View style={styles.iconBox}>
                <Ionicons name="musical-note" size={30} color="#fff" />
            </View>
            <View style={styles.info}>
                <Text style={styles.playlistName}>{item.name}</Text>
                <Text style={styles.songCount}>{item.songs?.length || 0} Songs</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Playlists</Text>
                <TouchableOpacity style={styles.createBtn} onPress={() => setModalVisible(true)}>
                    <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : playlists.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="musical-notes-outline" size={80} color={theme.colors.textSecondary} />
                    <Text style={styles.emptyText}>No playlists yet.</Text>
                    <Text style={styles.subText}>Create your first playlist and start vibing!</Text>
                    <TouchableOpacity style={styles.createMainBtn} onPress={() => setModalVisible(true)}>
                        <Text style={styles.btnText}>Create Playlist</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={playlists}
                    renderItem={renderItem}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}


            <Modal
                transparent={true}
                visible={modalVisible}
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>New Playlist</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Playlist Name"
                            value={newPlaylistName}
                            onChangeText={setNewPlaylistName}
                            autoFocus
                        />
                        <View style={styles.modalBtnRow}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.saveBtn}
                                onPress={createPlaylist}
                                disabled={creating || !newPlaylistName.trim()}
                            >
                                {creating ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Create</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default PlaylistScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        padding: 20
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 10
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: theme.colors.text
    },
    createBtn: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadows.medium
    },
    listContent: {
        paddingBottom: 100
    },
    playlistItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        padding: 15,
        marginBottom: 15,
        borderRadius: 16,
        ...theme.shadows.soft
    },
    iconBox: {
        width: 50,
        height: 50,
        borderRadius: 12,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15
    },
    info: {
        flex: 1
    },
    playlistName: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text
    },
    songCount: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginTop: 2
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 0.8
    },
    emptyText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginTop: 20
    },
    subText: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginTop: 10,
        marginBottom: 30
    },
    createMainBtn: {
        paddingVertical: 12,
        paddingHorizontal: 30,
        backgroundColor: theme.colors.primary,
        borderRadius: 25,
        ...theme.shadows.medium
    },
    btnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 40
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        elevation: 10
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        color: theme.colors.text
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        padding: 12,
        marginBottom: 20,
        fontSize: 16,
        color: theme.colors.text
    },
    modalBtnRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center'
    },
    cancelBtn: {
        marginRight: 20,
        padding: 10
    },
    cancelText: {
        color: theme.colors.textSecondary,
        fontWeight: '600'
    },
    saveBtn: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 10
    },
    saveText: {
        color: '#fff',
        fontWeight: 'bold'
    }
});

import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, StatusBar, Modal, TextInput, Image } from 'react-native';
import axios from 'axios';
import { launchImageLibrary } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import TrackPlayer from 'react-native-track-player';
import { theme } from '../../theme';

import { BASE_URL } from '../../services/apiConfig';
import PremiumLoader from '../../components/PremiumLoader';

const ManageSongsScreen = () => {
    const [activeTab, setActiveTab] = useState('pending');
    const [songs, setSongs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [playingId, setPlayingId] = useState(null);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingSong, setEditingSong] = useState(null);
    const [editingImage, setEditingImage] = useState(null);

    const fetchSongs = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            let url = `${BASE_URL}/api/song`;

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

    const playPreview = async (item) => {
        if (playingId === item._id) {
            await TrackPlayer.reset();
            setPlayingId(null);
        } else {
            try {
                await TrackPlayer.reset();
                const url = `${BASE_URL}/api/song/stream/${item.fileId}`;
                await TrackPlayer.add({
                    id: item._id,
                    url: url,
                    title: item.title,
                    artist: item.artist
                });
                await TrackPlayer.play();
                setPlayingId(item._id);
            } catch (e) {
                console.log('Audio Error', e);
                Alert.alert('Error', 'Cannot play audio');
            }
        }
    };

    const openEdit = (item) => {
        setEditingSong({ ...item });
        setEditingImage(item.coverImage ? { uri: item.coverImage } : null);
        setEditModalVisible(true);
    };

    const handlePickImage = () => {
        launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, res => {
            if (res.didCancel) return;
            if (res.assets?.length) {
                setEditingImage(res.assets[0]);
            }
        });
    };

    const saveEdit = async () => {
        if (!editingSong) return;
        try {
            const token = await AsyncStorage.getItem('token');
            const formData = new FormData();
            formData.append('title', editingSong.title);
            formData.append('artist', editingSong.artist);
            formData.append('album', editingSong.album);
            formData.append('genre', editingSong.genre);

            if (editingImage && editingImage.uri && !editingImage.uri.startsWith('http')) {
                formData.append('coverImage', {
                    uri: editingImage.uri,
                    type: editingImage.type || 'image/jpeg',
                    name: editingImage.fileName || 'cover.jpg'
                });
            }

            const res = await axios.put(`${BASE_URL}/api/admin/songs/${editingSong._id}`, formData, {
                headers: {
                    'x-auth-token': token,
                    'Content-Type': 'multipart/form-data'
                }
            });
            Alert.alert('Success', 'Song updated');
            setEditModalVisible(false);
            setSongs(songs.map(s => s._id === editingSong._id ? res.data.song : s));
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Update failed');
        }
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

                <TouchableOpacity onPress={() => playPreview(item)} style={styles.actionBtn}>
                    <Ionicons name={playingId === item._id ? "pause-circle" : "play-circle"} size={30} color={theme.colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => openEdit(item)} style={styles.actionBtn}>
                    <Ionicons name="create" size={30} color={theme.colors.text} />
                </TouchableOpacity>

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
                    <PremiumLoader size={50} />
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

            <Modal
                visible={editModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Edit Song</Text>

                        <Text style={styles.modalTitle}>Edit Song</Text>

                        {editingSong && (
                            <>
                                <TouchableOpacity onPress={handlePickImage} style={styles.imagePicker}>
                                    {editingImage ? (
                                        <Image source={{ uri: editingImage.uri }} style={styles.previewImage} />
                                    ) : (
                                        <View style={styles.placeholderImage}>
                                            <Ionicons name="camera" size={30} color={theme.colors.textSecondary} />
                                            <Text style={styles.placeholderText}>Change Cover</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                                <Text style={styles.label}>Title</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editingSong.title}
                                    onChangeText={(text) => setEditingSong({ ...editingSong, title: text })}
                                />

                                <Text style={styles.label}>Artist</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editingSong.artist}
                                    onChangeText={(text) => setEditingSong({ ...editingSong, artist: text })}
                                />

                                <Text style={styles.label}>Album</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editingSong.album}
                                    onChangeText={(text) => setEditingSong({ ...editingSong, album: text })}
                                />

                                <Text style={styles.label}>Genre</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editingSong.genre}
                                    onChangeText={(text) => setEditingSong({ ...editingSong, genre: text })}
                                />

                                <View style={styles.modalActions}>
                                    <TouchableOpacity onPress={() => setEditModalVisible(false)} style={[styles.modalBtn, styles.cancelBtn]}>
                                        <Text style={styles.modalBtnText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={saveEdit} style={[styles.modalBtn, styles.saveBtn]}>
                                        <Text style={styles.modalBtnText}>Save</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </View >
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
        backgroundColor: theme.colors.background,
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
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20
    },
    modalContent: {
        backgroundColor: theme.colors.surface,
        borderRadius: 20,
        padding: 20,
        elevation: 5
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 20,
        textAlign: 'center'
    },
    label: {
        color: theme.colors.textSecondary,
        fontSize: 12,
        marginBottom: 5,
        marginLeft: 5
    },
    input: {
        backgroundColor: theme.colors.background,
        color: theme.colors.text,
        borderRadius: 10,
        padding: 12,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: theme.colors.border
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10
    },
    modalBtn: {
        flex: 1,
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginHorizontal: 5
    },
    cancelBtn: {
        backgroundColor: theme.colors.error
    },
    saveBtn: {
        backgroundColor: theme.colors.success
    },
    modalBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16
    },
    imagePicker: {
        alignSelf: 'center',
        marginBottom: 20,
    },
    previewImage: {
        width: 100,
        height: 100,
        borderRadius: 10,
    },
    placeholderImage: {
        width: 100,
        height: 100,
        borderRadius: 10,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderStyle: 'dashed'
    },
    placeholderText: {
        fontSize: 10,
        color: theme.colors.textSecondary,
        marginTop: 5
    }
});

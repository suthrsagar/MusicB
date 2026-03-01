import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../../theme';
import { useMusic } from '../../context/MusicContext';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PremiumLoader from '../../components/PremiumLoader';
import CustomAlert from '../../components/CustomAlert';
import RealisticLoader from '../../components/RealisticLoader';

import { useIsFocused } from '@react-navigation/native';

const DownloadScreen = ({ navigation }) => {
    const { playSong } = useMusic();
    const [downloadedSongs, setDownloadedSongs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'info', onConfirm: null, cancelable: false });
    const isFocused = useIsFocused();

    const showAlert = (title, message, type = 'info', onConfirm = null, cancelable = false) => {
        setAlertConfig({ visible: true, title, message, type, onConfirm, cancelable });
    };

    useEffect(() => {
        if (isFocused) {
            fetchDownloadedSongs();
        }
    }, [isFocused]);

    const fetchDownloadedSongs = async () => {
        try {
            setLoading(true);
            const storedDownloads = await AsyncStorage.getItem('downloadedSongs');
            if (storedDownloads) {
                setDownloadedSongs(JSON.parse(storedDownloads));
            }
        } catch (error) {
            console.error("Failed to load downloads", error);
            showAlert('Error', 'Failed to load your offline library.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.itemContainer}
            onPress={() => playSong(item, downloadedSongs)}
        >
            <View style={styles.artwork}>
                {item.coverImage ? (
                    <Image source={{ uri: item.coverImage }} style={styles.image} />
                ) : (
                    <Ionicons name="musical-note" size={24} color="#fff" />
                )}
            </View>
            <View style={styles.info}>
                <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.artist}>{item.artist}</Text>
            </View>
            <TouchableOpacity onPress={() => showAlert(
                'Delete Song',
                `Remove "${item.title}" from your downloads?`,
                'warning',
                () => deleteDownload(item.id),
                true
            )}>
                <Ionicons name="trash-outline" size={24} color={theme.colors.error} />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    const deleteDownload = async (id) => {
        try {
            const storedDownloads = await AsyncStorage.getItem('downloadedSongs');
            if (storedDownloads) {
                const downloads = JSON.parse(storedDownloads);
                const songToDelete = downloads.find(d => d.id === id);

                if (songToDelete && songToDelete.filePath) {
                    const fileExists = await RNFS.exists(songToDelete.filePath);
                    if (fileExists) {
                        await RNFS.unlink(songToDelete.filePath);
                    }
                }

                const updatedDownloads = downloads.filter(d => d.id !== id);
                await AsyncStorage.setItem('downloadedSongs', JSON.stringify(updatedDownloads));
                setDownloadedSongs(updatedDownloads);

                showAlert("Deleted", "Song removed from downloads.", "success");
            }
        } catch (error) {
            console.error("Failed to delete song", error);
            showAlert("Error", "Could not delete the song.", "error");
        }
    };

    if (loading) {
<<<<<<< HEAD
        return <RealisticLoader message="Exploring Offline..." />;
=======
        return (
            <View style={styles.loaderContainer}>
                <PremiumLoader size={60} />
            </View>
        );
>>>>>>> a0c6e9f
    }

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Downloads</Text>
            {downloadedSongs.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="cloud-download-outline" size={60} color={theme.colors.textSecondary} />
                    <Text style={styles.emptyText}>No downloads yet</Text>
                </View>
            ) : (
                <FlatList
                    data={downloadedSongs}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                />
            )}
            <CustomAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                confirmText={alertConfig.cancelable ? "Delete" : "OK"}
                onClose={() => {
                    setAlertConfig({ ...alertConfig, visible: false });
                    if (alertConfig.onConfirm) alertConfig.onConfirm();
                }}
                onCancel={alertConfig.cancelable ? () => setAlertConfig({ ...alertConfig, visible: false }) : null}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        padding: 20
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 20,
        marginTop: 50,
        paddingHorizontal: 20,
    },
    list: {
        paddingBottom: 100,
        paddingHorizontal: 20,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 12,
        borderRadius: 18,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    artwork: {
        width: 50,
        height: 50,
        borderRadius: 8,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
        overflow: 'hidden'
    },
    image: {
        width: '100%',
        height: '100%'
    },
    info: {
        flex: 1
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text
    },
    artist: {
        fontSize: 14,
        color: theme.colors.textSecondary
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    emptyText: {
        marginTop: 10,
        color: theme.colors.textSecondary,
        fontSize: 16
    }
});

export default DownloadScreen;

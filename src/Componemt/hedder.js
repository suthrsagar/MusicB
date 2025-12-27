import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { theme } from '../theme';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { BASE_URL } from '../services/apiConfig';

const Header = () => {
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const [hasUnread, setHasUnread] = useState(false);

    const checkNotifications = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/api/notifications`);
            const notifications = res.data;

            if (notifications.length > 0) {
                const lastReadTime = await AsyncStorage.getItem('lastReadNotificationTime');
                const latestNotifTime = new Date(notifications[0].createdAt).getTime();

                if (!lastReadTime || latestNotifTime > new Date(lastReadTime).getTime()) {
                    setHasUnread(true);
                } else {
                    setHasUnread(false);
                }
            } else {
                setHasUnread(false);
            }
        } catch (err) {
            console.error('Failed to check notifications', err);
        }
    };

    useEffect(() => {
        if (isFocused) {
            checkNotifications();
        }
    }, [isFocused]);

    return (
        <SafeAreaView style={{ backgroundColor: theme.colors.surface, elevation: 5, zIndex: 100 }}>
            <View style={styles.container}>
                <View style={styles.logoContainer}>
                    <View style={styles.logoIcon}>
                        <Icon name="musical-notes" size={20} color="#fff" />
                    </View>
                    <View>
                        <Text style={styles.appName}>MusicZ</Text>
                        <Text style={styles.appTagline}>Premium Music</Text>
                    </View>
                </View>

                <View style={styles.rightIcons}>
                    <TouchableOpacity style={[styles.iconBtn, { marginRight: 15 }]} onPress={() => navigation.navigate('Search')}>
                        <Icon name="search-outline" size={24} color={theme.colors.text} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('NotificationScreen')}>
                        <Icon name="notifications-outline" size={24} color={theme.colors.text} />
                        {hasUnread && <View style={styles.badge} />}
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',

        paddingHorizontal: 24,
        paddingVertical: 30,
        backgroundColor: theme.colors.surface,

    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        ...theme.shadows.soft
    },
    appName: {
        fontSize: 20,
        fontWeight: '800',
        color: theme.colors.text,
        lineHeight: 24,
    },
    appTagline: {
        fontSize: 10,
        fontWeight: '600',
        color: theme.colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    iconBtn: {
        width: 45,
        height: 45,
        borderRadius: 12,
        backgroundColor: theme.colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: 8,
        right: 10,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: theme.colors.error,
        borderWidth: 1.5,
        borderColor: theme.colors.surface,
    },
    rightIcons: {
        flexDirection: 'row',
        alignItems: 'center'
    }
});

export default Header;
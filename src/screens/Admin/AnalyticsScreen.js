import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, StatusBar, Dimensions } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../../theme';
import { useNavigation } from '@react-navigation/native';

import { BASE_URL } from '../../services/apiConfig';
import PremiumLoader from '../../components/PremiumLoader';
const screenWidth = Dimensions.get('window').width;

const AnalyticsScreen = () => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    const fetchAnalytics = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await axios.get(`${BASE_URL}/api/analytics/dashboard`, {
                headers: { 'x-auth-token': token }
            });
            setData(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    if (loading) {
        return (
            <View style={styles.center}>
                <PremiumLoader size={60} />
            </View>
        );
    }

    if (!data) return null;

    const { overview, topSongs } = data;

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />


            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Analytics Dashboard</Text>
                <View style={{ width: 24 }} />
            </View>


            <View style={styles.grid}>
                <View style={styles.card}>
                    <Text style={styles.cardLabel}>Total Users</Text>
                    <Text style={styles.cardNumber}>{overview.totalUsers}</Text>
                    <Ionicons name="people" size={20} color={theme.colors.primary} style={styles.cardIcon} />
                </View>
                <View style={styles.card}>
                    <Text style={styles.cardLabel}>Total Songs</Text>
                    <Text style={styles.cardNumber}>{overview.totalSongs}</Text>
                    <Ionicons name="musical-notes" size={20} color="#00C853" style={styles.cardIcon} />
                </View>
                <View style={styles.card}>
                    <Text style={styles.cardLabel}>Total Streams</Text>
                    <Text style={styles.cardNumber}>{overview.totalStreams}</Text>
                    <Ionicons name="play-circle" size={20} color="#FFD600" style={styles.cardIcon} />
                </View>
                <View style={styles.card}>
                    <Text style={styles.cardLabel}>Premium Users</Text>
                    <Text style={styles.cardNumber}>{overview.premiumUsers}</Text>
                    <Ionicons name="star" size={20} color="#FFAB00" style={styles.cardIcon} />
                </View>
            </View>


            <View style={styles.revenueBox}>
                <View>
                    <Text style={{ color: '#fff', opacity: 0.8, fontSize: 14 }}>Est. Subscription Revenue</Text>
                    <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold' }}>₹{overview.premiumUsers * 99}</Text>
                    <Text style={{ color: '#fff', opacity: 0.6, fontSize: 12 }}>(Approx based on ₹99/mo)</Text>
                </View>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <Ionicons name="cash-outline" size={28} color="#fff" />
                </View>
            </View>


            <Text style={styles.sectionTitle}>Top Performing Songs</Text>
            <View style={styles.listCard}>
                {topSongs.map((song, index) => (
                    <View key={index} style={styles.songItem}>
                        <View style={styles.rankBadge}>
                            <Text style={styles.rankText}>#{index + 1}</Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 15 }}>
                            <Text style={styles.songTitle} numberOfLines={1}>{song.title}</Text>
                            <Text style={styles.songArtist}>{song.artist}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.streamCount}>{song.viewsCount}</Text>
                            <Text style={{ fontSize: 10, color: theme.colors.textSecondary }}>Streams</Text>
                        </View>
                    </View>
                ))}
                {topSongs.length === 0 && <Text style={{ textAlign: 'center', color: theme.colors.textSecondary }}>No data yet</Text>}
            </View>

        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: theme.colors.background,
        padding: 20
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20
    },
    card: {
        width: '48%',
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        padding: 15,
        marginBottom: 15,
        ...theme.shadows.soft,
        position: 'relative'
    },
    cardLabel: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginBottom: 5
    },
    cardNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text
    },
    cardIcon: {
        position: 'absolute',
        top: 15,
        right: 15,
        opacity: 0.5
    },
    revenueBox: {
        backgroundColor: theme.colors.primary,
        borderRadius: 20,
        padding: 25,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
        ...theme.shadows.medium
    },
    iconBox: {
        width: 50,
        height: 50,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center'
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 15
    },
    listCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        padding: 20,
        ...theme.shadows.soft
    },
    songItem: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        paddingVertical: 12
    },
    rankBadge: {
        backgroundColor: theme.colors.background,
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center'
    },
    rankText: {
        fontWeight: 'bold',
        color: theme.colors.primary,
        fontSize: 12
    },
    songTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text
    },
    songArtist: {
        fontSize: 12,
        color: theme.colors.textSecondary
    },
    streamCount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text
    }
});

export default AnalyticsScreen;

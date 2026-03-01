import React, { useState, useEffect } from 'react';
import { View, Text, Switch, TextInput, TouchableOpacity, ScrollView, StyleSheet, StatusBar, Alert, FlatList, Modal } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../../theme';
import { useNavigation } from '@react-navigation/native';
import PremiumLoader from '../../components/PremiumLoader';

import { BASE_URL } from '../../services/apiConfig';

const MonetizationScreen = () => {
    const navigation = useNavigation();
    const [activeTab, setActiveTab] = useState('ads');
    const [loading, setLoading] = useState(false);


    const [adConfig, setAdConfig] = useState(null);


    const [plans, setPlans] = useState([]);
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [newPlan, setNewPlan] = useState({ name: '', price: '', durationDays: '' });


    const [payouts, setPayouts] = useState([]);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const headers = { 'x-auth-token': token };

            if (activeTab === 'ads') {
                const res = await axios.get(`${BASE_URL}/api/monetization/ads`, { headers: headers || {} });

                setAdConfig(res.data);
            } else if (activeTab === 'plans') {
                const res = await axios.get(`${BASE_URL}/api/monetization/plans`);
                setPlans(res.data);
            } else if (activeTab === 'payouts') {
                const res = await axios.get(`${BASE_URL}/api/monetization/payouts`, { headers });
                setPayouts(res.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };


    const toggleAdMaster = async (val) => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await axios.post(`${BASE_URL}/api/monetization/ads`,
                { isEnabled: val },
                { headers: { 'x-auth-token': token } }
            );
            setAdConfig(res.data);
        } catch (err) { Alert.alert('Error', 'Failed to update'); }
    };


    const createPlan = async () => {
        if (!newPlan.name || !newPlan.price || !newPlan.durationDays) return Alert.alert('Error', 'Fill all fields');
        try {
            const token = await AsyncStorage.getItem('token');
            await axios.post(`${BASE_URL}/api/monetization/plans`,
                { ...newPlan, price: Number(newPlan.price), durationDays: Number(newPlan.durationDays) },
                { headers: { 'x-auth-token': token } }
            );
            Alert.alert('Success', 'Plan Created');
            setShowPlanModal(false);
            setNewPlan({ name: '', price: '', durationDays: '' });
            fetchData();
        } catch (err) { Alert.alert('Error', 'Failed to create plan'); }
    };


    const handlePayoutAction = async (id, status) => {
        try {
            const token = await AsyncStorage.getItem('token');
            await axios.put(`${BASE_URL}/api/monetization/payouts/${id}`,
                { status },
                { headers: { 'x-auth-token': token } }
            );
            fetchData();
        } catch (err) { Alert.alert('Error', 'Action failed'); }
    };


    const renderTabs = () => (
        <View style={styles.tabContainer}>
            {['ads', 'plans', 'payouts'].map((tab) => (
                <TouchableOpacity
                    key={tab}
                    style={[styles.tab, activeTab === tab && styles.activeTab]}
                    onPress={() => setActiveTab(tab)}
                >
                    <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                        {tab === 'ads' ? 'Ads Manager' : tab === 'plans' ? 'Sub. Plans' : 'Artist Payouts'}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    const renderAdsView = () => (
        <View>
            <View style={styles.card}>
                <View style={styles.row}>
                    <View>
                        <Text style={styles.cardTitle}>Global Ads Switch</Text>
                        <Text style={styles.cardSub}>Turn off to disable all ads in app</Text>
                    </View>
                    <Switch
                        value={adConfig?.isEnabled || false}
                        onValueChange={toggleAdMaster}
                        trackColor={{ true: theme.colors.primary, false: '#ccc' }}
                    />
                </View>
            </View>

            <Text style={styles.sectionHeader}>Placements (Read-Only Demo)</Text>
            <View style={styles.card}>
                <Text style={{ marginBottom: 10, color: theme.colors.textSecondary }}>Detailed placement controls coming soon...</Text>
                {adConfig?.placements && Object.entries(adConfig.placements).map(([key, val]) => (
                    <View key={key} style={styles.rowSmall}>
                        <Text style={{ textTransform: 'capitalize', color: theme.colors.text }}>{key.replace(/([A-Z])/g, ' $1')}</Text>
                        <Ionicons name={val ? "checkmark-circle" : "close-circle"} color={val ? "green" : "red"} size={20} />
                    </View>
                ))}
            </View>
        </View>
    );

    const renderPlansView = () => (
        <View>
            <TouchableOpacity style={styles.createBtn} onPress={() => setShowPlanModal(true)}>
                <Ionicons name="add" color="#fff" size={20} />
                <Text style={{ color: '#fff', fontWeight: 'bold', marginLeft: 5 }}>Create New Plan</Text>
            </TouchableOpacity>

            {plans.map((item) => (
                <View key={item._id} style={styles.planCard}>
                    <View>
                        <Text style={styles.planName}>{item.name}</Text>
                        <Text style={styles.planPrice}>₹{item.price} / {item.durationDays} days</Text>
                    </View>
                    <View style={styles.badge}>
                        <Text style={{ color: theme.colors.primary, fontSize: 12, fontWeight: 'bold' }}>Active</Text>
                    </View>
                </View>
            ))}
        </View>
    );

    const renderPayoutsView = () => (
        <View>
            {payouts.length === 0 && <Text style={{ textAlign: 'center', marginTop: 20, color: theme.colors.textSecondary }}>No Payout Requests</Text>}
            {payouts.map((item) => (
                <View key={item._id} style={styles.planCard}>
                    <View>
                        <Text style={styles.planName}>₹{item.amount}</Text>
                        <Text style={styles.planPrice}>Artist: {item.artist?.username || 'Unknown'}</Text>
                        <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>{new Date(item.requestDate).toLocaleDateString()}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        {item.status === 'pending' ? (
                            <View style={{ flexDirection: 'row' }}>
                                <TouchableOpacity onPress={() => handlePayoutAction(item._id, 'paid')} style={[styles.actionBtn, { backgroundColor: 'green', marginRight: 10 }]}>
                                    <Ionicons name="checkmark" color="#fff" size={16} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handlePayoutAction(item._id, 'rejected')} style={[styles.actionBtn, { backgroundColor: 'red' }]}>
                                    <Ionicons name="close" color="#fff" size={16} />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <Text style={{ fontWeight: 'bold', color: item.status === 'paid' ? 'green' : 'red', textTransform: 'capitalize' }}>{item.status}</Text>
                        )}
                    </View>
                </View>
            ))}
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 5 }}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Monetization</Text>
                <View style={{ width: 30 }} />
            </View>

            {renderTabs()}

            <ScrollView contentContainerStyle={{ padding: 20 }}>
                {loading ? <View style={{ alignItems: 'center' }}><PremiumLoader size={40} /></View> : (
                    <>
                        {activeTab === 'ads' && renderAdsView()}
                        {activeTab === 'plans' && renderPlansView()}
                        {activeTab === 'payouts' && renderPayoutsView()}
                    </>
                )}
            </ScrollView>

            <Modal visible={showPlanModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>New Subscription Plan</Text>

                        <TextInput style={styles.input} placeholder="Plan Name (e.g. Premium Monthly)" value={newPlan.name} onChangeText={t => setNewPlan({ ...newPlan, name: t })} />
                        <TextInput style={styles.input} placeholder="Price (₹)" keyboardType="numeric" value={newPlan.price} onChangeText={t => setNewPlan({ ...newPlan, price: t })} />
                        <TextInput style={styles.input} placeholder="Duration (Days)" keyboardType="numeric" value={newPlan.durationDays} onChangeText={t => setNewPlan({ ...newPlan, durationDays: t })} />

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
                            <TouchableOpacity onPress={() => setShowPlanModal(false)} style={[styles.modalBtn, { backgroundColor: '#ccc' }]}>
                                <Text>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={createPlan} style={[styles.modalBtn, { backgroundColor: theme.colors.primary }]}>
                                <Text style={{ color: '#fff' }}>Create</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: theme.colors.surface },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: theme.colors.text },
    tabContainer: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 10 },
    tab: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 20, backgroundColor: theme.colors.background, marginRight: 10, borderWidth: 1, borderColor: theme.colors.border },
    activeTab: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    tabText: { color: theme.colors.text, fontWeight: '600' },
    activeTabText: { color: '#fff' },

    card: { backgroundColor: theme.colors.surface, padding: 20, borderRadius: 16, marginBottom: 20, ...theme.shadows.soft },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    rowSmall: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: theme.colors.text },
    cardSub: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 5 },
    sectionHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: theme.colors.text },

    createBtn: { flexDirection: 'row', backgroundColor: theme.colors.primary, padding: 15, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    planCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.colors.surface, padding: 15, borderRadius: 12, marginBottom: 10, ...theme.shadows.soft },
    planName: { fontWeight: 'bold', fontSize: 16, color: theme.colors.text },
    planPrice: { color: theme.colors.textSecondary, marginTop: 4 },
    badge: { backgroundColor: '#E3F2FD', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },

    actionBtn: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, color: theme.colors.text, textAlign: 'center' },
    input: { backgroundColor: '#f5f5f5', borderRadius: 10, padding: 12, marginBottom: 15, color: theme.colors.text },
    modalBtn: { paddingVertical: 12, paddingHorizontal: 25, borderRadius: 10 }
});

export default MonetizationScreen;

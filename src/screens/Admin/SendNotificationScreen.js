import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, StatusBar, ScrollView } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../../theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const BASE_URL = 'http://10.206.215.196:5000';

const SendNotificationScreen = () => {
    const navigation = useNavigation();
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if (!title || !message) {
            Alert.alert('Required', 'Please enter title and message');
            return;
        }

        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            await axios.post(`${BASE_URL}/api/notifications`, { title, message }, {
                headers: { 'x-auth-token': token }
            });
            Alert.alert('Success', 'Notification Sent!');
            setTitle('');
            setMessage('');
            navigation.goBack();
        } catch (err) {
            console.error(err);
            Alert.alert('Error', err.response?.data?.msg || 'Failed to send');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 5 }}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Send Notification</Text>
                <View style={{ width: 30 }} />
            </View>

            <View style={styles.form}>
                <Text style={styles.label}>Title</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter notification title"
                    value={title}
                    onChangeText={setTitle}
                />

                <Text style={styles.label}>Message</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Enter your message here..."
                    value={message}
                    onChangeText={setMessage}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                />

                <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : (
                        <>
                            <Ionicons name="send" size={20} color="#fff" style={{ marginRight: 10 }} />
                            <Text style={styles.btnText}>Send Notification</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

export default SendNotificationScreen;

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        backgroundColor: theme.colors.surface,
        marginBottom: 20
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text
    },
    form: {
        padding: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 8,
    },
    input: {
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: 15,
        fontSize: 16,
        color: theme.colors.text,
        marginBottom: 20,
        ...theme.shadows.soft
    },
    textArea: {
        height: 120,
    },
    sendBtn: {
        flexDirection: 'row',
        backgroundColor: theme.colors.primary,
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.medium,
        marginTop: 10
    },
    btnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
    },
});

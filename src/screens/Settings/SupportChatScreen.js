import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    StatusBar,
    Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { theme } from '../../theme';
import { BASE_URL } from '../../services/apiConfig';
import Ionicons from 'react-native-vector-icons/Ionicons';

const SupportChatScreen = ({ navigation }) => {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const flatListRef = useRef(null);

    useEffect(() => {
        fetchChat();

        const interval = setInterval(fetchChat, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchChat = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;

            const res = await axios.get(`${BASE_URL}/api/support/my-chat`, {
                headers: { 'x-auth-token': token }
            });

            if (res.data && res.data.messages) {

                setMessages(res.data.messages);
            }
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const sendMessage = async () => {
        if (!inputText.trim()) return;

        const tempMsg = {
            sender: 'user',
            text: inputText,
            createdAt: new Date().toISOString(),
            _temp: true
        };


        setMessages(prev => [...prev, tempMsg]);
        setInputText('');
        setSending(true);

        try {
            const token = await AsyncStorage.getItem('token');
            await axios.post(`${BASE_URL}/api/support/send`, { text: tempMsg.text }, {
                headers: { 'x-auth-token': token }
            });
            fetchChat();
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Message not sent');
        } finally {
            setSending(false);
        }
    };

    const renderItem = ({ item }) => {
        const isUser = item.sender === 'user';
        return (
            <View style={[
                styles.msgRow,
                isUser ? styles.msgRowRight : styles.msgRowLeft
            ]}>
                {!isUser && (
                    <View style={styles.adminAvatar}>
                        <Ionicons name="headset" size={16} color="#fff" />
                    </View>
                )}
                <View style={[
                    styles.msgBubble,
                    isUser ? styles.bubbleRight : styles.bubbleLeft
                ]}>
                    <Text style={[
                        styles.msgText,
                        isUser ? styles.textRight : styles.textLeft
                    ]}>{item.text}</Text>
                    <Text style={[
                        styles.timeText,
                        isUser ? styles.timeRight : styles.timeLeft
                    ]}>
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Support Chat</Text>
                    <View style={styles.statusRow}>
                        <View style={styles.onlineDot} />
                        <Text style={styles.statusText}>We typically reply in 1 hour</Text>
                    </View>
                </View>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderItem}
                    keyExtractor={(item, index) => index.toString()}
                    contentContainerStyle={styles.listContent}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />
            )}

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Type your message..."
                    placeholderTextColor="#999"
                    value={inputText}
                    onChangeText={setInputText}
                    multiline
                />
                <TouchableOpacity
                    style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
                    onPress={sendMessage}
                    disabled={!inputText.trim() || sending}
                >
                    {sending ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Ionicons name="send" size={20} color="#fff" />
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

export default SupportChatScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: theme.colors.surface,
        ...theme.shadows.soft,
        zIndex: 1
    },
    backBtn: {
        marginRight: 15
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2
    },
    onlineDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#00C853',
        marginRight: 6
    },
    statusText: {
        fontSize: 12,
        color: theme.colors.textSecondary
    },
    listContent: {
        padding: 15,
        paddingBottom: 20
    },
    msgRow: {
        flexDirection: 'row',
        marginBottom: 15,
        alignItems: 'flex-end'
    },
    msgRowLeft: {
        justifyContent: 'flex-start'
    },
    msgRowRight: {
        justifyContent: 'flex-end'
    },
    adminAvatar: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        marginBottom: 2
    },
    msgBubble: {
        maxWidth: '75%',
        padding: 12,
        borderRadius: 18,
    },
    bubbleLeft: {
        backgroundColor: '#F0F0F0',
        borderBottomLeftRadius: 4
    },
    bubbleRight: {
        backgroundColor: theme.colors.primary,
        borderBottomRightRadius: 4
    },
    msgText: {
        fontSize: 15,
    },
    textLeft: {
        color: theme.colors.text
    },
    textRight: {
        color: '#fff'
    },
    timeText: {
        fontSize: 10,
        marginTop: 4,
        alignSelf: 'flex-end',
        opacity: 0.7
    },
    timeLeft: {
        color: theme.colors.textSecondary
    },
    timeRight: {
        color: 'rgba(255,255,255,0.8)'
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0'
    },
    input: {
        flex: 1,
        backgroundColor: '#F7F7F7',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        maxHeight: 100,
        marginRight: 10,
        color: theme.colors.text,
        fontSize: 16
    },
    sendBtn: {
        width: 45,
        height: 45,
        borderRadius: 23,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center'
    },
    sendBtnDisabled: {
        backgroundColor: '#CCC'
    }
});

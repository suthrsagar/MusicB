import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const Header = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.appName}>MusicZ</Text>
            <TouchableOpacity style={styles.appName}>
                <Icon name="notifications-outline" size={24} color="#000000ff" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 30,
        paddingVertical: 30,
        backgroundColor: '#ABE7B2',
        elevation: 4, // Shadow for Android
        shadowColor: '#000', // Shadow for iOS
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',

    },
    appName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000000',
        top: 10,
    },
});

export default Header;
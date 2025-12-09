import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import React from 'react'

const SettingsScreen = ({ navigation }) => {
  return (
    <View>
      <Text style={styles.text} >Account</Text>
      <TouchableOpacity
        style={styles.btn}
        onPress={() => navigation.navigate('ProfileScreen')}
        options={{
          heddershow: false,
        }} >
        <Text style={styles.btn}>Profile Settings</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.btn}

      >
        <Text style={styles.btn}>Notification Settings</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.btn}
      >
        <Text style={styles.btn}>Privacy Settings</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.btn}
      >
        <Text style={styles.btn}>Upload Songs</Text>
      </TouchableOpacity>

      <Text style={styles.text} >About</Text>
      <TouchableOpacity
        style={styles.btn}
      >
        <Text style={styles.btn}>Version 1.0.0</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.btn}
      >
        <Text style={styles.btn}>Rate Us</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.btn}
      >
        <Text style={styles.btn}>Share App</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.btn}
      >
        <Text style={styles.btn}>Deveploer
          <Text style={styles.name}> ( "Sagar Jangid" )</Text></Text>
      </TouchableOpacity>

    </View>
  )
}

export default SettingsScreen

const styles = StyleSheet.create({
  text: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 20,
    marginLeft: 10
  },
  btn: {
    fontSize: 15,
    color: '#000',
    marginTop: 10,
    marginLeft: 10,
    backgroundColor: '#e2dedeff',

    paddingVertical: 5,
    borderRadius: 10,
    width: 370,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,



  },
  name: {
    fontSize: 15,
    color: '#ff0404ce',
    marginTop: 10,
    marginLeft: 40,

  }
})
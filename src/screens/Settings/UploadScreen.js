import React, { useState } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import storage from '@react-native-firebase/storage';

const UploadScreen = () => {
  const [file, setFile] = useState(null);

  const pickAudioToUpload = async () => {
    try {
      const res = await DocumentPicker.pick({
        type: [DocumentPicker.types.audio],
      });
      setFile(res[0]);
      Alert.alert("Audio Selected", res[0].name);
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        Alert.alert("Cancelled", "No file selected");
      } else {
        Alert.alert("Error", err.message);
      }
    }
  };

  const uploadAudio = async () => {
    if (!file) {
      Alert.alert("No file", "Pick an audio file first");
      return;
    }

    const reference = storage().ref(`audios/${file.name}`);
    const task = reference.putFile(file.uri);

    task.on('state_changed', taskSnapshot => {
      console.log(`${taskSnapshot.bytesTransferred} transferred out of ${taskSnapshot.totalBytes}`);
    });

    task.then(() => {
      Alert.alert("Success", "Audio uploaded successfully");
      setFile(null);
    }).catch(err => {
      Alert.alert("Upload Error", err.message);
    });
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Upload Audio</Text>
      <Button title="Pick Audio" onPress={pickAudioToUpload} />
      <Button title="Upload Audio" onPress={uploadAudio} />
    </View>
  );
};

export default UploadScreen;

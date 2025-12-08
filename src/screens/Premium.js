import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  Animated,
  Easing
} from 'react-native';

const Premium = () => {
  const [showModal, setShowModal] = useState(true);
  const scaleAnim = useRef(new Animated.Value(0)).current; // initial scale 0

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
      tension: 100,
    }).start();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Premium</Text>
      <Text style={styles.subtitle}>Exclusive features are on the way...</Text>

      <Modal transparent visible={showModal} animationType="fade">
        <View style={styles.modalBackground}>
          <Animated.View style={[styles.modalBox, { transform: [{ scale: scaleAnim }] }]}>
            <Text style={styles.modalTitle}>Coming Soon</Text>
            <Text style={styles.modalText}>
              Premium features are under development...
            </Text>

            <TouchableOpacity
              style={styles.btn}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.btnText}>OK</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

export default Premium;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ECF4E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBox: {
    width: 280,
    padding: 20,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
  },
  btn: {
    marginTop: 15,
    backgroundColor: '#000',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
  },
});

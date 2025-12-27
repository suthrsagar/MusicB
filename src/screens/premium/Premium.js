import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Modal,
  Linking,
  Alert,
  TextInput
} from 'react-native';
import { theme } from '../../theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { BASE_URL } from '../../services/apiConfig';

const Premium = () => {
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [loading, setLoading] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [utr, setUtr] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const UPI_VPA = '8905730102@axl';
  const UPI_NAME = 'MusicZ Premium';

  const handleSubscribe = async () => {
    setLoading(true);
    const amount = selectedPlan === 'monthly' ? '99' : '999';
    const upiUrl = `upi://pay?pa=${UPI_VPA}&pn=${encodeURIComponent(UPI_NAME)}&am=${amount}&cu=INR`;

    try {
      await Linking.openURL(upiUrl);

      setLoading(false);
      setShowVerifyModal(true);
    } catch (err) {
      console.log('UPI Open Error:', err);
      Alert.alert(
        'Payment Options',
        `Could not launch UPI app automatically.\n\nPay manually to: ${UPI_VPA}`,
        [
          {
            text: 'Enter UTR',
            onPress: () => {
              setLoading(false);
              setShowVerifyModal(true);
            }
          },
          { text: 'Cancel', style: 'cancel', onPress: () => setLoading(false) }
        ]
      );
    }
  };

  const verifyPayment = async () => {
    if (!utr || utr.length < 10) {
      Alert.alert('Invalid UTR', 'Please enter a valid 12-digit Transaction ID/UTR.');
      return;
    }

    setVerifyLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');

      const res = await axios.post(`${BASE_URL}/api/payment/verify`,
        { utr, plan: selectedPlan },
        { headers: { 'x-auth-token': token } }
      );

      setShowVerifyModal(false);
      setShowSuccess(true);
      setUtr('');
    } catch (err) {
      console.error(err);
      Alert.alert('Verification Failed', err.response?.data?.msg || 'Could not verify payment');
    } finally {
      setVerifyLoading(false);
    }
  };

  const PlanCard = ({ type, price, duration, recommended }) => (
    <TouchableOpacity
      style={[
        styles.planCard,
        selectedPlan === type && styles.selectedCard
      ]}
      onPress={() => setSelectedPlan(type)}
      activeOpacity={0.9}
    >
      {recommended && (
        <View style={styles.recommendedBadge}>
          <Text style={styles.recommendedText}>Best Value</Text>
        </View>
      )}
      <View style={styles.radioCircle}>
        {selectedPlan === type && <View style={styles.selectedDot} />}
      </View>
      <View>
        <Text style={[styles.planTitle, selectedPlan === type && { color: theme.colors.primary }]}>
          {type === 'monthly' ? 'Monthly Plan' : 'Yearly Plan'}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
          <Text style={styles.planPrice}>{price}</Text>
          <Text style={styles.planDuration}>/{duration}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const FeatureItem = ({ icon, text }) => (
    <View style={styles.featureItem}>
      <View style={styles.featureIconBox}>
        <Ionicons name={icon} size={20} color={theme.colors.secondary} />
      </View>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={styles.headerSection}>
          <View style={styles.iconContainer}>
            <Ionicons name="diamond" size={60} color="#fff" />
          </View>
          <Text style={styles.headerTitle}>Upgrade to Premium</Text>
          <Text style={styles.headerSubtitle}>
            Experience music like never before. No ads, high quality, and unlimited skips.
          </Text>
        </View>


        <Text style={styles.sectionTitle}>Choose your plan</Text>

        <PlanCard
          type="monthly"
          price="₹99"
          duration="mo"
        />

        <PlanCard
          type="yearly"
          price="₹999"
          duration="yr"
          recommended={true}
        />


        <View style={styles.featuresContainer}>
          <FeatureItem icon="musical-notes" text="Ad-free music listening" />
          <FeatureItem icon="download" text="Unlimited offline downloads" />
          <FeatureItem icon="options" text="High quality audio streaming" />
          <FeatureItem icon="play-skip-forward" text="Unlimited skips" />
        </View>


        <TouchableOpacity
          style={styles.subscribeBtn}
          onPress={handleSubscribe}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.subscribeText}>
              Pay via UPI - {selectedPlan === 'monthly' ? '₹99' : '₹999'}
            </Text>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Payment will be made to: {UPI_VPA}
        </Text>

        <View style={{ height: 100 }} />
      </ScrollView>


      <Modal visible={showVerifyModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.verifyCard}>
            <Text style={styles.verifyTitle}>Verify Payment</Text>
            <Text style={styles.verifyText}>
              Please enter the Transaction ID (UTR) from your UPI app to verify your payment.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Enter UTR / Ref No."
              value={utr}
              onChangeText={setUtr}
              placeholderTextColor="#999"
            />

            <TouchableOpacity style={styles.verifyBtn} onPress={verifyPayment} disabled={verifyLoading}>
              {verifyLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.verifyBtnText}>Verify Now</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowVerifyModal(false)}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>


      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.successCard}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark" size={40} color="#fff" />
            </View>
            <Text style={styles.successTitle}>Payment Verified!</Text>
            <Text style={styles.successText}>
              Welcome to Premium family. Your subscription is now active.
            </Text>
            <TouchableOpacity style={styles.continueBtn} onPress={() => setShowSuccess(false)}>
              <Text style={styles.continueText}>Start Listening</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Premium;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: theme.colors.primary,
    marginHorizontal: -20,
    paddingVertical: 40,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    ...theme.shadows.medium,
    marginBottom: 40,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 15,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 20,
    borderRadius: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: 'transparent',
    ...theme.shadows.soft,
    position: 'relative',
    overflow: 'hidden'
  },
  selectedCard: {
    borderColor: theme.colors.primary,
    backgroundColor: '#F4F7FE'
  },
  recommendedBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 10,
  },
  recommendedText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.textSecondary,
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center'
  },
  selectedDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 2
  },
  planPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text
  },
  planDuration: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '600'
  },
  featuresContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 20,
    marginTop: 10,
    ...theme.shadows.soft
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  featureIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(5, 205, 153, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureText: {
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: '500'
  },
  subscribeBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 30,
    ...theme.shadows.medium,
    marginHorizontal: 10
  },
  subscribeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  disclaimer: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 15
  },


  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  verifyCard: {
    backgroundColor: '#fff',
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 25,
    alignItems: 'center',
    ...theme.shadows.medium
  },
  verifyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    color: theme.colors.text
  },
  verifyText: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    marginBottom: 20
  },
  input: {
    width: '100%',
    backgroundColor: '#F4F7FE',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.text
  },
  verifyBtn: {
    backgroundColor: theme.colors.success,
    paddingVertical: 12,
    width: '100%',
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10
  },
  verifyBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  },
  closeBtn: {
    padding: 10,
  },
  closeText: {
    color: theme.colors.textSecondary,
    fontWeight: '600'
  },
  successCard: {
    backgroundColor: '#fff',
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    ...theme.shadows.medium
  },
  successIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: theme.colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    ...theme.shadows.soft
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 10,
    textAlign: 'center'
  },
  successText: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22
  },
  continueBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center'
  },
  continueText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  }
});

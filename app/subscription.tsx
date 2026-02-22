import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import api from '../api/api';
import useAuthStore from '../store/authStore';

interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
}

const PLANS: Plan[] = [
  { id: '499', name: 'Basic Plan', price: 499, features: ['Core Features', 'Email Support'] },
  { id: '699', name: 'Pro Plan', price: 699, features: ['Priority Support', 'Dashboard Analytics', 'Marketing Tools'] },
  { id: '999', name: 'Enterprise Plan', price: 999, features: ['24/7 Support', 'Custom Branding', 'Advanced Analytics'] },
];

export default function Subscription() {
  const { user } = useAuthStore();
  const [step, setStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState({ adminUpiId: '8757641329@ybl', adminQrCodeUrl: '' });
  const [fetchingSettings, setFetchingSettings] = useState(true);
  const router = useRouter();

  React.useEffect(() => {
    fetchPaymentSettings();
  }, []);

  const fetchPaymentSettings = async () => {
    try {
      const res = await api.get('/restaurants/payment-settings');
      setPaymentSettings(res.data);
    } catch (error) {
      console.error('Failed to fetch payment settings', error);
    } finally {
      setFetchingSettings(false);
    }
  };

  // Show all plans for maximum flexibility (upgrades, same plan, or downgrades on renewal)
  const displayPlans = PLANS;

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setScreenshot(result.assets[0].uri);
    }
  };

  const handleUpload = async () => {
    if (!screenshot || !selectedPlan) return Alert.alert('Error', 'Please select a plan and upload a payment screenshot');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: screenshot,
        name: 'payment.jpg',
        type: 'image/jpeg',
      } as any);

      const uploadRes = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      await api.post('/restaurants/subscription', {
        amount: selectedPlan.price,
        plan: selectedPlan.id,
        screenshotUrl: uploadRes.data.url,
      });

      Alert.alert('Success', 'Payment screenshot uploaded. Admin will verify shortly.');
      router.replace('/verification');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit subscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => step === 2 ? setStep(1) : router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscription Plan</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {step === 1 ? (
          <>
            <Text style={styles.title}>Choose Your Plan</Text>
            <Text style={styles.subtitle}>Select a plan to grow your restaurant business</Text>
            
            {displayPlans.length > 0 ? (
              displayPlans.map((plan) => (
                <TouchableOpacity
                  key={plan.id}
                  style={[styles.planCard, selectedPlan?.id === plan.id && styles.selectedPlan]}
                  onPress={() => setSelectedPlan(plan)}
                >
                  <View style={styles.planHeader}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    <Text style={styles.planPrice}>₹{plan.price}/mo</Text>
                  </View>
                  {plan.features.map((feature, idx) => (
                    <View key={idx} style={styles.featureRow}>
                      <Ionicons name="checkmark-circle" size={18} color="#f27f0d" />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.noPlansBox}>
                <Ionicons name="star" size={40} color="#f27f0d" />
                <Text style={styles.noPlansText}>You are already on the highest plan!</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.button, (!selectedPlan || displayPlans.length === 0) && styles.buttonDisabled]}
              onPress={() => setStep(2)}
              disabled={!selectedPlan || displayPlans.length === 0}
            >
              <Text style={styles.buttonText}>Continue to Payment</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.title}>Make Payment</Text>
            <Text style={styles.subtitle}>Scan the QR or pay to the UPI ID below</Text>

            <View style={styles.paymentBox}>
              <View style={styles.qrPlaceholder}>
                {fetchingSettings ? (
                  <ActivityIndicator color="#f27f0d" />
                ) : paymentSettings.adminQrCodeUrl ? (
                  <Image 
                    source={{ uri: paymentSettings.adminQrCodeUrl }} 
                    style={{ width: '100%', height: '100%', borderRadius: 12 }}
                    resizeMode="contain"
                  />
                ) : (
                  <Ionicons name="qr-code-outline" size={100} color="#f27f0d" />
                )}
              </View>
              <Text style={styles.upiId}>
                UPI: {paymentSettings.adminUpiId}
              </Text>
              <Text style={styles.amountText}>Amount to Pay: ₹{selectedPlan?.price}</Text>
            </View>

            <Text style={styles.label}>Upload Screenshot</Text>
            <TouchableOpacity style={styles.uploadBox} onPress={handlePickImage}>
              {screenshot ? (
                <Image source={{ uri: screenshot }} style={styles.preview} />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={40} color="#888" />
                  <Text style={styles.uploadText}>Tap to select screenshot</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleUpload}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Submit for Verification</Text>}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#333' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 15 },
  content: { padding: 20 },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 5 },
  subtitle: { color: '#888', fontSize: 16, marginBottom: 30 },
  planCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  selectedPlan: { borderColor: '#f27f0d', backgroundColor: '#241E19' },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  planName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  planPrice: { color: '#f27f0d', fontSize: 20, fontWeight: 'bold' },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  featureText: { color: '#ccc', marginLeft: 10, fontSize: 14 },
  button: {
    backgroundColor: '#f27f0d',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: { backgroundColor: '#555' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  paymentBox: { backgroundColor: '#1E1E1E', padding: 30, borderRadius: 16, alignItems: 'center', marginBottom: 30 },
  qrPlaceholder: { width: 150, height: 150, backgroundColor: '#241E19', justifyContent: 'center', alignItems: 'center', borderRadius: 12, marginBottom: 20 },
  upiId: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  amountText: { color: '#888', fontSize: 16 },
  label: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  uploadBox: { height: 200, backgroundColor: '#1E1E1E', borderRadius: 16, borderStyle: 'dashed', borderWidth: 1, borderColor: '#333', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  uploadText: { color: '#888', marginTop: 10 },
  preview: { width: '100%', height: '100%' },
  noPlansBox: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 20
  },
  noPlansText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 15
  }
});

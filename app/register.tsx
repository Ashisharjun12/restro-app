
import { useState, useEffect } from 'react';
import { View, Text, Alert, Image, ScrollView, TouchableOpacity, Modal, KeyboardAvoidingView, Platform, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { useRouter, Link } from 'expo-router';
import useAuthStore from '../store/authStore';
import api from '../api/api';
import { Ionicons } from '@expo/vector-icons';
import { ImageBackground } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [cities, setCities] = useState([]);
  const [showCityModal, setShowCityModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [banner, setBanner] = useState<string | null>(null);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [deliveryRadius, setDeliveryRadius] = useState('5000'); // Default 5km

  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const { sendOtp, register } = useAuthStore();

  useEffect(() => {
    fetchCities();
    (async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission to access location was denied');
            return;
        }

        let loc = await Location.getCurrentPositionAsync({});
        setLocation({
            lat: loc.coords.latitude,
            lng: loc.coords.longitude
        });
    })();
  }, []);

  const fetchCities = async () => {
    try {
        const res = await api.get('/admin/cities');
         // @ts-ignore
        setCities(res.data);
    } catch (error) {
        console.log("Failed to fetch cities");
    }
  };

  const pickBanner = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.7,
    });

    if (!result.canceled) {
        setBanner(result.assets[0].uri);
    }
  };

  const uploadBanner = async (uri: string | null) => {
      if (!uri) return null;
      const formData = new FormData();
      formData.append('file', {
          uri: uri,
          name: 'banner.jpg',
          type: 'image/jpeg',
      } as any);

      const res = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.url;
  };

  const handleSendOtp = async () => {
    if (!name || !email || !phone || !restaurantName || !address || !city) return Alert.alert("Error", "All fields are required");
    if (phone.length !== 10) return Alert.alert("Error", "Phone number must be 10 digits");
    
    setIsLoading(true);
    const fullPhone = `+91${phone}`;
    const sent = await sendOtp(fullPhone);
    setIsLoading(false);
    if (sent) setStep(2);
  };

  const handleRegister = async () => {
    setIsLoading(true);
    try {
        const bannerUrl = await uploadBanner(banner);
        const fullPhone = `+91${phone}`;
        const success = await register({
            name,
            email,
            phone: fullPhone,
            restaurantName,
            address,
            city,
            otp,
            // @ts-ignore
            banner: bannerUrl,
            location: location,
            deliveryRadius: Number(deliveryRadius)
        });
        
        if (success) {
            router.replace('/subscription'); 
        } else {
            Alert.alert("Registration Failed", useAuthStore.getState().error || "Unknown error");
        }
    } catch (e) {
        Alert.alert("Error", "Registration failed");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                <View style={styles.header}>
                    <TouchableOpacity onPress={router.back} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Create Account</Text>
                </View>

                {step === 1 ? (
                    <>
                        {/* Banner Upload */}
                            <TouchableOpacity style={styles.bannerUpload} onPress={pickBanner}>
                            {banner ? (
                                <Image source={{ uri: banner }} style={styles.bannerImage} />
                            ) : (
                                <View style={styles.bannerPlaceholder}>
                                    <Ionicons name="camera-outline" size={32} color="#f27f0d" />
                                    <Text style={styles.bannerText}>Add Restaurant Cover Photo</Text>
                                </View>
                            )}
                            {banner && (
                                <View style={styles.editBadge}>
                                    <Ionicons name="pencil" size={12} color="#fff" />
                                </View>
                            )}
                        </TouchableOpacity>

                        <View style={styles.formSection}>
                            <Text style={styles.sectionTitle}>Partner Details</Text>
                            
                            <View style={styles.inputContainer}>
                                <Ionicons name="person-outline" size={20} color="#888" style={styles.inputIcon} />
                                <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#666" value={name} onChangeText={setName} />
                            </View>

                            <View style={styles.inputContainer}>
                                <Ionicons name="mail-outline" size={20} color="#888" style={styles.inputIcon} />
                                <TextInput style={styles.input} placeholder="Email Address" placeholderTextColor="#666" value={email} onChangeText={setEmail} keyboardType="email-address" />
                            </View>

                            <View style={styles.inputContainer}>
                                <Ionicons name="call-outline" size={20} color="#888" style={styles.inputIcon} />
                                <Text style={styles.prefix}>+91</Text>
                                <TextInput style={styles.input} placeholder="Phone Number" placeholderTextColor="#666" value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={10} />
                            </View>

                            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Restaurant Details</Text>

                            <View style={styles.inputContainer}>
                                <Ionicons name="restaurant-outline" size={20} color="#888" style={styles.inputIcon} />
                                <TextInput style={styles.input} placeholder="Restaurant Name" placeholderTextColor="#666" value={restaurantName} onChangeText={setRestaurantName} />
                            </View>

                            <View style={styles.inputContainer}>
                                <Ionicons name="location-outline" size={20} color="#888" style={styles.inputIcon} />
                                <TextInput style={styles.input} placeholder="Full Address" placeholderTextColor="#666" value={address} onChangeText={setAddress} multiline />
                            </View>

                            <TouchableOpacity style={styles.inputContainer} onPress={() => setShowCityModal(true)}>
                                <Ionicons name="map-outline" size={20} color="#888" style={styles.inputIcon} />
                                <Text style={[styles.input, !city && { color: '#666' }]}>{city || "Select City"}</Text>
                                <Ionicons name="chevron-down" size={20} color="#666" />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.button} onPress={handleSendOtp} disabled={isLoading}>
                                {isLoading ? <ActivityIndicator color="#fff" /> : (
                                    <>
                                        <Text style={styles.buttonText}>Continue</Text>
                                        <Ionicons name="arrow-forward" size={20} color="#fff" />
                                    </>
                                )}
                            </TouchableOpacity>

                            <View style={{marginTop: 20}}>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="resize-outline" size={20} color="#888" style={styles.inputIcon} />
                                    <TextInput 
                                        style={styles.input} 
                                        placeholder="Delivery Radius (meters)" 
                                        placeholderTextColor="#666" 
                                        value={deliveryRadius} 
                                        onChangeText={setDeliveryRadius} 
                                        keyboardType="numeric" 
                                    />
                                </View>
                                <Text style={{color: location ? '#4CAF50' : '#FF5722', fontSize: 12, marginLeft: 5}}>
                                    {location ? `Location Detected: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Detecting Location...'}
                                </Text>
                            </View>
                        </View>
                    </>
                ) : (
                    <View style={styles.otpContainer}>
                            <Text style={styles.otpTitle}>Verification</Text>
                            <Text style={styles.otpSubtitle}>Enter the 6-digit code sent to +91 {phone}</Text>
                            
                            <View style={styles.inputContainer}>
                            <Ionicons name="key-outline" size={20} color="#888" style={styles.inputIcon} />
                            <TextInput style={styles.input} placeholder="Enter OTP" placeholderTextColor="#666" value={otp} onChangeText={setOtp} keyboardType="numeric" maxLength={6} />
                        </View>

                        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={isLoading}>
                            {isLoading ? <ActivityIndicator color="#fff" /> : (
                                    <Text style={styles.buttonText}>Verify & Register</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setStep(1)} style={styles.backLink}>
                            <Text style={styles.backText}>Back to details</Text>
                        </TouchableOpacity>
                    </View>
                )}
                
            </ScrollView>
        </KeyboardAvoidingView>

        {/* City Search Modal */}
            <Modal visible={showCityModal} transparent animationType="slide">
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select City</Text>
                        <TouchableOpacity onPress={() => setShowCityModal(false)}>
                            <Ionicons name="close-circle" size={28} color="#666" />
                        </TouchableOpacity>
                    </View>
                    
                    <View style={styles.searchBox}>
                        <Ionicons name="search" size={20} color="#666" />
                        <TextInput 
                            style={styles.searchInput}
                            placeholder="Search city..."
                            placeholderTextColor="#666"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoFocus
                        />
                    </View>

                    <ScrollView style={styles.cityList}>
                        {cities.filter((c: any) => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map((c: any) => (
                            <TouchableOpacity 
                                key={c._id} 
                                style={styles.cityItem}
                                onPress={() => { setCity(c.name); setShowCityModal(false); setSearchQuery(''); }}
                            >
                                <Ionicons name="location-sharp" size={18} color="#888" style={{marginRight: 10}} />
                                <Text style={styles.cityText}>{c.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </View>
        </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#121212' },
    bgImage: { flex: 1 },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)' },
    scrollContent: { padding: 24, paddingBottom: 50 },
    
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingTop: 30 },
    backBtn: { marginRight: 15 },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },

    bannerUpload: {
        height: 180,
        backgroundColor: '#1E1E1E',
        borderRadius: 16,
        marginBottom: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#333',
        borderStyle: 'dashed'
    },
    bannerPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    bannerText: { color: '#888', marginTop: 10, fontSize: 14 },
    bannerImage: { width: '100%', height: '100%' },
    editBadge: { position: 'absolute', bottom: 10, right: 10, backgroundColor: '#f27f0d', padding: 6, borderRadius: 12 },

    formSection: { },
    sectionTitle: { color: '#f27f0d', fontSize: 14, fontWeight: 'bold', marginBottom: 15, letterSpacing: 1, textTransform: 'uppercase' },
    
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#121212',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333',
        height: 56,
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    inputIcon: { marginRight: 12 },
    prefix: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginRight: 8, paddingRight: 8, borderRightWidth: 1, borderRightColor: '#333' },
    input: { flex: 1, color: '#fff', fontSize: 16, height: '100%' },

    button: {
        backgroundColor: '#f27f0d',
        height: 56,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#f27f0d',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginRight: 8 },

    otpContainer: { marginTop: 40 },
    otpTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
    otpSubtitle: { color: '#888', marginBottom: 30, fontSize: 16 },
    backLink: { marginTop: 20, alignItems: 'center' },
    backText: { color: '#888' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#1E1E1E', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '80%', padding: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#121212', borderRadius: 12, paddingHorizontal: 15, height: 50, marginBottom: 20 },
    searchInput: { flex: 1, marginLeft: 10, color: '#fff', fontSize: 16 },
    cityList: { flex: 1 },
    cityItem: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#252525', flexDirection: 'row', alignItems: 'center' },
    cityText: { color: '#fff', fontSize: 16 }
});

import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { MainTemplate } from '../../components/templates/MainTemplate';
import useAuthStore from '../../store/authStore';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import api from '../../api/api';

export default function Profile() {
    const { user, setUser, logout } = useAuthStore();
    const router = useRouter();

    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Form State
    const [restaurantName, setRestaurantName] = useState(user?.restaurantName || '');
    const [address, setAddress] = useState(user?.address || '');
    const [city, setCity] = useState(user?.city || '');
    
    // Images
    const [image, setImage] = useState(user?.image || null); // Logo
    const [banner, setBanner] = useState(user?.banner || null); // Banner

    const [originalData, setOriginalData] = useState({
        image: user?.image,
        banner: user?.banner
    });

    useEffect(() => {
        if (user) {
            setRestaurantName(user.restaurantName || '');
            setAddress(user.address || '');
            setCity(user.city || '');
            setImage(user.image || null);
            setBanner(user.banner || null);
            setOriginalData({
                image: user.image,
                banner: user.banner
            });
        }
    }, [user]);

    const handleLogout = async () => {
        Alert.alert("Logout", "Are you sure you want to logout?", [
            { text: "Cancel", style: "cancel" },
            { 
                text: "Logout", 
                style: "destructive", 
                onPress: async () => {
                    await logout();
                    router.replace('/login');
                }
            }
        ]);
    };

    const pickImage = async (type: 'image' | 'banner') => {
        if (!isEditing) return;

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: type === 'banner' ? [16, 9] : [1, 1],
            quality: 0.7,
        });

        if (!result.canceled) {
            const uri = result.assets[0].uri;
            if (type === 'image') setImage(uri);
            if (type === 'banner') setBanner(uri);
        }
    };

    const uploadImage = async (uri: string | null) => {
        if (!uri || uri.startsWith('http')) return uri; // Already uploaded or null

        const formData = new FormData();
        formData.append('file', {
            uri: uri,
            name: 'upload.jpg',
            type: 'image/jpeg',
        } as any);

        const res = await api.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res.data.url;
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            // Upload images concurrently if changed
            const [uploadedImage, uploadedBanner] = await Promise.all([
                uploadImage(image),
                uploadImage(banner)
            ]);

            // Update Profile
            const res = await api.put('/restaurants/profile', {
                restaurantName,
                address,
                city,
                image: uploadedImage,
                banner: uploadedBanner
            });

            setUser(res.data); // Update local store
            setOriginalData({
                image: uploadedImage,
                banner: uploadedBanner
            });
            setIsEditing(false);
            Alert.alert("Success", "Profile updated successfully!");

        } catch (error: any) {
            console.error("Profile Update Error:", error);
            if (error.response) {
                Alert.alert("Error", `Failed to update: ${error.response.data.message || 'Unknown error'}`);
            } else {
                Alert.alert("Error", "Failed to update profile. Check connection.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <MainTemplate title="My Restaurant" showHeader={false} noPadding>
            <ScrollView style={styles.container}>
                
                {/* Banner Area */}
                <View style={styles.bannerContainer}>
                    <Image 
                        source={banner ? { uri: banner } : { uri: 'https://via.placeholder.com/800x400?text=Add+Banner' }} 
                        style={styles.bannerImage}
                        contentFit="cover"
                    />
                    {isEditing && (
                        <TouchableOpacity style={styles.bannerEditBtn} onPress={() => pickImage('banner')}>
                            <Ionicons name="camera" size={20} color="#fff" />
                            <Text style={styles.editBtnText}> Edit Banner</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    
                    {/* Header Row: Logo Only */}
                    <View style={styles.headerRow}>
                        {/* Restaurant Logo */}
                        <View style={styles.logoContainer}>
                            <Image 
                                source={image ? { uri: image } : { uri: 'https://via.placeholder.com/150?text=Logo' }} 
                                style={styles.logo}
                            />
                            {isEditing && (
                                <TouchableOpacity style={styles.logoEditBtn} onPress={() => pickImage('image')}>
                                    <Ionicons name="camera" size={16} color="#fff" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Details */}
                    <View style={styles.titleRow}>
                        <View style={{flex: 1, marginTop: 10}}>
                            {isEditing ? (
                                <TextInput 
                                    style={styles.nameInput} 
                                    value={restaurantName} 
                                    onChangeText={setRestaurantName}
                                    placeholder="Restaurant Name"
                                    placeholderTextColor="#666"
                                />
                            ) : (
                                <Text style={styles.name}>{user?.restaurantName || 'Restaurant Name'}</Text>
                            )}
                            
                            {isEditing ? (
                                <TextInput 
                                    style={styles.subInput} 
                                    value={city} 
                                    onChangeText={setCity}
                                    placeholder="City"
                                    placeholderTextColor="#666"
                                />
                            ) : (
                                <Text style={styles.subText}>{user?.city || 'No City'} • {user?.phone}</Text>
                            )}
                        </View>

                        <TouchableOpacity onPress={isEditing ? handleSave : () => setIsEditing(true)} style={{marginTop: 10}}>
                            {loading ? (
                                <ActivityIndicator color="#f27f0d" />
                            ) : (
                                <Text style={styles.editLink}>{isEditing ? 'Save' : 'Edit'}</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Address Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>ADDRESS</Text>
                        {isEditing ? (
                            <TextInput 
                                style={[styles.addressInput]} 
                                value={address} 
                                onChangeText={setAddress}
                                placeholder="Full Address"
                                placeholderTextColor="#666"
                                multiline
                            />
                        ) : (
                            <Text style={styles.infoText}>{user?.address || 'No Address Provided'}</Text>
                        )}
                    </View>

                    {/* Subscription Card */}
                    <View style={styles.subCard}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.subLabel}>SUBSCRIPTION</Text>
                            <Text style={styles.subStatus}>
                                {user?.subscriptionPlan && user?.subscriptionPlan !== 'none' 
                                    ? `₹${user.subscriptionPlan} Plan` 
                                    : 'No Plan Selected'}
                            </Text>
                            <Text style={styles.subExpiry}>
                                {user?.subscriptionStatus === 'active' && user?.subscriptionExpiry 
                                    ? `Expires on ${new Date(user.subscriptionExpiry).toLocaleDateString()}` 
                                    : user?.subscriptionStatus === 'pending_payment' 
                                        ? 'Payment Verification Pending'
                                        : 'Upgrade to start selling'}
                            </Text>
                        </View>
                        <TouchableOpacity 
                            style={styles.renewBtn} 
                            onPress={() => router.push('/subscription')}
                        >
                            <Text style={styles.renewText}>
                                {user?.subscriptionPlan && user.subscriptionPlan !== 'none' ? 'Upgrade' : 'Choose Plan'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Platform Fees / Legal */}
                    <View style={styles.section}>
                         <TouchableOpacity style={styles.menuItem}>
                            <Ionicons name="document-text-outline" size={24} color="#888" />
                            <Text style={styles.menuText}>Terms & Conditions</Text>
                            <Ionicons name="chevron-forward" size={20} color="#666" />
                         </TouchableOpacity>
                         
                         <TouchableOpacity style={styles.menuItem}>
                            <Ionicons name="help-circle-outline" size={24} color="#888" />
                            <Text style={styles.menuText}>Help & Support</Text>
                            <Ionicons name="chevron-forward" size={20} color="#666" />
                         </TouchableOpacity>
                    </View>

                    {/* Logout */}
                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>

                    <Text style={styles.version}>Version 1.0.0</Text>
                    <View style={{height: 50}} />
                </View>

            </ScrollView>
        </MainTemplate>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    bannerContainer: {
        height: 180,
        backgroundColor: '#333',
        position: 'relative'
    },
    bannerImage: {
        width: '100%',
        height: '100%'
    },
    backBtn: {
        position: 'absolute',
        top: 40,
        left: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    bannerEditBtn: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#666'
    },
    editBtnText: {
        color: '#fff',
        fontSize: 12,
        marginLeft: 5
    },
    content: {
        padding: 20,
        marginTop: -30, // Pull up to overlap banner
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        backgroundColor: '#121212',
        minHeight: 500
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: -50, // Pull logo up
        marginBottom: 10
    },
    logoContainer: {
        position: 'relative',
    },
    logo: {
        width: 90,
        height: 90,
        borderRadius: 45,
        borderWidth: 4,
        borderColor: '#121212', // Match background
        backgroundColor: '#333'
    },
    logoEditBtn: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#f27f0d',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#121212'
    },
    userPicContainer: {
        position: 'relative',
        marginRight: 10,
        marginBottom: 10
    },
    userPic: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: '#333',
        backgroundColor: '#222'
    },
    userEditBtn: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#f27f0d',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#fff'
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 2
    },
    nameInput: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f27f0d',
        paddingBottom: 2,
        marginBottom: 5
    },
    subText: {
        fontSize: 14,
        color: '#888'
    },
    subInput: {
        fontSize: 14,
        color: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#666',
        paddingBottom: 2
    },
    editLink: {
        color: '#f27f0d',
        fontWeight: 'bold',
        fontSize: 16
    },
    section: {
        marginBottom: 25
    },
    sectionLabel: {
        color: '#666',
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 10,
        letterSpacing: 1
    },
    infoText: {
        color: '#aaa',
        fontSize: 16,
        lineHeight: 24
    },
    addressInput: {
        color: '#fff',
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 8,
        padding: 10,
        backgroundColor: '#1E1E1E'
    },
    subCard: {
        backgroundColor: '#1E1B16', // Dark Brown/Gold tint
        padding: 20,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#f27f0d',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30
    },
    subLabel: {
        color: '#f27f0d',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 5
    },
    subStatus: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 2
    },
    subExpiry: {
        color: '#666',
        fontSize: 12
    },
    renewBtn: {
        backgroundColor: '#f27f0d',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20
    },
    renewText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#222'
    },
    menuText: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
        marginLeft: 15
    },
    logoutBtn: {
        backgroundColor: '#1E1E1E',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#331111',
        marginBottom: 20
    },
    logoutText: {
        color: '#FF5252',
        fontWeight: 'bold',
        fontSize: 16
    },
    version: {
        textAlign: 'center',
        color: '#444',
        fontSize: 12
    }
});

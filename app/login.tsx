import { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    Alert, 
    TouchableOpacity, 
    StyleSheet, 
    TextInput, 
    KeyboardAvoidingView, 
    Platform,
    Dimensions,
    StatusBar
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import useAuthStore from '../store/authStore';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
    FadeInDown, 
    FadeInUp, 
    Layout, 
    SlideInRight,
    SlideOutLeft
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

export default function Login() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const router = useRouter();
  const { login, sendOtp, isLoading } = useAuthStore();

  const handleSendOtp = async () => {
    if (phone.length !== 10) return Alert.alert("Invalid Phone", "Please enter a valid 10-digit phone number");
    const fullPhone = `+91${phone}`;

    // Demo Mode Detection
    if (phone === '9876543212') {
        Alert.alert("Demo Mode", "Demo Mode Detected: Use OTP 123456");
        setStep(2);
        return;
    }

    // Check if registered
    const { checkUser } = useAuthStore.getState();
    const exists = await checkUser(fullPhone);
    if (!exists) {
        Alert.alert("Account not found", "This phone number is not registered. Please register your restaurant first.");
        return;
    }

    const sent = await sendOtp(fullPhone);
    if (sent) setStep(2);
  };

  const handleLogin = async () => {
    const fullPhone = `+91${phone}`;
    const result = await login(fullPhone, otp);
    
    if (result === 'pending') {
        router.replace('/verification');
    } else if (result === true) {
        router.replace('/(app)/home');
    }
  };

  return (
    <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.content}
        >
            <Animated.View entering={FadeInUp.delay(200).duration(800)} style={styles.brandContainer}>
                <View style={styles.logoWrapper}>
                    <View style={[styles.logoCircle, { backgroundColor: '#f27f0d' }]}>
                        <Ionicons name="restaurant" size={38} color="#fff" />
                    </View>
                    <View style={styles.logoRing} />
                </View>
                <Text style={styles.brandTitle}>Foodie<Text style={{color: '#f27f0d'}}>.Partner</Text></Text>
                <Text style={styles.brandSubtitle}>Empowering your culinary business</Text>
            </Animated.View>

            <Animated.View 
                layout={Layout.springify()}
                entering={FadeInDown.delay(400).duration(800)} 
                style={styles.card}
            >
                {step === 1 ? (
                    <Animated.View entering={SlideInRight} exiting={SlideOutLeft} style={styles.formStep}>
                        <View style={styles.headerRow}>
                            <Text style={styles.cardTitle}>Welcome Back</Text>
                            <View style={styles.stepIndicator}>
                                <View style={[styles.stepDot, styles.stepDotActive]} />
                                <View style={styles.stepDot} />
                            </View>
                        </View>
                        <Text style={styles.cardSubtitle}>Enter your registered phone number to access your dashboard.</Text>

                        <View style={styles.inputLabelContainer}>
                            <Text style={styles.inputLabel}>Phone Number</Text>
                        </View>
                        <View style={styles.inputContainer}>
                            <View style={[styles.inputIconWrapper, { borderRightWidth: 1, borderRightColor: '#333' }]}>
                                <Text style={styles.prefix}>+91</Text>
                            </View>
                            <TextInput 
                                style={styles.input}
                                placeholder="88888 88888" 
                                placeholderTextColor="#666"
                                value={phone} 
                                onChangeText={setPhone} 
                                keyboardType="phone-pad" 
                                maxLength={10}
                            />
                            {phone.length === 10 && (
                                <Ionicons name="checkmark-circle" size={20} color="#22c55e" style={{marginRight: 12}} />
                            )}
                        </View>

                        <TouchableOpacity 
                            style={[styles.button, isLoading && styles.buttonDisabled, { backgroundColor: '#f27f0d' }]} 
                            onPress={handleSendOtp}
                            disabled={isLoading}
                            activeOpacity={0.8}
                        >
                            <View style={styles.buttonGradient}>
                                <Text style={styles.buttonText}>{isLoading ? "Sending..." : "Get OTP"}</Text>
                                <Ionicons name="arrow-forward" size={20} color="#fff" />
                            </View>
                        </TouchableOpacity>
                    </Animated.View>
                ) : (
                    <Animated.View entering={SlideInRight} exiting={SlideOutLeft} style={styles.formStep}>
                        <TouchableOpacity onPress={() => setStep(1)} style={styles.backLink}>
                            <Ionicons name="chevron-back" size={20} color="#f27f0d" />
                            <Text style={styles.backText}>Change Number</Text>
                        </TouchableOpacity>

                        <View style={styles.headerRow}>
                            <Text style={styles.cardTitle}>Verification</Text>
                            <View style={styles.stepIndicator}>
                                <View style={styles.stepDot} />
                                <View style={[styles.stepDot, styles.stepDotActive]} />
                            </View>
                        </View>
                        <Text style={styles.cardSubtitle}>We've sent a 6-digit code to <Text style={{color: '#fff', fontWeight: 'bold'}}>+91 {phone}</Text></Text>

                        <View style={styles.inputLabelContainer}>
                            <Text style={styles.inputLabel}>Enter OTP</Text>
                        </View>
                        <View style={styles.inputContainer}>
                            <View style={styles.inputIconWrapper}>
                                <Ionicons name="shield-checkmark-outline" size={20} color="#f27f0d" />
                            </View>
                            <TextInput 
                                style={[styles.input, { letterSpacing: 8, fontSize: 20, fontWeight: 'bold' }]}
                                placeholder="0 0 0 0 0 0" 
                                placeholderTextColor="#333"
                                value={otp} 
                                onChangeText={setOtp} 
                                keyboardType="numeric" 
                                maxLength={6}
                            />
                        </View>

                        <TouchableOpacity 
                            style={[styles.button, isLoading && styles.buttonDisabled, { backgroundColor: '#f27f0d' }]} 
                            onPress={handleLogin}
                            disabled={isLoading}
                            activeOpacity={0.8}
                        >
                            <View style={styles.buttonGradient}>
                                <Text style={styles.buttonText}>{isLoading ? "Authenticating..." : "Verify & Login"}</Text>
                                <Ionicons name="log-in-outline" size={22} color="#fff" />
                            </View>
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={styles.resendButton}>
                            <Text style={styles.resendText}>Didn't receive code? <Text style={{color: '#f27f0d', fontWeight: 'bold'}}>Resend</Text></Text>
                        </TouchableOpacity>
                    </Animated.View>
                )}

                <View style={styles.footer}>
                    <Text style={styles.footerText}>New Partner? </Text>
                    <Link href="/register" asChild>
                        <TouchableOpacity>
                            <Text style={styles.linkText}>Register your Restaurant</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </Animated.View>
        </KeyboardAvoidingView>
    </View>
);
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    brandContainer: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logoWrapper: {
        width: 90,
        height: 90,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
        elevation: 10,
        shadowColor: '#f27f0d',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
    },
    logoRing: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 1,
        borderColor: 'rgba(242, 127, 13, 0.2)',
        zIndex: 1,
    },
    brandTitle: {
        fontSize: 36,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: -1,
    },
    brandSubtitle: {
        fontSize: 15,
        color: '#888',
        marginTop: 6,
        fontWeight: '500',
    },
    card: {
        borderRadius: 32,
        padding: 28,
        maxWidth: 450,
        width: '100%',
        alignSelf: 'center',
    },
    formStep: {
        width: '100%',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    cardTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#fff',
    },
    stepIndicator: {
        flexDirection: 'row',
        gap: 6,
    },
    stepDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#333',
    },
    stepDotActive: {
        width: 20,
        backgroundColor: '#f27f0d',
    },
    cardSubtitle: {
        fontSize: 14,
        color: '#aaa',
        marginBottom: 32,
        lineHeight: 20,
    },
    inputLabelContainer: {
        marginBottom: 8,
        marginLeft: 4,
    },
    inputLabel: {
        color: '#f27f0d',
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        height: 64,
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    inputIconWrapper: {
        width: 44,
        justifyContent: 'center',
    },
    prefix: {
        color: '#fff',
        fontSize: 17,
        fontWeight: 'bold',
    },
    input: {
        flex: 1,
        color: '#fff',
        fontSize: 18,
        height: '100%',
        paddingLeft: 12,
    },
    button: {
        height: 60,
        borderRadius: 18,
        marginTop: 8,
        overflow: 'hidden',
    },
    buttonGradient: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginRight: 10,
        letterSpacing: 0.5,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 32,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
        paddingTop: 24,
    },
    footerText: {
        color: '#777',
        fontSize: 14,
    },
    linkText: {
        color: '#f27f0d',
        fontSize: 14,
        fontWeight: 'bold',
    },
    backLink: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        backgroundColor: 'rgba(242, 127, 13, 0.1)',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    backText: {
        color: '#f27f0d',
        marginLeft: 4,
        fontSize: 13,
        fontWeight: '700',
    },
    resendButton: {
        alignItems: 'center',
        marginTop: 16,
    },
    resendText: {
        color: '#777',
        fontSize: 13,
    }
});

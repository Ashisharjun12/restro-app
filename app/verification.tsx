import { View, Text, StyleSheet, TouchableOpacity, Linking, StatusBar, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import useAuthStore from '../store/authStore';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function Verification() {
  const router = useRouter();
  const { logout, user } = useAuthStore();

  const handleRefresh = async () => {
    await logout();
    router.replace('/login');
  };

  const handleContactSupport = () => {
      Linking.openURL('tel:+918757641329');
  };

  return (
    <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        
        <View style={styles.content}>
            <Animated.View entering={ZoomIn.delay(200).duration(800)} style={styles.iconWrapper}>
                <View style={[styles.iconCircle, { backgroundColor: '#f27f0d' }]}>
                    <Ionicons name="time" size={54} color="#fff" />
                </View>
                <View style={styles.iconPulse} />
            </Animated.View>

            <Animated.View 
                entering={FadeInUp.delay(400).duration(800)}
                style={styles.card}
            >
                <Text style={styles.title}>Verification Pending</Text>
                <View style={styles.separator} />
                
                <Text style={styles.description}>
                    We're excited to have you on board!
                </Text>
                <Text style={styles.subDescription}>
                    Our team is currently reviewing your restaurant profile and documents. This typically takes <Text style={{color: '#fff', fontWeight: 'bold'}}>24-48 hours</Text>. You'll be notified once you're cleared for business.
                </Text>

                <View style={styles.infoBox}>
                    <View style={styles.infoRow}>
                        <Ionicons name="call" size={18} color="#f27f0d" />
                        <Text style={styles.infoLabel}>Registered Phone</Text>
                    </View>
                    <Text style={styles.infoValue}>+91 {user?.phone?.replace('+91', '') || 'Account Active'}</Text>
                    <View style={styles.statusBadge}>
                        <Text style={styles.statusBadgeText}>UNDER REVIEW</Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.primaryButton} onPress={handleRefresh} activeOpacity={0.8}>
                    <View style={[styles.buttonGradient, { backgroundColor: '#f27f0d', borderRadius: 18 }]}>
                        <Text style={styles.buttonText}>Check Status / Re-login</Text>
                        <Ionicons name="refresh" size={20} color="#fff" />
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.supportButton} onPress={handleContactSupport}>
                    <View style={styles.supportIconBg}>
                        <Ionicons name="headset" size={18} color="#f27f0d" />
                    </View>
                    <Text style={styles.supportText}>Need immediate help? <Text style={{color: '#f27f0d', textDecorationLine: 'underline'}}>Contact Support</Text></Text>
                </TouchableOpacity>
            </Animated.View>
            
            <Animated.View entering={FadeInDown.delay(800)} style={styles.footer}>
                <Text style={styles.footerText}>Foodie<Text style={{color: '#f27f0d'}}>.Partner</Text> Dashboard v1.0</Text>
            </Animated.View>
        </View>
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
        alignItems: 'center',
    },
    iconWrapper: {
        marginBottom: -50,
        zIndex: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 20,
        shadowColor: '#f27f0d',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        borderWidth: 4,
        borderColor: '#0a0a0a',
    },
    iconPulse: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 1,
        borderColor: 'rgba(242, 127, 13, 0.2)',
    },
    card: {
        borderRadius: 32,
        padding: 32,
        paddingTop: 70,
        width: '100%',
        maxWidth: 450,
        alignSelf: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    separator: {
        width: 40,
        height: 4,
        backgroundColor: '#f27f0d',
        borderRadius: 2,
        marginBottom: 20,
    },
    description: {
        fontSize: 18,
        fontWeight: '600',
        color: '#eee',
        textAlign: 'center',
        marginBottom: 12,
    },
    subDescription: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 22,
        paddingHorizontal: 10,
    },
    infoBox: {
        width: '100%',
        backgroundColor: 'rgba(0,0,0,0.3)',
        padding: 20,
        borderRadius: 20,
        marginBottom: 28,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    infoLabel: {
        color: '#888',
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 6,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    infoValue: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    statusBadge: {
        backgroundColor: 'rgba(242, 127, 13, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(242, 127, 13, 0.2)',
    },
    statusBadgeText: {
        color: '#f27f0d',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    primaryButton: {
        width: '100%',
        height: 60,
        borderRadius: 18,
        overflow: 'hidden',
        marginBottom: 16,
    },
    buttonGradient: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 10,
    },
    supportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
    },
    supportIconBg: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(242, 127, 13, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    supportText: {
        color: '#888',
        fontSize: 13,
        fontWeight: '500',
    },
    footer: {
        marginTop: 40,
    },
    footerText: {
        color: '#444',
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
});

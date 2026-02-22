
import { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import useAuthStore from '../store/authStore';

export default function Index() {
  const router = useRouter();
  const { checkAuth, isAuthenticated } = useAuthStore();

  useEffect(() => {
    const init = async () => {
      // 1. Simulate splash delay
      const minDelay = new Promise(resolve => setTimeout(resolve, 2000));
      
      // 2. Check Auth State from Storage
      const authCheck = checkAuth();

      await Promise.all([minDelay, authCheck]);
      
      // 3. Navigate based on result
      // We need to check the updated state. 
      // Since checkAuth updates the store, we might need to read it from store or wait for re-render.
      // However, inside useEffect, we can trust the async flow if we check the store getter or return value.
      // Let's rely on the store state after the promise.
    };

    init();
  }, []);

  // Use a separate effect to react to auth state changes *after* init is done? 
  // Or just check manually. detailed:
  // checkAuth is async. We await it.
  
  useEffect(() => {
     // This effect might trigger prematurely if we don't have a "isReady" state.
     // Better to handle navigation in the init function after await.
  }, []);
  
  // Revised Init
  useEffect(() => {
      const performChecks = async () => {
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s
          await checkAuth(); // Check storage & fetch user
          
          const { isAuthenticated, user } = useAuthStore.getState();
          
          if (isAuthenticated && user) {
              if (user.role === 'restaurant') {
                  if (user.subscriptionStatus === 'none') {
                      router.replace('/subscription');
                  } else if (!user.isVerified) {
                      router.replace('/verification');
                  } else {
                      router.replace('/(app)/home');
                  }
              } else {
                  router.replace('/(app)/home'); // Fallback
              }
          } else {
              router.replace('/login');
          }
      }
      performChecks();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>FoodDelivery<Text style={styles.accent}>.</Text></Text>
      <Text style={styles.subtext}>Restaurant Partner</Text>
      <ActivityIndicator size="large" color="#f27f0d" style={{ marginTop: 20 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // Dark Mode
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  accent: {
    color: '#f27f0d', // Stitch Orange
  },
  subtext: {
      color: '#888',
      marginTop: 10,
      fontSize: 16,
      letterSpacing: 1
  }
});

import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import useAuthStore from '../../store/authStore';

export default function AppLayout() {
  const router = useRouter();
  const { user, checkAuth, logout } = useAuthStore();

  const isRestricted = user?.subscriptionStatus === 'blocked' || user?.subscriptionStatus === 'expired' || user?.isSubscriptionBlocked;

  if (isRestricted) {
    return (
      <View style={styles.restrictedContainer}>
        <View style={styles.restrictedContent}>
          <View style={styles.iconContainer}>
            <Ionicons name="alert-circle" size={80} color="#ff4d4d" />
          </View>
          <Text style={styles.restrictedTitle}>Subscription {user?.subscriptionStatus === 'blocked' || user?.isSubscriptionBlocked ? 'Blocked' : 'Expired'}</Text>
          <Text style={styles.restrictedSubtitle}>
            Your restaurant service is currently suspended. Please renew your subscription to continue using the services.
          </Text>
          
          <TouchableOpacity 
            style={styles.refreshBtn} 
            onPress={() => checkAuth()}
          >
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.refreshBtnText}>Refresh Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.refreshBtn, { backgroundColor: '#2ecc71', marginTop: 0 }]} 
            onPress={() => router.push('/subscription')}
          >
            <Ionicons name="card" size={20} color="#fff" />
            <Text style={styles.refreshBtnText}>Renew Subscription</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.logoutBtn} 
            onPress={() => logout()}
          >
            <Text style={styles.logoutBtnText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#121212',
          borderTopColor: '#333',
          height: 70, 
          paddingBottom: 10,
          paddingTop: 10
        },
        tabBarActiveTintColor: '#f27f0d',
        tabBarInactiveTintColor: '#666',
        tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: 'bold',
            marginTop: 5
        }
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />,
        }}
      />
      
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? "receipt" : "receipt-outline"} size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="add"
        options={{
          title: '',
          tabBarIcon: ({ color, size }) => (
            <View style={{ 
                width: 60, 
                height: 60, 
                backgroundColor: '#f27f0d', 
                borderRadius: 30, 
                justifyContent: 'center', 
                alignItems: 'center',
                top: -15, 
                shadowColor: "#f27f0d",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 10,
                elevation: 5
            }}>
                <Ionicons name="add" size={32} color="#fff" />
            </View>
          ),
        }}
      />

       <Tabs.Screen
        name="revenue"
        options={{
          title: 'Revenue',
          tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? "bar-chart" : "bar-chart-outline"} size={24} color={color} />,
        }}
      />

       <Tabs.Screen
        name="menu"
        options={{
          title: 'Menu',
          tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? "fast-food" : "fast-food-outline"} size={24} color={color} />,
        }}
      />

       <Tabs.Screen
        name="reviews"
        options={{
          href: null, 
        }}
      />

       <Tabs.Screen
        name="sponsors"
        options={{
          href: null, 
        }}
      />

       <Tabs.Screen
        name="profile"
        options={{
          href: null,
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />,
        }}
      />

       <Tabs.Screen
        name="notifications"
        options={{
          href: null, 
        }}
      />

       <Tabs.Screen
        name="order/[id]"
        options={{
          href: null, 
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  restrictedContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30
  },
  restrictedContent: {
    width: '100%',
    alignItems: 'center'
  },
  iconContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 77, 77, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30
  },
  restrictedTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 15,
    textAlign: 'center'
  },
  restrictedSubtitle: {
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40
  },
  refreshBtn: {
    flexDirection: 'row',
    backgroundColor: '#f27f0d',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    marginBottom: 15
  },
  refreshBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  logoutBtn: {
    paddingVertical: 15,
    width: '100%',
    alignItems: 'center'
  },
  logoutBtnText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600'
  }
});

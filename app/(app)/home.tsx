import { MainTemplate } from '../../components/templates/MainTemplate';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import useAuthStore from '../../store/authStore';
import { useEffect, useState } from 'react';
import api from '../../api/api';
import useNotificationStore from '../../store/notificationStore';

export default function Home() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { socket, connect, disconnect, unreadCount, fetchNotifications } = useNotificationStore();
  const [stats, setStats] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    activeItems: 0,
    inventoryCount: 0,
    reviewRating: 0,
    reviewCount: 0,
    subscriptionStatus: 'Active',
    recentOrders: [] as any[]
  });

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user?._id) return;
    // Start socket here so notifications work from the home screen
    connect(user._id);
    fetchDashboardStats();
    fetchNotifications(); // New: Fetch persistent history
    return () => disconnect();
  }, [user?._id]);

  // When a new order arrives via socket, prepend it to recent orders
  useEffect(() => {
    if (!socket) return;
    const handler = (order: any) => {
      setStats(prev => ({
        ...prev,
        todayOrders: prev.todayOrders + 1,
        recentOrders: [order, ...prev.recentOrders].slice(0, 3),
      }));
    };

    const statusHandler = (data: any) => {
      if (data.status === 'delivered') {
        setStats(prev => ({
          ...prev,
          todayRevenue: prev.todayRevenue + (data.totalAmount || 0)
        }));
      }
    };

    socket.on('new_order', handler);
    socket.on('restaurant_order_status_update', statusHandler);
    return () => { 
      socket.off('new_order', handler); 
      socket.off('restaurant_order_status_update', statusHandler);
    };
  }, [socket]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchDashboardStats(),
      useAuthStore.getState().checkAuth()
    ]);
    setRefreshing(false);
  };

  const fetchDashboardStats = async () => {
    try {
        // Fetch more orders for stats accuracy (e.g., 50)
        const res = await api.get('/restaurants/orders', { params: { limit: 50 } });
        const orders = res.data.orders || [];
        const today = new Date().toISOString().split('T')[0];
        
        const todayOrders = orders.filter((o: any) => o.createdAt.startsWith(today));
        const deliveredToday = todayOrders.filter((o: any) => o.status === 'delivered');
        const revenue = deliveredToday.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);
        
        // Fetch products for count
        const productRes = await api.get('/restaurants/products', { params: { limit: 1 } });
        const productCount = productRes.data.totalProducts || 0;
        
        // Fetch reviews for rating
        const reviewRes = await api.get(`/reviews/restaurant/${user._id}`);
        const reviews = reviewRes.data.reviews || [];
        const avgRating = reviews.length > 0 
            ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length 
            : 0;

        setStats({
            todayOrders: todayOrders.length,
            todayRevenue: revenue,
            activeItems: productCount,
            inventoryCount: productCount,
            reviewRating: avgRating,
            reviewCount: reviewRes.data.totalReviews || 0,
            subscriptionStatus: 'Premium',
            recentOrders: orders.slice(0, 3)
        });

    } catch (error) {
        console.error("Failed to fetch stats", error);
    }
  };

  return (
    <MainTemplate title="Dashboard" showHeader={false} noPadding={true}>
        <ScrollView 
            style={styles.container} 
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f27f0d" />
            }
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.push('/(app)/profile')} style={styles.userInfo}>
                    <Image 
                        source={user?.image ? { uri: user.image } : { uri: 'https://ui-avatars.com/api/?name=' + user?.restaurantName + '&background=f27f0d&color=fff' }} 
                        style={styles.avatar} 
                    />
                    <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.dashboardLabel}>DASHBOARD</Text>
                            <View style={styles.planBadge}>
                                <Text style={styles.planBadgeText}>{stats.subscriptionStatus.toUpperCase()}</Text>
                            </View>
                        </View>
                        <Text style={styles.userName}>Welcome, {user?.restaurantName?.split(' ')[0] || 'Partner'}</Text>
                    </View>
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <TouchableOpacity 
                        style={[styles.statusToggle, { backgroundColor: user?.isOpen ? '#2ecc71' : '#e74c3c' }]} 
                        onPress={() => {
                            const action = user?.isOpen ? 'CLOSE' : 'OPEN';
                            Alert.alert(
                                `${action} Restaurant?`,
                                `Are you sure you want to ${action.toLowerCase()} your restaurant?`,
                                [
                                    { text: 'Cancel', style: 'cancel' },
                                    { text: 'Yes', onPress: useAuthStore.getState().toggleStatus }
                                ]
                            );
                        }}
                    >
                        <Ionicons name={user?.isOpen ? "cafe" : "cafe-outline"} size={18} color="#fff" />
                        <Text style={styles.statusToggleText}>{user?.isOpen ? 'OPEN' : 'CLOSED'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.notifButton} onPress={() => router.push('/(app)/notifications')}>
                        <Ionicons name="notifications" size={24} color="#f27f0d" />
                        {unreadCount > 0 && (
                            <View style={styles.notifBadge}>
                                <Text style={styles.notifBadgeText}>
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {/* Today's Orders Widget */}
            <TouchableOpacity onPress={() => router.push('/(app)/orders')} style={styles.mainCard}>
                <View>
                    <Text style={styles.mainCardTitle}>Today's Orders</Text>
                    <Text style={styles.mainCardValue}>{stats.todayOrders}</Text>
                    <Text style={styles.mainCardSub}>8 more than yesterday</Text>
                </View>
                <View style={styles.growthBadge}>
                    <Ionicons name="trending-up" size={16} color="#fff" />
                    <Text style={styles.growthText}> +12%</Text>
                </View>
            </TouchableOpacity>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
                {/* Revenue */}
                <View style={[styles.statCardGrid, { backgroundColor: '#00C853' }]}>
                    <Text style={styles.statLabel}>Revenue Today</Text>
                    <Text style={styles.statValue}>₹{stats.todayRevenue.toFixed(0)}</Text>
                    <View style={styles.statFooter}>
                        <Ionicons name="cash" size={14} color="#fff" />
                        <Text style={styles.statFooterText}> Real-time</Text>
                    </View>
                </View>

                {/* Inventory */}
                <TouchableOpacity onPress={() => router.push('/(app)/menu' as any)} style={[styles.statCardGrid, { backgroundColor: '#FF6D00' }]}>
                    <Text style={styles.statLabel}>Active Inventory</Text>
                    <Text style={styles.statValue}>{stats.inventoryCount}</Text>
                    <View style={styles.statFooter}>
                        <Ionicons name="restaurant-outline" size={14} color="#fff" />
                        <Text style={styles.statFooterText}> Tap to Manage Menu</Text>
                    </View>
                </TouchableOpacity>

                {/* Reviews */}
                <TouchableOpacity onPress={() => router.push('/(app)/reviews' as any)} style={[styles.statCardGrid, { backgroundColor: '#FFAB00', width: '100%' }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View>
                            <Text style={styles.statLabel}>Customer Feedback</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
                                <Text style={styles.statValue}>{stats.reviewRating.toFixed(1)}</Text>
                                <View style={{ flexDirection: 'row', marginLeft: 10 }}>
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <Ionicons key={s} name="star" size={16} color={s <= Math.round(stats.reviewRating) ? '#FFC107' : 'rgba(255,255,255,0.3)'} />
                                    ))}
                                </View>
                            </View>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={[styles.statValue, { fontSize: 22 }]}>{stats.reviewCount}</Text>
                            <Text style={[styles.statLabel, { fontSize: 10 }]}>REVIEWS</Text>
                        </View>
                    </View>
                    <View style={styles.statFooter}>
                        <Ionicons name="chatbubbles-outline" size={14} color="#fff" />
                        <Text style={styles.statFooterText}> See what customers are saying</Text>
                    </View>
                </TouchableOpacity>

                {/* Sponsor Requests - Conditional for Pro/Entrepreneur (699/999) */}
                {(user?.subscriptionPlan === '699' || user?.subscriptionPlan === '999') && (
                    <TouchableOpacity onPress={() => router.push('/(app)/sponsors' as any)} style={[styles.statCardGrid, { backgroundColor: '#6200EA', width: '100%' }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View>
                                <Text style={styles.statLabel}>Sponsor Requests</Text>
                                <Text style={[styles.statValue, { fontSize: 24, marginTop: 10 }]}>Get Boosted</Text>
                            </View>
                            <Ionicons name="megaphone" size={40} color="rgba(255,255,255,0.4)" />
                        </View>
                        <View style={styles.statFooter}>
                            <Ionicons name="rocket-outline" size={12} color="#fff" />
                            <Text style={styles.statFooterText}> Specialized for Pro & Entrepreneur</Text>
                        </View>
                    </TouchableOpacity>
                )}
            </View>

            {/* Recent Orders */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Latest Orders</Text>
                <TouchableOpacity onPress={() => router.push('/(app)/orders')}>
                    <Text style={styles.seeAll}>See All</Text>
                </TouchableOpacity>
            </View>

            {stats.recentOrders.map((order, index) => (
                <View key={index} style={styles.orderCard}>
                    <View style={styles.orderIcon}>
                        <Ionicons name="restaurant" size={24} color="#f27f0d" />
                    </View>
                    <View style={styles.orderInfo}>
                        <Text style={styles.orderId}>Order #{order._id.slice(-4)}</Text>
                        <Text style={styles.orderDetails}>{order.items?.length || 1} items • 5 mins ago</Text>
                    </View>
                    <View style={styles.orderStatus}>
                        <Text style={styles.orderPrice}>₹{order.totalAmount}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
                            <View style={[styles.statusDot, { backgroundColor: getStatusColor(order.status) }]} />
                            <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>{order.status.toUpperCase()}</Text>
                        </View>
                    </View>
                </View>
            ))}

             {/* Owner Tip */}
             <View style={styles.tipCard}>
                <Ionicons name="bulb" size={30} color="#f27f0d" />
                <View style={{ flex: 1, marginLeft: 15 }}>
                    <Text style={styles.tipTitle}>Owner Tip</Text>
                    <Text style={styles.tipText}>
                        Your "Spicy Burger" is 30% more popular on Fridays. Consider a lunch combo special!
                    </Text>
                </View>
            </View>

            <View style={{ height: 100 }} /> 
        </ScrollView>
    </MainTemplate>
  );
}

const getStatusColor = (status: string) => {
    switch(status) {
        case 'pending': return '#f27f0d';
        case 'preparing': return '#2962FF';
        case 'ready': return '#00C853';
        default: return '#888';
    }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15, // Reduced padding
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
    width: '100%' // Ensure full width
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginRight: 12
  },
  dashboardLabel: {
    color: '#f27f0d',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: 2
  },
  planBadge: {
    backgroundColor: '#rgba(242, 127, 13, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    marginLeft: 8,
    borderWidth: 0.5,
    borderColor: '#rgba(242, 127, 13, 0.3)',
    marginBottom: 2
  },
  planBadgeText: {
    color: '#f27f0d',
    fontSize: 9,
    fontWeight: '800',
  },
  userName: {
    color: '#fff',
    fontSize: 20, // Slightly smaller for better fit
    fontWeight: 'bold'
  },
  notifButton: {
    width: 40,
    height: 40,
    backgroundColor: '#333',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  notifBadge: {
      position: 'absolute',
      top: -4,
      right: -4,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: '#e74c3c',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 4,
      borderWidth: 1.5,
      borderColor: '#000',
  },
  notifBadgeText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: '700',
  },
  statusToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      gap: 6,
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.1)'
  },
  statusToggleText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: 'bold',
      letterSpacing: 0.5
  },
  mainCard: {
    backgroundColor: '#f27f0d',
    borderRadius: 20,
    padding: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    shadowColor: "#f27f0d",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10
  },
  mainCardTitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    marginBottom: 5
  },
  mainCardValue: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold'
  },
  mainCardSub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 10
  },
  growthBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center'
  },
  growthText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 25
  },
  statCardGrid: {
    width: '48%',
    borderRadius: 20,
    padding: 16,
    justifyContent: 'space-between',
    height: 120
  },
  statLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14
  },
  statValue: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 5
  },
  statFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10
  },
  statFooterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold'
  },
  seeAll: {
    color: '#f27f0d',
    fontSize: 14,
    fontWeight: 'bold'
  },
  orderCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333'
  },
  orderIcon: {
    width: 50,
    height: 50,
    backgroundColor: '#333',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15
  },
  orderInfo: {
    flex: 1
  },
  orderId: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4
  },
  orderDetails: {
    color: '#888',
    fontSize: 12
  },
  orderStatus: {
    alignItems: 'flex-end'
  },
  orderPrice: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold'
  },
  tipCard: {
      backgroundColor: '#2A1F16', // Dark Brown/Orange tint
      borderRadius: 15,
      padding: 20,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#f27f0d',
      marginTop: 10
  },
  tipTitle: {
      color: '#f27f0d',
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 5
  },
  tipText: {
      color: '#aaa',
      fontSize: 12,
      lineHeight: 18
  }
});

import { useEffect, useState } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity,
  Text, ActivityIndicator, Image, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { restaurantApi } from '../../../api/api';
import { Typography } from '../../../components/atoms/Typography';

const STATUS_COLOR: Record<string, string> = {
  pending:          '#f27f0d',
  preparing:        '#3498db',
  ready:            '#2ecc71',
  out_for_delivery: '#9b59b6',
  delivered:        '#27ae60',
  cancelled:        '#e74c3c',
};

export default function OrderDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const res = await restaurantApi.getOrderDetails(id as string);
      setOrder(res.data);
    } catch (error) {
      console.error('Failed to fetch order details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#f27f0d" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centered}>
        <Typography variant="body" color="#888">Order not found</Typography>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusColor = STATUS_COLOR[order.status] || '#888';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={28} color="#f27f0d" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View>
            <Text style={styles.orderIdText}>{order.orderId}</Text>
            <Text style={styles.dateText}>{new Date(order.createdAt).toLocaleString()}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20`, borderColor: statusColor }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{order.status.toUpperCase()}</Text>
          </View>
        </View>

        {/* Customer Section */}
        <View style={styles.section}>
          <Typography variant="h3" color="#fff" style={styles.sectionTitle}>Customer Details</Typography>
          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={20} color="#666" />
            <Typography variant="body" color="#ccc" style={styles.detailText}>{order.user?.name || 'N/A'}</Typography>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="call-outline" size={20} color="#666" />
            <Typography variant="body" color="#ccc" style={styles.detailText}>{order.user?.phone || 'N/A'}</Typography>
          </View>
        </View>

        {/* Address Section */}
        <View style={styles.section}>
          <Typography variant="h3" color="#fff" style={styles.sectionTitle}>Delivery Address</Typography>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={20} color="#666" />
            <Typography variant="body" color="#ccc" style={styles.detailText}>
              {order.deliveryAddress?.address}, {order.deliveryAddress?.city}
            </Typography>
          </View>
        </View>

        {/* Items Section */}
        <View style={styles.section}>
          <Typography variant="h3" color="#fff" style={styles.sectionTitle}>Items</Typography>
          {order.items?.map((item: any, index: number) => (
            <View key={index} style={styles.itemRow}>
              {item.product?.image && (
                <Image source={{ uri: item.product.image }} style={styles.itemImage} />
              )}
              <View style={styles.itemInfo}>
                <Typography variant="body" color="#fff" style={styles.itemName}>{item.product?.name}</Typography>
                <Typography variant="caption" color="#666">₹{item.price} × {item.quantity}</Typography>
              </View>
              <Typography variant="body" color="#f27f0d" style={styles.itemTotal}>₹{item.price * item.quantity}</Typography>
            </View>
          ))}
        </View>

        {/* Payment Summary */}
        <View style={[styles.section, styles.lastSection]}>
          <Typography variant="h3" color="#fff" style={styles.sectionTitle}>Payment Summary</Typography>
          <View style={styles.summaryRow}>
            <Typography variant="body" color="#888">Payment Method</Typography>
            <Typography variant="body" color="#fff">{order.paymentMethod?.toUpperCase() || 'COD'}</Typography>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Typography variant="h3" color="#fff">Total Amount</Typography>
            <Typography variant="h2" color="#f27f0d">₹{order.totalAmount?.toFixed(2)}</Typography>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons if needed can be added here */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  iconBtn: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statusCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#111',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#222',
  },
  orderIdText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  dateText: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#111',
    padding: 12,
    borderRadius: 12,
  },
  detailText: {
    marginLeft: 12,
    flex: 1,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#111',
    padding: 12,
    borderRadius: 12,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#222',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontWeight: '600',
    marginBottom: 2,
  },
  itemTotal: {
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#222',
    marginVertical: 12,
  },
  backButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#f27f0d',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  lastSection: {
    paddingBottom: 40,
  }
});

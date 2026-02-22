import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, StyleSheet, FlatList, TouchableOpacity,
  Text, Alert, StatusBar, ActivityIndicator, Animated,
  RefreshControl, Modal, ScrollView, Image, TextInput
} from 'react-native';
// import { Swipeable, RectButton } from 'react-native-gesture-handler'; // Removed
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { restaurantApi } from '../../api/api';
import useAuthStore from '../../store/authStore';
import useNotificationStore from '../../store/notificationStore';

const TABS = ['NEW', 'KITCHEN', 'READY', 'DELIVERY'] as const;
type Tab = typeof TABS[number];

const TAB_TO_STATUS: Record<Tab, string[]> = {
  NEW:      ['pending'],
  KITCHEN:  ['preparing'],
  READY:    ['ready'],
  DELIVERY: ['out_for_delivery'],
};

const STATUS_COLOR: Record<string, string> = {
  pending:          '#f27f0d',
  preparing:        '#3498db',
  ready:            '#2ecc71',
  out_for_delivery: '#9b59b6',
  delivered:        '#27ae60',
  cancelled:        '#e74c3c',
};

// ─────────────────────────────────────────────────────────────────────────────
const OrderCard = ({ order, onAccept, onReject, onStatusChange, onViewDetails }: {
  order: any;
  onAccept: (id: string) => void;
  onReject:  (id: string) => void;
  onStatusChange: (id: string, s: string) => void;
  onViewDetails: (order: any) => void;
}) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, []);

  const color = STATUS_COLOR[order.status] || '#888';
  const total = order.totalAmount?.toFixed(2) ?? '0.00';

  return (
    <TouchableOpacity activeOpacity={0.9} style={{ marginBottom: 14 }} onPress={() => onViewDetails(order)}>
      <Animated.View style={[styles.card, { opacity: anim, marginBottom: 0 }]}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderId}>{order.orderId || `#${order._id?.slice(-6).toUpperCase()}`}</Text>
            <Text style={styles.customerName}>
              {order.user?.name || 'Customer'}{order.user?.phone ? `  ·  ${order.user.phone}` : ''}
            </Text>
          </View>
          <View style={[styles.statusBadge, { borderColor: color }]}>
            <Text style={[styles.statusText, { color }]}>{order.status}</Text>
          </View>
        </View>

        {/* Items */}
        <View style={styles.itemsSection}>
          {order.items?.map((item: any, i: number) => (
            <View key={i} style={styles.itemRow}>
              {item.product?.image && (
                <Image source={{ uri: item.product.image }} style={styles.itemThumb} />
              )}
              <Text style={styles.itemQty}>{item.quantity}×</Text>
              <Text style={styles.itemName} numberOfLines={1}>{item.product?.name || 'Item'}</Text>
              <Text style={styles.itemPrice}>₹{((item.price || 0) * item.quantity).toFixed(0)}</Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.cardFooter}>
          <Text style={styles.totalLabel}>Total: <Text style={styles.totalAmount}>₹{total}</Text></Text>
          {order.deliveryAddress?.city && (
            <Text style={styles.address} numberOfLines={1}>
              📍 {order.deliveryAddress.address}, {order.deliveryAddress.city}
            </Text>
          )}
        </View>

        {/* Actions */}
        {order.status === 'pending' && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => onReject(order._id)}>
              <Ionicons name="close" size={16} color="#e74c3c" />
              <Text style={[styles.actionText, { color: '#e74c3c' }]}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.acceptBtn]} onPress={() => onAccept(order._id)}>
              <Ionicons name="checkmark" size={16} color="#fff" />
              <Text style={[styles.actionText, { color: '#fff' }]}>Accept</Text>
            </TouchableOpacity>
          </View>
        )}
        {order.status === 'preparing' && (
          <TouchableOpacity style={[styles.actionBtn, styles.readyBtn, { alignSelf: 'stretch' }]}
            onPress={() => onStatusChange(order._id, 'ready')}>
            <Ionicons name="restaurant" size={16} color="#fff" />
            <Text style={[styles.actionText, { color: '#fff' }]}>Mark as Ready</Text>
          </TouchableOpacity>
        )}
        {order.status === 'ready' && (
          <TouchableOpacity style={[styles.actionBtn, styles.dispatchBtn, { alignSelf: 'stretch' }]}
            onPress={() => onStatusChange(order._id, 'out_for_delivery')}>
            <Ionicons name="bicycle" size={16} color="#fff" />
            <Text style={[styles.actionText, { color: '#fff' }]}>Dispatch Order</Text>
          </TouchableOpacity>
        )}
        {order.status === 'out_for_delivery' && (
          <TouchableOpacity style={[styles.actionBtn, styles.deliveryBtn, { alignSelf: 'stretch' }]}
            onPress={() => onStatusChange(order._id, 'delivered')}>
            <Ionicons name="cash-outline" size={16} color="#fff" />
            <Text style={[styles.actionText, { color: '#fff' }]}>Mark as Paid & Delivered</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
const OrderDetailsModal = ({ order, visible, onClose }: {
  order: any;
  visible: boolean;
  onClose: () => void;
}) => {
  if (!order) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Order Details</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll}>
            {/* Customer Info */}
            <View style={styles.detailSection}>
              <Text style={styles.sectionLabel}>Customer Information</Text>
              <Text style={styles.detailText}><Text style={styles.bold}>Name:</Text> {order.user?.name || 'N/A'}</Text>
              <Text style={styles.detailText}><Text style={styles.bold}>Phone:</Text> {order.user?.phone || 'N/A'}</Text>
            </View>

            {/* Address */}
            <View style={styles.detailSection}>
              <Text style={styles.sectionLabel}>Delivery Address</Text>
              <Text style={styles.detailText}>
                {order.deliveryAddress?.address}, {order.deliveryAddress?.city}{'\n'}
                {order.deliveryAddress?.state || ''} {order.deliveryAddress?.pincode || ''}
              </Text>
            </View>

            {/* Items */}
            <View style={styles.detailSection}>
              <Text style={styles.sectionLabel}>Items Ordered</Text>
              {order.items?.map((item: any, i: number) => (
                <View key={i} style={styles.modalItemRow}>
                  {item.product?.image && (
                    <Image source={{ uri: item.product.image }} style={styles.modalItemThumb} />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalItemName}>{item.product?.name || 'Unknown Item'}</Text>
                    <Text style={styles.modalItemMeta}>₹{item.price} × {item.quantity}</Text>
                  </View>
                  <Text style={styles.modalItemTotal}>₹{(item.price * item.quantity).toFixed(0)}</Text>
                </View>
              ))}
            </View>

            {/* Price Summary */}
            <View style={styles.detailSection}>
              <Text style={styles.sectionLabel}>Order Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Order ID</Text>
                <Text style={styles.summaryValue}>{order.orderId || order._id}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Status</Text>
                <Text style={[styles.summaryValue, { color: STATUS_COLOR[order.status] || '#fff' }]}>
                  {order.status.toUpperCase()}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Payment Method</Text>
                <Text style={styles.summaryValue}>{order.paymentMethod?.toUpperCase() || 'COD'}</Text>
              </View>
              <View style={[styles.summaryRow, { marginTop: 8, borderTopWidth: 1, borderTopColor: '#222', paddingTop: 8 }]}>
                <Text style={styles.grandTotalLabel}>Grand Total</Text>
                <Text style={styles.grandTotalValue}>₹{order.totalAmount?.toFixed(2)}</Text>
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.modalActionBtn} onPress={onClose}>
            <Text style={styles.modalActionText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
export default function Orders() {
  const { user } = useAuthStore();
  const { socket, connect, disconnect, isConnected, isConnecting } = useNotificationStore();

  const [orders,      setOrders]      = useState<any[]>([]);
  const [activeTab,   setActiveTab]   = useState<Tab>('NEW');
  const [loading,     setLoading]     = useState(false);
  const [refreshing,  setRefreshing]  = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Pagination & Filtering
  const [page,        setPage]        = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);
  const [startDate,   setStartDate]   = useState<string>('');
  const [endDate,     setEndDate]     = useState<string>('');

  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleViewDetails = (order: any) => {
    setSelectedOrder(order);
    setModalVisible(true);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await fetchOrders(1, true);
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (!loadingMore && page < totalPages) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchOrders(nextPage);
    }
  };

  const applyFilters = () => {
    setPage(1);
    fetchOrders(1, true);
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setPage(1);
    fetchOrders(1, true);
  };

  // ── Fetch orders with pagination and filters ──────────────────────────────
  const fetchOrders = useCallback(async (pageNum = 1, shouldReset = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const params: any = {
        page: pageNum,
        limit: 10,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };
      
      const res = await restaurantApi.getOrders(params);
      const newOrders = res.data.orders ?? [];
      
      setOrders(prev => shouldReset || pageNum === 1 ? newOrders : [...prev, ...newOrders]);
      setTotalPages(res.data.totalPages ?? 1);
    } catch (e) {
      console.error('fetchOrders error:', e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [startDate, endDate]);

  // ── Initial fetch ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?._id) return;
    connect(user._id);
    fetchOrders(1, true);
    return () => disconnect();
  }, [user?._id]);

  // ── Listen for new_order pushed by the global store ───────────────────────
  useEffect(() => {
    if (!socket) return;
    const handler = (order: any) => {
      setOrders(prev => prev.some(o => o._id === order._id) ? prev : [order, ...prev]);
      setActiveTab('NEW');
    };
    socket.on('new_order', handler);
    return () => { socket.off('new_order', handler); };
  }, [socket]);

  // ── Status helpers ────────────────────────────────────────────────────────
  const updateStatus = async (id: string, status: string) => {
    try {
      await restaurantApi.updateOrderStatus(id, status);
      const resolved = status === 'accept' ? 'preparing' : status === 'reject' ? 'cancelled' : status;
      setOrders(prev => prev.map(o => o._id === id ? { ...o, status: resolved } : o));
    } catch {
      Alert.alert('Error', 'Failed to update order status.');
    }
  };

  const handleAccept       = (id: string) => updateStatus(id, 'accept');
  const handleReject       = (id: string) => Alert.alert('Reject Order', 'Cancel this order?', [
    { text: 'No', style: 'cancel' },
    { text: 'Yes, Reject', style: 'destructive', onPress: () => updateStatus(id, 'reject') },
  ]);
  const handleStatusChange = (id: string, s: string) => updateStatus(id, s);

  // ── Filtering ─────────────────────────────────────────────────────────────
  const filtered  = orders.filter(o => TAB_TO_STATUS[activeTab].includes(o.status));

  const tabCount = (t: Tab) => orders.filter(o => TAB_TO_STATUS[t].includes(o.status)).length;

  // ── Render ────────────────────────────────────────────────────────────────
  const connColor = isConnected ? '#2ecc71' : isConnecting ? '#f27f0d' : '#e74c3c';
  const connLabel = isConnected ? 'Live'    : isConnecting ? 'Connecting…' : 'Offline';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Orders</Text>
        <View style={styles.connBadge}>
          <View style={[styles.connDot, { backgroundColor: connColor }]} />
          <Text style={styles.connText}>{connLabel}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {TABS.map(tab => {
          const cnt = tabCount(tab);
          const active = activeTab === tab;
          return (
            <TouchableOpacity key={tab} style={[styles.tab, active && styles.tabActive]}
              onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {tab}
              </Text>
              {cnt > 0 && (
                <View style={[styles.tabBadge, active && styles.tabBadgeActive]}>
                  <Text style={styles.tabBadgeText}>{cnt}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Date Filter Bar */}
      <View style={styles.filterBar}>
        <View style={styles.filterInputGroup}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <TextInput
            style={styles.dateInput}
            placeholder="Start: YYYY-MM-DD"
            placeholderTextColor="#444"
            value={startDate}
            onChangeText={setStartDate}
            onBlur={applyFilters}
          />
        </View>
        <View style={styles.filterInputGroup}>
          <TextInput
            style={styles.dateInput}
            placeholder="End: YYYY-MM-DD"
            placeholderTextColor="#444"
            value={endDate}
            onChangeText={setEndDate}
            onBlur={applyFilters}
          />
        </View>
        {(startDate || endDate) && (
          <TouchableOpacity onPress={clearFilters} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={20} color="#e74c3c" />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#f27f0d" size="large" />
          <Text style={{ color: '#555', marginTop: 12, fontSize: 13 }}>Loading orders…</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f27f0d" />
          }
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator color="#f27f0d" />
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <OrderCard order={item} onAccept={handleAccept}
              onReject={handleReject} onStatusChange={handleStatusChange}
              onViewDetails={handleViewDetails} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={64} color="#1C1C1C" />
              <Text style={styles.emptyText}>No {activeTab} orders</Text>
              {!isConnected && !isConnecting && (
                <Text style={{ color: '#e74c3c', fontSize: 12, marginTop: 8, textAlign: 'center' }}>
                  Socket disconnected — new orders won't appear in real-time.{'\n'}
                  Check your backend / ngrok URL.
                </Text>
              )}
            </View>
          }
        />
      )}

      <OrderDetailsModal 
        order={selectedOrder} 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
      />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#1A1A1A',
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  connBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1A1A1A', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 6, gap: 6,
  },
  connDot:  { width: 8, height: 8, borderRadius: 4 },
  connText: { color: '#aaa', fontSize: 12 },

  tabRow: {
    flexDirection: 'row', backgroundColor: '#111',
    marginHorizontal: 16, marginVertical: 12, borderRadius: 14, padding: 4,
  },
  tab: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 10, borderRadius: 10, gap: 6 },
  tabActive: { backgroundColor: '#f27f0d' },
  tabText:   { color: '#666', fontWeight: '600', fontSize: 13 },
  tabTextActive: { color: '#fff' },
  tabBadge: {
    backgroundColor: '#2A2A2A', borderRadius: 10,
    minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5,
  },
  tabBadgeActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  tabBadgeText:   { color: '#fff', fontSize: 10, fontWeight: '700' },

  list:    { padding: 16, paddingBottom: 30 },
  centered:{ flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 30 },
  emptyText: { color: '#333', fontSize: 16, marginTop: 16 },

  card: {
    backgroundColor: '#111', borderRadius: 18,
    borderWidth: 1, borderColor: '#1C1C1C', padding: 16,
  },
  deliveryBtn: { backgroundColor: '#27ae60' },
  cardHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  orderId:     { color: '#fff', fontSize: 16, fontWeight: '700' },
  customerName:{ color: '#666', fontSize: 12, marginTop: 3 },
  statusBadge: { borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusText:  { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },

  itemsSection:{ borderTopWidth: 1, borderTopColor: '#1C1C1C', paddingTop: 12, marginBottom: 12 },
  itemRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  itemThumb: { width: 30, height: 30, borderRadius: 6, marginRight: 8, backgroundColor: '#222' },
  itemQty:  { color: '#f27f0d', fontWeight: '700', width: 28, fontSize: 13 },
  itemName: { flex: 1, color: '#ccc', fontSize: 13 },
  itemPrice:{ color: '#fff', fontSize: 13, fontWeight: '600' },

  cardFooter:  { borderTopWidth: 1, borderTopColor: '#1C1C1C', paddingTop: 10, marginBottom: 12 },
  totalLabel:  { color: '#888', fontSize: 13 },
  totalAmount: { color: '#fff', fontWeight: '700', fontSize: 15 },
  address:     { color: '#555', fontSize: 11, marginTop: 4 },

  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 6 },
  rejectBtn: { backgroundColor: 'rgba(231,76,60,0.12)', borderWidth: 1.5, borderColor: '#e74c3c' },
  acceptBtn: { backgroundColor: '#f27f0d' },
  readyBtn:  { backgroundColor: '#2ecc71' },
  dispatchBtn: { backgroundColor: '#9b59b6' },
  actionText:{ fontWeight: '700', fontSize: 14 },

  // Modal Styles
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#111', borderTopLeftRadius: 30, borderTopRightRadius: 30,
    height: '85%', paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: '#222',
  },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  closeBtn: { padding: 4 },
  modalScroll: { flex: 1, padding: 20 },
  detailSection: { marginBottom: 25 },
  sectionLabel: { color: '#f27f0d', fontSize: 13, fontWeight: '700', marginBottom: 10, textTransform: 'uppercase' },
  detailText: { color: '#ccc', fontSize: 15, marginBottom: 5, lineHeight: 22 },
  bold: { color: '#fff', fontWeight: '700' },
  modalItemRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#222',
  },
  modalItemThumb: { width: 45, height: 45, borderRadius: 10, marginRight: 12, backgroundColor: '#222' },
  modalItemName: { color: '#fff', fontSize: 15, fontWeight: '600', marginBottom: 2 },
  modalItemMeta: { color: '#666', fontSize: 13 },
  modalItemTotal: { color: '#fff', fontSize: 16, fontWeight: '700' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { color: '#888', fontSize: 14 },
  summaryValue: { color: '#fff', fontSize: 14, fontWeight: '600' },
  grandTotalLabel: { color: '#fff', fontSize: 18, fontWeight: '700' },
  grandTotalValue: { color: '#f27f0d', fontSize: 22, fontWeight: '800' },
  modalActionBtn: {
    backgroundColor: '#222', marginHorizontal: 20, paddingVertical: 16,
    borderRadius: 15, alignItems: 'center', marginTop: 10,
  },
  modalActionText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  // Filter Styles
  filterBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#111',
    marginHorizontal: 16, marginBottom: 12, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, gap: 10,
    borderWidth: 1, borderColor: '#1A1A1A'
  },
  filterInputGroup: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#000', borderRadius: 8, paddingHorizontal: 8, height: 36, borderWidth: 1, borderColor: '#1C1C1C' },
  dateInput: { flex: 1, color: '#fff', fontSize: 11, fontVariant: ['tabular-nums'] },
  clearBtn: { padding: 4 },
  footerLoader: { paddingVertical: 20, alignItems: 'center' },
});

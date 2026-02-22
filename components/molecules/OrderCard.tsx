
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '../atoms/Button';

export const OrderCard = ({ order, onUpdateStatus }) => {
  const isPending = order.status === 'pending';
  const isPreparing = order.status === 'preparing';
  const isReady = order.status === 'ready';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.id}>Order #{order._id.slice(-4)}</Text>
        <Text style={[styles.status, { color: getStatusColor(order.status) }]}>{order.status.toUpperCase()}</Text>
      </View>
      <Text style={styles.customer}>{order.user?.name} ({order.user?.phone})</Text>
      <View style={styles.items}>
        {order.items.map((i, idx) => (
          <Text key={idx} style={styles.itemText}>- {i.product.name} x {i.quantity}</Text>
        ))}
      </View>
      <Text style={styles.total}>Total: ₹{order.totalAmount}</Text>
      
      <View style={styles.actions}>
        {isPending && <Button title="Accept" onPress={() => onUpdateStatus(order._id, 'preparing')} />}
        {isPreparing && <Button title="Ready" onPress={() => onUpdateStatus(order._id, 'ready')} />}
        {isReady && <Button title="Out for Delivery" onPress={() => onUpdateStatus(order._id, 'out_for_delivery')} />}
      </View>
    </View>
  );
};

const getStatusColor = (status) => {
    switch(status) {
        case 'pending': return 'orange';
        case 'preparing': return 'blue';
        case 'ready': return 'green';
        default: return 'gray';
    }
};

const styles = StyleSheet.create({
  card: { padding: 15, backgroundColor: '#fff', borderRadius: 8, marginBottom: 15, elevation: 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  id: { fontWeight: 'bold', fontSize: 16 },
  status: { fontWeight: 'bold' },
  customer: { fontSize: 14, color: '#555', marginBottom: 5 },
  items: { marginBottom: 10 },
  itemText: { fontSize: 14, color: '#333' },
  total: { fontWeight: 'bold', fontSize: 16, marginBottom: 10 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end' }
});

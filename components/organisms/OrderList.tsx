
import { View, FlatList, StyleSheet } from 'react-native';
import { OrderCard } from '../molecules/OrderCard';

export const OrderList = ({ orders, onUpdateStatus }) => {
  return (
    <FlatList 
      data={orders}
      keyExtractor={item => item._id}
      renderItem={({ item }) => <OrderCard order={item} onUpdateStatus={onUpdateStatus} />}
      contentContainerStyle={styles.list}
    />
  );
};

const styles = StyleSheet.create({
  list: { paddingBottom: 20 }
});

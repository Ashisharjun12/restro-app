
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { ProductCard } from '../molecules/ProductCard';

export const MenuList = ({ products }) => {
  return (
    <FlatList 
      data={products}
      keyExtractor={item => item._id}
      renderItem={({ item }) => <ProductCard product={item} />}
      contentContainerStyle={styles.list}
    />
  );
};

const styles = StyleSheet.create({
  list: { paddingBottom: 20 }
});

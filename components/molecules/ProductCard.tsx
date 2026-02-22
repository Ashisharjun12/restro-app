
import { View, Text, Image, StyleSheet } from 'react-native';
import { Button } from '../atoms/Button';

export const ProductCard = ({ product }) => {
  return (
    <View style={styles.card}>
      <Image source={{ uri: product.image }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>₹{product.price}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { flexDirection: 'row', padding: 10, backgroundColor: '#fff', marginBottom: 10, borderRadius: 8, elevation: 2 },
  image: { width: 60, height: 60, borderRadius: 8 },
  info: { marginLeft: 15, justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: 'bold' },
  price: { fontSize: 14, color: '#666' }
});

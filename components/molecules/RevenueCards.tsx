
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography } from '../atoms/Typography';

interface CardProps {
  value: string | number;
  label: string;
  color?: string;
}

export const NetRevenueCard = ({ value, label, color = '#f27f0d' }: CardProps) => (
  <View style={styles.card}>
    <Typography variant="caption" color="#888">{label}</Typography>
    <Typography variant="h2" style={{ color, marginTop: 5 }}>₹{value.toLocaleString()}</Typography>
  </View>
);

export const TotalOrdersCard = ({ value, label, color = '#fff' }: CardProps) => (
  <View style={styles.card}>
    <Typography variant="caption" color="#888">{label}</Typography>
    <Typography variant="h2" style={{ color, marginTop: 5 }}>{value}</Typography>
  </View>
);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#222'
  }
});

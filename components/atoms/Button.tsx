
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

export const Button = ({ title, onPress, variant = 'primary', disabled = false, style }: any) => {
  return (
    <TouchableOpacity 
        style={[styles.btn, variant === 'outline' ? styles.outline : styles.primary, disabled && styles.disabled, style]} 
        onPress={onPress}
        disabled={disabled}
    >
      <Text style={[styles.text, variant === 'outline' ? styles.outlineText : styles.primaryText]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: { padding: 15, borderRadius: 12, alignItems: 'center', marginVertical: 10, shadowColor: "#f27f0d", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 5 },
  primary: { backgroundColor: '#f27f0d' }, // Stitch Design Orange
  outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#f27f0d' },
  disabled: { backgroundColor: '#555', shadowOpacity: 0 },
  text: { fontWeight: '700', fontSize: 16, fontFamily: 'System' }, // Cleaner font weight
  primaryText: { color: 'white' },
  outlineText: { color: '#f27f0d' }
});

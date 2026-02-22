
import { TextInput, StyleSheet, View, Text } from 'react-native';

export const Input = ({ value, onChangeText, placeholder, prefix, ...props }) => {
  return (
    <View style={styles.container}>
      {prefix && <Text style={styles.prefix}>{prefix}</Text>}
      <TextInput 
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#888"
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    backgroundColor: '#1e1e1e', // Dark background
    marginBottom: 15,
    paddingHorizontal: 12,
  },
  prefix: {
    color: '#fff',
    fontSize: 16,
    paddingRight: 10,
    borderRightWidth: 1,
    borderRightColor: '#333',
    marginRight: 10,
    paddingVertical: 12
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#fff', // White text
    paddingVertical: 12,
    // Remove individual border/padding since container handles it
  }
});

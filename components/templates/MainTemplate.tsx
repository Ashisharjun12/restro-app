
import { View, StyleSheet, Text, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const MainTemplate = ({ children, title = "", showHeader = true, noPadding = false }) => {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      {showHeader && title && (
        <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.underline} />
        </View>
      )}
      <View style={noPadding ? styles.noPaddingContent : styles.content}>
        {children}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
      flex: 1, 
      backgroundColor: '#121212',
      // Add extra padding for Android if needed, though SafeAreaView handles it mostly.
      // User requested "some margin give", so let's add a bit more breathing room if it looks weird.
      paddingTop: Platform.OS === 'android' ? 10 : 0 
  }, 
  header: { 
      paddingHorizontal: 20, 
      paddingBottom: 20, 
      // Padding Top is handled by SafeAreaView, but we can add small amount for aesthetics
      paddingTop: 10,
      backgroundColor: '#1e1e1e', 
      borderBottomWidth: 1, 
      borderBottomColor: '#333' 
  },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  underline: { height: 3, width: 40, backgroundColor: '#f27f0d', marginTop: 5, borderRadius: 2 }, 
  content: { flex: 1, padding: 20 },
  noPaddingContent: { flex: 1, padding: 0 }
});

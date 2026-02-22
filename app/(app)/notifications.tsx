import { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'react-native';
import useNotificationStore, { OrderNotification } from '../../store/notificationStore';

function timeAgo(date: Date): string {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60)   return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  return `${Math.round(diff / 3600)}h ago`;
}

export default function Notifications() {
  const router = useRouter();
  const { 
    notifications, 
    unreadCount, 
    markAllRead, 
    markRead, 
    fetchNotifications, 
    hasMore, 
    loading, 
    page 
  } = useNotificationStore();

  // Initial fetch
  useEffect(() => {
    fetchNotifications(1, false);
  }, []);

  const renderItem = ({ item }: { item: OrderNotification }) => (
    <TouchableOpacity
      style={[styles.card, !item.read && styles.cardUnread]}
      onPress={() => {
        markRead(item.id);
        router.push('/(app)/orders');
      }}
    >
      {/* Icon */}
      <View style={[
          styles.iconBox, 
          item.type === 'alert' && { backgroundColor: 'rgba(255, 68, 68, 0.2)' },
          item.type === 'subscription' && { backgroundColor: 'rgba(34, 197, 94, 0.2)' }
      ]}>
        <Ionicons 
            name={
                item.type === 'order_new' ? "bag-handle" : 
                item.type === 'subscription' ? "ribbon-outline" : 
                item.type === 'alert' ? "alert-circle" : 
                item.type === 'promotional' ? "megaphone-outline" : 
                "notifications-outline"
            } 
            size={22} 
            color={
                item.type === 'alert' ? "#FF4444" : 
                item.type === 'subscription' ? "#22c55e" : 
                "#f27f0d"
            } 
        />
      </View>

      {/* Content */}
      <View style={styles.cardContent}>
        <View style={styles.cardTop}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.type === 'alert' ? 'CRITICAL ALERT' : 
             item.type === 'subscription' ? 'SUBSCRIPTION UPDATE' :
             item.type === 'promotional' ? 'OFFER FOR YOU' :
             item.type === 'order_new' ? `NEW ORDER #${item.orderId}` : 
             'SYSTEM NOTIFICATION'}
          </Text>
          <Text style={styles.cardTime}>{timeAgo(item.time)}</Text>
        </View>
        <Text style={styles.cardSubTitle} numberOfLines={1}>
            {item.title}
        </Text>
        <Text style={styles.cardMsg} numberOfLines={3}>
          {item.message || 'New notification received.'}
        </Text>
      </View>

      {/* Unread dot */}
      {!item.read && <View style={styles.dot} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color="#f27f0d" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={markAllRead}>
          <Text style={styles.readAll}>Read all</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={renderItem}
        onEndReached={() => {
          if (hasMore && !loading) {
            fetchNotifications(page + 1, true);
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loading && page > 1 ? (
            <View style={{ paddingVertical: 20 }}>
              <ActivityIndicator size="small" color="#f27f0d" />
            </View>
          ) : <View style={{ height: 40 }} />
        }
        ListEmptyComponent={
          loading && page === 1 ? (
            <View style={styles.empty}>
              <ActivityIndicator size="large" color="#f27f0d" />
            </View>
          ) : (
            <View style={styles.empty}>
              <Ionicons name="notifications-off-outline" size={60} color="#1C1C1C" />
              <Text style={styles.emptyText}>No notifications yet</Text>
              <Text style={styles.emptySub}>New orders will appear here in real-time</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#1A1A1A',
  },
  backBtn:     { padding: 4 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  readAll:     { color: '#f27f0d', fontSize: 13, fontWeight: '600' },

  list: { padding: 16, paddingBottom: 40 },

  card: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#111', borderRadius: 16,
    borderWidth: 1, borderColor: '#1C1C1C',
    padding: 14, marginBottom: 12,
  },
  cardUnread: { borderColor: '#f27f0d' },

  iconBox: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(242,127,13,0.15)',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  cardContent: { flex: 1 },
  cardTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 6,
  },
  cardTitle: { color: '#fff', fontSize: 13, fontWeight: '900', flex: 1, marginRight: 8, letterSpacing: 0.5 },
  cardSubTitle: { color: '#f27f0d', fontSize: 15, fontWeight: '700', marginBottom: 4 },
  cardTime:  { color: '#555', fontSize: 12 },
  cardMsg:   { color: '#888', fontSize: 13, lineHeight: 18 },

  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#f27f0d',
    marginLeft: 10, marginTop: 4,
  },

  empty:    { alignItems: 'center', paddingTop: 100 },
  emptyText:{ color: '#2A2A2A', fontSize: 18, fontWeight: '700', marginTop: 20 },
  emptySub: { color: '#1C1C1C', fontSize: 13, marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },
});

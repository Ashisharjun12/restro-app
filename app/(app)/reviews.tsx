import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { MainTemplate } from '../../components/templates/MainTemplate';
import api from '../../api/api';
import useAuthStore from '../../store/authStore';

export default function Reviews() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchReviews = async (pageNum = 1, isRefresh = false) => {
    if (!user?._id) return;
    try {
      if (!isRefresh) setLoadingMore(true);
      const res = await api.get(`/reviews/restaurant/${user._id}`, {
        params: { page: pageNum, limit: 12 } // Updated limit to 12
      });
      if (isRefresh) {
        setReviews(res.data.reviews);
      } else {
        // Prevent duplicates
        setReviews(prev => {
          const newReviews = res.data.reviews.filter((nr: any) => !prev.find(pr => pr._id === nr._id));
          return [...prev, ...newReviews];
        });
      }
      setTotalPages(res.data.totalPages);
    } catch (error) {
      console.error('fetchReviews error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchReviews(1, true);
  }, [user?._id]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchReviews(1, true);
  };

  const loadMore = () => {
    if (!loadingMore && page < totalPages) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchReviews(nextPage);
    }
  };

  const renderReviewItem = ({ item }: { item: any }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.userInfo}>
           <Image 
             source={item.userId?.userImage ? { uri: item.userId.userImage } : { uri: 'https://ui-avatars.com/api/?name=' + (item.userId?.name || 'User') + '&background=f27f0d&color=fff' }} 
             style={styles.userAvatar} 
           />
           <View>
             <Text style={styles.userName}>{item.userId?.name || 'Anonymous Guest'}</Text>
             <Text style={styles.reviewDate}>{new Date(item.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
           </View>
        </View>
        <View style={styles.ratingBadge}>
           <Ionicons name="star" size={12} color="#fff" />
           <Text style={styles.ratingText}>{item.rating}</Text>
        </View>
      </View>
      
      <View style={styles.commentContainer}>
        {item.comment ? (
          <Text style={styles.commentText}>{item.comment}</Text>
        ) : (
          <Text style={styles.noComment}>No written feedback provided.</Text>
        )}
      </View>

      <View style={styles.cardFooter}>
         <View style={styles.orderBadge}>
            <Ionicons name="receipt-outline" size={12} color="#666" />
            <Text style={styles.orderId}>ORDER #{item.orderId?.slice(-6).toUpperCase()}</Text>
         </View>
      </View>
    </View>
  );

  return (
    <MainTemplate title="" noPadding={true}>
      <View style={styles.container}>
        <View style={styles.header}>
           <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color="#f27f0d" />
           </TouchableOpacity>
           <Text style={styles.headerTitle}></Text>
           <View style={{ width: 40 }} />
        </View>

        <FlatList
          data={reviews}
          renderItem={renderReviewItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f27f0d" />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                   <Ionicons name="star-outline" size={50} color="#f27f0d" />
                </View>
                <Text style={styles.emptyTitle}>No Reviews Yet</Text>
                <Text style={styles.emptySub}>When customers rate their orders, you'll see them here.</Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={{ padding: 20 }}>
                <ActivityIndicator color="#f27f0d" />
              </View>
            ) : <View style={{ height: 40 }} />
          }
        />
      </View>
    </MainTemplate>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: 16, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#1A1A1A'
  },
  backBtn: { 
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#1A1A1A', 
    justifyContent: 'center', alignItems: 'center' 
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  list: { padding: 16, paddingBottom: 50 },
  reviewCard: { 
    backgroundColor: '#161616', borderRadius: 20, padding: 18, marginBottom: 16,
    borderWidth: 1, borderColor: '#222',
  },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  userInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  userAvatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12, backgroundColor: '#222' },
  userName: { color: '#fff', fontSize: 16, fontWeight: '800' },
  reviewDate: { color: '#666', fontSize: 12, marginTop: 2, fontWeight: '500' },
  ratingBadge: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f27f0d', 
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, gap: 4
  },
  ratingText: { color: '#fff', fontWeight: '900', fontSize: 13 },
  commentContainer: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#222',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    marginVertical: 4
  },
  commentText: { color: '#eee', fontSize: 14, lineHeight: 22, fontWeight: '400' },
  noComment: { color: '#444', fontSize: 13, fontStyle: 'italic' },
  cardFooter: { marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, opacity: 0.8 },
  orderId: { color: '#888', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyIconContainer: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(242,127,13,0.05)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 24
  },
  emptyTitle: { color: '#fff', fontSize: 22, fontWeight: '900', marginTop: 10 },
  emptySub: { color: '#666', fontSize: 14, marginTop: 12, textAlign: 'center', lineHeight: 20 },
});

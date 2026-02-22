import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator, FlatList, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { MainTemplate } from '../../components/templates/MainTemplate';
import api from '../../api/api';

export default function Sponsors() {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedSort, setSelectedSort] = useState('newest');

  const fetchMyRequests = async (pageNum = 1, isRefresh = false, status = selectedStatus, sort = selectedSort) => {
    try {
      if (pageNum === 1) !isRefresh && setFetching(true);
      else setLoadingMore(true);

      const statusQuery = status !== 'all' ? `&status=${status}` : '';
      const sortQuery = `&sort=${sort}`;
      const response = await api.get(`/sponsor-requests/my-requests?page=${pageNum}&limit=10${statusQuery}${sortQuery}`);
      const { requests: newRequests, totalPages } = response.data;
      
      if (pageNum === 1) {
        setRequests(newRequests);
      } else {
        setRequests(prev => [...prev, ...newRequests]);
      }
      
      setHasMore(pageNum < totalPages);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setFetching(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMyRequests(1, true);
  }, [selectedStatus, selectedSort]);

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchMyRequests(page + 1, false, selectedStatus, selectedSort);
    }
  };

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    fetchMyRequests(1, false, status, selectedSort);
  };

  const handleSortChange = (sort: string) => {
    setSelectedSort(sort);
    fetchMyRequests(1, false, selectedStatus, sort);
  };

  const handleSendRequest = async () => {
    if (!message.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    setLoading(true);
    try {
      await api.post('/sponsor-requests', { message });
      Alert.alert('Success', 'Your sponsorship request has been sent! Our team will contact you soon. You can see the status below.');
      setMessage('');
      setModalVisible(false);
      fetchMyRequests(1, true);
    } catch (error) {
      console.error('Failed to send sponsor request:', error);
      Alert.alert('Error', 'Failed to send request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f27f0d';
      case 'contacted': return '#2196F3';
      case 'resolved': return '#4CAF50';
      default: return '#666';
    }
  };

  const renderHeader = () => (
    <View style={styles.headerContent}>
       <View style={styles.emptyIconContainer}>
          <Ionicons name="megaphone-outline" size={60} color="#f27f0d" />
       </View>
       <Text style={styles.title}>Boost Your Visibility</Text>
       <Text style={styles.subtitle}>
         Feature your restaurant on the mobile app's home banners and reach more customers.
       </Text>
       
       <TouchableOpacity style={styles.requestBtn} onPress={() => setModalVisible(true)}>
         <Text style={styles.requestBtnText}>Send New Request</Text>
       </TouchableOpacity>

       <View style={styles.filterBar}>
         {['all', 'pending', 'contacted', 'resolved'].map((s) => (
           <TouchableOpacity 
             key={s} 
             onPress={() => handleStatusChange(s)}
             style={[styles.tab, selectedStatus === s && styles.activeTab]}
           >
             <Text style={[styles.tabText, selectedStatus === s && styles.activeTabText]}>
               {s.charAt(0).toUpperCase() + s.slice(1)}
             </Text>
           </TouchableOpacity>
         ))}
       </View>

       <View style={styles.historySubHeader}>
         <Text style={styles.historyTitle}>Recent Requests</Text>
         <TouchableOpacity onPress={() => handleSortChange(selectedSort === 'newest' ? 'oldest' : 'newest')} style={styles.sortBtn}>
            <Ionicons name="swap-vertical" size={14} color="#f27f0d" />
            <Text style={styles.sortBtnText}>{selectedSort === 'newest' ? 'Newest' : 'Oldest'}</Text>
         </TouchableOpacity>
       </View>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={{ paddingVertical: 20 }}>
        <ActivityIndicator color="#f27f0d" />
      </View>
    );
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestCardHeader}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status.toUpperCase()}</Text>
        </View>
        <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>
      <Text style={styles.messageText}>{item.message}</Text>
      {item.status === 'pending' && (
         <Text style={styles.hintText}>Our team will contact you soon.</Text>
      )}
    </View>
  );

  return (
    <MainTemplate showHeader={false} noPadding={true}>
      <View style={styles.container}>
        <View style={styles.header}>
           <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color="#f27f0d" />
           </TouchableOpacity>
           <Text style={styles.headerTitle}>Sponsor Requests</Text>
           <View style={{ width: 40 }} />
        </View>

        {fetching ? (
          <View style={[styles.content, { justifyContent: 'center' }]}>
            <ActivityIndicator color="#f27f0d" size="large" />
          </View>
        ) : (
          <FlatList
            data={requests}
            renderItem={renderItem}
            keyExtractor={(item) => item._id}
            ListHeaderComponent={renderHeader}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={
              <View style={[styles.content, { paddingTop: 0 }]}>
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No requests sent yet.</Text>
                </View>
              </View>
            }
            contentContainerStyle={{ paddingBottom: 20 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f27f0d" />
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
          />
        )}

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Request Sponsorship</Text>
              <Text style={styles.modalSubtitle}>Tell us about your promotion or event.</Text>
              
              <TextInput
                style={styles.textInput}
                placeholder="Write your message here..."
                placeholderTextColor="#666"
                multiline
                numberOfLines={4}
                value={message}
                onChangeText={setMessage}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalBtn, styles.cancelBtn]} 
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalBtn, styles.sendBtn]} 
                  onPress={handleSendRequest}
                  disabled={loading}
                >
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendBtnText}>Send</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  content: { flex: 1, padding: 20 },
  headerContent: { flex: 1, alignItems: 'center', marginBottom: 20 },
  emptyIconContainer: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(242,127,13,0.05)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 20, marginTop: 20
  },
  title: { color: '#fff', fontSize: 24, fontWeight: '900', marginBottom: 12, textAlign: 'center' },
  subtitle: { color: '#666', fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 30 },
  requestBtn: {
    backgroundColor: '#f27f0d', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30,
    shadowColor: '#f27f0d', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
    marginBottom: 40
  },
  requestBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  
  filterBar: {
    flexDirection: 'row',
    backgroundColor: '#161616',
    borderRadius: 12,
    padding: 4,
    width: '100%',
    marginBottom: 20
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8
  },
  activeTab: { backgroundColor: '#222' },
  tabText: { color: '#666', fontSize: 12, fontWeight: '600' },
  activeTabText: { color: '#f27f0d' },
  
  historySubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 15
  },
  historyTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sortBtnText: { color: '#f27f0d', fontSize: 12, fontWeight: 'bold' },
  requestCard: { 
    backgroundColor: '#161616', padding: 16, borderRadius: 15, marginBottom: 12,
    borderWidth: 1, borderBottomColor: '#333'
  },
  requestCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  dateText: { color: '#666', fontSize: 12 },
  messageText: { color: '#aaa', fontSize: 14, lineHeight: 20, marginBottom: 8 },
  hintText: { color: '#f27f0d', fontSize: 12, fontWeight: '500', fontStyle: 'italic' },
  emptyCard: { backgroundColor: '#161616', padding: 20, borderRadius: 12, alignItems: 'center' },
  emptyText: { color: '#666', fontSize: 14 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#161616', borderRadius: 20, padding: 24 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '900', marginBottom: 8 },
  modalSubtitle: { color: '#666', fontSize: 14, marginBottom: 20 },
  textInput: {
    backgroundColor: '#0A0A0A', color: '#fff', borderRadius: 12, padding: 16, minHeight: 120,
    textAlignVertical: 'top', borderWidth: 1, borderBottomColor: '#333', marginBottom: 20
  },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#222' },
  sendBtn: { backgroundColor: '#f27f0d' },
  cancelBtnText: { color: '#fff', fontWeight: 'bold' },
  sendBtnText: { color: '#fff', fontWeight: 'bold' }
});

import { MainTemplate } from '../../components/templates/MainTemplate';
import { Button } from '../../components/atoms/Button';
import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, RefreshControl, FlatList, ActivityIndicator, Modal, TouchableWithoutFeedback } from 'react-native';
import { Image } from 'expo-image';
import api from '../../api/api';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Typography } from '../../components/atoms/Typography';

export default function Menu() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All Items');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [availabilityFilter, setAvailabilityFilter] = useState('All'); // 'All', 'Available', 'Unavailable'
  const [dietaryFilter, setDietaryFilter] = useState('All'); // 'All', 'Veg', 'Non-Veg'
  const router = useRouter();
  
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Initial Fetch
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Filter Logic
  useEffect(() => {
    filterProducts();
  }, [selectedCategory, searchQuery, availabilityFilter, dietaryFilter, products]);

  // Reload data when screen comes into focus (e.g. after edit/delete)
  useFocusEffect(
    useCallback(() => {
        fetchInitialData(true);
    }, [])
  );

  const fetchInitialData = async (isRefresh = false) => {
    if (loading) return;
    setLoading(true);
    try {
      // Reset pagination state
      const [prodRes, catRes] = await Promise.all([
          api.get('/restaurants/products?page=1&limit=12'),
          api.get('/restaurants/categories')
      ]);
      
      const prodData = prodRes.data.products || [];
      setProducts(prodData);
      const categoriesList = catRes.data.categories || [];
      const catNames = ['All Items', ...categoriesList.map((c: any) => c.name)];
      setCategories(catNames);
      
      setPage(1);
      setHasMore(prodData.length === 12);

    } catch (error) {
      console.error(error);
    } finally {
        setLoading(false);
        if (isRefresh) setRefreshing(false);
    }
  };

  const loadMoreProducts = async () => {
      if (loadingMore || !hasMore || selectedCategory !== 'All Items' || searchQuery || availabilityFilter !== 'All' || dietaryFilter !== 'All') return;
      
      setLoadingMore(true);
      try {
          const nextPage = page + 1;
          const res = await api.get(`/restaurants/products?page=${nextPage}&limit=12`);
          
          const prodData = res.data.products || [];
          if (prodData.length > 0) {
              setProducts(prev => [...prev, ...prodData]);
              setPage(nextPage);
              setHasMore(prodData.length === 12);
          } else {
              setHasMore(false);
          }
      } catch (error) {
          console.error("Failed to load more products");
      } finally {
          setLoadingMore(false);
      }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInitialData(true);
  };

  const handleEdit = (product) => {
    router.push({
        pathname: '/edit-product',
        params: {
            id: product._id,
            name: product.name,
            price: product.price.toString(),
            category: (typeof product.category === 'object' ? product.category?.name : product.category) || '',
            description: product.description,
            image: product.image,
            isAvailable: String(product.isAvailable),
            isVeg: String(product.isVeg)
        }
    });
  };

  const filterProducts = () => {
      let filtered = products;

      if (selectedCategory !== 'All Items') {
          filtered = filtered.filter(p => p.category === selectedCategory || (typeof p.category === 'object' && p.category?.name === selectedCategory));
      }

      if (searchQuery) {
          filtered = filtered.filter(p => 
              p.name.toLowerCase().includes(searchQuery.toLowerCase())
          );
      }

      if (availabilityFilter === 'Available') {
          filtered = filtered.filter(p => p.isAvailable !== false);
      } else if (availabilityFilter === 'Unavailable') {
          filtered = filtered.filter(p => p.isAvailable === false);
      }

      if (dietaryFilter === 'Veg') {
          filtered = filtered.filter(p => p.isVeg === true);
      } else if (dietaryFilter === 'Non-Veg') {
          filtered = filtered.filter(p => p.isVeg === false);
      }

      setFilteredProducts(filtered);
  };

  const handleDelete = async (id) => {
      Alert.alert("Delete Product", "Are you sure?", [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: async () => {
              try {
                  await api.delete(`/restaurants/products/${id}`); 
                  onRefresh(); // Refresh list
              } catch (error) {
                  Alert.alert("Error", "Failed to delete product");
              }
          }}
      ]);
  };

  const renderProductItem = ({ item }) => {
    const isAvailable = item.isAvailable !== false;

    return (
      <View style={[styles.productCard, !isAvailable && styles.unavailableCard]}>
        <View style={styles.cardImageContainer}>
            <Image 
                source={{ uri: item.image }} 
                style={[
                    styles.productImage, 
                    !isAvailable && styles.unavailableImage
                ]} 
                contentFit="cover"
                transition={200}
            />
            {item.isVeg !== undefined && (
                <View style={styles.dietaryBadge}>
                    <MaterialCommunityIcons 
                        name="circle-slice-8" 
                        size={14} 
                        color={item.isVeg ? "#27ae60" : "#e74c3c"} 
                    />
                </View>
            )}
            {!isAvailable && (
                <View style={styles.soldOutBadge}>
                    <Typography variant="caption" style={styles.soldOutText}>OUT OF STOCK</Typography>
                </View>
            )}
        </View>
        
        <View style={styles.productDetails}>
            <View style={{ flex: 1 }}>
                <Typography variant="h3" style={styles.productName} numberOfLines={1}>
                    {item.name}
                </Typography>
                <Typography variant="caption" color="#888" style={{ marginBottom: 4 }}>
                    {(typeof item.category === 'object' ? item.category?.name : item.category) || 'Main Course'}
                </Typography>
                <Typography variant="h3" color="#f27f0d" style={styles.priceText}>
                    ₹{Number(item.price).toFixed(0)}
                </Typography>
            </View>

            <View style={styles.cardActions}>
                <TouchableOpacity style={styles.iconActionBtn} onPress={() => handleEdit(item)}>
                    <Ionicons name="pencil" size={18} color="#f27f0d" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.iconActionBtn, { backgroundColor: 'rgba(255, 77, 77, 0.1)' }]} onPress={() => handleDelete(item._id)}>
                    <Ionicons name="trash" size={18} color="#ff4d4d" />
                </TouchableOpacity>
            </View>
        </View>
      </View>
    );
  };

  return (
    <MainTemplate title="Products" showHeader={false} noPadding>
       <View style={styles.container}>
           {/* Custom Header */}
           <View style={styles.header}>
               <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                   <Ionicons name="chevron-back" size={24} color="#f27f0d" />
               </TouchableOpacity>
               <Typography variant="h2" style={styles.headerTitle}>Our Menu</Typography>
               <View style={{ width: 42 }} />
           </View>

           {/* Search & Filter */}
           <View style={styles.searchRow}>
               <View style={styles.searchBar}>
                   <Ionicons name="search" size={20} color="#666" />
                   <TextInput 
                        placeholder="Search food items..." 
                        placeholderTextColor="#666" 
                        style={styles.searchInput}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                   />
               </View>
               <TouchableOpacity style={styles.filterBtn} onPress={() => setFilterModalVisible(true)}>
                   <Ionicons name="options" size={24} color="#f27f0d" />
                   {availabilityFilter !== 'All' && <View style={styles.activeFilterDot} />}
               </TouchableOpacity>
           </View>

           {/* Categories */}
           <View style={{ marginBottom: 25 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 0 }}>
                    {categories.map((cat, index) => (
                        <TouchableOpacity 
                            key={index} 
                            style={[
                                styles.categoryChip, 
                                selectedCategory === cat && styles.categoryChipActive
                            ]}
                            onPress={() => setSelectedCategory(cat)}
                        >
                            <Typography 
                                variant="caption" 
                                style={[
                                    styles.categoryText,
                                    selectedCategory === cat && styles.categoryTextActive
                                ]}
                            >
                                {cat}
                            </Typography>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
           </View>

           {/* Product List using FlatList for Pagination */}
           <FlatList
                data={filteredProducts}
                keyExtractor={item => item._id}
                renderItem={renderProductItem}
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f27f0d" />
                }
                onEndReached={loadMoreProducts}
                onEndReachedThreshold={0.5}
                ListFooterComponent={
                    loadingMore ? <ActivityIndicator size="small" color="#f27f0d" style={{ marginVertical: 20 }} /> : null
                }
                ListEmptyComponent={
                    !loading && <Text style={{ textAlign: 'center', color: '#666', marginTop: 50 }}>No products found</Text>
                }
           />

           {/* Filter Modal */}
           <Modal
               animationType="fade"
               transparent={true}
               visible={filterModalVisible}
               onRequestClose={() => setFilterModalVisible(false)}
           >
               <TouchableWithoutFeedback onPress={() => setFilterModalVisible(false)}>
                   <View style={styles.modalOverlay}>
                       <TouchableWithoutFeedback>
                           <View style={styles.modalContent}>
                               <Text style={styles.modalTitle}>Filter by Availability</Text>
                                
                                {['All', 'Available', 'Unavailable'].map((option) => (
                                    <TouchableOpacity 
                                        key={option}
                                        style={[styles.modalOption, availabilityFilter === option && styles.modalOptionActive]}
                                        onPress={() => {
                                            setAvailabilityFilter(option);
                                        }}
                                    >
                                        <Text style={[styles.modalOptionText, availabilityFilter === option && styles.modalOptionTextActive]}>
                                            {option}
                                        </Text>
                                        {availabilityFilter === option && (
                                            <Ionicons name="checkmark" size={20} color="#f27f0d" />
                                        )}
                                    </TouchableOpacity>
                                ))}

                                <View style={{ height: 1, backgroundColor: '#333', marginVertical: 15 }} />

                                <Text style={styles.modalTitle}>Filter by Diet</Text>
                                
                                {['All', 'Veg', 'Non-Veg'].map((option) => (
                                    <TouchableOpacity 
                                        key={option}
                                        style={[styles.modalOption, dietaryFilter === option && styles.modalOptionActive]}
                                        onPress={() => {
                                            setDietaryFilter(option);
                                        }}
                                    >
                                        <Text style={[styles.modalOptionText, dietaryFilter === option && styles.modalOptionTextActive]}>
                                            {option}
                                        </Text>
                                        {dietaryFilter === option && (
                                            <Ionicons name="checkmark" size={20} color="#f27f0d" />
                                        )}
                                    </TouchableOpacity>
                                ))}
                                
                                <Button 
                                    title="Apply" 
                                    onPress={() => setFilterModalVisible(false)}
                                    style={{ marginTop: 20 }}
                                />
                           </View>
                       </TouchableWithoutFeedback>
                   </View>
               </TouchableWithoutFeedback>
           </Modal>
       </View>
    </MainTemplate>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 10
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 25
    },
    backBtn: {
        padding: 5
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '900'
    },
    notifBtn: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#1E1B16',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333'
    },
    searchRow: {
        flexDirection: 'row',
        marginBottom: 25
    },
    searchBar: {
        flex: 1,
        height: 52,
        backgroundColor: '#111',
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#222'
    },
    searchInput: {
        flex: 1,
        color: '#fff',
        marginLeft: 12,
        fontSize: 14
    },
    filterBtn: {
        width: 52,
        height: 52,
        backgroundColor: '#111',
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
        borderWidth: 1,
        borderColor: '#222'
    },
    activeFilterDot: {
        position: 'absolute',
        top: 14,
        right: 14,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#f27f0d'
    },
    categoryChip: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 12,
        backgroundColor: '#111',
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#222'
    },
    categoryChipActive: {
        backgroundColor: '#f27f0d',
        borderColor: '#f27f0d'
    },
    categoryText: {
        color: '#666',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    categoryTextActive: {
        color: '#fff'
    },
    productCard: {
        backgroundColor: '#111',
        borderRadius: 20,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#222',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 2
    },
    unavailableCard: {
        opacity: 0.7,
        borderColor: '#333'
    },
    cardImageContainer: {
        position: 'relative'
    },
    productImage: {
        width: 90,
        height: 90,
        borderRadius: 16,
        backgroundColor: '#222'
    },
    dietaryBadge: {
        position: 'absolute',
        bottom: -5,
        right: -5,
        backgroundColor: '#000',
        padding: 3,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#222'
    },
    unavailableImage: {
        opacity: 0.4
    },
    soldOutBadge: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center'
    },
    soldOutText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 0.5
    },
    productDetails: {
        flex: 1,
        marginLeft: 18,
        flexDirection: 'row',
        alignItems: 'center'
    },
    productName: {
        fontSize: 16,
        marginBottom: 2
    },
    priceText: {
        fontSize: 18,
        letterSpacing: -0.5
    },
    cardActions: {
        gap: 10,
        marginLeft: 10
    },
    iconActionBtn: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: 'rgba(242, 127, 13, 0.1)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'flex-end'
    },
    modalContent: {
        backgroundColor: '#111',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 25,
        paddingBottom: 40,
        borderTopWidth: 1,
        borderTopColor: '#222'
    },
    modalTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 15,
        marginTop: 10
    },
    modalOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 8,
        backgroundColor: '#181818'
    },
    modalOptionActive: {
        backgroundColor: 'rgba(242, 127, 13, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(242, 127, 13, 0.2)'
    },
    modalOptionText: {
        color: '#888',
        fontSize: 15
    },
    modalOptionTextActive: {
        color: '#f27f0d',
        fontWeight: 'bold'
    }
});


import { MainTemplate } from '../../components/templates/MainTemplate';
import { Input } from '../../components/atoms/Input';
import { Button } from '../../components/atoms/Button';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, Alert, Image, ScrollView, TouchableOpacity, StyleSheet, TextInput, Modal } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/api';

export default function AddProduct() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [image, setImage] = useState<any>(null);
  const [isVeg, setIsVeg] = useState(true);
  
  const [categories, setCategories] = useState<any[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [loading, setLoading] = useState(false);

  useEffect(() => {
      fetchCategories();
  }, []);

  useEffect(() => {
      if (searchQuery) {
          const filtered = categories.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
          setFilteredCategories(filtered);
      } else {
          setFilteredCategories(categories);
      }
  }, [searchQuery, categories]);

  const fetchCategories = async () => {
      try {
          // Fetch global + restaurant specific categories
          const res = await api.get('/restaurants/categories'); 
          const categoriesList = res.data.categories || [];
          setCategories(categoriesList);
          setFilteredCategories(categoriesList);
      } catch (error) {
          console.error("Failed to fetch categories");
      }
  }

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
        Alert.alert('Permission denied', 'Sorry, we need camera roll permissions to make this work!');
        return;
    }

    try {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
            base64: true
        });

        if (!result.canceled) {
            setImage(result.assets[0]);
        }
    } catch (error) {
        console.error("Error picking image:", error);
        Alert.alert("Error", "Could not pick image");
    }
  };

  const handleAddProduct = async () => {
     if (!name || !price || !categoryId || !image) return Alert.alert("Error", "Please fill all fields and select an image");
     
     setLoading(true);
     try {
        let imageUrl = '';

        if (image) {
            const formData = new FormData();
            formData.append('image', {
                uri: image.uri,
                name: image.fileName || 'product_image.jpg',
                type: image.mimeType || 'image/jpeg'
            } as any);

            const uploadRes = await api.post('/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (uploadRes.data && uploadRes.data.url) {
                imageUrl = uploadRes.data.url;
            }
        }
        
        const payload = {
            name,
            price: Number(price),
            category: categoryId, 
            description,
            image: imageUrl,
            isAvailable: true,
            isVeg
        };

        await api.post('/restaurants/products', payload);
        Alert.alert('Success', 'Product Published', [
            { text: 'OK', onPress: () => {
                // Reset form
                setName(''); setPrice(''); setDescription(''); setCategoryId(''); setImage(null); setIsVeg(true);
                router.navigate('menu'); 
            }}
        ]);

    } catch (error) {
        Alert.alert('Error', 'Failed to publish product');
    } finally {
        setLoading(false);
    }
  };

  return (

    <MainTemplate title="Add New Product" showHeader={false} noPadding>
       <View style={{ flex: 1, paddingHorizontal: 20 }}>
            {/* Custom Header */}
            <View style={styles.header}>
                <View style={{ width: 40 }} /> 
                <Text style={styles.headerTitle}>Add Product</Text>
                <View style={{ width: 40 }} /> 
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                
                <Text style={styles.sectionHeader}>Your Product Image</Text>
                <View style={styles.uploadContainer}>
                    {image ? (
                        <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                            <Image source={{ uri: image.uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                            <TouchableOpacity onPress={() => setImage(null)} style={styles.removeImageBtn}>
                                <Ionicons name="trash" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={{ alignItems: 'center' }}>
                            <View style={styles.cameraIconBg}>
                                <Ionicons name="camera" size={30} color="#f27f0d" />
                            </View>
                            <Text style={styles.uploadTitle}>Upload Product Photo</Text>
                            <Text style={styles.uploadSub}>Tap to select or take a photo</Text>
                            
                            <TouchableOpacity style={styles.selectBtn} onPress={pickImage}>
                                <Text style={styles.selectBtnText}>Select Photo</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                <Text style={styles.sectionHeader}>DETAILS</Text>
                
                <Text style={styles.label}>Item Name</Text>
                <Input placeholder="e.g. Spicy Zinger Burger" value={name} onChangeText={setName} />

                <Text style={styles.label}>Dietary Type</Text>
                <View style={styles.vegToggleContainer}>
                    <TouchableOpacity 
                        style={[styles.vegOption, isVeg && styles.vegOptionActive]} 
                        onPress={() => setIsVeg(true)}
                    >
                        <Ionicons name="leaf" size={16} color={isVeg ? "#fff" : "#2ecc71"} style={{ marginRight: 5 }} />
                        <Text style={[styles.vegText, isVeg && styles.vegTextActive]}>Veg</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.vegOption, !isVeg && styles.nonVegOptionActive]} 
                        onPress={() => setIsVeg(false)}
                    >
                        <Ionicons name="fast-food" size={16} color={!isVeg ? "#fff" : "#e74c3c"} style={{ marginRight: 5 }} />
                        <Text style={[styles.vegText, !isVeg && styles.vegTextActive]}>Non-Veg</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.label}>Price (₹)</Text>
                <Input placeholder="0.00" value={price} onChangeText={setPrice} keyboardType="numeric" prefix="₹" />

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, marginBottom: 8 }}>
                    <Text style={{ color: '#aaa', fontSize: 14 }}>Category</Text>
                    <TouchableOpacity onPress={() => setShowCategoryModal(true)}>
                        <Text style={{ color: '#f27f0d', fontWeight: 'bold' }}>+ Create New</Text>
                    </TouchableOpacity>
                </View>
                
                {/* Category Search */}
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#666" style={{ marginRight: 10 }} />
                    <TextInput 
                        placeholder="Search Category..." 
                        placeholderTextColor="#666"
                        style={{ flex: 1, color: '#fff' }}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                <View style={styles.categoryList}>
                    {filteredCategories.map(cat => (
                        <TouchableOpacity 
                            key={cat._id} 
                            onPress={() => setCategoryId(cat.name)}
                            style={[styles.categoryChip, categoryId === cat.name && styles.categoryChipActive]}
                        >
                            <Text style={[styles.categoryText, categoryId === cat.name && { color: '#fff', fontWeight: 'bold' }]}>{cat.name}</Text>
                        </TouchableOpacity>
                    ))}
                    
                    {filteredCategories.length === 0 && searchQuery.length === 0 && (
                        <Text style={{ color: '#666', fontStyle: 'italic' }}>No categories found</Text>
                    )}
                </View>

                {/* Create Category Modal */}
                <Modal
                    visible={showCategoryModal}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setShowCategoryModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Create New Category</Text>
                            <Input 
                                placeholder="Category Name (e.g. Starters)" 
                                value={newCategoryName}
                                onChangeText={setNewCategoryName}
                            />
                            <View style={styles.modalActions}>
                                <Button 
                                    title="Cancel" 
                                    onPress={() => setShowCategoryModal(false)} 
                                    variant="outline"
                                    style={{ flex: 1 }}
                                />
                                <Button
                                    title="Create"
                                    onPress={async () => {
                                        if (newCategoryName.trim()) {
                                            try {
                                                const res = await api.post('/restaurants/categories', { name: newCategoryName.trim() });
                                                const newCat = res.data;
                                                // @ts-ignore
                                                setCategories([...categories, newCat]);
                                                setCategoryId(newCat.name);
                                                setNewCategoryName('');
                                                setShowCategoryModal(false);
                                            } catch (e) {
                                                Alert.alert("Error", "Failed to create category");
                                            }
                                        }
                                    }}
                                    style={{ flex: 1 }}
                                />
                            </View>
                        </View>
                    </View>
                </Modal>

                <Text style={styles.label}>Description</Text>
                <View style={styles.textAreaContainer}>
                    <TextInput 
                        placeholder="Tell your customers about this delicious meal..."
                        placeholderTextColor="#666"
                        multiline
                        numberOfLines={4}
                        style={styles.textArea}
                        value={description}
                        onChangeText={setDescription}
                        textAlignVertical="top"
                    />
                </View>

                <Button 
                    title={loading ? "Publishing..." : "Publish Item"} 
                    onPress={handleAddProduct} 
                    disabled={loading}
                />
                
                <View style={{ height: 120 }} />
            </ScrollView>
       </View>
    </MainTemplate>
  );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
        marginTop: 10
    },
    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold'
    },
    sectionHeader: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 15,
        marginTop: 20,
    },
    uploadContainer: {
        borderWidth: 2,
        borderColor: '#f27f0d',
        borderStyle: 'dashed',
        borderRadius: 16,
        backgroundColor: '#1E1B16',
        height: 220,
        overflow: 'hidden',
        justifyContent: 'center'
    },
    cameraIconBg: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#2A1F16',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15
    },
    uploadTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5
    },
    uploadSub: {
        color: '#888',
        fontSize: 12,
        marginBottom: 20
    },
    selectBtn: {
        backgroundColor: '#f27f0d',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 8
    },
    selectBtnText: {
        color: '#fff',
        fontWeight: 'bold'
    },
    removeImageBtn: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 8,
        borderRadius: 20
    },
    label: {
        color: '#aaa',
        marginBottom: 8,
        marginTop: 15,
        fontSize: 14
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1e1e1e',
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 15
    },
    categoryList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    categoryChip: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#1e1e1e',
        borderRadius: 20,
        marginRight: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#333'
    },
    categoryChipActive: {
        backgroundColor: '#f27f0d',
        borderColor: '#f27f0d'
    },
    categoryText: {
        color: '#aaa'
    },
    textAreaContainer: {
        backgroundColor: '#1e1e1e',
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 12,
        padding: 15,
        marginBottom: 20
    },
    textArea: {
        color: '#fff',
        minHeight: 100
    },
    vegToggleContainer: {
        flexDirection: 'row',
        marginBottom: 15,
        backgroundColor: '#1e1e1e',
        borderRadius: 10,
        padding: 5
    },
    vegOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8
    },
    vegOptionActive: {
        backgroundColor: '#2ecc71',
    },
    nonVegOptionActive: {
        backgroundColor: '#e74c3c',
    },
    vegText: {
        color: '#666',
        fontWeight: 'bold'
    },
    vegTextActive: {
        color: '#fff'
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modalContent: {
        width: '100%',
        backgroundColor: '#1E1E1E',
        borderRadius: 20, // Slightly more curved
        padding: 25,
        borderWidth: 1,
        borderColor: '#333',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 10
    },
    modalTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center'
    },
    modalActions: {
        flexDirection: 'row',
        marginTop: 25,
        justifyContent: 'space-between',
        gap: 15 // Adding gap for spacing between buttons
    }
});

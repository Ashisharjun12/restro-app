
import { MainTemplate } from '../components/templates/MainTemplate';
import { Input } from '../components/atoms/Input';
import { Button } from '../components/atoms/Button';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { View, Text, Alert, Image, ScrollView, TouchableOpacity, StyleSheet, TextInput, Switch } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/api';

export default function EditProduct() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Params are always strings, so we need to parse them carefully
  const productId = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const [name, setName] = useState(params.name as string || '');
  const [price, setPrice] = useState(params.price as string || '');
  const [description, setDescription] = useState(params.description as string || '');
  const [categoryId, setCategoryId] = useState(params.category as string || '');
  
  // Image handling
  const initialImage = params.image ? { uri: params.image as string } : null;
  const [image, setImage] = useState(initialImage);
  
  // Handle 'true' string from params, or default to boolean true if creating new (though this is edit)
  const [isAvailable, setIsAvailable] = useState(params.isAvailable === 'true');
  const [isVeg, setIsVeg] = useState(params.isVeg === 'true');
  
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

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
          const res = await api.get('/restaurants/categories'); 
          const categoriesList = res.data.categories || [];
          setCategories(categoriesList);
          setFilteredCategories(categoriesList);
      } catch (error) {
          console.error("Failed to fetch categories");
          setCategories([]);
          setFilteredCategories([]);
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

  const handleUpdateProduct = async () => {
     if (!name || !price || !categoryId || !image) return Alert.alert("Error", "Please fill all fields");
     
     setLoading(true);
     try {
        let imageUrl = image.uri; 

        // Upload only if it's a new image (has type/mimeType)
        if (image.type || image.mimeType) {
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
            isAvailable: isAvailable // Ensure boolean is sent
        };

        await api.put(`/restaurants/products/${productId}`, payload);
        
        Alert.alert('Success', 'Product Updated', [
            { text: 'OK', onPress: () => router.back() }
        ]);

    } catch (error) {
        Alert.alert('Error', 'Failed to update product');
        console.error(error);
    } finally {
        setLoading(false);
    }
  };

  return (
    <MainTemplate title="Edit Product" showHeader={false} noPadding>
       <View style={{ flex: 1, paddingHorizontal: 20 }}>
            {/* Custom Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color="#f27f0d" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Product</Text>
                <View style={{ width: 40 }} /> 
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {/* ... rest of content ... */}
            
            <View style={styles.switchContainer}>
                <Text style={styles.label}>Available</Text>
                <Switch
                    trackColor={{ false: "#767577", true: "#f27f0d" }}
                    thumbColor={isAvailable ? "#fff" : "#f4f3f4"}
                    onValueChange={setIsAvailable}
                    value={isAvailable}
                />
            </View>

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

          <Text style={styles.label}>Price (₹)</Text>
          <Input placeholder="0.00" value={price} onChangeText={setPrice} keyboardType="numeric" prefix="₹" />

          <Text style={styles.label}>Category</Text>
          
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
               {/* Add Category Button */}
              {searchQuery.length > 0 && (
                  <TouchableOpacity 
                      onPress={() => {
                          if (!categories.some((c: any) => c.name.toLowerCase() === searchQuery.toLowerCase())) {
                              const newCat = { _id: `temp-${Date.now()}`, name: searchQuery };
                              // @ts-ignore
                              setCategories([...categories, newCat]);
                          }
                          setCategoryId(searchQuery);
                          setSearchQuery(''); 
                      }}
                      style={{ marginLeft: 10,  backgroundColor: '#f27f0d', borderRadius: 15, padding: 2 }}
                  >
                       <Ionicons name="add" size={20} color="#fff" />
                  </TouchableOpacity>
              )}
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
              {filteredCategories.length === 0 && (
                  <Text style={{ color: '#666', fontStyle: 'italic' }}>No categories found</Text>
              )}
          </View>

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
            title={loading ? "Updating..." : "Update Product"} 
            onPress={handleUpdateProduct} 
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
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start'
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
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        backgroundColor: '#1E1B16',
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333'
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
    }
});

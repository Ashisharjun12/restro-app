
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// User provided Ngrok URL for backend tunneling
// This avoids issues with localhost/10.0.2.2 on physical devices
const getBaseUrl = () => {
    return 'https://opposite-delivery-news-pickup.trycloudflare.com/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
});

// Add a request interceptor to attach the token
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('restaurantToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authApi = {
    sendOtp: (phone: string) => api.post('/auth/send-otp', { phone }),
    verifyOtp: (phone: string, code: string) => api.post('/auth/verify-otp', { phone, code, role: 'restaurant' }),
    register: (data: any) => api.post('/auth/register-restaurant', data),
};

export const commonApi = {
    getCities: () => api.get('/admin/cities'),
    getCategories: () => api.get('/admin/categories'),
    uploadImage: (formData: FormData) => api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export const restaurantApi = {
    // Products
    getProducts: () => api.get('/restaurants/products'),
    addProduct: (data: any) => api.post('/restaurants/products', data),
    
    // Orders
    getOrders: (params?: any) => api.get('/restaurants/orders', { params }),
    getOrderDetails: (orderId: string) => api.get(`/restaurants/orders/${orderId}`),
    updateOrderStatus: (orderId: string, status: string) => api.put(`/restaurants/orders/${orderId}/status`, { status }),
    
    // Subscription
    submitSubscription: (planId: string) => api.post('/restaurants/subscription', { planId }),
};

export default api;

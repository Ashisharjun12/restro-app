
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import api from '../api/api';
import { router } from 'expo-router';

interface User {
  _id: string;
  phone: string;
  role: string;
  id?: string;
  restaurantName?: string;
  isOpen?: boolean;
  address?: string;
  city?: string;
  image?: string;
  banner?: string;
  isVerified?: boolean;
  subscriptionStatus?: 'active' | 'expired' | 'pending_payment' | 'blocked' | 'none';
  subscriptionPlan?: '499' | '699' | '999' | 'none';
  subscriptionExpiry?: string;
  isSubscriptionBlocked?: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (phone: string, code: string) => Promise<boolean | 'pending'>;
  register: (data: { 
      name: string, 
      email: string, 
      phone: string, 
      restaurantName: string, 
      address: string, 
      city: string, 
      otp: string, 
      banner: string,
      location?: { lat: number, lng: number },
      deliveryRadius?: number
  }) => Promise<boolean>;
  logout: () => Promise<void>;
  sendOtp: (phone: string) => Promise<boolean>;
  checkAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
  toggleStatus: () => Promise<void>;
  checkUser: (phone: string) => Promise<boolean>;
}

const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  checkAuth: async () => {
    const token = await SecureStore.getItemAsync('restaurantToken');
    if (token) {
        try {
            const res = await api.get('/auth/me');
            set({ 
                user: res.data, 
                isAuthenticated: true 
            });
        } catch (error) {
            // Token invalid or user not found
            await SecureStore.deleteItemAsync('restaurantToken');
            set({ user: null, isAuthenticated: false });
        }
    } else {
        set({ user: null, isAuthenticated: false });
    }
  },

  login: async (phone, code) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/verify-otp', { phone, code, role: 'restaurant' });
      
      const userData = res.data.user;
      const token = res.data.token;

      if (userData.role === 'restaurant') {
        await SecureStore.setItemAsync('restaurantToken', token);
        set({ 
          user: userData, 
          isAuthenticated: true, 
          isLoading: false 
        });

        if (!userData.isVerified) {
            return 'pending'; // Signal to redirect to verification page
        }
        return true;
      } else {
        set({ 
          isLoading: false, 
          error: 'Not a restaurant account' 
        });
        return false;
      }
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.response?.data?.message || 'Login failed' 
      });
      return false;
    }
  },

  register: async (data) => {
      set({ isLoading: true, error: null });
      try {
          const res = await api.post('/auth/register-restaurant', data);
          const { token, user } = res.data;
          
          await SecureStore.setItemAsync('restaurantToken', token);
          set({
              user: user,
              isAuthenticated: true,
              isLoading: false
          });
          return true; // Registration successful
      } catch (error: any) {
          set({
              isLoading: false,
              error: error.response?.data?.message || 'Registration failed'
          });
          return false;
      }
  },

  toggleStatus: async () => {
      try {
          const res = await api.put('/restaurants/toggle-status');
          set(state => ({
              user: state.user ? { ...state.user, isOpen: res.data.isOpen } : null
          }));
      } catch (error) {
          console.error("Failed to toggle status", error);
      }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('restaurantToken');
    set({ user: null, isAuthenticated: false });
  },

  setUser: (user) => set({ user }),
  
  sendOtp: async (phone) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/auth/send-otp', { phone });
      set({ isLoading: false });
      return true;
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.response?.data?.message || 'Failed to send OTP' 
      });
      return false;
    }
  },

  checkUser: async (phone: string) => {
    try {
        const res = await api.post('/auth/check-user', { phone });
        return res.data.exists;
    } catch (error) {
        return false;
    }
}
}));

export default useAuthStore;

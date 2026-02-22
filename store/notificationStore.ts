/**
 * notificationStore — single source of truth for:
 *   • Socket.IO connection (one socket for the whole app)
 *   • Real-time order notifications
 *   • Unread badge count shown on the bell icon
 */
import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import api from '../api/api';

export const SOCKET_URL = 'https://opposite-delivery-news-pickup.trycloudflare.com';

export interface OrderNotification {
    id: string;          // order._id
    orderId: string;     // #ORD-xx
    customerName: string;
    customerPhone: string;
    itemCount: number;
    totalAmount: number;
    time: Date;
    read: boolean;
}

interface NotificationState {
    socket: Socket | null;
    isConnected: boolean;
    isConnecting: boolean;
    notifications: OrderNotification[];
    unreadCount: number;
    hasMore: boolean;
    loading: boolean;
    page: number;

    // Actions
    connect: (restaurantId: string) => void;
    disconnect: () => void;
    fetchNotifications: (page?: number, shouldAppend?: boolean) => Promise<void>;
    markAllRead: () => Promise<void>;
    markRead: (id: string) => Promise<void>;

    // Called by orders screen when a new_order arrives
    addOrderNotification: (order: any) => void;
}

const useNotificationStore = create<NotificationState>((set, get) => ({
    socket: null,
    isConnected: false,
    isConnecting: false,
    notifications: [],
    unreadCount: 0,
    hasMore: true,
    loading: false,
    page: 1,

    connect: (restaurantId: string) => {
        const existing = get().socket;
        if (existing?.connected) return;

        set({ isConnecting: true });

        const socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 10,
            reconnectionDelay: 1500,
            timeout: 15000,
        });

        socket.on('connect', () => {
            console.log('[Socket] Connected:', socket.id);
            socket.emit('join_restaurant', { restaurantId });
            set({ isConnected: true, isConnecting: false });
        });

        socket.on('connect_error', (err) => {
            console.warn('[Socket] Connect error:', err.message);
            set({ isConnected: false, isConnecting: false });
        });

        socket.on('disconnect', (reason) => {
            console.log('[Socket] Disconnected:', reason);
            set({ isConnected: false });
        });

        // Handle new incoming orders globally
        socket.on('new_order', (order: any) => {
            console.log('[Socket] new_order received:', order._id || order.orderId);
            get().addOrderNotification(order);
        });

        set({ socket });
    },

    disconnect: () => {
        const { socket } = get();
        socket?.disconnect();
        set({ socket: null, isConnected: false, isConnecting: false });
    },

    fetchNotifications: async (pageNum = 1, shouldAppend = false) => {
        set({ loading: true });
        try {
            const res = await api.get(`/restaurants/notifications?page=${pageNum}&limit=10`);
            const { notifications: rawNotifications, totalNotifications, totalPages } = res.data;
            
            const mapped = rawNotifications.map((n: any) => ({
                id: n._id,
                orderId: n.data?.orderRef || `#${n.data?.orderId?.slice(-6)?.toUpperCase()}` || 'Order',
                customerName: n.title,
                customerPhone: '',
                itemCount: 0,
                totalAmount: 0,
                time: n.createdAt,
                read: n.isRead,
            }));

            set(state => ({
                notifications: shouldAppend ? [...state.notifications, ...mapped] : mapped,
                unreadCount: totalNotifications,
                hasMore: pageNum < totalPages,
                page: pageNum,
                loading: false
            }));
        } catch (error) {
            console.error('[NotificationStore] Fetch failed:', error);
            set({ loading: false });
        }
    },

    addOrderNotification: (order: any) => {
        const notif: OrderNotification = {
            id: order._id || Math.random().toString(),
            orderId: order.orderId || `#${order._id?.slice(-6)?.toUpperCase()}`,
            customerName: order.user?.name || 'Customer',
            customerPhone: order.user?.phone || '',
            itemCount: order.items?.length || 0,
            totalAmount: order.totalAmount || 0,
            time: new Date(),
            read: false,
        };
        set(state => ({
            notifications: [notif, ...state.notifications].slice(0, 50), // keep last 50
            unreadCount: state.unreadCount + 1,
        }));
    },

    markAllRead: async () => {
        // Optimistic update - clear local list
        set({
            notifications: [],
            unreadCount: 0,
        });
        try {
            await api.put('/restaurants/notifications/read-all');
        } catch (error) {
            console.error('[NotificationStore] Read-all failed:', error);
        }
    },

    markRead: async (id: string) => {
        // Optimistic update: Remove from list to support "clear on read"
        set(state => {
            const notifications = state.notifications.filter(n => n.id !== id);
            return {
                notifications,
                unreadCount: Math.max(0, state.unreadCount - 1),
            };
        });
        try {
            await api.put(`/restaurants/notifications/${id}/read`);
        } catch (_) {}
    },
}));

export default useNotificationStore;

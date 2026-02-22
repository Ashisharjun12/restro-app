import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

// Derive socket URL from the backend base URL (strip /api)
const SOCKET_URL = 'https://opposite-delivery-news-pickup.trycloudflare.com';

interface SocketState {
    socket: Socket | null;
    isConnected: boolean;
    isConnecting: boolean;
    connect: (restaurantId: string) => void;
    disconnect: () => void;
}

const useSocketStore = create<SocketState>((set, get) => ({
    socket: null,
    isConnected: false,
    isConnecting: false,

    connect: (restaurantId: string) => {
        const existing = get().socket;
        if (existing?.connected) return; // already connected

        set({ isConnecting: true });

        const socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
            timeout: 10000,
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

        socket.on('disconnect', () => {
            console.log('[Socket] Disconnected');
            set({ isConnected: false });
        });

        set({ socket });
    },

    disconnect: () => {
        const { socket } = get();
        socket?.disconnect();
        set({ socket: null, isConnected: false, isConnecting: false });
    },
}));

export default useSocketStore;

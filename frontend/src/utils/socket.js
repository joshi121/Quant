// src/utils/socket.js
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

// Initialize the socket instance with configurations
export const socket = io(SOCKET_URL, {
  withCredentials: true,
  autoConnect: false, // Prevents connecting before the user logs in
});
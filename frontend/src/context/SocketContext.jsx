import React, { createContext, useEffect, useState, useContext } from 'react';
import { io } from 'socket.io-client';
import { getApiBaseUrl } from '../lib/api';
import { useAuth } from './AuthContext';

export const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { token, user } = useAuth();

  useEffect(() => {
    const newSocket = io(getApiBaseUrl(), {
      withCredentials: true,
      transports: ['websocket'],
      auth: token ? { token } : undefined,
    });

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      if (user?.id) {
        newSocket.emit('authenticate', { user_id: user.id });
      }
    });

    newSocket.on('NOTIFICATION', (data) => {
      console.log('Global Notification:', data);
      window.dispatchEvent(new CustomEvent('app-notification', { detail: data }));
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [token, user?.id]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  return context;
};

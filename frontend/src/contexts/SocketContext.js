import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user, token } = useAuth();

  useEffect(() => {
    if (token && user) {
      // Get socket URL from environment variable or use default
      const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5002';
      const newSocket = io(SOCKET_URL);
      
      setSocket(newSocket);
      
      // Register user with socket
      newSocket.on('connect', () => {
        newSocket.emit('register-user', user.id);
      });
      
      return () => {
        newSocket.close();
      };
    }
  }, [token, user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
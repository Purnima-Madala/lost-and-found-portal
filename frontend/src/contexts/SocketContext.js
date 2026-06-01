import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user, token } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    if (token && user && !socketRef.current) {
      const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5002';
      const newSocket = io(SOCKET_URL);
      socketRef.current = newSocket;
      setSocket(newSocket);
      
      newSocket.on('connect', () => {
        console.log('Socket connected');
        newSocket.emit('register-user', user.id);
      });
      
      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      };
    }
  }, [token, user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
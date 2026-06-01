import React, { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { Bell, X, CheckCircle, Package, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const { user } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    // Load saved notifications from localStorage
    const saved = localStorage.getItem(`notifications_${user?.id}`);
    if (saved) {
      setNotifications(JSON.parse(saved));
    }
  }, [user]);

  useEffect(() => {
    if (socket) {
      socket.on('notification', (notification) => {
        console.log('New notification:', notification);
        
        // Add to state
        const newNotification = {
          id: Date.now(),
          ...notification,
          read: false
        };
        
        setNotifications(prev => {
          const updated = [newNotification, ...prev].slice(0, 50);
          // Save to localStorage
          localStorage.setItem(`notifications_${user?.id}`, JSON.stringify(updated));
          return updated;
        });
        
        // Show toast
        toast.success(notification.message);
        
        // Play sound (optional)
        // new Audio('/notification.mp3').play();
      });
      
      return () => {
        socket.off('notification');
      };
    }
  }, [socket, user]);

  const markAsRead = (id) => {
    setNotifications(prev => {
      const updated = prev.map(n => 
        n.id === id ? { ...n, read: true } : n
      );
      localStorage.setItem(`notifications_${user?.id}`, JSON.stringify(updated));
      return updated;
    });
  };

  const clearNotifications = () => {
    setNotifications([]);
    localStorage.setItem(`notifications_${user?.id}`, JSON.stringify([]));
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    setShowDropdown(false);
    
    if (notification.type === 'claim') {
      navigate(`/item/${notification.itemId}`);
    } else if (notification.type === 'message') {
      navigate(`/chat/${notification.fromUserId}`);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative text-gray-600 hover:text-blue-600 transition"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50">
          <div className="p-3 border-b flex justify-between items-center">
            <h3 className="font-semibold">Notifications</h3>
            {notifications.length > 0 && (
              <button
                onClick={clearNotifications}
                className="text-xs text-gray-500 hover:text-red-500"
              >
                Clear all
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications yet
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-3 border-b hover:bg-gray-50 cursor-pointer transition ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {notification.type === 'claim' && (
                      <Package className="h-4 w-4 text-green-500 mt-1" />
                    )}
                    {notification.type === 'message' && (
                      <MessageCircle className="h-4 w-4 text-blue-500 mt-1" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notification.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
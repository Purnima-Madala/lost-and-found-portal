import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { formatDistanceToNow } from 'date-fns';
import { Send } from 'lucide-react';
import API_URL from '../config';
import toast from 'react-hot-toast';

const Chat = () => {
  const { userId } = useParams();
  const { user, token } = useAuth();
  const socket = useSocket();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState(null);
  const messagesEndRef = useRef(null);
  const conversationId = [user?.id, userId].sort().join('-');
  
  // Track if component is mounted and if listener is set
  const isMounted = useRef(true);
  const isListenerSetup = useRef(false);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (userId) {
      fetchMessages();
      fetchOtherUser();
    }
    
    return () => {
      if (socket && isListenerSetup.current) {
        socket.off('new-message');
        isListenerSetup.current = false;
      }
    };
  }, [userId]);

  // Socket listener - set up once
  useEffect(() => {
    if (socket && conversationId && !isListenerSetup.current) {
      // Join the conversation room
      socket.emit('join-conversation', conversationId);
      
      const handleNewMessage = (message) => {
        console.log('New message via socket:', message);
        
        // Only add if message is from the other user (not from current user)
        if (message.sender !== user?.id && isMounted.current) {
          setMessages(prev => {
            // Check for duplicates
            const exists = prev.some(m => 
              m._id === message._id || 
              (m.message === message.message && 
               m.sender === message.sender &&
               Math.abs(new Date(m.createdAt) - new Date(message.createdAt)) < 1000)
            );
            if (exists) return prev;
            return [...prev, message];
          });
        }
      };
      
      socket.on('new-message', handleNewMessage);
      isListenerSetup.current = true;
      
      return () => {
        socket.off('new-message', handleNewMessage);
        isListenerSetup.current = false;
      };
    }
  }, [socket, conversationId, user?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${API_URL}/messages/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (isMounted.current) {
        setMessages(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch messages', error);
    }
  };

  const fetchOtherUser = async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (isMounted.current) {
        setOtherUser(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch user', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    const messageText = newMessage.trim();
    setNewMessage(''); // Clear immediately
    
    const messageData = {
      conversationId,
      sender: user.id,
      receiver: userId,
      message: messageText,
      createdAt: new Date()
    };
    
    try {
      // Send to backend
      const response = await axios.post(`${API_URL}/messages/send`, messageData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Add sent message to UI
      const savedMessage = response.data;
      setMessages(prev => [...prev, savedMessage]);
      
      // Emit via socket for real-time
      if (socket) {
        socket.emit('send-message', savedMessage);
      }
    } catch (error) {
      console.error('Failed to send message', error);
      toast.error('Failed to send message');
      setNewMessage(messageText); // Restore on error
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!otherUser) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-white rounded-lg shadow-lg">
      <div className="bg-blue-600 text-white p-4 rounded-t-lg">
        <h2 className="text-xl font-semibold">Chat with {otherUser.name}</h2>
        <p className="text-sm text-blue-100">{otherUser.email}</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={msg._id || idx}
              className={`flex ${msg.sender === user.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  msg.sender === user.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                <p>{msg.message}</p>
                <p className={`text-xs mt-1 ${
                  msg.sender === user.id ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={sendMessage} className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
          >
            <Send size={20} />
            <span>Send</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat;
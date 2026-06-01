const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// MAKE IO GLOBALLY AVAILABLE
global.io = io;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files for uploads
app.use('/uploads', express.static('uploads'));

// Connect to MongoDB with better error handling
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => console.error('❌ MongoDB connection error:', err.message));

// Import Routes
const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items');
const messageRoutes = require('./routes/messages');
const lostItemRoutes = require('./routes/lostItems'); // ADD THIS LINE

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/lost-items', lostItemRoutes); // ADD THIS LINE

// Simple test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

// Socket.IO for real-time chat and notifications (COMBINED INTO ONE BLOCK)
io.on('connection', (socket) => {
  console.log('🟢 New user connected:', socket.id);
  
  // Store user ID with socket ID
  socket.on('register-user', (userId) => {
    socket.userId = userId;
    console.log(`User ${userId} registered with socket ${socket.id}`);
  });
  
  socket.on('join-conversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`User joined conversation: ${conversationId}`);
  });
  
  socket.on('send-message', (data) => {
    io.to(data.conversationId).emit('new-message', data);
  });
  
  // Send notification
  socket.on('send-notification', (data) => {
    console.log('Sending notification:', data);
    io.to(data.toUserId).emit('notification', {
      message: data.message,
      type: data.type,
      itemId: data.itemId,
      fromUserId: data.fromUserId,
      fromUserName: data.fromUserName,
      timestamp: new Date()
    });
  });
  
  socket.on('disconnect', () => {
    console.log('🔴 User disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 5002;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Test URL: http://localhost:${PORT}/api/test`);
});
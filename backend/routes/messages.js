const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { authenticateUser } = require('../middleware/auth');

// Send message
router.post('/send', authenticateUser, async (req, res) => {
  try {
    const { conversationId, receiver, message } = req.body;
    
    const newMessage = new Message({
      conversationId,
      sender: req.user.id,
      receiver,
      message
    });
    
    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get messages between two users
router.get('/:userId', authenticateUser, async (req, res) => {
  try {
    const conversationId = [req.user.id, req.params.userId].sort().join('-');
    
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 });
    
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
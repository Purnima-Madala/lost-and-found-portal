const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const { upload } = require('../utils/cloudinary');
const { authenticateUser } = require('../middleware/auth');

// Upload found item
router.post('/upload', authenticateUser, upload.single('image'), async (req, res) => {
  try {
    console.log('Upload attempt received');
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file provided' });
    }
    
    const { title, description, category, location } = req.body;
    
    // Validate required fields
    if (!title || !description || !category || !location) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }
    
    // Get image URL - use production Render URL if available
    let imageUrl;
    if (req.file.path) {
      // If using Cloudinary, req.file.path already has the full URL
      imageUrl = req.file.path;
    } else {
      // Fallback to local storage with production URL
      const baseUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${process.env.PORT || 5002}`;
      imageUrl = `${baseUrl}/uploads/${req.file.filename}`;
    }
    
    console.log('Saving image URL:', imageUrl);
    
    const newItem = new Item({
      title,
      description,
      category,
      location,
      imageUrl: imageUrl,
      publicId: req.file.filename || req.file.public_id,
      reportedBy: req.user.id,
      dateFound: new Date()
    });
    
    await newItem.save();
    console.log('Item saved successfully:', newItem._id);
    
    res.status(201).json({ success: true, item: newItem });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all found items
router.get('/found', authenticateUser, async (req, res) => {
  try {
    const items = await Item.find({ status: 'found' })
      .populate('reportedBy', 'name email studentId')
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single item
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate('reportedBy', 'name email phoneNumber studentId')
      .populate('claimedBy', 'name email phoneNumber');
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json(item);
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ error: error.message });
  }
});

// Claim an item (UPDATED WITH NOTIFICATION)
router.post('/:itemId/claim', authenticateUser, async (req, res) => {
  try {
    const { message } = req.body;
    const item = await Item.findById(req.params.itemId).populate('reportedBy', 'name email');
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    if (item.status !== 'found') {
      return res.status(400).json({ error: 'Item is no longer available' });
    }
    
    if (item.reportedBy._id.toString() === req.user.id) {
      return res.status(400).json({ error: 'You cannot claim your own item' });
    }
    
    item.claimRequest = {
      status: 'pending',
      message: message,
      requestedAt: new Date()
    };
    item.claimedBy = req.user.id;
    
    await item.save();
    
    // SEND REAL-TIME NOTIFICATION TO THE FINDER
    if (global.io) {
      global.io.to(item.reportedBy._id.toString()).emit('notification', {
        message: `${req.user.name || 'Someone'} has claimed your item: ${item.title}`,
        type: 'claim',
        itemId: item._id,
        fromUserId: req.user.id,
        fromUserName: req.user.name || 'A user',
        timestamp: new Date()
      });
      console.log(`Notification sent to finder: ${item.reportedBy._id}`);
    }
    
    res.json({ success: true, item });
  } catch (error) {
    console.error('Claim error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Respond to claim (approve/reject) (UPDATED WITH NOTIFICATION)
router.put('/:itemId/claim/respond', authenticateUser, async (req, res) => {
  try {
    const { status } = req.body;
    const item = await Item.findById(req.params.itemId)
      .populate('reportedBy', 'name email')
      .populate('claimedBy', 'name email');
    
    if (item.reportedBy._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Only the finder can respond to claims' });
    }
    
    item.claimRequest.status = status;
    if (status === 'approved') {
      item.status = 'claimed';
    } else if (status === 'rejected') {
      item.claimedBy = null;
    }
    
    await item.save();
    
    // SEND REAL-TIME NOTIFICATION TO THE CLAIMANT
    if (global.io && item.claimedBy) {
      const notificationMessage = status === 'approved' 
        ? `Your claim for "${item.title}" has been approved! You can now chat with the finder.`
        : `Your claim for "${item.title}" was rejected.`;
      
      global.io.to(item.claimedBy._id.toString()).emit('notification', {
        message: notificationMessage,
        type: status === 'approved' ? 'claim_approved' : 'claim_rejected',
        itemId: item._id,
        fromUserId: req.user.id,
        fromUserName: req.user.name,
        timestamp: new Date()
      });
      console.log(`Notification sent to claimant: ${item.claimedBy._id}`);
    }
    
    res.json({ success: true, item });
  } catch (error) {
    console.error('Response error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's claimed items
router.get('/my/claims', authenticateUser, async (req, res) => {
  try {
    const items = await Item.find({ claimedBy: req.user.id })
      .populate('reportedBy', 'name email phoneNumber');
    res.json(items);
  } catch (error) {
    console.error('Error fetching claims:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's found items
router.get('/my/found', authenticateUser, async (req, res) => {
  try {
    const items = await Item.find({ reportedBy: req.user.id })
      .populate('claimedBy', 'name email phoneNumber');
    res.json(items);
  } catch (error) {
    console.error('Error fetching found items:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
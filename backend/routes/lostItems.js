const express = require('express');
const router = express.Router();
const LostItem = require('../models/lostItems');
const { upload } = require('../utils/cloudinary');
const { authenticateUser } = require('../middleware/auth');

// Report lost item
router.post('/report', authenticateUser, upload.single('image'), async (req, res) => {
  try {
    console.log('Report lost item received');
    
    const { title, description, category, location, reward } = req.body;
    
    // Validate required fields
    if (!title || !description || !category || !location) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }
    
    let imageUrl = null;
    if (req.file) {
      imageUrl = `http://localhost:${process.env.PORT || 5002}/uploads/${req.file.filename}`;
    }
    
    const lostItem = new LostItem({
      title,
      description,
      category,
      location,
      reward: reward || 'No reward offered',
      imageUrl: imageUrl,
      publicId: req.file?.filename,
      reportedBy: req.user.id
    });
    
    await lostItem.save();
    console.log('Lost item saved successfully:', lostItem._id);
    
    res.status(201).json({ success: true, item: lostItem });
  } catch (error) {
    console.error('Error reporting lost item:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all lost items
router.get('/', authenticateUser, async (req, res) => {
  try {
    const items = await LostItem.find({ status: 'lost' })
      .populate('reportedBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    console.error('Error fetching lost items:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's lost items
router.get('/my-lost', authenticateUser, async (req, res) => {
  try {
    const items = await LostItem.find({ reportedBy: req.user.id })
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    console.error('Error fetching my lost items:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mark item as found
router.put('/:id/found', authenticateUser, async (req, res) => {
  try {
    const item = await LostItem.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    if (item.reportedBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    item.status = 'found';
    await item.save();
    
    res.json({ success: true, item });
  } catch (error) {
    console.error('Error marking item as found:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single lost item
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const item = await LostItem.findById(req.params.id)
      .populate('reportedBy', 'name email phoneNumber');
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json(item);
  } catch (error) {
    console.error('Error fetching lost item:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
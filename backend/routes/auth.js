const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { generateVerificationCode, sendVerificationEmail } = require('../utils/email');
const jwt = require('jsonwebtoken');

// Register new user - MODIFIED for production (auto-verify)
router.post('/register', async (req, res) => {
  try {
    const { email, name, studentId, collegeName, phoneNumber } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Create user - AUTO VERIFY for production (no email required)
    const user = new User({
      email,
      name,
      studentId,
      collegeName,
      phoneNumber,
      isEmailVerified: true,  // Auto-verify
      verificationCode: null
    });
    
    await user.save();
    
    // Create JWT token immediately
    const token = jwt.sign(
      { id: user._id, email: user.email }, 
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({ 
      success: true, 
      token, 
      user: { id: user._id, name: user.name, email: user.email },
      message: 'Registration successful! You are now logged in.'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Verify email (kept for compatibility, but auto-verified)
router.post('/verify', async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }
    
    // For auto-verified users, just login
    if (user.isEmailVerified) {
      const token = jwt.sign(
        { id: user._id, email: user.email }, 
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      return res.json({ 
        success: true, 
        token, 
        user: { id: user._id, name: user.name, email: user.email } 
      });
    }
    
    // Legacy verification (if needed)
    if (user.verificationCode !== code) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }
    
    // Mark as verified
    user.isEmailVerified = true;
    user.verificationCode = null;
    await user.save();
    
    // Create JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email }, 
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({ 
      success: true, 
      token, 
      user: { id: user._id, name: user.name, email: user.email } 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login - MODIFIED for production (auto-login)
router.post('/login', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ error: 'User not found. Please register first.' });
    }
    
    // For auto-verified users, just login
    // Create token directly
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({ 
      success: true, 
      token, 
      user: { id: user._id, name: user.name, email: user.email } 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user by ID
router.get('/user/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-verificationCode');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
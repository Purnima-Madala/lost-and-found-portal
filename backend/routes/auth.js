const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { generateVerificationCode, sendVerificationEmail } = require('../utils/email');
const jwt = require('jsonwebtoken');

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, name, studentId, collegeName, phoneNumber } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Generate verification code
    const verificationCode = generateVerificationCode();
    
    // Create user
    const user = new User({
      email,
      name,
      studentId,
      collegeName,
      phoneNumber,
      verificationCode
    });
    
    await user.save();
    
    // Send verification email
    await sendVerificationEmail(email, verificationCode);
    
    res.json({ success: true, message: 'Verification code sent to your email' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Verify email
router.post('/verify', async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }
    
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

// Login
router.post('/login', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ error: 'User not found. Please register first.' });
    }
    
    if (!user.isEmailVerified) {
      // Send new verification code
      const verificationCode = generateVerificationCode();
      user.verificationCode = verificationCode;
      await user.save();
      await sendVerificationEmail(email, verificationCode);
      return res.status(403).json({ error: 'Email not verified. New code sent.' });
    }
    
    // Create token
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
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import InviteCode from '../models/InviteCode.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, fellowshipRole, inviteCode } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    let userRole = 'MEMBER';
    let ministry = '';
    let familyId = null;

    // If invite code provided, validate and assign role
    if (inviteCode) {
      const invite = await InviteCode.findOne({ 
        code: inviteCode.toUpperCase(), 
        isActive: true,
        usedBy: null
      });

      if (!invite) {
        return res.status(400).json({ message: 'Invalid or expired invite code' });
      }

      // Check expiration
      if (invite.expiresAt && new Date() > invite.expiresAt) {
        return res.status(400).json({ message: 'Invite code has expired' });
      }

      // Assign role from invite code
      userRole = invite.role;
      ministry = invite.ministry || '';
      familyId = invite.familyId || null;
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      role: userRole,
      ministry,
      familyId,
      fellowshipRole: fellowshipRole || 'Member'
    });

    await user.save();

    // Mark invite code as used
    if (inviteCode) {
      await InviteCode.findOneAndUpdate(
        { code: inviteCode.toUpperCase() },
        { usedBy: user._id }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        ministry: user.ministry,
        familyId: user.familyId,
        fellowshipRole: user.fellowshipRole,
        profilePhoto: user.profilePhoto
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ message: 'Registration failed', error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        ministry: user.ministry,
        familyId: user.familyId,
        fellowshipRole: user.fellowshipRole,
        profilePhoto: user.profilePhoto
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
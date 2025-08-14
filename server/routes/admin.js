import express from 'express';
import User from '../models/User.js';
import Post from '../models/Post.js';
import Event from '../models/Event.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get dashboard stats
router.get('/stats', authenticate, authorize('admin'), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ isActive: true });
    const totalPosts = await Post.countDocuments({ isActive: true });
    const totalEvents = await Event.countDocuments({ isActive: true });
    const flaggedPosts = await Post.countDocuments({ isFlagged: true, isActive: true });

    // Get recent activity
    const recentPosts = await Post.find({ isActive: true })
      .populate('author', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentUsers = await User.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email role createdAt');

    res.json({
      stats: {
        totalUsers,
        totalPosts,
        totalEvents,
        flaggedPosts
      },
      recentActivity: {
        posts: recentPosts,
        users: recentUsers
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all users for management
router.get('/users', authenticate, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find({ isActive: true })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user role
router.put('/users/:id/role', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { role } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    res.json({ message: 'User role updated successfully', user });
  } catch (error) {
    res.status(400).json({ message: 'Failed to update user role', error: error.message });
  }
});

// Deactivate user
router.delete('/users/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Flag/unflag post
router.put('/posts/:id/flag', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { isFlagged } = req.body;
    
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { isFlagged },
      { new: true }
    );

    res.json({ message: 'Post flag status updated', post });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
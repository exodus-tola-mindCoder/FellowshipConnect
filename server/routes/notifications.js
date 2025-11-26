import express from 'express';
import mongoose from 'mongoose';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Notification Schema
const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['like', 'comment', 'prayer', 'rsvp', 'mention', 'event_reminder', 'new_post', 'new_event', 'mentorship_submitted', 'mentorship_updated', 'mentorship_message'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  relatedPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  relatedEvent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  },
  relatedComment: {
    type: mongoose.Schema.Types.ObjectId
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true
});

const Notification = mongoose.model('Notification', notificationSchema);

// Helper function to create notification
export const createNotification = async (data) => {
  try {
    const notification = new Notification(data);
    await notification.save();
    
    // Emit real-time notification if socket.io is available
    const io = global.io;
    if (io) {
      io.to(`user_${data.recipient}`).emit('new_notification', {
        ...notification.toObject(),
        sender: await mongoose.model('User').findById(data.sender).select('name profilePhoto')
      });
    }
    
    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

// Get notifications for user
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, unread } = req.query;
    const query = { recipient: req.user._id };

    if (type) {
      query.type = type;
    }

    if (unread === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .populate('sender', 'name profilePhoto')
      .populate('relatedPost', 'title')
      .populate('relatedEvent', 'title')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false
    });

    res.json({
      notifications,
      total,
      unreadCount,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get unread count
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark notification as read
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark all notifications as read
router.put('/mark-all-read', authenticate, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete notification
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete all read notifications
router.delete('/read/all', authenticate, async (req, res) => {
  try {
    await Notification.deleteMany({
      recipient: req.user._id,
      isRead: true
    });

    res.json({ message: 'All read notifications deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
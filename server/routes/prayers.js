import express from 'express';
import mongoose from 'mongoose';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Prayer Entry Schema
const prayerEntrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['personal', 'intercession', 'thanksgiving', 'request'],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  duration: {
    type: Number,
    required: true,
    min: 1
  },
  isAnswered: {
    type: Boolean,
    default: false
  },
  answeredDate: {
    type: Date
  },
  answeredDescription: {
    type: String,
    maxlength: 500
  },
  tags: [{
    type: String,
    maxlength: 50
  }],
  isPrivate: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const PrayerEntry = mongoose.model('PrayerEntry', prayerEntrySchema);

// Get prayer entries
router.get('/', authenticate, async (req, res) => {
  try {
    const { start, end, type, limit = 20 } = req.query;
    const query = { user: req.user._id };

    if (start && end) {
      query.createdAt = {
        $gte: new Date(start),
        $lte: new Date(end)
      };
    }

    if (type && type !== 'all') {
      query.type = type;
    }

    const prayers = await PrayerEntry.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json(prayers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get prayer statistics
router.get('/stats', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get basic stats
    const totalPrayers = await PrayerEntry.countDocuments({ user: userId });
    const answeredPrayers = await PrayerEntry.countDocuments({ 
      user: userId, 
      isAnswered: true 
    });
    
    // Get total duration
    const durationResult = await PrayerEntry.aggregate([
      { $match: { user: userId } },
      { $group: { _id: null, totalDuration: { $sum: '$duration' } } }
    ]);
    const totalDuration = durationResult[0]?.totalDuration || 0;

    // Get this week's prayers
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const thisWeekPrayers = await PrayerEntry.countDocuments({
      user: userId,
      createdAt: { $gte: weekStart }
    });

    // Calculate streak (simplified)
    const recentPrayers = await PrayerEntry.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(30);

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    const today = new Date();
    const prayerDates = new Set();
    
    recentPrayers.forEach(prayer => {
      const prayerDate = new Date(prayer.createdAt).toDateString();
      prayerDates.add(prayerDate);
    });

    // Calculate current streak
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      
      if (prayerDates.has(checkDate.toDateString())) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate longest streak (simplified)
    longestStreak = Math.max(currentStreak, Math.floor(totalPrayers / 7));

    res.json({
      totalPrayers,
      totalDuration,
      answeredPrayers,
      weeklyGoal: 7, // Default goal
      currentStreak,
      longestStreak,
      thisWeekPrayers
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create prayer entry
router.post('/', authenticate, async (req, res) => {
  try {
    const { type, title, description, duration, tags, isPrivate } = req.body;

    const prayer = new PrayerEntry({
      user: req.user._id,
      type,
      title,
      description,
      duration,
      tags: tags || [],
      isPrivate: isPrivate !== undefined ? isPrivate : true
    });

    await prayer.save();
    res.status(201).json(prayer);
  } catch (error) {
    res.status(400).json({ message: 'Failed to create prayer entry', error: error.message });
  }
});

// Update prayer entry
router.put('/:id', authenticate, async (req, res) => {
  try {
    const prayer = await PrayerEntry.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    });

    if (!prayer) {
      return res.status(404).json({ message: 'Prayer entry not found' });
    }

    Object.assign(prayer, req.body);
    await prayer.save();

    res.json(prayer);
  } catch (error) {
    res.status(400).json({ message: 'Failed to update prayer entry', error: error.message });
  }
});

// Delete prayer entry
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const prayer = await PrayerEntry.findOneAndDelete({ 
      _id: req.params.id, 
      user: req.user._id 
    });

    if (!prayer) {
      return res.status(404).json({ message: 'Prayer entry not found' });
    }

    res.json({ message: 'Prayer entry deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
import express from 'express';
import SpiritualLog from '../models/SpiritualLog.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get logs for a month (private to user)
router.get('/month', authenticate, async (req, res) => {
  try {
    const { year, month } = req.query; // month: 1-12
    const y = Number(year);
    const m = Number(month) - 1;
    if (!y || isNaN(m)) return res.status(400).json({ message: 'year and month are required' });
    const start = new Date(Date.UTC(y, m, 1, 0, 0, 0));
    const end = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59));

    const logs = await SpiritualLog.find({ user: req.user._id, date: { $gte: start, $lte: end } })
      .sort({ date: 1 })
      .lean();

    res.json({ logs });
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
});

// Upsert a day's log
router.post('/day', authenticate, async (req, res) => {
  try {
    const { date, activities } = req.body; // date in ISO
    if (!date) return res.status(400).json({ message: 'date is required' });
    const day = new Date(date);
    // normalize to midnight UTC
    const normalized = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate()));

    const doc = await SpiritualLog.findOneAndUpdate(
      { user: req.user._id, date: normalized },
      { $set: { activities: {
        prayerMinutes: Math.max(0, Number(activities?.prayerMinutes || 0)),
        bibleReadingMinutes: Math.max(0, Number(activities?.bibleReadingMinutes || 0)),
        devotionMinutes: Math.max(0, Number(activities?.devotionMinutes || 0)),
        notes: activities?.notes || ''
      }}},
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    res.json({ log: doc });
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
});

export default router;

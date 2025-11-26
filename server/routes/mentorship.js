import express from 'express';
import MentorshipRequest from '../models/MentorshipRequest.js';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import mongoose from 'mongoose';

const router = express.Router();

// Utility: ensure leader/admin
const ensureLeader = (req, res, next) => {
  if (['leader', 'admin'].includes(req.user.role)) return next();
  return res.status(403).json({ message: 'Leader access required' });
};

// Create a new mentorship request (member)
router.post('/', authenticate, async (req, res) => {
  try {
    const { topic, details, preferredTimes = [], isAnonymous = false } = req.body;
    const doc = await MentorshipRequest.create({
      requester: req.user._id,
      topic,
      details: details || '',
      preferredTimes,
      isAnonymous
    });

    // Notify admins/leaders: for simplicity, notify all leaders/admins
    const leaders = await User.find({ role: { $in: ['leader', 'admin'] }, isActive: true }).select('_id');
    const Notification = mongoose.model('Notification');
    await Promise.all(leaders.map(l => Notification.create({
      recipient: l._id,
      sender: req.user._id,
      type: 'mentorship_submitted',
      message: `New ${isAnonymous ? 'anonymous ' : ''}mentorship/counseling request: ${topic}`
    })));

    res.status(201).json({ message: 'Request submitted', request: doc });
  } catch (e) {
    res.status(400).json({ message: 'Failed to submit request', error: e.message });
  }
});

// Get my requests (member)
router.get('/me', authenticate, async (req, res) => {
  try {
    const list = await MentorshipRequest.find({ requester: req.user._id, isActive: true })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ requests: list });
  } catch (e) { res.status(500).json({ message: 'Server error', error: e.message }); }
});

// Leader dashboard list
router.get('/manage', authenticate, ensureLeader, async (req, res) => {
  try {
    const { status } = req.query;
    const query = { isActive: true };
    if (status) query.status = status;
    const list = await MentorshipRequest.find(query)
      .populate('requester', 'name profilePhoto')
      .populate('assignedLeader', 'name profilePhoto')
      .sort({ createdAt: -1 });
    res.json({ requests: list });
  } catch (e) { res.status(500).json({ message: 'Server error', error: e.message }); }
});

// Get one (allowed for requester or assigned leader)
router.get('/:id', authenticate, async (req, res) => {
  try {
    const doc = await MentorshipRequest.findById(req.params.id)
      .populate('requester', 'name profilePhoto')
      .populate('assignedLeader', 'name profilePhoto');
    if (!doc) return res.status(404).json({ message: 'Not found' });
    const isParty = doc.requester.equals(req.user._id) || (doc.assignedLeader && doc.assignedLeader.equals(req.user._id)) || ['admin','leader'].includes(req.user.role);
    if (!isParty) return res.status(403).json({ message: 'Not authorized' });
    res.json({ request: doc });
  } catch (e) { res.status(500).json({ message: 'Server error', error: e.message }); }
});

// Accept (assign self)
router.put('/:id/accept', authenticate, ensureLeader, async (req, res) => {
  try {
    const doc = await MentorshipRequest.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    doc.status = 'accepted';
    doc.assignedLeader = req.user._id;
    await doc.save();

    const Notification = mongoose.model('Notification');
    await Notification.create({
      recipient: doc.requester,
      sender: req.user._id,
      type: 'mentorship_updated',
      message: 'Your mentorship request has been accepted'
    });

    res.json({ message: 'Accepted', request: doc });
  } catch (e) { res.status(500).json({ message: 'Server error', error: e.message }); }
});

// Decline
router.put('/:id/decline', authenticate, ensureLeader, async (req, res) => {
  try {
    const doc = await MentorshipRequest.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    doc.status = 'declined';
    await doc.save();

    const Notification = mongoose.model('Notification');
    await Notification.create({
      recipient: doc.requester,
      sender: req.user._id,
      type: 'mentorship_updated',
      message: 'Your mentorship request has been declined'
    });

    res.json({ message: 'Declined', request: doc });
  } catch (e) { res.status(500).json({ message: 'Server error', error: e.message }); }
});

// Schedule
router.put('/:id/schedule', authenticate, ensureLeader, async (req, res) => {
  try {
    const { scheduledAt } = req.body;
    const doc = await MentorshipRequest.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    doc.status = 'scheduled';
    doc.assignedLeader = doc.assignedLeader || req.user._id;
    doc.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
    await doc.save();

    const Notification = mongoose.model('Notification');
    await Notification.create({
      recipient: doc.requester,
      sender: req.user._id,
      type: 'mentorship_updated',
      message: 'Your mentorship session has been scheduled'
    });

    res.json({ message: 'Scheduled', request: doc });
  } catch (e) { res.status(500).json({ message: 'Server error', error: e.message }); }
});

// Complete
router.put('/:id/complete', authenticate, ensureLeader, async (req, res) => {
  try {
    const doc = await MentorshipRequest.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    doc.status = 'completed';
    await doc.save();
    res.json({ message: 'Completed', request: doc });
  } catch (e) { res.status(500).json({ message: 'Server error', error: e.message }); }
});

// Private message in thread
router.post('/:id/message', authenticate, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ message: 'Content required' });
    const doc = await MentorshipRequest.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    const isParty = doc.requester.equals(req.user._id) || (doc.assignedLeader && doc.assignedLeader.equals(req.user._id)) || ['admin','leader'].includes(req.user.role);
    if (!isParty) return res.status(403).json({ message: 'Not authorized' });
    doc.privateChat.push({ sender: req.user._id, content });
    await doc.save();

    const Notification = mongoose.model('Notification');
    const recipient = doc.requester.equals(req.user._id) ? (doc.assignedLeader || null) : doc.requester;
    if (recipient) {
      await Notification.create({
        recipient,
        sender: req.user._id,
        type: 'mentorship_message',
        message: 'New message in your mentorship thread'
      });
    }

    res.status(201).json({ message: 'Sent', chat: doc.privateChat });
  } catch (e) { res.status(500).json({ message: 'Server error', error: e.message }); }
});

export default router;

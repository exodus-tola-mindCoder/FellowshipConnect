import express from 'express';
import Event from '../models/Event.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all events
router.get('/', authenticate, async (req, res) => {
  try {
    const events = await Event.find({ isActive: true })
      .populate('organizer', 'name profilePhoto')
      .populate('attendees.user', 'name profilePhoto')
      .sort({ date: 1 });

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create event
router.post('/', authenticate, authorize('leader', 'admin'), async (req, res) => {
  try {
    const { title, description, date, time, location, eventType, maxAttendees, imageUrl } = req.body;

    const event = new Event({
      title,
      description,
      date,
      time,
      location,
      organizer: req.user._id,
      eventType,
      maxAttendees,
      imageUrl: imageUrl || ''
    });

    await event.save();
    await event.populate('organizer', 'name profilePhoto');

    res.status(201).json({ message: 'Event created successfully', event });
  } catch (error) {
    res.status(400).json({ message: 'Failed to create event', error: error.message });
  }
});

// RSVP to event
router.post('/:id/rsvp', authenticate, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user already RSVPed
    const existingRSVP = event.attendees.find(
      attendee => attendee.user.toString() === req.user._id.toString()
    );

    if (existingRSVP) {
      return res.status(400).json({ message: 'Already RSVPed to this event' });
    }

    // Check max attendees
    if (event.maxAttendees && event.attendees.length >= event.maxAttendees) {
      return res.status(400).json({ message: 'Event is full' });
    }

    event.attendees.push({ user: req.user._id });
    await event.save();

    res.json({ message: 'RSVP successful', attendeesCount: event.attendees.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Cancel RSVP
router.delete('/:id/rsvp', authenticate, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    event.attendees = event.attendees.filter(
      attendee => attendee.user.toString() !== req.user._id.toString()
    );

    await event.save();
    res.json({ message: 'RSVP cancelled', attendeesCount: event.attendees.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete event
router.delete('/:id', authenticate, authorize('leader', 'admin'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check authorization
    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this event' });
    }

    event.isActive = false;
    await event.save();

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, maxlength: 3000 },
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

const mentorshipRequestSchema = new mongoose.Schema({
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  isAnonymous: { type: Boolean, default: false },
  topic: { 
    type: String, 
    enum: ['Spiritual Growth', 'Academic Guidance', 'Career', 'Relationships', 'Mental Health', 'Other'],
    required: true
  },
  details: { type: String, maxlength: 3000, default: '' },
  preferredTimes: [{ type: String }],
  status: { type: String, enum: ['pending', 'accepted', 'declined', 'scheduled', 'completed'], default: 'pending', index: true },
  assignedLeader: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  scheduledAt: { type: Date },
  privateChat: [messageSchema],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('MentorshipRequest', mentorshipRequestSchema);

import mongoose from 'mongoose';

const inviteCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  role: {
    type: String,
    required: true,
    enum: ['FAMILY_LEADER', 'TEAM_LEADER', 'GENERAL_LEADER', 'SUPER_ADMIN']
  },
  ministry: {
    type: String,
    default: ''
  },
  familyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Family',
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  usedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  expiresAt: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for faster lookups
inviteCodeSchema.index({ code: 1 });
inviteCodeSchema.index({ isActive: 1 });

export default mongoose.model('InviteCode', inviteCodeSchema);

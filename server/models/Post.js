import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 1000
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  type: {
    type: String,
    enum: ['prayer', 'testimony', 'announcement', 'celebration'],
    required: true
  },
  testimonyCategory: {
    type: String,
    enum: ['Healing', 'Provision', 'Breakthrough', 'Spiritual Growth', 'Deliverance', 'Other'],
    default: undefined
  },
  // Celebrations specific fields
  celebrationCategory: {
    type: String,
    enum: ['Birthday', 'Graduation', 'New Job', 'Achievement', 'Engagement', 'Other'],
    default: undefined
  },
  blessingReactions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  congratsReactions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  heartReactions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  amenReactions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  prayedFor: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [commentSchema],
  mediaUrl: {
    type: String,
    default: ''
  },
  searchText: {
    type: String,
    default: '',
    index: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFlagged: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

postSchema.pre('save', function(next) {
  // for search functionality: aggregate text fields
  const parts = [
    this.title || '',
    this.content || '',
    this.testimonyCategory || '',
    this.celebrationCategory || ''
  ];
  this.searchText = parts.join(' ').toLowerCase();
  next();
});

postSchema.index({ searchText: 'text', createdAt: -1, type: 1, testimonyCategory: 1, celebrationCategory: 1 });

export default mongoose.model('Post', postSchema);
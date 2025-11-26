import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  prayerMinutes: { type: Number, default: 0, min: 0 },
  bibleReadingMinutes: { type: Number, default: 0, min: 0 },
  devotionMinutes: { type: Number, default: 0, min: 0 },
  notes: { type: String, default: '', maxlength: 1000 }
}, { _id: false });

const spiritualLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date: { type: Date, required: true },
  activities: { type: activitySchema, default: () => ({}) }
}, { timestamps: true });

spiritualLogSchema.index({ user: 1, date: 1 }, { unique: true });

export default mongoose.model('SpiritualLog', spiritualLogSchema);

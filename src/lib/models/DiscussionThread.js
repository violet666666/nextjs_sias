import mongoose from 'mongoose';

const DiscussionThreadSchema = new mongoose.Schema({
  kelas_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Kelas', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.models.DiscussionThread || mongoose.model('DiscussionThread', DiscussionThreadSchema); 
import mongoose from 'mongoose';

const DiscussionCommentSchema = new mongoose.Schema({
  thread_id: { type: mongoose.Schema.Types.ObjectId, ref: 'DiscussionThread', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.models.DiscussionComment || mongoose.model('DiscussionComment', DiscussionCommentSchema); 
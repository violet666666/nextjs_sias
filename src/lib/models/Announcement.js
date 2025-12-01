import mongoose from "mongoose";

const AnnouncementSchema = new mongoose.Schema({
  kelas_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Kelas', required: true },
  text: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Announcement || mongoose.model('Announcement', AnnouncementSchema); 
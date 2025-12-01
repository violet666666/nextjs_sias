import mongoose, { Schema } from 'mongoose';

const ParentChildRequestSchema = new Schema({
  orangtua_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  siswa_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.ParentChildRequest || mongoose.model('ParentChildRequest', ParentChildRequestSchema); 
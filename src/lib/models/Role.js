import mongoose from 'mongoose';

const RoleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
}, { timestamps: true });

export default mongoose.models.Role || mongoose.model('Role', RoleSchema);
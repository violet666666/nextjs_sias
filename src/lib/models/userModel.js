import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const UserSchema = new mongoose.Schema(
  {
    nama: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "guru", "siswa", "orangtua"],
      default: "siswa",
    },
    foto: { type: String }, // URL atau path foto profil
    alamat: { type: String },
    nomor_telepon: { type: String },
    tempat_lahir: { type: String },
    tanggal_lahir: { type: Date },
    // Field khusus siswa
    nisn: { type: String },
    nama_ortu: { type: String },
    kelas_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Kelas' }, // Siswa hanya satu kelas
    // NEW: Online status and activity tracking
    online_status: {
      type: String,
      enum: ["online", "offline", "away"],
      default: "offline"
    },
    last_seen: { type: Date, default: Date.now },
    last_activity: { type: Date, default: Date.now },
    activity_log: [{
      action: { type: String },
      details: { type: mongoose.Schema.Types.Mixed },
      timestamp: { type: Date, default: Date.now }
    }]
  },
  { timestamps: true }
);

// Method to compare password
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password_hash);
};

// Method to update activity
UserSchema.methods.updateActivity = async function (action, details = {}) {
  this.last_activity = new Date();
  this.activity_log.push({
    action,
    details,
    timestamp: new Date()
  });

  // Keep only last 50 activities
  if (this.activity_log.length > 50) {
    this.activity_log = this.activity_log.slice(-50);
  }

  return await this.save();
};

// Indexes for search performance
UserSchema.index({ nama: 1, role: 1 });
UserSchema.index({ nisn: 1 });
UserSchema.index({ role: 1 });

export default mongoose.models.User || mongoose.model("User", UserSchema);

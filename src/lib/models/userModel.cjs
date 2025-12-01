const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

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
    foto: { type: String },
    alamat: { type: String },
    nomor_telepon: { type: String },
    tempat_lahir: { type: String },
    tanggal_lahir: { type: Date },
    nisn: { type: String },
    nama_ortu: { type: String },
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

UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password_hash);
};

UserSchema.methods.updateActivity = async function (action, details = {}) {
  this.last_activity = new Date();
  this.activity_log.push({
    action,
    details,
    timestamp: new Date()
  });
  if (this.activity_log.length > 50) {
    this.activity_log = this.activity_log.slice(-50);
  }
  return await this.save();
};

module.exports = mongoose.models.User || mongoose.model("User", UserSchema); 
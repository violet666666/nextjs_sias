import mongoose from "mongoose";

const AttendanceSessionSchema = new mongoose.Schema({
  kelas_id: { type: mongoose.Schema.Types.ObjectId, ref: "Kelas", required: true },
  mapel_id: { type: mongoose.Schema.Types.ObjectId, ref: "MataPelajaran" }, // Mata pelajaran untuk sesi ini
  guru_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Guru yang membuka sesi
  judul_pertemuan: { type: String, required: true },
  deskripsi_pertemuan: { type: String },
  waktu_mulai: { type: Date, required: true },
  waktu_selesai: { type: Date, required: true }, // Dihitung berdasarkan durasi
  status: { type: String, enum: ["open", "closed"], default: "open" }, // Status sesi
}, { timestamps: true });

// Indeks untuk query yang efisien
AttendanceSessionSchema.index({ kelas_id: 1, status: 1, waktu_selesai: 1 });
AttendanceSessionSchema.index({ guru_id: 1, status: 1 });

export default mongoose.models.AttendanceSession || mongoose.model("AttendanceSession", AttendanceSessionSchema);
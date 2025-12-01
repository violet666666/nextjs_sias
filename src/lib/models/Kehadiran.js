import mongoose from "mongoose";

const KehadiranSchema = new mongoose.Schema({
  kelas_id: { type: mongoose.Schema.Types.ObjectId, ref: "Kelas", required: true },
  mapel_id: { type: mongoose.Schema.Types.ObjectId, ref: 'MataPelajaran', required: true }, // Relasi ke mapel
  siswa_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  session_id: { type: mongoose.Schema.Types.ObjectId, ref: "AttendanceSession" }, // Tambahkan ini
  tanggal: { type: Date, required: true },
  status: { type: String, enum: ["Hadir", "Izin", "Sakit", "Alfa"], required: true },
}, { timestamps: true });

export default mongoose.models.Kehadiran || mongoose.model("Kehadiran", KehadiranSchema); 
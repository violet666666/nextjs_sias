import mongoose from "mongoose";

const KelasSchema = new mongoose.Schema({
  nama_kelas: { type: String, required: true },
  deskripsi: { type: String },
  tahun_ajaran: { type: String, required: true }, // Keep for backward compat, populated from AcademicYear name
  academic_year_id: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear' }, // New strict reference
  status_kelas: { type: String, enum: ["aktif", "nonaktif"], default: "aktif" },
  guru_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  matapelajaran_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MataPelajaran' }],
  siswa_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Daftar siswa dalam kelas
}, { timestamps: true });

export default mongoose.models.Kelas || mongoose.model("Kelas", KelasSchema); 
import mongoose from "mongoose";

const TugasSchema = new mongoose.Schema({
  kelas_id: { type: mongoose.Schema.Types.ObjectId, ref: "Kelas", required: true },
  mapel_id: { type: mongoose.Schema.Types.ObjectId, ref: 'MataPelajaran', required: true }, // Relasi ke mapel
  judul: { type: String, required: true },
  deskripsi: { type: String },
  tanggal_deadline: { type: Date, required: true },
  guru_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["active", "completed"], default: "active" },
}, { timestamps: true });

export default mongoose.models.Tugas || mongoose.model("Tugas", TugasSchema); 
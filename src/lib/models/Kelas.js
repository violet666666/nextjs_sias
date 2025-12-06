import mongoose from "mongoose";

const PengumumanSchema = new mongoose.Schema({
  deskripsi: { type: String, required: true },
  tanggal: { type: Date, default: Date.now },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { _id: true });

const KelasSchema = new mongoose.Schema({
  nama_kelas: { type: String, required: true },
  deskripsi: { type: String },
  tahun_ajaran: { type: String, required: true },
  status_kelas: { type: String, enum: ["aktif", "nonaktif"], default: "aktif" },
  guru_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  wali_kelas_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Wali kelas (sama dengan guru_id)
  matapelajaran_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MataPelajaran' }],
  siswa_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Daftar siswa dalam kelas
  pengumuman: [PengumumanSchema], // Array pengumuman langsung di kelas
}, { timestamps: true });

export default mongoose.models.Kelas || mongoose.model("Kelas", KelasSchema); 
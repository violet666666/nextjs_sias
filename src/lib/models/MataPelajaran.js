import mongoose from "mongoose";

const MataPelajaranSchema = new mongoose.Schema({
  nama: { type: String, required: true },
  kode: { type: String, unique: true, sparse: true },
  deskripsi: { type: String },
  kelas_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Kelas' }], // Satu mapel bisa untuk beberapa kelas
  guru_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Multiple teachers can teach this subject
  // Keep backward compatibility
  kelas_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Kelas' },
  guru_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.models.MataPelajaran || mongoose.model("MataPelajaran", MataPelajaranSchema); 
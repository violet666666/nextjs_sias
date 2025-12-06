import mongoose from "mongoose";

// Schema untuk assignment guru ke kelas spesifik
const GuruKelasAssignmentSchema = new mongoose.Schema({
  guru_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  kelas_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Kelas', 
    required: true 
  }
}, { _id: true });

// Index untuk memastikan kombinasi guru-kelas unik per mata pelajaran
GuruKelasAssignmentSchema.index({ guru_id: 1, kelas_id: 1 }, { unique: false });

const MataPelajaranSchema = new mongoose.Schema({
  nama: { type: String, required: true },
  kode: { type: String, unique: true, sparse: true },
  deskripsi: { type: String },
  total_jam_per_minggu: { type: Number, default: 0 }, // Total jam pelajaran per minggu
  kelas_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Kelas' }], // Satu mapel bisa untuk beberapa kelas
  guru_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Multiple teachers can teach this subject
  // Assignment spesifik: guru mana yang mengajar di kelas mana
  guru_kelas_assignments: [GuruKelasAssignmentSchema], // Array of {guru_id, kelas_id}
}, { timestamps: true });

export default mongoose.models.MataPelajaran || mongoose.model("MataPelajaran", MataPelajaranSchema); 
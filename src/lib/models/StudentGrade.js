import mongoose from "mongoose";

const StudentGradeSchema = new mongoose.Schema({
  siswa_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  mapel_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "MataPelajaran", 
    required: true 
  },
  kelas_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Kelas", 
    required: true 
  },
  guru_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  components: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  total_grade: { 
    type: Number, 
    default: 0 
  },
  semester: {
    type: String,
    enum: ['ganjil', 'genap'],
    default: 'ganjil'
  },
  tahun_ajaran: {
    type: String
  }
}, { timestamps: true });

// Index untuk query efisien
StudentGradeSchema.index({ siswa_id: 1, mapel_id: 1, kelas_id: 1, semester: 1 });
StudentGradeSchema.index({ kelas_id: 1, mapel_id: 1 });

export default mongoose.models.StudentGrade || mongoose.model("StudentGrade", StudentGradeSchema);


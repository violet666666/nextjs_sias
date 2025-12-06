import mongoose from "mongoose";

const GradeComponentSchema = new mongoose.Schema({
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
  components: [{
    name: { type: String, required: true },
    percentage: { type: Number, required: true, min: 0, max: 100 }
  }],
  total_percentage: { 
    type: Number, 
    required: true, 
    default: 100,
    validate: {
      validator: function(v) {
        return v === 100;
      },
      message: 'Total persentase harus 100%'
    }
  }
}, { timestamps: true });

// Index untuk memastikan satu komponen per mapel-kelas-guru
GradeComponentSchema.index({ mapel_id: 1, kelas_id: 1, guru_id: 1 }, { unique: true });

export default mongoose.models.GradeComponent || mongoose.model("GradeComponent", GradeComponentSchema);


import mongoose from "mongoose";

const GradeRecordSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subject_id: { type: mongoose.Schema.Types.ObjectId, ref: "MataPelajaran", required: true },
    class_id: { type: mongoose.Schema.Types.ObjectId, ref: "Kelas", required: true },
    academic_year_id: { type: mongoose.Schema.Types.ObjectId, ref: "AcademicYear", required: true },
    semester: { type: String, enum: ["Ganjil", "Genap"], required: true },

    // Detailed breakdown
    components: {
        tugas_avg: { type: Number, default: 0 },
        uh_avg: { type: Number, default: 0 },
        uts: { type: Number, default: 0 },
        uas: { type: Number, default: 0 }
    },

    // Weights used at the time of calculation (snapshot)
    weights: {
        tugas: { type: Number, default: 20 }, // %
        uh: { type: Number, default: 30 },
        uts: { type: Number, default: 20 },
        uas: { type: Number, default: 30 }
    },

    final_score: { type: Number, required: true },
    letter_grade: { type: String }, // A, B, C, D, E

    description: { type: String }, // Deskripsi pencapaian kompetensi (K13)
    teacher_notes: { type: String }, // Catatan khusus

    is_finalized: { type: Boolean, default: false } // If true, cannot be recalculated automatically
}, { timestamps: true });

// Compound index to ensure one grade record per student per subject per semester
GradeRecordSchema.index({ student_id: 1, subject_id: 1, academic_year_id: 1, semester: 1 }, { unique: true });

export default mongoose.models.GradeRecord || mongoose.model("GradeRecord", GradeRecordSchema);

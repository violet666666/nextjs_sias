import mongoose from "mongoose";

const ExamSchema = new mongoose.Schema({
    title: { type: String, required: true }, // e.g. "Ulangan Harian 1: Aljabar"
    type: {
        type: String,
        enum: ["UH", "UTS", "UAS"],
        required: true
    },
    subject_id: { type: mongoose.Schema.Types.ObjectId, ref: "MataPelajaran", required: true },
    class_id: { type: mongoose.Schema.Types.ObjectId, ref: "Kelas", required: true },
    academic_year_id: { type: mongoose.Schema.Types.ObjectId, ref: "AcademicYear", required: true },
    semester: { type: String, enum: ["Ganjil", "Genap"], required: true },
    date: { type: Date, required: true },
    // Max score for this exam? Usually 100 but good to be explicit
    max_score: { type: Number, default: 100 },
    // Optional: Link to a file or description
    description: { type: String },
    guru_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

export default mongoose.models.Exam || mongoose.model("Exam", ExamSchema);

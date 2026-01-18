import mongoose from "mongoose";

const ExamResultSchema = new mongoose.Schema({
    exam_id: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    feedback: { type: String }, // Optional feedback from teacher
    graded_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    graded_at: { type: Date, default: Date.now }
}, { timestamps: true });

// Ensure one result per student per exam
ExamResultSchema.index({ exam_id: 1, student_id: 1 }, { unique: true });

export default mongoose.models.ExamResult || mongoose.model("ExamResult", ExamResultSchema);

import mongoose from "mongoose";

const SubmissionSchema = new mongoose.Schema({
  tugas_id: { type: mongoose.Schema.Types.ObjectId, ref: "Tugas", required: true },
  siswa_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  guru_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  tanggal_kumpul: { type: Date, required: true },
  file_path: { type: String, required: true },
  nilai: { type: Number, default: 0 },
  feedback: { type: String },
  status: { type: String, enum: ["submitted", "graded"], default: "submitted" },
}, { timestamps: true });

export default mongoose.models.Submission || mongoose.model("Submission", SubmissionSchema); 
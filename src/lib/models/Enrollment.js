import mongoose from "mongoose";

const EnrollmentSchema = new mongoose.Schema({
  kelas_id: { type: mongoose.Schema.Types.ObjectId, ref: "Kelas", required: true },
  siswa_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

export default mongoose.models.Enrollment || mongoose.model("Enrollment", EnrollmentSchema); 
import mongoose from "mongoose";

const AcademicYearSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    example: "2024/2025" 
  },
  semester: { 
    type: String, 
    enum: ["Ganjil", "Genap"], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ["Active", "Archived", "Planned"], 
    default: "Planned" 
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isCurrent: { type: Boolean, default: false } // Helper to quickly find the active one
}, { timestamps: true });

// Ensure only one active academic year at a time
AcademicYearSchema.pre('save', async function(next) {
  if (this.isCurrent) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id } },
      { $set: { isCurrent: false } }
    );
  }
  next();
});

export default mongoose.models.AcademicYear || mongoose.model("AcademicYear", AcademicYearSchema);

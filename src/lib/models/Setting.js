import mongoose from "mongoose";

const SettingSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true }, // e.g., 'grade_weights'
    value: { type: mongoose.Schema.Types.Mixed, required: true }, // JSON object or string
    description: { type: String },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.models.Setting || mongoose.model("Setting", SettingSchema);

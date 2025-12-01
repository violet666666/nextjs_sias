import mongoose from "mongoose";

const BuletinSchema = new mongoose.Schema({
  judul: { type: String, required: true },
  isi: { type: String, required: true },
  tanggal: { type: Date, default: Date.now },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  // lampiran: { type: String }, // opsional, jika ingin file/gambar
}, { timestamps: true });

export default mongoose.models.Buletin || mongoose.model("Buletin", BuletinSchema); 
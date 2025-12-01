import mongoose from "mongoose";

const OrangtuaSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  siswa_ids: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  }], // Array untuk multiple children
  nomor_telepon: { type: String },
  alamat: { type: String },
  pekerjaan: { type: String },
  // email diambil dari User, tidak perlu duplikat di sini
}, { timestamps: true });

export default mongoose.models.Orangtua || mongoose.model("Orangtua", OrangtuaSchema); 
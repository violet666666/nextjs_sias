import mongoose from "mongoose";

const MataPelajaranSchema = new mongoose.Schema({
  nama: { type: String, required: true },
  kode: { type: String, unique: true, sparse: true },
  deskripsi: { type: String },
  kelas_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Kelas' },
  guru_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  guru_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

MataPelajaranSchema.pre('save', function(next) {
  if (Array.isArray(this.guru_ids) && this.guru_ids.length) {
    this.guru_id = this.guru_ids[0];
  } else if (this.guru_id) {
    this.guru_ids = [this.guru_id];
  } else {
    this.guru_ids = [];
  }
  next();
});

export default mongoose.models.MataPelajaran || mongoose.model("MataPelajaran", MataPelajaranSchema);
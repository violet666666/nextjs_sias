import mongoose from "mongoose";

const MataPelajaranSchema = new mongoose.Schema({
  nama_mapel: { type: String, required: true },
  kode_mapel: { type: String, unique: true, sparse: true },
  kkm: { type: Number, default: 75 },
  deskripsi: { type: String },
  kelas_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Kelas' },
  guru_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  guru_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  // Backward compatibility aliases
  nama: { type: String }, // Alias for nama_mapel
  kode: { type: String }  // Alias for kode_mapel
}, { timestamps: true });

// Pre-save middleware to sync guru_id and guru_ids
MataPelajaranSchema.pre('save', function (next) {
  // Sync guru_id and guru_ids
  if (Array.isArray(this.guru_ids) && this.guru_ids.length) {
    this.guru_id = this.guru_ids[0];
  } else if (this.guru_id) {
    this.guru_ids = [this.guru_id];
  } else {
    this.guru_ids = [];
  }

  // Sync nama_mapel with nama for backward compatibility
  if (this.nama_mapel && !this.nama) {
    this.nama = this.nama_mapel;
  } else if (this.nama && !this.nama_mapel) {
    this.nama_mapel = this.nama;
  }

  // Sync kode_mapel with kode
  if (this.kode_mapel && !this.kode) {
    this.kode = this.kode_mapel;
  } else if (this.kode && !this.kode_mapel) {
    this.kode_mapel = this.kode;
  }

  next();
});

export default mongoose.models.MataPelajaran || mongoose.model("MataPelajaran", MataPelajaranSchema);
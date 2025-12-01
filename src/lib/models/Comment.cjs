const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  kelas_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Kelas', required: true },
  text: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Comment || mongoose.model('Comment', CommentSchema); 
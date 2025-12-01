import mongoose from "mongoose";

const FileSchema = new mongoose.Schema({
  filename: { 
    type: String, 
    required: true 
  },
  originalName: { 
    type: String, 
    required: true 
  },
  mimeType: { 
    type: String, 
    required: true 
  },
  size: { 
    type: Number, 
    required: true 
  },
  path: { 
    type: String, 
    required: true 
  },
  url: { 
    type: String, 
    required: true 
  },
  uploadedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  category: { 
    type: String, 
    enum: ['assignment', 'profile', 'announcement', 'document', 'image', 'other'], 
    default: 'other' 
  },
  tags: [{ 
    type: String 
  }],
  description: { 
    type: String 
  },
  isPublic: { 
    type: Boolean, 
    default: false 
  },
  accessRoles: [{ 
    type: String, 
    enum: ['admin', 'guru', 'siswa', 'orangtua'] 
  }],
  relatedEntity: {
    type: { 
      type: String, 
      enum: ['tugas', 'kelas', 'user', 'announcement'] 
    },
    id: { 
      type: mongoose.Schema.Types.ObjectId 
    }
  },
  metadata: { 
    type: mongoose.Schema.Types.Mixed 
  },
  downloadCount: { 
    type: Number, 
    default: 0 
  },
  lastDownloaded: { 
    type: Date 
  },
  isDeleted: { 
    type: Boolean, 
    default: false 
  },
  deletedAt: { 
    type: Date 
  },
  deletedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Indexes for performance
FileSchema.index({ uploadedBy: 1, createdAt: -1 });
FileSchema.index({ category: 1 });
FileSchema.index({ 'relatedEntity.type': 1, 'relatedEntity.id': 1 });
FileSchema.index({ isDeleted: 1 });
FileSchema.index({ tags: 1 });

// Pre-save middleware
FileSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for file size in human readable format
FileSchema.virtual('sizeFormatted').get(function() {
  const bytes = this.size;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
});

// Virtual for file type icon
FileSchema.virtual('typeIcon').get(function() {
  const mimeType = this.mimeType;
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.startsWith('video/')) return '🎥';
  if (mimeType.startsWith('audio/')) return '🎵';
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📽️';
  if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';
  return '📎';
});

// Static methods
FileSchema.statics.findByUser = function(userId, options = {}) {
  const query = { uploadedBy: userId, isDeleted: false };
  return this.find(query).sort({ createdAt: -1 });
};

FileSchema.statics.findByCategory = function(category, options = {}) {
  const query = { category, isDeleted: false };
  return this.find(query).sort({ createdAt: -1 });
};

FileSchema.statics.findByEntity = function(entityType, entityId, options = {}) {
  const query = { 
    'relatedEntity.type': entityType, 
    'relatedEntity.id': entityId, 
    isDeleted: false 
  };
  return this.find(query).sort({ createdAt: -1 });
};

FileSchema.statics.searchFiles = function(searchTerm, options = {}) {
  const query = {
    isDeleted: false,
    $or: [
      { filename: { $regex: searchTerm, $options: 'i' } },
      { originalName: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } },
      { tags: { $in: [new RegExp(searchTerm, 'i')] } }
    ]
  };
  return this.find(query).sort({ createdAt: -1 });
};

// Instance methods
FileSchema.methods.incrementDownload = function() {
  this.downloadCount += 1;
  this.lastDownloaded = new Date();
  return this.save();
};

FileSchema.methods.softDelete = function(deletedBy) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  return this.save();
};

FileSchema.methods.restore = function() {
  this.isDeleted = false;
  this.deletedAt = undefined;
  this.deletedBy = undefined;
  return this.save();
};

// Ensure virtuals are serialized
FileSchema.set('toJSON', { virtuals: true });
FileSchema.set('toObject', { virtuals: true });

export default mongoose.models.File || mongoose.model("File", FileSchema); 
import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'CREATE_USER', 'UPDATE_USER', 'DELETE_USER',
      'CREATE_KELAS', 'UPDATE_KELAS', 'DELETE_KELAS',
      'CREATE_TUGAS', 'UPDATE_TUGAS', 'DELETE_TUGAS',
      'CREATE_BULLETIN', 'UPDATE_BULLETIN', 'DELETE_BULLETIN',
      'LOGIN', 'LOGOUT', 'LOGIN_FAILED',
      'ENROLL_STUDENT', 'REMOVE_STUDENT',
      'UPLOAD_FILE', 'DELETE_FILE',
      'GRADE_ASSIGNMENT', 'UPDATE_GRADE',
      'MARK_ATTENDANCE', 'UPDATE_ATTENDANCE',
      'SEND_NOTIFICATION', 'READ_NOTIFICATION',
      'EXPORT_DATA', 'IMPORT_DATA',
      'BULK_ACTION', 'SYSTEM_UPDATE',
      'CREATE_NOTIFICATION', 'CREATE_NOTIFICATION_BATCH',
      'CREATE_COMMENT', 'UPDATE_COMMENT', 'DELETE_COMMENT',
      'CREATE_THREAD', 'UPDATE_THREAD', 'DELETE_THREAD',
      'EXPORT_EXCEL', 'EXPORT_PDF'
    ]
  },
  resource_type: {
    type: String,
    required: true,
    enum: ['USER', 'KELAS', 'TUGAS', 'BULLETIN', 'ENROLLMENT', 'SUBMISSION', 'ATTENDANCE', 'NOTIFICATION', 'FILE', 'SYSTEM', 'DISCUSSION', 'ANNOUNCEMENT', 'REKAP_NILAI', 'REKAP_ABSENSI']
  },
  resource_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: false // Optional for system-level actions
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  ip_address: {
    type: String,
    required: false
  },
  user_agent: {
    type: String,
    required: false
  },
  status: {
    type: String,
    required: true,
    enum: ['SUCCESS', 'FAILED', 'PENDING'],
    default: 'SUCCESS'
  },
  error_message: {
    type: String,
    required: false
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
auditLogSchema.index({ user_id: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ resource_type: 1, resource_id: 1 });
auditLogSchema.index({ timestamp: -1 });

// Virtual for formatted timestamp
auditLogSchema.virtual('formatted_timestamp').get(function() {
  return this.timestamp.toLocaleString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
});

// Ensure virtuals are serialized
auditLogSchema.set('toJSON', { virtuals: true });
auditLogSchema.set('toObject', { virtuals: true });

const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);

export default AuditLog; 
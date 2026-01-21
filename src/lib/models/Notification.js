import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'error', 'task', 'announcement', 'grade', 'attendance', 'bulletin', 'buletin'],
    default: "info"
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['system', 'academic', 'personal', 'announcement'],
    default: 'system'
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  actionRequired: {
    type: Boolean,
    default: false
  },
  actionUrl: {
    type: String
  },
  actionText: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  expiresAt: {
    type: Date
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

// Index untuk performa query
NotificationSchema.index({ user_id: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ user_id: 1, type: 1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Pre-save middleware untuk update updatedAt
NotificationSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Static method untuk membuat notifikasi
NotificationSchema.statics.createNotification = async function (data) {
  return await this.create(data);
};

// Static method untuk notifikasi batch
NotificationSchema.statics.createBatchNotifications = async function (notifications) {
  return await this.insertMany(notifications);
};

// Instance method untuk mark as read
NotificationSchema.methods.markAsRead = async function () {
  this.read = true;
  this.readAt = new Date();
  return await this.save();
};

// Static method untuk cleanup expired notifications
NotificationSchema.statics.cleanupExpired = async function () {
  return await this.deleteMany({
    expiresAt: { $lt: new Date() }
  });
};

export default mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);
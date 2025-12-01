import mongoose from 'mongoose';
import { sendEmailNotification } from '../lib/services/notificationService';

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'error'],
    default: 'info'
  },
  category: {
    type: String,
    enum: ['system', 'task', 'grade', 'attendance', 'announcement', 'general'],
    default: 'system'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  target_url: {
    type: String,
    trim: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
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
}, {
  timestamps: true
});

// Indexes for better performance
notificationSchema.index({ user_id: 1, read: 1 });
notificationSchema.index({ user_id: 1, createdAt: -1 });
notificationSchema.index({ user_id: 1, category: 1 });
notificationSchema.index({ user_id: 1, priority: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for time ago
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diffInSeconds = Math.floor((now - this.createdAt) / 1000);
  
  if (diffInSeconds < 60) return 'Baru saja';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m yang lalu`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}j yang lalu`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}h yang lalu`;
  
  return this.createdAt.toLocaleDateString('id-ID');
});

// Static method to create notification
notificationSchema.statics.createNotification = async function(notificationData) {
  const notification = new this(notificationData);
  await notification.save();
  // Send email notification
  if (notification.user_id && notification.title && notification.message) {
    await sendEmailNotification({
      userId: notification.user_id,
      subject: notification.title,
      text: notification.message,
      html: `<h3>${notification.title}</h3><p>${notification.message}</p>`
    });
  }
  return notification;
};

// Static method to mark as read
notificationSchema.statics.markAsRead = async function(notificationId, userId) {
  return await this.findOneAndUpdate(
    { _id: notificationId, user_id: userId },
    { read: true, readAt: new Date() },
    { new: true }
  );
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = async function(userId) {
  return await this.updateMany(
    { user_id: userId, read: false },
    { read: true, readAt: new Date() }
  );
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({ user_id: userId, read: false });
};

// Static method to delete old notifications
notificationSchema.statics.deleteOldNotifications = async function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return await this.deleteMany({
    createdAt: { $lt: cutoffDate },
    read: true
  });
};

// Instance method to mark as read
notificationSchema.methods.markAsRead = async function() {
  this.read = true;
  this.readAt = new Date();
  return await this.save();
};

// Pre-save middleware
notificationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Ensure virtuals are included in JSON output
notificationSchema.set('toJSON', { virtuals: true });
notificationSchema.set('toObject', { virtuals: true });

const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

export default Notification; 
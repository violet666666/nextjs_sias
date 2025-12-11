import Notification from '../models/Notification';
import User from '../models/userModel';
import Kelas from '../models/Kelas';
import connectDB from '../db';
import mongoose from 'mongoose';
import { logCRUDAction } from '@/lib/auditLogger';
import nodemailer from 'nodemailer';

let getIO;
try {
  // Dynamic import agar tidak error ESM/CJS
  getIO = require('../config/socketServer.cjs').getIO;
} catch (e) {
  getIO = null;
}

class NotificationService {
  // Membuat notifikasi tunggal
  static async createNotification(data) {
    await connectDB();
    const notif = await Notification.createNotification(data);
    // Audit log
    await logCRUDAction(data.user_id, 'CREATE_NOTIFICATION', 'NOTIFICATION', notif._id, { title: data.title, type: data.type });
    // Emit ke socket user (jika ada getIO)
    if (getIO && typeof getIO === 'function') {
      const io = getIO();
      if (io) io.to(`user_${notif.user_id}`).emit('notification:new', notif);
    }
    return notif;
  }

  // Membuat notifikasi untuk multiple users
  static async createBatchNotifications(userIds, notificationData) {
    await connectDB();
    const notifications = userIds.map(userId => ({
      ...notificationData,
      user_id: userId
    }));
    const result = await Notification.createBatchNotifications(notifications);
    // Audit log untuk batch (log satu entry per batch)
    if (userIds.length > 0) {
      await logCRUDAction(
        userIds[0], // log dengan user pertama (atau bisa null jika ingin log sistem)
        'CREATE_NOTIFICATION_BATCH',
        'NOTIFICATION',
        result.map(n => n._id).join(','),
        { title: notificationData.title, type: notificationData.type, count: userIds.length }
      );
    }
    // Emit ke socket semua user
    if (getIO && typeof getIO === 'function') {
      const io = getIO();
      if (io) {
        result.forEach(notif => {
          io.to(`user_${notif.user_id}`).emit('notification:new', notif);
        });
      }
    }
    return result;
  }

  // Membuat notifikasi berdasarkan role
  static async createNotificationByRole(roles, notificationData) {
    await connectDB();
    const users = await User.find({ role: { $in: roles } });
    const userIds = users.map(user => user._id);
    return await this.createBatchNotifications(userIds, notificationData);
  }

  // Membuat notifikasi untuk siswa dalam kelas tertentu
  static async createNotificationForClass(classId, notificationData) {
    await connectDB();
    // Ambil semua siswa yang terdaftar di kelas
    const kelas = await Kelas.findById(classId);
    if (!kelas || !kelas.siswa_ids) return [];
    const userIds = kelas.siswa_ids.map(id => id.toString());
    return await this.createBatchNotifications(userIds, notificationData);
  }

  // Membuat notifikasi untuk siswa dalam kelas tertentu DAN orangtua mereka
  static async createNotificationForClassAndParents(classId, notificationData, parentNotificationData) {
    await connectDB();
    // Ambil semua siswa yang terdaftar di kelas
    const kelas = await Kelas.findById(classId);
    if (!kelas || !kelas.siswa_ids) return { siswaNotifs: [], ortuNotifs: [] };
    const siswaIds = kelas.siswa_ids.map(id => id.toString());
    // Notifikasi ke siswa
    const siswaNotifs = await this.createBatchNotifications(siswaIds, notificationData);
    // Cari semua orangtua dari siswa-siswa tersebut
    const Orangtua = (await import('../models/Orangtua.js')).default;
    const orangtuaDocs = await Orangtua.find({ siswa_ids: { $in: siswaIds } });
    const orangtuaIds = orangtuaDocs.map(o => o.user_id);
    // Notifikasi ke orangtua (jika ada parentNotificationData)
    let ortuNotifs = [];
    if (parentNotificationData && orangtuaIds.length > 0) {
      ortuNotifs = await this.createBatchNotifications(orangtuaIds, parentNotificationData);
    }
    return { siswaNotifs, ortuNotifs };
  }

  // Mendapatkan notifikasi user dengan pagination
  static async getUserNotifications(userId, options = {}) {
    await connectDB();
    const {
      page = 1,
      limit = 20,
      read = null,
      type = null,
      category = null,
      priority = null
    } = options;

    const query = { user_id: userId };
    
    if (read !== null) query.read = read;
    if (type) query.type = type;
    if (category) query.category = category;
    if (priority) query.priority = priority;

    const skip = (page - 1) * limit;
    
    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user_id', 'nama email role'),
      Notification.countDocuments(query)
    ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Mark notifikasi sebagai read
  static async markAsRead(notificationId, userId) {
    await connectDB();
    const notification = await Notification.findOne({ 
      _id: notificationId, 
      user_id: userId 
    });
    
    if (!notification) {
      throw new Error('Notifikasi tidak ditemukan');
    }
    
    return await notification.markAsRead();
  }

  // Mark semua notifikasi user sebagai read
  static async markAllAsRead(userId) {
    await connectDB();
    return await Notification.updateMany(
      { user_id: userId, read: false },
      { 
        read: true, 
        readAt: new Date() 
      }
    );
  }

  // Menghapus notifikasi
  static async deleteNotification(notificationId, userId) {
    await connectDB();
    return await Notification.findOneAndDelete({ 
      _id: notificationId, 
      user_id: userId 
    });
  }

  // Menghapus semua notifikasi read user
  static async deleteReadNotifications(userId) {
    await connectDB();
    return await Notification.deleteMany({ 
      user_id: userId, 
      read: true 
    });
  }

  // Mendapatkan statistik notifikasi user
  static async getNotificationStats(userId) {
    await connectDB();
    const stats = await Notification.aggregate([
      { $match: { user_id: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          unread: { $sum: { $cond: ['$read', 0, 1] } },
          byType: {
            $push: {
              type: '$type',
              read: '$read'
            }
          },
          byPriority: {
            $push: {
              priority: '$priority',
              read: '$read'
            }
          }
        }
      }
    ]);

    if (stats.length === 0) {
      return {
        total: 0,
        unread: 0,
        byType: {},
        byPriority: {}
      };
    }

    const stat = stats[0];
    
    // Group by type
    const byType = {};
    stat.byType.forEach(item => {
      if (!byType[item.type]) {
        byType[item.type] = { total: 0, unread: 0 };
      }
      byType[item.type].total++;
      if (!item.read) byType[item.type].unread++;
    });

    // Group by priority
    const byPriority = {};
    stat.byPriority.forEach(item => {
      if (!byPriority[item.priority]) {
        byPriority[item.priority] = { total: 0, unread: 0 };
      }
      byPriority[item.priority].total++;
      if (!item.read) byPriority[item.priority].unread++;
    });

    return {
      total: stat.total,
      unread: stat.unread,
      byType,
      byPriority
    };
  }

  // Cleanup expired notifications
  static async cleanupExpired() {
    await connectDB();
    return await Notification.cleanupExpired();
  }

  // Template notifikasi untuk berbagai event
  static getNotificationTemplates() {
    return {
      // Notifikasi tugas
      taskAssigned: (taskName, className) => ({
        title: 'Tugas Baru',
        message: `Anda mendapat tugas baru: "${taskName}" di kelas ${className}`,
        type: 'task',
        priority: 'medium',
        category: 'academic',
        actionRequired: true,
        actionUrl: '/cpanel/tasks',
        actionText: 'Lihat Tugas'
      }),

      // Notifikasi deadline
      taskDeadline: (taskName, hoursLeft) => ({
        title: 'Deadline Tugas',
        message: `Tugas "${taskName}" akan berakhir dalam ${hoursLeft} jam`,
        type: 'warning',
        priority: 'high',
        category: 'academic',
        actionRequired: true,
        actionUrl: '/cpanel/tasks',
        actionText: 'Selesaikan Tugas'
      }),

      // Notifikasi nilai
      gradePosted: (subject, score) => ({
        title: 'Nilai Baru',
        message: `Nilai untuk ${subject}: ${score}`,
        type: 'grade',
        priority: 'medium',
        category: 'academic',
        actionUrl: '/cpanel/grades',
        actionText: 'Lihat Nilai'
      }),

      // Notifikasi kehadiran
      attendanceReminder: (className) => ({
        title: 'Reminder Kehadiran',
        message: `Jangan lupa absen untuk kelas ${className}`,
        type: 'attendance',
        priority: 'medium',
        category: 'academic',
        actionUrl: '/cpanel/attendance',
        actionText: 'Absen Sekarang'
      }),

      // Notifikasi pengumuman
      announcement: (title, content) => ({
        title: 'Pengumuman Baru',
        message: content,
        type: 'announcement',
        priority: 'medium',
        category: 'announcement',
        actionUrl: '/cpanel/announcements',
        actionText: 'Baca Pengumuman'
      }),

      // Notifikasi sistem
      systemMaintenance: (message) => ({
        title: 'Pemeliharaan Sistem',
        message,
        type: 'info',
        priority: 'high',
        category: 'system'
      })
    };
  }
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export async function sendEmailNotification({ userId, subject, html, text }) {
  if (!userId) return;
  const user = await User.findById(userId);
  if (!user || !user.email) return;
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: user.email,
    subject,
    text,
    html
  });
}

export default NotificationService; 
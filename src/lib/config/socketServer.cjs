const { Server } = require('socket.io');
const mongoose = require('mongoose');
const Announcement = require('../models/Announcement');
const Comment = require('../models/Comment.cjs');
const Notification = require('../models/Notification');
const Tugas = require('../models/Tugas');
const Submission = require('../models/Submission');
const User = require('../models/userModel.cjs');
const { connectDB } = require('../mongodb');
const jwt = require('jsonwebtoken');
const Kelas = require('../models/Kelas');
const { setAuditLoggerIO } = require('../auditLogger');

let io;

function verifyJWT(token) {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET not set');
    return jwt.verify(token, secret);
  } catch (err) {
    return null;
  }
}

function initSocket(server) {
  if (io) return io;
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });
  setAuditLoggerIO(io);

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    const user = verifyJWT(token);
    if (!user) return next(new Error('Unauthorized: Invalid token'));
    socket.user = user;
    next();
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.user.id} connected`);

    // Real-time notification: join user room
    socket.on('join_user', async ({ userId }) => {
      socket.join(`user_${userId}`);
      // Update user online status
      await updateUserStatus(userId, 'online');
      io.emit('user_status_update', { userId, status: 'online' });
    });

    // Real-time notification: send notification (admin/guru)
    socket.on('send_notification', async ({ userId, text, type, link }) => {
      await connectDB();
      const notif = await Notification.create({ user_id: userId, text, type, link });
      io.to(`user_${userId}`).emit('notification', notif);
    });

    // Existing class/announcement/comment logic
    socket.on('join_class', async ({ classId }) => {
      socket.join(classId);
      await connectDB();
      const announcements = await Announcement.find({ kelas_id: classId }).sort({ createdAt: -1 });
      const comments = await Comment.find({ kelas_id: classId }).sort({ createdAt: -1 });
      io.to(classId).emit('announcement_update', announcements);
      io.to(classId).emit('comment_update', comments);
    });

    socket.on('disconnect', async () => {
      try {
        await updateUserStatus(socket.user.id, 'offline');
        io.emit('user_status_update', { userId: socket.user.id, status: 'offline' });
      } catch (err) {
        console.error('Error updating user offline status:', err);
      }
    });
  });
}

async function updateUserStatus(userId, status) {
  await connectDB();
  await User.findByIdAndUpdate(userId, { online_status: status, last_seen: new Date() });
}

function getIO() {
  return io;
}

async function broadcastDashboardStats() {
  if (!io) return;
  try {
    await connectDB();
    const totalSiswa = await User.countDocuments({ role: "siswa" });
    const totalGuru = await User.countDocuments({ role: "guru" });
    const totalKelas = await Kelas.countDocuments();
    const stats = { totalSiswa, totalGuru, totalKelas };
    io.emit('dashboard_stats_updated', stats);
    console.log('Dashboard stats broadcasted:', stats);
  } catch (error) {
    console.error('Error broadcasting dashboard stats:', error);
  }
}

module.exports = { initSocket, getIO, broadcastDashboardStats }; 
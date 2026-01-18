import connectDB from '../db';
import User from '../models/userModel';
import Kelas from '../models/Kelas';
import Tugas from '../models/Tugas';
import Kehadiran from '../models/Kehadiran';
import Submission from '../models/Submission';
import MataPelajaran from '../models/MataPelajaran';
import mongoose from 'mongoose';

class AnalyticsService {
  // Dashboard Overview Statistics
  static async getDashboardStats(role, userId = null) {
    await connectDB();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const baseStats = {
      totalUsers: await User.countDocuments(),
      totalClasses: await Kelas.countDocuments(),
      totalAssignments: await Tugas.countDocuments(),
      totalAttendance: await Kehadiran.countDocuments(),
      totalGrades: await Submission.countDocuments(),
    };

    // Role-specific stats
    if (role === 'admin') {
      return {
        ...baseStats,
        usersByRole: await this.getUsersByRole(),
        classesByStatus: await this.getClassesByStatus(),
        assignmentsByStatus: await this.getAssignmentsByStatus(),
        attendanceStats: await this.getAttendanceStats(),
        gradeStats: await this.getGradeStats(),
        monthlyGrowth: await this.getMonthlyGrowth(),
        recentActivity: await this.getRecentActivity(),
      };
    } else if (role === 'guru') {
      return {
        ...baseStats,
        myClasses: await Kelas.countDocuments({ guru_id: userId }),
        myAssignments: await Tugas.countDocuments({ guru_id: userId }),
        myStudents: await this.getMyStudentsCount(userId),
        classPerformance: await this.getClassPerformance(userId),
        assignmentCompletion: await this.getAssignmentCompletion(userId),
        attendanceRate: await this.getAttendanceRate(userId),
        atRiskStudents: await this.getAtRiskStudents(userId),
        recentSubmissions: await this.getRecentSubmissions(userId),
        recentGrades: await this.getRecentGrades(userId),
      };
    } else if (role === 'siswa') {
      return {
        ...baseStats,
        myClasses: await this.getMyClassesCount(userId),
        myAssignments: await this.getMyAssignmentsCount(userId),
        myAttendance: await this.getMyAttendanceStats(userId),
        myGrades: await this.getMyGradeStats(userId),
        upcomingDeadlines: await this.getUpcomingDeadlines(userId),
        recentGrades: await this.getRecentGrades(userId),
      };
    } else if (role === 'orangtua') {
      return {
        ...baseStats,
        childrenCount: await this.getChildrenCount(userId),
        childrenPerformance: await this.getChildrenPerformance(userId),
        childrenAttendance: await this.getChildrenAttendance(userId),
        recentUpdates: await this.getRecentUpdates(userId),
      };
    }

    return baseStats;
  }

  // Users by Role
  static async getUsersByRole() {
    const result = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    const roleMap = {};
    result.forEach(item => {
      roleMap[item._id] = item.count;
    });

    return roleMap;
  }

  // Classes by Status
  static async getClassesByStatus() {
    const result = await Kelas.aggregate([
      {
        $group: {
          _id: '$status_kelas',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusMap = {};
    result.forEach(item => {
      statusMap[item._id] = item.count;
    });

    return statusMap;
  }

  // Assignments by Status
  static async getAssignmentsByStatus() {
    const now = new Date();

    const result = await Tugas.aggregate([
      {
        $addFields: {
          status: {
            $cond: {
              if: { $lt: ['$tanggal_deadline', now] },
              then: 'overdue',
              else: {
                $cond: {
                  if: { $lt: [{ $subtract: ['$tanggal_deadline', now] }, 24 * 60 * 60 * 1000] },
                  then: 'due_soon',
                  else: 'active'
                }
              }
            }
          }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusMap = {};
    result.forEach(item => {
      statusMap[item._id] = item.count;
    });

    return statusMap;
  }

  // Attendance Statistics
  static async getAttendanceStats() {
    const result = await Kehadiran.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusMap = {};
    result.forEach(item => {
      statusMap[item._id] = item.count;
    });

    return statusMap;
  }

  // Grade Statistics
  static async getGradeStats() {
    const result = await Submission.aggregate([
      {
        $group: {
          _id: null,
          average: { $avg: '$nilai' },
          min: { $min: '$nilai' },
          max: { $max: '$nilai' },
          count: { $sum: 1 }
        }
      }
    ]);

    return result[0] || { average: 0, min: 0, max: 0, count: 0 };
  }

  // Monthly Growth
  static async getMonthlyGrowth() {
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(date);
    }

    const growthData = await Promise.all(months.map(async (month) => {
      const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
      const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);

      const [users, classes, assignments] = await Promise.all([
        User.countDocuments({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } }),
        Kelas.countDocuments({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } }),
        Tugas.countDocuments({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } })
      ]);

      return {
        month: month.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
        users,
        classes,
        assignments
      };
    }));

    return growthData;
  }

  // Recent Activity
  static async getRecentActivity(limit = 10) {
    const activities = [];

    // Recent user registrations
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('nama email role createdAt');

    recentUsers.forEach(user => {
      activities.push({
        type: 'user_registration',
        title: 'User Baru',
        description: `${user.nama} (${user.role}) mendaftar`,
        timestamp: user.createdAt,
        data: user
      });
    });

    // Recent class creations
    const recentClasses = await Kelas.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('guru_id', 'nama')
      .select('nama_kelas guru_id createdAt');

    recentClasses.forEach(kelas => {
      activities.push({
        type: 'class_creation',
        title: 'Kelas Baru',
        description: `Kelas ${kelas.nama_kelas} dibuat oleh ${kelas.guru_id?.nama}`,
        timestamp: kelas.createdAt,
        data: kelas
      });
    });

    // Recent assignments
    const recentAssignments = await Tugas.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('kelas_id', 'nama_kelas')
      .select('judul kelas_id createdAt');

    recentAssignments.forEach(tugas => {
      activities.push({
        type: 'assignment_creation',
        title: 'Tugas Baru',
        description: `Tugas "${tugas.judul}" di kelas ${tugas.kelas_id?.nama_kelas}`,
        timestamp: tugas.createdAt,
        data: tugas
      });
    });

    // Sort by timestamp and return top activities
    return activities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  // Teacher-specific methods

  // Helper: Get unique Class IDs where teacher is involved (Homeroom OR Subject)
  static async getTeacherScope(guruId) {
    // 1. Homeroom classes (where teacher is wali kelas)
    const homeroomClasses = await Kelas.find({ guru_id: guruId }).distinct('_id');

    // 2. Subject classes (where teacher teaches a subject)
    const subjectClasses = await MataPelajaran.find({
      $or: [{ guru_id: guruId }, { guru_ids: guruId }]
    }).distinct('kelas_id');

    // Combine and unique
    const allClassIds = [...new Set([
      ...homeroomClasses.map(id => id.toString()),
      ...subjectClasses.map(id => id?.toString()).filter(Boolean)
    ])];

    // Get Subject IDs for this teacher
    const mySubjectIds = await MataPelajaran.find({
      $or: [{ guru_id: guruId }, { guru_ids: guruId }]
    }).distinct('_id');

    return { classIds: allClassIds, subjectIds: mySubjectIds };
  }

  // Get students at risk (low grades or high absence)
  static async getAtRiskStudents(guruId) {
    const { subjectIds, classIds } = await this.getTeacherScope(guruId);

    const riskMap = new Map();

    // 1. Low Grades (nilai < 75)
    const tugasIds = await Tugas.find({
      $or: [
        { mata_pelajaran_id: { $in: subjectIds } },
        { kelas_id: { $in: classIds } }
      ]
    }).distinct('_id');

    const lowGrades = await Submission.find({
      tugas_id: { $in: tugasIds },
      nilai: { $lt: 75, $gt: 0 }
    }).populate('siswa_id', 'nama email').limit(20);

    lowGrades.forEach(g => {
      if (!g.siswa_id) return;
      const sid = g.siswa_id._id.toString();
      if (!riskMap.has(sid)) {
        riskMap.set(sid, { id: sid, nama: g.siswa_id.nama, issues: [] });
      }
      riskMap.get(sid).issues.push(`Nilai rendah: ${g.nilai}`);
    });

    // 2. High Absence (Alfa >= 2)
    const badAttendance = await Kehadiran.aggregate([
      { $match: { kelas_id: { $in: classIds.map(id => new mongoose.Types.ObjectId(id)) }, status: 'Alfa' } },
      { $group: { _id: '$siswa_id', count: { $sum: 1 } } },
      { $match: { count: { $gte: 2 } } }
    ]);

    await User.populate(badAttendance, { path: '_id', select: 'nama' });
    badAttendance.forEach(a => {
      if (!a._id) return;
      const sid = a._id._id?.toString() || a._id.toString();
      if (!riskMap.has(sid)) {
        riskMap.set(sid, { id: sid, nama: a._id.nama || 'Unknown', issues: [] });
      }
      riskMap.get(sid).issues.push(`Alfa ${a.count} kali`);
    });

    return Array.from(riskMap.values()).slice(0, 5);
  }

  static async getMyStudentsCount(guruId) {
    const myClasses = await Kelas.find({ guru_id: guruId }).select('_id');
    const classIds = myClasses.map(k => k._id);

    // Count students enrolled in my classes
    const kelasList = await Kelas.find({ _id: { $in: classIds } });
    return kelasList.reduce((total, k) => total + (k.siswa_ids?.length || 0), 0);
  }

  static async getClassPerformance(guruId) {
    const myClasses = await Kelas.find({ guru_id: guruId }).select('_id nama_kelas');

    const performance = await Promise.all(myClasses.map(async (kelas) => {
      const grades = await Submission.find({ kelas_id: kelas._id });

      const average = grades.length > 0
        ? grades.reduce((sum, grade) => sum + grade.nilai, 0) / grades.length
        : 0;

      return {
        kelas: kelas.nama_kelas,
        averageGrade: Math.round(average * 100) / 100,
        totalStudents: grades.length
      };
    }));

    return performance;
  }

  static async getAssignmentCompletion(guruId) {
    const myAssignments = await Tugas.find({ guru_id: guruId }).select('_id judul kelas_id');

    const completion = await Promise.all(myAssignments.map(async (tugas) => {
      const submissions = await Submission.find({ tugas_id: tugas._id });

      return {
        tugas: tugas.judul,
        totalSubmissions: submissions.length,
        completed: submissions.filter(s => s.status === 'completed').length
      };
    }));

    return completion;
  }

  static async getAttendanceRate(guruId) {
    const myClasses = await Kelas.find({ guru_id: guruId }).select('_id nama_kelas');

    const attendance = await Promise.all(myClasses.map(async (kelas) => {
      const sessions = await Kehadiran.distinct('session_id', { kelas_id: kelas._id });
      const totalAttendance = await Kehadiran.countDocuments({ kelas_id: kelas._id });
      const presentAttendance = await Kehadiran.countDocuments({
        kelas_id: kelas._id,
        status: 'Hadir'
      });

      return {
        kelas: kelas.nama_kelas,
        totalSessions: sessions.length,
        attendanceRate: sessions.length > 0 ? (presentAttendance / totalAttendance * 100).toFixed(2) : 0
      };
    }));

    return attendance;
  }

  // Student-specific methods
  static async getMyClassesCount(siswaId) {
    return await Kelas.countDocuments({ siswa_ids: siswaId });
  }

  static async getMyAssignmentsCount(siswaId) {
    const myClasses = await Kelas.find({ siswa_ids: siswaId }).select('_id');
    const classIds = myClasses.map(k => k._id);

    return await Tugas.countDocuments({ kelas_id: { $in: classIds } });
  }

  static async getMyAttendanceStats(siswaId) {
    const totalAttendance = await Kehadiran.countDocuments({ siswa_id: siswaId });
    const presentAttendance = await Kehadiran.countDocuments({
      siswa_id: siswaId,
      status: 'Hadir'
    });

    return {
      total: totalAttendance,
      present: presentAttendance,
      rate: totalAttendance > 0 ? (presentAttendance / totalAttendance * 100).toFixed(2) : 0
    };
  }

  static async getMyGradeStats(siswaId) {
    const grades = await Submission.find({ siswa_id: siswaId });

    if (grades.length === 0) {
      return { average: 0, total: 0, highest: 0, lowest: 0 };
    }

    const values = grades.map(g => g.nilai);
    return {
      average: (values.reduce((sum, val) => sum + val, 0) / values.length).toFixed(2),
      total: grades.length,
      highest: Math.max(...values),
      lowest: Math.min(...values)
    };
  }

  static async getUpcomingDeadlines(siswaId, limit = 5) {
    const myClasses = await Kelas.find({ siswa_ids: siswaId }).select('_id');
    const classIds = myClasses.map(k => k._id);

    const now = new Date();
    const upcoming = await Tugas.find({
      kelas_id: { $in: classIds },
      tanggal_deadline: { $gt: now }
    })
      .sort({ tanggal_deadline: 1 })
      .limit(limit)
      .populate('kelas_id', 'nama_kelas')
      .select('judul tanggal_deadline kelas_id');

    return upcoming;
  }

  // Parent-specific methods
  static async getChildrenCount(orangtuaId) {
    const Orangtua = mongoose.model('Orangtua');
    const orangtua = await Orangtua.findOne({ user_id: orangtuaId });
    return orangtua ? orangtua.siswa_ids.length : 0;
  }

  static async getChildrenPerformance(orangtuaId) {
    const Orangtua = mongoose.model('Orangtua');
    const orangtua = await Orangtua.findOne({ user_id: orangtuaId });

    if (!orangtua) return [];

    const performance = await Promise.all(orangtua.siswa_ids.map(async (siswaId) => {
      const siswa = await User.findById(siswaId).select('nama');
      const grades = await Submission.find({ siswa_id: siswaId });

      const average = grades.length > 0
        ? grades.reduce((sum, grade) => sum + grade.nilai, 0) / grades.length
        : 0;

      return {
        nama: siswa?.nama || 'Unknown',
        averageGrade: Math.round(average * 100) / 100,
        totalGrades: grades.length
      };
    }));

    return performance;
  }

  static async getChildrenAttendance(orangtuaId) {
    const Orangtua = mongoose.model('Orangtua');
    const orangtua = await Orangtua.findOne({ user_id: orangtuaId });

    if (!orangtua || !orangtua.siswa_ids || orangtua.siswa_ids.length === 0) return 0;

    const totalRecords = await Kehadiran.countDocuments({ siswa_id: { $in: orangtua.siswa_ids } });
    const presentRecords = await Kehadiran.countDocuments({
      siswa_id: { $in: orangtua.siswa_ids },
      status: 'Hadir'
    });

    return totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;
  }

  static async getRecentUpdates(orangtuaId, limit = 5) {
    const Orangtua = mongoose.model('Orangtua');
    const orangtua = await Orangtua.findOne({ user_id: orangtuaId });

    if (!orangtua || !orangtua.siswa_ids || orangtua.siswa_ids.length === 0) return [];

    const recentGrades = await Submission.find({ siswa_id: { $in: orangtua.siswa_ids } })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .populate('siswa_id', 'nama')
      .populate('tugas_id', 'judul');

    return recentGrades.map(g => ({
      type: 'grade',
      title: 'Nilai Baru',
      description: `${g.siswa_id?.nama || 'Anak'} mendapat nilai ${g.nilai} di ${g.tugas_id?.judul || 'Tugas'}`,
      timestamp: g.updatedAt
    }));
  }

  // Export data for reports
  static async exportData(type, filters = {}) {
    await connectDB();

    switch (type) {
      case 'users':
        return await User.find(filters).select('-password');

      case 'classes':
        return await Kelas.find(filters).populate('guru_id', 'nama email');

      case 'assignments':
        return await Tugas.find(filters).populate('kelas_id', 'nama_kelas');

      case 'attendance':
        return await Kehadiran.find(filters).populate('siswa_id', 'nama');

      case 'grades':
        return await Submission.find(filters).populate('siswa_id', 'nama');

      default:
        throw new Error('Invalid export type');
    }
  }

  static async getRecentSubmissions(userId) {
    // Ambil 5 submission terbaru untuk tugas yang diajar guru ini
    const submissions = await Submission.find({ guru_id: userId })
      .sort({ tanggal_kumpul: -1 })
      .limit(5)
      .populate('siswa_id tugas_id');
    return submissions;
  }

  static async getRecentGrades(userId) {
    // Ambil 5 submission yang sudah dinilai (graded) untuk tugas yang diajar guru ini
    const grades = await Submission.find({ guru_id: userId, status: 'graded' })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate('siswa_id tugas_id');
    return grades;
  }
}

export default AnalyticsService; 

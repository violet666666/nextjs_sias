import connectDB from '../db';
import User from '../models/userModel';
import Kelas from '../models/Kelas';
import Tugas from '../models/Tugas';
import Kehadiran from '../models/Kehadiran';
import Submission from '../models/Submission';
import mongoose from 'mongoose';
import Enrollment from '../models/Enrollment';
import MataPelajaran from '../models/MataPelajaran';

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
      const gradeStats = await this.getGradeStats();

      return {
        ...baseStats,
        activeClasses: await Kelas.countDocuments({ status_kelas: 'Aktif' }),
        completionRate: await this.getCompletionRate(),
        averageGrade: gradeStats.average ? Math.round(gradeStats.average) : 0,
        usersByRole: await this.getUsersByRole(),
        classesByStatus: await this.getClassesByStatus(),
        assignmentsByStatus: await this.getAssignmentsByStatus(),
        attendanceStats: await this.getAttendanceStats(),
        gradeStats: gradeStats,
        monthlyGrowth: await this.getMonthlyGrowth(),
        recentActivity: await this.getRecentActivity(),
        attendanceTrend: await this.getAttendanceTrend(),
        gradeDistribution: await this.getGradeDistribution(),
        subjectPerformance: await this.getSubjectPerformance(),
      };
    } else if (role === 'guru') {
      return {
        ...baseStats,
        myClasses: await this.getTeacherClassCount(userId),
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
    // 1. Homeroom classes
    const homeroomClasses = await Kelas.find({ guru_id: guruId }).distinct('_id');

    // 2. Subject classes
    const subjectClasses = await MataPelajaran.find({
      $or: [{ guru_id: guruId }, { guru_ids: guruId }]
    }).distinct('kelas_id');

    // Combine and unique
    const allClassIds = [...new Set([...homeroomClasses.map(id => id.toString()), ...subjectClasses.map(id => id.toString())])];

    // Get Subject IDs for this teacher (to filter data later)
    const mySubjectIds = await MataPelajaran.find({
      $or: [{ guru_id: guruId }, { guru_ids: guruId }]
    }).distinct('_id');

    return { classIds: allClassIds, subjectIds: mySubjectIds };
  }

  static async getTeacherClassCount(guruId) {
    const { classIds } = await this.getTeacherScope(guruId);
    return classIds.length;
  }

  static async getMyStudentsCount(guruId) {
    const { classIds } = await this.getTeacherScope(guruId);
    return await Enrollment.countDocuments({ kelas_id: { $in: classIds } });
  }

  static async getClassPerformance(guruId) {
    // Get all subjects taught by this teacher
    const mySubjects = await MataPelajaran.find({
      $or: [{ guru_id: guruId }, { guru_ids: guruId }]
    }).populate('kelas_id', 'nama_kelas');

    // Group by Class, but calculated specific to the Subject
    const performanceMap = new Map();

    for (const mapel of mySubjects) {
      if (!mapel.kelas_id) continue;

      const className = mapel.kelas_id.nama_kelas;
      // Fetch grades ONLY for this subject
      const grades = await Submission.find({
        tugas_id: { $in: await Tugas.find({ mata_pelajaran_id: mapel._id }).distinct('_id') },
        nilai: { $exists: true }
      });

      const avg = grades.length > 0
        ? grades.reduce((sum, g) => sum + g.nilai, 0) / grades.length
        : 0;

      // If class already exists (e.g. teacher teaches 2 subjects in same class), average them
      if (performanceMap.has(className)) {
        const existing = performanceMap.get(className);
        existing.totalAvg += avg;
        existing.count += 1;
        existing.studentCount = Math.max(existing.studentCount, grades.length); // Approximation
        performanceMap.set(className, existing);
      } else {
        performanceMap.set(className, {
          kelas: className,
          totalAvg: avg,
          count: 1,
          studentCount: grades.length // This is strictly # of graded submissions, roughly active students
        });
      }
    }

    return Array.from(performanceMap.values()).map(item => ({
      kelas: item.kelas,
      averageGrade: Math.round((item.totalAvg / item.count) * 100) / 100,
      totalStudents: item.studentCount // Contextual: Active students in this subject
    }));
  }

  static async getAssignmentCompletion(guruId) {
    // Only assignments created by this teacher
    const myAssignments = await Tugas.find({ guru_id: guruId })
      .sort({ createdAt: -1 })
      .limit(5) // Limit to 5 recent assignments
      .select('_id judul kelas_id');

    const completion = await Promise.all(myAssignments.map(async (tugas) => {
      const submissions = await Submission.find({ tugas_id: tugas._id });
      // Total expected can be fetched from Enrollment if we want precision, 
      // but strictly counting submissions is faster for overview

      return {
        tugas: tugas.judul,
        totalSubmissions: submissions.length,
        completed: submissions.filter(s => s.nilai !== undefined).length // 'graded' effectively
      };
    }));

    return completion;
  }

  static async getAttendanceRate(guruId) {
    // Attendance based on the Teacher's Subjects
    const { subjectIds } = await this.getTeacherScope(guruId);

    // Find attendance records linked to these subjects
    // Note: Kehadiran model usually links to mapel_id. 
    // If Kehadiran is per-day (homeroom), this might differ. 
    // Assuming Kehadiran has mapel_id based on previous audit.
    // Yes, audit confirmed: Kehadiran has mapel_id.

    const attendances = await Kehadiran.find({ mapel_id: { $in: subjectIds } });

    if (attendances.length === 0) return 0;

    const present = attendances.filter(a => a.status === 'Hadir').length;
    return (present / attendances.length * 100).toFixed(2);
  }

  static async getAtRiskStudents(guruId) {
    // Identify students with low grades (< 70) or high absence in teacher's subjects
    const { subjectIds } = await this.getTeacherScope(guruId);

    // 1. Low Grades
    const lowGrades = await Submission.find({
      tugas_id: { $in: await Tugas.find({ mata_pelajaran_id: { $in: subjectIds } }).distinct('_id') },
      nilai: { $lt: 75 } // KKM Assumption
    }).populate('siswa_id', 'nama email').limit(10);

    // Aggregate by student
    const riskMap = new Map();

    lowGrades.forEach(g => {
      if (!g.siswa_id) return;
      const sid = g.siswa_id._id.toString();
      if (!riskMap.has(sid)) {
        riskMap.set(sid, {
          id: sid,
          nama: g.siswa_id.nama,
          issues: []
        });
      }
      riskMap.get(sid).issues.push(`Nilai rendah di ${g.tugas_id?.judul || 'Tugas'}: ${g.nilai}`);
    });

    // 2. High Absence (Alpha > 2 in this subject)
    // Complex query, simplified for dashboard speed:
    // Just return the grade-based risks for now, or fetch distinct students with > 2 alphas
    const badAttendance = await Kehadiran.aggregate([
      { $match: { mapel_id: { $in: subjectIds }, status: 'Alfa' } },
      { $group: { _id: '$siswa_id', count: { $sum: 1 } } },
      { $match: { count: { $gte: 2 } } }
    ]);

    // Populate names for bad attendance
    await User.populate(badAttendance, { path: '_id', select: 'nama' });

    badAttendance.forEach(a => {
      if (!a._id) return;
      const sid = a._id._id.toString();
      if (!riskMap.has(sid)) {
        riskMap.set(sid, {
          id: sid,
          nama: a._id.nama,
          issues: []
        });
      }
      riskMap.get(sid).issues.push(`Alfa ${a.count} kali`);
    });

    return Array.from(riskMap.values()).slice(0, 5); // Return top 5
  }

  // Student-specific methods
  static async getMyClassesCount(siswaId) {
    return await Enrollment.countDocuments({ siswa_id: siswaId });
  }

  static async getMyAssignmentsCount(siswaId) {
    const myClasses = await Enrollment.find({ siswa_id: siswaId }).select('kelas_id');
    const classIds = myClasses.map(e => e.kelas_id);

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
    const myClasses = await Enrollment.find({ siswa_id: siswaId }).select('kelas_id');
    const classIds = myClasses.map(e => e.kelas_id);

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
    // Orangtua model has siswa_id (singular), one entry per child
    const orangtuaEntries = await Orangtua.find({ user_id: orangtuaId });
    return orangtuaEntries.length;
  }

  static async getChildrenPerformance(orangtuaId) {
    const Orangtua = mongoose.model('Orangtua');
    // Get all child entries for this parent
    const orangtuaEntries = await Orangtua.find({ user_id: orangtuaId });
    const siswaIds = orangtuaEntries.map(o => o.siswa_id).filter(Boolean);

    if (siswaIds.length === 0) return [];

    const performance = await Promise.all(siswaIds.map(async (siswaId) => {
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
    const orangtuaEntries = await Orangtua.find({ user_id: orangtuaId });
    const siswaIds = orangtuaEntries.map(o => o.siswa_id).filter(Boolean);

    if (siswaIds.length === 0) return 0;

    const totalRecords = await Kehadiran.countDocuments({ siswa_id: { $in: siswaIds } });
    const presentRecords = await Kehadiran.countDocuments({
      siswa_id: { $in: siswaIds },
      status: 'Hadir'
    });

    return totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;
  }

  static async getRecentUpdates(orangtuaId, limit = 5) {
    const Orangtua = mongoose.model('Orangtua');
    const orangtuaEntries = await Orangtua.find({ user_id: orangtuaId });
    const siswaIds = orangtuaEntries.map(o => o.siswa_id).filter(Boolean);

    if (siswaIds.length === 0) return [];

    // Get recent grades for children
    const recentGrades = await Submission.find({ siswa_id: { $in: siswaIds } })
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
  }  // Export data for reports
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

  // Admin Chart Helpers
  static async getAttendanceTrend() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const result = await Kehadiran.aggregate([
      { $match: { tanggal: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$tanggal" } },
          present: { $sum: { $cond: [{ $eq: ["$status", "Hadir"] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $ne: ["$status", "Hadir"] }, 1, 0] } }
        }
      },
      { $sort: { _id: 1 } },
      { $project: { date: "$_id", present: 1, absent: 1, _id: 0 } }
    ]);
    return result;
  }

  static async getGradeDistribution() {
    return await Submission.aggregate([
      { $match: { nilai: { $exists: true } } },
      {
        $project: {
          range: {
            $switch: {
              branches: [
                { case: { $gte: ["$nilai", 85] }, then: "A" },
                { case: { $gte: ["$nilai", 70] }, then: "B" },
                { case: { $gte: ["$nilai", 55] }, then: "C" },
                { case: { $gte: ["$nilai", 40] }, then: "D" }
              ],
              default: "E"
            }
          }
        }
      },
      { $group: { _id: "$range", value: { $sum: 1 } } },
      { $project: { name: "$_id", value: 1, _id: 0 } },
      { $sort: { name: 1 } }
    ]);
  }

  static async getSubjectPerformance() {
    // Note: Assuming 'tugas' and 'mata_pelajarans' collection names
    return await Submission.aggregate([
      {
        $lookup: {
          from: "tugas",
          localField: "tugas_id",
          foreignField: "_id",
          as: "tugas"
        }
      },
      { $unwind: "$tugas" },
      {
        $lookup: {
          from: "mata_pelajarans",
          localField: "tugas.mata_pelajaran_id",
          foreignField: "_id",
          as: "mapel"
        }
      },
      { $unwind: "$mapel" },
      {
        $group: {
          _id: "$mapel.nama_pelajaran",
          score: { $avg: "$nilai" }
        }
      },
      { $project: { subject: "$_id", score: { $round: ["$score", 0] }, _id: 0, fullMark: 100 } },
      { $limit: 6 }
    ]);
  }

  static async getCompletionRate() {
    const total = await Submission.countDocuments();
    const graded = await Submission.countDocuments({ nilai: { $exists: true } });
    return total > 0 ? Math.round((graded / total) * 100) : 0;
  }
}

export default AnalyticsService; 

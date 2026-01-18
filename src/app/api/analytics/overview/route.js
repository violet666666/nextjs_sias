import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import User from '@/lib/models/userModel';
import Kelas from '@/lib/models/Kelas';
import Tugas from '@/lib/models/Tugas';
import Submission from '@/lib/models/Submission';
import Kehadiran from '@/lib/models/Kehadiran';
import AuditLog from '@/lib/models/AuditLog';

const PASSING_SCORE = 75;

export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (decoded.role !== 'admin' && decoded.role !== 'guru') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'month';
    const { rangeStart, prevRangeStart, prevRangeEnd, now } = getRangeWindows(range);

    const [
      totalStudents,
      newStudentsCurrent,
      newStudentsPrev,
      totalClasses,
      classesCurrent,
      classesPrev,
      attendanceStats,
      attendancePrevStats,
      gradeStats,
      gradePrevStats,
      gradeDistribution,
      totalTasks,
      completedTasks,
      pendingTasks,
      avgSubmitTime,
      recentActivities
    ] = await Promise.all([
      User.countDocuments({ role: 'siswa' }),
      User.countDocuments({ role: 'siswa', createdAt: { $gte: rangeStart } }),
      User.countDocuments({ role: 'siswa', createdAt: { $gte: prevRangeStart, $lt: prevRangeEnd } }),
      Kelas.countDocuments({}),
      Kelas.countDocuments({ createdAt: { $gte: rangeStart } }),
      Kelas.countDocuments({ createdAt: { $gte: prevRangeStart, $lt: prevRangeEnd } }),
      getAttendanceStats(rangeStart),
      getAttendanceStats(prevRangeStart, prevRangeEnd),
      getGradeStats(rangeStart),
      getGradeStats(prevRangeStart, prevRangeEnd),
      getGradeDistribution(rangeStart),
      Tugas.countDocuments({}),
      Tugas.countDocuments({ status: 'completed' }),
      Tugas.countDocuments({ status: 'active' }),
      getAverageSubmitTime(),
      getRecentActivities()
    ]);

    const overview = {
      totalStudents,
      studentGrowth: calcGrowth(newStudentsCurrent, newStudentsPrev),
      totalClasses,
      classGrowth: calcGrowth(classesCurrent, classesPrev),
      avgAttendance: attendanceStats.average,
      attendanceGrowth: calcGrowth(attendanceStats.present, attendancePrevStats.present),
      avgGrade: gradeStats.average,
      gradeGrowth: calcGrowth(gradeStats.average, gradePrevStats.average),
      totalTasks,
      completedTasks,
      pendingTasks,
      avgSubmitTime,
      period: range
    };

    const attendance = {
      present: attendanceStats.present,
      late: attendanceStats.late,
      absent: attendanceStats.absent,
      chartData: {
        labels: ['Hadir', 'Izin', 'Sakit', 'Alfa'],
        values: [
          attendanceStats.present,
          attendanceStats.late,
          attendanceStats.sick,
          attendanceStats.alfa
        ]
      }
    };

    const grades = {
      avgGrade: gradeStats.average,
      highestGrade: gradeStats.max,
      lowestGrade: gradeStats.min,
      passRate: gradeStats.passRate,
      distribution: gradeDistribution
    };

    const activity = {
      recentActivities: recentActivities.map(log => ({
        description: log.description,
        timestamp: log.timestamp
      }))
    };

    return NextResponse.json({
      overview,
      attendance,
      grades,
      activity,
      generatedAt: now
    });
  } catch (error) {
    console.error('Analytics overview error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getRangeWindows(range) {
  const now = new Date();
  const rangeStart = new Date(now);
  const prevRangeEnd = new Date(rangeStart);

  switch (range) {
    case 'week':
      rangeStart.setDate(rangeStart.getDate() - 7);
      prevRangeEnd.setTime(rangeStart.getTime());
      break;
    case 'quarter':
      rangeStart.setMonth(rangeStart.getMonth() - 3);
      prevRangeEnd.setTime(rangeStart.getTime());
      break;
    case 'year':
      rangeStart.setFullYear(rangeStart.getFullYear() - 1);
      prevRangeEnd.setTime(rangeStart.getTime());
      break;
    case 'month':
    default:
      rangeStart.setMonth(rangeStart.getMonth() - 1);
      prevRangeEnd.setTime(rangeStart.getTime());
      break;
  }

  const prevRangeStart = new Date(prevRangeEnd);
  switch (range) {
    case 'week':
      prevRangeStart.setDate(prevRangeStart.getDate() - 7);
      break;
    case 'quarter':
      prevRangeStart.setMonth(prevRangeStart.getMonth() - 3);
      break;
    case 'year':
      prevRangeStart.setFullYear(prevRangeStart.getFullYear() - 1);
      break;
    case 'month':
    default:
      prevRangeStart.setMonth(prevRangeStart.getMonth() - 1);
      break;
  }

  return { now, rangeStart, prevRangeStart, prevRangeEnd };
}

function calcGrowth(currentValue = 0, previousValue = 0) {
  if (!previousValue) {
    return currentValue ? 100 : 0;
  }
  return Number((((currentValue - previousValue) / previousValue) * 100).toFixed(1));
}

async function getAttendanceStats(startDate, endDate = new Date()) {
  const match = { tanggal: { $gte: startDate } };
  if (endDate) {
    match.tanggal.$lt = endDate;
  }

  const result = await Kehadiran.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const counts = result.reduce((acc, item) => {
    const key = (item._id || '').toLowerCase();
    acc[key] = item.count;
    return acc;
  }, {});

  const present = counts['hadir'] || 0;
  const izin = counts['izin'] || 0;
  const sick = counts['sakit'] || 0;
  const alfa = counts['alfa'] || counts['absent'] || 0;
  const total = present + izin + sick + alfa || 1;

  return {
    present,
    late: izin,
    sick,
    alfa,
    absent: sick + alfa,
    average: Number(((present / total) * 100).toFixed(1))
  };
}

async function getGradeStats(startDate, endDate = new Date()) {
  const match = { nilai: { $ne: null } };
  if (startDate) {
    match.createdAt = { $gte: startDate };
    if (endDate) {
      match.createdAt.$lt = endDate;
    }
  }

  const [stats] = await Submission.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        avg: { $avg: '$nilai' },
        max: { $max: '$nilai' },
        min: { $min: '$nilai' },
        passCount: {
          $sum: {
            $cond: [{ $gte: ['$nilai', PASSING_SCORE] }, 1, 0]
          }
        },
        total: { $sum: 1 }
      }
    }
  ]);

  if (!stats) {
    return { average: 0, max: 0, min: 0, passRate: 0 };
  }

  return {
    average: Number(stats.avg?.toFixed(1) || 0),
    max: stats.max || 0,
    min: stats.min || 0,
    passRate: stats.total ? Number(((stats.passCount / stats.total) * 100).toFixed(1)) : 0
  };
}

async function getGradeDistribution(startDate) {
  const match = { nilai: { $ne: null } };
  if (startDate) {
    match.createdAt = { $gte: startDate };
  }

  const buckets = await Submission.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          $switch: {
            branches: [
              { case: { $gte: ['$nilai', 90] }, then: 'A (90-100)' },
              { case: { $gte: ['$nilai', 80] }, then: 'B (80-89)' },
              { case: { $gte: ['$nilai', 70] }, then: 'C (70-79)' },
              { case: { $gte: ['$nilai', 60] }, then: 'D (60-69)' }
            ],
            default: 'F (<60)'
          }
        },
        count: { $sum: 1 }
      }
    }
  ]);

  const defaultBuckets = {
    'A (90-100)': 0,
    'B (80-89)': 0,
    'C (70-79)': 0,
    'D (60-69)': 0,
    'F (<60)': 0
  };

  buckets.forEach(bucket => {
    defaultBuckets[bucket._id] = bucket.count;
  });

  return {
    labels: Object.keys(defaultBuckets),
    values: Object.values(defaultBuckets)
  };
}

async function getAverageSubmitTime() {
  const [result] = await Submission.aggregate([
    {
      $project: {
        diffHours: {
          $divide: [
            { $subtract: ['$tanggal_kumpul', '$createdAt'] },
            1000 * 60 * 60
          ]
        }
      }
    },
    {
      $group: {
        _id: null,
        avgHours: { $avg: { $abs: '$diffHours' } }
      }
    }
  ]);

  return Number(result?.avgHours?.toFixed(1) || 0);
}

async function getRecentActivities() {
  const logs = await AuditLog.find({})
    .sort({ timestamp: -1 })
    .limit(10)
    .populate('user_id', 'nama email');

  return logs.map(log => ({
    description: `${log.user_id?.nama || 'Sistem'} melakukan ${log.action.replace(/_/g, ' ').toLowerCase()}`,
    timestamp: new Date(log.timestamp).toLocaleString('id-ID')
  }));
}
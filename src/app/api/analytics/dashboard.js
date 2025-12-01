import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'week';
    const metric = searchParams.get('metric') || 'attendance';
    
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const db = await connectDB();

    // Get date range
    const now = new Date();
    let startDate;
    switch (range) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case 'year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    let dashboardData = {};

    // Role-based analytics
    if (user.role === 'admin') {
      dashboardData = await getAdminAnalytics(db, startDate, now);
    } else if (user.role === 'guru') {
      dashboardData = await getTeacherAnalytics(db, user._id, startDate, now);
    } else if (user.role === 'siswa') {
      dashboardData = await getStudentAnalytics(db, user._id, startDate, now);
    } else if (user.role === 'orangtua') {
      dashboardData = await getParentAnalytics(db, user._id, startDate, now);
    }

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function getAdminAnalytics(db, startDate, endDate) {
  // Total students
  const totalStudents = await db.collection('users').countDocuments({ role: 'student' });
  
  // Active classes
  const activeClasses = await db.collection('kelas').countDocuments({ status: 'active' });
  
  // Completion rate
  const totalTasks = await db.collection('tugas').countDocuments();
  const completedTasks = await db.collection('tugas').countDocuments({ status: 'completed' });
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  // Average grade
  const grades = await db.collection('nilai').find({}).toArray();
  const averageGrade = grades.length > 0 
    ? Math.round(grades.reduce((sum, grade) => sum + grade.nilai, 0) / grades.length)
    : 0;

  // Attendance trend
  const attendanceData = await db.collection('kehadiran')
    .find({
      tanggal: { $gte: startDate, $lte: endDate }
    })
    .toArray();

  const attendanceTrend = generateDateRange(startDate, endDate).map(date => {
    const dayAttendance = attendanceData.filter(a => 
      new Date(a.tanggal).toDateString() === date.toDateString()
    );
    const present = dayAttendance.filter(a => a.status === 'hadir').length;
    const absent = dayAttendance.filter(a => a.status === 'tidak_hadir').length;
    
    return {
      date: date.toISOString().split('T')[0],
      present,
      absent
    };
  });

  // Grade distribution
  const gradeDistribution = [
    { name: 'A (90-100)', value: grades.filter(g => g.nilai >= 90).length },
    { name: 'B (80-89)', value: grades.filter(g => g.nilai >= 80 && g.nilai < 90).length },
    { name: 'C (70-79)', value: grades.filter(g => g.nilai >= 70 && g.nilai < 80).length },
    { name: 'D (60-69)', value: grades.filter(g => g.nilai >= 60 && g.nilai < 70).length },
    { name: 'F (<60)', value: grades.filter(g => g.nilai < 60).length }
  ];

  // Subject performance
  const subjects = await db.collection('mata_pelajaran').find({}).toArray();
  const subjectPerformance = subjects.map(subject => {
    const subjectGrades = grades.filter(g => g.mataPelajaranId === subject._id.toString());
    const averageScore = subjectGrades.length > 0
      ? Math.round(subjectGrades.reduce((sum, g) => sum + g.nilai, 0) / subjectGrades.length)
      : 0;
    
    return {
      subject: subject.nama,
      score: averageScore
    };
  });

  // Recent activity
  const recentActivity = await db.collection('activity_log')
    .find({})
    .sort({ timestamp: -1 })
    .limit(10)
    .toArray();

  return {
    totalStudents,
    activeClasses,
    completionRate,
    averageGrade,
    attendanceTrend,
    gradeDistribution,
    subjectPerformance,
    recentActivity
  };
}

async function getTeacherAnalytics(db, teacherId, startDate, endDate) {
  // Teacher's classes
  const myClasses = await db.collection('kelas').countDocuments({ 
    guruId: teacherId.toString() 
  });
  
  // Active tasks
  const activeTasks = await db.collection('tugas').countDocuments({ 
    guruId: teacherId.toString(),
    status: 'active'
  });
  
  // Average grade for teacher's classes
  const teacherGrades = await db.collection('nilai')
    .aggregate([
      {
        $lookup: {
          from: 'kelas',
          localField: 'kelasId',
          foreignField: '_id',
          as: 'kelas'
        }
      },
      {
        $match: {
          'kelas.guruId': teacherId.toString()
        }
      }
    ]).toArray();

  const averageGrade = teacherGrades.length > 0
    ? Math.round(teacherGrades.reduce((sum, g) => sum + g.nilai, 0) / teacherGrades.length)
    : 0;

  // Attendance rate for teacher's classes
  const teacherAttendance = await db.collection('kehadiran')
    .aggregate([
      {
        $lookup: {
          from: 'kelas',
          localField: 'kelasId',
          foreignField: '_id',
          as: 'kelas'
        }
      },
      {
        $match: {
          'kelas.guruId': teacherId.toString(),
          tanggal: { $gte: startDate, $lte: endDate }
        }
      }
    ]).toArray();

  const totalAttendance = teacherAttendance.length;
  const presentAttendance = teacherAttendance.filter(a => a.status === 'hadir').length;
  const attendanceRate = totalAttendance > 0 ? Math.round((presentAttendance / totalAttendance) * 100) : 0;

  // Student performance in teacher's classes
  const studentPerformance = await db.collection('users')
    .aggregate([
      {
        $lookup: {
          from: 'nilai',
          localField: '_id',
          foreignField: 'siswaId',
          as: 'nilai'
        }
      },
      {
        $lookup: {
          from: 'kelas',
          localField: 'nilai.kelasId',
          foreignField: '_id',
          as: 'kelas'
        }
      },
      {
        $match: {
          'kelas.guruId': teacherId.toString()
        }
      },
      {
        $project: {
          student: '$nama',
          grade: { $avg: '$nilai.nilai' },
          attendance: { $avg: '$kehadiran.status' }
        }
      }
    ]).toArray();

  return {
    myClasses,
    activeTasks,
    averageGrade,
    attendanceRate,
    studentPerformance
  };
}

async function getStudentAnalytics(db, studentId, startDate, endDate) {
  // Enrolled classes
  const enrolledClasses = await db.collection('kelas_siswa').countDocuments({ 
    siswaId: studentId.toString() 
  });
  
  // Pending tasks
  const pendingTasks = await db.collection('tugas_siswa').countDocuments({ 
    siswaId: studentId.toString(),
    status: 'pending'
  });
  
  // Student's average grade
  const studentGrades = await db.collection('nilai')
    .find({ siswaId: studentId.toString() })
    .toArray();

  const myAverage = studentGrades.length > 0
    ? Math.round(studentGrades.reduce((sum, g) => sum + g.nilai, 0) / studentGrades.length)
    : 0;

  // Student's attendance
  const studentAttendance = await db.collection('kehadiran')
    .find({ 
      siswaId: studentId.toString(),
      tanggal: { $gte: startDate, $lte: endDate }
    })
    .toArray();

  const totalAttendance = studentAttendance.length;
  const presentAttendance = studentAttendance.filter(a => a.status === 'hadir').length;
  const myAttendance = totalAttendance > 0 ? Math.round((presentAttendance / totalAttendance) * 100) : 0;

  // Student's progress by subject
  const myProgress = await db.collection('nilai')
    .aggregate([
      {
        $match: { siswaId: studentId.toString() }
      },
      {
        $lookup: {
          from: 'mata_pelajaran',
          localField: 'mataPelajaranId',
          foreignField: '_id',
          as: 'mataPelajaran'
        }
      },
      {
        $project: {
          subject: { $arrayElemAt: ['$mataPelajaran.nama', 0] },
          grade: '$nilai'
        }
      }
    ]).toArray();

  return {
    enrolledClasses,
    pendingTasks,
    myAverage,
    myAttendance,
    myProgress
  };
}

async function getParentAnalytics(db, parentId, startDate, endDate) {
  // Get parent's children
  const children = await db.collection('users')
    .find({ parentId: parentId.toString() })
    .toArray();

  const childrenIds = children.map(child => child._id.toString());

  // Children count
  const childrenCount = children.length;

  // Children's average grade
  const childrenGrades = await db.collection('nilai')
    .find({ siswaId: { $in: childrenIds } })
    .toArray();

  const childrenAverage = childrenGrades.length > 0
    ? Math.round(childrenGrades.reduce((sum, g) => sum + g.nilai, 0) / childrenGrades.length)
    : 0;

  // Children's attendance
  const childrenAttendance = await db.collection('kehadiran')
    .find({ 
      siswaId: { $in: childrenIds },
      tanggal: { $gte: startDate, $lte: endDate }
    })
    .toArray();

  const totalAttendance = childrenAttendance.length;
  const presentAttendance = childrenAttendance.filter(a => a.status === 'hadir').length;
  const childrenAttendanceRate = totalAttendance > 0 ? Math.round((presentAttendance / totalAttendance) * 100) : 0;

  // Children's pending tasks
  const childrenPendingTasks = await db.collection('tugas_siswa')
    .countDocuments({ 
      siswaId: { $in: childrenIds },
      status: 'pending'
    });

  // Children performance
  const childrenPerformance = children.map(child => {
    const childGrades = childrenGrades.filter(g => g.siswaId === child._id.toString());
    const childAttendance = childrenAttendance.filter(a => a.siswaId === child._id.toString());
    
    const averageGrade = childGrades.length > 0
      ? Math.round(childGrades.reduce((sum, g) => sum + g.nilai, 0) / childGrades.length)
      : 0;

    const attendanceRate = childAttendance.length > 0
      ? Math.round((childAttendance.filter(a => a.status === 'hadir').length / childAttendance.length) * 100)
      : 0;

    return {
      child: child.nama,
      grade: averageGrade,
      attendance: attendanceRate
    };
  });

  return {
    childrenCount,
    childrenAverage,
    childrenAttendance: childrenAttendanceRate,
    childrenPendingTasks,
    childrenPerformance
  };
}

function generateDateRange(startDate, endDate) {
  const dates = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
} 
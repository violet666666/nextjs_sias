import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db';
import User from '@/lib/models/userModel';
import Kelas from '@/lib/models/Kelas';
import Tugas from '@/lib/models/Tugas';
import Kehadiran from '@/lib/models/Kehadiran';
import Submission from '@/lib/models/Submission';

export async function GET(request) {
  try {
    // Verify JWT token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        success: false, 
        message: 'Unauthorized' 
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid token' 
      }, { status: 401 });
    }

    await connectDB();

    // Get user data
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: 'User not found' 
      }, { status: 404 });
    }

    let dashboardData = { user };

    // Role-specific data
    switch (user.role) {
      case 'admin':
        dashboardData = await getAdminDashboardData();
        break;
      case 'guru':
        dashboardData = await getTeacherDashboardData(decoded.userId);
        break;
      case 'siswa':
        dashboardData = await getStudentDashboardData(decoded.userId);
        break;
      case 'orangtua':
        dashboardData = await getParentDashboardData(decoded.userId);
        break;
    }

    return NextResponse.json({
      success: true,
      ...dashboardData
    });

  } catch (error) {
    console.error('Dashboard GET error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}

async function getAdminDashboardData() {
  const [
    totalStudents,
    totalTeachers,
    activeClasses,
    totalTasks,
    attendanceData
  ] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'teacher' }),
    Kelas.countDocuments({ status: 'active' }),
    Tugas.countDocuments(),
    getAttendanceOverview()
  ]);

  return {
    totalStudents,
    totalTeachers,
    activeClasses,
    totalTasks,
    attendance: attendanceData,
    alerts: await getSystemAlerts()
  };
}

async function getTeacherDashboardData(teacherId) {
  const [
    myClasses,
    activeTasks,
    averageGrade,
    recentSubmissions
  ] = await Promise.all([
    Kelas.countDocuments({ teacher: teacherId }),
    Tugas.countDocuments({ 
      teacher: teacherId, 
      status: 'active',
      dueDate: { $gte: new Date() }
    }),
    getTeacherAverageGrade(teacherId),
    getRecentSubmissions(teacherId)
  ]);

  return {
    myClasses,
    activeTasks,
    averageGrade,
    recentSubmissions
  };
}

async function getStudentDashboardData(studentId) {
  const [
    enrolledClasses,
    pendingTasks,
    averageGrade,
    upcomingDeadlines
  ] = await Promise.all([
    Kelas.countDocuments({ students: studentId }),
    Tugas.countDocuments({
      kelas: { $in: await getStudentClassIds(studentId) },
      status: 'active',
      dueDate: { $gte: new Date() }
    }),
    getStudentAverageGrade(studentId),
    getUpcomingDeadlines(studentId)
  ]);

  return {
    enrolledClasses,
    pendingTasks,
    averageGrade,
    upcomingDeadlines
  };
}

async function getParentDashboardData(parentId) {
  const parent = await User.findById(parentId).populate('children');
  const children = parent.children || [];

  const childrenData = await Promise.all(
    children.map(async (child) => {
      const [classes, average, attendance] = await Promise.all([
        Kelas.countDocuments({ students: child._id }),
        getStudentAverageGrade(child._id),
        getStudentAttendanceRate(child._id)
      ]);

      return {
        name: child.nama,
        grade: child.kelas || 'N/A',
        classes,
        average: Math.round(average || 0),
        attendance: Math.round(attendance || 0)
      };
    })
  );

  const averageGrade = childrenData.length > 0 
    ? Math.round(childrenData.reduce((sum, child) => sum + child.average, 0) / childrenData.length)
    : 0;

  const attendanceRate = childrenData.length > 0
    ? Math.round(childrenData.reduce((sum, child) => sum + child.attendance, 0) / childrenData.length)
    : 0;

  return {
    children: childrenData,
    averageGrade,
    attendanceRate
  };
}

// Helper functions
async function getAttendanceOverview() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const attendance = await Kehadiran.find({
    tanggal: {
      $gte: today,
      $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
    }
  });

  const total = attendance.length;
  const present = attendance.filter(a => a.status === 'hadir').length;
  const absent = attendance.filter(a => a.status === 'tidak_hadir').length;
  const late = attendance.filter(a => a.status === 'terlambat').length;

  return {
    present: total > 0 ? Math.round((present / total) * 100) : 0,
    absent,
    late
  };
}

async function getTeacherAverageGrade(teacherId) {
  const submissions = await Submission.find({
    tugas: { $in: await Tugas.find({ teacher: teacherId }).select('_id') }
  }).populate('tugas');

  if (submissions.length === 0) return 0;

  const totalGrade = submissions.reduce((sum, sub) => sum + (sub.nilai || 0), 0);
  return Math.round(totalGrade / submissions.length);
}

async function getStudentAverageGrade(studentId) {
  const submissions = await Submission.find({ student: studentId });

  if (submissions.length === 0) return 0;

  const totalGrade = submissions.reduce((sum, sub) => sum + (sub.nilai || 0), 0);
  return Math.round(totalGrade / submissions.length);
}

async function getStudentAttendanceRate(studentId) {
  const attendance = await Kehadiran.find({ student: studentId });

  if (attendance.length === 0) return 0;

  const present = attendance.filter(a => a.status === 'hadir').length;
  return Math.round((present / attendance.length) * 100);
}

async function getStudentClassIds(studentId) {
  const classes = await Kelas.find({ students: studentId }).select('_id');
  return classes.map(c => c._id);
}

async function getRecentSubmissions(teacherId) {
  const teacherTasks = await Tugas.find({ teacher: teacherId }).select('_id');
  
  const submissions = await Submission.find({
    tugas: { $in: teacherTasks }
  })
  .populate('student', 'nama')
  .populate('tugas', 'judul')
  .sort({ submittedAt: -1 })
  .limit(5);

  return submissions.map(sub => ({
    studentName: sub.student.nama,
    taskTitle: sub.tugas.judul,
    submittedAt: new Date(sub.submittedAt).toLocaleDateString()
  }));
}

async function getUpcomingDeadlines(studentId) {
  const studentClasses = await getStudentClassIds(studentId);
  
  const tasks = await Tugas.find({
    kelas: { $in: studentClasses },
    status: 'active',
    dueDate: { $gte: new Date() }
  })
  .populate('kelas', 'nama')
  .sort({ dueDate: 1 })
  .limit(5);

  return tasks.map(task => {
    const daysLeft = Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    return {
      taskTitle: task.judul,
      className: task.kelas.nama,
      dueDate: new Date(task.dueDate).toLocaleDateString(),
      daysLeft
    };
  });
}

async function getSystemAlerts() {
  // This would typically check for system issues, low disk space, etc.
  // For now, return some example alerts
  return [
    {
      title: 'System Maintenance',
      message: 'Scheduled maintenance on Sunday at 2 AM'
    },
    {
      title: 'Backup Completed',
      message: 'Daily backup completed successfully'
    }
  ];
} 
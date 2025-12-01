import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db';
import User from '@/lib/models/userModel';
import Kelas from '@/lib/models/Kelas';

export async function GET(request) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'general';
    const limit = parseInt(searchParams.get('limit')) || 10;

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ 
        success: false, 
        message: 'Search query must be at least 2 characters long' 
      }, { status: 400 });
    }

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

    let results = [];

    switch (type) {
      case 'classes':
        results = await searchClasses(query, limit, decoded.role, decoded.userId);
        break;
      case 'students':
        results = await searchStudents(query, limit, decoded.role, decoded.userId);
        break;
      case 'teachers':
        results = await searchTeachers(query, limit, decoded.role);
        break;
      case 'users':
        results = await searchUsers(query, limit, decoded.role);
        break;
      default:
        // General search across multiple types
        const [classes, students, teachers] = await Promise.all([
          searchClasses(query, Math.ceil(limit / 3), decoded.role, decoded.userId),
          searchStudents(query, Math.ceil(limit / 3), decoded.role, decoded.userId),
          searchTeachers(query, Math.ceil(limit / 3), decoded.role)
        ]);
        
        results = [
          ...classes.map(item => ({ ...item, type: 'class' })),
          ...students.map(item => ({ ...item, type: 'student' })),
          ...teachers.map(item => ({ ...item, type: 'teacher' }))
        ].slice(0, limit);
    }

    return NextResponse.json({
      success: true,
      results,
      query,
      type
    });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}

async function searchClasses(query, limit, userRole, userId) {
  let filter = {
    $or: [
      { nama: { $regex: query, $options: 'i' } },
      { kode: { $regex: query, $options: 'i' } },
      { deskripsi: { $regex: query, $options: 'i' } }
    ]
  };

  // Role-based filtering
  if (userRole === 'siswa') {
    filter.students = userId;
  } else if (userRole === 'guru') {
    filter.teacher = userId;
  } else if (userRole === 'orangtua') {
    // Orangtua hanya bisa lihat kelas anaknya
    const user = await User.findById(userId).populate('children');
    if (user && user.children) {
      const childIds = user.children.map(child => child._id);
      filter.students = { $in: childIds };
    }
  }

  const classes = await Kelas.find(filter)
    .populate('teacher', 'nama email')
    .populate('students', 'nama email')
    .limit(limit)
    .select('nama kode deskripsi teacher students');

  return classes.map(kelas => ({
    id: kelas._id,
    name: kelas.nama,
    code: kelas.kode,
    description: kelas.deskripsi,
    teacher: kelas.teacher,
    studentCount: kelas.students?.length || 0
  }));
}

async function searchStudents(query, limit, userRole, userId) {
  let filter = {
    role: 'siswa',
    $or: [
      { nama: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } },
      { nis: { $regex: query, $options: 'i' } }
    ]
  };

  // Role-based filtering
  if (userRole === 'guru') {
    // Guru hanya bisa lihat siswa di kelasnya
    const teacherClasses = await Kelas.find({ teacher: userId }).select('students');
    const studentIds = teacherClasses.flatMap(kelas => kelas.students);
    filter._id = { $in: studentIds };
  } else if (userRole === 'orangtua') {
    // Orangtua hanya bisa lihat anaknya
    const user = await User.findById(userId).populate('children');
    if (user && user.children) {
      const childIds = user.children.map(child => child._id);
      filter._id = { $in: childIds };
    }
  }

  const students = await User.find(filter)
    .limit(limit)
    .select('nama email nis kelas');

  return students.map(student => ({
    id: student._id,
    name: student.nama,
    email: student.email,
    nis: student.nis,
    kelas: student.kelas
  }));
}

async function searchTeachers(query, limit, userRole) {
  // Only admins and teachers can search for other teachers
  if (userRole !== 'admin' && userRole !== 'guru') {
    return [];
  }

  const teachers = await User.find({
    role: 'guru',
    $or: [
      { nama: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } }
    ]
  })
    .limit(limit)
    .select('nama email');

  return teachers.map(teacher => ({
    id: teacher._id,
    name: teacher.nama,
    email: teacher.email
  }));
}

async function searchUsers(query, limit, userRole) {
  // Only admins can search all users
  if (userRole !== 'admin') {
    return [];
  }

  const users = await User.find({
    $or: [
      { nama: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } },
      { role: { $regex: query, $options: 'i' } }
    ]
  })
    .limit(limit)
    .select('nama email role');

  return users.map(user => ({
    id: user._id,
    name: user.nama,
    email: user.email,
    role: user.role
  }));
} 
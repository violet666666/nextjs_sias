import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db';
import User from '@/lib/models/userModel';
import Kelas from '@/lib/models/Kelas';
import Enrollment from '@/lib/models/Enrollment';
import Orangtua from '@/lib/models/Orangtua';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'general';
    const limit = parseInt(searchParams.get('limit'), 10) || 10;

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      }, { status: 400 });
    }

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
  const filter = {
    $or: [
      { nama_kelas: { $regex: query, $options: 'i' } },
      { deskripsi: { $regex: query, $options: 'i' } },
      { tahun_ajaran: { $regex: query, $options: 'i' } }
    ]
  };

  if (userRole === 'guru') {
    filter.guru_id = userId;
  } else if (userRole === 'siswa') {
    const enrollments = await Enrollment.find({ siswa_id: userId }).select('kelas_id');
    const kelasIds = enrollments.map(e => e.kelas_id);
    filter._id = { $in: kelasIds.length ? kelasIds : [null] };
  } else if (userRole === 'orangtua') {
    const anakIds = await getChildrenIds(userId);
    if (anakIds.length) {
      const enrollments = await Enrollment.find({ siswa_id: { $in: anakIds } }).select('kelas_id');
      const kelasIds = enrollments.map(e => e.kelas_id);
      filter._id = { $in: kelasIds.length ? kelasIds : [null] };
    } else {
      filter._id = { $in: [null] };
    }
  }

  const classes = await Kelas.find(filter)
    .populate('guru_id', 'nama email')
    .limit(limit)
    .select('nama_kelas tahun_ajaran deskripsi guru_id matapelajaran_ids siswa_ids');

  return classes.map(kelas => ({
    id: kelas._id,
    name: kelas.nama_kelas,
    description: kelas.deskripsi,
    year: kelas.tahun_ajaran,
    teacher: kelas.guru_id,
    studentCount: Array.isArray(kelas.siswa_ids) ? kelas.siswa_ids.length : 0
  }));
}

async function searchStudents(query, limit, userRole, userId) {
  const filter = {
    role: 'siswa',
    $or: [
      { nama: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } },
      { nisn: { $regex: query, $options: 'i' } }
    ]
  };

  if (userRole === 'guru') {
    const kelas = await Kelas.find({ guru_id: userId }).select('_id');
    const kelasIds = kelas.map(k => k._id);
    if (kelasIds.length) {
      const enrollment = await Enrollment.find({ kelas_id: { $in: kelasIds } }).select('siswa_id');
      const siswaIds = enrollment.map(e => e.siswa_id);
      filter._id = { $in: siswaIds.length ? siswaIds : [null] };
    } else {
      filter._id = { $in: [null] };
    }
  } else if (userRole === 'orangtua') {
    const anakIds = await getChildrenIds(userId);
    filter._id = { $in: anakIds.length ? anakIds : [null] };
  }

  const students = await User.find(filter)
    .limit(limit)
    .select('nama email nisn kelas_id');

  return students.map(student => ({
    id: student._id,
    name: student.nama,
    email: student.email,
    nisn: student.nisn,
    kelas: student.kelas_id
  }));
}

async function searchTeachers(query, limit, userRole) {
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

async function getChildrenIds(parentUserId) {
  const relations = await Orangtua.find({ user_id: parentUserId }).select('siswa_id');
  return relations.map(rel => rel.siswa_id);
}

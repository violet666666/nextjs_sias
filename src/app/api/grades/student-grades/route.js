import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import StudentGrade from '@/lib/models/StudentGrade';
import { authenticateAndAuthorize } from '@/lib/authMiddleware';

// GET: Get student grades for a subject and class
export async function GET(request) {
  try {
    const authResult = await authenticateAndAuthorize(request, ['guru', 'admin', 'siswa', 'orangtua']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const mapel_id = searchParams.get('mapel_id');
    const kelas_id = searchParams.get('kelas_id');
    const semester = searchParams.get('semester') || 'ganjil';

    if (!mapel_id || !kelas_id) {
      return NextResponse.json({ error: 'mapel_id dan kelas_id wajib diisi' }, { status: 400 });
    }

    const grades = await StudentGrade.find({
      mapel_id,
      kelas_id,
      semester
    })
    .populate('siswa_id', 'nama nis email')
    .populate('mapel_id', 'nama')
    .populate('kelas_id', 'nama_kelas')
    .lean();

    // Convert components Map to object for JSON response
    const gradesWithComponents = grades.map(grade => ({
      ...grade,
      components: grade.components || {}
    }));

    return NextResponse.json(gradesWithComponents);
  } catch (error) {
    console.error('Error fetching student grades:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


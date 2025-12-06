import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import StudentGrade from '@/lib/models/StudentGrade';
import GradeComponent from '@/lib/models/GradeComponent';
import { authenticateAndAuthorize } from '@/lib/authMiddleware';
import NotificationService from '@/lib/services/notificationService';

// POST: Save bulk grades for students
export async function POST(request) {
  try {
    const authResult = await authenticateAndAuthorize(request, ['guru', 'admin']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    await connectDB();
    const body = await request.json();
    const { mapel_id, kelas_id, grades, semester, tahun_ajaran } = body;

    if (!mapel_id || !kelas_id || !grades || !Array.isArray(grades)) {
      return NextResponse.json({ error: 'mapel_id, kelas_id, dan grades wajib diisi' }, { status: 400 });
    }

    const guruId = authResult.user.id || authResult.user._id;

    // Verify grade components exist
    const gradeComponent = await GradeComponent.findOne({
      mapel_id,
      kelas_id,
      guru_id: guruId
    });

    if (!gradeComponent) {
      return NextResponse.json({ error: 'Komponen nilai belum dibuat. Buat komponen nilai terlebih dahulu.' }, { status: 400 });
    }

    const results = [];
    const notifications = [];

    for (const gradeData of grades) {
      const { student_id, components, total } = gradeData;

      // Calculate total if not provided
      let calculatedTotal = total;
      if (!calculatedTotal) {
        calculatedTotal = 0;
        gradeComponent.components.forEach(comp => {
          const grade = parseFloat(components[comp.name] || 0);
          if (!isNaN(grade)) {
            calculatedTotal += (grade * comp.percentage) / 100;
          }
        });
      }

      const studentGrade = await StudentGrade.findOneAndUpdate(
        {
          siswa_id: student_id,
          mapel_id,
          kelas_id,
          guru_id: guruId,
          semester: semester || 'ganjil'
        },
        {
          siswa_id: student_id,
          mapel_id,
          kelas_id,
          guru_id: guruId,
          components: components, // Store as object
          total_grade: calculatedTotal,
          semester: semester || 'ganjil',
          tahun_ajaran: tahun_ajaran || new Date().getFullYear().toString()
        },
        { new: true, upsert: true }
      );

      results.push(studentGrade);

      // Send notification to student
      notifications.push({
        user_id: student_id,
        title: 'Nilai Diperbarui',
        message: `Nilai Anda untuk mata pelajaran telah diperbarui. Nilai akhir: ${calculatedTotal.toFixed(2)}`,
        type: 'grade',
        data: { 
          mapel_id, 
          kelas_id, 
          total_grade: calculatedTotal,
          semester: semester || 'ganjil'
        }
      });
    }

    // Send notifications in batch
    if (notifications.length > 0) {
      await NotificationService.createBatchNotifications(
        notifications.map(n => n.user_id),
        {
          title: 'Nilai Diperbarui',
          message: 'Nilai Anda telah diperbarui oleh guru',
          type: 'grade',
          category: 'academic',
          priority: 'medium'
        }
      );
    }

    return NextResponse.json({ 
      success: true, 
      count: results.length,
      message: `${results.length} nilai berhasil disimpan`
    }, { status: 200 });
  } catch (error) {
    console.error('Error saving bulk grades:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


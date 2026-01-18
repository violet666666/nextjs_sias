import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import GradeRecord from '@/lib/models/GradeRecord';
import AcademicYear from '@/lib/models/AcademicYear';
import { authenticateAndAuthorize } from '@/lib/authMiddleware';

export async function GET(request) {
    try {
        const authResult = await authenticateAndAuthorize(request, ['admin', 'guru', 'siswa', 'orangtua']);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        await connectDB();
        const { searchParams } = new URL(request.url);
        const student_id = searchParams.get('student_id') || authResult.user.id;
        const academic_year_id = searchParams.get('academic_year_id');
        const semester = searchParams.get('semester');

        if (!academic_year_id || !semester) {
            // Optional: try to find active academic year if not provided
            // But for now, require it for precision
            return NextResponse.json({ error: 'Academic Year and Semester are required' }, { status: 400 });
        }

        // Role check: Students/Parents can only see their own
        if (authResult.user.role === 'siswa' && student_id !== authResult.user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        // TODO: Add parent check (parent can only see their child)

        const grades = await GradeRecord.find({
            student_id,
            academic_year_id,
            semester
        })
            .populate('subject_id', 'nama_mapel kode_mapel')
            .populate('academic_year_id', 'name semester')
            .sort({ 'subject_id.nama_mapel': 1 });

        const academicYear = await AcademicYear.findById(academic_year_id);
        let attendanceSummary = { Hadir: 0, Sakit: 0, Izin: 0, Alfa: 0 };

        if (academicYear) {
            const Kehadiran = (await import("@/lib/models/Kehadiran")).default;
            const mongoose = (await import("mongoose")).default;

            const presence = await Kehadiran.aggregate([
                {
                    $match: {
                        siswa_id: new mongoose.Types.ObjectId(student_id),
                        tanggal: { $gte: academicYear.startDate, $lte: academicYear.endDate }
                    }
                },
                {
                    $group: {
                        _id: "$status",
                        count: { $sum: 1 }
                    }
                }
            ]);

            presence.forEach(p => {
                if (attendanceSummary[p._id] !== undefined) {
                    attendanceSummary[p._id] = p.count;
                }
            });
        }

        return NextResponse.json({
            grades,
            attendance: attendanceSummary
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

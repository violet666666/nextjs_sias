import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Exam from '@/lib/models/Exam';
import Kelas from '@/lib/models/Kelas';
import { authenticateAndAuthorize } from '@/lib/authMiddleware';

export async function GET(request) {
    try {
        const authResult = await authenticateAndAuthorize(request, ['admin', 'guru', 'siswa']);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        await connectDB();
        const { searchParams } = new URL(request.url);
        const class_id = searchParams.get('class_id');
        const role = authResult.user.role;
        const userId = authResult.user.id;

        let query = {};
        if (class_id) query.class_id = class_id;

        // Security: Guru only sees exams for classes they teach (unless verifying logic elsewhere, 
        // but good to enforce here if no class_id provided)
        if (role === 'guru') {
            if (!class_id) {
                // Find all classes taught by guru
                const classes = await Kelas.find({ guru_id: userId }).select('_id');
                query.class_id = { $in: classes.map(c => c._id) };
            }
            query.guru_id = userId; // Only their own exams
        }

        // Admin sees all

        const exams = await Exam.find(query)
            .populate('class_id', 'nama_kelas')
            .populate('subject_id', 'nama_mapel')
            .populate('academic_year_id', 'name semester')
            .sort({ date: -1 });

        return NextResponse.json(exams);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const authResult = await authenticateAndAuthorize(request, ['admin', 'guru']);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        await connectDB();
        const body = await request.json();

        // Auto-assign guru_id if teacher
        if (authResult.user.role === 'guru') {
            body.guru_id = authResult.user.id;
        }

        const exam = await Exam.create(body);
        return NextResponse.json(exam, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

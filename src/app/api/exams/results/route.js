import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ExamResult from '@/lib/models/ExamResult';
import Exam from '@/lib/models/Exam';
import Kelas from '@/lib/models/Kelas';
import { authenticateAndAuthorize } from '@/lib/authMiddleware';

export async function GET(request, { params }) {
    try {
        const authResult = await authenticateAndAuthorize(request, ['admin', 'guru']);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        await connectDB();
        const { searchParams } = new URL(request.url);
        const exam_id = searchParams.get('exam_id');

        if (!exam_id) return NextResponse.json({ error: "Exam ID required" }, { status: 400 });

        const results = await ExamResult.find({ exam_id }).populate('student_id', 'nama');
        return NextResponse.json(results);
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
        const { exam_id, student_id, score, feedback } = body;

        // Upsert the result
        const result = await ExamResult.findOneAndUpdate(
            { exam_id, student_id },
            {
                score,
                feedback,
                graded_by: authResult.user.id,
                graded_at: new Date()
            },
            { new: true, upsert: true } // Create if not exists
        );

        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

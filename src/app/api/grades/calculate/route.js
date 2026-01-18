import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import GradeRecord from '@/lib/models/GradeRecord';
import Kelas from '@/lib/models/Kelas'; // Ensure Kelas is imported to verify existence
import { calculateStudentGrade } from '@/lib/services/gradeCalculator';
import { authenticateAndAuthorize } from '@/lib/authMiddleware';

export async function POST(request) {
    try {
        const authResult = await authenticateAndAuthorize(request, ['admin', 'guru']);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        await connectDB();
        const body = await request.json();
        const { student_id, subject_id, class_id, academic_year_id, semester } = body;

        if (!student_id || !subject_id || !class_id || !academic_year_id || !semester) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Calculate the grade
        const gradeData = await calculateStudentGrade(student_id, subject_id, class_id, academic_year_id, semester);

        // Save or Update GradeRecord
        const filter = {
            student_id,
            subject_id,
            academic_year_id,
            semester
        };

        const update = {
            class_id,
            ...gradeData,
            is_finalized: true // Mark as finalized for this snapshot
        };

        const record = await GradeRecord.findOneAndUpdate(filter, update, {
            new: true,
            upsert: true, // Create if doesn't exist
            setDefaultsOnInsert: true
        });

        return NextResponse.json(record);
    } catch (error) {
        console.error("Grade calculation error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

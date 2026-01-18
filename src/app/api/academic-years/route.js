import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import AcademicYear from '@/lib/models/AcademicYear';
import { authenticateAndAuthorize } from '@/lib/authMiddleware';

export async function GET(request) {
    try {
        await connectDB();
        // Allow basic access to authenticated users
        const authResult = await authenticateAndAuthorize(request, ['admin', 'guru', 'siswa', 'orangtua']);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const query = {};
        if (status) query.status = status;

        const years = await AcademicYear.find(query).sort({ startDate: -1 });
        return NextResponse.json(years);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const authResult = await authenticateAndAuthorize(request, ['admin']);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        await connectDB();
        const body = await request.json();

        // Validate uniqueness of name
        const existing = await AcademicYear.findOne({ name: body.name });
        if (existing) {
            return NextResponse.json({ error: 'Academic year name already exists' }, { status: 400 });
        }

        const academicYear = await AcademicYear.create(body);
        return NextResponse.json(academicYear, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

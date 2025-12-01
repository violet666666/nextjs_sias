import { NextResponse } from 'next/server';
import Submission from '@/lib/models/Submission';
import { authenticateAndAuthorize } from '@/lib/authMiddleware';
import connectDB from '@/lib/db';

export async function GET(request) {
  try {
    const authResult = await authenticateAndAuthorize(request, ['admin', 'guru']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    await connectDB();
    const grades = await Submission.find({}).populate('tugas_id siswa_id');
    return NextResponse.json(grades, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Only admin and guru can access analytics
    if (decoded.role !== 'admin' && decoded.role !== 'guru') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'month';

    // For now, return mock data
    const overview = {
      totalStudents: 150,
      studentGrowth: 5.2,
      totalClasses: 12,
      classGrowth: 0,
      avgAttendance: 85.5,
      attendanceGrowth: 2.1,
      avgGrade: 78.3,
      gradeGrowth: -1.2,
      totalTasks: 45,
      completedTasks: 38,
      pendingTasks: 7,
      avgSubmitTime: 2.5,
      period: range
    };

    return NextResponse.json(overview);
  } catch (error) {
    console.error('Analytics overview error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/userModel';
import { authenticateAndAuthorize } from '@/lib/authMiddleware';

export async function GET(request) {
  try {
    const authResult = await authenticateAndAuthorize(request, ['admin', 'guru', 'siswa', 'orangtua']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    await connectDB();
    const users = await User.find({ online_status: 'online' }).select('-password_hash');
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 
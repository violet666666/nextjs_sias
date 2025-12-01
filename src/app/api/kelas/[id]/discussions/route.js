import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import DiscussionThread from '@/lib/models/DiscussionThread';
import { authenticateAndAuthorize } from '@/lib/authMiddleware';
import { logCRUDAction } from '@/lib/auditLogger';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const awaitedParams = await params;
    const { id } = awaitedParams;
    const threads = await DiscussionThread.find({ kelas_id: id })
      .populate('user_id', 'nama email role')
      .sort({ createdAt: -1 });
    return NextResponse.json(threads);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const authResult = await authenticateAndAuthorize(request, ['admin', 'guru', 'siswa']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const currentUser = authResult.user;
    await connectDB();
    const awaitedParams = await params;
    const { id } = awaitedParams;
    const body = await request.json();
    const { title, body: threadBody } = body;
    if (!title || !threadBody) {
      return NextResponse.json({ error: 'Judul dan isi thread wajib diisi.' }, { status: 400 });
    }
    const thread = await DiscussionThread.create({
      kelas_id: id,
      user_id: currentUser.id,
      title,
      body: threadBody,
    });
    await logCRUDAction(currentUser.id, 'CREATE_THREAD', 'DISCUSSION', thread._id, { kelas_id: id, title });
    return NextResponse.json(thread, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 
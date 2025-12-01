import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Comment from '@/lib/models/Comment';
import { authenticateAndAuthorize } from '@/lib/authMiddleware';
import validator from 'validator';

export async function GET(request, { params }) {
  try {
    const authResult = await authenticateAndAuthorize(request, ['admin', 'guru', 'siswa', 'orangtua']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    await connectDB();
    const awaitedParams = await params;
    const { id } = awaitedParams;
    const comments = await Comment.find({ kelas_id: id }).sort({ createdAt: -1 }).populate('author', 'nama role');
    return NextResponse.json(comments);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const authResult = await authenticateAndAuthorize(request, ['admin', 'guru', 'siswa', 'orangtua']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const currentUser = authResult.user;
    await connectDB();
    const awaitedParams = await params;
    const { id } = awaitedParams;
    const body = await request.json();
    if (!body.text) return NextResponse.json({ error: 'Teks komentar wajib diisi' }, { status: 400 });
    const sanitizedText = validator.escape(body.text);
    const comment = await Comment.create({ kelas_id: id, text: sanitizedText, author: currentUser.id });
    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 
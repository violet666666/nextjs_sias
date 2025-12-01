import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import DiscussionComment from '@/lib/models/DiscussionComment';
import { authenticateAndAuthorize } from '@/lib/authMiddleware';
import { logCRUDAction } from '@/lib/auditLogger';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const awaitedParams = await params;
    const { threadId } = awaitedParams;
    const comments = await DiscussionComment.find({ thread_id: threadId })
      .populate('user_id', 'nama email role')
      .sort({ createdAt: 1 });
    return NextResponse.json(comments);
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
    const { threadId } = awaitedParams;
    const body = await request.json();
    const { body: commentBody } = body;
    if (!commentBody) {
      return NextResponse.json({ error: 'Isi komentar wajib diisi.' }, { status: 400 });
    }
    const comment = await DiscussionComment.create({
      thread_id: threadId,
      user_id: currentUser.id,
      body: commentBody,
    });
    await logCRUDAction(currentUser.id, 'CREATE_COMMENT', 'DISCUSSION', threadId, { comment_id: comment._id });
    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 
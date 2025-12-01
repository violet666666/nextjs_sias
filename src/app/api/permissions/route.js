import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Permission from '@/lib/models/Permission';
import { authenticateAndAuthorize } from '@/lib/authMiddleware';
import { logCRUDAction } from '@/lib/auditLogger';

export async function GET(request) {
  try {
    const authResult = await authenticateAndAuthorize(request, ['admin']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    await connectDB();
    const permissions = await Permission.find();
    return NextResponse.json(permissions);
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
    if (!body.name) {
      return NextResponse.json({ error: 'Nama permission wajib diisi.' }, { status: 400 });
    }
    const permission = await Permission.create(body);
    // Audit log
    await logCRUDAction(authResult.user.id, 'CREATE_PERMISSION', 'PERMISSION', permission._id, { name: permission.name });
    return NextResponse.json(permission, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 
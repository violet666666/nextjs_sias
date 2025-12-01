import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Role from '@/lib/models/Role';
import { authenticateAndAuthorize } from '@/lib/authMiddleware';

export async function GET(request) {
  try {
    const authResult = await authenticateAndAuthorize(request, ['admin']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    await connectDB();
    const roles = await Role.find();
    return NextResponse.json(roles);
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
      return NextResponse.json({ error: 'Nama role wajib diisi.' }, { status: 400 });
    }
    const role = await Role.create(body);
    return NextResponse.json(role, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 
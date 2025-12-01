import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Permission from '@/lib/models/Permission';
import { authenticateAndAuthorize } from '@/lib/authMiddleware';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const authResult = await authenticateAndAuthorize(request, ['admin']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    await connectDB();
    const permission = await Permission.findById(id);
    if (!permission) return NextResponse.json({ error: 'Permission tidak ditemukan' }, { status: 404 });
    return NextResponse.json(permission);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const authResult = await authenticateAndAuthorize(request, ['admin']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    await connectDB();
    const body = await request.json();
    const permission = await Permission.findByIdAndUpdate(id, body, { new: true });
    if (!permission) return NextResponse.json({ error: 'Permission tidak ditemukan' }, { status: 404 });
    return NextResponse.json(permission);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const authResult = await authenticateAndAuthorize(request, ['admin']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    await connectDB();
    const permission = await Permission.findByIdAndDelete(id);
    if (!permission) return NextResponse.json({ error: 'Permission tidak ditemukan' }, { status: 404 });
    return NextResponse.json({ message: 'Permission berhasil dihapus' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 
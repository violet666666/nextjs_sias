import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Role from '@/lib/models/Role';
import { authenticateAndAuthorize } from '@/lib/authMiddleware';
import { logCRUDAction } from '@/lib/auditLogger';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const authResult = await authenticateAndAuthorize(request, ['admin']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    await connectDB();
    const role = await Role.findById(id);
    if (!role) return NextResponse.json({ error: 'Role tidak ditemukan' }, { status: 404 });
    return NextResponse.json(role);
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
    const role = await Role.findByIdAndUpdate(id, body, { new: true });
    if (!role) return NextResponse.json({ error: 'Role tidak ditemukan' }, { status: 404 });
    // Audit log
    await logCRUDAction(authResult.user.id, 'UPDATE_ROLE', 'ROLE', id, { name: role.name });
    return NextResponse.json(role);
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
    const role = await Role.findByIdAndDelete(id);
    if (!role) return NextResponse.json({ error: 'Role tidak ditemukan' }, { status: 404 });
    // Audit log
    await logCRUDAction(authResult.user.id, 'DELETE_ROLE', 'ROLE', id, { name: role.name });
    return NextResponse.json({ message: 'Role berhasil dihapus' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 
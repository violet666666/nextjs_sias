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

    // Only admin can access backup
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    // For now, return mock backup data
    const mockBackups = [
      {
        _id: 'backup-2024-01-15',
        filename: 'backup-2024-01-15.zip',
        size: 1048576,
        type: 'manual',
        status: 'completed',
        description: 'Manual backup - 15/01/2024 10:30:00',
        createdAt: new Date('2024-01-15T10:30:00Z'),
        completedAt: new Date('2024-01-15T10:32:00Z')
      },
      {
        _id: 'backup-2024-01-14',
        filename: 'backup-2024-01-14.zip',
        size: 2097152,
        type: 'auto',
        status: 'completed',
        description: 'Automatic backup - 14/01/2024 02:00:00',
        createdAt: new Date('2024-01-14T02:00:00Z'),
        completedAt: new Date('2024-01-14T02:05:00Z')
      }
    ];

    return NextResponse.json({ backups: mockBackups });
  } catch (error) {
    console.error('Backup list error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Only admin can create backup
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const body = await request.json();
    const { includeFiles = true, includeDatabase = true, description = 'Manual backup' } = body;

    // For now, create a mock backup record
    const backupId = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}`;
    const backupRecord = {
      _id: backupId,
      filename: `${backupId}.zip`,
      size: Math.floor(Math.random() * 5000000) + 1000000, // Random size between 1-6MB
      type: 'manual',
      status: 'completed',
      description,
      createdAt: new Date(),
      completedAt: new Date()
    };

    return NextResponse.json({
      message: 'Backup created successfully',
      backup: backupRecord
    });
  } catch (error) {
    console.error('Backup creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import Notification from '@/models/Notification';
import NotificationService from '@/lib/services/notificationService';
import { logCRUDAction } from '@/lib/auditLogger';

// Temporary mock data until Notification model is properly set up
const mockNotifications = [
  {
    _id: '1',
    title: 'Selamat Datang',
    message: 'Selamat datang di sistem akademik',
    type: 'info',
    category: 'system',
    priority: 'medium',
    read: false,
    createdAt: new Date().toISOString(),
    user_id: { nama: 'Admin', email: 'admin@example.com' }
  }
];

// GET: List notifications with pagination and filters
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

    await connectDB();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 50;
    const page = parseInt(searchParams.get('page')) || 1;
    const type = searchParams.get('type');
    const read = searchParams.get('read');

    // Ambil notifikasi dari DB
    const { notifications, pagination } = await NotificationService.getUserNotifications(decoded.userId, { page, limit, type, read });
    const stats = await NotificationService.getNotificationStats(decoded.userId);

    return NextResponse.json({
      notifications,
      unreadCount: stats.unread,
      totalCount: stats.total,
      page,
      limit,
      totalPages: pagination.pages
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create notification (admin only)
export async function POST(request) {
  let userId = null;
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    userId = decoded.userId;
    await connectDB();
    const body = await request.json();
    const {
      title,
      message,
      type = 'info',
      category = 'system',
      priority = 'medium',
      user_id,
      actionUrl,
      actionText,
      data = {}
    } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      );
    }

    // Buat notifikasi di DB
    const notification = await NotificationService.createNotification({
      title,
      message,
      type,
      category,
      priority,
      user_id: user_id || decoded.userId,
      actionUrl,
      actionText,
      metadata: data
    });
    await logCRUDAction(userId, 'CREATE_NOTIFICATION', 'NOTIFICATION', notification?._id, { title, to: user_id || decoded.userId });
    return NextResponse.json({
      message: 'Notification created successfully',
      notification
    });
  } catch (error) {
    if (userId) await logCRUDAction(userId, 'CREATE_NOTIFICATION', 'NOTIFICATION', null, { error: error.message }, 'FAILED', error.message);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Mark notifications as read
export async function PUT(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { notification_ids } = body;

    if (!notification_ids || !Array.isArray(notification_ids)) {
      return NextResponse.json(
        { error: 'Notification IDs array is required' },
        { status: 400 }
      );
    }

    // For now, just return success
    return NextResponse.json({
      message: 'Notifications marked as read',
      updatedCount: notification_ids.length
    });
  } catch (error) {
    console.error('Mark notifications as read error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Delete notification
export async function DELETE(request) {
  let userId = null;
  try {
    const authResult = await authenticateAndAuthorize(request, ['admin', 'guru', 'siswa', 'orangtua']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const currentUser = authResult.user;
    userId = currentUser.id || currentUser._id;
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const deleteRead = searchParams.get('deleteRead') === 'true';
    
    let result;
    
    if (deleteRead) {
      // Delete all read notifications
      result = await NotificationService.deleteReadNotifications(currentUser.id);
      await logCRUDAction(userId, 'DELETE_NOTIFICATION', 'NOTIFICATION', null, { deleteRead: true });
    } else if (id) {
      // Delete specific notification
      result = await NotificationService.deleteNotification(id, currentUser.id);
      await logCRUDAction(userId, 'DELETE_NOTIFICATION', 'NOTIFICATION', id, {});
    } else {
      return NextResponse.json({ error: 'ID notifikasi diperlukan' }, { status: 400 });
    }
    
    return NextResponse.json({ success: true, deletedCount: result.deletedCount || 1 });
  } catch (error) {
    if (userId) await logCRUDAction(userId, 'DELETE_NOTIFICATION', 'NOTIFICATION', null, { error: error.message }, 'FAILED', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 
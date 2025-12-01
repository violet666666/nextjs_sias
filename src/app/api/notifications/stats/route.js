import { NextResponse } from 'next/server';
import NotificationService from '@/lib/services/notificationService';
import { authenticateAndAuthorize } from '@/lib/authMiddleware';

// GET: Get notification statistics for current user
export async function GET(request) {
  try {
    const authResult = await authenticateAndAuthorize(request, ['admin', 'guru', 'siswa', 'orangtua']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    
    const currentUser = authResult.user;
    const stats = await NotificationService.getNotificationStats(currentUser.id);
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 
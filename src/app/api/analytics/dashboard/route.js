import { NextResponse } from 'next/server';
import connectDB from '@/lib/db'; // Gunakan satu sumber koneksi
import { authenticateAndAuthorize } from '@/lib/authMiddleware'; // Gunakan middleware standar
import AnalyticsService from '@/lib/services/analyticsService';

// GET: Get dashboard analytics based on user role
export async function GET(request) {
  try {
    // Standarisasi autentikasi dan otorisasi
    const authResult = await authenticateAndAuthorize(request, ['admin', 'guru', 'siswa', 'orangtua']);
    if (authResult.error) {
      return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status });
    }
    const { role, id: userId } = authResult.user;

    await connectDB();

    // Query dinamis sesuai role
    const stats = await AnalyticsService.getDashboardStats(role, userId);
    return NextResponse.json({ success: true, stats });
  } catch (err) {
    console.error('API /api/analytics/dashboard error:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
} 
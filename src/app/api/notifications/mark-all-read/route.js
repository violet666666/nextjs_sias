import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db';
import Notification from '@/lib/models/Notification';

export async function PUT(request) {
  try {
    // Verify JWT token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        success: false, 
        message: 'Unauthorized' 
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid token' 
      }, { status: 401 });
    }

    await connectDB();

    // Mark all unread notifications as read
    const result = await Notification.updateMany(
      { 
        recipient: decoded.userId,
        read: false
      },
      { 
        read: true,
        readAt: new Date()
      }
    );

    return NextResponse.json({
      success: true,
      message: `Marked ${result.modifiedCount} notifications as read`
    });

  } catch (error) {
    console.error('Mark all notifications read error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
} 
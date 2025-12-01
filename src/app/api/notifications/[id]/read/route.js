import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db';
import Notification from '@/lib/models/Notification';

export async function PUT(request, { params }) {
  try {
    const { id } = params;

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

    // Find and update notification
    const notification = await Notification.findOneAndUpdate(
      { 
        _id: id, 
        recipient: decoded.userId 
      },
      { 
        read: true,
        readAt: new Date()
      },
      { new: true }
    );

    if (!notification) {
      return NextResponse.json({ 
        success: false, 
        message: 'Notification not found' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      notification
    });

  } catch (error) {
    console.error('Mark notification read error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
} 
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db';
import User from '@/lib/models/userModel';
import bcrypt from 'bcryptjs';

export async function GET(request) {
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

    // Ambil userId dari payload token (bisa id atau userId)
    const userId = decoded.userId || decoded.id;
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid token payload' 
      }, { status: 401 });
    }

    // Get user profile
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: 'User not found' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      ...user.toObject()
    });

  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}

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

    const body = await request.json();
    const { nama, email, nomor_telepon, alamat, tanggal_lahir } = body;

    // Validation
    if (!nama || nama.trim().length < 2) {
      return NextResponse.json({ 
        success: false, 
        message: 'Name must be at least 2 characters long' 
      }, { status: 400 });
    }

    if (!email || !email.includes('@')) {
      return NextResponse.json({ 
        success: false, 
        message: 'Valid email is required' 
      }, { status: 400 });
    }

    await connectDB();

    // Ambil userId dari payload token (bisa id atau userId)
    const userId = decoded.userId || decoded.id;
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid token payload' 
      }, { status: 401 });
    }

    // Ambil user lama
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return NextResponse.json({ 
        success: false, 
        message: 'User not found' 
      }, { status: 404 });
    }

    // Jika email berubah, cek apakah sudah dipakai user lain
    if (email.toLowerCase() !== currentUser.email.toLowerCase()) {
      const existingUser = await User.findOne({ 
        email: email.toLowerCase(), 
        _id: { $ne: userId } 
      });
      if (existingUser) {
        return NextResponse.json({ 
          success: false, 
          message: 'Email is already taken by another user' 
        }, { status: 400 });
      }
    }

    // Update user profile
    currentUser.nama = nama.trim();
    currentUser.email = email.toLowerCase().trim();
    currentUser.nomor_telepon = nomor_telepon?.trim() || '';
    currentUser.alamat = alamat?.trim() || '';
    currentUser.tanggal_lahir = tanggal_lahir || null;
    currentUser.updatedAt = new Date();

    try {
      await currentUser.save();
      return NextResponse.json({
        success: true,
        message: 'Profile updated successfully',
        user: {
          _id: currentUser._id,
          nama: currentUser.nama,
          email: currentUser.email,
          nomor_telepon: currentUser.nomor_telepon,
          alamat: currentUser.alamat,
          tanggal_lahir: currentUser.tanggal_lahir,
          role: currentUser.role,
          foto: currentUser.foto,
          createdAt: currentUser.createdAt,
          updatedAt: currentUser.updatedAt
        }
      });
    } catch (error) {
      return NextResponse.json({
        success: false,
        message: 'Failed to update profile',
        error: error.message
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Profile PUT error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
} 
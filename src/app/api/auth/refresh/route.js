import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    const cookies = request.cookies;
    const refreshToken = cookies.get('refreshToken')?.value;
    
    if (!refreshToken) {
      return NextResponse.json({ error: 'Refresh token tidak ditemukan.' }, { status: 401 });
    }
    
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      console.error('Refresh token verification error:', err);
      return NextResponse.json({ error: 'Refresh token tidak valid.' }, { status: 401 });
    }
    
    // Buat JWT baru
    const newToken = jwt.sign({
      id: decoded.id,
      nama: decoded.nama,
      email: decoded.email,
      role: decoded.role,
    }, process.env.JWT_SECRET, { expiresIn: '1d' });
    
    // Set cookie baru
    const response = NextResponse.json({ token: newToken });
    response.cookies.set('refreshToken', refreshToken, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    });
    
    return response;
  } catch (err) {
    console.error('Refresh token error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
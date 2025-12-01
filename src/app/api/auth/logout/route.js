import { NextResponse } from 'next/server';
import { logAuthAction } from '@/lib/auditLogger';
import { verifyToken } from '@/lib/authMiddleware';

export async function POST(request) {
  try {
    // Get token from cookies or headers
    const token = request.cookies.get('refreshToken')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');
    
    let userId = null;
    
    // Try to verify token if provided
    if (token) {
      try {
        const decoded = verifyToken(token);
        if (decoded.success && decoded.decoded && decoded.decoded.id) {
          userId = decoded.decoded.id;
          // Log the logout action
          await logAuthAction(
            userId, 
            'LOGOUT', 
            'SUCCESS',
            null,
            request.headers.get('x-forwarded-for') || request.ip,
            request.headers.get('user-agent')
          );
        }
      } catch (tokenError) {
        console.log('Token verification failed during logout:', tokenError.message);
        // Continue with logout even if token is invalid
      }
    }

    // Clear cookies regardless of token validity
    const response = NextResponse.json({ message: 'Logged out successfully' });
    response.cookies.set('refreshToken', '', { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    
    // Try to log the failed logout attempt
    try {
      const token = request.cookies.get('refreshToken')?.value || 
                    request.headers.get('authorization')?.replace('Bearer ', '');
      if (token) {
        const decoded = verifyToken(token);
        if (decoded.success && decoded.decoded && decoded.decoded.id) {
          await logAuthAction(
            decoded.decoded.id, 
            'LOGOUT', 
            'FAILED',
            error.message,
            request.headers.get('x-forwarded-for') || request.ip,
            request.headers.get('user-agent')
          );
        }
      }
    } catch (auditError) {
      console.error('Audit logging error:', auditError);
    }

    // Still clear cookies even on error
    const response = NextResponse.json({ error: 'Logout failed' }, { status: 500 });
    response.cookies.set('refreshToken', '', { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/'
    });

    return response;
  }
} 
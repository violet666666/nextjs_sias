import userModel from "@/lib/models/userModel";
import connectDB from "@/lib/db"; // Use the cached connection
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { logAuthAction } from '@/lib/auditLogger';
import Joi from 'joi';

export async function POST(request) {
  const { email, password } = await request.json();
  // Validasi input dengan Joi
  const schema = Joi.object({
    email: Joi.string().email({ tlds: { allow: false } }).required(),
    password: Joi.string().min(8).max(100).required()
  });
  const { error } = schema.validate({ email, password });
  if (error) {
    return NextResponse.json({ message: error.details[0].message }, { status: 400 });
  }

  await connectDB();

  const user = await userModel.findOne({ email });
  if (!user) {
    // Jangan log audit jika user tidak ditemukan
    return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    // Audit log failed login
    await logAuthAction(user._id, 'LOGIN_FAILED', 'FAILED', 'Invalid password', request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'), request.headers.get('user-agent'));
    return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
  }

  // Buat JWT Token
  const tokenPayload = {
    id: user._id,
    nama: user.nama,
    email: user.email,
    role: user.role,
  };

  const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
    expiresIn: "1d", // Token berlaku selama 1 hari
  });

  // Buat refresh token (cookie httpOnly)
  const refreshToken = jwt.sign(tokenPayload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d", // Refresh token berlaku 7 hari
  });

  // Audit log successful login
  await logAuthAction(user._id, 'LOGIN', 'SUCCESS', null, request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'), request.headers.get('user-agent'));

  const response = NextResponse.json({
    message: "Login successful",
    user: {
      id: user._id,
      nama: user.nama,
      email: user.email,
      role: user.role,
    },
    token, // Kirim token ke client
  });
  response.cookies.set('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 hari
  });
  return response;
} 
import bcrypt from "bcryptjs";
import userModel from "@/lib/models/userModel";
import connectDB from "@/lib/db"; // Gunakan connectDB yang konsisten
import { NextResponse } from "next/server";
import { authenticateAndAuthorize } from '@/lib/authMiddleware';
import { logCRUDAction } from '@/lib/auditLogger';
import Joi from 'joi';

export async function POST(request) {
  const authResult = await authenticateAndAuthorize(request, ['admin']);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }
  // Jika registrasi publik, baris di atas tidak diperlukan.

  const body = await request.json();
  // Validasi input dengan Joi
  const schema = Joi.object({
    nama: Joi.string().min(2).max(100),
    username: Joi.string().min(2).max(100),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(100).required(),
    role: Joi.string().valid('admin', 'guru', 'siswa', 'orangtua')
  }).or('nama', 'username');
  const { error } = schema.validate(body);
  if (error) {
    return NextResponse.json({ message: error.details[0].message }, { status: 400 });
  }
  const { nama, email, password, role, username } = body;

  await connectDB();

  const existing = await userModel.findOne({ email });
  if (existing) {
    return NextResponse.json({ message: "User already exists" }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await userModel.create({
    nama: nama || username, // Gunakan nama atau username
    email,
    password_hash: hashedPassword,
    role: role || "siswa",
  });

  // Audit log
  await logCRUDAction(authResult.user.id, 'CREATE_USER', 'USER', user._id, { nama: user.nama, email: user.email, role: user.role });

  return NextResponse.json({
    message: "User created",
    user: {
      id: user._id,
      nama: user.nama,
      email: user.email,
      role: user.role,
    },
  }, { status: 201 });
}

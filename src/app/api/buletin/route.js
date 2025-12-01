import { NextResponse } from "next/server";
import Buletin from "@/lib/models/Buletin";
import dbConnect from "@/lib/db";
import User from "@/lib/models/userModel";
import { authenticateAndAuthorize } from '@/lib/authMiddleware';
import { promises as fs } from 'fs';
import path from 'path';
import formidable from 'formidable';
import { logCRUDAction } from '@/lib/auditLogger';
import NotificationService from '@/lib/services/notificationService';
import DOMPurify from 'dompurify'; // Import DOMPurify
import { JSDOM } from 'jsdom'; // Import JSDOM untuk digunakan di server-side

let getIO;
try {
  getIO = require('@/lib/config/socketServer.cjs').getIO;
} catch (e) {
  getIO = null;
}

export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper: Cek admin
    // async function isAdmin(userId) { // Tidak diperlukan lagi jika menggunakan middleware
    //   const user = await User.findById(userId);
    //   return user && user.role === "admin";
    // }

// GET: List semua buletin
export async function GET() {
      // Contoh: Buletin bisa dilihat publik, tidak perlu autentikasi
      // Jika perlu autentikasi, tambahkan:
      // const authResult = await authenticateAndAuthorize(request, ['admin', 'guru', 'siswa', 'orangtua']);
      // if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  await dbConnect();
  const buletins = await Buletin.find().populate("author", "nama email").sort({ tanggal: -1 });
  return NextResponse.json(buletins);
}

// POST: Tambah buletin (admin & guru, support upload gambar, tanpa formidable)
export async function POST(request) {
  try {
    const authResult = await authenticateAndAuthorize(request, ['admin', 'guru']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const currentUser = authResult.user;
    await dbConnect();

    const formData = await request.formData();
    const judul = formData.get('judul');
    const isi = formData.get('isi');
    const tanggal = formData.get('tanggal');
    const file = formData.get('gambar');
    if (!judul || !isi) {
      return NextResponse.json({ error: "Judul dan isi wajib diisi" }, { status: 400 });
    }

    // Sanitasi HTML dari editor TipTap menggunakan DOMPurify
    const window = new JSDOM('').window;
    const purify = DOMPurify(window);
    const sanitizedIsi = purify.sanitize(isi);

    let gambarPath = null;
    if (file && typeof file === 'object' && file.size > 0) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const uploadDir = `${process.cwd()}/public/uploads/buletin`;
      await fs.mkdir(uploadDir, { recursive: true });
      const filePath = `${uploadDir}/${fileName}`;
      await fs.writeFile(filePath, buffer);
      gambarPath = `/uploads/buletin/${fileName}`;
    }
    const buletin = await Buletin.create({
      judul: judul, // Judul tidak perlu sanitasi HTML, cukup validasi biasa
      isi: sanitizedIsi,
      tanggal,
      gambar: gambarPath,
      author: currentUser.id
    });
    // Audit log
    await logCRUDAction(currentUser.id, 'CREATE_BULETIN', 'BULETIN', buletin._id, { judul, tanggal });
    // Notifikasi ke semua user
    await NotificationService.createNotificationByRole(['admin','guru','siswa','orangtua'], {
      title: 'Buletin Baru',
      message: `Buletin baru: ${judul}`,
      type: 'buletin',
      data: { buletin_id: buletin._id, judul }
    });
    // Emit socket event aktivitas
    if (getIO && typeof getIO === 'function') {
      const io = getIO();
      if (io) io.emit('activity:new', { type: 'buletin', action: 'create', buletin });
    }
    return NextResponse.json(buletin, { status: 201 });
  } catch (error) {
    console.error("Error creating buletin:", error);
    return NextResponse.json({ error: error.message || "Gagal membuat buletin" }, { status: 500 });
  }
}

// PUT: Edit buletin (admin only)
    export async function PUT(request) {
      try {
        const authResult = await authenticateAndAuthorize(request, ['admin']);
        if (authResult.error) {
          return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }
        const currentUser = authResult.user;
        await dbConnect();
        const body = await request.json();
        const { id, judul, isi, tanggal } = body;
        if (!id || !judul || !isi ) {
          return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
        }
        const buletin = await Buletin.findByIdAndUpdate(id, { judul, isi, tanggal }, { new: true });
        if (!buletin) {
          return NextResponse.json({ error: "Buletin tidak ditemukan" }, { status: 404 });
        }
        // Audit log
        await logCRUDAction(currentUser.id, 'UPDATE_BULETIN', 'BULETIN', buletin._id, { judul, tanggal });
        // Notifikasi ke semua user
        await NotificationService.createNotificationByRole(['admin','guru','siswa','orangtua'], {
          title: 'Buletin Diperbarui',
          message: `Buletin diperbarui: ${judul}`,
          type: 'buletin',
          data: { buletin_id: buletin._id, judul }
        });
        // Emit socket event aktivitas
        if (getIO && typeof getIO === 'function') {
          const io = getIO();
          if (io) io.emit('activity:new', { type: 'buletin', action: 'update', buletin });
        }
        return NextResponse.json(buletin);
      } catch (error) {
        console.error("Error updating buletin:", error);
        return NextResponse.json({ error: error.message || "Gagal mengupdate buletin" }, { status: 500 });
  }
}

// DELETE: Hapus buletin (admin only)
    export async function DELETE(request) {
      const authResult = await authenticateAndAuthorize(request, ['admin']);
      if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }
      const currentUser = authResult.user;
    
      await dbConnect();
      const { id } = await request.json();
      if (!id) {
        return NextResponse.json({ error: "ID buletin diperlukan" }, { status: 400 });
      }
    
  const buletin = await Buletin.findByIdAndDelete(id);
  if (!buletin) {
    return NextResponse.json({ error: "Buletin tidak ditemukan" }, { status: 404 });
  }
  // Audit log
  await logCRUDAction(currentUser.id, 'DELETE_BULETIN', 'BULETIN', id, { judul: buletin.judul });
  // Notifikasi ke semua user
  await NotificationService.createNotificationByRole(['admin','guru','siswa','orangtua'], {
    title: 'Buletin Dihapus',
    message: `Buletin dihapus: ${buletin.judul}`,
    type: 'buletin',
    data: { buletin_id: id, judul: buletin.judul }
  });
  // Emit socket event aktivitas
  if (getIO && typeof getIO === 'function') {
    const io = getIO();
    if (io) io.emit('activity:new', { type: 'buletin', action: 'delete', buletin });
  }
  return NextResponse.json({ success: true });
} 
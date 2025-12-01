import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Kehadiran from '@/lib/models/Kehadiran';
import { authenticateAndAuthorize } from '@/lib/authMiddleware';
import Kelas from '@/lib/models/Kelas'; // Untuk verifikasi guru
import NotificationService from '@/lib/services/notificationService';

export async function POST(request) {
  try {
    const authResult = await authenticateAndAuthorize(request, ['admin', 'guru']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const currentUser = authResult.user;

    await connectDB();
    const { data } = await request.json(); // Expect an array of attendance records

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: 'Data kehadiran tidak valid atau kosong' }, { status: 400 });
    }

    // Jika guru, validasi apakah semua record kehadiran adalah untuk kelas yang diajarnya
    if (currentUser.role === 'guru') {
      for (const record of data) {
        const kelas = await Kelas.findById(record.kelas_id);
        if (!kelas || kelas.guru_id.toString() !== currentUser.id) {
          return NextResponse.json({ error: `Anda tidak berhak input kehadiran untuk kelas ${record.kelas_id}.` }, { status: 403 });
        }
      }
    }

    // Pastikan setiap record memiliki semua field yang dibutuhkan oleh model Kehadiran
    // dan tanggal dalam format Date yang benar
    const operations = data.map(record => {
      if (!record.kelas_id || !record.siswa_id || !record.tanggal || !record.status) {
        // Bisa dilempar error atau di-skip
        console.warn("Skipping invalid record in bulk attendance:", record);
        return null; // Akan difilter nanti
      }
      return {
        updateOne: {
          filter: { 
            kelas_id: record.kelas_id, 
            siswa_id: record.siswa_id, 
            tanggal: new Date(record.tanggal) // Pastikan tanggal adalah objek Date untuk query
          },
          update: { $set: { status: record.status, session_id: record.session_id || null } },
          upsert: true,
        },
      };
    }).filter(op => op !== null); // Hapus record yang tidak valid

    if (operations.length === 0 && data.length > 0) {
      return NextResponse.json({ error: 'Tidak ada data valid untuk diproses.' }, { status: 400 });
    }
    const result = operations.length > 0 ? await Kehadiran.bulkWrite(operations) : { upsertedCount: 0, modifiedCount: 0 };

    // Kirim notifikasi ke setiap siswa yang kehadirannya diupdate
    const userIds = data.map(r => r.siswa_id);
    await NotificationService.createBatchNotifications(userIds, {
      title: 'Kehadiran Dicatat',
      message: 'Kehadiran Anda telah dicatat atau diperbarui oleh guru.',
      type: 'attendance',
      data: {}
    });
    // Kirim notifikasi ke guru (jika role guru)
    if (currentUser.role === 'guru') {
      await NotificationService.createNotification({
        user_id: currentUser.id,
        title: 'Absensi Berhasil',
        message: `Anda telah mencatat kehadiran untuk kelas ${data[0]?.kelas_id || '-'} pada ${data[0]?.tanggal || '-'}.`,
        type: 'attendance',
        data: { kelas_id: data[0]?.kelas_id, tanggal: data[0]?.tanggal }
      });
    }

    return NextResponse.json({ message: `${result.upsertedCount + result.modifiedCount} data kehadiran berhasil diproses.`, data: result }, { status: 200 });
  } catch (error) {
    console.error("Error in bulk attendance:", error);
    return NextResponse.json({ error: error.message || "Gagal menyimpan data kehadiran secara bulk" }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Kelas from '@/lib/models/Kelas';
import User from '@/lib/models/userModel';
import Orangtua from '@/lib/models/Orangtua';
import { authenticateAndAuthorize } from '@/lib/authMiddleware';
import { logCRUDAction, logBulkAction } from '@/lib/auditLogger';
import NotificationService from '@/lib/services/notificationService';

// GET: Ambil daftar siswa di kelas
export async function GET(request, context) {
  try {
    const authResult = await authenticateAndAuthorize(request, ['admin', 'guru', 'siswa', 'orangtua']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const currentUser = authResult.user;
    const params = await context.params;
    const { id: kelasId } = params;
    
    await connectDB();
    const kelas = await Kelas.findById(kelasId).populate('siswa_ids', 'nama email nis');
    if (!kelas) {
      return NextResponse.json({ error: 'Kelas tidak ditemukan' }, { status: 404 });
    }

    // Validasi akses
    if (currentUser.role === 'siswa') {
      if (!kelas.siswa_ids.some(s => s._id.toString() === currentUser.id)) {
        return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
      }
    } else if (currentUser.role === 'guru') {
      // Cek apakah guru adalah wali kelas
      const isWaliKelas = kelas.guru_id && kelas.guru_id.toString() === currentUser.id;
      
      // Jika bukan wali kelas, cek apakah guru mengajar mata pelajaran di kelas ini
      if (!isWaliKelas) {
        const MataPelajaran = (await import('@/lib/models/MataPelajaran.js')).default;
        const mataPelajaranList = await MataPelajaran.find({
          kelas_ids: kelasId,
          $or: [
            { guru_ids: currentUser.id },
            { 'guru_kelas_assignments.guru_id': currentUser.id, 'guru_kelas_assignments.kelas_id': kelasId }
          ]
        });
        
        if (mataPelajaranList.length === 0) {
          return NextResponse.json({ error: 'Akses ditolak: Anda bukan guru yang berwenang untuk kelas ini' }, { status: 403 });
        }
      }
    } else if (currentUser.role === 'orangtua') {
      const relasiOrangtua = await Orangtua.find({ user_id: currentUser.id }).select('siswa_ids');
      const anakIds = relasiOrangtua.flatMap(r => r.siswa_ids || []).map(id => id.toString());
      if (!kelas.siswa_ids.some(s => anakIds.includes(s._id.toString()))) {
        return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
      }
    }

    return NextResponse.json(kelas.siswa_ids || []);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Tambah siswa ke kelas
export async function POST(request, context) {
  try {
    const authResult = await authenticateAndAuthorize(request, ['admin', 'guru']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const currentUser = authResult.user;
    const params = await context.params;
    const { id: kelasId } = params;
    
    await connectDB();
    const body = await request.json();
    const { siswa_id } = body; // Bisa array atau single ID
    
    if (!siswa_id || (Array.isArray(siswa_id) && siswa_id.length === 0)) {
      return NextResponse.json({ error: 'siswa_id wajib diisi' }, { status: 400 });
    }

    const kelas = await Kelas.findById(kelasId);
    if (!kelas) {
      return NextResponse.json({ error: 'Kelas tidak ditemukan' }, { status: 404 });
    }

    // Validasi guru hanya bisa edit kelasnya sendiri
    if (currentUser.role === 'guru' && kelas.guru_id.toString() !== currentUser.id) {
      return NextResponse.json({ error: 'Anda tidak berhak menambahkan siswa ke kelas ini' }, { status: 403 });
    }

    const siswaIdsToAdd = Array.isArray(siswa_id) ? siswa_id : [siswa_id];
    
    // Validasi siswa_id adalah siswa
    const siswaList = await User.find({ _id: { $in: siswaIdsToAdd }, role: 'siswa' });
    if (siswaList.length !== siswaIdsToAdd.length) {
      return NextResponse.json({ error: 'Beberapa siswa_id tidak valid atau bukan siswa' }, { status: 400 });
    }

    // Filter siswa yang belum ada di kelas
    const existingIds = kelas.siswa_ids.map(id => id.toString());
    const newSiswaIds = siswaIdsToAdd.filter(id => !existingIds.includes(id.toString()));
    
    if (newSiswaIds.length === 0) {
      return NextResponse.json({ error: 'Semua siswa sudah terdaftar di kelas ini' }, { status: 400 });
    }

    // Tambah siswa ke array
    kelas.siswa_ids.push(...newSiswaIds);
    await kelas.save();

    // Audit log
    if (newSiswaIds.length === 1) {
      await logCRUDAction(currentUser.id, 'ADD_STUDENT_TO_KELAS', 'KELAS', kelasId, { siswa_id: newSiswaIds[0] });
    } else {
      await logBulkAction(currentUser.id, 'ADD_STUDENT_TO_KELAS', 'KELAS', newSiswaIds, { kelas_id: kelasId, count: newSiswaIds.length });
    }

    // Notifikasi ke siswa
    await NotificationService.createBatchNotifications(newSiswaIds, {
      title: 'Pendaftaran Kelas',
      message: `Anda telah didaftarkan ke kelas ${kelas.nama_kelas}.`,
      type: 'info',
      category: 'academic',
      priority: 'medium',
      actionUrl: `/cpanel/classes/${kelasId}`,
      actionText: 'Lihat Kelas',
      metadata: { kelas_id: kelasId }
    });

    // Notifikasi ke guru kelas (kecuali jika guru itu sendiri yang melakukan)
    if (kelas.guru_id && kelas.guru_id.toString() !== currentUser.id) {
      await NotificationService.createNotification({
        user_id: kelas.guru_id,
        title: 'Siswa Baru Didaftarkan',
        message: `${newSiswaIds.length} siswa baru telah didaftarkan ke kelas ${kelas.nama_kelas}.`,
        type: 'info',
        category: 'academic',
        priority: 'medium',
        actionUrl: `/cpanel/classes/${kelasId}`,
        actionText: 'Lihat Kelas',
        metadata: { kelas_id: kelasId, siswa_ids: newSiswaIds }
      });
    }

    const updatedKelas = await Kelas.findById(kelasId).populate('siswa_ids', 'nama email nis');
    return NextResponse.json({ 
      success: true, 
      count: newSiswaIds.length,
      siswa: updatedKelas.siswa_ids 
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Hapus siswa dari kelas
export async function DELETE(request, context) {
  try {
    const authResult = await authenticateAndAuthorize(request, ['admin', 'guru']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const currentUser = authResult.user;
    const params = await context.params;
    const { id: kelasId } = params;
    
    await connectDB();
    const { searchParams } = new URL(request.url);
    const siswaId = searchParams.get('siswa_id');
    
    if (!siswaId) {
      return NextResponse.json({ error: 'siswa_id wajib diisi' }, { status: 400 });
    }

    const kelas = await Kelas.findById(kelasId);
    if (!kelas) {
      return NextResponse.json({ error: 'Kelas tidak ditemukan' }, { status: 404 });
    }

    // Validasi guru hanya bisa edit kelasnya sendiri
    if (currentUser.role === 'guru' && kelas.guru_id.toString() !== currentUser.id) {
      return NextResponse.json({ error: 'Anda tidak berhak menghapus siswa dari kelas ini' }, { status: 403 });
    }

    // Hapus siswa dari array
    kelas.siswa_ids = kelas.siswa_ids.filter(id => id.toString() !== siswaId);
    await kelas.save();

    // Audit log
    await logCRUDAction(currentUser.id, 'REMOVE_STUDENT_FROM_KELAS', 'KELAS', kelasId, { siswa_id: siswaId });

    const updatedKelas = await Kelas.findById(kelasId).populate('siswa_ids', 'nama email nis');
    return NextResponse.json({ 
      success: true,
      siswa: updatedKelas.siswa_ids 
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


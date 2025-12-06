import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Kelas from '@/lib/models/Kelas';
import User from '@/lib/models/userModel';
import Orangtua from '@/lib/models/Orangtua'; // Impor Orangtua
import { authenticateAndAuthorize } from '@/lib/authMiddleware';
import { logCRUDAction } from '@/lib/auditLogger';
import MataPelajaran from '@/lib/models/MataPelajaran'; // Tambah import model MataPelajaran
import NotificationService from '@/lib/services/notificationService';

export async function GET(request, context) {
  try {
    const authResult = await authenticateAndAuthorize(request, ['admin', 'guru', 'siswa', 'orangtua']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const currentUser = authResult.user;
    const params = await context.params;
    const { id } = params;
    
    await connectDB();
    // Populate hanya field yang pasti ada
    const kelas = await Kelas.findById(id)
      .populate('guru_id', 'nama email')
      .populate('siswa_ids', 'nama email nis')
      .populate({
        path: 'matapelajaran_ids',
        select: 'nama kode deskripsi total_jam_per_minggu',
        populate: {
          path: 'guru_ids',
          select: 'nama email'
        }
      });
    
    if (!kelas) return NextResponse.json({ error: 'Kelas tidak ditemukan' }, { status: 404 });
    
    // Populate pengumuman.author secara manual karena pengumuman adalah sub-document array
    if (kelas.pengumuman && kelas.pengumuman.length > 0) {
      const authorIds = [...new Set(kelas.pengumuman.map(p => p.author?.toString()).filter(Boolean))];
      if (authorIds.length > 0) {
        const authors = await User.find({ _id: { $in: authorIds } }).select('nama role');
        const authorMap = new Map(authors.map(a => [a._id.toString(), a]));
        kelas.pengumuman = kelas.pengumuman.map(p => {
          const pObj = p.toObject ? p.toObject() : p;
          const authorId = pObj.author?.toString();
          if (authorId && authorMap.has(authorId)) {
            return { ...pObj, author: authorMap.get(authorId) };
          }
          return pObj;
        });
      } else {
        kelas.pengumuman = kelas.pengumuman.map(p => p.toObject ? p.toObject() : p);
      }
    }
    
    // Set wali_kelas_id sama dengan guru_id jika belum ada (untuk kompatibilitas)
    if (!kelas.wali_kelas_id && kelas.guru_id) {
      kelas.wali_kelas_id = kelas.guru_id;
    }

    // Validasi hak akses jika bukan admin
    // Admin bisa akses semua kelas tanpa validasi
    if (currentUser.role === 'admin') {
      // Admin bisa akses semua kelas, tidak perlu validasi
    } else if (currentUser.role === 'siswa') {
      // Handle siswa_ids yang sudah di-populate atau masih ObjectId
      const siswaIds = (kelas.siswa_ids || []).map(s => {
        if (s && typeof s === 'object' && s._id) {
          return s._id.toString();
        }
        return s ? s.toString() : null;
      }).filter(Boolean);
      if (!siswaIds.includes(currentUser.id)) {
        return NextResponse.json({ error: 'Akses ditolak: Anda tidak terdaftar di kelas ini.' }, { status: 403 });
      }
    } else if (currentUser.role === 'guru') {
      // Guru hanya bisa akses kelasnya sendiri
      const guruId = kelas.guru_id?._id || kelas.guru_id;
      // Jika kelas memiliki guru_id dan bukan guru yang login, tolak akses
      if (guruId) {
        if (guruId.toString() !== currentUser.id) {
          return NextResponse.json({ error: 'Akses ditolak: Anda bukan wali kelas ini.' }, { status: 403 });
        }
      }
      // Jika kelas tidak memiliki guru_id, guru tidak bisa akses (kecuali admin)
    } else if (currentUser.role === 'orangtua') {
      const relasiOrangtua = await Orangtua.find({ user_id: currentUser.id }).select('siswa_ids');
      const anakIds = relasiOrangtua.flatMap(r => r.siswa_ids || []).map(id => id.toString());
      const siswaIds = (kelas.siswa_ids || []).map(s => {
        if (s && typeof s === 'object' && s._id) {
          return s._id.toString();
        }
        return s ? s.toString() : null;
      }).filter(Boolean);
      const hasAnakInClass = siswaIds.some(id => anakIds.includes(id));
      if (!hasAnakInClass) {
        return NextResponse.json({ error: 'Akses ditolak: Anak Anda tidak terdaftar di kelas ini.' }, { status: 403 });
      }
    }

    return NextResponse.json(kelas);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, context) {
  try {
    const params = await context.params;
    const authResult = await authenticateAndAuthorize(request, ['admin', 'guru']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const currentUser = authResult.user;
    if (!params || !params.id) {
      return NextResponse.json({ error: 'Parameter ID kelas tidak ditemukan.' }, { status: 400 });
    }
    const { id: kelasId } = params;

    await connectDB();
    const body = await request.json();

    if (currentUser.role === 'guru') {
      const kelasToUpdate = await Kelas.findById(kelasId);
      if (!kelasToUpdate || kelasToUpdate.guru_id.toString() !== currentUser.id) {
        return NextResponse.json({ error: 'Anda tidak berhak mengedit kelas ini.' }, { status: 403 });
      }
      // Guru tidak boleh mengubah guru_id
      if (body.guru_id && body.guru_id.toString() !== currentUser.id) delete body.guru_id;
    }
    const kelas = await Kelas.findByIdAndUpdate(kelasId, body, { new: true });
    if (!kelas) return NextResponse.json({ error: 'Kelas tidak ditemukan' }, { status: 404 });
    // Audit log
    await logCRUDAction(currentUser.id, 'UPDATE_KELAS', 'KELAS', kelasId, { ...body });
    return NextResponse.json(kelas);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  try {
    const params = await context.params;
    const authResult = await authenticateAndAuthorize(request, ['admin', 'guru']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const currentUser = authResult.user;
    if (!params || !params.id) {
      return NextResponse.json({ error: 'Parameter ID kelas tidak ditemukan.' }, { status: 400 });
    }
    const { id: kelasId } = params;

    if (currentUser.role === 'guru') {
      const kelasToDelete = await Kelas.findById(kelasId);
      if (!kelasToDelete || kelasToDelete.guru_id.toString() !== currentUser.id) {
        return NextResponse.json({ error: 'Anda tidak berhak menghapus kelas ini.' }, { status: 403 });
      }
    }

    await connectDB();
    const kelas = await Kelas.findByIdAndDelete(kelasId);
    if (!kelas) return NextResponse.json({ error: 'Kelas tidak ditemukan' }, { status: 404 });
    // Audit log
    await logCRUDAction(currentUser.id, 'DELETE_KELAS', 'KELAS', kelasId, { nama_kelas: kelas.nama_kelas });
    return NextResponse.json({ message: 'Kelas berhasil dihapus' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request, context) {
  try {
    const params = await context.params;
    const authResult = await authenticateAndAuthorize(request, ['admin', 'guru']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const currentUser = authResult.user;
    if (!params || !params.id) {
      return NextResponse.json({ error: 'Parameter ID kelas tidak ditemukan.' }, { status: 400 });
    }
    const { id: kelasId } = params;
    await connectDB();
    const body = await request.json();
    const { action, matapelajaran_id, text } = body;
    
    // Validasi hak akses guru: hanya wali kelas boleh
    if (currentUser.role === 'guru') {
      const kelasCheck = await Kelas.findById(kelasId);
      if (!kelasCheck || kelasCheck.guru_id.toString() !== currentUser.id) {
        return NextResponse.json({ error: 'Anda bukan wali kelas ini.' }, { status: 403 });
      }
    }
    
    // Tambah pengumuman ke kelas
    if (action === 'add-announcement') {
      console.log('[BACKEND] ===== START: Tambah Pengumuman =====');
      console.log('[BACKEND] Request body:', body);
      console.log('[BACKEND] kelasId:', kelasId);
      console.log('[BACKEND] currentUser.id:', currentUser.id);
      
      const { deskripsi } = body;
      if (!deskripsi || !deskripsi.trim()) {
        console.error('[BACKEND] Error: Deskripsi kosong');
        return NextResponse.json({ error: 'Deskripsi pengumuman wajib diisi.' }, { status: 400 });
      }
      
      const newAnnouncement = {
        deskripsi: deskripsi.trim(),
        tanggal: new Date(),
        author: currentUser.id
      };
      console.log('[BACKEND] newAnnouncement object:', newAnnouncement);
      
      // Ambil kelas terlebih dahulu
      const kelas = await Kelas.findById(kelasId);
      console.log('[BACKEND] Kelas ditemukan:', !!kelas);
      console.log('[BACKEND] Kelas ID:', kelas?._id);
      console.log('[BACKEND] Pengumuman sebelum push:', kelas?.pengumuman?.length || 0);
      
      if (!kelas) {
        console.error('[BACKEND] Error: Kelas tidak ditemukan');
        return NextResponse.json({ error: 'Kelas tidak ditemukan' }, { status: 404 });
      }
      
      // Tambahkan pengumuman ke array
      if (!kelas.pengumuman) {
        kelas.pengumuman = [];
        console.log('[BACKEND] Inisialisasi array pengumuman kosong');
      }
      
      const beforeLength = kelas.pengumuman.length;
      kelas.pengumuman.push(newAnnouncement);
      const afterLength = kelas.pengumuman.length;
      console.log('[BACKEND] Pengumuman setelah push:', {
        beforeLength,
        afterLength,
        newLength: kelas.pengumuman.length,
        lastItem: kelas.pengumuman[kelas.pengumuman.length - 1]
      });
      
      // Mark field sebagai modified untuk memastikan Mongoose menyimpan perubahan
      kelas.markModified('pengumuman');
      console.log('[BACKEND] Field pengumuman ditandai sebagai modified');
      
      // Simpan perubahan
      console.log('[BACKEND] Menyimpan perubahan ke database...');
      try {
        const saveResult = await kelas.save();
        console.log('[BACKEND] Save berhasil:', {
          _id: saveResult._id,
          pengumumanCount: saveResult.pengumuman?.length || 0,
          lastPengumuman: saveResult.pengumuman?.[saveResult.pengumuman.length - 1]
        });
        
        // Verifikasi langsung dari database
        const verifyKelas = await Kelas.findById(kelasId);
        console.log('[BACKEND] Verifikasi dari database setelah save:', {
          _id: verifyKelas?._id,
          pengumumanCount: verifyKelas?.pengumuman?.length || 0,
          lastPengumuman: verifyKelas?.pengumuman?.[verifyKelas.pengumuman.length - 1]
        });
      } catch (saveError) {
        console.error('[BACKEND] Error saat save:', saveError);
        console.error('[BACKEND] Save error details:', {
          message: saveError.message,
          name: saveError.name,
          errors: saveError.errors
        });
        return NextResponse.json({ error: `Gagal menyimpan pengumuman: ${saveError.message}` }, { status: 500 });
      }
      
      // Fetch ulang dengan populate untuk response
      console.log('[BACKEND] Fetch ulang kelas setelah save...');
      const kelasUpdated = await Kelas.findById(kelasId)
        .populate('guru_id', 'nama email')
        .populate('siswa_ids', 'nama email nis');
      
      if (!kelasUpdated) {
        console.error('[BACKEND] Error: Kelas tidak ditemukan setelah update');
        return NextResponse.json({ error: 'Kelas tidak ditemukan setelah update' }, { status: 404 });
      }
      
      console.log('[BACKEND] Kelas setelah fetch ulang:', {
        _id: kelasUpdated._id,
        pengumumanCount: kelasUpdated.pengumuman?.length || 0,
        pengumuman: kelasUpdated.pengumuman
      });
      
      // Gunakan kelasUpdated untuk populate author
      const kelasForResponse = kelasUpdated;
      
      // Populate author untuk semua pengumuman secara manual
      if (kelasForResponse.pengumuman && kelasForResponse.pengumuman.length > 0) {
        console.log('[BACKEND] Populate author untuk', kelasForResponse.pengumuman.length, 'pengumuman');
        const authorIds = [...new Set(kelasForResponse.pengumuman.map(p => {
          const authorId = p.author?.toString ? p.author.toString() : (p.author?._id ? p.author._id.toString() : p.author);
          return authorId;
        }).filter(Boolean))];
        console.log('[BACKEND] Author IDs yang perlu di-populate:', authorIds);
        
        if (authorIds.length > 0) {
          const authors = await User.find({ _id: { $in: authorIds } }).select('nama role');
          console.log('[BACKEND] Authors ditemukan:', authors.length);
          const authorMap = new Map(authors.map(a => [a._id.toString(), a]));
          kelasForResponse.pengumuman = kelasForResponse.pengumuman.map(p => {
            const pObj = p.toObject ? p.toObject() : p;
            const authorId = pObj.author?.toString ? pObj.author.toString() : (pObj.author?._id ? pObj.author._id.toString() : pObj.author);
            if (authorId && authorMap.has(authorId)) {
              return { ...pObj, author: authorMap.get(authorId) };
            }
            return pObj;
          });
        } else {
          kelasForResponse.pengumuman = kelasForResponse.pengumuman.map(p => p.toObject ? p.toObject() : p);
        }
        console.log('[BACKEND] Pengumuman setelah populate author:', kelasForResponse.pengumuman.length);
      } else {
        console.warn('[BACKEND] WARNING: Tidak ada pengumuman di kelas setelah save!');
      }
      
      // Kirim notifikasi (non-blocking)
      try {
        await NotificationService.createNotificationForClass(
          kelasId,
          {
            title: 'Pengumuman Baru',
            message: `Pengumuman baru telah diposting di kelas Anda: "${deskripsi.substring(0, 50)}..."`,
            type: 'announcement',
            data: { kelas_id: kelasId }
          }
        );
      } catch (notifError) {
        console.error('[BACKEND] Error sending notification:', notifError);
      }
      
      await logCRUDAction(currentUser.id, 'ADD_ANNOUNCEMENT_TO_KELAS', 'KELAS', kelasId, { deskripsi: deskripsi.substring(0, 50) });
      
      console.log('[BACKEND] Response akan dikirim dengan:', {
        message: 'Pengumuman berhasil ditambahkan',
        kelasId: kelasForResponse._id,
        pengumumanCount: kelasForResponse.pengumuman?.length || 0
      });
      console.log('[BACKEND] ===== END: Tambah Pengumuman =====');
      
      return NextResponse.json({ message: 'Pengumuman berhasil ditambahkan', kelas: kelasForResponse });
    }
    
    // Tambah mapel ke kelas
    if (action === 'add-mapel') {
      if (!matapelajaran_id) {
        return NextResponse.json({ error: 'matapelajaran_id wajib diisi.' }, { status: 400 });
      }
      // Update kelas
      const kelas = await Kelas.findByIdAndUpdate(
        kelasId,
        { $addToSet: { matapelajaran_ids: matapelajaran_id } },
        { new: true }
      );
      // Tidak perlu update kelas_ids di mapel
      await logCRUDAction(currentUser.id, 'ASSIGN_MAPEL_TO_KELAS', 'KELAS', kelasId, { matapelajaran_id });
      return NextResponse.json({ message: 'Mata pelajaran berhasil ditambahkan ke kelas', kelas });
    }
    // Hapus mapel dari kelas
    if (action === 'remove-mapel') {
      if (!matapelajaran_id) {
        return NextResponse.json({ error: 'matapelajaran_id wajib diisi.' }, { status: 400 });
      }
      const kelas = await Kelas.findByIdAndUpdate(
        kelasId,
        { $pull: { matapelajaran_ids: matapelajaran_id } },
        { new: true }
      );
      // Tidak perlu update kelas_ids di mapel
      await logCRUDAction(currentUser.id, 'UNASSIGN_MAPEL_FROM_KELAS', 'KELAS', kelasId, { matapelajaran_id });
      return NextResponse.json({ message: 'Mata pelajaran berhasil dihapus dari kelas', kelas });
    }
    
    return NextResponse.json({ error: 'Action tidak dikenali.' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 
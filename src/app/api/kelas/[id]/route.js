import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Kelas from '@/lib/models/Kelas';
import Enrollment from '@/lib/models/Enrollment'; // Impor Enrollment
import Orangtua from '@/lib/models/Orangtua'; // Impor Orangtua
import { authenticateAndAuthorize } from '@/lib/authMiddleware';
import { logCRUDAction } from '@/lib/auditLogger';
import MataPelajaran from '@/lib/models/MataPelajaran'; // Tambah import model MataPelajaran

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
    const kelas = await Kelas.findById(id).populate('guru_id', 'nama email');
    if (!kelas) return NextResponse.json({ error: 'Kelas tidak ditemukan' }, { status: 404 });

    // Validasi hak akses jika bukan admin
    if (currentUser.role === 'siswa') {
      const enrollment = await Enrollment.findOne({ kelas_id: id, siswa_id: currentUser.id });
      if (!enrollment) {
        return NextResponse.json({ error: 'Akses ditolak: Anda tidak terdaftar di kelas ini.' }, { status: 403 });
      }
    } else if (currentUser.role === 'guru' && kelas.guru_id?._id.toString() !== currentUser.id) {
      // Guru lain tidak bisa akses
    } else if (currentUser.role === 'orangtua') {
      const relasiOrangtua = await Orangtua.find({ user_id: currentUser.id }).select('siswa_id');
      const anakIds = relasiOrangtua.map(r => r.siswa_id);
      const enrollmentAnak = await Enrollment.findOne({ kelas_id: id, siswa_id: { $in: anakIds } });
      if (!enrollmentAnak) {
        return NextResponse.json({ error: 'Akses ditolak: Anak Anda tidak terdaftar di kelas ini.' }, { status: 403 });
      }
    }
    // Untuk orang tua, validasi bisa lebih kompleks: cek relasi orangtua-anak, lalu cek enrollment anak.
    // Ini bisa dilakukan di frontend atau API khusus orang tua.

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
    const { action, matapelajaran_id } = body;
    if (!action || !matapelajaran_id) {
      return NextResponse.json({ error: 'Action dan matapelajaran_id wajib diisi.' }, { status: 400 });
    }
    // Validasi hak akses guru: hanya wali kelas boleh
    if (currentUser.role === 'guru') {
      const kelas = await Kelas.findById(kelasId);
      if (!kelas || kelas.guru_id.toString() !== currentUser.id) {
        return NextResponse.json({ error: 'Anda bukan wali kelas ini.' }, { status: 403 });
      }
    }
    // Tambah mapel ke kelas
    if (action === 'add-mapel') {
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
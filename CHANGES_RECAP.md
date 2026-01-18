# 📋 SIAS NextJS - Complete Changes Recap

**Tanggal**: 18 Januari 2026  
**Tujuan**: Dokumentasi lengkap semua perubahan yang dilakukan untuk diterapkan pada repository GitHub lain.

---

## 📑 Daftar Isi

1. [Overview](#overview)
2. [Phase 7: Teacher Analytics Dashboard](#phase-7-teacher-analytics-dashboard)
3. [Phase 8: Class Control Panel Refactor](#phase-8-class-control-panel-refactor)
4. [Phase 9: Dashboard Database Integration Fixes](#phase-9-dashboard-database-integration-fixes)
5. [File-by-File Changes](#file-by-file-changes)

---

## Overview

Perubahan yang dilakukan mencakup 3 fase utama:

| Fase | Deskripsi | Files Affected |
|------|-----------|----------------|
| Phase 7 | Implementasi analytics dashboard untuk Guru (Mapel + Wali Kelas) | 3 files |
| Phase 8 | Refactor Class Detail Page menjadi Class Control Panel | 4 files |
| Phase 9 | Fix database integration untuk semua role dashboard | 2 files |

---

## Phase 7: Teacher Analytics Dashboard

### Tujuan
Mengimplementasikan dashboard analytics khusus untuk Guru yang menampilkan data relevan berdasarkan kelas yang diajar (baik sebagai Wali Kelas maupun Guru Mapel).

### Perubahan Utama

#### 1. `src/lib/services/analyticsService.js`

**Penambahan Method `getTeacherScope`** (Line ~282):
```javascript
// Helper: Get unique Class IDs where teacher is involved (Homeroom OR Subject)
static async getTeacherScope(guruId) {
  // 1. Homeroom classes
  const homeroomClasses = await Kelas.find({ guru_id: guruId }).distinct('_id');

  // 2. Subject classes
  const subjectClasses = await MataPelajaran.find({
    $or: [{ guru_id: guruId }, { guru_ids: guruId }]
  }).distinct('kelas_id');

  // Combine and unique
  const allClassIds = [...new Set([
    ...homeroomClasses.map(id => id.toString()), 
    ...subjectClasses.map(id => id.toString())
  ])];

  // Get Subject IDs for this teacher
  const mySubjectIds = await MataPelajaran.find({
    $or: [{ guru_id: guruId }, { guru_ids: guruId }]
  }).distinct('_id');

  return { classIds: allClassIds, subjectIds: mySubjectIds };
}
```

**Penambahan Method `getAtRiskStudents`** (Line ~399):
```javascript
static async getAtRiskStudents(guruId) {
  const { subjectIds } = await this.getTeacherScope(guruId);

  // 1. Low Grades
  const lowGrades = await Submission.find({
    tugas_id: { $in: await Tugas.find({ mata_pelajaran_id: { $in: subjectIds } }).distinct('_id') },
    nilai: { $lt: 75 }
  }).populate('siswa_id', 'nama email').limit(10);

  const riskMap = new Map();
  lowGrades.forEach(g => {
    if (!g.siswa_id) return;
    const sid = g.siswa_id._id.toString();
    if (!riskMap.has(sid)) {
      riskMap.set(sid, { id: sid, nama: g.siswa_id.nama, issues: [] });
    }
    riskMap.get(sid).issues.push(`Nilai rendah: ${g.nilai}`);
  });

  // 2. High Absence
  const badAttendance = await Kehadiran.aggregate([
    { $match: { mapel_id: { $in: subjectIds }, status: 'Alfa' } },
    { $group: { _id: '$siswa_id', count: { $sum: 1 } } },
    { $match: { count: { $gte: 2 } } }
  ]);

  await User.populate(badAttendance, { path: '_id', select: 'nama' });
  badAttendance.forEach(a => {
    if (!a._id) return;
    const sid = a._id._id.toString();
    if (!riskMap.has(sid)) {
      riskMap.set(sid, { id: sid, nama: a._id.nama, issues: [] });
    }
    riskMap.get(sid).issues.push(`Alfa ${a.count} kali`);
  });

  return Array.from(riskMap.values()).slice(0, 5);
}
```

**Update `getDashboardStats` untuk role 'guru'** (Line ~40):
```javascript
} else if (role === 'guru') {
  return {
    ...baseStats,
    myClasses: await this.getTeacherClassCount(userId),
    myAssignments: await Tugas.countDocuments({ guru_id: userId }),
    myStudents: await this.getMyStudentsCount(userId),
    classPerformance: await this.getClassPerformance(userId),
    assignmentCompletion: await this.getAssignmentCompletion(userId),
    attendanceRate: await this.getAttendanceRate(userId),
    atRiskStudents: await this.getAtRiskStudents(userId),
    recentSubmissions: await this.getRecentSubmissions(userId),
    recentGrades: await this.getRecentGrades(userId),
  };
}
```

#### 2. `src/components/analytics/AdvancedDashboard.js`

**Penambahan Teacher Dashboard dengan At Risk Widget**:
- Tambahkan MetricCard untuk: Kelas Aktif, Total Siswa, Penyelesaian Tugas, Tingkat Kehadiran
- Tambahkan Bar Chart untuk performa per kelas
- Tambahkan widget "Siswa Berisiko" dengan daftar siswa yang perlu perhatian

#### 3. `src/app/cpanel/dashboard/page.js`

**Batasi ActivityFeed hanya untuk Admin**:
```javascript
{user?.role === 'admin' && <ActivityFeed />}
```

---

## Phase 8: Class Control Panel Refactor

### Tujuan
Mengubah halaman `/cpanel/classes/[id]` dari daftar duplikat menjadi "Class Control Panel" dengan fitur unik.

### File yang Diubah

#### 1. `src/components/class-detail/ClassDetailAdmin.js` (FULL REWRITE)

**Fitur Baru**:
- Stats Widget (4 kartu): Total Siswa, Rata-rata Nilai, Tingkat Kehadiran, Siswa Berisiko
- 3 Tab: Siswa, Tugas, Nilai
- Batch Actions: Cetak Leger (PDF), Export CSV
- Tab Nilai dengan matrix siswa vs tugas

**Import yang Diperlukan**:
```javascript
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { saveAs } from 'file-saver';
import { Users, BookOpen, Award, AlertTriangle, ArrowLeft, Printer, Plus } from 'lucide-react';
import Link from 'next/link';
```

**Bagian yang Dihapus**:
- Section Pengumuman
- Section Komentar
- Tab Absensi terpisah (data digabung ke tab Siswa)

#### 2. `src/components/class-detail/ClassDetailGuru.js` (FULL REWRITE)

Mirip dengan Admin, dengan perbedaan:
- Tombol Edit/Hapus Tugas
- Tidak ada aksi "Keluarkan Siswa" (guru tidak berhak)

#### 3. `src/components/class-detail/ClassDetailSiswa.js` (SIMPLIFIED)

**Struktur Baru**:
- Stats Widget: Rata-rata Nilai, Kehadiran, Tugas Belum Selesai
- Tabel Tugas dengan status pengumpulan dan nilai
- Rekap Kehadiran dengan progress bar

#### 4. `src/components/class-detail/ClassDetailOrangtua.js` (SIMPLIFIED)

**Struktur Baru**:
- Child Selector (jika punya >1 anak)
- Stats Widget: Rata-rata Nilai, Kehadiran, Tugas Belum Selesai
- Daftar Nilai Anak dengan feedback
- Rekap Kehadiran Anak

---

## Phase 9: Dashboard Database Integration Fixes

### Tujuan
Memperbaiki ketidaksesuaian antara key data backend dan frontend untuk semua role.

### Perubahan

#### 1. `src/lib/services/analyticsService.js`

**Penambahan Method Missing untuk Orangtua**:

```javascript
static async getChildrenAttendance(orangtuaId) {
  const Orangtua = mongoose.model('Orangtua');
  const orangtua = await Orangtua.findOne({ user_id: orangtuaId });

  if (!orangtua || !orangtua.siswa_ids || orangtua.siswa_ids.length === 0) return 0;

  const totalRecords = await Kehadiran.countDocuments({ siswa_id: { $in: orangtua.siswa_ids } });
  const presentRecords = await Kehadiran.countDocuments({ 
    siswa_id: { $in: orangtua.siswa_ids },
    status: 'Hadir'
  });

  return totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;
}

static async getRecentUpdates(orangtuaId, limit = 5) {
  const Orangtua = mongoose.model('Orangtua');
  const orangtua = await Orangtua.findOne({ user_id: orangtuaId });

  if (!orangtua || !orangtua.siswa_ids || orangtua.siswa_ids.length === 0) return [];

  const recentGrades = await Submission.find({ siswa_id: { $in: orangtua.siswa_ids } })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .populate('siswa_id', 'nama')
    .populate('tugas_id', 'judul');

  return recentGrades.map(g => ({
    type: 'grade',
    title: 'Nilai Baru',
    description: `${g.siswa_id?.nama || 'Anak'} mendapat nilai ${g.nilai} di ${g.tugas_id?.judul || 'Tugas'}`,
    timestamp: g.updatedAt
  }));
}
```

#### 2. `src/components/analytics/AdvancedDashboard.js`

**Fix renderStudentDashboard**:
```javascript
// BEFORE (SALAH)
value={dashboardData.enrolledClasses || 0}
value={dashboardData.pendingTasks || 0}
value={`${dashboardData.myAverage || 0}%`}
value={`${dashboardData.myAttendance || 0}%`}

// AFTER (BENAR)
value={dashboardData.myClasses || 0}
value={dashboardData.myAssignments || 0}
value={dashboardData.myGrades?.average || 0}
value={`${dashboardData.myAttendance?.rate || 0}%`}
```

**Fix renderParentDashboard**:
- Ubah dari arrow function `() => (...)` ke function body `() => { ... return (...); }`
- Hitung `avgGrade` dari array `childrenPerformance`
- Tampilkan `recentUpdates` jika ada

---

## File-by-File Changes

### Files yang FULL REWRITE (Copy Paste Langsung):

| File | Action | Notes |
|------|--------|-------|
| `src/components/class-detail/ClassDetailAdmin.js` | REPLACE ALL | 238 → ~290 lines |
| `src/components/class-detail/ClassDetailGuru.js` | REPLACE ALL | 526 → ~320 lines |
| `src/components/class-detail/ClassDetailSiswa.js` | REPLACE ALL | 220 → ~165 lines |
| `src/components/class-detail/ClassDetailOrangtua.js` | REPLACE ALL | 236 → ~195 lines |

### Files yang PARTIAL EDIT:

| File | Changes |
|------|---------|
| `src/lib/services/analyticsService.js` | +getTeacherScope, +getAtRiskStudents, +getChildrenAttendance, +getRecentUpdates, update getDashboardStats |
| `src/components/analytics/AdvancedDashboard.js` | Fix renderStudentDashboard, Fix renderParentDashboard |
| `src/app/cpanel/dashboard/page.js` | Conditionally render ActivityFeed for admin only |

---

## Dependencies yang Diperlukan

Pastikan package berikut sudah terinstall:

```bash
npm install jspdf jspdf-autotable file-saver lucide-react recharts
```

---

## Langkah Penerapan ke Codebase Lain

1. **Backup** repository lama
2. **Copy** file-file FULL REWRITE langsung
3. **Merge** perubahan PARTIAL EDIT secara manual dengan diff tool
4. Jalankan `npm install` untuk memastikan dependencies
5. Test setiap role dashboard:
   - Admin: `/cpanel/dashboard`
   - Guru: `/cpanel/dashboard`
   - Siswa: `/cpanel/dashboard`
   - Orangtua: `/cpanel/dashboard`
6. Test Class Detail untuk setiap role:
   - Admin: `/cpanel/classes/[id]`
   - Guru: `/cpanel/classes/[id]`
   - Siswa: `/cpanel/classes/[id]`
   - Orangtua: `/cpanel/classes/[id]`

---

## Catatan Penting

1. **Model Dependencies**: Pastikan model `Orangtua` memiliki field `siswa_ids` (array of ObjectId)
2. **Kehadiran Model**: Harus memiliki field `mapel_id` untuk filtering per mata pelajaran
3. **MataPelajaran Model**: Harus memiliki field `guru_id` atau `guru_ids` untuk teacher-subject mapping

# Walkthrough: Perbaikan Komprehensif SIAS

**Tanggal**: 20 Januari 2026

---

## Ringkasan Perbaikan

Telah dilakukan perbaikan pada **6 file** untuk mengatasi masalah yang dilaporkan pada sistem SIAS:

---

## File yang Dimodifikasi

### 1. [useRealTimeTasks.js](file:///c:/Users/Acer/Downloads/Compressed/Tugas%20AKhir/nextjs_sias-main/nextjs_sias-main/src/lib/hooks/useRealTimeTasks.js)

**Masalah**: Socket.IO hardcoded ke `localhost:3000` menyebabkan gagal di production (Vercel)

**Perubahan**:
- Mengganti URL hardcoded dengan `window.location.origin` dinamis
- Menambahkan transport fallback (`websocket` + `polling`)
- Menambahkan reconnection attempts dan timeout
- Mengizinkan `createTask` bekerja tanpa socket (API-only fallback)
- Membuat socket emit bersifat conditional (`socket?.connected`)

render_diffs(file:///c:/Users/Acer/Downloads/Compressed/Tugas%20AKhir/nextjs_sias-main/nextjs_sias-main/src/lib/hooks/useRealTimeTasks.js)

---

### 2. [task-management/page.js](file:///c:/Users/Acer/Downloads/Compressed/Tugas%20AKhir/nextjs_sias-main/nextjs_sias-main/src/app/cpanel/task-management/page.js)

**Masalah**: Form tidak mengirim `mapel_id` yang dibutuhkan API `/api/tugas`

**Perubahan**:
- Menambahkan state `subjects` untuk menyimpan daftar mata pelajaran
- Menambahkan `fetchSubjects()` yang dipanggil saat kelas berubah
- Menambahkan field `mapel_id` ke form state
- Menambahkan dropdown "Mata Pelajaran" di modal create task
- Menambahkan validasi `mapel_id` sebelum submit
- Auto-select mata pelajaran pertama jika tersedia

render_diffs(file:///c:/Users/Acer/Downloads/Compressed/Tugas%20AKhir/nextjs_sias-main/nextjs_sias-main/src/app/cpanel/task-management/page.js)

---

### 3. [exams/page.js](file:///c:/Users/Acer/Downloads/Compressed/Tugas%20AKhir/nextjs_sias-main/nextjs_sias-main/src/app/cpanel/exams/page.js)

**Masalah**: Tombol "Buat Ujian Baru" tidak muncul untuk Guru karena NextAuth session lambat load

**Perubahan**:
- Menambahkan state `currentUser` dari `localStorage` sebagai fallback
- Mengubah kondisi button visibility untuk include:
  - `session?.user?.role === 'guru'`
  - `session?.user?.role === 'admin'`
  - `currentUser?.role === 'guru'`
  - `currentUser?.role === 'admin'`

render_diffs(file:///c:/Users/Acer/Downloads/Compressed/Tugas%20AKhir/nextjs_sias-main/nextjs_sias-main/src/app/cpanel/exams/page.js)

---

### 4. [academic-years/page.js](file:///c:/Users/Acer/Downloads/Compressed/Tugas%20AKhir/nextjs_sias-main/nextjs_sias-main/src/app/cpanel/academic-years/page.js)

**Masalah**: Tombol "Tambah Tahun Ajaran" muncul untuk semua role (API reject non-admin, tapi UX buruk)

**Perubahan**:
- Menambahkan state `currentUser` dari `localStorage`
- Membungkus tombol "Tambah" dalam conditional `{currentUser?.role === 'admin' && ...}`

render_diffs(file:///c:/Users/Acer/Downloads/Compressed/Tugas%20AKhir/nextjs_sias-main/nextjs_sias-main/src/app/cpanel/academic-years/page.js)

---

### 5. [grades/page.js](file:///c:/Users/Acer/Downloads/Compressed/Tugas%20AKhir/nextjs_sias-main/nextjs_sias-main/src/app/cpanel/grades/page.js)

**Masalah**: Export PDF mungkin gagal karena data transformation tidak tepat

**Perubahan**:
- Memperbaiki data transformation untuk mengambil nama siswa dari `nilai` data jika tersedia
- Menambahkan null checks di semua field
- Memperbaiki pesan error agar lebih informatif (`error.message`)
- Menambahkan validasi bahwa `doc` tidak null sebelum download

render_diffs(file:///c:/Users/Acer/Downloads/Compressed/Tugas%20AKhir/nextjs_sias-main/nextjs_sias-main/src/app/cpanel/grades/page.js)

---

### 6. [ClassDetailGuru.js](file:///c:/Users/Acer/Downloads/Compressed/Tugas%20AKhir/nextjs_sias-main/nextjs_sias-main/src/components/class-detail/ClassDetailGuru.js) (Perbaikan Sebelumnya)

**Masalah**: "Cetak Leger" silent failure

**Perubahan**:
- Menambahkan try-catch block
- Menambahkan validasi data kosong
- Memperbaiki tabel PDF dengan kolom Sakit dan Izin

---

## Verifikasi yang Diperlukan

Silakan test dengan login sebagai **Guru**:

| Test Case | URL | Expected |
|-----------|-----|----------|
| Buat Tugas | `/cpanel/task-management` | Dropdown Mata Pelajaran muncul, tugas berhasil dibuat |
| Buat Ujian | `/cpanel/exams` | Tombol "Buat Ujian Baru" muncul |
| Tahun Ajaran | `/cpanel/academic-years` | Tombol "Tambah" **TIDAK** muncul (admin-only) |
| Export PDF Nilai | `/cpanel/grades` | PDF berhasil diunduh atau pesan error spesifik |
| Cetak Leger | `/cpanel/classes/[id]` | PDF berhasil diunduh |

---

## Catatan Penting

> [!NOTE]
> **Subjects CRUD untuk Guru** - Sesuai dokumentasi RTM (Requirement Traceability Matrix), CRUD Mata Pelajaran adalah **Admin-only**. Guru hanya bisa melihat (read-only). Ini bukan bug, melainkan by design.

> [!NOTE]
> **Academic Years CRUD untuk Guru** - Sama seperti di atas, manajemen Tahun Ajaran adalah **Admin-only** sesuai dokumentasi.

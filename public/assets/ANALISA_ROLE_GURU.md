# Analisa Penggunaan Role "Guru" di SIAS NextJS

## 📋 Ringkasan Eksekutif

Role **"guru"** adalah role dengan level hierarki **3** (setelah admin=4, sebelum orangtua=2 dan siswa=1). Guru memiliki akses ke berbagai fitur manajemen kelas, tugas, kehadiran, nilai, dan pengumuman.

---

## 🔐 Konfigurasi Role & Permission

### Hierarki Role
```javascript
ROLE_HIERARCHY = {
  admin: 4,
  guru: 3,      // ← Level 3
  orangtua: 2,
  siswa: 1
}
```

### Route Permissions
Role "guru" dapat mengakses route berikut:

#### ✅ Route Khusus Guru & Admin
- `/cpanel/classes` - Manajemen Kelas
- `/cpanel/task-management` - Manajemen Tugas
- `/cpanel/attendance-management` - Manajemen Kehadiran
- `/cpanel/grades` - Manajemen Nilai
- `/cpanel/bulletin-management` - Manajemen Pengumuman

#### ✅ Route Umum (Semua Role)
- `/cpanel/dashboard` - Dashboard
- `/cpanel/profile` - Profil

#### ❌ Route yang TIDAK bisa diakses Guru
- `/cpanel/user-management` - Hanya Admin
- `/cpanel/audit-logs` - Hanya Admin
- `/cpanel/system-settings` - Hanya Admin

---

## 🎯 Fitur-Fitur yang Dapat Digunakan Guru

### 1. **Dashboard Guru** (`/cpanel/dashboard`)
**File:** `src/components/cpanel-components/dashboard/GuruDashboardView.js`

**Fitur:**
- Melihat daftar mata pelajaran yang diampu
- Melihat daftar kelas per mata pelajaran
- Melihat daftar siswa per kelas
- Melihat tugas per mata pelajaran dan kelas
- Melihat data absensi per mata pelajaran dan kelas
- Melihat nilai per mata pelajaran dan kelas

**Data yang Ditampilkan:**
- Statistik: jumlah kelas, tugas, siswa
- Performance kelas
- Completion rate tugas
- Attendance rate siswa
- Recent submissions dan grades

---

### 2. **Manajemen Kelas** (`/cpanel/classes`)
**File:** `src/app/api/kelas/route.js`, `src/components/class-detail/ClassDetailGuru.js`

**Fitur:**
- ✅ **Melihat daftar kelas** yang diajar (filter by `guru_id`)
- ✅ **Membuat kelas baru** (POST `/api/kelas`)
- ✅ **Mengedit kelas** (PUT `/api/kelas`)
- ✅ **Menghapus kelas** (DELETE `/api/kelas`)
- ✅ **Detail kelas** dengan tab:
  - **Info Kelas**: Informasi dasar kelas
  - **Siswa**: 
    - Melihat daftar siswa
    - Menambah siswa (tunggal/bulk)
    - Mengeluarkan siswa dari kelas
  - **Mata Pelajaran**: 
    - Melihat daftar mata pelajaran
    - Menambah/mengedit/hapus mata pelajaran
  - **Tugas**:
    - Melihat daftar tugas
    - Membuat tugas baru
    - Mengedit tugas
    - Menghapus tugas
  - **Nilai**:
    - Melihat nilai semua siswa
    - Statistik nilai (rata-rata, grade)
  - **Absensi**:
    - Rekap kehadiran siswa
    - Statistik kehadiran (Hadir, Izin, Sakit, Alfa)
    - Persentase kehadiran
  - **Pengumuman**: Melihat dan membuat pengumuman kelas
  - **Komentar**: Diskusi kelas

**API Endpoints:**
- `GET /api/kelas?guru_id={userId}` - Ambil kelas yang diajar
- `GET /api/kelas/{id}` - Detail kelas
- `POST /api/kelas` - Buat kelas baru
- `PUT /api/kelas` - Update kelas
- `DELETE /api/kelas?id={id}` - Hapus kelas

---

### 3. **Manajemen Tugas** (`/cpanel/task-management`)
**File:** `src/app/cpanel/task-management/page.js`

**Fitur:**
- ✅ **Melihat daftar tugas** dari kelas yang diajar
- ✅ **Membuat tugas baru**:
  - Judul tugas
  - Deskripsi
  - Deadline (datetime)
  - Kelas target
  - Mata pelajaran
- ✅ **Melihat pengumpulan tugas** (submissions):
  - Daftar siswa yang sudah mengumpulkan
  - Daftar siswa yang belum mengumpulkan
  - Status: submitted, pending, overdue
- ✅ **Memberi nilai tugas**:
  - Input nilai (0-100)
  - Memberi feedback
  - Edit nilai yang sudah ada
- ✅ **Real-time updates** (menggunakan hooks `useRealTimeTasks`)
- ✅ **Statistik real-time**:
  - Online users
  - Total tugas
  - Total submissions

**API Endpoints:**
- `GET /api/tugas?guru_id={userId}` - Ambil tugas yang dibuat guru
- `GET /api/tugas?kelas_id={id}` - Ambil tugas per kelas
- `POST /api/tugas` - Buat tugas baru
- `PUT /api/tugas/{id}` - Update tugas
- `DELETE /api/tugas/{id}` - Hapus tugas
- `GET /api/submissions?guru_id={userId}` - Ambil submissions untuk tugas guru

**Model Data:**
- `Tugas` memiliki field `guru_id` (required)
- `Submission` memiliki field `guru_id` (untuk tracking)

---

### 4. **Manajemen Kehadiran** (`/cpanel/attendance-management`)
**File:** `src/components/cpanel-components/attendance/GuruAttendanceView.js`

**Fitur:**
- ✅ **Membuat sesi absensi** (Attendance Session):
  - Pilih kelas
  - Pilih mata pelajaran
  - Judul pertemuan
  - Deskripsi pertemuan
  - Durasi (menit)
  - Status: `open` atau `closed`
- ✅ **Melihat daftar sesi absensi** yang dibuat:
  - Filter by status (open/closed)
  - Search by nama kelas atau judul
  - Klik untuk detail sesi
- ✅ **Mengelola kehadiran siswa** per sesi:
  - Status: Hadir, Izin, Sakit, Alfa
  - Real-time tracking

**API Endpoints:**
- `GET /api/attendance-sessions?guru_id={userId}` - Ambil sesi yang dibuat guru
- `POST /api/attendance-sessions` - Buat sesi baru
- `GET /api/kehadiran?guru_id={userId}` - Ambil data kehadiran
- `POST /api/kehadiran` - Input kehadiran
- `PUT /api/kehadiran/{id}` - Update kehadiran

**Model Data:**
- `AttendanceSession` memiliki field `guru_id` (required)
- `Kehadiran` memiliki relasi dengan `guru_id`

---

### 5. **Manajemen Nilai** (`/cpanel/grades`)
**File:** `src/app/cpanel/grades/page.js`

**Fitur:**
- ✅ **Melihat semua nilai** dari tugas yang dibuat guru
- ✅ **Filter dan search** nilai
- ✅ **Export data**:
  - Export ke PDF
  - Export ke Excel
- ✅ **Memberi feedback** pada nilai

**API Endpoints:**
- `GET /api/grades/all` - Ambil semua nilai (untuk admin & guru)
- `GET /api/grades?guru_id={userId}` - Ambil nilai untuk tugas guru
- `PUT /api/submissions/{id}` - Update nilai dan feedback

**Data yang Ditampilkan:**
- Nama tugas
- Nilai (dengan color coding: hijau ≥90, biru ≥80, kuning ≥70, merah <70)
- Feedback
- Tanggal kumpul

---

### 6. **Manajemen Pengumuman** (`/cpanel/bulletin-management`)
**File:** `src/app/cpanel/bulletin-management/page.js`

**Fitur:**
- ✅ **Melihat daftar pengumuman**
- ✅ **Membuat pengumuman baru**:
  - Judul
  - Isi/konten
  - Author (otomatis dari user yang login)
- ✅ **Mengedit pengumuman**
- ✅ **Menghapus pengumuman**

**API Endpoints:**
- `GET /api/buletin` - Ambil semua pengumuman
- `POST /api/buletin` - Buat pengumuman baru
- `PUT /api/buletin` - Update pengumuman
- `DELETE /api/buletin` - Hapus pengumuman

**Catatan:** 
- File `bulletin-management/page.js` saat ini hanya check untuk `admin`, tapi route permission mengizinkan `guru` juga. Perlu update validasi di frontend.

---

### 7. **Mata Pelajaran (Subjects)**
**File:** `src/app/cpanel/subjects/page.js`, `src/lib/models/MataPelajaran.js`

**Fitur:**
- ✅ **Melihat daftar mata pelajaran** yang diampu (`guru_id`)
- ✅ **Membuat mata pelajaran baru**
- ✅ **Mengedit mata pelajaran**
- ✅ **Menghapus mata pelajaran**

**Model Data:**
- `MataPelajaran` memiliki field `guru_id` (Guru pengampu)

**API Endpoints:**
- `GET /api/subjects?guru_id={userId}` - Ambil mata pelajaran yang diampu
- `POST /api/subjects` - Buat mata pelajaran baru
- `PUT /api/subjects/{id}` - Update mata pelajaran
- `DELETE /api/subjects/{id}` - Hapus mata pelajaran

---

## 📊 Analytics & Reporting

### Dashboard Analytics
**File:** `src/lib/services/analyticsService.js`

**Statistik untuk Guru:**
- `myClasses`: Jumlah kelas yang diajar
- `myAssignments`: Jumlah tugas yang dibuat
- `myStudents`: Jumlah total siswa di semua kelas
- `classPerformance`: Performance per kelas
- `assignmentCompletion`: Completion rate tugas
- `attendanceRate`: Rate kehadiran siswa
- `recentSubmissions`: 5 submission terbaru
- `recentGrades`: 5 nilai terbaru yang sudah dinilai

**Method yang Digunakan:**
- `getMyStudentsCount(guruId)` - Hitung total siswa
- `getClassPerformance(guruId)` - Performance kelas
- `getAssignmentCompletion(guruId)` - Completion rate
- `getAttendanceRate(guruId)` - Attendance rate
- `getRecentSubmissions(userId)` - Submission terbaru
- `getRecentGrades(userId)` - Nilai terbaru

---

## 🔍 Model Data yang Terkait dengan Guru

### 1. **Kelas (Class)**
```javascript
{
  guru_id: ObjectId (required, ref: "User"),
  nama_kelas: String,
  tahun_ajaran: String,
  // ...
}
```

### 2. **Tugas (Assignment)**
```javascript
{
  guru_id: ObjectId (required, ref: "User"),
  judul: String,
  deskripsi: String,
  tanggal_deadline: Date,
  kelas_id: ObjectId,
  mapel_id: ObjectId,
  // ...
}
```

### 3. **Submission**
```javascript
{
  guru_id: ObjectId (ref: "User"),
  siswa_id: ObjectId,
  tugas_id: ObjectId,
  nilai: Number,
  feedback: String,
  // ...
}
```

### 4. **AttendanceSession**
```javascript
{
  guru_id: ObjectId (required, ref: "User"),
  kelas_id: ObjectId,
  mapel_id: ObjectId,
  judul_pertemuan: String,
  status: String, // 'open' | 'closed'
  // ...
}
```

### 5. **MataPelajaran (Subject)**
```javascript
{
  guru_id: ObjectId (ref: "User"), // Guru pengampu
  nama: String,
  kelas_id: ObjectId,
  // ...
}
```

### 6. **Kehadiran (Attendance)**
```javascript
{
  guru_id: ObjectId, // Guru yang input
  siswa_id: ObjectId,
  kelas_id: ObjectId,
  mapel_id: ObjectId,
  status: String, // 'Hadir' | 'Izin' | 'Sakit' | 'Alfa'
  // ...
}
```

---

## 🎨 UI Components Khusus Guru

### 1. **GuruDashboardView**
- Dashboard khusus guru dengan filter per mata pelajaran dan kelas
- Menampilkan statistik per mapel/kelas

### 2. **ClassDetailGuru**
- Detail kelas dengan 8 tab (Info, Siswa, Mapel, Tugas, Nilai, Absensi, Pengumuman, Komentar)
- Fitur CRUD untuk siswa, tugas, mapel

### 3. **GuruAttendanceView**
- Interface untuk membuat dan mengelola sesi absensi
- Filter dan search sesi absensi

### 4. **Navigation Menu**
Menu navigasi untuk guru (dari `RoleBasedNav.js`):
- Dashboard
- Kelas Saya
- Manajemen Tugas
- Manajemen Kehadiran
- Nilai
- Pengumuman

---

## 🔒 Security & Authorization

### Middleware Checks
Semua API endpoint menggunakan `authenticateAndAuthorize` dari `src/lib/authMiddleware.js`:

```javascript
// Contoh untuk kelas
authenticateAndAuthorize(request, ['admin', 'guru'])
```

### Frontend Protection
- Menggunakan `ProtectedRoute` component
- Check role di localStorage sebelum render
- Redirect ke dashboard jika tidak authorized

### Data Filtering
- Guru hanya melihat data yang terkait dengan `guru_id` mereka
- Filter otomatis di backend berdasarkan `guru_id`

---

## 📝 Catatan Penting

### ⚠️ Issues yang Ditemukan

1. **Bulletin Management Page**
   - File `src/app/cpanel/bulletin-management/page.js` hanya check untuk `admin`
   - Perlu update validasi untuk mengizinkan `guru` juga

2. **Attendance Management Page**
   - File `src/app/cpanel/attendance-management/page.js` hanya check untuk `admin`
   - Perlu update untuk mengizinkan `guru`

3. **User Management**
   - File `src/app/cpanel/user-management/page.js` check untuk `admin` dan `guru`
   - Tapi route permission hanya untuk `admin`
   - Perlu sinkronisasi

### ✅ Best Practices yang Sudah Diterapkan

1. **Consistent Filtering**: Semua query menggunakan `guru_id` untuk filter
2. **Audit Logging**: Semua aksi CRUD di-log
3. **Real-time Updates**: Menggunakan hooks untuk real-time data
4. **Responsive Design**: UI components responsive
5. **Error Handling**: Proper error handling di semua API

---

## 📈 Statistik Penggunaan

### File yang Menggunakan Role "guru":
- **Total**: 451 baris kode yang mengandung "guru"
- **Model**: 6 model yang memiliki relasi dengan `guru_id`
- **API Routes**: 15+ endpoint yang terkait dengan guru
- **Components**: 10+ component khusus untuk guru
- **Pages**: 5+ halaman khusus untuk guru

---

## 🚀 Rekomendasi

1. **Update Validasi Frontend** untuk bulletin-management dan attendance-management
2. **Sinkronisasi Permission** antara route config dan page validation
3. **Tambah Unit Tests** untuk fitur-fitur guru
4. **Dokumentasi API** yang lebih lengkap (Swagger)
5. **Tambah Fitur Export** untuk laporan kehadiran dan nilai per kelas

---

## 📚 Referensi File

### Core Files
- `src/lib/roles.js` - Role hierarchy & permissions
- `src/lib/authMiddleware.js` - Authentication & authorization
- `src/lib/services/analyticsService.js` - Analytics untuk guru

### Models
- `src/lib/models/Kelas.js`
- `src/lib/models/Tugas.js`
- `src/lib/models/Submission.js`
- `src/lib/models/AttendanceSession.js`
- `src/lib/models/MataPelajaran.js`
- `src/lib/models/Kehadiran.js`

### Components
- `src/components/cpanel-components/dashboard/GuruDashboardView.js`
- `src/components/class-detail/ClassDetailGuru.js`
- `src/components/cpanel-components/attendance/GuruAttendanceView.js`
- `src/components/common/RoleBasedNav.js`

### Pages
- `src/app/cpanel/task-management/page.js`
- `src/app/cpanel/attendance-management/page.js`
- `src/app/cpanel/grades/page.js`
- `src/app/cpanel/bulletin-management/page.js`
- `src/app/cpanel/classes/page.js`

### API Routes
- `src/app/api/kelas/route.js`
- `src/app/api/tugas/route.js`
- `src/app/api/attendance-sessions/route.js`
- `src/app/api/grades/all/route.js`
- `src/app/api/subjects/route.js`
- `src/app/api/buletin/route.js`

---

**Dokumen ini dibuat berdasarkan analisa codebase pada:** `sias_nextjs`
**Tanggal:** 2025


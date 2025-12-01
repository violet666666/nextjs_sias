# Analisa Penggunaan Role "Orangtua" di SIAS NextJS

## 📋 Ringkasan Eksekutif

Role **"orangtua"** adalah role dengan level hierarki **2** (setelah admin=4 dan guru=3, sebelum siswa=1). Orangtua memiliki akses terbatas untuk memantau perkembangan akademik anak-anak mereka, termasuk nilai, kehadiran, tugas, dan pengumuman.

---

## 🔐 Konfigurasi Role & Permission

### Hierarki Role
```javascript
ROLE_HIERARCHY = {
  admin: 4,
  guru: 3,
  orangtua: 2,    // ← Level 2
  siswa: 1
}
```

### Route Permissions
Role "orangtua" dapat mengakses route berikut:

#### ✅ Route Khusus Orangtua
- `/cpanel/orangtua-link` - Hubungkan relasi orangtua-anak (HANYA ADMIN yang bisa akses untuk manage)
- `/cpanel/monitoring` - Monitoring perkembangan anak
- `/cpanel/children` - Daftar anak dan request relasi

#### ✅ Route Umum (Semua Role)
- `/cpanel/dashboard` - Dashboard
- `/cpanel/profile` - Profil
- `/cpanel/grades` - Nilai (dengan filter untuk anak)
- `/cpanel/attendance` - Kehadiran (dengan filter untuk anak)
- `/cpanel/classes` - Kelas (hanya kelas anak-anak)
- `/cpanel/bulletin` - Pengumuman
- `/cpanel/notifications` - Notifikasi
- `/cpanel/rekap-nilai` - Rekap nilai
- `/cpanel/rekap-absensi` - Rekap absensi

#### ❌ Route yang TIDAK bisa diakses Orangtua
- `/cpanel/user-management` - Hanya Admin
- `/cpanel/audit-logs` - Hanya Admin
- `/cpanel/task-management` - Hanya Admin & Guru
- `/cpanel/attendance-management` - Hanya Admin & Guru
- `/cpanel/bulletin-management` - Hanya Admin & Guru

---

## 🎯 Fitur-Fitur yang Dapat Digunakan Orangtua

### 1. **Dashboard Orangtua** (`/cpanel/dashboard`)
**File:** `src/components/cpanel-components/dashboard/OrangtuaDashboardView.js`

**Fitur:**
- Melihat daftar anak yang terhubung dengan akun
- Memilih anak untuk dilihat datanya
- Melihat mata pelajaran anak per kelas
- Melihat tugas per mata pelajaran
- Melihat absensi per mata pelajaran
- Grafik kehadiran anak (Hadir, Izin, Sakit, Alfa)
- Grafik nilai anak

**Statistik yang Ditampilkan:**
- Jumlah anak
- Performa anak (average grade)
- Update terbaru (recent updates)

**Data yang Ditampilkan:**
- Daftar mata pelajaran anak
- Tugas per mata pelajaran dengan deadline
- Absensi per mata pelajaran dengan status

---

### 2. **Monitoring Anak** (`/cpanel/monitoring`)
**File:** `src/app/cpanel/monitoring/page.js`

**Fitur:**
- Melihat daftar semua anak yang terhubung
- Melihat nilai rata-rata per anak
- Melihat kehadiran per anak (format: hadir/total)
- Link ke detail monitoring per anak (`/cpanel/children/{id}`)

**Data yang Ditampilkan:**
- Nama anak
- Email anak
- Nilai rata-rata
- Kehadiran (hadir/total)
- Tombol "Lihat Detail" untuk monitoring lebih lanjut

**API Endpoints:**
- `GET /api/orangtua` - Ambil relasi orangtua-anak
- `GET /api/rekap/nilai?siswa_id={id}` - Ambil nilai rata-rata
- `GET /api/kehadiran?siswa_id={id}` - Ambil data kehadiran

---

### 3. **Anak Saya** (`/cpanel/children`)
**File:** `src/app/cpanel/children/page.js`

**Fitur:**
- Melihat daftar anak yang terhubung dengan ringkasan data
- **Mengajukan request relasi** ke anak baru (jika belum ada anak)
- Melihat status request (pending, approved, rejected)
- Link ke detail monitoring per anak

**Fitur Request Relasi:**
- Input NIS anak untuk mengajukan relasi
- Request akan diproses oleh admin
- Status: pending, approved, rejected

**Data yang Ditampilkan:**
- Nama anak
- Email anak
- Nilai rata-rata (sudah diproses di backend)
- Kehadiran (sudah diproses di backend)

**API Endpoints:**
- `GET /api/orangtua/children-summary` - Ambil ringkasan data semua anak
- `GET /api/orangtua/request` - Ambil status request
- `POST /api/orangtua/request` - Ajukan request relasi baru

---

### 4. **Kelas Anak** (`/cpanel/classes`)
**File:** `src/app/cpanel/classes/page.js`, `src/components/class-detail/ClassDetailOrangtua.js`

**Fitur:**
- Melihat daftar kelas di mana anak-anak terdaftar
- Detail kelas dengan informasi:
  - Info kelas (nama, tahun ajaran, guru kelas)
  - **Pilih anak** (jika memiliki lebih dari 1 anak)
  - Nilai anak di kelas tersebut
  - Kehadiran anak di kelas tersebut
  - Pengumuman kelas
  - Komentar kelas (bisa menambah komentar)

**Detail Kelas untuk Orangtua:**
- Filter data berdasarkan anak yang dipilih
- Hanya menampilkan nilai dan kehadiran anak sendiri
- Bisa menambah komentar (dengan `siswa_id` anak)

**API Endpoints:**
- `GET /api/kelas` - Ambil kelas (filter otomatis untuk kelas anak)
- `GET /api/orangtua?user_id={id}` - Ambil daftar anak
- `GET /api/kelas/{id}` - Detail kelas
- `POST /api/kelas/{id}/comments` - Tambah komentar

---

### 5. **Nilai Anak** (`/cpanel/grades`)
**File:** `src/app/cpanel/grades/page.js`

**Fitur:**
- Melihat semua nilai tugas anak-anak
- Filter otomatis berdasarkan relasi orangtua-anak
- Export ke PDF dan Excel
- Menampilkan:
  - Nama tugas
  - Nilai (dengan color coding)
  - Feedback dari guru
  - Tanggal kumpul

**API Endpoints:**
- `GET /api/grades/student/{id}` - Ambil nilai per siswa
- Filter otomatis di backend untuk anak-anak orangtua

---

### 6. **Kehadiran Anak** (`/cpanel/attendance`)
**File:** `src/app/cpanel/attendance/page.js`

**Fitur:**
- Melihat riwayat kehadiran anak-anak
- Filter otomatis berdasarkan relasi orangtua-anak
- Menampilkan status: Hadir, Izin, Sakit, Alfa

**API Endpoints:**
- `GET /api/kehadiran?siswa_id={id}` - Ambil kehadiran per siswa
- Filter otomatis di backend untuk anak-anak orangtua

---

### 7. **Rekap Nilai** (`/cpanel/rekap-nilai`)
**Fitur:**
- Rekap nilai anak-anak
- Statistik nilai per mata pelajaran
- Export data

---

### 8. **Rekap Absensi** (`/cpanel/rekap-absensi`)
**Fitur:**
- Rekap kehadiran anak-anak
- Statistik kehadiran (persentase)
- Export data

---

### 9. **Pengumuman** (`/cpanel/bulletin`)
**Fitur:**
- Melihat pengumuman umum
- Pengumuman kelas (jika anak terdaftar di kelas)

---

### 10. **Notifikasi** (`/cpanel/notifications`)
**Fitur:**
- Menerima notifikasi tentang:
  - Tugas baru untuk anak
  - Nilai baru untuk tugas anak
  - Kehadiran anak
  - Pengumuman penting

**Notifikasi Otomatis:**
- Sistem mengirim notifikasi ke orangtua ketika:
  - Tugas baru dibuat untuk kelas anak
  - Nilai diberikan untuk tugas anak
  - Ada update kehadiran anak

---

## 🔍 Model Data yang Terkait dengan Orangtua

### 1. **Orangtua (Parent-Child Relation)**
```javascript
{
  user_id: ObjectId (required, ref: "User"), // User dengan role "orangtua"
  siswa_id: ObjectId (required, ref: "User"), // User dengan role "siswa"
  nomor_telepon: String,
  alamat: String,
  pekerjaan: String,
  // timestamps
}
```

**Relasi:**
- Satu orangtua bisa memiliki banyak anak (one-to-many)
- Satu anak bisa memiliki banyak orangtua (many-to-many)

### 2. **ParentChildRequest**
```javascript
{
  orangtua_id: ObjectId (required, ref: "User"),
  siswa_id: ObjectId (required, ref: "User"),
  status: String, // 'pending' | 'approved' | 'rejected'
  // timestamps
}
```

**Workflow:**
1. Orangtua mengajukan request dengan NIS anak
2. Admin approve/reject request
3. Jika approved, relasi dibuat di koleksi `Orangtua`

---

## 📊 Analytics & Reporting

### Dashboard Analytics
**File:** `src/lib/services/analyticsService.js`

**Statistik untuk Orangtua:**
- `childrenCount`: Jumlah anak yang terhubung
- `childrenPerformance`: Performa setiap anak (average grade, total grades)
- `childrenAttendance`: Kehadiran setiap anak
- `recentUpdates`: Update terbaru tentang anak

**Method yang Digunakan:**
- `getChildrenCount(orangtuaId)` - Hitung jumlah anak
- `getChildrenPerformance(orangtuaId)` - Performa anak
- `getChildrenAttendance(orangtuaId)` - Kehadiran anak
- `getRecentUpdates(orangtuaId)` - Update terbaru

**API Endpoint:**
- `GET /api/orangtua/children-summary` - Ringkasan lengkap semua anak dengan:
  - Data kelas anak
  - Nilai rata-rata
  - Rate kehadiran
  - Total tugas
  - Tugas yang sudah dikumpulkan

---

## 🎨 UI Components Khusus Orangtua

### 1. **OrangtuaDashboardView**
- Dashboard khusus orangtua dengan selector anak
- Menampilkan data per mata pelajaran
- Grafik kehadiran dan nilai

### 2. **ClassDetailOrangtua**
- Detail kelas dengan selector anak
- Filter data berdasarkan anak yang dipilih
- Bisa menambah komentar

### 3. **MonitoringPage**
- Tabel monitoring semua anak
- Statistik singkat per anak

### 4. **ChildrenPage**
- Daftar anak dengan ringkasan
- Form request relasi baru
- Status request

### 5. **Navigation Menu**
Menu navigasi untuk orangtua (dari `RoleBasedNav.js` dan `Sidebar.js`):
- Dashboard
- Monitoring Anak
- Anak Saya
- Kelas Anak
- Nilai Anak
- Kehadiran Anak
- Rekap Nilai
- Rekap Absensi
- Notifikasi
- Pengumuman
- Profil

---

## 🔒 Security & Authorization

### Middleware Checks
Semua API endpoint menggunakan `authenticateAndAuthorize` dari `src/lib/authMiddleware.js`:

```javascript
// Contoh untuk orangtua
authenticateAndAuthorize(request, ['orangtua'])
```

### Data Filtering
- Orangtua hanya melihat data anak-anak mereka sendiri
- Filter otomatis di backend berdasarkan `user_id` di koleksi `Orangtua`
- Tidak bisa melihat data anak orang lain

### Request System
- Orangtua bisa mengajukan request relasi dengan NIS anak
- Request harus disetujui oleh admin
- Mencegah relasi yang tidak sah

---

## 📝 Workflow Relasi Orangtua-Anak

### 1. **Admin Membuat Relasi Langsung**
- Admin bisa langsung membuat relasi di `/cpanel/orangtua-link`
- Pilih orangtua dan siswa
- Relasi langsung aktif

### 2. **Orangtua Mengajukan Request**
1. Orangtua login ke sistem
2. Buka halaman `/cpanel/children`
3. Jika belum ada anak, klik "Ajukan Hubungan ke Anak"
4. Input NIS anak
5. Submit request
6. Request status: `pending`
7. Admin approve/reject di `/cpanel/orangtua-link`
8. Jika approved, relasi dibuat otomatis

### 3. **Notifikasi untuk Orangtua**
- Sistem mengirim notifikasi ke orangtua ketika:
  - Tugas baru dibuat untuk kelas anak
  - Nilai diberikan untuk tugas anak
  - Ada update kehadiran anak
  - Request relasi disetujui/ditolak

---

## 🔍 API Endpoints untuk Orangtua

### Orangtua Management
- `GET /api/orangtua` - Ambil relasi orangtua-anak
  - Query params: `user_id`, `siswa_id`
  - Auto-filter untuk role orangtua
- `POST /api/orangtua` - Buat relasi (HANYA ADMIN)
- `GET /api/orangtua/{id}` - Detail relasi
- `PUT /api/orangtua/{id}` - Update relasi (HANYA ADMIN)
- `DELETE /api/orangtua/{id}` - Hapus relasi (HANYA ADMIN)

### Request Management
- `GET /api/orangtua/request` - Ambil request
  - Admin: semua request
  - Orangtua: request miliknya saja
- `POST /api/orangtua/request` - Ajukan request baru (ORANGTUA)
  - Body: `{ siswa_nis: string }`
- `PATCH /api/orangtua/request/{id}/approve` - Approve request (ADMIN)
- `PATCH /api/orangtua/request/{id}/reject` - Reject request (ADMIN)

### Children Summary
- `GET /api/orangtua/children-summary` - Ringkasan lengkap semua anak
  - Returns: `{ children: [], summary: {} }`
  - Data sudah diproses (nilai rata-rata, kehadiran, dll)

### Data Anak (Filtered)
- `GET /api/kelas` - Kelas anak-anak (auto-filter)
- `GET /api/grades/student/{id}` - Nilai anak
- `GET /api/kehadiran?siswa_id={id}` - Kehadiran anak
- `GET /api/tugas` - Tugas untuk kelas anak (auto-filter)
- `GET /api/submissions?siswa_id={id}` - Submission anak

---

## 📈 Statistik Penggunaan

### File yang Menggunakan Role "orangtua":
- **Total**: 342 baris kode yang mengandung "orangtua"
- **Model**: 2 model yang terkait (Orangtua, ParentChildRequest)
- **API Routes**: 10+ endpoint yang terkait dengan orangtua
- **Components**: 5+ component khusus untuk orangtua
- **Pages**: 8+ halaman khusus untuk orangtua

---

## ⚠️ Catatan Penting

### Issues yang Ditemukan

1. **Orangtua Link Page**
   - File `src/app/cpanel/orangtua-link/page.js` hanya check untuk `admin`
   - Tapi route permission mengizinkan `orangtua`
   - **Perlu update**: Orangtua seharusnya hanya bisa lihat request mereka, tidak bisa manage relasi

2. **Monitoring Page**
   - Menggunakan `localStorage.getItem("anak_id")` untuk ambil anak
   - **Perlu update**: Sebaiknya ambil dari API `/api/orangtua` untuk konsistensi

3. **Children Summary API**
   - Model `Orangtua` menggunakan `siswa_id` (singular), tapi di beberapa tempat ada `siswa_ids` (plural)
   - **Perlu verifikasi**: Pastikan konsistensi field name

### ✅ Best Practices yang Sudah Diterapkan

1. **Consistent Filtering**: Semua query menggunakan `user_id` untuk filter
2. **Request System**: Sistem request untuk keamanan relasi
3. **Auto-populate**: Data anak di-populate dengan benar
4. **Notification System**: Notifikasi otomatis untuk orangtua
5. **Data Privacy**: Orangtua hanya melihat data anak mereka sendiri

---

## 🚀 Rekomendasi

1. **Update Validasi Frontend** untuk orangtua-link page
2. **Konsistensi Field Name** di model Orangtua (siswa_id vs siswa_ids)
3. **Improve Monitoring Page** untuk tidak bergantung pada localStorage
4. **Tambah Unit Tests** untuk fitur-fitur orangtua
5. **Tambah Fitur Export** untuk laporan lengkap anak
6. **Tambah Fitur Chat** dengan guru kelas (jika diperlukan)
7. **Tambah Dashboard Widget** untuk quick view statistik anak

---

## 📚 Referensi File

### Core Files
- `src/lib/roles.js` - Role hierarchy & permissions
- `src/lib/authMiddleware.js` - Authentication & authorization
- `src/lib/services/analyticsService.js` - Analytics untuk orangtua

### Models
- `src/lib/models/Orangtua.js` - Model relasi orangtua-anak
- `src/lib/models/ParentChildRequest.js` - Model request relasi

### Components
- `src/components/cpanel-components/dashboard/OrangtuaDashboardView.js`
- `src/components/class-detail/ClassDetailOrangtua.js`
- `src/components/common/RoleBasedNav.js`
- `src/components/cpanel-components/Sidebar.js`

### Pages
- `src/app/cpanel/monitoring/page.js`
- `src/app/cpanel/children/page.js`
- `src/app/cpanel/orangtua-link/page.js`
- `src/app/cpanel/grades/page.js`
- `src/app/cpanel/attendance/page.js`
- `src/app/cpanel/classes/[id]/page.js`

### API Routes
- `src/app/api/orangtua/route.js`
- `src/app/api/orangtua/request/route.js`
- `src/app/api/orangtua/request/[id]/approve/route.js`
- `src/app/api/orangtua/request/[id]/reject/route.js`
- `src/app/api/orangtua/children-summary/route.js`
- `src/app/api/orangtua/[id]/route.js`

---

**Dokumen ini dibuat berdasarkan analisa codebase pada:** `sias_nextjs`
**Tanggal:** 2025


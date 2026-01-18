# SIAS Next.js - Sistem Informasi Akademik Sekolah

![Status](https://img.shields.io/badge/Status-Production%20Ready-green)
![Next.js](https://img.shields.io/badge/Next.js-15.0-black)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-green)

**SIAS (Sistem Informasi Akademik Sekolah)** adalah aplikasi web modern yang dirancang untuk mendigitalkan proses akademik di sekolah menengah Indonesia. Sistem ini mencakup manajemen data siswa, guru, kelas, penilaian (akademik & rapor), absensi, hingga komunikasi dengan orang tua.

---

## 🌟 Fitur Utama

Sistem ini memiliki pembagian hak akses (RBAC) yang lengkap:

### 👑 Admin
*   **Dashboard Statistik**: Ringkasan jumlah user, kelas, dan aktivitas terbaru.
*   **Manajemen Master Data**: User (Siswa/Guru/Ortu), Kelas, Mata Pelajaran, Tahun Ajaran.
*   **Pengaturan Sistem**: Konfigurasi bobot nilai (Tugas vs UH vs UTS vs UAS) secara dinamis.
*   **Audit & Monitoring**: Melihat log aktivitas sistem.

### 👨‍🏫 Guru
*   **Manajemen Kelas Ajar**: Akses khusus hanya ke kelas yang diampu.
*   **Input Nilai Ujian**: Input nilai Ulangan Harian (UH), UTS, dan UAS.
*   **ABSENSI Mapel**: Mencatat kehadiran siswa per pertemuan mata pelajaran.
*   **LMS (Tugas)**: Membuat tugas, menetapkan deadline, dan menilai submission siswa.

### 🎓 Siswa
*   **LMS Mandiri**: Melihat tugas pending, upload jawaban (file/link), dan lihat nilai.
*   **Rapor Online**: Melihat hasil studi (Nilai Akademik + Rekap Absensi) per semester.
*   **Jadwal & Pengumuman**: Akses buletin sekolah.

### 👪 Orang Tua
*   **Monitoring Anak**: Memantau nilai dan absensi anak secara real-time.
*   **Multi-Child Support**: Satu akun orang tua bisa memantau beberapa anak sekaligus.

---

## 🛠️ Teknologi yang Digunakan

*   **Frontend**: [Next.js 15](https://nextjs.org/) (App Router), React, TailwindCSS.
*   **Backend**: Next.js API Routes (Serverless functions).
*   **Database**: MongoDB (via Mongoose ODM).
*   **Auth**: Custom JWT Authentication (Middleware protected).
*   **PDF Generation**: `jspdf` & `jspdf-autotable` untuk export Rapor & Jadwal.
*   **Rich Text**: TipTap Editor untuk modul Buletin.

---

## 🚀 Cara Instalasi & Menjalankan

Ikuti langkah ini untuk menjalankan aplikasi di komputer lokal (Windows/Mac/Linux).

### Prasyarat
*   Node.js (v18 atau lebih baru)
*   MongoDB (Local atau Atlas URI)

### Langkah-langkah

1.  **Clone Repository**
    ```bash
    git clone https://github.com/username/sias-nextjs.git
    cd sias-nextjs
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Konfigurasi Environment**
    Buat file `.env` di root folder dan isi konfigurasi berikut:
    ```env
    MONGODB_URI=mongodb://localhost:27017/sias_db
    JWT_SECRET=rahasia_super_aman_123
    NEXT_PUBLIC_API_URL=http://localhost:3000
    ```

4.  **Jalankan Server Development**
    ```bash
    npm run dev
    ```
    Buka [http://localhost:3000](http://localhost:3000) di browser.

---

## 📂 Struktur Folder

```
sias-nextjs/
├── src/
│   ├── app/                # Next.js App Router (Pages & API)
│   │   ├── api/            # Backend API Endpoints
│   │   ├── cpanel/         # Halaman Admin/User (Protected)
│   │   └── login/          # Halaman Login
│   ├── components/         # Reusable UI Components
│   │   ├── common/         # Buttons, Inputs, Modals
│   │   ├── cpanel/         # Sidebar, Navbar, Widgets
│   │   └── ui/             # DataTable, Charts
│   ├── lib/                # Utility & Config
│   │   ├── db.js           # Koneksi MongoDB
│   │   ├── models/         # Mongoose Schema (User, Kelas, Nilai, dll)
│   │   └── services/       # Business Logic (Grade Calculator, etc)
├── public/                 # Static Assets (Images, Icons)
└── package.json            # Project Dependencies
```

---

## 📝 Catatan Penting untuk Developer

1.  **Grade Calculation**: Logika perhitungan nilai ada di `src/lib/services/gradeCalculator.js`. Jangan ubah logic ini kecuali Anda paham dampaknya ke seluruh nilai siswa.
2.  **Attendance**: Absensi saat ini berbasis **Mata Pelajaran**. Jika ingin menambah absensi harian (wali kelas), silakan buat model baru di `src/lib/models`.
3.  **Deployment**: Aplikasi ini siap dideploy ke Vercel. Pastikan Environment Variables diset di dashboard Vercel.

---

## 📄 Lisensi

Project ini dibuat untuk tujuan pendidikan dan pengembangan sistem sekolah.
**Copyright © 2026 SIAS Team.**

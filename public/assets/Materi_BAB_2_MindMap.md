# Materi BAB 2: Tinjauan Pustaka & Landasan Teori

Berikut adalah struktur **Mind Map (Point-point)** untuk desain Anda, dan **Catatan Presentasi** untuk disampaikan saat sidang.

---

## 🧠 BAGIAN 1: Struktur Mind Map (Draft Desain)

Gunakan poin-poin ini sebagai *node* (cabang) dalam desain mind map Anda.

### Topik Utama: Tinjauan Pustaka (BAB II)

**Cabang 1: Landasan Teori (Konsep Dasar)**
*   **Sistem Informasi**
    *   Definisi & Komponen
    *   Peran dalam Organisasi
*   **Sistem Informasi Akademik (SIA)**
    *   Manajemen Data Siswa
    *   Pengolahan Nilai & Rapor
*   **Aplikasi Berbasis Web**
    *   Client-Server Architecture
    *   HTTP/HTTPS Protocol

**Cabang 2: Teknologi Pengembangan (MERN + Next)**
*   **MongoDB (Database)**
    *   NoSQL / Dokumen Oriented
    *   Fleksibilitas Skema (Baik untuk kurikulum berubah)
*   **Next.js API Routes**
    *   Backend Logic in Serverless Functions
    *   RESTful API Service Integrated
*   **React.js (Frontend)**
    *   Component-Based
    *   Virtual DOM (Cepat)
*   **Next.js (Framework)**
    *   Server-Side Rendering (SSR)
    *   Routing System & Optimization
*   **Node.js (Runtime)**
    *   JavaScript Everywhere (Fullstack)
    *   Non-blocking I/O

**Cabang 3: Metode Pengembangan**
*   **SDLC Waterfall**
    *   Analisis Kebutuhan
    *   Desain Sistem
    *   Implementasi
    *   Pengujian (Black-box)
    *   Deployment

**Cabang 4: Tinjauan Studi (State of The Art)**
*   **Penelitian Terdahulu 1: Lutviana (2023)**
    *   *Tech*: PHP Native
    *   *Gap*: Belum ada notifikasi & lambat load data
*   **Penelitian Terdahulu 2: Kamal (2023)**
    *   *Tech*: MERN Standard
    *   *Gap*: Fitur belum spesifik untuk SMK
*   **Penelitian Terdahulu 3: Haryati (2019)**
    *   *Tech*: CodeIgniter (Monolith)
    *   *Gap*: Kesulitan scaling & maintenance
*   **Kebaruan Penelitian Ini (Novelty)**
    *   Integrasi Next.js 14 untuk performa
    *   Fitur Monitoring Orang Tua Real-time
    *   Arsitektur Modern yang Scalable

---

## 🗣️ BAGIAN 2: Catatan Presentasi (Speaker Notes)

Gunakan naskah ini sebagai panduan saat menjelaskan slide mind map BAB 2.

**Pembukaan Slide BAB 2:**
*"Masuk ke BAB 2, saya membagi landasan teori dan tinjauan pustaka penelitian ini ke dalam empat pilar utama, yaitu Konsep, Teknologi, Metodologi, dan Studi Komparasi."*

**1. Menjelaskan Landasan Teori:**
*"Pertama, penelitian ini didasari oleh teori Sistem Informasi Akademik sebagai solusi untuk manajemen data pendidikan yang kompleks. Kami berfokus pada transformasi dari sistem manual ke berbasis web untuk aksesibilitas yang lebih luas bagi semua stakeholder."*

**2. Menjelaskan Teknologi (PENTING - Highlight MERN):**
*"Untuk teknologi, sistem ini dibangun menggunakan stack modern.
*   Kami memilih **MongoDB** karena sifat NoSQL-nya yang fleksibel—sangat cocok untuk data nilai kurikulum SMK yang sering mengalami penyesuaian format.
*   Di sisi antarmuka, kami menggunakan **React.js** dan framework **Next.js**. Ini adalah kunci performa aplikasi kami, memungkinkan loading halaman yang instan dan rendering yang efisien.
*   Semuanya berjalan di atas **Node.js**, yang memungkinkan kami menggunakan satu bahasa pemrograman, JavaScript, di sisi server maupun client, mempercepat proses development dan integrasi."*

**3. Menjelaskan Metode:**
*"Metode pengembangan yang digunakan adalah **Waterfall**. Mengapa Waterfall? Karena kebutuhan sistem akademik di SMK Negeri 2 Makassar sudah terdefinisi dengan jelas dan baku di awal, sehingga pendekatan sekuensial ini adalah yang paling terstruktur dan efisien untuk dokumentasi tugas akhir."*

**4. Menjelaskan (Perbandingan):**
*"Terakhir, melihat dari tinjauan studi terdahulu.
*   Penelitian sebelumnya seperti Lutviana (2023) dan Haryati (2019) masih banyak menggunakan arsitektur monolitik PHP yang memiliki keterbatasan dalam skalabilitas dan kecepatan real-time.
*   Disitulah letak **Gap dan Kebaruan (Novelty)** penelitian ini. Kami mengisi celah tersebut dengan menghadirkan SIAS berbasis MERN Stack yang tidak hanya mencatat nilai, tapi juga memberikan fitur monitoring real-time bagi orang tua dengan arsitektur yang siap untuk pengembangan jangka panjang."*

**Penutup Slide:**
*"Landasan inilah yang menjadi fondasi kuat dalam perancangan sistem yang akan dibahas di bab selanjutnya."*

---

## 🛡️ BONUS: Antisipasi Pertanyaan Sidang (Cheat Sheet)

**Q: Di Laporan ditulis MERN Stack (MongoDB, Express, React, Node), tapi kenapa di kodingan tidak ada Express.js?**

**Jawaban Diplomatis (Pilih salah satu):**

**Opsi 1 (Jawaban Teknis & Modern - Recommended):**
> *"Betul pak/bu. Secara konsep arsitektur, aplikasi ini memang menganut pola **MERN Stack**. Namun, dalam implementasi modern menggunakan **Next.js**, fungsi 'E' (Express.js) sebagai Routing dan Middleware Backend sudah **terintegrasi langsung** di dalam Next.js melalui fitur **API Routes**."*
>
> *"Jadi, saya memilih untuk menggunakan fitur native Next.js agar aplikasi lebih ringan (tidak perlu install dependency tambahan yang redundan) dan performanya lebih optimal, tanpa mengubah konsep dasar bahwa backend-nya tetap berbasis Node.js JavaScript."*

**Opsi 2 (Analogi Simpel):**
> *"Express.js fungsinya untuk mengatur jalur data (Routing) di Backend. Karena saya menggunakan Framework Next.js, framework ini sudah memiliki pengatur jalur datanya sendiri yang fungsinya sama persis dengan Express. Jadi, fungsi Express tetap ada dan berjalan, tapi sudah dibungkus (built-in) di dalam Next.js itu sendiri."*

**Poin Kunci untuk Argumen:**
1.  **Redundansi:** Jika pakai Express lagi di dalam Next.js, itu *double handling* (pemborosan resource).
2.  **Evolusi MERN:** MERN Stack zaman sekarang berevolusi menjadi **MongoDB - Next.js (React Framework) - Node.js**.
3.  **Efisiensi:** Development lebih cepat karena frontend dan backend ada di satu struktur project (Monorepo).

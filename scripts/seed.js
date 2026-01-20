/**
 * SIAS Database Seed Script
 * 
 * Generates comprehensive test data matching actual model schemas.
 * 
 * Email format: [role][number]@smk2.sch.id
 * Password for all users: password123
 * 
 * Usage: node scripts/seed.js
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sias';

// ============================================
// SCHEMAS - Must match actual model definitions
// ============================================

// User Schema (matches src/lib/models/userModel.js)
const UserSchema = new mongoose.Schema({
    nama: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'guru', 'siswa', 'orangtua'], required: true },
    nisn: { type: String },
    nip: { type: String },
    foto: { type: String },
    alamat: { type: String },
    nomor_telepon: { type: String },
    tempat_lahir: { type: String },
    tanggal_lahir: { type: Date },
    nama_ortu: { type: String },
    kelas_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Kelas' },
    online_status: { type: String, enum: ['online', 'offline', 'away'], default: 'offline' },
    last_seen: { type: Date, default: Date.now },
    last_activity: { type: Date, default: Date.now },
    activity_log: [{ action: String, details: mongoose.Schema.Types.Mixed, timestamp: { type: Date, default: Date.now } }]
}, { timestamps: true });

// AcademicYear Schema (matches src/lib/models/AcademicYear.js)
const AcademicYearSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    semester: { type: String, enum: ['Ganjil', 'Genap'], required: true },
    status: { type: String, enum: ['Active', 'Archived', 'Planned'], default: 'Planned' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isCurrent: { type: Boolean, default: false }
}, { timestamps: true });

// Kelas Schema (matches src/lib/models/Kelas.js)
const KelasSchema = new mongoose.Schema({
    nama_kelas: { type: String, required: true },
    deskripsi: { type: String },
    tahun_ajaran: { type: String, required: true },
    academic_year_id: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear' },
    status_kelas: { type: String, enum: ['aktif', 'nonaktif'], default: 'aktif' },
    guru_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    matapelajaran_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MataPelajaran' }],
    siswa_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

// MataPelajaran Schema
const MataPelajaranSchema = new mongoose.Schema({
    nama_mapel: { type: String, required: true },
    kode_mapel: { type: String },
    kelas_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Kelas' },
    guru_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    kkm: { type: Number, default: 75 },
}, { timestamps: true });

// Enrollment Schema
const EnrollmentSchema = new mongoose.Schema({
    siswa_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    kelas_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Kelas', required: true },
    tahun_ajaran_id: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: true });

// Orangtua Schema
const OrangtuaSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    siswa_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    nomor_telepon: { type: String },
    alamat: { type: String },
    pekerjaan: { type: String },
}, { timestamps: true });

// Tugas Schema
const TugasSchema = new mongoose.Schema({
    judul: { type: String, required: true },
    deskripsi: { type: String },
    kelas_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Kelas' },
    mapel_id: { type: mongoose.Schema.Types.ObjectId, ref: 'MataPelajaran' },
    guru_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    tanggal_deadline: { type: Date, required: true },
    status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
}, { timestamps: true });

// Submission Schema
const SubmissionSchema = new mongoose.Schema({
    tugas_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Tugas', required: true },
    siswa_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    guru_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    tanggal_kumpul: { type: Date, required: true },
    file_path: { type: String, required: true },
    nilai: { type: Number, default: 0 },
    feedback: { type: String },
    status: { type: String, enum: ['submitted', 'graded'], default: 'submitted' },
}, { timestamps: true });

// Kehadiran Schema
const KehadiranSchema = new mongoose.Schema({
    siswa_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    kelas_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Kelas' },
    mapel_id: { type: mongoose.Schema.Types.ObjectId, ref: 'MataPelajaran' },
    tanggal: { type: Date, required: true },
    status: { type: String, enum: ['Hadir', 'Izin', 'Sakit', 'Alfa'], required: true },
}, { timestamps: true });

// Create models
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const AcademicYear = mongoose.models.AcademicYear || mongoose.model('AcademicYear', AcademicYearSchema);
const Kelas = mongoose.models.Kelas || mongoose.model('Kelas', KelasSchema);
const MataPelajaran = mongoose.models.MataPelajaran || mongoose.model('MataPelajaran', MataPelajaranSchema);
const Enrollment = mongoose.models.Enrollment || mongoose.model('Enrollment', EnrollmentSchema);
const Orangtua = mongoose.models.Orangtua || mongoose.model('Orangtua', OrangtuaSchema);
const Tugas = mongoose.models.Tugas || mongoose.model('Tugas', TugasSchema);
const Submission = mongoose.models.Submission || mongoose.model('Submission', SubmissionSchema);
const Kehadiran = mongoose.models.Kehadiran || mongoose.model('Kehadiran', KehadiranSchema);

// Helper functions
const hashPassword = async (password) => bcrypt.hash(password, 10);
const randomFromArray = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomDate = (daysBack) => {
    const date = new Date();
    date.setDate(date.getDate() - randomNumber(0, daysBack));
    return date;
};

async function seedDatabase() {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await Promise.all([
        User.deleteMany({}),
        AcademicYear.deleteMany({}),
        Kelas.deleteMany({}),
        MataPelajaran.deleteMany({}),
        Enrollment.deleteMany({}),
        Orangtua.deleteMany({}),
        Tugas.deleteMany({}),
        Submission.deleteMany({}),
        Kehadiran.deleteMany({}),
    ]);
    console.log('✅ Data cleared');

    const hashedPassword = await hashPassword('password123');

    // ============================================
    // 1. Create Admin
    // ============================================
    console.log('👤 Creating Admin...');
    const admin = await User.create({
        nama: 'Administrator SIAS',
        email: 'admin@smk2.sch.id',
        password_hash: hashedPassword,
        role: 'admin',
        online_status: 'offline',
    });
    console.log(`  ✅ Admin: ${admin.email}`);

    // ============================================
    // 2. Create Academic Year (with proper dates)
    // ============================================
    console.log('📅 Creating Academic Year...');
    const academicYear = await AcademicYear.create({
        name: '2025/2026',
        semester: 'Ganjil',
        status: 'Active',
        startDate: new Date('2025-07-15'),
        endDate: new Date('2025-12-20'),
        isCurrent: true,
    });
    console.log(`  ✅ Academic Year: ${academicYear.name} (${academicYear.semester})`);

    // ============================================
    // 3. Create Teachers (Guru)
    // ============================================
    console.log('👨‍🏫 Creating Teachers...');
    const guruNames = ['Budi Santoso', 'Sri Wahyuni', 'Ahmad Fauzi', 'Dewi Lestari', 'Agus Prabowo'];
    const gurus = [];
    for (let i = 0; i < guruNames.length; i++) {
        const guru = await User.create({
            nama: guruNames[i],
            email: `guru${i + 1}@smk2.sch.id`,
            password_hash: hashedPassword,
            role: 'guru',
            nip: `19800${i + 1}01200${i + 1}1001`,
            online_status: 'offline',
        });
        gurus.push(guru);
        console.log(`  ✅ Guru: ${guru.email} - ${guru.nama}`);
    }

    // ============================================
    // 4. Create Classes (Kelas)
    // ============================================
    console.log('🏫 Creating Classes...');
    const classNames = ['X RPL 1', 'XI RPL 1', 'XII RPL 1'];
    const classes = [];
    for (let i = 0; i < classNames.length; i++) {
        const kelas = await Kelas.create({
            nama_kelas: classNames[i],
            deskripsi: `Kelas ${classNames[i]} Tahun Ajaran ${academicYear.name}`,
            tahun_ajaran: academicYear.name, // String field
            academic_year_id: academicYear._id, // ObjectId reference
            guru_id: gurus[i]._id,
            status_kelas: 'aktif',
            siswa_ids: [], // Will be populated later
        });
        classes.push(kelas);
        console.log(`  ✅ Kelas: ${kelas.nama_kelas} (Wali: ${gurus[i].nama})`);
    }

    // ============================================
    // 5. Create Subjects (Mata Pelajaran)
    // ============================================
    console.log('📚 Creating Subjects...');
    const subjectData = [
        { nama: 'Pemrograman Web', kode: 'PWD' },
        { nama: 'Basis Data', kode: 'BD' },
        { nama: 'Pemrograman Berorientasi Objek', kode: 'PBO' },
        { nama: 'Desain Grafis', kode: 'DG' },
        { nama: 'Matematika', kode: 'MTK' },
        { nama: 'Bahasa Inggris', kode: 'BING' },
    ];
    const subjects = [];
    for (let i = 0; i < classes.length; i++) {
        // 2 subjects per class
        for (let j = 0; j < 2; j++) {
            const subjectIndex = (i * 2 + j) % subjectData.length;
            const guru = gurus[(i + j) % gurus.length];
            const mapel = await MataPelajaran.create({
                nama_mapel: subjectData[subjectIndex].nama,
                kode_mapel: `${subjectData[subjectIndex].kode}-${classNames[i].replace(' ', '')}`,
                kelas_id: classes[i]._id,
                guru_id: guru._id,
                kkm: 75,
            });
            subjects.push({ mapel, kelas: classes[i] });

            // Update Kelas with mapel reference
            await Kelas.findByIdAndUpdate(classes[i]._id, {
                $push: { matapelajaran_ids: mapel._id }
            });

            console.log(`  ✅ Mapel: ${mapel.nama_mapel} (${classNames[i]}) - Guru: ${guru.nama}`);
        }
    }

    // ============================================
    // 6. Create Students (30 Siswa, 10 per class)
    // ============================================
    console.log('👨‍🎓 Creating Students...');
    const siswaFirstNames = ['Andi', 'Budi', 'Citra', 'Dian', 'Eka', 'Fajar', 'Gita', 'Hadi', 'Indra', 'Joko'];
    const siswaLastNames = ['Pratama', 'Wijaya', 'Sari', 'Kusuma', 'Rahman', 'Putri', 'Saputra', 'Dewi', 'Nugroho', 'Hartono'];
    const siswas = [];

    for (let classIndex = 0; classIndex < classes.length; classIndex++) {
        const classStudentIds = [];
        for (let i = 0; i < 10; i++) {
            const firstName = siswaFirstNames[i];
            const lastName = siswaLastNames[i];
            const siswaNumber = classIndex * 10 + i + 1;

            const siswa = await User.create({
                nama: `${firstName} ${lastName}`,
                email: `siswa${siswaNumber}@smk2.sch.id`,
                password_hash: hashedPassword,
                role: 'siswa',
                nisn: `2025${String(classIndex + 1).padStart(2, '0')}${String(i + 1).padStart(3, '0')}`,
                kelas_id: classes[classIndex]._id,
                online_status: 'offline',
            });
            siswas.push({ siswa, kelas: classes[classIndex] });
            classStudentIds.push(siswa._id);

            // Create enrollment
            await Enrollment.create({
                siswa_id: siswa._id,
                kelas_id: classes[classIndex]._id,
                tahun_ajaran_id: academicYear._id,
                status: 'active',
            });

            console.log(`  ✅ Siswa: ${siswa.email} - ${siswa.nama} (${classes[classIndex].nama_kelas})`);
        }

        // Update Kelas with student IDs
        await Kelas.findByIdAndUpdate(classes[classIndex]._id, {
            siswa_ids: classStudentIds
        });
    }

    // ============================================
    // 7. Create Parents and Link to Children
    // ============================================
    console.log('👪 Creating Parents and Linking to Children...');
    const orangtuaData = [
        { nama: 'Pak Budi Hartono', children: [0, 1] },      // siswa1, siswa2
        { nama: 'Bu Sri Wulandari', children: [2, 3] },      // siswa3, siswa4
        { nama: 'Pak Ahmad Subekti', children: [4] },        // siswa5
        { nama: 'Bu Dewi Rahayu', children: [5, 6, 7] },     // siswa6, siswa7, siswa8
        { nama: 'Pak Joko Widodo', children: [8] },          // siswa9
        { nama: 'Bu Rina Kusuma', children: [10, 11] },      // siswa11, siswa12 (XI)
        { nama: 'Pak Hasan Abdullah', children: [12, 13] },  // siswa13, siswa14 (XI)
        { nama: 'Bu Maya Sari', children: [20, 21, 22] },    // siswa21, siswa22, siswa23 (XII)
        { nama: 'Pak Eko Prasetyo', children: [23] },        // siswa24 (XII)
        { nama: 'Bu Tutik Handayani', children: [25, 26] },  // siswa26, siswa27 (XII)
    ];

    const orangtuas = [];
    for (let i = 0; i < orangtuaData.length; i++) {
        const orangtuaUser = await User.create({
            nama: orangtuaData[i].nama,
            email: `orangtua${i + 1}@smk2.sch.id`,
            password_hash: hashedPassword,
            role: 'orangtua',
            online_status: 'offline',
        });
        orangtuas.push(orangtuaUser);
        console.log(`  ✅ Orangtua: ${orangtuaUser.email} - ${orangtuaUser.nama}`);

        // Link to children
        for (const childIndex of orangtuaData[i].children) {
            if (childIndex < siswas.length) {
                await Orangtua.create({
                    user_id: orangtuaUser._id,
                    siswa_id: siswas[childIndex].siswa._id,
                    nomor_telepon: `08${randomNumber(10, 99)}${randomNumber(1000, 9999)}${randomNumber(100, 999)}`,
                    alamat: `Jl. Contoh No. ${randomNumber(1, 100)}`,
                    pekerjaan: randomFromArray(['Wiraswasta', 'PNS', 'Pegawai Swasta', 'Guru', 'Dokter']),
                });
                console.log(`    → Linked to: ${siswas[childIndex].siswa.nama}`);
            }
        }
    }

    // ============================================
    // 8. Create Tasks (Tugas)
    // ============================================
    console.log('📝 Creating Tasks...');
    const tugasTemplates = ['Tugas Praktikum', 'Latihan Soal', 'Project Mini'];
    const tugasList = [];

    for (const { mapel, kelas } of subjects) {
        for (let i = 0; i < 3; i++) {
            const tugas = await Tugas.create({
                judul: `${tugasTemplates[i]} - ${mapel.nama_mapel}`,
                deskripsi: `Deskripsi tugas untuk ${mapel.nama_mapel}`,
                kelas_id: kelas._id,
                mapel_id: mapel._id,
                guru_id: mapel.guru_id,
                tanggal_deadline: new Date(Date.now() + randomNumber(7, 30) * 24 * 60 * 60 * 1000),
                status: 'active',
            });
            tugasList.push(tugas);
        }
    }
    console.log(`  ✅ Created ${tugasList.length} tasks`);

    // ============================================
    // 9. Create Submissions
    // ============================================
    console.log('📤 Creating Submissions...');
    let submissionCount = 0;
    for (const tugas of tugasList) {
        // Get students in this class
        const classStudents = siswas.filter(s => s.kelas._id.toString() === tugas.kelas_id.toString());

        // 70% of students submit
        for (const { siswa } of classStudents.slice(0, Math.floor(classStudents.length * 0.7))) {
            const isGraded = Math.random() > 0.3;
            await Submission.create({
                tugas_id: tugas._id,
                siswa_id: siswa._id,
                guru_id: tugas.guru_id,
                tanggal_kumpul: randomDate(7),
                file_path: `/uploads/submissions/${siswa._id}_${tugas._id}.pdf`,
                nilai: isGraded ? randomNumber(60, 100) : 0,
                feedback: isGraded ? randomFromArray(['Bagus!', 'Pertahankan!', 'Perlu perbaikan', 'Kerja keras lagi']) : '',
                status: isGraded ? 'graded' : 'submitted',
            });
            submissionCount++;
        }
    }
    console.log(`  ✅ Created ${submissionCount} submissions`);

    // ============================================
    // 10. Create Attendance Records
    // ============================================
    console.log('📋 Creating Attendance Records...');
    const attendanceStatuses = ['Hadir', 'Hadir', 'Hadir', 'Hadir', 'Izin', 'Sakit', 'Alfa'];
    let attendanceCount = 0;

    for (const { siswa, kelas } of siswas) {
        // Get subjects for this class
        const classSubjects = subjects.filter(s => s.kelas._id.toString() === kelas._id.toString());

        // Create attendance for last 20 school days
        for (let dayOffset = 0; dayOffset < 20; dayOffset++) {
            const date = new Date();
            date.setDate(date.getDate() - dayOffset);
            // Skip weekends
            if (date.getDay() === 0 || date.getDay() === 6) continue;

            for (const { mapel } of classSubjects) {
                await Kehadiran.create({
                    siswa_id: siswa._id,
                    kelas_id: kelas._id,
                    mapel_id: mapel._id,
                    tanggal: date,
                    status: randomFromArray(attendanceStatuses),
                });
                attendanceCount++;
            }
        }
    }
    console.log(`  ✅ Created ${attendanceCount} attendance records`);

    // ============================================
    // Summary
    // ============================================
    console.log('\n' + '='.repeat(50));
    console.log('🎉 SEED COMPLETE!');
    console.log('='.repeat(50));
    console.log(`
📊 Summary:
  - 1 Admin (admin@smk2.sch.id)
  - ${gurus.length} Guru (guru1@smk2.sch.id ~ guru${gurus.length}@smk2.sch.id)
  - ${siswas.length} Siswa (siswa1@smk2.sch.id ~ siswa${siswas.length}@smk2.sch.id)
  - ${orangtuas.length} Orangtua (orangtua1@smk2.sch.id ~ orangtua${orangtuas.length}@smk2.sch.id)
  - ${classes.length} Kelas (with siswa_ids populated)
  - ${subjects.length} Mata Pelajaran
  - ${tugasList.length} Tugas
  - ${submissionCount} Submissions
  - ${attendanceCount} Attendance Records
  - 1 Academic Year (${academicYear.name} - ${academicYear.semester})

🔐 All passwords: password123

📧 Test Accounts:
  Admin: admin@smk2.sch.id
  Guru: guru1@smk2.sch.id (Wali Kelas X RPL 1)
  Siswa: siswa1@smk2.sch.id (Kelas X RPL 1)
  Orangtua: orangtua1@smk2.sch.id (linked to siswa1 & siswa2)
`);

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
}

// Run the seed
seedDatabase().catch(err => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});

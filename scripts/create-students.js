/**
 * Script untuk membuat 20 siswa dummy
 * 
 * Cara menjalankan:
 * node scripts/create-students.js
 * 
 * Pastikan file .env.local ada di root project dengan MONGODB_URI
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables - coba beberapa lokasi
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Coba load dari beberapa file .env
const envFiles = ['.env.local', '.env.development.local', '.env'];
let envLoaded = false;

for (const envFile of envFiles) {
  const envPath = join(rootDir, envFile);
  const result = dotenv.config({ path: envPath });
  if (!result.error) {
    console.log(`📄 Menggunakan file: ${envFile}`);
    envLoaded = true;
    break;
  }
}

// Jika tidak ada yang berhasil, coba load default
if (!envLoaded) {
  dotenv.config();
}

// Debug: tampilkan apakah MONGODB_URI ditemukan
if (!process.env.MONGODB_URI) {
  console.error('\n❌ MONGODB_URI tidak ditemukan!');
  console.error('   Pastikan salah satu file berikut ada di root project:');
  console.error('   - .env.local');
  console.error('   - .env.development.local');
  console.error('   - .env');
  console.error('\n   Dan berisi: MONGODB_URI=your_mongodb_connection_string\n');
  process.exit(1);
}

// Define User Schema (sama dengan model yang ada)
const UserSchema = new mongoose.Schema({
  nama: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  role: {
    type: String,
    enum: ["admin", "guru", "siswa", "orangtua"],
    default: "siswa",
  },
  foto: { type: String },
  alamat: { type: String },
  nomor_telepon: { type: String },
  tempat_lahir: { type: String },
  tanggal_lahir: { type: Date },
  nis: { type: String, unique: true, sparse: true },
  nisn: { type: String },
  nama_ortu: { type: String },
  kelas_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Kelas' },
  online_status: {
    type: String,
    enum: ["online", "offline", "away"],
    default: "offline"
  },
  last_seen: { type: Date, default: Date.now },
  last_activity: { type: Date, default: Date.now },
  activity_log: [{
    action: { type: String },
    details: { type: mongoose.Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Get or create User model
let User;
try {
  User = mongoose.models.User || mongoose.model("User", UserSchema);
} catch (e) {
  User = mongoose.model("User", UserSchema);
}

// Connect to MongoDB
async function connectDB() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    const opts = {
      bufferCommands: false,
    };
    await mongoose.connect(mongoUri, opts);
    console.log('✅ Terhubung ke MongoDB');
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error.message);
    if (error.message.includes('MONGODB_URI')) {
      console.error('\n💡 Tips:');
      console.error('   1. Buat file .env.local atau .env di root project');
      console.error('   2. Tambahkan: MONGODB_URI=mongodb://localhost:27017/nama-database');
      console.error('   3. Atau: MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db\n');
    }
    process.exit(1);
  }
}

// Generate NIS (format: tahun + nomor urut 3 digit)
function generateNIS(index) {
  const year = new Date().getFullYear();
  const number = String(index).padStart(3, '0');
  return `${year}${number}`;
}

// Create students
async function createStudents() {
  try {
    await connectDB();

    const students = [];
    const defaultPassword = 'siswa123'; // Password default untuk semua siswa
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    console.log('\n📝 Membuat 20 siswa...\n');

    for (let i = 1; i <= 20; i++) {
      const nis = generateNIS(i);
      const studentData = {
        nama: `Siswa ${i}`,
        email: `siswa${i}@example.com`,
        password_hash: passwordHash,
        role: 'siswa',
        nis: nis,
      };

      // Cek apakah siswa sudah ada
      const existing = await User.findOne({ 
        $or: [
          { email: studentData.email },
          { nis: studentData.nis }
        ]
      });

      if (existing) {
        console.log(`⚠️  Siswa ${i} (${studentData.email}) sudah ada, dilewati`);
        continue;
      }

      const student = await User.create(studentData);
      students.push(student);
      console.log(`✅ Siswa ${i} berhasil dibuat:`);
      console.log(`   Nama: ${student.nama}`);
      console.log(`   Email: ${student.email}`);
      console.log(`   NIS: ${student.nis}`);
      console.log(`   Password: ${defaultPassword}`);
      console.log('');
    }

    console.log(`\n✨ Selesai! Total ${students.length} siswa berhasil dibuat.\n`);
    console.log('📋 Ringkasan:');
    console.log(`   - Total siswa dibuat: ${students.length}`);
    console.log(`   - Password default: ${defaultPassword}`);
    console.log(`   - Format email: siswa1@example.com - siswa20@example.com`);
    console.log(`   - Format NIS: ${generateNIS(1)} - ${generateNIS(20)}`);
    console.log('\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating students:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Koneksi database ditutup');
  }
}

// Run script
createStudents();


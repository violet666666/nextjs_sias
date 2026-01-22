import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import connectDB from "@/lib/db";
import Submission from "@/lib/models/Submission";
import Orangtua from "@/lib/models/Orangtua";

// Perbaikan 1: Mengubah signature fungsi untuk menerima { params }
export async function GET(request, { params }) {
    try {
        // Ambil token dari header Authorization
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        const decoded = await verifyToken(token);
        if (!decoded) {
            return new NextResponse(JSON.stringify({ message: "Not authorized" }), { status: 401 });
        }

        await connectDB();
        // Next.js 16: params is a Promise, must await before destructuring
        const { id } = await params;
        const currentUser = decoded;

        // Perbaikan 2: Menambahkan logika otorisasi untuk role 'orangtua'
        if (currentUser.role === 'orangtua') {
            // Cari data orang tua berdasarkan user_id yang sedang login
            const parentData = await Orangtua.findOne({ user_id: currentUser.id, siswa_id: id });

            // Jika orang tua tidak terdaftar atau tidak memiliki anak dengan ID tersebut, tolak akses
            if (!parentData) {
                return new NextResponse(JSON.stringify({ message: "Forbidden: You are not authorized to view this student's grades." }), { status: 403 });
            }
        }
        // Jika user adalah admin, guru, atau orang tua yang sudah terverifikasi, lanjutkan proses

        const grades = await Submission.find({ siswa_id: id })
            .populate({
                path: 'tugas_id',
                select: 'judul kelas_id mapel_id',
                populate: [
                    { path: 'kelas_id', select: 'nama_kelas' },
                    { path: 'mapel_id', select: 'nama_mapel nama' }
                ]
            })
            .populate({ path: 'siswa_id', select: 'nama' });

        return NextResponse.json(grades, { status: 200 });

    } catch (error) {
        console.error("Error fetching grades:", error);
        return new NextResponse(JSON.stringify({ message: "Server error", error: error.message }), { status: 500 });
    }
}

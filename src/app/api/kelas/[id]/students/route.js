import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Kelas from '@/lib/models/Kelas';
import User from '@/lib/models/userModel'; // Ensure User is imported
import { authenticateAndAuthorize } from '@/lib/authMiddleware';

export async function GET(request, { params }) {
    try {
        const authResult = await authenticateAndAuthorize(request, ['admin', 'guru']);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        await connectDB();
        const { id } = await params; // await params in Next.js 15

        const kelas = await Kelas.findById(id).populate('siswa_ids', 'nama nisn email mobile');
        if (!kelas) {
            return NextResponse.json({ error: "Kelas not found" }, { status: 404 });
        }

        return NextResponse.json(kelas.siswa_ids);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

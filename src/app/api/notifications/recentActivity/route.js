import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { authenticateAndAuthorize } from '@/lib/authMiddleware';
import User from '@/lib/models/userModel';
import Kelas from '@/lib/models/Kelas';
import Tugas from '@/lib/models/Tugas';
import Submission from '@/lib/models/Submission';
import Kehadiran from '@/lib/models/Kehadiran';
import Orangtua from '@/lib/models/Orangtua';

// Helper to format activity messages
const formatActivityMessage = (type, data) => {
    const messages = {
        // Admin activities
        user_created: `👤 ${data.nama} (${data.role}) bergabung sebagai pengguna baru`,
        class_created: `📚 Kelas ${data.nama_kelas} berhasil dibuat`,
        assignment_created: `📝 Tugas baru "${data.judul}" telah ditambahkan`,

        // Guru activities  
        submission_received: `📥 ${data.siswa_nama} mengumpulkan tugas "${data.tugas_judul}"`,
        pending_grading: `⏳ ${data.count} tugas menunggu penilaian`,
        student_absent: `⚠️ ${data.siswa_nama} tidak hadir di ${data.mapel_nama}`,

        // Siswa activities
        new_assignment: `📝 Tugas baru: "${data.judul}" - Deadline: ${data.deadline}`,
        grade_received: `🎓 Nilai ${data.tugas_judul}: ${data.nilai}`,
        deadline_soon: `⏰ Deadline "${data.judul}" tinggal ${data.days_left} hari lagi`,

        // Orangtua activities
        child_grade: `📊 ${data.child_nama} mendapat nilai ${data.nilai} di ${data.tugas_judul}`,
        child_attendance: `${data.status === 'Hadir' ? '✅' : '❌'} ${data.child_nama} ${data.status.toLowerCase()} di ${data.mapel_nama}`,
    };
    return messages[type] || data.message || 'Aktivitas terbaru';
};

// GET: Fetch recent activities based on user role
export async function GET(request) {
    try {
        const authResult = await authenticateAndAuthorize(request, ['admin', 'guru', 'siswa', 'orangtua']);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { role, id: userId } = authResult.user;
        await connectDB();

        let activities = [];
        const limit = 5;

        if (role === 'admin') {
            // Admin: Recent users, classes, assignments
            const [recentUsers, recentClasses, recentAssignments] = await Promise.all([
                User.find().sort({ createdAt: -1 }).limit(3).select('nama role createdAt').lean(),
                Kelas.find().sort({ createdAt: -1 }).limit(2).select('nama_kelas createdAt').lean(),
                Tugas.find().sort({ createdAt: -1 }).limit(2).select('judul createdAt').lean(),
            ]);

            recentUsers.forEach(u => activities.push({
                type: 'user_created',
                message: formatActivityMessage('user_created', u),
                timestamp: u.createdAt,
                icon: 'user'
            }));
            recentClasses.forEach(c => activities.push({
                type: 'class_created',
                message: formatActivityMessage('class_created', c),
                timestamp: c.createdAt,
                icon: 'book'
            }));
            recentAssignments.forEach(t => activities.push({
                type: 'assignment_created',
                message: formatActivityMessage('assignment_created', t),
                timestamp: t.createdAt,
                icon: 'file'
            }));

        } else if (role === 'guru') {
            // Guru: Submissions, pending grading
            const recentSubmissions = await Submission.find({ status: 'submitted' })
                .sort({ tanggal_kumpul: -1 })
                .limit(limit)
                .populate('siswa_id', 'nama')
                .populate('tugas_id', 'judul guru_id')
                .lean();

            // Filter submissions for this teacher's assignments
            const mySubmissions = recentSubmissions.filter(s =>
                s.tugas_id?.guru_id?.toString() === userId?.toString()
            );

            mySubmissions.forEach(s => {
                if (s.siswa_id && s.tugas_id) {
                    activities.push({
                        type: 'submission_received',
                        message: formatActivityMessage('submission_received', {
                            siswa_nama: s.siswa_id.nama,
                            tugas_judul: s.tugas_id.judul
                        }),
                        timestamp: s.tanggal_kumpul || s.createdAt,
                        icon: 'inbox'
                    });
                }
            });

            // Add pending grading count
            const pendingCount = await Submission.countDocuments({
                nilai: { $exists: false },
                'tugas_id.guru_id': userId
            });
            if (pendingCount > 0) {
                activities.push({
                    type: 'pending_grading',
                    message: formatActivityMessage('pending_grading', { count: pendingCount }),
                    timestamp: new Date(),
                    icon: 'clock'
                });
            }

        } else if (role === 'siswa') {
            // Siswa: New assignments, grades received, upcoming deadlines
            const Enrollment = (await import('@/lib/models/Enrollment')).default;
            const enrollments = await Enrollment.find({ siswa_id: userId }).select('kelas_id').lean();
            const classIds = enrollments.map(e => e.kelas_id);

            const [newAssignments, myGrades, upcomingDeadlines] = await Promise.all([
                Tugas.find({ kelas_id: { $in: classIds } })
                    .sort({ createdAt: -1 })
                    .limit(2)
                    .select('judul tanggal_deadline createdAt')
                    .lean(),
                Submission.find({ siswa_id: userId, nilai: { $exists: true } })
                    .sort({ updatedAt: -1 })
                    .limit(2)
                    .populate('tugas_id', 'judul')
                    .lean(),
                Tugas.find({
                    kelas_id: { $in: classIds },
                    tanggal_deadline: { $gt: new Date(), $lt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) }
                })
                    .sort({ tanggal_deadline: 1 })
                    .limit(2)
                    .select('judul tanggal_deadline')
                    .lean()
            ]);

            newAssignments.forEach(t => activities.push({
                type: 'new_assignment',
                message: formatActivityMessage('new_assignment', {
                    judul: t.judul,
                    deadline: new Date(t.tanggal_deadline).toLocaleDateString('id-ID')
                }),
                timestamp: t.createdAt,
                icon: 'file-text'
            }));

            myGrades.forEach(g => {
                if (g.tugas_id) {
                    activities.push({
                        type: 'grade_received',
                        message: formatActivityMessage('grade_received', {
                            tugas_judul: g.tugas_id.judul,
                            nilai: g.nilai
                        }),
                        timestamp: g.updatedAt,
                        icon: 'award'
                    });
                }
            });

            upcomingDeadlines.forEach(t => {
                const daysLeft = Math.ceil((new Date(t.tanggal_deadline) - new Date()) / (1000 * 60 * 60 * 24));
                activities.push({
                    type: 'deadline_soon',
                    message: formatActivityMessage('deadline_soon', {
                        judul: t.judul,
                        days_left: daysLeft
                    }),
                    timestamp: t.tanggal_deadline,
                    icon: 'clock'
                });
            });

        } else if (role === 'orangtua') {
            // Orangtua: Child grades, attendance
            const orangtua = await Orangtua.findOne({ user_id: userId }).lean();
            if (orangtua && orangtua.siswa_ids?.length > 0) {
                const [childGrades, childAttendance] = await Promise.all([
                    Submission.find({ siswa_id: { $in: orangtua.siswa_ids }, nilai: { $exists: true } })
                        .sort({ updatedAt: -1 })
                        .limit(3)
                        .populate('siswa_id', 'nama')
                        .populate('tugas_id', 'judul')
                        .lean(),
                    Kehadiran.find({ siswa_id: { $in: orangtua.siswa_ids } })
                        .sort({ tanggal: -1 })
                        .limit(3)
                        .populate('siswa_id', 'nama')
                        .populate('mapel_id', 'nama_pelajaran')
                        .lean()
                ]);

                childGrades.forEach(g => {
                    if (g.siswa_id && g.tugas_id) {
                        activities.push({
                            type: 'child_grade',
                            message: formatActivityMessage('child_grade', {
                                child_nama: g.siswa_id.nama,
                                nilai: g.nilai,
                                tugas_judul: g.tugas_id.judul
                            }),
                            timestamp: g.updatedAt,
                            icon: 'award'
                        });
                    }
                });

                childAttendance.forEach(a => {
                    if (a.siswa_id && a.mapel_id) {
                        activities.push({
                            type: 'child_attendance',
                            message: formatActivityMessage('child_attendance', {
                                child_nama: a.siswa_id.nama,
                                status: a.status,
                                mapel_nama: a.mapel_id.nama_pelajaran
                            }),
                            timestamp: a.tanggal,
                            icon: a.status === 'Hadir' ? 'check-circle' : 'x-circle'
                        });
                    }
                });
            }
        }

        // Sort by timestamp and limit
        activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        activities = activities.slice(0, limit);

        return NextResponse.json({
            success: true,
            activities,
            count: activities.length
        });

    } catch (error) {
        console.error('Recent activity error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

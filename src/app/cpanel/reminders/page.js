            "use client";
            import { useEffect, useState } from "react";
            import { useRouter } from "next/navigation";
            import { fetchWithAuth } from "@/lib/fetchWithAuth";
            import LoadingSpinner from "@/components/common/LoadingSpinner";
            import Link from "next/link";
            
import UnderDevelopment from "@/components/UnderDevelopment";

export default function RemindersPage() {
              const [user, setUser] = useState(null);
              const [upcomingTasks, setUpcomingTasks] = useState([]);
              const [activeSessions, setActiveSessions] = useState([]);
              const [latestBuletins, setLatestBuletins] = useState([]);
              const [loading, setLoading] = useState(true);
              const [error, setError] = useState("");
              const router = useRouter();
            
              useEffect(() => {
                const storedUser = localStorage.getItem("user");
                if (storedUser) {
                  setUser(JSON.parse(storedUser));
                } else {
                  router.push("/login");
                }
              }, [router]);
            
              useEffect(() => {
                if (!user) return;
            
                async function fetchReminders() {
                  setLoading(true);
                  setError("");
                  try {
                    const today = new Date();
                    const nextWeek = new Date(today);
                    nextWeek.setDate(today.getDate() + 7);

                    let tugasApiUrl = "/api/tugas";
                    if (user.role === 'siswa') {
                        const enrollRes = await fetchWithAuth(`/api/enrollments?siswa_id=${user.id}`);
                        if (enrollRes.ok) {
                            const enrollments = await enrollRes.json();
                            const kelasIds = Array.isArray(enrollments) ? enrollments.map(e => e.kelas_id?._id || e.kelas_id).filter(Boolean) : [];
                            if (kelasIds.length > 0) {
                                tugasApiUrl = `/api/tugas?kelas_ids=${kelasIds.join(',')}`;
                            } else {
                                // Jika siswa tidak terdaftar di kelas manapun, tidak perlu fetch tugas
                                setUpcomingTasks([]); // Set tugas kosong
                                // Lanjutkan fetch yang lain
                            }
                        }
                    }
            
                    const [tasksRes, sessionsRes, buletinsRes] = await Promise.all([
                      user.role === 'siswa' && !tugasApiUrl.includes("kelas_ids=") ? Promise.resolve({ ok: true, json: async () => [] }) : fetchWithAuth(tugasApiUrl), // Hindari fetch jika tidak ada kelas_ids untuk siswa
                      fetchWithAuth(`/api/attendance-sessions?status=open`),
                      fetch("/api/buletin") // Asumsi buletin publik
                    ]);
            
                    if (!tasksRes.ok) throw new Error("Gagal mengambil data tugas");
                    const allTasks = await tasksRes.json();
                    const relevantTasks = Array.isArray(allTasks) ? allTasks : [];
                    const filteredTasks = relevantTasks.filter(task => new Date(task.tanggal_deadline) >= today && new Date(task.tanggal_deadline) <= nextWeek);
                    setUpcomingTasks(filteredTasks);
            
                    if (!sessionsRes.ok) throw new Error("Gagal mengambil sesi absensi aktif");
                    const activeSessionsData = await sessionsRes.json();
                    setActiveSessions(Array.isArray(activeSessionsData) ? activeSessionsData : []);
            
                    if (!buletinsRes.ok) throw new Error("Gagal mengambil buletin");
                    const allBuletins = await buletinsRes.json();
                    setLatestBuletins(Array.isArray(allBuletins) ? allBuletins.slice(0, 3) : []); // Ambil 3 terbaru
            
                  } catch (err) {
                    setError(err.message);
                  } finally {
                    setLoading(false);
                  }
                }
                fetchReminders();
              }, [user]);
            
              if (loading) return <LoadingSpinner />;
              if (error) return <div className="p-6 text-red-500">Error: {error}</div>;
            
              return (
                <div className="p-6 text-black">
                  <h1 className="text-2xl font-bold mb-6">Pengingat</h1>
            
                  <section className="mb-8">
                    <h2 className="text-xl font-semibold mb-3 text-gray-700">Tugas Mendatang (7 Hari ke Depan)</h2>
                    {upcomingTasks.length === 0 ? <p className="text-gray-500">Tidak ada tugas mendatang.</p> : (
                      <ul className="space-y-3">
                        {upcomingTasks.map(task => (
                          <li key={task._id} className="p-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                            <span className="font-medium text-blue-600">{task.judul}</span> ({task.kelas_id?.nama_kelas || 'N/A'})
                            <br />
                            <span className="text-sm text-gray-600">Deadline: {new Date(task.tanggal_deadline).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })} - {new Date(task.tanggal_deadline).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
            
                  <section className="mb-8">
                    <h2 className="text-xl font-semibold mb-3 text-gray-700">Sesi Absensi Aktif</h2>
                    {activeSessions.length === 0 ? <p className="text-gray-500">Tidak ada sesi absensi aktif.</p> : (
                      <ul className="space-y-3">
                        {activeSessions.map(session => (
                          <li key={session._id} className="p-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                            <span className="font-medium text-green-600">{session.judul_pertemuan}</span> ({session.kelas_id?.nama_kelas || 'N/A'})
                            <br />
                            <span className="text-sm text-gray-600">Berakhir pada: {new Date(session.waktu_selesai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
            
                  <section>
                    <h2 className="text-xl font-semibold mb-3 text-gray-700">Buletin Terbaru</h2>
                    {latestBuletins.length === 0 ? <p className="text-gray-500">Tidak ada buletin terbaru.</p> : (
                      <ul className="space-y-3">
                        {latestBuletins.map(b => (<li key={b._id} className="p-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow"><Link href="/cpanel/bulletin" className="font-medium text-indigo-600 hover:underline">{b.judul}</Link> - <span className="text-sm text-gray-500">{new Date(b.tanggal).toLocaleDateString('id-ID')}</span></li>))}
                      </ul>
                    )}
                  </section>
                </div>
              );
}

            "use client";
            import { useEffect, useState } from "react";
            import { useRouter } from "next/navigation";
            import { fetchWithAuth } from "@/lib/fetchWithAuth";
            import LoadingSpinner from "@/components/common/LoadingSpinner";
            
import UnderDevelopment from "@/components/UnderDevelopment";

export default function AchievementsPage() {
              const [user, setUser] = useState(null);
              const [achievements, setAchievements] = useState({
                averageScore: null,
                attendanceRate: null,
                tasksCompleted: 0,
              });
              const [loading, setLoading] = useState(true);
              const [error, setError] = useState("");
              const router = useRouter();
            
              useEffect(() => {
                const storedUser = localStorage.getItem("user");
                if (storedUser) {
                  const parsedUser = JSON.parse(storedUser);
                  setUser(parsedUser);
                  if (parsedUser.role === "siswa") {
                    fetchStudentAchievements(parsedUser.id);
                  } else {
                    // Untuk admin/guru, bisa tampilkan pesan atau data agregat lain
                    setLoading(false);
                  }
                } else {
                  router.push("/login");
                }
              }, [router]);
            
              const fetchStudentAchievements = async (siswaId) => {
                setLoading(true);
                setError("");
                try {
                  const [submissionsRes, kehadiranRes] = await Promise.all([
                    fetchWithAuth(`/api/submissions?siswa_id=${siswaId}`),
                    fetchWithAuth(`/api/kehadiran?siswa_id=${siswaId}`),
                  ]);
            
                  if (!submissionsRes.ok) throw new Error("Gagal mengambil data submission");
                  if (!kehadiranRes.ok) throw new Error("Gagal mengambil data kehadiran");
            
                  const submissionsData = await submissionsRes.json();
                  const validSubmissions = Array.isArray(submissionsData) ? submissionsData : [];

                  const kehadiranData = await kehadiranRes.json();
                  const validKehadiran = Array.isArray(kehadiranData) ? kehadiranData : [];
            
                  let totalScore = 0;
                  let gradedTasks = 0;
                  validSubmissions.forEach(sub => {
                    if (sub.nilai !== null && sub.nilai !== undefined) {
                      totalScore += sub.nilai;
                      gradedTasks++;
                    }
                  });
                  const averageScore = gradedTasks > 0 ? (totalScore / gradedTasks) : null;
            
                  const hadirCount = validKehadiran.filter(k => k.status === "Hadir").length;
                  const attendanceRate = validKehadiran.length > 0 ? ((hadirCount / validKehadiran.length) * 100) : null;
            
                  setAchievements({
                    averageScore,
                    attendanceRate,
                    tasksCompleted: submissionsData.length,
                  });
            
                } catch (err) {
                  setError(err.message);
                } finally {
                  setLoading(false);
                }
              };
            
              if (loading) return <LoadingSpinner />;
              if (error) return <div className="p-6 text-red-500">Error: {error}</div>;
            
              if (user && user.role === "siswa") {
                return (
                  <div className="p-6 text-black">
                    <h1 className="text-2xl font-bold mb-6">Pencapaian Saya</h1>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white p-6 rounded-lg shadow-md text-center">
                        <h2 className="text-lg font-semibold">Rata-rata Nilai</h2>
                        <p className="text-4xl font-bold text-blue-600 mt-2">{achievements.averageScore !== null ? achievements.averageScore.toFixed(2) : "N/A"}</p>
                      </div>
                      <div className="bg-white p-6 rounded-lg shadow-md text-center">
                        <h2 className="text-lg font-semibold">Persentase Kehadiran</h2>
                        <p className="text-4xl font-bold text-green-600 mt-2">{achievements.attendanceRate !== null ? `${achievements.attendanceRate.toFixed(1)}%` : "N/A"}</p>
                      </div>
                      <div className="bg-white p-6 rounded-lg shadow-md text-center">
                        <h2 className="text-lg font-semibold">Tugas Dikumpulkan</h2>
                        <p className="text-3xl font-bold text-purple-600">{achievements.tasksCompleted}</p>
                      </div>
                    </div>
                  </div>
                );
              }
            
              // Tampilan untuk role lain atau jika tidak ada data siswa
              return <UnderDevelopment />;
}

"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Toast from "@/components/common/Toast";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import GuruAttendanceView from "@/components/cpanel-components/attendance/GuruAttendanceView";
import SiswaAttendanceView from "@/components/cpanel-components/attendance/SiswaAttendanceView";
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import ProtectedRoute from '@/components/common/ProtectedRoute';

const TABS = [
  { key: "absensi", label: "Absensi" },
];

const STATUS_OPTIONS = ["Hadir", "Izin", "Sakit", "Alfa"];

export default function AttendancePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [activeTab, setActiveTab] = useState("absensi");
  const [settings, setSettings] = useState({
    defaultStatus: "Hadir",
    emailReminder: false,
  });
  const [attendance, setAttendance] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/cpanel/dashboard");
    } else {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setLoading(false);
    }
  }, [router]);

  // Handle hash navigation
  useEffect(() => {
    const updateTabFromHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (TABS.some(t => t.key === hash)) setActiveTab(hash);
    };
    updateTabFromHash();
    window.addEventListener("hashchange", updateTabFromHash);
    return () => window.removeEventListener("hashchange", updateTabFromHash);
  }, []);

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("attendance_settings");
    if (saved) setSettings(JSON.parse(saved));
  }, []);

  const handleTabClick = (key) => {
    setActiveTab(key);
    window.location.hash = key;
  };

  const handleSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((s) => ({ ...s, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    localStorage.setItem("attendance_settings", JSON.stringify(settings));
    setToast({ message: "Pengaturan absensi berhasil disimpan!", type: "success" });
  };

  const fetchAttendance = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchWithAuth('/api/kehadiran');
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setAttendance(Array.isArray(data) ? data : []);
    } catch (e) {
      setError('Gagal memuat data kehadiran.');
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !user) return <LoadingSpinner />;

  return (
    <ProtectedRoute requiredRoles={['admin','guru','siswa','orangtua']}>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "" })} />
      <div className="max-w-7xl w-full mx-auto mt-6 px-4 sm:px-6 lg:px-8">
        <div className="flex gap-2 mb-6 border-b">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => handleTabClick(tab.key)}
              className={`px-6 py-2 font-semibold border-b-2 transition-all duration-150 ${activeTab === tab.key ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-blue-600"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {activeTab === "absensi" && (
          <div className="w-full">
            {(user.role === "guru" || user.role === "admin") && <GuruAttendanceView user={user} setToast={setToast} />}
            {user.role === "siswa" && <SiswaAttendanceView user={user} setToast={setToast} />}
            {user.role !== "guru" && user.role !== "siswa" && user.role !== "admin" && (
              <div className="p-6 text-black">
                <div className="text-center text-gray-500">Fitur absensi tidak tersedia untuk peran Anda.</div>
              </div>
            )}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

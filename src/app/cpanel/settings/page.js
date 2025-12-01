'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      router.push("/login");
      return;
    }
    const u = JSON.parse(stored);
    setUser(u);
    // Check if user is admin
    if (u.role !== "admin") {
      router.push("/cpanel/dashboard");
      return;
    }
    setLoading(false);
  }, [router]);

  if (loading) return <LoadingSpinner />;

  return (
    <ProtectedRoute requiredRoles={['admin']}>
      <div className="max-w-3xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-gray-100">Pengaturan Sistem</h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 border border-gray-200 dark:border-gray-700">
          <p className="text-lg text-gray-700 dark:text-gray-200 mb-4">Halaman pengaturan sistem (admin only).</p>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Pengaturan Sistem</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Fitur pengaturan sistem akan segera tersedia. Anda dapat mengelola konfigurasi sistem dari halaman ini.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 
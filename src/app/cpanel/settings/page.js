'use client';
import ProtectedRoute from '@/components/common/ProtectedRoute';

export default function SettingsPage() {
  return (
    <ProtectedRoute requiredRoles={['admin']}>
      <div className="max-w-3xl mx-auto py-12">
        <h1 className="text-3xl font-bold mb-4">Pengaturan Sistem</h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 border border-gray-200 dark:border-gray-700">
          <p className="text-lg text-gray-700 dark:text-gray-200">Halaman pengaturan sistem (admin only).</p>
        </div>
      </div>
    </ProtectedRoute>
  );
} 
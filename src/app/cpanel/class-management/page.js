"use client";
import ProtectedRoute from '@/components/common/ProtectedRoute';

export default function ClassManagementPage() {
  return (
    <ProtectedRoute requiredRoles={['admin']}>
      <div className="max-w-3xl mx-auto py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Manajemen Kelas</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Halaman untuk manajemen kelas. Fitur akan segera hadir.
        </p>
      </div>
    </ProtectedRoute>
  );
} 
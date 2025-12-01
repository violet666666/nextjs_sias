'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ResponsiveLayout from '@/components/layout/ResponsiveLayout';
import FileManager from '@/components/files/FileManager';
import { useAuth } from '@/lib/auth';
import { SkeletonCard } from '@/components/ui/Skeleton';

export default function FilesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const sidebarItems = [
    { name: 'Dashboard', href: '/cpanel/dashboard', icon: Home },
    { name: 'Classes', href: '/cpanel/kelas', icon: BookOpen },
    { name: 'Tasks', href: '/cpanel/tugas', icon: FileText },
    { name: 'Calendar', href: '/cpanel/calendar', icon: Calendar },
    { name: 'Chat', href: '/cpanel/chat', icon: MessageSquare },
    { name: 'Files', href: '/cpanel/files', icon: Folder },
  ];

  if (loading) {
    return (
      <ResponsiveLayout user={user} sidebarItems={sidebarItems}>
        <div className="space-y-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </ResponsiveLayout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <ResponsiveLayout user={user} sidebarItems={sidebarItems}>
      <FileManager user={user} role={user.role} />
    </ResponsiveLayout>
  );
}

// Import icons
import { 
  Home, 
  BookOpen, 
  FileText, 
  Calendar, 
  MessageSquare, 
  Folder
} from 'lucide-react'; 
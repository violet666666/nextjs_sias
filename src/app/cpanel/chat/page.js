'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ResponsiveLayout from '@/components/layout/ResponsiveLayout';
import ChatContainer, { ChatProvider } from '@/components/chat/ChatSystem';
import { useAuth } from '@/lib/auth';
import { SkeletonCard } from '@/components/ui/Skeleton';

export default function ChatPage() {
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Real-time Chat
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Communicate with teachers, students, and parents
            </p>
          </div>
        </div>
        <ChatProvider user={user}>
          <ChatContainer />
        </ChatProvider>
      </div>
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
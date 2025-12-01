"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/cpanel-components/Sidebar";
import CpanelNavbar from "@/components/cpanel-components/CpanelNavbar";
import { AuthProvider } from '@/lib/AuthContext';

export default function CpanelLayout({ children }) {
  const [roleId, setRoleId] = useState(1);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      let id = 1;
      if (user.role === "admin") id = 4;
      else if (user.role === "guru") id = 2;
      else if (user.role === "orangtua") id = 3;
      else id = 1;
      setRoleId(id);
    }
  }, []);

  return (
    <AuthProvider>
      <div className="flex min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
        <Sidebar roleId={roleId} />
        <div className="flex flex-col flex-1 lg:ml-64">
          <CpanelNavbar />
          <main className="flex-1 p-6 bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
            {children}
          </main>
        </div>
      </div>
    </AuthProvider>
  );
}

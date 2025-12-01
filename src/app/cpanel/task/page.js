"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/common/LoadingSpinner";

export default function TaskPage() {
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      router.push("/login");
      return;
    }
    const u = JSON.parse(stored);
    // Redirect admin and guru to task-management, siswa to tasks
    if (u.role === "admin" || u.role === "guru") {
      router.push("/cpanel/task-management");
    } else if (u.role === "siswa") {
      router.push("/cpanel/tasks");
    } else {
      router.push("/cpanel/dashboard");
    }
  }, [router]);

  return <LoadingSpinner />;
}


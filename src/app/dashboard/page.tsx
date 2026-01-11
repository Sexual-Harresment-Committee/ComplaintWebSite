"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && role) {
      if (role === 'action_taker') router.replace('/dashboard/action-taker');
      else if (role === 'committee') router.replace('/dashboard/committee');
      else if (role === 'admin') router.replace('/dashboard/committee'); // Admin sees committee view by default
      else {
        // Unknown role or user not setup
        // router.replace('/');
      }
    }
  }, [role, loading, router]);

  return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="animate-spin text-neutral-400" />
      <span className="ml-2 text-neutral-400">Redirecting...</span>
    </div>
  );
}


"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/admin/login");
      } else if (userData?.role !== "admin") {
         // Redirect non-admins or show 403
         router.replace("/admin/login"); 
      } else {
        setAuthorized(true);
      }
    }
  }, [user, userData, loading, router]);

  if (loading || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A1116] text-white">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A1116]">
       {children}
    </div>
  );
}

"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2, LogOut, LayoutDashboard, ShieldAlert } from "lucide-react";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UserRole } from "@/types";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/admin/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex flex-col md:flex-row">
      {/* Sidebar / Topbar */}
      <aside className={`w-full ${userData?.role === 'action_taker' ? 'md:w-52' : 'md:w-64'} bg-white dark:bg-neutral-950 border-b md:border-b-0 md:border-r border-neutral-200 dark:border-neutral-800 p-4 flex flex-col justify-between transition-all duration-300`}>
        <div>
           <div className="mb-8 flex items-center space-x-2 px-2">
             <ShieldAlert className="w-6 h-6" />
             <span className="font-bold text-lg">Committee<br/>Dashboard</span>
           </div>
           
           <nav className="space-y-1">
             <NavItem href="/dashboard" label="Overview" icon={<LayoutDashboard size={18}/>} />
             
             {userData?.role === 'action_taker' && (
                <NavItem href="/dashboard/action-taker" label="My Tasks (Action Taker)" active />
             )}
             {userData?.role === 'committee' && (
                <NavItem href="/dashboard/committee" label="Committee View" active />
             )}
              {userData?.role === 'admin' && (
                <>
                <NavItem href="/dashboard/action-taker" label="Action Taker View" />
                <NavItem href="/dashboard/committee" label="Committee View" />
                </>
             )}
           </nav>
        </div>

        <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
          <div className="mb-4 px-2 text-xs text-neutral-500">
             Logged in as:<br/>
             <strong className="text-neutral-900 dark:text-neutral-100">{user.email}</strong>
             <br/>
             Role: <span className="uppercase">{userData?.role || 'Unknown'}</span>
          </div>
          <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => auth.signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
         {children}
      </main>
    </div>
  );
}

function NavItem({ href, label, icon, active = false }: { href: string; label: string; icon?: React.ReactNode; active?: boolean }) {
  return (
    <Link href={href}>
      <div className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${active ? 'bg-neutral-100 dark:bg-neutral-800 font-medium' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900'}`}>
        {icon}
        <span>{label}</span>
      </div>
    </Link>
  )
}

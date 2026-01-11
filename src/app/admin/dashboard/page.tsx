
"use client";

import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function AdminDashboard() {
    const { userData } = useAuth();

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 text-white">
            <div className="flex bg-black/40 border border-white/10 p-6 rounded-xl backdrop-blur-sm justify-between items-center">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <ShieldAlert className="text-red-500" />
                        Admin Complaint Center
                    </h1>
                    <p className="text-gray-400">Welcome, {userData?.name}. You have full oversight of all complaints.</p>
                </div>
            </div>

            <div className="border border-white/10 rounded-xl p-12 text-center bg-black/20 text-gray-400">
                <p>Complaint Management Features Coming Soon...</p>
                <div className="mt-4 flex justify-center gap-4">
                     <Button variant="outline" className="border-white/10 text-white">View All Complaints</Button>
                     <Button variant="outline" className="border-white/10 text-white">Generate Reports</Button>
                </div>
            </div>
        </div>
    );
}

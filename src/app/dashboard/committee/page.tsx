"use client";

import { useEffect, useState } from "react";
import { collection, query, onSnapshot, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Complaint } from "@/types";
import { DataTable } from "../action-taker/data-table"; // Resuse table
import { columns } from "../action-taker/columns"; // Reuse columns, maybe hide actions later if strictly read-only
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { BarChart3, AlertCircle, CheckCircle2 } from "lucide-react";

export default function CommitteeDashboard() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState({
      total: 0,
      open: 0,
      resolved: 0,
      critical: 0
  });

  useEffect(() => {
    if (!user) return;

    // Committee sees ALL
    const q = query(collection(db, "complaints"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as Complaint);
      setComplaints(data);
      
      // Calculate Stats
      const total = data.length;
      const open = data.filter(c => ['Submitted', 'Under Review', 'Investigation'].includes(c.status)).length;
      const resolved = data.filter(c => ['Resolved', 'Dismissed'].includes(c.status)).length;
      const critical = data.filter(c => c.severity === 'Critical' || c.severity === 'High').length;
      
      setStats({ total, open, resolved, critical });
    });

    return () => unsubscribe();
  }, [user]);

  // Adjust columns for Read Only if needed. For now, reusing is fine, but Actions menu "Edit" doesn't exist there anyway.
  // We might want to remove the "Actions" column or just disable the edit triggers.
  // The 'columns' imported currently has "Copy ID" and "View Details". View Details is harmless.
  // We will keep it.
  
  return (
    <div className="space-y-6">
       <div>
         <h1 className="text-2xl font-bold tracking-tight">Committee Dashboard</h1>
         <p className="text-neutral-500">Overview and monitoring of all complaints.</p>
       </div>

       <div className="grid gap-4 md:grid-cols-4">
          <StatCard title="Total Complaints" value={stats.total} icon={<BarChart3 className="h-4 w-4 text-neutral-500" />} />
          <StatCard title="Active Cases" value={stats.open} icon={<AlertCircle className="h-4 w-4 text-blue-500" />} />
          <StatCard title="Resolved" value={stats.resolved} icon={<CheckCircle2 className="h-4 w-4 text-green-500" />} />
          <StatCard title="High Severity" value={stats.critical} icon={<AlertCircle className="h-4 w-4 text-red-500" />} />
       </div>

       <Card>
         <CardHeader>
           <CardTitle>All Records</CardTitle>
         </CardHeader>
         <CardContent>
           <DataTable 
              columns={columns} 
              data={complaints} 
              // onRowClick handler can open details if we want a detailed view here toda
           />
         </CardContent>
       </Card>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: number, icon: any }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {title}
                </CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
            </CardContent>
        </Card>
    )
}

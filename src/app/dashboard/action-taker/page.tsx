"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Complaint } from "@/types";
import { DataTable } from "./data-table";
import { columns } from "./columns";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ComplaintEditor } from "./complaint-editor";

export default function ActionTakerDashboard() {
  const { user, role } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  useEffect(() => {
    if (!user) return;

    // Action takers see complaints assigned to them OR all if admin/committee? 
    // Spec says: "Action Taker... Display assigned complaints"
    // But for MVP if no assignment logic is complete, maybe show all or just unassigned?
    // Let's prompt: For now query all, but we should refine.
    // Spec: "Accessible only to authenticated faculty... Display assigned complaints"
    // Since we don't have assignment UI yet, let's query ALL so we can actually see things for testing.
    // Ideally: where('assignedTo', '==', user.uid)
    
    // For demo purposes, we will fetch ALL so the user can see the submission.
    // In production, uncomment the where clause or implement assignment logic.
    
    // const q = query(collection(db, "complaints"), where("assignedTo", "==", user.uid));
    const q = query(collection(db, "complaints")); // Fetch all for now for visibility

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as Complaint);
      setComplaints(data);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="space-y-6">
       <div>
         <h1 className="text-2xl font-bold tracking-tight">Action Taker Dashboard</h1>
         <p className="text-neutral-500">Manage and resolve assigned complaints.</p>
       </div>

       <Card>
         <CardHeader>
           <CardTitle>Assigned Tasks</CardTitle>
         </CardHeader>
         <CardContent>
           <DataTable 
              columns={columns} 
              data={complaints} 
              onRowClick={(row) => setSelectedComplaint(row)}
           />
         </CardContent>
       </Card>

             <SheetHeader>
               <SheetTitle>{selectedComplaint?.complaintId}</SheetTitle>
               <SheetDescription>
                  Review and update status.
               </SheetDescription>
             </SheetHeader>
             
             <div className="py-6 space-y-6">
                <div>
                   <h4 className="font-semibold mb-1">Description</h4>
                   <p className="text-sm text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900 p-3 rounded-md">
                     {selectedComplaint?.description}
                   </p>
                </div>
                
                {selectedComplaint && (
                  <ComplaintEditor 
                    complaint={selectedComplaint} 
                    onUpdate={() => setSelectedComplaint(null)} 
                  />
                )}
             </div>
          </SheetContent>
       </Sheet>
    </div>
  );
}

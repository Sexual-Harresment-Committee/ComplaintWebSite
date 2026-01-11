"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Complaint } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { hashPasscode } from "@/lib/utils";
import { AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

export default function ComplaintStatus() {
  const { id } = useParams();
  const router = useRouter();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const complaintId = Array.isArray(id) ? id[0] : id;
    if (!complaintId) return;

    // Validate Passcode from Session
    const checkPasscode = async (data: Complaint) => {
        if (data.passcode) {
            const storedPass = sessionStorage.getItem(`passcode_${complaintId}`);
            if (!storedPass) {
                // Redirect to login if no passcode found in session
                router.replace('/track');
                return false;
            }
            const hash = await hashPasscode(storedPass);
            if (hash !== data.passcode) {
                router.replace('/track');
                return false;
            }
        }
        return true;
    };

    const unsubscribe = onSnapshot(doc(db, "complaints", complaintId), async (docSnap) => {
      setLoading(true);
      if (docSnap.exists()) {
        const data = docSnap.data() as Complaint;
        const authorized = await checkPasscode(data);
        if (authorized) {
            setComplaint(data);
            setError(null);
        }
      } else {
        setError("Complaint not found.");
      }
      setLoading(false);
    }, (err) => {
        console.error(err);
        setError("Access denied or invalid ID.");
        setLoading(false);
    });

    return () => unsubscribe();
  }, [id, router]);

  if (loading) {
     return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6 flex flex-col items-center max-w-2xl mx-auto space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-60 w-full" />
        </div>
     )
  }

  if (error || !complaint) {
      return (
          <div className="min-h-screen flex items-center justify-center">
              <Alert variant="destructive" className="max-w-md">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error || "Something went wrong."}</AlertDescription>
                  <div className="pt-4">
                    <Link href="/track"><Button variant="outline" size="sm">Try Again</Button></Link>
                  </div>
              </Alert>
          </div>
      )
  }

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'Submitted': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
          case 'Under Review': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
          case 'Investigation': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
          case 'Resolved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
          case 'Dismissed': return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300';
          default: return 'bg-neutral-100';
      }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 py-12 px-4">
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="mb-4">
                <Link href="/" className="text-sm text-neutral-500 hover:underline">&larr; Back to Home</Link>
            </div>

            <Card className="border-l-4 border-l-blue-500 shadow-sm">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardDescription className="uppercase text-xs font-bold tracking-wider mb-1">Complaint ID</CardDescription>
                            <CardTitle className="text-3xl font-mono">{complaint.complaintId}</CardTitle>
                        </div>
                        <Badge variant="outline" className={`px-4 py-1 border-0 ${getStatusColor(complaint.status)}`}>
                            {complaint.status}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3 text-sm">
                     <div>
                         <span className="text-neutral-500 block">Category</span>
                         <span className="font-medium">{complaint.category}</span>
                     </div>
                     <div>
                         <span className="text-neutral-500 block">Severity</span>
                         <span className="font-medium">{complaint.severity}</span>
                     </div>
                     <div>
                         <span className="text-neutral-500 block">Submitted On</span>
                         <span className="font-medium">
                            {complaint.createdAt ? format(complaint.createdAt.toDate(), "PPP") : "N/A"}
                         </span>
                     </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Public Updates & Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                    {complaint.publicUpdates && complaint.publicUpdates.length > 0 ? (
                        <div className="space-y-6 relative border-l border-neutral-200 dark:border-neutral-800 ml-3">
                            {complaint.publicUpdates.map((update, idx) => (
                                <div key={idx} className="ml-6 relative">
                                    <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-neutral-200 dark:bg-neutral-700 ring-4 ring-white dark:ring-neutral-950"></span>
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1">
                                        <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Update from Committee</span>
                                        <span className="text-xs text-neutral-500">
                                            {format(update.date.toDate(), "PPP p")}
                                        </span>
                                    </div>
                                    <p className="text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900 p-3 rounded-md border border-neutral-100 dark:border-neutral-800">
                                        {update.message}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-neutral-500">
                            <Clock className="w-8 h-8 mx-auto mb-2 opacity-20" />
                            <p>No updates yet. The committee is reviewing your submission.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}

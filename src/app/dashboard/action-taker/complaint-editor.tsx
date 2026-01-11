"use client";

import { useState } from "react";
import { Complaint, ComplaintStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { doc, updateDoc, arrayUnion, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ComplaintEditorProps {
  complaint: Complaint;
  onUpdate: () => void;
}

export function ComplaintEditor({ complaint, onUpdate }: ComplaintEditorProps) {
  const { user } = useAuth();
  const [status, setStatus] = useState<ComplaintStatus>(complaint.status);
  const [loading, setLoading] = useState(false);
  const [publicMsg, setPublicMsg] = useState("");
  const [internalNote, setInternalNote] = useState("");

  async function handleStatusChange() {
    setLoading(true);
    try {
      await updateDoc(doc(db, "complaints", complaint.complaintId), {
        status: status,
        updatedAt: serverTimestamp(),
      });
      
      // Log it
      await addDoc(collection(db, "logs"), {
          complaintId: complaint.complaintId,
          action: "Status Changed",
          performedBy: user?.uid,
          timestamp: serverTimestamp(),
          details: `Changed to ${status}`
      });
      
      toast.success("Status updated");
    } catch (e) {
      console.error(e);
      toast.error("Failed to update status");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddPublicUpdate() {
    if (!publicMsg.trim()) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, "complaints", complaint.complaintId), {
        publicUpdates: arrayUnion({
          message: publicMsg,
          date: new Date()
        })
      });
       setPublicMsg("");
       toast.success("Public update posted");
    } catch (e) {
      console.error(e);
      toast.error("Failed to post update");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddInternalNote() {
     if (!internalNote.trim()) return;
     setLoading(true);
     try {
       // We write to subcollection as decided for security
       await addDoc(collection(db, "complaints", complaint.complaintId, "internalNotes"), {
          note: internalNote,
          authorId: user?.uid,
          date: serverTimestamp()
       });
       setInternalNote("");
       toast.success("Internal note added");
     } catch (e) {
       console.error(e);
       toast.error("Failed to add note");
     } finally {
       setLoading(false);
     }
  }

  return (
    <div className="space-y-6">
       <div className="space-y-2">
         <Label>Current Status</Label>
         <div className="flex space-x-2">
            <Select value={status} onValueChange={(v: ComplaintStatus) => setStatus(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Submitted">Submitted</SelectItem>
                <SelectItem value="Under Review">Under Review</SelectItem>
                <SelectItem value="Investigation">Investigation</SelectItem>
                <SelectItem value="Resolved">Resolved</SelectItem>
                <SelectItem value="Dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleStatusChange} disabled={loading || status === complaint.status}>
              {loading ? <Loader2 className="animate-spin" /> : "Update"}
            </Button>
         </div>
       </div>

       <Tabs defaultValue="public">
         <TabsList className="w-full">
           <TabsTrigger value="public" className="w-1/2">Public Update</TabsTrigger>
           <TabsTrigger value="internal" className="w-1/2">Internal Note</TabsTrigger>
         </TabsList>
         <TabsContent value="public" className="space-y-2">
            <p className="text-xs text-neutral-500">Visible to the complainant on their tracking dashboard.</p>
            <Textarea 
              placeholder="e.g. We have received your complaint and a committee member has been assigned."
              value={publicMsg}
              onChange={e => setPublicMsg(e.target.value)}
            />
            <Button onClick={handleAddPublicUpdate} disabled={loading} className="w-full">Post Public Update</Button>
         </TabsContent>
         <TabsContent value="internal" className="space-y-2">
            <p className="text-xs text-neutral-500">Only visible to committee members. STRICTLY CONFIDENTIAL.</p>
            <Textarea 
              placeholder="Private notes about investigation steps..."
              value={internalNote}
              onChange={e => setInternalNote(e.target.value)}
            />
            <Button onClick={handleAddInternalNote} disabled={loading} variant="secondary" className="w-full">Save Internal Note</Button>
         </TabsContent>
       </Tabs>
    </div>
  )
}

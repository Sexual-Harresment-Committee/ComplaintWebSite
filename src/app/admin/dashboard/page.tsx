
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ShieldAlert, LogOut, Loader2, UserCheck, Search, FileDown, FileText, FileSpreadsheet } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { toast } from "sonner";
import { collection, getDocs, query, where, doc, updateDoc, orderBy } from "firebase/firestore";
import { Complaint, UserProfile } from "@/types";
import { exportToCSV, exportToPDF, exportToXLSX } from "@/lib/export-utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboard() {
    const { userData } = useAuth();
    const router = useRouter();
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [actionTakers, setActionTakers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Assignment State
    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
    const [selectedTaker, setSelectedTaker] = useState<string>("");
    const [isAssignOpen, setIsAssignOpen] = useState(false);
    const [assigning, setAssigning] = useState(false);

    // Export State
    const [isExportOpen, setIsExportOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push('/admin/login');
        } catch (error) {
            toast.error("Logout failed");
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Complaints
            const complaintsSnap = await getDocs(query(collection(db, "complaints"), orderBy("createdAt", "desc")));
            const fetchedComplaints = complaintsSnap.docs.map(doc => ({ ...doc.data(), complaintId: doc.id } as unknown as Complaint));
            
            // 2. Fetch Action Takers
            const takersSnap = await getDocs(query(collection(db, "users"), where("role", "==", "action_taker")));
            const fetchedTakers = takersSnap.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserProfile));

            setComplaints(fetchedComplaints);
            setActionTakers(fetchedTakers);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleExport = (type: 'csv' | 'xlsx' | 'pdf') => {
        try {
            toast.info(`Generating ${type.toUpperCase()}...`);
            if (type === 'csv') exportToCSV(complaints, actionTakers);
            if (type === 'xlsx') exportToXLSX(complaints, actionTakers);
            if (type === 'pdf') exportToPDF(complaints, actionTakers);
            toast.success("Download started");
            setIsExportOpen(false);
        } catch (error) {
            console.error(error);
            toast.error("Export failed");
        }
    };

    const markAsViewed = async (complaint: Complaint) => {
        if (complaint.status !== 'Submitted') return;
        
        try {
            // Optimistic update locally
            const updated = { ...complaint, status: 'Viewed' as const };
            setComplaints(prev => prev.map(c => c.complaintId === complaint.complaintId ? updated : c));
            setSelectedComplaint(updated); 

            // Fire and forget update
            await updateDoc(doc(db, "complaints", complaint.complaintId), {
                status: 'Viewed'
            });
            toast.success("Marked as Viewed");
        } catch (error) {
            console.error("Failed to mark as viewed", error);
        }
    };

    const handleAssign = async () => {
        if (!selectedComplaint || !selectedTaker) return;
        
        setAssigning(true);
        try {
            await updateDoc(doc(db, "complaints", selectedComplaint.complaintId), {
                assignedTo: selectedTaker,
                status: 'Under Review' // Always move to Under Review on assignment
            });
            
            toast.success(`Assigned to ${actionTakers.find(t => t.uid === selectedTaker)?.name}`);
            setIsAssignOpen(false);
            fetchData(); // Refresh list
        } catch (error) {
            console.error(error);
            toast.error("Assignment failed");
        } finally {
            setAssigning(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Submitted': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            case 'Viewed': return 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20';
            case 'Under Review': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'Working': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
            case 'Investigation': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
            case 'Resolved': return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'Dismissed': return 'bg-red-500/10 text-red-500 border-red-500/20';
            default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 text-white">
            {/* Header */}
            <div className="flex bg-black/40 border border-white/10 p-6 rounded-xl backdrop-blur-sm justify-between items-center">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <ShieldAlert className="text-red-500" />
                        Admin Complaint Center
                    </h1>
                    <p className="text-gray-400">Welcome, {(userData as any)?.name}. You have full oversight.</p>
                </div>
                <div className="flex gap-4">
                    <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="border-teal-500/20 text-teal-400 hover:bg-teal-500/10 hover:text-teal-300">
                                <FileDown className="mr-2 h-4 w-4" /> Export Data
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-[#0A1116] border-white/10 text-white sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Export Complaints</DialogTitle>
                                <DialogDescription className="text-gray-400">
                                    Choose a format to download the complaint registry.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-1 gap-4 py-4">
                                <Button variant="outline" className="h-14 justify-start px-4 border-white/10 hover:bg-white/5 hover:text-white" onClick={() => handleExport('xlsx')}>
                                    <FileSpreadsheet className="mr-3 h-5 w-5 text-green-400" />
                                    <div className="text-left">
                                        <div className="font-semibold">Excel Workbook (.xlsx)</div>
                                        <div className="text-xs text-gray-500">Best for analyzing data</div>
                                    </div>
                                </Button>
                                <Button variant="outline" className="h-14 justify-start px-4 border-white/10 hover:bg-white/5 hover:text-white" onClick={() => handleExport('pdf')}>
                                    <FileText className="mr-3 h-5 w-5 text-red-400" />
                                    <div className="text-left">
                                        <div className="font-semibold">PDF Document (.pdf)</div>
                                        <div className="text-xs text-gray-500">Best for printing and sharing</div>
                                    </div>
                                </Button>
                                <Button variant="outline" className="h-14 justify-start px-4 border-white/10 hover:bg-white/5 hover:text-white" onClick={() => handleExport('csv')}>
                                    <FileDown className="mr-3 h-5 w-5 text-blue-400" />
                                    <div className="text-left">
                                        <div className="font-semibold">CSV File (.csv)</div>
                                        <div className="text-xs text-gray-500">Best for system imports</div>
                                    </div>
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Button variant="outline" className="border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" /> Logout
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                     <h2 className="text-xl font-semibold text-gray-200">Recent Complaints</h2>
                     <Button variant="outline" onClick={fetchData} className="border-white/10 text-gray-400 hover:text-white">Refresh</Button>
                </div>

                <div className="border border-white/10 rounded-xl overflow-hidden bg-black/20 backdrop-blur-md">
                    <Table>
                        <TableHeader className="bg-white/5">
                            <TableRow className="border-white/5 hover:bg-transparent">
                                <TableHead className="text-gray-300">ID</TableHead>
                                <TableHead className="text-gray-300">Category</TableHead>
                                <TableHead className="text-gray-300">Severity</TableHead>
                                <TableHead className="text-gray-300">Status</TableHead>
                                <TableHead className="text-gray-300">Assigned To</TableHead>
                                <TableHead className="text-gray-300">Date</TableHead>
                                <TableHead className="text-right text-gray-300">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-48 text-center text-gray-400">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                                        Loading complaints...
                                    </TableCell>
                                </TableRow>
                            ) : complaints.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-48 text-center text-gray-500">
                                        No complaints found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                complaints.map((complaint) => {
                                    const assignedUser = actionTakers.find(u => u.uid === complaint.assignedTo);
                                    return (
                                        <TableRow key={complaint.complaintId} className="border-white/5 hover:bg-white/5 transition-colors">
                                            <TableCell className="font-mono text-teal-400">{complaint.complaintId}</TableCell>
                                            <TableCell className="text-white">{complaint.category}</TableCell>
                                            <TableCell>
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                                                    complaint.severity === 'Critical' ? 'border-red-500 text-red-400 bg-red-500/10' :
                                                    complaint.severity === 'High' ? 'border-orange-500 text-orange-400 bg-orange-500/10' :
                                                    'border-gray-500 text-gray-400'
                                                }`}>
                                                    {complaint.severity}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={getStatusColor(complaint.status)}>
                                                    {complaint.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-gray-300">
                                                {assignedUser ? (
                                                    <div className="flex items-center gap-2">
                                                        <UserCheck className="w-3 h-3 text-green-400" />
                                                        {assignedUser.name}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-600 italic">Unassigned</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-gray-400 text-sm">
                                                {complaint.createdAt ? new Date(complaint.createdAt.seconds * 1000).toLocaleDateString() : '-'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button 
                                                    size="sm" 
                                                    variant="outline"
                                                    className="border-primary/20 hover:bg-primary/10 hover:text-primary text-gray-300"
                                                    onClick={() => {
                                                        setSelectedComplaint(complaint);
                                                        setSelectedTaker(complaint.assignedTo || "");
                                                        markAsViewed(complaint);
                                                        setIsAssignOpen(true);
                                                    }}
                                                >
                                                    Manage
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Assignment Dialog */}
            <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
                <DialogContent className="bg-[#0A1116] border-white/10 text-white sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Complaint Details</DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Review details for complaint <span className="font-mono text-teal-400 ml-1">{selectedComplaint?.complaintId}</span>
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="py-4 space-y-6">
                        {/* Description Section */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</label>
                            <div className="p-4 rounded-lg bg-black/40 border border-white/10 max-h-[200px] overflow-y-auto">
                                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                                    {selectedComplaint?.description}
                                </p>
                            </div>
                        </div>

                        {/* Evidence Section */}
                        {selectedComplaint?.attachmentUrl && (
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Attached Evidence</label>
                                <div className="relative rounded-lg overflow-hidden border border-white/10 bg-black/40 group">
                                    <img 
                                        src={selectedComplaint.attachmentUrl} 
                                        alt="Evidence" 
                                        className="w-full object-contain max-h-[300px] bg-neutral-900/50" 
                                    />
                                    <a 
                                        href={selectedComplaint.attachmentUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded hover:bg-teal-600 transition-colors backdrop-blur-sm opacity-0 group-hover:opacity-100"
                                    >
                                        View Full Size
                                    </a>
                                </div>
                            </div>
                        )}

                        {/* Assignment Section */}
                        <div className="bg-white/5 p-4 rounded-lg border border-white/5 space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-200">Assign Action Taker</label>
                                <Badge variant="outline" className="bg-teal-500/10 text-teal-400 border-teal-500/20">
                                    Required
                                </Badge>
                            </div>
                            <Select value={selectedTaker} onValueChange={setSelectedTaker}>
                                <SelectTrigger className="bg-black/50 border-white/10">
                                    <SelectValue placeholder="Select an officer..." />
                                </SelectTrigger>
                                <SelectContent className="bg-neutral-900 border-white/10 text-white">
                                    {actionTakers.map(taker => (
                                        <SelectItem key={taker.uid} value={taker.uid}>
                                            {taker.name} ({taker.department || 'General'})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsAssignOpen(false)}>Close</Button>
                        <Button 
                            className="bg-teal-600 hover:bg-teal-500 text-white" 
                            onClick={handleAssign}
                            disabled={assigning}
                        >
                            {assigning ? <Loader2 className="animate-spin" /> : "Update Assignment"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

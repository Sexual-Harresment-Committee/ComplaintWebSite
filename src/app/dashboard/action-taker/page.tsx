"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Complaint, UserProfile } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { ComplaintEditor } from "./complaint-editor";
import { Button } from "@/components/ui/button";
import { ShieldAlert, FileDown, FileText, FileSpreadsheet, Calendar as CalendarIcon, X, LogOut, Loader2, UserCheck } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { toast } from "sonner";
import { exportToCSV, exportToPDF, exportToXLSX } from "@/lib/export-utils";
import { DateRange } from "react-day-picker";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function ActionTakerDashboard() {
  const { user, userData } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // Export
  const [isExportOpen, setIsExportOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    // Fetch complaints assigned to the current user
    const q = query(
      collection(db, "complaints"),
      where("assignedTo", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), complaintId: doc.id } as Complaint));
      // Sort in client to avoid index issues with compound queries if needed, or index is ready
      data.sort((a, b) => {
          if (a.createdAt && b.createdAt) {
              return b.createdAt.seconds - a.createdAt.seconds;
          }
          return 0;
      });
      setComplaints(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching complaints:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Apply Filters
  useEffect(() => {
    let result = complaints;

    if (statusFilter !== "all") {
      result = result.filter(c => c.status === statusFilter);
    }

    if (severityFilter !== "all") {
      result = result.filter(c => c.severity === severityFilter);
    }

    if (dateRange?.from) {
      result = result.filter(c => {
        if (!c.createdAt) return false;
        const date = new Date(c.createdAt.seconds * 1000);
        if (dateRange.to) {
          return date >= dateRange.from! && date <= dateRange.to;
        }
        return date >= dateRange.from!;
      });
    }

    setFilteredComplaints(result);
  }, [complaints, statusFilter, severityFilter, dateRange]);

  const handleExport = (type: 'csv' | 'xlsx' | 'pdf') => {
    try {
      toast.info(`Generating ${type.toUpperCase()}...`);
      const dummyTakers = user ? [{ uid: user.uid, name: (userData as any)?.name || 'Me', email: user.email || '', role: 'action_taker', department: 'General' } as UserProfile] : [];

      if (type === 'csv') exportToCSV(filteredComplaints, dummyTakers);
      if (type === 'xlsx') exportToXLSX(filteredComplaints, dummyTakers);
      if (type === 'pdf') exportToPDF(filteredComplaints, dummyTakers);
      toast.success("Download started");
      setIsExportOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Export failed");
    }
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setSeverityFilter("all");
    setDateRange(undefined);
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
            <ShieldAlert className="text-teal-500" />
            Action Taker Dashboard
          </h1>
          <p className="text-gray-400">Manage your assigned investigations.</p>
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
                <DialogTitle>Export My Tasks</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Download your assigned complaints data.
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 gap-4 py-4">
                <Button variant="outline" className="h-14 justify-start px-4 border-white/10 hover:bg-white/5 hover:text-white" onClick={() => handleExport('xlsx')}>
                  <FileSpreadsheet className="mr-3 h-5 w-5 text-green-400" />
                  <div className="text-left">
                    <div className="font-semibold">Excel Workbook (.xlsx)</div>
                  </div>
                </Button>
                <Button variant="outline" className="h-14 justify-start px-4 border-white/10 hover:bg-white/5 hover:text-white" onClick={() => handleExport('pdf')}>
                  <FileText className="mr-3 h-5 w-5 text-red-400" />
                  <div className="text-left">
                    <div className="font-semibold">PDF Document (.pdf)</div>
                  </div>
                </Button>
                <Button variant="outline" className="h-14 justify-start px-4 border-white/10 hover:bg-white/5 hover:text-white" onClick={() => handleExport('csv')}>
                  <FileDown className="mr-3 h-5 w-5 text-blue-400" />
                  <div className="text-left">
                    <div className="font-semibold">CSV File (.csv)</div>
                  </div>
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" className="border-red-500/20 text-red-500 hover:bg-red-500/10" onClick={() => auth.signOut()}>
             <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </div>
      </div>

      {/* Filters (Retained from Action Taker logic) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-400 uppercase">Status</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-black/40 border-white/10 text-white">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent className="bg-[#0A1116] border-white/10 text-white">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Submitted">Submitted</SelectItem>
              <SelectItem value="Under Review">Under Review</SelectItem>
              <SelectItem value="Investigation">Investigation</SelectItem>
              <SelectItem value="Resolved">Resolved</SelectItem>
              <SelectItem value="Dismissed">Dismissed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-400 uppercase">Severity</label>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="bg-black/40 border-white/10 text-white">
              <SelectValue placeholder="Filter by Severity" />
            </SelectTrigger>
            <SelectContent className="bg-[#0A1116] border-white/10 text-white">
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="Critical">Critical</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-400 uppercase">Date Range</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={`w-full justify-start text-left font-normal bg-black/40 border-white/10 text-white hover:bg-white/5 hover:text-white ${!dateRange && "text-muted-foreground"}`}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-[#0A1116] border-white/10 text-white" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                classNames={{
                  day_selected: "bg-teal-600 text-white hover:bg-teal-500 hover:text-white focus:bg-teal-500 focus:text-white",
                  day_today: "bg-white/10 text-white",
                  day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-white/10 rounded-md text-white",
                }}
                className="bg-[#0A1116] text-white border-white/10"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-end">
          <Button
            variant="ghost"
            onClick={clearFilters}
            className="w-full text-gray-400 hover:text-white hover:bg-white/5"
            disabled={statusFilter === 'all' && severityFilter === 'all' && !dateRange}
          >
            <X className="w-4 h-4 mr-2" /> Clear Filters
          </Button>
        </div>
      </div>

      {/* Main Content - Manual Table to match Admin */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
             <h2 className="text-xl font-semibold text-gray-200">My Tasks</h2>
             {/* Admin has refresh here, we can keep or leave. Fetch is real-time via snap, so maybe not strictly needed, but consistent. */}
        </div>

        <div className="border border-white/10 rounded-xl overflow-hidden bg-black/20 backdrop-blur-md">
            <Table>
                <TableHeader className="bg-white/5">
                    <TableRow className="border-white/5 hover:bg-transparent">
                        <TableHead className="text-gray-300">ID</TableHead>
                        <TableHead className="text-gray-300">Category</TableHead>
                        <TableHead className="text-gray-300">Severity</TableHead>
                        <TableHead className="text-gray-300">Status</TableHead>
                        <TableHead className="text-gray-300">Date</TableHead>
                        <TableHead className="text-right text-gray-300">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-48 text-center text-gray-400">
                                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                                Loading tasks...
                            </TableCell>
                        </TableRow>
                    ) : filteredComplaints.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-48 text-center text-gray-500">
                                No tasks found matching your filters.
                            </TableCell>
                        </TableRow>
                    ) : (
                        filteredComplaints.map((complaint) => (
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
                                <TableCell className="text-gray-400 text-sm">
                                    {complaint.createdAt ? new Date(complaint.createdAt.seconds * 1000).toLocaleDateString() : '-'}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button 
                                        size="sm" 
                                        variant="outline"
                                        className="border-primary/20 hover:bg-primary/10 hover:text-primary text-gray-300"
                                        onClick={() => setSelectedComplaint(complaint)}
                                    >
                                        Manage
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
      </div>

      <Dialog open={!!selectedComplaint} onOpenChange={(open) => !open && setSelectedComplaint(null)}>
        <DialogContent className="bg-[#0A1116] border-white/10 text-white sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-mono text-teal-400">{selectedComplaint?.complaintId}</DialogTitle>
            <DialogDescription className="text-gray-400">
              Manage investigation details and updates.
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-6">
            <div>
              <h4 className="font-semibold mb-2 text-gray-200">Description</h4>
              <div className="text-sm text-gray-300 bg-black/40 border border-white/10 p-4 rounded-lg leading-relaxed whitespace-pre-wrap">
                {selectedComplaint?.description}
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

            {selectedComplaint && (
              <ComplaintEditor
                complaint={selectedComplaint}
                onUpdate={() => setSelectedComplaint(null)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

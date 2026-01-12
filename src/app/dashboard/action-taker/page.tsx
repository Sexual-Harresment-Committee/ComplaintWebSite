"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Complaint, UserProfile } from "@/types";
import { DataTable } from "./data-table";
import { columns } from "./columns";
import { useAuth } from "@/context/AuthContext";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ComplaintEditor } from "./complaint-editor";
import { Button } from "@/components/ui/button";
import { ShieldAlert, FileDown, FileText, FileSpreadsheet, Calendar as CalendarIcon, X, LogOut } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { toast } from "sonner";
import { exportToCSV, exportToPDF, exportToXLSX } from "@/lib/export-utils";
import { DateRange } from "react-day-picker";

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
      // orderBy("createdAt", "desc") // Temporarily removed to bypass index creation wait time
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), complaintId: doc.id } as Complaint));
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
      // Pass dummy list since we only filter by user
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

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 text-white min-h-screen">
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

      {/* Filters */}
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

      <div className="border border-white/10 rounded-xl overflow-hidden bg-black/20 backdrop-blur-md">
        <DataTable
          columns={columns}
          data={filteredComplaints}
          onRowClick={(row: Complaint) => setSelectedComplaint(row)}
        />
      </div>

      <Sheet open={!!selectedComplaint} onOpenChange={(open) => !open && setSelectedComplaint(null)}>
        <SheetContent className="bg-[#0A1116] border-white/10 text-white sm:max-w-xl">
          <SheetHeader>
            <SheetTitle className="text-2xl font-mono text-teal-400">{selectedComplaint?.complaintId}</SheetTitle>
            <SheetDescription className="text-gray-400">
              Manage investigation details and updates.
            </SheetDescription>
          </SheetHeader>

          <div className="py-6 space-y-6">
            <div>
              <h4 className="font-semibold mb-2 text-gray-200">Description</h4>
              <div className="text-sm text-gray-300 bg-black/40 border border-white/10 p-4 rounded-lg leading-relaxed whitespace-pre-wrap">
                {selectedComplaint?.description}
              </div>
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

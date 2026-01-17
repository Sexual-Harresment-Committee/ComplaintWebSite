"use client";

import React, { useState, Suspense, useRef, useEffect } from "react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Input } from "@/components/ui/CustomInput"; // Use our wrapper
import { Textarea } from "@/components/ui/textarea"; // Use standard shadcn, or wrapper? User code used custom Textarea. Let's start with standard and wrapper if needed.
// Wait, user's Textarea had a label prop. Shadcn's doesn't. 
// I'll wrap Textarea inline or create one locally.
import { FileUpload } from "@/components/ui/FileUpload";
import { Button } from "@/components/ui/CustomButton"; // Use our wrapper
import { useSearchParams } from "next/navigation";
import {
    ShieldCheck,
    Calendar,
    MapPin,
    AlertTriangle,
    User,
    Eye,
    FileText,
    CheckCircle2,
    Lock,
    ArrowLeft,
    KeyRound
} from "lucide-react";
import { generateComplaintId, hashPasscode } from "@/lib/utils";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Helper for Textarea with Label (similar to CustomInput)
function CustomTextarea({ label, className, value, ...props }: any) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = "auto";
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    };

    useEffect(() => {
        adjustHeight();
    }, [value]);

    return (
        <div className="space-y-2 w-full">
            <Label className="text-gray-300 font-medium">{label}</Label>
            <Textarea 
                ref={textareaRef}
                value={value}
                className={`bg-black/20 border-white/10 text-white placeholder:text-gray-600 focus:border-brand-teal/50 focus:ring-brand-teal/20 min-h-[85px] overflow-hidden resize-none transition-all duration-200 ${className}`}
                onChange={(e: any) => {
                    adjustHeight();
                    props.onChange?.(e);
                }}
                {...props}
            />
        </div>
    )
}

import { DateTimePicker } from "@/components/ui/DateTimePicker";

function ComplaintContent() {
    const searchParams = useSearchParams();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submittedId, setSubmittedId] = useState<string | null>(null);

    // Form State
    const [category, setCategory] = useState<string>("");
    const [otherCategoryVal, setOtherCategoryVal] = useState<string>("");
    const [urgency, setUrgency] = useState<string>("Low");
    
    // Location Split State
    const [campus, setCampus] = useState<string>("");
    const [specificLocation, setSpecificLocation] = useState<string>("");

    // Separate state for Date object
    const [date, setDate] = useState<Date | undefined>(undefined);

    const [formData, setFormData] = useState({
        // dateTime removed from here, handled separately
        // location removed, handled by campus + specificLocation
        perpetrator: "",
        witnesses: "",
        description: "",
        passcode: "" 
    });

    const categories = [
        "Bullying", "Harassment", "Academic Dishonesty", "Substance Abuse", "Other"
    ];

    const urgencyLevels = [
        { level: "Low", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
        { level: "Medium", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
        { level: "Critical", color: "bg-red-500/20 text-red-400 border-red-500/30" }
    ];

    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!category) {
            toast.error("Please select a category");
            return;
        }

        if (category === "Other" && !otherCategoryVal.trim()) {
            toast.error("Please specify the 'Other' category detail.");
            return;
        }

        if (!date) {
            toast.error("Please select the date and time of the incident.");
            return;
        }

        if (!campus) {
             toast.error("Please select a campus.");
             return;
        }

        if (!specificLocation.trim()) {
            toast.error("Please specify the exact location.");
            return;
        }

        if (!formData.perpetrator.trim()) {
             toast.error("Please provide details about the subject/perpetrator.");
             return;
        }

        if (!formData.witnesses.trim()) {
             toast.error("Please provide witness details (or type 'None').");
             return;
        }

        if (formData.description.length < 20) {
             toast.error("Description must be at least 20 characters.");
             return;
        }

        setIsSubmitting(true);

        try {
            const complaintId = generateComplaintId();
            let passcodeHash = null;
            let attachmentUrl = "";
            
            if (formData.passcode) {
                passcodeHash = await hashPasscode(formData.passcode);
            }

            // Upload Files if selected
            const uploadedUrls: string[] = [];
            const uploadedPaths: string[] = [];

            if (selectedFiles.length > 0) {
                 // RLS Policy Check: Allow Images, Videos, Audio
                 const allowedExtensions = ['jpg', 'jpeg', 'png', 'mp4', 'mov', 'webm', 'mp3', 'wav', 'm4a'];
                 
                 // Size Check
                 const totalSize = selectedFiles.reduce((acc, f) => acc + f.size, 0);
                 if (totalSize > 10 * 1024 * 1024) { // 10MB
                     toast.error("Total file size exceeds 10MB limit.");
                     setIsSubmitting(false);
                     return;
                 }

                 for (const fileItem of selectedFiles) {
                     const fileExtension = fileItem.name.split('.').pop()?.toLowerCase();
                     
                     if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
                         toast.error(`Format not supported for ${fileItem.name}.`);
                         setIsSubmitting(false);
                         return;
                     }

                    try {
                        const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 5)}_${fileItem.name.replace(/\s+/g, '_')}`;
                        const filePath = `public/${complaintId}/${fileName}`;
                        
                        const { data, error } = await supabase.storage.from('Proof').upload(filePath, fileItem);

                        if (error) throw error;

                        if (data) {
                            uploadedPaths.push(data.path);
                             // Get Public URL
                            const { data: publicUrlData } = supabase.storage.from('Proof').getPublicUrl(filePath);
                            uploadedUrls.push(publicUrlData.publicUrl);
                        }

                    } catch (uploadError: any) {
                        console.error(uploadError);
                        toast.error(`Upload failed for ${fileItem.name}: ${uploadError.message}`);
                        setIsSubmitting(false);
                        return; 
                    }
                 }
            }

            const structuredData = {
                complaintId: complaintId,
                category: (category === "Other" && otherCategoryVal) ? `Other: ${otherCategoryVal}` : category as any,
                severity: urgency as any,
                description: formData.description,
                incidentDate: date ? date.toISOString() : new Date().toISOString(), 
                location: `${campus} | ${specificLocation}`, 
                perpetrator: formData.perpetrator, 
                witnesses: formData.witnesses, 
                attachmentUrl: uploadedUrls.length > 0 ? uploadedUrls[0] : null, // Legacy
                storagePath: uploadedPaths.length > 0 ? uploadedPaths[0] : null, // Legacy
                attachmentUrls: uploadedUrls, // New
                storagePaths: uploadedPaths, // New
                passcode: passcodeHash,
                status: 'Submitted',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            await setDoc(doc(db, "complaints", complaintId), structuredData);

            setSubmittedId(complaintId);
            toast.success("Complaint encrypted and submitted.");

        } catch (error) {
            console.error(error);
            toast.error("Transmission failed. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const isFormValid = Boolean(
        category &&
        (category !== "Other" || otherCategoryVal.trim()) &&
        date &&
        campus &&
        specificLocation.trim() &&
        formData.perpetrator.trim() &&
        formData.witnesses.trim() &&
        formData.description.trim().length >= 20
    );

    if (submittedId) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4 bg-[#0A1116] w-full">
                <div className="glass-card max-w-md w-full p-10 text-center space-y-8 animate-fade-in-up border border-white/10 rounded-2xl bg-black/40 backdrop-blur-xl">
                    <div className="w-24 h-24 bg-teal-500/10 rounded-full flex items-center justify-center mx-auto border border-teal-500/20 shadow-[0_0_30px_rgba(42,157,143,0.2)]">
                        <CheckCircle2 size={48} className="text-teal-500" />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold text-white">Complaint Secured</h2>
                        <p className="text-gray-400">
                            Your report has been encrypted and submitted anonymously.
                        </p>
                    </div>

                    <div className="bg-black/30 p-6 rounded-xl border border-white/10 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">Case Tracking ID</p>
                        <p className="text-3xl font-mono font-bold text-teal-500 select-all tracking-wider">{submittedId}</p>
                    </div>

                    <div className="flex items-start gap-3 text-left p-4 rounded-lg bg-yellow-500/5 border border-yellow-500/10 text-yellow-200/80 text-sm">
                        <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                        <p>Save this ID securely. Need to track it? Use the ID {formData.passcode ? "and your Passcode" : ""} on the tracking page.</p>
                    </div>

                    <div className="flex flex-col gap-3 w-full">
                        <Button 
                            variant="default" 
                            className="w-full bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-500/20"
                            onClick={() => {
                                const { jsPDF } = require("jspdf"); 
                                const doc = new jsPDF();
                                
                                // Colors
                                doc.setFillColor(255, 255, 255); 
                                
                                // Header
                                doc.setFontSize(22);
                                doc.setTextColor(42, 157, 143); // Teal
                                doc.text("Complaint Submission Receipt", 105, 20, { align: "center" });
                                
                                doc.setFontSize(12);
                                doc.setTextColor(100);
                                doc.text("SHPC - Safe Voice Platform", 105, 30, { align: "center" });
                                
                                doc.setLineWidth(0.5);
                                doc.setDrawColor(200);
                                doc.line(20, 35, 190, 35);
                                
                                // Content
                                doc.setFontSize(14);
                                doc.setTextColor(0);
                                doc.text("Complaint Tracking ID:", 20, 50);
                                doc.setFont("helvetica", "bold");
                                doc.setFontSize(16);
                                doc.text(submittedId || "", 20, 60);
                                
                                doc.setFont("helvetica", "normal");
                                doc.setFontSize(14);
                                doc.text("Submission Date:", 20, 80);
                                doc.setFontSize(12);
                                doc.text(new Date().toLocaleString(), 20, 90);
                                
                                if (formData.passcode) {
                                    doc.setFontSize(14);
                                    doc.text("Passcode Protection:", 20, 110);
                                    doc.setFontSize(12);
                                    doc.text("Yes (Passcode set by user)", 20, 120);
                                    doc.setTextColor(200, 0, 0); // Red warning
                                    doc.setFontSize(10);
                                    doc.text("Note: We do not store your raw passcode. If you forget it,", 20, 130);
                                    doc.text("you will not be able to track this complaint.", 20, 135);
                                } else {
                                    doc.setFontSize(14);
                                    doc.text("Passcode Protection:", 20, 110);
                                    doc.setFontSize(12);
                                    doc.text("No (Open access with ID)", 20, 120);
                                }
                                
                                // Footer
                                doc.setTextColor(150);
                                doc.setFontSize(10);
                                doc.text("Please keep this document safe. This ID is the only way to track your case.", 105, 280, { align: "center" });
                                
                                doc.save(`SHPC-Receipt-${submittedId}.pdf`);
                            }}
                        >
                            <FileText className="mr-2 h-4 w-4" />
                            Download Receipt (PDF)
                        </Button>

                        <Button variant="outline" className="w-full border-white/10 text-gray-400 hover:text-white hover:bg-white/5 bg-transparent" onClick={() => window.location.href = '/'}>
                            Return to Home
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <section className="min-h-screen py-16 px-4 bg-[#0A1116]">
            <div className="max-w-3xl mx-auto space-y-8">

                {/* Header */}
                <div className="text-center space-y-3 mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-white">Raise a Complaint</h1>
                    <p className="text-gray-400 max-w-lg mx-auto">
                        Your voice matters. Submit your report securely and anonymously below.
                    </p>
                </div>

                {/* Main Form Card */}
                <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/40 backdrop-blur-md shadow-2xl shadow-black/50">

                    {/* Form Header Strip */}
                    <div className="h-2 bg-gradient-to-r from-teal-500 to-cyan-500 w-full" />

                    {/* Back Button */}
                    <div className="px-8 pt-8 md:px-12 md:pt-10">
                        <Link href="/">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-zinc-400 hover:text-white px-0 hover:bg-transparent"
                                icon={<ArrowLeft size={16} />}
                            >
                                Back
                            </Button>
                        </Link>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 md:p-12 pt-4 space-y-16">

                        {/* SECTION 1: CATEGORIZATION */}
                        <div className="space-y-8">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2 border-b border-white/10 pb-4">
                                <span className="w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-500 text-sm">01</span>
                                Categorization
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                                {/* Category Selection */}
                                <div className="space-y-3">
                                    <Label className="text-gray-300 font-medium">Category</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {categories.map((cat) => (
                                            <button
                                                key={cat}
                                                type="button"
                                                onClick={() => setCategory(cat)}
                                                className={`px-4 py-2 rounded-full text-xs font-medium border transition-all duration-300 ${category === cat
                                                    ? "bg-teal-500 text-white border-teal-500 shadow-[0_0_15px_rgba(42,157,143,0.3)]"
                                                    : "bg-white/5 text-gray-400 border-white/10 hover:border-white/20 hover:text-white"
                                                    }`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>

                                    
                                    {category === "Other" && (
                                        <div className="mt-3 animate-fade-in">
                                            <Input 
                                                label="Please specify"
                                                value={otherCategoryVal}
                                                onChange={(e) => setOtherCategoryVal(e.target.value)}
                                                placeholder="What represents this incident?"
                                                className="bg-black/30"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Urgency Selector */}
                                <div className="space-y-3">
                                    <Label className="text-gray-300 font-medium">Urgency Level</Label>
                                    <div className="flex gap-3">
                                        {urgencyLevels.map((lvl) => (
                                            <button
                                                key={lvl.level}
                                                type="button"
                                                onClick={() => setUrgency(lvl.level)}
                                                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition-all duration-300 text-center uppercase tracking-wide ${urgency === lvl.level
                                                    ? lvl.color + " ring-1 ring-offset-1 ring-offset-[#0A1116] ring-white/20"
                                                    : "bg-white/5 border-white/10 text-gray-500 grayscale opacity-70 hover:opacity-100 hover:grayscale-0"
                                                    }`}
                                            >
                                                {lvl.level}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SECTION 2: INCIDENT DETAILS */}
                        <div className="space-y-8">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2 border-b border-white/10 pb-4">
                                <span className="w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-500 text-sm">02</span>
                                Incident Details
                            </h3>

                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                                    <DateTimePicker
                                        label="Date & Time"
                                        date={date}
                                        setDate={setDate}
                                        className="h-auto min-h-[3rem] py-3"
                                    />
                                    
                                     {/* Campus Selector */}
                                    <div className="space-y-2">
                                        <Label className="text-gray-300 font-medium">Campus / Institute</Label>
                                         <Select value={campus} onValueChange={setCampus}>
                                            <SelectTrigger className="w-full bg-black/20 border-white/10 text-white h-auto min-h-[3rem] py-3 text-left">
                                                <div className="flex items-center gap-2 w-full overflow-hidden">
                                                    <MapPin size={16} className="text-gray-500 shrink-0" />
                                                    <span className="truncate whitespace-normal text-sm leading-normal">
                                                        <SelectValue placeholder="Select Campus" />
                                                    </span>
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent className="bg-neutral-900 border-white/10 text-white max-h-[300px]">
                                                <SelectItem value="SAL Institute of Technology & Engineering and Research">SAL Institute of Technology & Engineering and Research</SelectItem>
                                                <SelectItem value="SAL College of Engineering">SAL College of Engineering</SelectItem>
                                                <SelectItem value="SAL Engineering and Technical Institute">SAL Engineering and Technical Institute</SelectItem>
                                                <SelectItem value="SAL Institute of Diploma Studies">SAL Institute of Diploma Studies</SelectItem>
                                                <SelectItem value="SAL Institute of Management">SAL Institute of Management</SelectItem>
                                                <SelectItem value="SAL Institute of Pharmacy">SAL Institute of Pharmacy</SelectItem>
                                                <SelectItem value="SAL College of Pharmacy">SAL College of Pharmacy</SelectItem>
                                                <SelectItem value="SAL School of Architecture">SAL School of Architecture</SelectItem>
                                                <SelectItem value="SAL School of Interior Design">SAL School of Interior Design</SelectItem>
                                                <SelectItem value="Other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Specific Location Input - Full Width */}
                                <Input
                                    label="Specific Area (Room / Floor / Building)"
                                    value={specificLocation}
                                    onChange={(e) => setSpecificLocation(e.target.value)}
                                    placeholder="e.g. Library 2nd Floor, Room 101, Canteen..."
                                    required
                                />
                            </div>
                        </div>

                        {/* SECTION 3: PEOPLE INVOLVED */}
                        <div className="space-y-8">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2 border-b border-white/10 pb-4">
                                <span className="w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-500 text-sm">03</span>
                                People Involved
                            </h3>

                            <div className="space-y-8">
                                <Input
                                    label="Subject / Perpetrator"
                                    name="perpetrator"
                                    value={formData.perpetrator}
                                    onChange={handleInputChange}
                                    placeholder="Name or description..."
                                    icon={<User size={18} />}
                                    required
                                />
                                <Input
                                    label="Witnesses"
                                    name="witnesses"
                                    value={formData.witnesses}
                                    onChange={handleInputChange}
                                    placeholder="Anyone else present? (Type 'None' if applicable)"
                                    icon={<Eye size={18} />}
                                    required
                                />
                            </div>
                        </div>

                        {/* SECTION 4: THE STORY */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2 border-b border-white/10 pb-4">
                                <span className="w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-500 text-sm">04</span>
                                The Story
                            </h3>

                            <CustomTextarea
                                label="Description"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Please describe the incident in detail. Include specific actions, quotes, and sequence of events."
                                required
                                rows={3}
                            />
                        </div>

                        {/* SECTION 5: SECURITY (New Section) */}
                         <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2 border-b border-white/10 pb-4">
                                <span className="w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-500 text-sm">05</span>
                                Security (Optional)
                            </h3>
                             
                             <div className="p-4 rounded-lg bg-teal-500/5 border border-teal-500/10 space-y-4">
                                <Input
                                    label="Secret Passcode"
                                    name="passcode"
                                    type="password"
                                    value={formData.passcode}
                                    onChange={handleInputChange}
                                    placeholder="Create a code to track this later..."
                                    icon={<KeyRound size={18} />}
                                />
                                <p className="text-xs text-gray-500">
                                    Important: If you set a passcode, you will need it (along with the ID) to view updates. 
                                    If left blank, anyone with the ID can view the status.
                                </p>
                             </div>
                        </div>

                        {/* SECTION 6: EVIDENCE */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2 border-b border-white/10 pb-4">
                                <span className="w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-500 text-sm">06</span>
                                Evidence <span className="text-gray-500 text-sm font-normal ml-auto">(Optional)</span>
                            </h3>

                            <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-lg p-3 flex gap-3 mb-4">
                                <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />
                                <p className="text-xs text-yellow-200/80 leading-relaxed">
                                    <span className="font-semibold text-yellow-500">Immutable Evidence:</span> Once uploaded, no one can delete or edit your proof. Even you cannot view or edit the evidence after submission to ensure chain of custody.
                                </p>
                            </div>

                            <FileUpload
                                label="Upload Evidence (Image / Video / Audio) - Max 10MB Total"
                                multiple={true}
                                onFilesSelected={handleFileSelect}
                            />
                        </div>

                        {/* SUBMISSION FOOTER */}
                        <div className="pt-8 border-t border-white/10 space-y-4">
                            <Button
                                type="submit"
                                variant="gradient"
                                size="lg"
                                className="w-full shadow-2xl shadow-teal-500/20 py-6 text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-teal-600"
                                isLoading={isSubmitting}
                                disabled={!isFormValid || isSubmitting}
                            >
                                Submit Secure Complaint
                            </Button>

                            <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
                                <Lock size={14} />
                                <span>Your submission is encrypted and 100% anonymous.</span>
                            </div>
                        </div>

                    </form>
                </div>
            </div>
        </section>
    );
}

export default function RaiseComplaint() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">Loading Secure Interface...</div>}>
            <ComplaintContent />
        </Suspense>
    );
}

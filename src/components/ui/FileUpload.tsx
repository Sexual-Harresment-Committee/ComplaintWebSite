"use client";

import { UploadCloud } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
    label: string;
    onFilesSelected: (files: FileList | null) => void;
    multiple?: boolean;
}

export function FileUpload({ label, onFilesSelected, multiple = false }: FileUploadProps) {
    const [dragActive, setDragActive] = useState(false);

    const handleFiles = (files: FileList | null) => {
        if (files && files.length > 0) {
            onFilesSelected(files);
        }
    };

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">{label}</label>
            <div 
                className={cn(
                    "relative border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center transition-colors cursor-pointer group",
                    dragActive ? "border-brand-teal bg-brand-teal/10" : "border-white/10 bg-black/20 hover:bg-black/30 hover:border-white/20"
                )}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setDragActive(false);
                    handleFiles(e.dataTransfer.files);
                }}
            >
                <input 
                    type="file" 
                    multiple={multiple}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => {
                        handleFiles(e.target.files);
                        e.target.value = ""; // Reset input to allow adding same file if needed
                    }}
                />
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:bg-teal-500/20 transition-colors">
                     <UploadCloud className="w-6 h-6 text-gray-400 group-hover:text-teal-500" />
                </div>
                <p className="text-sm text-gray-300 font-medium">
                    Click to browse or drag files here
                </p>
                <p className="text-xs text-gray-500 mt-1">Supports Image, Video, Audio {multiple ? "(Max 10MB Total)" : "(Max 5MB)"}</p>
            </div>
        </div>
    );
}

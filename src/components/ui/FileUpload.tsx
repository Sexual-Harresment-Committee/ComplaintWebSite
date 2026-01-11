"use client";

import { UploadCloud } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
    label: string;
    onFilesSelected: (files: FileList | null) => void;
}

export function FileUpload({ label, onFilesSelected }: FileUploadProps) {
    const [dragActive, setDragActive] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">{label}</label>
            <div 
                className={cn(
                    "relative border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center transition-colors cursor-pointer",
                    dragActive ? "border-brand-teal bg-brand-teal/10" : "border-white/10 bg-black/20 hover:bg-black/30 hover:border-white/20"
                )}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setDragActive(false);
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        setFileName(e.dataTransfer.files[0].name);
                        onFilesSelected(e.dataTransfer.files);
                    }
                }}
            >
                <input 
                    type="file" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                            setFileName(e.target.files[0].name);
                            onFilesSelected(e.target.files);
                        }
                    }}
                />
                <UploadCloud className="w-10 h-10 text-gray-500 mb-2" />
                <p className="text-sm text-gray-400">
                    {fileName ? <span className="text-brand-teal">{fileName}</span> : "Drag & drop or click to upload"}
                </p>
                <p className="text-xs text-gray-600 mt-1">Supports JPG, PNG, PDF (Max 10MB)</p>
            </div>
        </div>
    );
}

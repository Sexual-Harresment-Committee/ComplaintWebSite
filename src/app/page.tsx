
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldCheck, FileText, Lock, ArrowRight, EyeOff } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#0A1116] px-4 py-12 relative overflow-hidden">
        
       {/* Ambient Backgorund Effects */}
       <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-500/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
       </div>

      <div className="max-w-4xl w-full text-center space-y-12 relative z-10">
        
        {/* Header Section */}
        <div className="space-y-6 animate-fade-in-up">
            <div className="mx-auto bg-gradient-to-br from-teal-500/20 to-blue-600/20 p-4 rounded-3xl w-24 h-24 flex items-center justify-center border border-white/5 shadow-[0_0_30px_rgba(42,157,143,0.3)] backdrop-blur-xl">
              <ShieldCheck className="w-12 h-12 text-teal-400" />
            </div>
          
            <div className="space-y-4">
                <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-white">
                    Speak Up. <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">Stay Safe.</span>
                </h1>
                <p className="text-lg md:text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto">
                    Your voice has power. Raising a concern shouldn't cost you your peace of mind. 
                    This platform guarantees <span className="text-teal-400 font-medium">100% anonymity</span> and secure tracking.
                </p>
            </div>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-6 pt-4">
          
          {/* File Complaint Card */}
          <div className="group relative bg-black/40 border border-white/10 p-8 rounded-2xl shadow-xl hover:shadow-2xl hover:border-teal-500/30 transition-all duration-300 text-left space-y-6 backdrop-blur-md overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative z-10 flex items-start justify-between">
                 <div className="bg-teal-500/10 w-14 h-14 rounded-xl flex items-center justify-center border border-teal-500/20 group-hover:scale-110 transition-transform duration-300">
                   <FileText className="w-7 h-7 text-teal-400" />
                </div>
            </div>
           
            <div className="relative z-10 space-y-2">
                <h3 className="text-2xl font-semibold text-white group-hover:text-teal-400 transition-colors">File a Complaint</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Submit a secure, encrypted report without revealing your identity. 
                  Our system removes all digital footprints.
                </p>
            </div>

            <div className="relative z-10 pt-2">
              <Link href="/file-complaint">
                <Button className="w-full bg-teal-600 hover:bg-teal-500 text-white border-0 shadow-lg shadow-teal-900/20 h-12 text-base font-medium transition-all duration-300 group-hover:translate-y-[-2px]">
                  Start Anonymous Report <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Track Status Card */}
          <div className="group relative bg-black/40 border border-white/10 p-8 rounded-2xl shadow-xl hover:shadow-2xl hover:border-blue-500/30 transition-all duration-300 text-left space-y-6 backdrop-blur-md overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative z-10 flex items-start justify-between">
                 <div className="bg-blue-500/10 w-14 h-14 rounded-xl flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                   <Lock className="w-7 h-7 text-blue-400" />
                </div>
            </div>

            <div className="relative z-10 space-y-2">
                <h3 className="text-2xl font-semibold text-white group-hover:text-blue-400 transition-colors">Track Status</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Already submitted? Check the progress of your case securely using your unique Case ID and Passcode.
                </p>
            </div>

             <div className="relative z-10 pt-2">
              <Link href="/track">
                <Button variant="outline" className="w-full bg-black text-white hover:bg-neutral-900 hover:text-white border-white/20 h-12 text-base font-medium transition-all duration-300 hover:border-blue-500/50">
                  Track Existing Case
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Anonymity Notice footer */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-center gap-2 text-gray-500 text-sm animate-pulse-slow">
            <div className="flex items-center gap-2">
                 <EyeOff className="w-4 h-4" />
                 <span>Zero-Log Policy: Your IP address and device details are never recorded.</span>
            </div>
            <Link href="/admin/login" className="hover:text-gray-400 underline underline-offset-4 decoration-gray-700 transition-colors font-mono text-xs opacity-50 hover:opacity-100">
                Admin / Developer Access
            </Link>
        </div>

      </div>
    </main>
  );
}

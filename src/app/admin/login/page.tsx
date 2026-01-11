
"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState("committee"); // Default role
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Note: We authenticate against Firebase Auth first, then check Firestore.
      // The "Tab" selection is visual/intent-based. We could STRICTLY validate it,
      // but standard practice is to log them in if they are valid, then route them.
      // However, to match the UI's "Login as [Role]" feel, we can warn if mismatch.
      
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const actualRole = userData.role;

        // Optional: Strictly enforce that the selected tab matches the actual role?
        // Or just allow login and redirect based on actual role?
        // Let's rely on actual role for security, but we can check intent if we want.
        // For smoother UX, let's just log them in efficiently. 
        // ACTUALLY: The user asked for "Login as User", "Login as Technician".
        // Let's handle the redirection logic:
        
        if (actualRole === 'admin') {
           toast.success("Welcome back, Admin.");
           router.push("/admin/dashboard");
        } else if (actualRole === 'developer') {
           toast.success("Welcome, Developer.");
           router.push("/developer/dashboard");
        } else if (actualRole === 'action_taker') {
           toast.success("Welcome, Action Taker.");
           // router.push("/action_taker/dashboard"); // Future
           toast.info("Action Taker Dashboard not ready yet."); // Placeholder
        } else if (actualRole === 'committee') {
           toast.success("Welcome, Committee Member.");
           // router.push("/committee/dashboard"); // Future
           toast.info("Committee Dashboard not ready yet.");
        } else {
           toast.error("Role not recognized.");
           await auth.signOut();
        }

      } else {
        toast.error("User record not found in system.");
        await auth.signOut();
      }

    } catch (error: any) {
      console.error(error);
      toast.error("Login failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] px-4 font-sans selection:bg-teal-500/30">
        
      <div className="flex flex-col items-center justify-center space-y-8 w-full max-w-md animate-fade-in-up">
        
        {/* Logo / Header Area */}
        <div className="text-center space-y-2">
           <h1 className="text-2xl font-bold text-white tracking-tight">SHPC Platform</h1>
           <p className="text-gray-500 text-sm">Safe Voice Management System</p>
        </div>

        {/* Card */}
        <div className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl p-6 md:p-8 shadow-2xl shadow-black/50">
           
           <div className="space-y-6">
                <div className="space-y-1">
                    <h2 className="text-xl font-semibold text-white">Sign In</h2>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Select your role to continue</p>
                </div>

                <Tabs defaultValue="committee" onValueChange={setSelectedRole} className="w-full">
                    <TabsList className="grid w-full grid-cols-4 bg-[#161616] p-1 h-11 border border-white/5 rounded-lg">
                        <TabsTrigger 
                            value="committee" 
                            className="text-xs data-[state=active]:bg-[#262626] data-[state=active]:text-white text-gray-400 h-9 transition-all"
                        >
                            Committee
                        </TabsTrigger>
                        <TabsTrigger 
                            value="action_taker" 
                            className="text-xs data-[state=active]:bg-[#262626] data-[state=active]:text-white text-gray-400 h-9 transition-all"
                        >
                            Action Taker
                        </TabsTrigger>
                        <TabsTrigger 
                            value="admin" 
                            className="text-xs data-[state=active]:bg-[#262626] data-[state=active]:text-white text-gray-400 h-9 transition-all"
                        >
                            Admin
                        </TabsTrigger>
                        <TabsTrigger 
                            value="developer" 
                            className="text-xs data-[state=active]:bg-[#262626] data-[state=active]:text-white text-gray-400 h-9 transition-all"
                        >
                            Developer
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                <form onSubmit={handleLogin} className="space-y-5">
                    
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Email</Label>
                        <Input 
                            type="email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            className="bg-[#161616] border-transparent text-white focus:border-white/20 focus:ring-1 focus:ring-white/20 h-11 rounded-lg placeholder:text-gray-600"
                            placeholder="name@shpc.edu"
                            required
                        />
                    </div>
                  
                    <div className="space-y-2">
                         <div className="flex justify-between items-center ml-1">
                             <Label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Password</Label>
                             <Link href="#" className="text-xs text-teal-400 hover:text-teal-300">Forgot?</Link>
                         </div>
                        <Input 
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            className="bg-[#161616] border-transparent text-white focus:border-white/20 focus:ring-1 focus:ring-white/20 h-11 rounded-lg"
                            required
                        />
                    </div>

                    <Button 
                        type="submit" 
                        className="w-full bg-white hover:bg-gray-100 text-black h-11 font-medium transition-colors"
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                        Login as {selectedRole === 'action_taker' ? 'Action Taker' : selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
                    </Button>
                </form>

                 <div className="text-center pt-2">
                    <p className="text-xs text-gray-500">
                        Don't have an account? <span className="text-gray-300 cursor-not-allowed">Contact Admin</span>
                    </p>
                </div>
           </div>

        </div>

      </div>
    </div>
  );
}

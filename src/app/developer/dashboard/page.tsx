
"use client";

import { useEffect, useState } from "react";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Dialog, 
    DialogContent, 
    DialogDescription, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, ShieldAlert, UserCog } from "lucide-react";
import { UserProfile } from "@/types";
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp, getDocs, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Helper to create a user using a TEMPORARY SECONDARY app instance
// This prevents the main admin user from being logged out!
const createSecondaryUser = async (email: string, password: string, role: string, name: string, department: string) => {
    // 1. Initialize a secondary app with the SAME config
    const secondaryAppName = "secondaryApp_" + Date.now(); // Unique name to avoid conflicts
    
    const config = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };
    
    const secondaryApp = initializeApp(config, secondaryAppName);
    
    const secondaryAuth = getAuth(secondaryApp);
    const secondaryDb = getFirestore(secondaryApp);

    try {
        console.log("[DEBUG] Creating User in Auth...");
        // 2. Create the user in Auth
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        const user = userCredential.user;
        console.log("[DEBUG] Auth User Created:", user.uid);
        
        // 3. Create the user profile in Firestore
        // Note: Rules must allow this user to write to their own document (or allow write: if true)
        console.log("[DEBUG] Writing to Firestore 'users' collection...");
        try {
            await setDoc(doc(secondaryDb, "users", user.uid), {
                 uid: user.uid,
                 email: user.email,
                 name: name,
                 role: role,
                 department: department || "N/A", // Ensure no undefined
                 createdAt: serverTimestamp(),
            });
            console.log("[DEBUG] Firestore User Document Written Successfully.");
        } catch (dbError: any) {
            console.error("[DEBUG] Firestore Write Failed:", dbError);
            throw new Error(`Auth created but DB failed: ${dbError.message}`);
        }
        
        // 4. Sign out the secondary user so the app is clean
        await signOut(secondaryAuth);
        
        return user.uid;
        
    } catch (error) {
        console.error("[DEBUG] Major Error in createSecondaryUser:", error);
        throw error;
    }
};

export default function AdminDashboard() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // New User State
    const [newUser, setNewUser] = useState({
        email: "",
        password: "",
        name: "",
        role: "committee",
        department: ""
    });

    const fetchUsers = async () => {
        try {
            // Use Client SDK to fetch users (avoids Server API crashes)
            const snapshot = await getDocs(collection(db, "users"));
            const fetchedUsers = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
            setUsers(fetchedUsers);
        } catch (error) {
            console.error("Failed to fetch users", error);
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // Use Client-Side Logic instead of Server-Side API to avoid Turbopack crashes
            await createSecondaryUser(
                newUser.email, 
                newUser.password, 
                newUser.role, 
                newUser.name, 
                newUser.department
            );

            toast.success("User created successfully");
            setIsAddOpen(false);
            setNewUser({ email: "", password: "", name: "", role: "committee", department: "" });
            fetchUsers();
        } catch (error: any) {
            console.error(error);
            if (error.code === 'auth/email-already-in-use') {
                 toast.error("User already exists. If DB write failed before, delete from Auth manually.");
            } else {
                 toast.error("Error: " + error.message);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteUser = async (uid: string) => {
        if (!confirm("Are you sure? This action cannot be undone.")) return;

        try {
             // Create a toast to warn that delete might fail on erratic server
             toast.info("Attempting delete via API...");
             
            const res = await fetch(`/api/admin/users?uid=${uid}`, {
                method: 'DELETE'
            });
            
            // Note: API might return HTML error if it crashes, validation is key
            if (!res.ok) {
                 const text = await res.text();
                 // If HTML, it is a crash
                 if (text.trim().startsWith("<")) {
                     throw new Error("Server crashed (Turbopack). Cannot delete via UI.");
                 }
                 const data = JSON.parse(text);
                 throw new Error(data.error || "Failed to delete");
            }
            
            toast.success("User deleted");
            fetchUsers(); // Refresh
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 text-white">
            
            {/* Header */}
            <div className="flex bg-black/40 border border-white/10 p-6 rounded-xl backdrop-blur-sm justify-between items-center">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <UserCog className="text-teal-500" />
                        Admin Dashboard
                    </h1>
                    <p className="text-gray-400">Manage system access and authorized personnel.</p>
                </div>
                
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                            <Plus className="mr-2 h-4 w-4" /> Add New User
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#0A1116] border-white/10 text-white sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Add New User</DialogTitle>
                            <DialogDescription className="text-gray-400">
                                Create a new account for a committee member or action taker.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateUser} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label>Full Name</Label>
                                <Input 
                                    value={newUser.name}
                                    onChange={e => setNewUser({...newUser, name: e.target.value})}
                                    className="bg-black/50 border-white/10"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input 
                                    type="email"
                                    value={newUser.email}
                                    onChange={e => setNewUser({...newUser, email: e.target.value})}
                                    className="bg-black/50 border-white/10"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Password</Label>
                                <Input 
                                    type="password"
                                    value={newUser.password}
                                    onChange={e => setNewUser({...newUser, password: e.target.value})}
                                    className="bg-black/50 border-white/10"
                                    minLength={6}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Role</Label>
                                <Select 
                                    value={newUser.role} 
                                    onValueChange={(val) => setNewUser({...newUser, role: val})}
                                >
                                    <SelectTrigger className="bg-black/50 border-white/10">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-neutral-900 border-white/10 text-white">
                                        <SelectItem value="committee">Committee Member</SelectItem>
                                        <SelectItem value="action_taker">Action Taker</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="developer">Developer</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Department (Optional)</Label>
                                <Input 
                                    value={newUser.department}
                                    onChange={e => setNewUser({...newUser, department: e.target.value})}
                                    className="bg-black/50 border-white/10"
                                />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isSubmitting} className="bg-teal-600 hover:bg-teal-500 text-white w-full">
                                    {isSubmitting ? <Loader2 className="animate-spin" /> : "Create Account"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Users Table */}
            <div className="border border-white/10 rounded-xl overflow-hidden bg-black/20 backdrop-blur-md">
                <Table>
                    <TableHeader className="bg-white/5">
                        <TableRow className="border-white/5 hover:bg-transparent">
                            <TableHead className="text-gray-300">Name</TableHead>
                            <TableHead className="text-gray-300">Email</TableHead>
                            <TableHead className="text-gray-300">Role</TableHead>
                            <TableHead className="text-gray-300">Department</TableHead>
                            <TableHead className="text-right text-gray-300">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-gray-400">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                                    No users found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user.uid} className="border-white/5 hover:bg-white/5 transition-colors">
                                    <TableCell className="font-medium text-white">{user.name}</TableCell>
                                    <TableCell className="text-gray-400">{user.email}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                                            user.role === 'admin' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                            user.role === 'committee' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                            'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                        }`}>
                                            {user.role.toUpperCase().replace('_', ' ')}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-gray-400">{user.department || '-'}</TableCell>
                                    <TableCell className="text-right">
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => handleDeleteUser(user.uid)}
                                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

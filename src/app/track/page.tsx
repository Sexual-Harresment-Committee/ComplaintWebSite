"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Lock } from "lucide-react";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { hashPasscode } from "@/lib/utils";
import { toast } from "sonner";

const formSchema = z.object({
  complaintId: z.string().min(5, "Complaint ID is too short used.").trim(),
  passcode: z.string().optional(),
});

export default function TrackComplaint() {
  const [isValidating, setIsValidating] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      complaintId: "",
      passcode: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsValidating(true);
    try {
      // 1. Check if document exists
      const docRef = doc(db, "complaints", values.complaintId.trim());
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        toast.error("Complaint ID not found.");
        setIsValidating(false);
        return;
      }

      const data = docSnap.data();

      // 2. Validate passcode if one is set on the document
      if (data.passcode) {
        if (!values.passcode) {
           toast.error("This complaint is protected by a passcode. Please enter it.");
           setIsValidating(false);
           return;
        }
        const inputHash = await hashPasscode(values.passcode);
        if (inputHash !== data.passcode) {
          toast.error("Invalid passcode.");
          setIsValidating(false);
          return;
        }
      }

      // 3. Navigate to details page
      // We pass the passcode via query param or store in sessionStorage?
      // Since specific route is public if you have the ID, we can just navigate.
      // But if the user refreshes [id] page, they might be prompted again?
      // For this MVP, we will rely on checking the passcode again on the [id] page or 
      // just letting them through if they know the ID (and relying on the client side gate here).
      // Ideally, [id] page should re-verify.
      
      // Let's encode the passcode hash in the URL specifically or store in session storage.
      // Easiest secure way for this context: Store in sessionStorage.
      if (values.passcode) {
         sessionStorage.setItem(`passcode_${values.complaintId}`, values.passcode);
      }
      
      router.push(`/track/${values.complaintId}`);

    } catch (error) {
      console.error(error);
      toast.error("Error accessing records.");
    } finally {
      setIsValidating(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A1116] px-4 relative overflow-hidden">
      {/* Ambient Background Effects */}
       <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-500/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
       </div>

      <div className="relative z-10 w-full max-w-md space-y-8">
        <div className="mb-8 text-center">
              <Link href="/" className="text-sm text-gray-500 hover:text-teal-400 transition-colors">
                &larr; Back to Home
              </Link>
        </div>
        
        <Card className="w-full bg-black/40 border-white/10 shadow-2xl backdrop-blur-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-gradient-to-br from-teal-500/20 to-blue-600/20 p-3 rounded-xl border border-white/5 shadow-[0_0_15px_rgba(42,157,143,0.3)]">
                  <Lock className="w-8 h-8 text-teal-400" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center text-white">Track Complaint</CardTitle>
            <CardDescription className="text-center text-gray-400">
              Enter your Complaint ID and Passcode (if set) to view status updates.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="complaintId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Complaint ID</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. CMP-X82L9N" {...field} className="bg-black/50 border-white/10 text-white placeholder:text-gray-600 focus:border-teal-500/50 focus:ring-teal-500/20" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="passcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Passcode (Optional)</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••" {...field} className="bg-black/50 border-white/10 text-white placeholder:text-gray-600 focus:border-teal-500/50 focus:ring-teal-500/20" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-500 text-white border-0 h-11" disabled={isValidating}>
                  {isValidating ? <Loader2 className="animate-spin" /> : "View Status"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

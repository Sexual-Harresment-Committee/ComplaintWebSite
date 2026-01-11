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
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-950 px-4">
      <div className="mb-8">
            <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
              &larr; Back to Home
            </Link>
      </div>
      <Card className="w-full max-w-md shadow-sm">
        <CardHeader>
          <div className="flex items-center space-x-2 mb-2">
            <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg">
                <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <CardTitle>Track Complaint</CardTitle>
          </div>
          <CardDescription>
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
                    <FormLabel>Complaint ID</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. CMP-X82L9N" {...field} />
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
                    <FormLabel>Passcode (Optional)</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isValidating}>
                {isValidating ? <Loader2 className="animate-spin" /> : "View Status"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

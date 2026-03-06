
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/useAuth"
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword } from "firebase/auth"
import { Loader2 } from "lucide-react"

const accountFormSchema = z.object({
    currentPassword: z.string().min(6, "Password must be at least 6 characters."),
    newPassword: z.string().min(6, "Password must be at least 6 characters."),
    confirmPassword: z.string().min(6, "Password must be at least 6 characters."),
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
})

type AccountFormValues = z.infer<typeof accountFormSchema>


export default function AccountForm() {
  const { currentUser } = useAuth()

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    mode: "onChange",
  })

  async function onSubmit(data: AccountFormValues) {
     if (!currentUser || !currentUser.email) {
      toast({
        variant: 'destructive',
        title: "Not authenticated",
        description: "No user found to update.",
      })
      return
    }

    try {
        const credential = EmailAuthProvider.credential(currentUser.email, data.currentPassword)
        await reauthenticateWithCredential(currentUser, credential);
        await updatePassword(currentUser, data.newPassword);
        toast({
            title: "Password updated",
            description: "Your password has been changed successfully.",
        })
        form.reset();
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "An error occurred.",
            description: "Failed to update password. Please check your current password and try again.",
        })
    }
  }

  return (
    <div className="space-y-8">
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
            control={form.control}
            name="currentPassword"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Current Password</FormLabel>
                <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
                <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Confirm New Password</FormLabel>
                <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Password
            </Button>
        </form>
        </Form>
    </div>
  )
}

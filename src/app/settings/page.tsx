
'use client'

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/useAuth"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/firebase/config"
import { Loader2 } from "lucide-react"

const profileFormSchema = z.object({
  name: z
    .string()
    .min(2, {
      message: "Name must be at least 2 characters.",
    })
    .max(30, {
      message: "Name must not be longer than 30 characters.",
    }),
  phone: z.string().optional(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>


export default function ProfileForm() {
  const { toast } = useToast()
  const { currentUser, userProfile } = useAuth()

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: userProfile?.name || "",
      phone: userProfile?.phone || "",
    },
    mode: "onChange",
  })
  
  async function onSubmit(data: ProfileFormValues) {
    if (!currentUser) {
        toast({
            variant: 'destructive',
            title: "Not authenticated",
            description: "You need to be logged in to update your profile.",
        })
        return;
    }
    
    try {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
            name: data.name,
            phone: data.phone,
        });

        toast({
            title: "Profile updated",
            description: "Your profile has been updated successfully.",
        })
    } catch (error) {
        toast({
            variant: 'destructive',
            title: "Update failed",
            description: "Could not update your profile. Please try again.",
        })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Your name" {...field} />
              </FormControl>
              <FormDescription>
                This is the name that will be displayed on your profile and in
                emails.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="Your phone number" {...field} />
              </FormControl>
              <FormDescription>
                Your phone number may be used for event communication.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={form.formState.isSubmitting}>
           {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Update profile
        </Button>
      </form>
    </Form>
  )
}


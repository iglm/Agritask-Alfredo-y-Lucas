"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { Lot } from "@/lib/types"

const lotFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  area: z.coerce.number().positive({ message: "Area must be a positive number." }),
  location: z.string().min(2, { message: "Location is required." }),
  notes: z.string().optional(),
});

type LotFormValues = z.infer<typeof lotFormSchema>

type LotFormProps = {
  lot?: Lot;
  onSubmit: (values: LotFormValues) => void;
};

export function LotForm({ lot, onSubmit }: LotFormProps) {
  const form = useForm<LotFormValues>({
    resolver: zodResolver(lotFormSchema),
    defaultValues: lot || {
      name: "",
      area: 0,
      location: "",
      notes: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lot Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., El Manantial" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="area"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Area (Hectares)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Vereda El Placer" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Technical Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g., Soil type, irrigation details..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">{lot ? "Update Lot" : "Create Lot"}</Button>
      </form>
    </Form>
  )
}

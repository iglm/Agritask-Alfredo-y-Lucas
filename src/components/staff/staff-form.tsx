"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { employmentTypes, type Staff } from "@/lib/types"

const staffFormSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  contact: z.string().min(7, { message: "El número de contacto es obligatorio." }),
  eps: z.string().optional(),
  employmentType: z.enum(employmentTypes),
  baseDailyRate: z.coerce.number().positive({ message: "La tarifa diaria debe ser un número positivo." }),
  certifications: z.string().optional(),
});

type StaffFormValues = z.infer<typeof staffFormSchema>

type StaffFormProps = {
  staffMember?: Staff;
  onSubmit: (values: StaffFormValues) => void;
};

export function StaffForm({ staffMember, onSubmit }: StaffFormProps) {
  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: staffMember || {
      name: "",
      contact: "",
      eps: "",
      employmentType: "Temporal",
      baseDailyRate: 0,
      certifications: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4 max-h-[80vh] overflow-y-auto pr-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre Completo</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Carlos Perez" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="contact"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de Contacto</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: 3101234567" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="eps"
            render={({ field }) => (
              <FormItem>
                <FormLabel>EPS (Opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Sura" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="employmentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Empleo</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {employmentTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="baseDailyRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tarifa Diaria</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="certifications"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Certificaciones (Opcional)</FormLabel>
              <FormControl>
                <Input placeholder="Ej: BPA, Orgánica" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormDescription>Separa las certificaciones por comas.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">{staffMember ? "Actualizar Personal" : "Crear Personal"}</Button>
      </form>
    </Form>
  )
}

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
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  areaHectares: z.coerce.number().positive({ message: "El área debe ser un número positivo." }),
  location: z.string().min(2, { message: "La ubicación es obligatoria." }),
  technicalNotes: z.string().optional(),
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
      areaHectares: 0,
      location: "",
      technicalNotes: "",
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
              <FormLabel>Nombre del Lote</FormLabel>
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
            name="areaHectares"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Área (Hectáreas)</FormLabel>
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
                <FormLabel>Ubicación</FormLabel>
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
          name="technicalNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas Técnicas</FormLabel>
              <FormControl>
                <Textarea placeholder="Ej: Tipo de suelo, detalles de riego..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">{lot ? "Actualizar Lote" : "Crear Lote"}</Button>
      </form>
    </Form>
  )
}

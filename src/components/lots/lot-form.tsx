"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { Lot } from "@/lib/types"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "../ui/calendar"

const lotFormSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  areaHectares: z.coerce.number().positive({ message: "El área debe ser un número positivo." }),
  location: z.string().min(2, { message: "La ubicación es obligatoria." }),
  sowingDate: z.date().optional(),
  sowingDensity: z.coerce.number().optional(),
  totalTrees: z.coerce.number().optional(),
  technicalNotes: z.string().optional(),
});

type LotFormValues = z.infer<typeof lotFormSchema> & {sowingDate?: string};

type LotFormProps = {
  lot?: Lot;
  onSubmit: (values: Omit<Lot, 'id' | 'userId'>) => void;
};

export function LotForm({ lot, onSubmit: handleOnSubmit }: LotFormProps) {
  const form = useForm<LotFormValues>({
    resolver: zodResolver(lotFormSchema),
    defaultValues: {
      ...lot,
      sowingDate: lot?.sowingDate ? new Date(lot.sowingDate) : undefined,
    } || {
      name: "",
      areaHectares: 0,
      location: "",
      technicalNotes: "",
    },
  });

  const onSubmit = (values: LotFormValues) => {
    const dataToSubmit = {
      ...values,
      sowingDate: values.sowingDate ? format(values.sowingDate, 'yyyy-MM-dd') : undefined,
    };
    handleOnSubmit(dataToSubmit);
  }

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
            name="sowingDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha de siembra</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                        {field.value ? format(field.value, "PPP", { locale: es }) : <span>Elige una fecha</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={es} />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="sowingDensity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Densidad de Siembra</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="árboles/Ha" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="totalTrees"
            render={({ field }) => (
              <FormItem>
                <FormLabel># Árboles del Lote</FormLabel>
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

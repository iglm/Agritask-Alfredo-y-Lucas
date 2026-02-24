"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
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
  location: z.string().optional(),
  sowingDate: z.date().optional(),
  sowingDensity: z.coerce.number().optional(),
  distanceBetweenPlants: z.coerce.number().optional(),
  distanceBetweenRows: z.coerce.number().optional(),
  totalTrees: z.coerce.number().optional(),
  technicalNotes: z.string().optional(),
}).refine(data => {
    if (data.totalTrees && data.areaHectares && data.sowingDensity) {
        return data.totalTrees <= data.areaHectares * data.sowingDensity;
    }
    return true;
}, {
    message: "El número de árboles excede la capacidad del lote según la densidad de siembra.",
    path: ["totalTrees"],
});

type LotFormValues = z.infer<typeof lotFormSchema>;

type LotFormProps = {
  lot?: Lot;
  onSubmit: (values: Omit<Lot, 'id' | 'userId'>) => void;
};

export function LotForm({ lot, onSubmit: handleOnSubmit }: LotFormProps) {
  const form = useForm<LotFormValues>({
    resolver: zodResolver(lotFormSchema),
    defaultValues: {
      name: lot?.name ?? "",
      areaHectares: lot?.areaHectares ?? 0,
      location: lot?.location ?? "",
      sowingDate: lot && lot.sowingDate ? new Date(lot.sowingDate.replace(/-/g, '\/')) : undefined,
      sowingDensity: lot?.sowingDensity ?? 0,
      distanceBetweenPlants: lot?.distanceBetweenPlants ?? undefined,
      distanceBetweenRows: lot?.distanceBetweenRows ?? undefined,
      totalTrees: lot?.totalTrees ?? 0,
      technicalNotes: lot?.technicalNotes ?? "",
    },
  });

  const onSubmit = (values: LotFormValues) => {
    const dataToSubmit = {
      ...values,
      sowingDate: values.sowingDate ? format(values.sowingDate, 'yyyy-MM-dd') : undefined,
    };
    handleOnSubmit(dataToSubmit as any);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4 max-h-[80vh] overflow-y-auto pr-4">
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
                  <Input type="number" step="any" {...field} />
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
                <FormLabel>Ubicación (Opcional)</FormLabel>
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
        
        <FormField
          control={form.control}
          name="sowingDensity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Densidad de Siembra (árboles/Ha)</FormLabel>
              <FormControl>
                <Input type="number" step="any" placeholder="e.g., 6000" {...field} />
              </FormControl>
              <FormDescription>Puede calcularse a partir de las distancias o ingresarse directamente.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="distanceBetweenPlants"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Distancia entre Plantas (m)</FormLabel>
                <FormControl>
                  <Input type="number" step="any" placeholder="e.g., 1.5" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="distanceBetweenRows"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Distancia entre Surcos (m)</FormLabel>
                <FormControl>
                  <Input type="number" step="any" placeholder="e.g., 2.5" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="totalTrees"
          render={({ field }) => (
            <FormItem>
              <FormLabel># Árboles del Lote</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormDescription>Debe ser menor o igual que (Área * Densidad).</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
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

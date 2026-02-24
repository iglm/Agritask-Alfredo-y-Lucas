"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { SubLot } from "@/lib/types"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "../ui/calendar"

const subLotFormSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  areaHectares: z.coerce.number().positive({ message: "El área debe ser un número positivo." }),
  sowingDate: z.date().optional(),
  sowingDensity: z.coerce.number().optional(),
  totalTrees: z.coerce.number().optional(),
  technicalNotes: z.string().optional(),
}).refine(data => {
    if (data.totalTrees && data.areaHectares && data.sowingDensity) {
        return data.totalTrees <= data.areaHectares * data.sowingDensity;
    }
    return true;
}, {
    message: "El número de árboles excede la capacidad del sub-lote según la densidad de siembra.",
    path: ["totalTrees"],
});

type SubLotFormValues = z.infer<typeof subLotFormSchema>;

type SubLotFormProps = {
  subLot?: SubLot;
  onSubmit: (values: Omit<SubLot, 'id' | 'userId' | 'lotId'>) => void;
};

export function SubLotForm({ subLot, onSubmit: handleOnSubmit }: SubLotFormProps) {
  const form = useForm<SubLotFormValues>({
    resolver: zodResolver(subLotFormSchema),
    defaultValues: {
      name: subLot?.name ?? "",
      areaHectares: subLot?.areaHectares ?? 0,
      sowingDate: subLot?.sowingDate ? new Date(subLot.sowingDate.replace(/-/g, '\/')) : undefined,
      sowingDensity: subLot?.sowingDensity ?? undefined,
      totalTrees: subLot?.totalTrees ?? undefined,
      technicalNotes: subLot?.technicalNotes ?? "",
    },
  });

  const onSubmit = (values: SubLotFormValues) => {
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
              <FormLabel>Nombre del Sub-lote</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Resiembra 2026" {...field} />
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
            name="sowingDensity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Densidad de Siembra</FormLabel>
                <FormControl>
                  <Input type="number" step="any" placeholder="árboles/Ha" {...field} />
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
                <FormLabel># Árboles</FormLabel>
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
            name="sowingDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha de siembra (Opcional)</FormLabel>
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
          name="technicalNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas Técnicas</FormLabel>
              <FormControl>
                <Textarea placeholder="Ej: Variedad resembrada, tipo de suelo..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">{subLot ? "Actualizar Sub-lote" : "Crear Sub-lote"}</Button>
      </form>
    </Form>
  )
}

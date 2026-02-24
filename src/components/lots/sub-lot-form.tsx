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
import { useEffect } from "react"

const subLotFormSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  areaHectares: z.coerce.number().positive({ message: "El área debe ser un número positivo." }),
  sowingDate: z.date().optional(),
  sowingDensity: z.coerce.number().optional(),
  distanceBetweenPlants: z.coerce.number().optional(),
  distanceBetweenRows: z.coerce.number().optional(),
  totalTrees: z.coerce.number().optional(),
  technicalNotes: z.string().optional(),
}).refine(data => {
    if (data.totalTrees && data.areaHectares && data.sowingDensity) {
        return data.totalTrees <= (data.areaHectares * data.sowingDensity) + 1;
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

// This robustly handles dates that might be strings or Firestore Timestamps
const getInitialDate = (dateValue: any): Date | undefined => {
  if (!dateValue) {
    return undefined;
  }
  if (dateValue instanceof Date) {
    return dateValue;
  }
  // Firestore Timestamps have a toDate() method
  if (typeof dateValue.toDate === 'function') {
    return dateValue.toDate();
  }
  if (typeof dateValue === 'string') {
    // Important: Prevents timezone issues.
    // '2023-10-25' is parsed as UTC midnight, which can be the day before in local time.
    // '2023/10/25' is parsed as local midnight.
    return new Date(dateValue.replace(/-/g, '/'));
  }
  return undefined;
};

export function SubLotForm({ subLot, onSubmit: handleOnSubmit }: SubLotFormProps) {
  const form = useForm<SubLotFormValues>({
    resolver: zodResolver(subLotFormSchema),
    defaultValues: {
      name: subLot?.name ?? "",
      areaHectares: subLot?.areaHectares ?? 0,
      sowingDate: getInitialDate(subLot?.sowingDate),
      sowingDensity: subLot?.sowingDensity ?? undefined,
      distanceBetweenPlants: subLot?.distanceBetweenPlants ?? undefined,
      distanceBetweenRows: subLot?.distanceBetweenRows ?? undefined,
      totalTrees: subLot?.totalTrees ?? undefined,
      technicalNotes: subLot?.technicalNotes ?? "",
    },
  });

  const { watch, setValue } = form;
  const distanceBetweenPlants = watch('distanceBetweenPlants');
  const distanceBetweenRows = watch('distanceBetweenRows');
  const areaHectares = watch('areaHectares');

  useEffect(() => {
    if (distanceBetweenPlants && distanceBetweenRows && distanceBetweenPlants > 0 && distanceBetweenRows > 0) {
      const density = 10000 / (distanceBetweenPlants * distanceBetweenRows);
      setValue('sowingDensity', parseFloat(density.toFixed(2)));
      if (areaHectares && areaHectares > 0) {
        const total = density * areaHectares;
        setValue('totalTrees', Math.floor(total));
      }
    }
  }, [distanceBetweenPlants, distanceBetweenRows, areaHectares, setValue]);

  const onSubmit = (values: SubLotFormValues) => {
    const dataToSubmit = {
      name: values.name,
      areaHectares: values.areaHectares,
      sowingDate: values.sowingDate ? format(values.sowingDate, 'yyyy-MM-dd') : undefined,
      sowingDensity: values.sowingDensity,
      distanceBetweenPlants: values.distanceBetweenPlants,
      distanceBetweenRows: values.distanceBetweenRows,
      totalTrees: values.totalTrees,
      technicalNotes: values.technicalNotes,
    };
    handleOnSubmit(dataToSubmit);
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
                  <Input type="number" step="any" placeholder="Calculada..." {...field} readOnly />
                </FormControl>
                <FormDescription>Se calcula automáticamente.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
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
                <FormLabel># Árboles</FormLabel>
                <FormControl>
                  <Input type="number" {...field} readOnly />
                </FormControl>
                 <FormDescription>Se calcula a partir del área y la densidad.</FormDescription>
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
                <Popover modal={true}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                        {field.value ? format(field.value, "PPP", { locale: es }) : <span>Elige una fecha</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                      locale={es}
                      captionLayout="dropdown-buttons"
                      fromYear={new Date().getFullYear() - 50}
                      toYear={new Date().getFullYear() + 5}
                    />
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

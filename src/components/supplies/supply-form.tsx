"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supplyUnits, type Supply } from "@/lib/types"

const supplyFormSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  unitOfMeasure: z.enum(supplyUnits, { required_error: "Selecciona una unidad de medida." }),
  costPerUnit: z.coerce.number().min(0, { message: "El costo no puede ser negativo." }).default(0),
  currentStock: z.coerce.number().min(0, "El stock no puede ser negativo."),
  supplier: z.string().optional(),
});

type SupplyFormValues = z.infer<typeof supplyFormSchema>

type SupplyFormProps = {
  supply?: Supply;
  onSubmit: (values: Omit<Supply, 'id' | 'userId'>) => void;
};

export function SupplyForm({ supply, onSubmit }: SupplyFormProps) {
  const form = useForm<SupplyFormValues>({
    resolver: zodResolver(supplyFormSchema),
    defaultValues: supply ? {
      ...supply,
      currentStock: supply.currentStock || supply.initialStock,
    } : {
      name: "",
      unitOfMeasure: "Unidad",
      costPerUnit: 0,
      currentStock: 0,
      supplier: "",
    },
  });

  const handleFormSubmit = (values: SupplyFormValues) => {
    onSubmit({
      ...values,
      initialStock: supply?.initialStock ?? values.currentStock, // Preserve initial or set new
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6 pt-4 max-h-[80vh] overflow-y-auto pr-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Insumo</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Fertilizante NPK" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="unitOfMeasure"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Unidad de Medida</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecciona una unidad" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {supplyUnits.map(unit => (
                        <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="costPerUnit"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Costo por Unidad</FormLabel>
                <FormControl>
                    <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="currentStock"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Stock Actual</FormLabel>
                <FormControl>
                    <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
             <FormField
            control={form.control}
            name="supplier"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Proveedor (Opcional)</FormLabel>
                <FormControl>
                    <Input placeholder="Ej: Agro-insumos SAS" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        
        <Button type="submit" className="w-full">{supply ? "Actualizar Insumo" : "Crear Insumo"}</Button>
      </form>
    </Form>
  )
}

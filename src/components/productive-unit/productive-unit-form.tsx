"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { ProductiveUnit } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const formSchema = z.object({
  farmName: z.string().optional(),
  country: z.string().optional(),
  department: z.string().optional(),
  municipality: z.string().optional(),
  vereda: z.string().optional(),
  crops: z.string().optional(),
  varieties: z.string().optional(),
  altitudeRange: z.string().optional(),
  averageTemperature: z.coerce.number().optional(),
  projectStartDate: z.string().optional(),
  totalFarmArea: z.coerce.number().optional(),
  cultivatedArea: z.coerce.number().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type ProductiveUnitFormProps = {
  productiveUnit?: ProductiveUnit | null;
  onSubmit: (values: Omit<ProductiveUnit, 'id' | 'userId'>) => void;
};

export function ProductiveUnitForm({ productiveUnit, onSubmit }: ProductiveUnitFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      farmName: productiveUnit?.farmName ?? "",
      country: productiveUnit?.country ?? "",
      department: productiveUnit?.department ?? "",
      municipality: productiveUnit?.municipality ?? "",
      vereda: productiveUnit?.vereda ?? "",
      crops: productiveUnit?.crops?.join(', ') ?? "",
      varieties: productiveUnit?.varieties?.join(', ') ?? "",
      altitudeRange: productiveUnit?.altitudeRange ?? "",
      averageTemperature: productiveUnit?.averageTemperature ?? undefined,
      projectStartDate: productiveUnit?.projectStartDate ?? "",
      totalFarmArea: productiveUnit?.totalFarmArea ?? undefined,
      cultivatedArea: productiveUnit?.cultivatedArea ?? undefined,
    },
  });

  const { isSubmitting } = form;
  
  function handleFormSubmit(values: FormValues) {
    const { crops, varieties, ...rest } = values;
    const dataToSubmit: Omit<ProductiveUnit, 'id' | 'userId'> = {
      ...rest,
      crops: crops ? crops.split(',').map(c => c.trim()).filter(Boolean) : [],
      varieties: varieties ? varieties.split(',').map(v => v.trim()).filter(Boolean) : [],
    };
    onSubmit(dataToSubmit);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        
        <Accordion type="multiple" defaultValue={['item-1', 'item-2', 'item-3']} className="w-full">
            <AccordionItem value="item-1">
                <AccordionTrigger>1. Información de Ubicación</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                    <FormField control={form.control} name="farmName" render={({ field }) => (
                        <FormItem>
                        <FormLabel>Nombre de la finca</FormLabel>
                        <FormControl><Input placeholder="Ej: Finca La Esperanza" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="country" render={({ field }) => (
                            <FormItem><FormLabel>País</FormLabel><FormControl><Input placeholder="Ej: Colombia" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="department" render={({ field }) => (
                            <FormItem><FormLabel>Departamento</FormLabel><FormControl><Input placeholder="Ej: Antioquia" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="municipality" render={({ field }) => (
                            <FormItem><FormLabel>Municipio</FormLabel><FormControl><Input placeholder="Ej: Jardín" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="vereda" render={({ field }) => (
                            <FormItem><FormLabel>Vereda</FormLabel><FormControl><Input placeholder="Ej: La Salada" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
                <AccordionTrigger>2. Información del Cultivo</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="crops" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Cultivos</FormLabel>
                                <FormControl><Input placeholder="Ej: Café, Plátano, Aguacate" {...field} /></FormControl>
                                <FormDescription>Separa los diferentes cultivos con comas.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="varieties" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Variedades</FormLabel>
                                <FormControl><Input placeholder="Ej: Castillo, Dominico Hartón" {...field} /></FormControl>
                                <FormDescription>Separa las diferentes variedades con comas.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
                <AccordionTrigger>3. Parámetros Generales</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField control={form.control} name="altitudeRange" render={({ field }) => (
                            <FormItem><FormLabel>Rango Altimétrico (msnm)</FormLabel><FormControl><Input placeholder="1700-1850" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="averageTemperature" render={({ field }) => (
                            <FormItem><FormLabel>Temperatura Promedio (°C)</FormLabel><FormControl><Input type="number" step="any" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="projectStartDate" render={({ field }) => (
                            <FormItem><FormLabel>Inicio del Proyecto</FormLabel><FormControl><Input type="month" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="totalFarmArea" render={({ field }) => (
                            <FormItem><FormLabel>Área total de la finca (Ha)</FormLabel><FormControl><Input type="number" step="any" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="cultivatedArea" render={({ field }) => (
                            <FormItem><FormLabel>Área en cultivo (Ha)</FormLabel><FormControl><Input type="number" step="any" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar Cambios
        </Button>
      </form>
    </Form>
  );
}

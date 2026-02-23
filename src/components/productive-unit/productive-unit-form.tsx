"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import type { ProductiveUnit } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const formSchema = z.object({
  farmName: z.string().optional(),
  country: z.string().optional(),
  department: z.string().optional(),
  municipality: z.string().optional(),
  vereda: z.string().optional(),
  shareGps: z.boolean().default(false).optional(),
  crop: z.string().optional(),
  variety: z.string().optional(),
  altitudeRange: z.string().optional(),
  averageTemperature: z.coerce.number().optional(),
  projectStartDate: z.string().optional(),
  totalFarmArea: z.coerce.number().optional(),
  cultivatedArea: z.coerce.number().optional(),
  sowingDensity: z.coerce.number().optional(),
  sowingDistance: z.coerce.number().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type ProductiveUnitFormProps = {
  productiveUnit?: ProductiveUnit | null;
  onSubmit: (values: FormValues) => Promise<void>;
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
      shareGps: productiveUnit?.shareGps ?? false,
      crop: productiveUnit?.crop ?? "",
      variety: productiveUnit?.variety ?? "",
      altitudeRange: productiveUnit?.altitudeRange ?? "",
      averageTemperature: productiveUnit?.averageTemperature ?? undefined,
      projectStartDate: productiveUnit?.projectStartDate ?? "",
      totalFarmArea: productiveUnit?.totalFarmArea ?? undefined,
      cultivatedArea: productiveUnit?.cultivatedArea ?? undefined,
      sowingDensity: productiveUnit?.sowingDensity ?? undefined,
      sowingDistance: productiveUnit?.sowingDistance ?? undefined,
    },
  });

  const { isSubmitting } = form.formState;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        <Accordion type="multiple" defaultValue={['item-1']} className="w-full">
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
                     <FormField control={form.control} name="shareGps" render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            <div className="space-y-1 leading-none">
                            <FormLabel>Compartir Ubicación GPS</FormLabel>
                            <FormDescription>Permitir que la aplicación acceda a tu ubicación GPS (opcional).</FormDescription>
                            </div>
                        </FormItem>
                    )} />
                </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
                <AccordionTrigger>2. Información del Cultivo</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="crop" render={({ field }) => (
                            <FormItem><FormLabel>Cultivo</FormLabel><FormControl><Input placeholder="Ej: Café" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="variety" render={({ field }) => (
                            <FormItem><FormLabel>Variedad</FormLabel><FormControl><Input placeholder="Ej: Castillo" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
                <AccordionTrigger>3. Parámetros de la Finca</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField control={form.control} name="altitudeRange" render={({ field }) => (
                            <FormItem><FormLabel>Rango Altimétrico (msnm)</FormLabel><FormControl><Input placeholder="1700-1850" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="averageTemperature" render={({ field }) => (
                            <FormItem><FormLabel>Temperatura Promedio (°C)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="projectStartDate" render={({ field }) => (
                            <FormItem><FormLabel>Inicio del Proyecto</FormLabel><FormControl><Input type="month" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="totalFarmArea" render={({ field }) => (
                            <FormItem><FormLabel>Área total de la finca (Ha)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="cultivatedArea" render={({ field }) => (
                            <FormItem><FormLabel>Área en cultivo (Ha)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="sowingDensity" render={({ field }) => (
                            <FormItem><FormLabel>Densidad siembra (árboles/Ha)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="sowingDistance" render={({ field }) => (
                            <FormItem><FormLabel>Distancia Siembra (m)</FormLabel><FormControl><Input type="number" placeholder="e.g., 3" {...field} /></FormControl><FormMessage /></FormItem>
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

    
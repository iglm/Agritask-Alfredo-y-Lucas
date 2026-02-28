"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { Lot, ProductiveUnit } from "@/lib/types"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { cn } from "@/lib/utils"
import { format, isValid, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "../ui/calendar"
import { useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const lotFormSchema = z.object({
  productiveUnitId: z.string().min(1, "Debe seleccionar una unidad productiva."),
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  crop: z.string().optional(),
  variety: z.string().optional(),
  areaHectares: z.coerce.number().positive({ message: "El área debe ser un número positivo." }),
  soilType: z.string().optional(),
  phAverage: z.coerce.number().optional(),
  sowingDate: z.date().optional(),
  sowingDensity: z.coerce.number().optional(),
  distanceBetweenPlants: z.coerce.number().optional(),
  distanceBetweenRows: z.coerce.number().optional(),
  totalTrees: z.coerce.number().optional(),
  accumulatedMortality: z.coerce.number().optional(),
  technicalNotes: z.string().optional(),
}).refine(data => {
    if (data.totalTrees && data.areaHectares && data.sowingDensity) {
        return data.totalTrees <= (data.areaHectares * data.sowingDensity) + 1;
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
  productiveUnits: ProductiveUnit[];
};

const getInitialDate = (dateValue: any): Date | undefined => {
  if (!dateValue) {
    return undefined;
  }
  if (dateValue instanceof Date && isValid(dateValue)) {
    return dateValue;
  }
  if (typeof dateValue.toDate === 'function') { // Firestore Timestamp
    return dateValue.toDate();
  }
  if (typeof dateValue === 'string') {
    const parsedDate = parseISO(dateValue);
    if (isValid(parsedDate)) {
      return parsedDate;
    }
  }
  return undefined;
};


export function LotForm({ lot, onSubmit: handleOnSubmit, productiveUnits }: LotFormProps) {
  const form = useForm<LotFormValues>({
    resolver: zodResolver(lotFormSchema),
    defaultValues: {
      productiveUnitId: lot?.productiveUnitId ?? "",
      name: lot?.name ?? "",
      crop: lot?.crop ?? "",
      variety: lot?.variety ?? "",
      areaHectares: lot?.areaHectares ?? undefined,
      sowingDate: getInitialDate(lot?.sowingDate),
      sowingDensity: lot?.sowingDensity ?? undefined,
      distanceBetweenPlants: lot?.distanceBetweenPlants ?? undefined,
      distanceBetweenRows: lot?.distanceBetweenRows ?? undefined,
      totalTrees: lot?.totalTrees ?? undefined,
      accumulatedMortality: lot?.accumulatedMortality ?? undefined,
      technicalNotes: lot?.technicalNotes ?? "",
      soilType: lot?.soilType ?? "",
      phAverage: lot?.phAverage ?? undefined,
    },
  });

  const { watch, setValue } = form;
  const distanceBetweenPlants = watch('distanceBetweenPlants');
  const distanceBetweenRows = watch('distanceBetweenRows');
  const areaHectares = watch('areaHectares');
  const cropValue = watch('crop');

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

  const onSubmit = (values: LotFormValues) => {
    const type = values.crop && values.crop.length > 0 ? 'Productivo' : 'Soporte';
    
    const dataPayload: Record<string, any> = {
      ...values,
      type,
      sowingDate: values.sowingDate ? format(values.sowingDate, 'yyyy-MM-dd') : undefined,
    };
    
    // Firestore does not support 'undefined'. We must remove keys with this value.
    for (const key in dataPayload) {
      if (dataPayload[key] === undefined) {
        delete dataPayload[key];
      }
    }

    handleOnSubmit(dataPayload as Omit<Lot, 'id' | 'userId'>);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4 max-h-[80vh] overflow-y-auto pr-4">
        <Accordion type="multiple" defaultValue={['item-1', 'item-2', lot?.type === 'Productivo' ? 'item-3' : '']} className="w-full">
            <AccordionItem value="item-1">
                <AccordionTrigger>1. Información Principal</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                    <FormField
                      control={form.control}
                      name="productiveUnitId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unidad Productiva</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona la unidad a la que pertenece este lote" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {productiveUnits.map(unit => (
                                <SelectItem key={unit.id} value={unit.id}>{unit.farmName}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Nombre del Lote</FormLabel>
                            <FormControl>
                                <Input placeholder="Ej: El Manantial" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="crop"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Cultivo (si es productivo)</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ej: Café" {...field} value={field.value ?? ''} />
                                </FormControl>
                                <FormDescription>Dejar vacío si es un lote de soporte (vías, etc.).</FormDescription>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="variety"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Variedad (Opcional)</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ej: Castillo" {...field} value={field.value ?? ''} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
                <AccordionTrigger>2. Datos Generales y Ubicación</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
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
                      name="technicalNotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notas Técnicas</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Ej: Tipo de suelo, detalles de riego..." {...field} value={field.value ?? ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </AccordionContent>
            </AccordionItem>
            
            {!!cropValue && (
                <AccordionItem value="item-3">
                    <AccordionTrigger>3. Detalles de Siembra y Cultivo</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="soilType"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipo de Suelo (Opcional)</FormLabel>
                                    <FormControl>
                                    <Input placeholder="Ej: Franco-arcilloso" {...field} value={field.value ?? ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="phAverage"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>pH Promedio (Opcional)</FormLabel>
                                    <FormControl>
                                    <Input type="number" step="0.1" placeholder="Ej: 5.5" {...field} value={field.value ?? ''} />
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
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="distanceBetweenPlants"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Distancia entre Plantas (m)</FormLabel>
                                    <FormControl>
                                    <Input type="number" step="any" placeholder="Ej: 1.5" {...field} value={field.value ?? ''} />
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
                                    <Input type="number" step="any" placeholder="Ej: 2.5" {...field} value={field.value ?? ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="sowingDensity"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Densidad de Siembra (árboles/Ha)</FormLabel>
                                <FormControl>
                                    <Input type="number" step="any" placeholder="Calculado..." {...field} readOnly value={field.value ?? ''} />
                                </FormControl>
                                <FormDescription>Se calcula automáticamente a partir de las distancias.</FormDescription>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                            control={form.control}
                            name="totalTrees"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel># Árboles del Lote</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} readOnly value={field.value ?? ''} />
                                </FormControl>
                                <FormDescription>Calculado del área y densidad.</FormDescription>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                            <FormField
                                control={form.control}
                                name="accumulatedMortality"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Mortalidad Acumulada</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="Ej: 50" {...field} value={field.value ?? ''} />
                                    </FormControl>
                                    <FormDescription># de árboles muertos.</FormDescription>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </AccordionContent>
                </AccordionItem>
            )}
        </Accordion>
        
        <Button type="submit" className="w-full">{lot ? "Actualizar Lote" : "Crear Lote"}</Button>
      </form>
    </Form>
  )
}

"use client"

import { useMemo, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select"
import { type Transaction, type Lot, transactionTypes, incomeCategories, expenseCategories, type ProductiveUnit } from "@/lib/types"
import { cn } from "@/lib/utils"
import { CalendarIcon } from "lucide-react"
import { format, isValid, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { RadioGroup, RadioGroupItem } from "../ui/radio-group"

const transactionFormSchema = z.object({
  type: z.enum(transactionTypes, { required_error: "Debes seleccionar un tipo." }),
  date: z.date({ required_error: "La fecha es obligatoria." }),
  description: z.string().min(3, { message: "La descripción es obligatoria." }),
  amount: z.coerce.number().positive({ message: "El monto debe ser un número positivo." }),
  category: z.string().min(1, { message: "La categoría es obligatoria." }),
  lotId: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionFormSchema>

type TransactionFormProps = {
  transaction?: Transaction;
  onSubmit: (values: Omit<Transaction, 'id' | 'userId'>) => void;
  lots: Lot[];
  productiveUnits: ProductiveUnit[];
};

export function TransactionForm({ transaction, onSubmit, lots, productiveUnits }: TransactionFormProps) {
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    // Initialize with static or prop-based values only.
    defaultValues: {
      type: transaction?.type ?? "Ingreso",
      date: transaction?.date ? parseISO(transaction.date) : undefined,
      description: transaction?.description ?? "",
      amount: transaction?.amount ?? undefined,
      category: transaction?.category ?? "",
      lotId: transaction?.lotId ?? "none",
    },
  });

  useEffect(() => {
    // This effect runs only on the client after mount.
    // It safely sets the date for new transactions without causing a hydration mismatch.
    if (!form.getValues('date')) {
      form.setValue('date', new Date());
    }
  }, [transaction, form]);


  const transactionType = form.watch("type");
  const categories = transactionType === 'Ingreso' ? incomeCategories : expenseCategories;
  
  useEffect(() => {
    // Reset category if type changes and current category is not valid for new type
    if (transactionType && !categories.includes(form.getValues('category'))) {
        form.setValue('category', '');
    }
  }, [transactionType, categories, form]);

  function handleFormSubmit(values: TransactionFormValues) {
    const dataToSubmit = {
      ...values,
      lotId: values.lotId === 'none' ? undefined : values.lotId,
    };
    onSubmit(dataToSubmit);
  }

  const { lotsByUnit, unassignedLots } = useMemo(() => {
    const safeLots = lots || [];
    const safeProductiveUnits = productiveUnits || [];

    const lotsByUnit = safeProductiveUnits
        .map(unit => ({
            unit,
            lots: safeLots.filter(lot => lot.productiveUnitId === unit.id),
        }))
        .filter(group => group.lots.length > 0);
    
    const unassignedLots = safeLots.filter(lot => !lot.productiveUnitId);

    return { lotsByUnit, unassignedLots };
  }, [lots, productiveUnits]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6 pt-4 max-h-[80vh] overflow-y-auto pr-4">
        
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Tipo de Transacción</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex space-x-4"
                >
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl><RadioGroupItem value="Ingreso" /></FormControl>
                    <FormLabel className="font-normal">Ingreso</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl><RadioGroupItem value="Egreso" /></FormControl>
                    <FormLabel className="font-normal">Egreso</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Input placeholder={transactionType === 'Ingreso' ? "Ej: Venta de 500kg de café" : "Ej: Compra de combustible"} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monto</FormLabel>
                <FormControl>
                  <Input type="number" step="any" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha de la Transacción</FormLabel>
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
                      fromYear={new Date().getFullYear() - 5}
                      toYear={new Date().getFullYear()}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Categoría</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecciona una categoría" /></SelectTrigger></FormControl>
                    <SelectContent>
                        {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="lotId"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Lote Asociado (Opcional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Ninguno / Gasto General" /></SelectTrigger></FormControl>
                    <SelectContent>
                        <SelectItem value="none">Ninguno / Gasto General</SelectItem>
                        {lotsByUnit.map(group => (
                            <SelectGroup key={group.unit.id}>
                                <SelectLabel>{group.unit.farmName}</SelectLabel>
                                {group.lots.map(lot => (
                                    <SelectItem key={lot.id} value={lot.id}>{lot.name}</SelectItem>
                                ))}
                            </SelectGroup>
                        ))}
                        {unassignedLots.length > 0 && (
                            <>
                                <SelectSeparator />
                                <SelectGroup>
                                    <SelectLabel>Lotes Sin Unidad Asignada</SelectLabel>
                                    {unassignedLots.map(lot => (
                                        <SelectItem key={lot.id} value={lot.id}>{lot.name}</SelectItem>
                                    ))}
                                </SelectGroup>
                            </>
                        )}
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>
        
        <Button type="submit" className="w-full">{transaction?.id ? "Actualizar Transacción" : "Guardar Transacción"}</Button>
      </form>
    </Form>
  )
}

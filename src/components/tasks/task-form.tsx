"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { taskCategories, type Task, type Lot, type Staff, taskStatuses } from "@/lib/types"
import { cn } from "@/lib/utils"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

const taskFormSchema = z.object({
  type: z.string().min(2, { message: "El tipo de labor es obligatorio." }),
  lotId: z.string({ required_error: "Por favor selecciona un lote." }).min(1, "Por favor selecciona un lote."),
  responsibleId: z.string({ required_error: "Por favor selecciona un responsable." }).min(1, "Por favor selecciona un responsable."),
  category: z.enum(taskCategories),
  startDate: z.date({ required_error: "La fecha de inicio es obligatoria." }),
  endDate: z.date().optional(),
  status: z.enum(taskStatuses, { required_error: "El estado es obligatorio."}),
  plannedJournals: z.coerce.number().min(0, "No puede ser negativo."),
  downtimeMinutes: z.coerce.number().optional(),
  observations: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>

type TaskFormProps = {
  task?: Partial<Task>;
  onSubmit: (values: Omit<Task, 'id' | 'userId'>) => void;
  lots: Lot[];
  staff: Staff[];
};

const defaultFormValues: TaskFormValues = {
    type: "",
    lotId: "",
    responsibleId: "",
    category: "Mantenimiento",
    startDate: new Date(),
    endDate: undefined,
    status: 'Por realizar',
    plannedJournals: 0,
    downtimeMinutes: 0,
    observations: "",
};

export function TaskForm({ task, onSubmit, lots, staff }: TaskFormProps) {
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      ...defaultFormValues,
      ...task,
      startDate: task?.startDate ? new Date(task.startDate) : new Date(),
      endDate: task?.endDate ? new Date(task.endDate) : undefined,
    }
  });

  function handleFormSubmit(values: TaskFormValues) {
    const responsible = staff.find(s => s.id === values.responsibleId);
    if (!responsible) {
        console.error("Responsable no encontrado");
        return;
    };

    let progress: number;
    switch (values.status) {
        case 'Finalizado':
            progress = 100;
            break;
        case 'En Proceso':
            progress = 50; // Default progress for "En Proceso"
            break;
        default:
            progress = 0;
            break;
    }
    
    let plannedCost: number;
    if (task?.id && task.plannedJournals === values.plannedJournals && task.responsibleId === values.responsibleId && typeof task.plannedCost === 'number') {
        plannedCost = task.plannedCost;
    } else {
        plannedCost = values.plannedJournals * responsible.baseDailyRate;
    }

    const actualCost = plannedCost * (progress / 100);

    const fullTaskData: Omit<Task, 'id' | 'userId'> = {
      ...values,
      startDate: format(values.startDate, 'yyyy-MM-dd'),
      endDate: values.endDate ? format(values.endDate, 'yyyy-MM-dd') : undefined,
      progress,
      plannedCost,
      actualCost,
    };
    onSubmit(fullTaskData);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6 pt-4 max-h-[80vh] overflow-y-auto pr-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Labor</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Arado de suelo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="lotId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lote</FormLabel>
                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un lote" /></SelectTrigger></FormControl>
                  <SelectContent><SelectContent>
                    {lots.map(lot => <SelectItem key={lot.id} value={lot.id}>{lot.name}</SelectItem>)}
                  </SelectContent></SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="responsibleId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Responsable(s)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Selecciona una persona" /></SelectTrigger></FormControl>
                  <SelectContent><SelectContent>
                    {staff.map(person => <SelectItem key={person.id} value={person.id}>{person.name}</SelectItem>)}
                  </SelectContent></SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoría</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Selecciona una categoría" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {taskCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cumplimiento</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un estado" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {taskStatuses.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha Inicio</FormLabel>
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
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha Finalización</FormLabel>
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
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
              control={form.control}
              name="plannedJournals"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jornales Planificados</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="downtimeMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tiempo Inactividad (minutos)</FormLabel>
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
          name="observations"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observaciones</FormLabel>
              <FormControl>
                <Textarea placeholder="Ej: Llovió durante 2 horas, se retrasó la labor..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">{task?.id ? "Actualizar Labor" : "Crear Labor"}</Button>
      </form>
    </Form>
  )
}

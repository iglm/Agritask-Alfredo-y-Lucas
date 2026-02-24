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
import { taskCategories, type Task, type Lot, type Staff, taskStatuses, type Supply } from "@/lib/types"
import { cn } from "@/lib/utils"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Slider } from "../ui/slider"
import { SupplyUsageManager } from "./supply-usage-manager"

const taskFormSchema = z.object({
  type: z.string().min(2, { message: "El tipo de labor es obligatorio." }),
  lotId: z.string({ required_error: "Por favor selecciona un lote." }).min(1, "Por favor selecciona un lote."),
  responsibleId: z.string({ required_error: "Por favor selecciona un responsable." }).min(1, "Por favor selecciona un responsable."),
  dependsOn: z.string().optional(),
  category: z.enum(taskCategories),
  startDate: z.date({ required_error: "La fecha de inicio es obligatoria." }),
  endDate: z.date().optional(),
  reentryDate: z.date().optional(),
  status: z.enum(taskStatuses, { required_error: "El estado es obligatorio."}),
  progress: z.coerce.number().min(0).max(100),
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
  tasks: Task[];
  supplies: Supply[];
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

export function TaskForm({ task, onSubmit, lots, staff, tasks, supplies }: TaskFormProps) {
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      type: task?.type ?? "",
      lotId: task?.lotId ?? "",
      responsibleId: task?.responsibleId ?? "",
      dependsOn: task?.dependsOn ?? "",
      category: task?.category ?? "Mantenimiento",
      startDate: getInitialDate(task?.startDate) ?? new Date(),
      endDate: getInitialDate(task?.endDate),
      reentryDate: getInitialDate(task?.reentryDate),
      status: task?.status ?? 'Por realizar',
      progress: task?.progress ?? 0,
      plannedJournals: task?.plannedJournals ?? 0,
      downtimeMinutes: task?.downtimeMinutes ?? 0,
      observations: task?.observations ?? "",
    }
  });

  const availableDependencies = tasks.filter(t => t.id !== task?.id);
  const getLotName = (lotId: string) => lots.find(l => l.id === lotId)?.name || 'Lote no encontrado';

  function handleFormSubmit(values: TaskFormValues) {
    const responsible = staff.find(s => s.id === values.responsibleId);
    if (!responsible) {
        console.error("Responsable no encontrado");
        return;
    };

    const progress = values.progress;
    
    let plannedCost: number;
    // This cost is only for labor
    if (task?.id && task.plannedJournals === values.plannedJournals && task.responsibleId === values.responsibleId && typeof task.plannedCost === 'number') {
        plannedCost = task.plannedCost;
    } else {
        plannedCost = values.plannedJournals * responsible.baseDailyRate;
    }

    // The actual cost in-app is an estimation based on labor progress.
    const actualCost = plannedCost * (progress / 100) + (task?.supplyCost || 0);

    const { dependsOn, ...restOfValues } = values;

    const fullTaskData: Omit<Task, 'id' | 'userId'> = {
      ...restOfValues,
      dependsOn: dependsOn === 'none' ? undefined : dependsOn,
      startDate: format(values.startDate, 'yyyy-MM-dd'),
      endDate: values.endDate ? format(values.endDate, 'yyyy-MM-dd') : undefined,
      reentryDate: values.reentryDate ? format(values.reentryDate, 'yyyy-MM-dd') : undefined,
      progress,
      plannedCost,
      supplyCost: task?.supplyCost || 0, // This is now managed by SupplyUsageManager
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
        </div>

        <FormField
          control={form.control}
          name="dependsOn"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Depende de (Opcional)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Selecciona una labor previa" /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="none">Ninguna</SelectItem>
                  {availableDependencies.map(dep => (
                    <SelectItem key={dep.id} value={dep.id}>
                      {dep.type} ({getLotName(dep.lotId)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>Para que una labor aparezca aquí, primero debe ser creada. La labor actual no podrá iniciarse hasta que su dependencia esté finalizada.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={es} />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="progress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Progreso de la Labor ({field.value}%)</FormLabel>
              <FormControl>
                <Slider
                  defaultValue={[field.value]}
                  onValueChange={(value) => field.onChange(value[0])}
                  max={100}
                  step={1}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
            control={form.control}
            name="reentryDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha Reingreso (Opcional)</FormLabel>
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
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={es} />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

        <div className="space-y-4 rounded-lg border p-4">
            <h3 className="font-medium">Costos y Tiempos</h3>
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
                <FormItem>
                    <FormLabel>Costo Insumos (Auto)</FormLabel>
                    <FormControl>
                        <Input type="text" readOnly disabled value={`$${(task?.supplyCost || 0).toLocaleString()}`} />
                    </FormControl>
                    <FormDescription>Se calcula desde el gestor de insumos.</FormDescription>
                </FormItem>
            </div>
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
        
        {task?.id && (
            <SupplyUsageManager 
                taskId={task.id}
                allSupplies={supplies}
            />
        )}
        
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

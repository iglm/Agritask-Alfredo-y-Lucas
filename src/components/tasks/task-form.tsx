"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { taskCategories, type Task } from "@/lib/types"
import { lots, staff } from "@/lib/data"
import { cn } from "@/lib/utils"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

const taskFormSchema = z.object({
  id: z.string().optional(),
  type: z.string().min(2, { message: "El tipo de labor es obligatorio." }),
  lotId: z.string({ required_error: "Por favor selecciona un lote." }),
  responsibleId: z.string({ required_error: "Por favor selecciona un responsable." }),
  category: z.enum(taskCategories),
  date: z.date({ required_error: "La fecha es obligatoria." }),
  plannedJournals: z.coerce.number().min(0, "No puede ser negativo."),
  progress: z.number().min(0).max(100),
});

type TaskFormValues = z.infer<typeof taskFormSchema>

type TaskFormProps = {
  task?: Task;
  onSubmit: (values: Task) => void;
};

export function TaskForm({ task, onSubmit }: TaskFormProps) {
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
        ...task,
        date: task ? new Date(task.date) : new Date(),
        progress: task ? task.progress : 0,
      } || {
      type: "",
      progress: 0,
      plannedJournals: 0,
      date: new Date(),
    },
  });
  
  const progressValue = form.watch('progress');

  function handleFormSubmit(values: TaskFormValues) {
    const responsible = staff.find(s => s.id === values.responsibleId);
    if (!responsible) return;

    const plannedCost = values.plannedJournals * responsible.dailyRate;
    const actualCost = plannedCost * (values.progress / 100);

    const fullTaskData: Task = {
      id: task?.id || `T${Date.now()}`,
      ...values,
      date: format(values.date, 'yyyy-MM-dd'),
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
                <FormLabel>Responsable</FormLabel>
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
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha</FormLabel>
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
          name="progress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Progreso - {progressValue}%</FormLabel>
              <FormControl>
                <Slider defaultValue={[field.value]} min={0} max={100} step={5} onValueChange={(value) => field.onChange(value[0])} />
              </FormControl>
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">{task ? "Actualizar Labor" : "Crear Labor"}</Button>
      </form>
    </Form>
  )
}

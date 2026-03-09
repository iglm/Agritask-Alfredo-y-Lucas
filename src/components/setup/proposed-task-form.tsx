"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

const proposedTaskSchema = z.object({
  type: z.string().min(2, "El nombre es obligatorio."),
  startDate: z.date({ required_error: "La fecha es obligatoria." }),
  plannedJournals: z.coerce.number().min(0, "Debe ser un número positivo."),
  observations: z.string().optional(),
});

type ProposedTaskFormValues = z.infer<typeof proposedTaskSchema>;

// The type we get from the flow might have more fields
type ProposedTask = {
    category: string;
    lotName: string;
    type: string;
    startDate: string;
    plannedJournals: number;
    observations?: string;
};

type ProposedTaskFormProps = {
  task: ProposedTask;
  onSubmit: (updatedTask: ProposedTask) => void;
};

export function ProposedTaskForm({ task, onSubmit }: ProposedTaskFormProps) {
  const form = useForm<ProposedTaskFormValues>({
    resolver: zodResolver(proposedTaskSchema),
    defaultValues: {
      type: task.type,
      startDate: parseISO(task.startDate),
      plannedJournals: task.plannedJournals,
      observations: task.observations || "",
    },
  });

  const handleFormSubmit = (values: ProposedTaskFormValues) => {
    const updatedTask: ProposedTask = {
      ...task, // Keep original category, lotName etc.
      type: values.type,
      startDate: format(values.startDate, "yyyy-MM-dd"),
      plannedJournals: values.plannedJournals,
      observations: values.observations,
    };
    onSubmit(updatedTask);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de la Labor</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
                <FormItem className="flex flex-col">
                    <FormLabel>Fecha de Inicio</FormLabel>
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
            name="plannedJournals"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Jornales</FormLabel>
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
              <FormLabel>Observaciones (Justificación)</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">Guardar Cambios</Button>
      </form>
    </Form>
  );
}

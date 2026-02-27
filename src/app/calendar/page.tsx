"use client";

import { useState, useEffect } from "react";
import { InteractiveCalendar } from "@/components/calendar/interactive-calendar";
import { TaskForm } from "@/components/tasks/task-form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAppData } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Task } from "@/lib/types";
import { format, addMonths, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";

export default function CalendarPage() {
  const { tasks: allTasks, lots, staff, supplies, isLoading, addTask, updateTask } = useAppData();
  const { toast } = useToast();

  const [currentMonth, setCurrentMonth] = useState<Date>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [editingTask, setEditingTask] = useState<Task | undefined>();

  useEffect(() => {
    setCurrentMonth(new Date());
  }, []);

  const goToNextMonth = () => currentMonth && setCurrentMonth(addMonths(currentMonth, 1));
  const goToPreviousMonth = () => currentMonth && setCurrentMonth(subMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    if (!lots || lots.length === 0) {
        toast({
            variant: "destructive",
            title: "Primero crea un lote",
            description: "Necesitas registrar al menos un lote antes de poder programar una labor.",
        });
        return;
    }

    if (!staff || staff.length === 0) {
        toast({
            variant: "destructive",
            title: "Primero crea personal",
            description: "Necesitas registrar al menos un miembro del personal para poder asignar una labor.",
        });
        return;
    }

    setEditingTask(undefined);
    setSelectedDate(date);
    setIsDialogOpen(true);
  };

  const handleTaskSelect = (task: Task) => {
    setSelectedDate(undefined); // Clear date selection
    setEditingTask(task);
    setIsDialogOpen(true);
  };
  
  const handleFormSubmit = async (values: Omit<Task, 'id' | 'userId'>) => {
    try {
      if (editingTask) {
        await updateTask({ ...values, id: editingTask.id, userId: editingTask.userId });
        toast({
          title: "¡Labor actualizada!",
          description: "La labor ha sido actualizada en tu calendario.",
        });
      } else {
        await addTask(values);
        toast({
          title: "¡Labor creada!",
          description: "La nueva labor ha sido agregada a tu calendario.",
        });
      }
      setIsDialogOpen(false);
      setEditingTask(undefined);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Uh oh! Algo salió mal.",
        description: "No se pudo guardar la labor. Por favor, inténtalo de nuevo.",
      });
    }
  };

  const handleTaskDrop = async (taskId: string, newDate: Date) => {
    const taskToMove = allTasks?.find(t => t.id === taskId);
    if (!taskToMove) return;

    const dependency = allTasks?.find(t => t.id === taskToMove.dependsOn);
    if (dependency && dependency.status !== 'Finalizado') {
        toast({
            variant: "destructive",
            title: "Labor Bloqueada",
            description: `No se puede mover. Esta labor depende de "${dependency.type}", que aún no ha finalizado.`,
        });
        return;
    }

    try {
        await updateTask({ ...taskToMove, startDate: format(newDate, 'yyyy-MM-dd') });
        toast({
            title: "¡Labor reprogramada!",
            description: `${taskToMove.type} se ha movido al ${format(newDate, "PPP", { locale: es })}.`,
        });
    } catch (error) {
        console.error("Error updating task date:", error);
        toast({
            variant: "destructive",
            title: "Error al reprogramar",
            description: "No se pudo mover la labor. Inténtalo de nuevo.",
        });
    }
  };
  
  const taskForForm = editingTask || (selectedDate ? {
    startDate: format(selectedDate, 'yyyy-MM-dd'),
    status: 'Por realizar',
  } : undefined);

  if (isLoading || !currentMonth) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground capitalize flex-1">
          {format(currentMonth, "MMMM yyyy", { locale: es })}
        </h1>
        <div className="flex items-center gap-2">
           <Button variant="outline" size="sm" onClick={goToToday}>
            Hoy
          </Button>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Mes anterior</span>
          </Button>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Mes siguiente</span>
          </Button>
        </div>
      </div>
      
      <div className="flex-1 min-h-0">
        <InteractiveCalendar 
            tasks={allTasks} 
            onDateSelect={handleDateSelect}
            onTaskSelect={handleTaskSelect}
            onTaskDrop={handleTaskDrop}
            currentMonth={currentMonth}
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(isOpen) => { setIsDialogOpen(isOpen); if (!isOpen) setEditingTask(undefined); }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Editar Labor' : 'Programar Nueva Labor'}</DialogTitle>
            <DialogDescription>
              {editingTask 
                ? `Editando la labor: ${editingTask.type}`
                : `Crea una nueva labor para ${selectedDate ? format(selectedDate, "PPP", { locale: es }) : ""}. Haz clic en guardar cuando termines.`
              }
            </DialogDescription>
          </DialogHeader>
          <TaskForm 
            task={taskForForm}
            onSubmit={handleFormSubmit}
            lots={lots}
            staff={staff}
            tasks={allTasks}
            supplies={supplies}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

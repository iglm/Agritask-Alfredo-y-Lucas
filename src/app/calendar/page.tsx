"use client";

import { useState } from "react";
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
  const { tasks: allTasks, lots, staff, isLoading, addTask } = useAppData();
  const { toast } = useToast();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());


  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    setIsDialogOpen(true);
  };
  
  const handleFormSubmit = async (values: Omit<Task, 'id' | 'userId'>) => {
    try {
      await addTask(values);
      toast({
        title: "¡Labor creada!",
        description: "La nueva labor ha sido agregada a tu calendario.",
      });
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Uh oh! Algo salió mal.",
        description: "No se pudo guardar la labor. Por favor, inténtalo de nuevo.",
      });
    }
  };

  const taskForForm = selectedDate ? {
    startDate: selectedDate.toISOString(),
    status: 'Por realizar',
  } : undefined;

  if (isLoading) {
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
            tasks={allTasks || []} 
            onDateSelect={handleDateSelect}
            currentMonth={currentMonth}
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Programar Nueva Labor</DialogTitle>
            <DialogDescription>
              Crea una nueva labor para {selectedDate ? format(selectedDate, "PPP", { locale: es }) : ""}. Haz clic en guardar cuando termines.
            </DialogDescription>
          </DialogHeader>
          <TaskForm 
            task={taskForForm}
            onSubmit={handleFormSubmit}
            lots={lots || []}
            staff={staff || []}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

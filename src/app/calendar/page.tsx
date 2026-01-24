"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { InteractiveCalendar } from "@/components/calendar/interactive-calendar";
import { TaskForm } from "@/components/tasks/task-form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useUser, useAppData } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Task } from "@/lib/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { UpgradeDialog } from "@/components/subscriptions/upgrade-dialog";

const TASK_LIMIT = 20;

export default function CalendarPage() {
  const { profile } = useUser();
  const { tasks: allTasks, lots, staff, isLoading, addTask } = useAppData();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    if (profile?.subscription === 'free' && allTasks && allTasks.length >= TASK_LIMIT) {
      setIsUpgradeDialogOpen(true);
    } else {
      setSelectedDate(date);
      setIsDialogOpen(true);
    }
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
    date: selectedDate,
    progress: 0,
  } : undefined;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Calendario" />
      <div>
        <InteractiveCalendar tasks={allTasks || []} onDateSelect={handleDateSelect} />
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
      <UpgradeDialog
        open={isUpgradeDialogOpen}
        onOpenChange={setIsUpgradeDialogOpen}
        featureName="labores"
        limit={TASK_LIMIT}
      />
    </div>
  );
}

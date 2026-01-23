"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { InteractiveCalendar } from "@/components/calendar/interactive-calendar";
import { TaskForm } from "@/components/tasks/task-form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { tasks as allTasks } from "@/lib/data";
import { Task } from "@/lib/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function CalendarPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setIsDialogOpen(true);
  };
  
  const handleFormSubmit = (task: Task) => {
    console.log("Form submitted for task:", task);
    setIsDialogOpen(false);
  };

  const taskForForm = selectedDate ? {
    id: '',
    type: '',
    progress: 0,
    plannedJournals: 0,
    date: format(selectedDate, 'yyyy-MM-dd'),
    lotId: '',
    responsibleId: '',
    category: 'Mantenimiento',
    plannedCost: 0,
    actualCost: 0,
  } as Task : undefined;

  return (
    <div>
      <PageHeader title="Agenda Operativa" />
      <InteractiveCalendar tasks={allTasks} onDateSelect={handleDateSelect} />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Programar Nueva Labor</DialogTitle>
            <DialogDescription>
              Crea una nueva labor para {selectedDate ? format(selectedDate, "PPP", { locale: es }) : ""}. Haz clic en guardar cuando termines.
            </DialogDescription>
          </DialogHeader>
          <TaskForm task={taskForForm} onSubmit={handleFormSubmit} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

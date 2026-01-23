"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { InteractiveCalendar } from "@/components/calendar/interactive-calendar";
import { TaskForm } from "@/components/tasks/task-form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCollection, useFirebase, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where, doc, addDoc, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Lot, Staff, Task } from "@/lib/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { UpgradeDialog } from "@/components/subscriptions/upgrade-dialog";

const TASK_LIMIT = 20;

export default function CalendarPage() {
  const { firestore } = useFirebase();
  const { user, profile } = useUser();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);

  // Fetch all data needed
  const tasksQuery = useMemoFirebase(() => user ? query(collection(firestore, 'tasks'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: allTasks, isLoading: tasksLoading } = useCollection<Task>(tasksQuery);

  const lotsQuery = useMemoFirebase(() => user ? query(collection(firestore, 'lots'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: lots, isLoading: lotsLoading } = useCollection<Lot>(lotsQuery);

  const staffQuery = useMemoFirebase(() => user ? query(collection(firestore, 'staff'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: staff, isLoading: staffLoading } = useCollection<Staff>(staffQuery);

  const isLoading = tasksLoading || lotsLoading || staffLoading;

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
    if (!user || !firestore) return;

    try {
      const newDocRef = doc(collection(firestore, "tasks"));
      await setDoc(newDocRef, { ...values, id: newDocRef.id, userId: user.uid });
      toast({
        title: "¡Labor creada!",
        description: "La nueva labor ha sido agregada a tu agenda.",
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
      <PageHeader title="Agenda Operativa" />
      <InteractiveCalendar tasks={allTasks || []} onDateSelect={handleDateSelect} />

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

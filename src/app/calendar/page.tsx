"use client";

import { useState, useEffect } from "react";
import { InteractiveCalendar } from "@/components/calendar/interactive-calendar";
import { TaskForm } from "@/components/tasks/task-form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useFirebase, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Task, Lot, Staff, Supply, SupplyUsage, Transaction } from "@/lib/types";
import { format, addMonths, subMonths, addDays, addWeeks } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { collection, query, where, doc, setDoc, getDoc, writeBatch, getDocs } from 'firebase/firestore';

export default function CalendarPage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  // Data Queries
  const tasksQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'tasks'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: allTasks, isLoading: isTasksLoading } = useCollection<Task>(tasksQuery);
  
  const lotsQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'lots'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: lots, isLoading: isLotsLoading } = useCollection<Lot>(lotsQuery);

  const staffQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'staff'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: staff, isLoading: isStaffLoading } = useCollection<Staff>(staffQuery);

  const suppliesQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'supplies'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: supplies, isLoading: isSuppliesLoading } = useCollection<Supply>(suppliesQuery);

  const isLoading = isTasksLoading || isLotsLoading || isStaffLoading || isSuppliesLoading;

  const [currentMonth, setCurrentMonth] = useState<Date>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [editingTask, setEditingTask] = useState<Task | undefined>();

  useEffect(() => {
    setCurrentMonth(new Date());
  }, []);

  const handleWriteError = (error: any, path: string, operation: 'create' | 'update' | 'delete', requestResourceData?: any) => {
    console.error(`CalendarPage Task Error (${operation} on ${path}):`, error);
    errorEmitter.emit('permission-error', new FirestorePermissionError({ path, operation, requestResourceData }));
  };

  const addTask = async (data: Omit<Task, 'id' | 'userId'>): Promise<Task> => {
    if (!user || !firestore) throw new Error("Not authenticated");
    const newDocRef = doc(collection(firestore, 'tasks'));
    const newTask: Task = { ...data, id: newDocRef.id, userId: user.uid };
    try {
        await setDoc(newDocRef, newTask);
        return newTask;
    } catch (error) {
        handleWriteError(error, newDocRef.path, 'create', newTask);
        throw error;
    }
  };

  const updateTask = async (data: Task) => {
    if (!user || !firestore) return;
    const docRef = doc(firestore, 'tasks', data.id);
    try {
        const originalTask = allTasks?.find(t => t.id === data.id);
        const isNowFinalized = data.status === 'Finalizado' && originalTask?.status !== 'Finalizado';

        await setDoc(docRef, { ...data, userId: user.uid }, { merge: true });

        if (isNowFinalized) {
            const laborCost = data.actualCost - data.supplyCost;
            if (laborCost > 0) {
                const transactionData: Omit<Transaction, 'id' | 'userId'> = {
                    type: 'Egreso',
                    date: data.endDate || data.startDate,
                    description: `Costo de mano de obra para la labor: ${data.type}`,
                    amount: laborCost,
                    category: 'Mano de Obra',
                    lotId: data.lotId,
                };
                const newTransactionRef = doc(collection(firestore, 'transactions'));
                await setDoc(newTransactionRef, { ...transactionData, id: newTransactionRef.id, userId: user.uid });
                toast({ title: 'Cierre Financiero Automático', description: `Se creó un egreso de $${laborCost.toLocaleString()} por la mano de obra.` });
            }
        }
        
        if (isNowFinalized && data.isRecurring && data.recurrenceFrequency && data.recurrenceInterval && data.recurrenceInterval > 0) {
            const baseDateString = data.endDate || data.startDate;
            const baseDateForRecurrence = new Date(baseDateString.replace(/-/g, '/'));
            let newStartDate: Date;

            switch (data.recurrenceFrequency) {
                case 'días': newStartDate = addDays(baseDateForRecurrence, data.recurrenceInterval); break;
                case 'semanas': newStartDate = addWeeks(baseDateForRecurrence, data.recurrenceInterval); break;
                case 'meses': newStartDate = addMonths(baseDateForRecurrence, data.recurrenceInterval); break;
                default: console.error("Invalid recurrence frequency"); return;
            }

            const { id, userId, endDate, status, progress, supplyCost, actualCost, ...restOfTaskData } = data;
            const nextTaskData: Omit<Task, 'id' | 'userId'> = { ...restOfTaskData, startDate: format(newStartDate, 'yyyy-MM-dd'), endDate: undefined, status: 'Por realizar', progress: 0, supplyCost: 0, actualCost: 0, observations: `Labor recurrente generada automáticamente.`, dependsOn: undefined, };
            await addTask(nextTaskData);
            toast({ title: 'Labor recurrente creada', description: `Se ha programado la siguiente labor "${data.type}" para el ${format(newStartDate, "PPP", { locale: es })}.` });
        }
    } catch (error) {
        handleWriteError(error, docRef.path, 'update', { ...data, userId: user.uid });
    }
  };

  const addSupplyUsage = async (taskId: string, supplyId: string, quantityUsed: number, date: string): Promise<SupplyUsage> => {
    if (!user || !firestore) throw new Error("Not authenticated");
    const taskRef = doc(firestore, 'tasks', taskId);
    const supplyRef = doc(firestore, 'supplies', supplyId);
    const usageRef = doc(collection(firestore, 'tasks', taskId, 'supplyUsages'));
    const batch = writeBatch(firestore);

    try {
        const [taskDoc, supplyDoc] = await Promise.all([getDoc(taskRef), getDoc(supplyDoc)]);
        if (!taskDoc.exists() || !supplyDoc.exists()) throw new Error('La labor o el insumo no existen.');
        const taskData = taskDoc.data() as Task;
        const supplyData = supplyDoc.data() as Supply;
        if (quantityUsed > supplyData.currentStock) throw new Error('Stock insuficiente.');

        const costAtTimeOfUse = supplyData.costPerUnit * quantityUsed;
        const newUsage: SupplyUsage = { id: usageRef.id, userId: user.uid, taskId, supplyId, supplyName: supplyData.name, quantityUsed, costAtTimeOfUse, date };
        
        batch.set(usageRef, newUsage);
        batch.update(taskRef, { supplyCost: (taskData.supplyCost || 0) + costAtTimeOfUse, actualCost: (taskData.actualCost || 0) + costAtTimeOfUse });
        batch.update(supplyRef, { currentStock: supplyData.currentStock - quantityUsed });

        await batch.commit();
        return newUsage;
    } catch (error: any) {
        handleWriteError(error, usageRef.path, 'create', { taskId, supplyId, quantityUsed, date });
        throw error;
    }
  };

    const deleteSupplyUsage = async (usage: SupplyUsage) => {
    if (!user || !firestore) return;
    const { id, taskId, supplyId, quantityUsed, costAtTimeOfUse } = usage;
    const taskRef = doc(firestore, 'tasks', taskId);
    const supplyRef = doc(firestore, 'supplies', supplyId);
    const usageRef = doc(firestore, 'tasks', taskId, 'supplyUsages', id);
    const batch = writeBatch(firestore);

    try {
        const [taskDoc, supplyDoc] = await Promise.all([getDoc(taskRef), getDoc(supplyRef)]);
        if (taskDoc.exists()) {
            const taskData = taskDoc.data() as Task;
            batch.update(taskRef, { supplyCost: Math.max(0, (taskData.supplyCost || 0) - costAtTimeOfUse), actualCost: Math.max(0, (taskData.actualCost || 0) - costAtTimeOfUse) });
        }
        if (supplyDoc.exists()) {
            const supplyData = supplyDoc.data() as Supply;
            batch.update(supplyRef, { currentStock: (supplyData.currentStock || 0) + quantityUsed });
        }
        batch.delete(usageRef);
        await batch.commit();
    } catch (error: any) {
        handleWriteError(error, usageRef.path, 'delete');
        throw error;
    }
  };

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
            tasks={allTasks || []} 
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
            lots={lots || []}
            staff={staff || []}
            tasks={allTasks || []}
            supplies={supplies || []}
            addSupplyUsage={addSupplyUsage}
            deleteSupplyUsage={deleteSupplyUsage}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

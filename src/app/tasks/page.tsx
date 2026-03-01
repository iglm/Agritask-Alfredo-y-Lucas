"use client";

import { useState, useEffect } from "react";
import { TasksTable } from "@/components/tasks/tasks-table";
import { TaskForm } from "@/components/tasks/task-form";
import { PageHeader } from "@/components/page-header";
import { taskCategories, type Task, type Staff, type Lot, type Supply, type SupplyUsage } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCollection, useFirebase, useMemoFirebase, errorEmitter, FirestorePermissionError } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { collection, query, where, doc, setDoc, deleteDoc, writeBatch, getDocs, getDoc } from 'firebase/firestore';
import { format, addDays, addWeeks, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';

export default function TasksPage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

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
  
  useEffect(() => {
    let tasksToFilter = allTasks || [];

    if (filterCategory !== 'all') {
        tasksToFilter = tasksToFilter.filter(task => task.category === filterCategory);
    }

    if (searchTerm) {
        tasksToFilter = tasksToFilter.filter(task => 
            task.type.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    setFilteredTasks(tasksToFilter);
  }, [allTasks, filterCategory, searchTerm]);
  
  // Action Handlers
  const handleWriteError = (error: any, path: string, operation: 'create' | 'update' | 'delete', requestResourceData?: any) => {
    console.error(`TasksPage Error (${operation} on ${path}):`, error);
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

  const deleteTask = async (id: string) => {
    if (!user || !firestore) return;
    const taskRef = doc(firestore, 'tasks', id);
    try {
        const batch = writeBatch(firestore);
        const usagesQuery = collection(firestore, 'tasks', id, 'supplyUsages');
        const usagesSnapshot = await getDocs(usagesQuery);
        const stockUpdates = new Map<string, number>();

        usagesSnapshot.forEach(usageDoc => {
            const usageData = usageDoc.data() as SupplyUsage;
            const currentStockUpdate = stockUpdates.get(usageData.supplyId) || 0;
            stockUpdates.set(usageData.supplyId, currentStockUpdate + usageData.quantityUsed);
            batch.delete(usageDoc.ref);
        });
        
        for (const [supplyId, quantityToRevert] of stockUpdates.entries()) {
            const supplyRef = doc(firestore, 'supplies', supplyId);
            const supplyDoc = await getDoc(supplyRef);
            if (supplyDoc.exists()) {
                const supplyData = supplyDoc.data() as Supply;
                batch.update(supplyRef, { currentStock: supplyData.currentStock + quantityToRevert });
            }
        }
        batch.delete(taskRef);
        await batch.commit();
    } catch (error) {
        handleWriteError(error, taskRef.path, 'delete');
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
        const [taskDoc, supplyDoc] = await Promise.all([getDoc(taskRef), getDoc(supplyDoc)]);
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

  const handleFilterByCategory = (category: string) => setFilterCategory(category);

  const handleAddTask = () => {
    if (!lots || lots.length === 0) {
      toast({ variant: "destructive", title: "Primero crea un lote", description: "Necesitas registrar al menos un lote antes de poder programar una labor." });
      return;
    }
    if (!staff || staff.length === 0) {
      toast({ variant: "destructive", title: "Primero crea un colaborador", description: "Necesitas registrar al menos un colaborador para poder asignar una labor." });
      return;
    }
    setEditingTask(undefined);
    setIsSheetOpen(true);
  };
  
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsSheetOpen(true);
  };
  
  const handleDeleteRequest = (task: Task) => {
    setTaskToDelete(task);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!taskToDelete) return;
    deleteTask(taskToDelete.id);
    toast({ title: "Labor eliminada", description: `La labor "${taskToDelete.type}" ha sido eliminada.` });
    setIsDeleteDialogOpen(false);
    setTaskToDelete(null);
  };

  const handleFormSubmit = (values: Omit<Task, 'id' | 'userId'>) => {
    if (editingTask) {
      updateTask({ ...values, id: editingTask.id, userId: editingTask.userId });
      toast({ title: "¡Labor actualizada!", description: "Los detalles de la labor han sido actualizados." });
    } else {
      addTask(values);
      toast({ title: "¡Labor creada!", description: "La nueva labor ha sido agregada a tu lista." });
    }
    setIsSheetOpen(false);
    setEditingTask(undefined);
  };

  return (
    <div>
      <PageHeader title="Gestión de Labores" actionButtonText="Agregar Nueva Labor" onActionButtonClick={handleAddTask}>
        <div className="flex items-center gap-2">
          <Input 
              placeholder="Buscar por tipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-[200px]"
            />
          <Select onValueChange={handleFilterByCategory} defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las Categorías</SelectItem>
              {taskCategories.map((category) => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PageHeader>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <TasksTable tasks={filteredTasks} allTasks={allTasks || []} lots={lots || []} staff={staff || []} onEdit={handleEditTask} onDelete={handleDeleteRequest} onAdd={handleAddTask} />
      )}

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>{editingTask ? 'Editar Labor' : 'Crear una Nueva Labor'}</SheetTitle>
            <SheetDescription>
              {editingTask ? 'Actualiza los detalles de esta labor.' : 'Completa los detalles para la nueva labor.'}
            </SheetDescription>
          </SheetHeader>
          <TaskForm 
            task={editingTask} 
            onSubmit={handleFormSubmit} 
            lots={lots || []} 
            staff={staff || []} 
            tasks={allTasks || []}
            supplies={supplies || []}
            addSupplyUsage={addSupplyUsage}
            deleteSupplyUsage={deleteSupplyUsage}
          />
        </SheetContent>
      </Sheet>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente la labor <span className="font-bold">{taskToDelete?.type}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              <Trash2 className="mr-2 h-4 w-4" />
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

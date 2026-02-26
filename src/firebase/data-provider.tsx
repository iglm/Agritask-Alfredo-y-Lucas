'use client';
import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useUser, useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, setDoc, deleteDoc, getDocs, writeBatch, getDoc, serverTimestamp, collectionGroup, orderBy } from 'firebase/firestore';
import { Lot, Staff, Task, ProductiveUnit, SubLot, Supply, SupplyUsage, Transaction } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from './error-emitter';
import { FirestorePermissionError } from './errors';
import { format, addDays, addWeeks, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { User } from 'firebase/auth';

interface DataContextState {
  lots: Lot[] | null;
  staff: Staff[] | null;
  tasks: Task[] | null;
  supplies: Supply[] | null;
  productiveUnits: ProductiveUnit[] | null;
  transactions: Transaction[] | null;
  supplyUsages: SupplyUsage[] | null;
  user: User | null;
  isLoading: boolean;
  firestore: ReturnType<typeof useFirebase>['firestore'];
  addLot: (data: Omit<Lot, 'id' | 'userId'>) => Promise<Lot>;
  updateLot: (data: Lot) => Promise<void>;
  deleteLot: (id: string) => Promise<void>;
  addSubLot: (lotId: string, data: Omit<SubLot, 'id' | 'userId' | 'lotId'>) => Promise<SubLot>;
  updateSubLot: (subLot: SubLot) => Promise<void>;
  deleteSubLot: (lotId: string, subLotId: string) => Promise<void>;
  addStaff: (data: Omit<Staff, 'id' | 'userId'>) => Promise<Staff>;
  updateStaff: (data: Staff) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;
  addTask: (data: Omit<Task, 'id' | 'userId'>) => Promise<Task>;
  updateTask: (data: Task) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addSupply: (data: Omit<Supply, 'id' | 'userId'>) => Promise<Supply>;
  updateSupply: (data: Supply) => Promise<void>;
  deleteSupply: (id: string) => Promise<void>;
  addSupplyUsage: (taskId: string, supplyId: string, quantityUsed: number, date: string) => Promise<SupplyUsage>;
  deleteSupplyUsage: (usage: SupplyUsage) => Promise<void>;
  addProductiveUnit: (data: Omit<ProductiveUnit, 'id' | 'userId'>) => Promise<ProductiveUnit>;
  updateProductiveUnit: (data: ProductiveUnit) => Promise<void>;
  deleteProductiveUnit: (id: string) => Promise<void>;
  addTransaction: (data: Omit<Transaction, 'id' | 'userId'>) => Promise<Transaction>;
  updateTransaction: (data: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextState | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user, firestore, isUserLoading } = useFirebase();
  const { toast } = useToast();

  const lotsQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'lots'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const staffQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'staff'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const tasksQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'tasks'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const suppliesQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'supplies'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const productiveUnitsQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'productiveUnits'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const transactionsQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'transactions'), where('userId', '==', user.uid), orderBy('date', 'desc')) : null, [firestore, user]);
  const supplyUsagesQuery = useMemoFirebase(() => user && firestore ? query(collectionGroup(firestore, 'supplyUsages'), where('userId', '==', user.uid)) : null, [firestore, user]);

  const { data: lots, isLoading: lotsLoading } = useCollection<Lot>(lotsQuery);
  const { data: staff, isLoading: staffLoading } = useCollection<Staff>(staffQuery);
  const { data: tasks, isLoading: tasksLoading } = useCollection<Task>(tasksQuery);
  const { data: supplies, isLoading: suppliesLoading } = useCollection<Supply>(suppliesQuery);
  const { data: productiveUnits, isLoading: productiveUnitsLoading } = useCollection<ProductiveUnit>(productiveUnitsQuery);
  const { data: transactions, isLoading: transactionsLoading } = useCollection<Transaction>(transactionsQuery);
  const { data: supplyUsages, isLoading: supplyUsagesLoading } = useCollection<SupplyUsage>(supplyUsagesQuery);


  const ensureAuth = () => {
    if (!user || !firestore) {
        toast({ variant: 'destructive', title: 'Error de autenticación', description: 'Debes iniciar sesión para realizar esta acción.' });
        return false;
    }
    return true;
  }

  const handleWriteError = (error: any, path: string, operation: 'create' | 'update' | 'delete', requestResourceData?: any) => {
    console.error(`DataProvider Error (${operation} on ${path}):`, error);
    errorEmitter.emit('permission-error', new FirestorePermissionError({ path, operation, requestResourceData }));
  };

  const addLot = async (data: Omit<Lot, 'id' | 'userId'>): Promise<Lot> => {
    if (!ensureAuth()) throw new Error("Not authenticated");
    const newDocRef = doc(collection(firestore, 'lots'));
    const newLot: Lot = { ...data, id: newDocRef.id, userId: user.uid };
    try {
        await setDoc(newDocRef, newLot);
        return newLot;
    } catch (error) {
        handleWriteError(error, newDocRef.path, 'create', newLot);
        throw error;
    }
  };

  const updateLot = async (data: Lot) => {
    if (!ensureAuth()) return;
    const docRef = doc(firestore, 'lots', data.id);
    try {
        await setDoc(docRef, { ...data, userId: user.uid }, { merge: true });
    } catch (error) {
        handleWriteError(error, docRef.path, 'update', { ...data, userId: user.uid });
    }
  };

  const deleteLot = async (id: string) => {
    if (!ensureAuth()) return;
    const lotRef = doc(firestore, 'lots', id);
    try {
        const batch = writeBatch(firestore);
        
        // 1. Delete sub-lots
        const sublotsQuery = query(collection(firestore, 'lots', id, 'sublots'));
        const sublotsSnapshot = await getDocs(sublotsQuery);
        sublotsSnapshot.forEach(doc => batch.delete(doc.ref));

        // 2. Process and delete tasks (and their subcollections)
        const tasksQuery = query(collection(firestore, 'tasks'), where('userId', '==', user.uid), where('lotId', '==', id));
        const tasksSnapshot = await getDocs(tasksQuery);

        for (const taskDoc of tasksSnapshot.docs) {
            const usagesQuery = collection(firestore, 'tasks', taskDoc.id, 'supplyUsages');
            const usagesSnapshot = await getDocs(usagesQuery);
            usagesSnapshot.forEach(usageDoc => {
                batch.delete(usageDoc.ref); // Delete supply usages
            });
            batch.delete(taskDoc.ref); // Delete the task
        }

        // 3. Delete financial transactions associated with the lot
        const transactionsQuery = query(collection(firestore, 'transactions'), where('userId', '==', user.uid), where('lotId', '==', id));
        const transactionsSnapshot = await getDocs(transactionsQuery);
        transactionsSnapshot.forEach(doc => batch.delete(doc.ref));

        // 4. Delete the main lot
        batch.delete(lotRef);
        
        await batch.commit();

    } catch (error) {
        handleWriteError(error, lotRef.path, 'delete');
    }
  };

  const addStaff = async (data: Omit<Staff, 'id' | 'userId'>): Promise<Staff> => {
    if (!ensureAuth()) throw new Error("Not authenticated");
    const newDocRef = doc(collection(firestore, 'staff'));
    const newStaff: Staff = { ...data, id: newDocRef.id, userId: user.uid };
    try {
        await setDoc(newDocRef, newStaff);
        return newStaff;
    } catch (error) {
        handleWriteError(error, newDocRef.path, 'create', newStaff);
        throw error;
    }
  };

  const updateStaff = async (data: Staff) => {
    if (!ensureAuth()) return;
    const docRef = doc(firestore, 'staff', data.id);
    try {
        await setDoc(docRef, { ...data, userId: user.uid }, { merge: true });
    } catch (error) {
        handleWriteError(error, docRef.path, 'update', { ...data, userId: user.uid });
    }
  };

  const deleteStaff = async (id: string) => {
    if (!ensureAuth()) return;
    const tasksSnapshot = await getDocs(query(collection(firestore, 'tasks'), where('userId', '==', user.uid), where('responsibleId', '==', id), where('status', '!=', 'Finalizado')));
    if (!tasksSnapshot.empty) {
        throw new Error(`Este colaborador está asignado a ${tasksSnapshot.size} labor(es) no finalizada(s). Reasigna o finaliza estas labores primero.`);
    }
    const docRef = doc(firestore, 'staff', id);
    try {
        await deleteDoc(docRef);
    } catch (error) {
        handleWriteError(error, docRef.path, 'delete');
    }
  };

  const addTask = async (data: Omit<Task, 'id' | 'userId'>): Promise<Task> => {
    if (!ensureAuth()) throw new Error("Not authenticated");
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
    if (!ensureAuth()) return;
    const docRef = doc(firestore, 'tasks', data.id);
    try {
        const originalTask = tasks?.find(t => t.id === data.id);
        
        // This is a crucial check to prevent infinite loops.
        // We only proceed if the status is changing TO 'Finalizado'.
        const isNowFinalized = data.status === 'Finalizado' && originalTask?.status !== 'Finalizado';

        await setDoc(docRef, { ...data, userId: user.uid }, { merge: true });

        // --- Automated Financial Closing ---
        if (isNowFinalized) {
            const laborCost = data.actualCost - data.supplyCost;
            if (laborCost > 0) {
                const transactionData: Omit<Transaction, 'id' | 'userId'> = {
                    type: 'Egreso',
                    date: data.endDate || data.startDate, // Use end date if available, otherwise start date
                    description: `Costo de mano de obra para la labor: ${data.type}`,
                    amount: laborCost,
                    category: 'Mano de Obra',
                    lotId: data.lotId,
                };
                await addTransaction(transactionData);
                toast({
                    title: 'Cierre Financiero Automático',
                    description: `Se creó un egreso de $${laborCost.toLocaleString()} por la mano de obra.`,
                });
            }
        }
        
        // --- Automated Task Recurrence ---
        if (
            isNowFinalized &&
            data.isRecurring &&
            data.recurrenceFrequency &&
            data.recurrenceInterval &&
            data.recurrenceInterval > 0
        ) {
            const oldStartDate = new Date(data.startDate.replace(/-/g, '/'));
            let newStartDate: Date;

            switch (data.recurrenceFrequency) {
                case 'días':
                    newStartDate = addDays(oldStartDate, data.recurrenceInterval);
                    break;
                case 'semanas':
                    newStartDate = addWeeks(oldStartDate, data.recurrenceInterval);
                    break;
                case 'meses':
                    newStartDate = addMonths(oldStartDate, data.recurrenceInterval);
                    break;
                default:
                    console.error("Invalid recurrence frequency");
                    return;
            }

            const nextTaskData: Omit<Task, 'id' | 'userId'> = {
                ...data, // copy most properties
                startDate: format(newStartDate, 'yyyy-MM-dd'),
                status: 'Por realizar',
                progress: 0,
                supplyCost: 0,
                actualCost: 0,
                downtimeMinutes: 0,
                harvestedQuantity: 0,
                observations: '',
                dependsOn: undefined, // A recurrent task shouldn't depend on the previous one.
            };

            await addTask(nextTaskData);

            toast({
                title: 'Labor recurrente creada',
                description: `Se ha programado la siguiente labor "${data.type}" para el ${format(newStartDate, "PPP", { locale: es })}.`
            });
        }
    } catch (error) {
        handleWriteError(error, docRef.path, 'update', { ...data, userId: user.uid });
    }
  };

  const deleteTask = async (id: string) => {
    if (!ensureAuth()) return;
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
            batch.delete(usageDoc.ref); // Delete the usage document
        });
        
        for (const [supplyId, quantityToRevert] of stockUpdates.entries()) {
            const supplyRef = doc(firestore, 'supplies', supplyId);
            const supplyDoc = await getDoc(supplyRef);
            if (supplyDoc.exists()) {
                const supplyData = supplyDoc.data() as Supply;
                batch.update(supplyRef, { currentStock: supplyData.currentStock + quantityToRevert });
            }
        }

        batch.delete(taskRef); // Finally, delete the task itself

        await batch.commit();
    } catch (error) {
        handleWriteError(error, taskRef.path, 'delete');
    }
  };
  
  const addSupply = async (data: Omit<Supply, 'id' | 'userId'>): Promise<Supply> => {
    if (!ensureAuth()) throw new Error("Not authenticated");
    const newDocRef = doc(collection(firestore, 'supplies'));
    const newSupply: Supply = { ...data, id: newDocRef.id, userId: user.uid };
    try {
        await setDoc(newDocRef, newSupply);
        return newSupply;
    } catch (error) {
        handleWriteError(error, newDocRef.path, 'create', newSupply);
        throw error;
    }
  };

  const updateSupply = async (data: Supply) => {
    if (!ensureAuth()) return;
    const docRef = doc(firestore, 'supplies', data.id);
    try {
        await setDoc(docRef, { ...data, userId: user.uid }, { merge: true });
    } catch (error) {
        handleWriteError(error, docRef.path, 'update', { ...data, userId: user.uid });
    }
  };

  const deleteSupply = async (id: string) => {
    if (!ensureAuth()) return;
    const docRef = doc(firestore, 'supplies', id);
    try {
        await deleteDoc(docRef);
    } catch (error) {
        handleWriteError(error, docRef.path, 'delete');
    }
  };

  const addSubLot = async (lotId: string, data: Omit<SubLot, 'id' | 'userId' | 'lotId'>): Promise<SubLot> => {
    if (!ensureAuth()) throw new Error("Not authenticated");
    const subLotRef = doc(collection(firestore, 'lots', lotId, 'sublots'));
    const newSubLot: SubLot = { ...data, id: subLotRef.id, lotId, userId: user.uid };
    try {
        await setDoc(subLotRef, newSubLot);
        return newSubLot;
    } catch (error) {
        handleWriteError(error, subLotRef.path, 'create', newSubLot);
        throw error;
    }
  };

  const updateSubLot = async (subLot: SubLot) => {
    if (!ensureAuth()) return;
    const subLotRef = doc(firestore, 'lots', subLot.lotId, 'sublots', subLot.id);
    try {
        await setDoc(subLotRef, { ...subLot, userId: user.uid }, { merge: true });
    } catch (error) {
        handleWriteError(error, subLotRef.path, 'update', { ...subLot, userId: user.uid });
    }
  };

  const deleteSubLot = async (lotId: string, subLotId: string) => {
    if (!ensureAuth()) return;
    const docRef = doc(firestore, 'lots', lotId, 'sublots', subLotId);
    try {
        await deleteDoc(docRef);
    } catch (error) {
        handleWriteError(error, docRef.path, 'delete');
    }
  };

  const addSupplyUsage = async (taskId: string, supplyId: string, quantityUsed: number, date: string): Promise<SupplyUsage> => {
    if (!ensureAuth()) throw new Error("Not authenticated");

    const taskRef = doc(firestore, 'tasks', taskId);
    const supplyRef = doc(firestore, 'supplies', supplyId);
    const usageRef = doc(collection(firestore, 'tasks', taskId, 'supplyUsages'));

    const batch = writeBatch(firestore);

    try {
        // We must get the latest data from the server to avoid race conditions.
        const [taskDoc, supplyDoc] = await Promise.all([getDoc(taskRef), getDoc(supplyDoc)]);

        if (!taskDoc.exists() || !supplyDoc.exists()) {
            throw new Error('La labor o el insumo no existen.');
        }

        const taskData = taskDoc.data() as Task;
        const supplyData = supplyDoc.data() as Supply;

        if (quantityUsed > supplyData.currentStock) {
            throw new Error('Stock insuficiente.');
        }

        const costAtTimeOfUse = supplyData.costPerUnit * quantityUsed;
        const newSupplyCostForTask = (taskData.supplyCost || 0) + costAtTimeOfUse;
        const newActualCostForTask = (taskData.actualCost || 0) + costAtTimeOfUse;
        const newCurrentStock = supplyData.currentStock - quantityUsed;

        const newUsage: SupplyUsage = {
            id: usageRef.id,
            userId: user.uid,
            taskId,
            supplyId,
            supplyName: supplyData.name,
            quantityUsed,
            costAtTimeOfUse,
            date,
        };

        batch.set(usageRef, newUsage);
        batch.update(taskRef, { supplyCost: newSupplyCostForTask, actualCost: newActualCostForTask });
        batch.update(supplyRef, { currentStock: newCurrentStock });

        await batch.commit();
        return newUsage;

    } catch (error: any) {
        handleWriteError(error, usageRef.path, 'create', { taskId, supplyId, quantityUsed, date });
        throw error; // Re-throw to be caught by the component
    }
  };

  const deleteSupplyUsage = async (usage: SupplyUsage) => {
    if (!ensureAuth()) return;

    const { id, taskId, supplyId, quantityUsed, costAtTimeOfUse } = usage;
    const taskRef = doc(firestore, 'tasks', taskId);
    const supplyRef = doc(firestore, 'supplies', supplyId);
    const usageRef = doc(firestore, 'tasks', taskId, 'supplyUsages', id);

    const batch = writeBatch(firestore);

    try {
        const [taskDoc, supplyDoc] = await Promise.all([getDoc(taskRef), getDoc(supplyDoc)]);
        
        const taskData = taskDoc.exists() ? taskDoc.data() as Task : null;
        const supplyData = supplyDoc.exists() ? supplyDoc.data() as Supply : null;

        // Revert supply cost on task
        if (taskData) {
            const newSupplyCost = Math.max(0, (taskData.supplyCost || 0) - costAtTimeOfUse);
            const newActualCost = Math.max(0, (taskData.actualCost || 0) - costAtTimeOfUse);
            batch.update(taskRef, { supplyCost: newSupplyCost, actualCost: newActualCost });
        }
        
        // Revert stock on supply
        if (supplyData) {
            const newStock = (supplyData.currentStock || 0) + quantityUsed;
            batch.update(supplyRef, { currentStock: newStock });
        }

        batch.delete(usageRef);
        
        await batch.commit();
        
    } catch (error: any) {
        handleWriteError(error, usageRef.path, 'delete');
        throw error;
    }
  };

    const addProductiveUnit = async (data: Omit<ProductiveUnit, 'id' | 'userId'>): Promise<ProductiveUnit> => {
    if (!ensureAuth()) throw new Error("Not authenticated");
    const newDocRef = doc(collection(firestore, 'productiveUnits'));
    const newUnit: ProductiveUnit = { ...data, id: newDocRef.id, userId: user.uid };
    try {
      await setDoc(newDocRef, newUnit);
      return newUnit;
    } catch (error) {
      handleWriteError(error, newDocRef.path, 'create', newUnit);
      throw error;
    }
  };

  const updateProductiveUnit = async (data: ProductiveUnit) => {
    if (!ensureAuth()) return;
    const docRef = doc(firestore, 'productiveUnits', data.id);
    try {
      await setDoc(docRef, { ...data, userId: user.uid }, { merge: true });
    } catch (error) {
      handleWriteError(error, docRef.path, 'update', { ...data, userId: user.uid });
    }
  };

  const deleteProductiveUnit = async (id: string) => {
    if (!ensureAuth()) throw new Error("Not authenticated");
    
    const associatedLots = lots?.filter(lot => lot.productiveUnitId === id) || [];
    if (associatedLots.length > 0) {
      toast({
        variant: 'destructive',
        title: 'No se puede eliminar la unidad',
        description: `Esta unidad tiene ${associatedLots.length} lote(s) asociado(s). Debes eliminarlos o reasignarlos primero.`,
        duration: 6000,
      });
      throw new Error('Unit has associated lots.');
    }

    const docRef = doc(firestore, 'productiveUnits', id);
    try {
      await deleteDoc(docRef);
      toast({
        title: "Unidad Productiva eliminada",
        description: "La unidad ha sido eliminada permanentemente.",
      });
    } catch (error) {
      handleWriteError(error, docRef.path, 'delete');
      throw error;
    }
  };

  const addTransaction = async (data: Omit<Transaction, 'id' | 'userId'>): Promise<Transaction> => {
    if (!ensureAuth()) throw new Error("Not authenticated");
    const newDocRef = doc(collection(firestore, 'transactions'));
    const newTransaction: Transaction = { ...data, id: newDocRef.id, userId: user.uid };
    try {
      await setDoc(newDocRef, newTransaction);
      return newTransaction;
    } catch (error) {
      handleWriteError(error, newDocRef.path, 'create', newTransaction);
      throw error;
    }
  };

  const updateTransaction = async (data: Transaction) => {
    if (!ensureAuth()) return;
    const docRef = doc(firestore, 'transactions', data.id);
    try {
      await setDoc(docRef, { ...data, userId: user.uid }, { merge: true });
    } catch (error) {
      handleWriteError(error, docRef.path, 'update', { ...data, userId: user.uid });
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!ensureAuth()) return;
    const docRef = doc(firestore, 'transactions', id);
    try {
      await deleteDoc(docRef);
    } catch (error) {
      handleWriteError(error, docRef.path, 'delete');
    }
  };

  const isLoading = isUserLoading || lotsLoading || staffLoading || tasksLoading || suppliesLoading || productiveUnitsLoading || transactionsLoading || supplyUsagesLoading;

  const value: DataContextState = {
    lots,
    staff,
    tasks,
    supplies,
    productiveUnits,
    transactions,
    supplyUsages,
    user,
    isLoading,
    firestore,
    addLot, updateLot, deleteLot,
    addSubLot, updateSubLot, deleteSubLot,
    addStaff, updateStaff, deleteStaff,
    addTask, updateTask, deleteTask,
    addSupply, updateSupply, deleteSupply,
    addSupplyUsage, deleteSupplyUsage,
    addProductiveUnit, updateProductiveUnit, deleteProductiveUnit,
    addTransaction, updateTransaction, deleteTransaction,
  };

  return (
    <DataContext.Provider value={value}>
        {children}
    </DataContext.Provider>
  );
}

export const useAppData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useAppData must be used within a DataProvider');
  }
  return context;
};

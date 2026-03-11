"use client";

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, Unsubscribe, doc, onSnapshot, collection, query, where, setDoc, deleteDoc, writeBatch, getDocs, getDoc, collectionGroup } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import type { UserProfile, Lot, Staff, Task, ProductiveUnit, Supply, Transaction, SubLot, SupplyUsage } from '@/lib/types';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { useCollection } from './firestore/use-collection';
import { format, addDays, addWeeks, addMonths, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

// CRUD Operations
const createCRUDFunctions = (firestore: Firestore, user: User, toast: ReturnType<typeof useToast>['toast']) => ({
  addLot: (data: Omit<Lot, 'id' | 'userId'>) => {
    const newDocRef = doc(collection(firestore, 'lots'));
    return setDoc(newDocRef, { ...data, id: newDocRef.id, userId: user.uid });
  },
  updateLot: (data: Lot) => setDoc(doc(firestore, 'lots', data.id), { ...data, userId: user.uid }, { merge: true }),
  deleteLot: async (id: string) => {
      const batch = writeBatch(firestore);
      const lotRef = doc(firestore, 'lots', id);
      const sublotsQuery = query(collection(firestore, 'lots', id, 'sublots'));
      const sublotsSnapshot = await getDocs(sublotsQuery);
      sublotsSnapshot.forEach(d => batch.delete(d.ref));
      batch.delete(lotRef);
      return batch.commit();
  },
  addProductiveUnit: (data: Omit<ProductiveUnit, 'id' | 'userId'>) => {
    const newDocRef = doc(collection(firestore, 'productiveUnits'));
    return setDoc(newDocRef, { ...data, id: newDocRef.id, userId: user.uid });
  },
  updateProductiveUnit: (data: ProductiveUnit) => setDoc(doc(firestore, 'productiveUnits', data.id), { ...data, userId: user.uid }, { merge: true }),
  deleteProductiveUnit: (id: string) => deleteDoc(doc(firestore, 'productiveUnits', id)),
  
  addStaff: (data: Omit<Staff, 'id' | 'userId'>) => {
    const newDocRef = doc(collection(firestore, 'staff'));
    return setDoc(newDocRef, { ...data, id: newDocRef.id, userId: user.uid });
  },
  updateStaff: (data: Staff) => setDoc(doc(firestore, 'staff', data.id), { ...data, userId: user.uid }, { merge: true }),
  deleteStaff: (id: string) => deleteDoc(doc(firestore, 'staff', id)),
  
  addSupply: (data: Omit<Supply, 'id' | 'userId'>) => {
    const newDocRef = doc(collection(firestore, 'supplies'));
    return setDoc(newDocRef, { ...data, id: newDocRef.id, userId: user.uid });
  },
  updateSupply: (data: Supply) => setDoc(doc(firestore, 'supplies', data.id), { ...data, userId: user.uid }, { merge: true }),
  deleteSupply: (id: string) => deleteDoc(doc(firestore, 'supplies', id)),
  
  addTask: (data: Omit<Task, 'id' | 'userId'>) => {
    const newDocRef = doc(collection(firestore, 'tasks'));
    return setDoc(newDocRef, { ...data, id: newDocRef.id, userId: user.uid });
  },
  updateTask: async (data: Task, originalTask?: Task) => {
    const docRef = doc(firestore, 'tasks', data.id);
    const isNowFinalized = data.status === 'Finalizado' && originalTask?.status !== 'Finalizado';
    
    await setDoc(docRef, { ...data, userId: user.uid }, { merge: true });

    if (isNowFinalized) {
      const laborCost = data.actualCost - (data.supplyCost || 0);
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
      const baseDateForRecurrence = parseISO(baseDateString);
      let newStartDate: Date;

      switch (data.recurrenceFrequency) {
          case 'días': newStartDate = addDays(baseDateForRecurrence, data.recurrenceInterval); break;
          case 'semanas': newStartDate = addWeeks(baseDateForRecurrence, data.recurrenceInterval); break;
          case 'meses': newStartDate = addMonths(baseDateForRecurrence, data.recurrenceInterval); break;
          default: console.error("Invalid recurrence frequency"); return;
      }

      const { id, userId, endDate, status, progress, supplyCost, actualCost, ...restOfTaskData } = data;
      const nextTaskData: Omit<Task, 'id' | 'userId'> = { ...restOfTaskData, startDate: format(newStartDate, 'yyyy-MM-dd'), endDate: undefined, status: 'Por realizar', progress: 0, supplyCost: 0, actualCost: 0, observations: `Labor recurrente generada automáticamente.`, dependsOn: undefined, };
      
      const newDocRef = doc(collection(firestore, 'tasks'));
      await setDoc(newDocRef, { ...nextTaskData, id: newDocRef.id, userId: user.uid });

      toast({ title: 'Labor recurrente creada', description: `Se ha programado la siguiente labor "${data.type}" para el ${format(newStartDate, "PPP", { locale: es })}.` });
    }
  },
  deleteTask: async (id: string) => {
    const batch = writeBatch(firestore);
    const taskRef = doc(firestore, 'tasks', id);
    const usagesQuery = collection(firestore, 'tasks', id, 'supplyUsages');
    const usagesSnapshot = await getDocs(usagesQuery);
    usagesSnapshot.forEach(d => batch.delete(d.ref));
    batch.delete(taskRef);
    return batch.commit();
  },
  
  addTransaction: (data: Omit<Transaction, 'id' | 'userId'>) => {
    const newDocRef = doc(collection(firestore, 'transactions'));
    return setDoc(newDocRef, { ...data, id: newDocRef.id, userId: user.uid });
  },
  updateTransaction: (data: Transaction) => setDoc(doc(firestore, 'transactions', data.id), { ...data, userId: user.uid }, { merge: true }),
  deleteTransaction: (id: string) => deleteDoc(doc(firestore, 'transactions', id)),

  addSubLot: (lotId: string, data: Omit<SubLot, 'id' | 'userId' | 'lotId'>) => {
    const newDocRef = doc(collection(firestore, 'lots', lotId, 'sublots'));
    return setDoc(newDocRef, { ...data, id: newDocRef.id, lotId, userId: user.uid });
  },
  updateSubLot: (data: SubLot) => setDoc(doc(firestore, 'lots', data.lotId, 'sublots', data.id), { ...data, userId: user.uid }, { merge: true }),
  deleteSubLot: (lotId: string, subLotId: string) => deleteDoc(doc(firestore, 'lots', lotId, 'sublots', subLotId)),

  addSupplyUsage: async (taskId: string, supplyId: string, quantityUsed: number, date: string, allSupplies: Supply[], allTasks: Task[]) => {
    const taskRef = doc(firestore, 'tasks', taskId);
    const usageRef = doc(collection(firestore, 'tasks', taskId, 'supplyUsages'));
    const batch = writeBatch(firestore);

    const taskData = allTasks.find(t => t.id === taskId);
    const supplyData = allSupplies.find(s => s.id === supplyId);

    if (!taskData || !supplyData) {
        throw new Error('La labor o el insumo no existen.');
    }

    const costAtTimeOfUse = supplyData.costPerUnit * quantityUsed;
    const newUsage: SupplyUsage = { id: usageRef.id, userId: user.uid, taskId, supplyId, supplyName: supplyData.name, quantityUsed, costAtTimeOfUse, date };
    
    batch.set(usageRef, newUsage);
    batch.update(taskRef, { supplyCost: (taskData.supplyCost || 0) + costAtTimeOfUse, actualCost: (taskData.actualCost || 0) + costAtTimeOfUse });

    await batch.commit();
    return newUsage;
  },

  deleteSupplyUsage: async (usage: SupplyUsage, allTasks: Task[]) => {
    const { id, taskId, costAtTimeOfUse } = usage;
    const taskRef = doc(firestore, 'tasks', taskId);
    const usageRef = doc(firestore, 'tasks', taskId, 'supplyUsages', id);
    const batch = writeBatch(firestore);

    const taskData = allTasks.find(t => t.id === taskId);
    if (taskData) {
        batch.update(taskRef, { supplyCost: Math.max(0, (taskData.supplyCost || 0) - costAtTimeOfUse), actualCost: Math.max(0, (taskData.actualCost || 0) - costAtTimeOfUse) });
    }
    batch.delete(usageRef);
    await batch.commit();
  },
});

// Context State
interface AppDataContextState {
  lots: Lot[] | null;
  tasks: Task[] | null;
  staff: Staff[] | null;
  supplies: Supply[] | null;
  transactions: Transaction[] | null;
  productiveUnits: ProductiveUnit[] | null;
  supplyUsages: SupplyUsage[] | null;
  isLoading: boolean;
  crudFunctions: ReturnType<typeof createCRUDFunctions> | null;
}

interface FirebaseContextState extends AppDataContextState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  user: User | null;
  profile: UserProfile | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Hook return types
interface UserHookResult {
  user: User | null;
  profile: UserProfile | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export interface AppDataHookResult extends Omit<AppDataContextState, 'crudFunctions'>, Omit<ReturnType<typeof createCRUDFunctions>, 'addSupplyUsage' | 'deleteSupplyUsage' | 'updateTask'> {
  // Overwrite specific functions to include data dependencies
  updateTask: (data: Task) => Promise<void>;
  addSupplyUsage: (taskId: string, supplyId: string, quantityUsed: number, date: string) => Promise<SupplyUsage>;
  deleteSupplyUsage: (usage: SupplyUsage) => Promise<void>;
}


export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

// Provider Component
interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({ children, firebaseApp, firestore, auth }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setUserLoading] = useState(true);
  const [userError, setUserError] = useState<Error | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isProfileLoading, setProfileLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setUserLoading(false);
    }, (error) => {
      console.error("FirebaseProvider: onAuthStateChanged error:", error);
      setUserError(error);
      setUserLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    if (!firestore || !user) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true);
    const profileRef = doc(firestore, 'users', user.uid);
    const unsubscribe = onSnapshot(profileRef, (docSnap) => {
      setProfile(docSnap.exists() ? (docSnap.data() as UserProfile) : null);
      setProfileLoading(false);
    }, () => setProfileLoading(false));
    return () => unsubscribe();
  }, [firestore, user]);

  const useCollectionQuery = (collectionName: string) => useMemoFirebase(
    () => user && firestore ? query(collection(firestore, collectionName), where('userId', '==', user.uid)) : null,
    [firestore, user]
  );
  
  const lotsQuery = useCollectionQuery('lots');
  const tasksQuery = useCollectionQuery('tasks');
  const staffQuery = useCollectionQuery('staff');
  const suppliesQuery = useCollectionQuery('supplies');
  const transactionsQuery = useCollectionQuery('transactions');
  const productiveUnitsQuery = useCollectionQuery('productiveUnits');
  const supplyUsagesQuery = useMemoFirebase(
    () => user && firestore ? query(collectionGroup(firestore, 'supplyUsages'), where('userId', '==', user.uid)) : null,
    [firestore, user]
  );

  const { data: lots, isLoading: lotsLoading } = useCollection<Lot>(lotsQuery);
  const { data: tasks, isLoading: tasksLoading } = useCollection<Task>(tasksQuery);
  const { data: staff, isLoading: staffLoading } = useCollection<Staff>(staffQuery);
  const { data: supplies, isLoading: suppliesLoading } = useCollection<Supply>(suppliesQuery);
  const { data: transactions, isLoading: transactionsLoading } = useCollection<Transaction>(transactionsQuery);
  const { data: productiveUnits, isLoading: unitsLoading } = useCollection<ProductiveUnit>(productiveUnitsQuery);
  const { data: supplyUsages, isLoading: supplyUsagesLoading } = useCollection<SupplyUsage>(supplyUsagesQuery);

  const isDataLoading = lotsLoading || tasksLoading || staffLoading || suppliesLoading || transactionsLoading || unitsLoading || supplyUsagesLoading;

  const crudFunctions = useMemo(() => {
    if (firestore && user) {
      return createCRUDFunctions(firestore, user, toast);
    }
    return null;
  }, [firestore, user, toast]);
  
  const contextValue = useMemo((): FirebaseContextState => ({
    areServicesAvailable: !!(firebaseApp && firestore && auth),
    firebaseApp,
    firestore,
    auth,
    user,
    profile,
    isUserLoading: isUserLoading || isProfileLoading,
    userError,
    lots,
    tasks,
    staff,
    supplies,
    transactions,
    productiveUnits,
    supplyUsages,
    isLoading: isDataLoading,
    crudFunctions,
  }), [firebaseApp, firestore, auth, user, profile, isUserLoading, isProfileLoading, userError, lots, tasks, staff, supplies, transactions, productiveUnits, supplyUsages, isDataLoading, crudFunctions]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

// Hooks
export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) throw new Error('useFirebase must be used within a FirebaseProvider.');
  return context;
};

export const useAuth = (): Auth => {
  const { auth } = useFirebase();
  if (!auth) throw new Error('Auth service not available.');
  return auth;
};

export const useUser = (): UserHookResult => {
  const { user, profile, isUserLoading, userError } = useFirebase();
  return { user, profile, isUserLoading, userError };
};

export const useAppData = (): AppDataHookResult => {
    const { lots, tasks, staff, supplies, transactions, productiveUnits, supplyUsages, isLoading, crudFunctions } = useFirebase();
    if (!crudFunctions) {
      // This is a temporary state while user is logging in, so we return empty functions
      const emptyFunc = () => Promise.resolve();
      const emptySupplyFunc = () => Promise.reject(new Error("Not available"));

      return {
        lots: [], tasks: [], staff: [], supplies: [], transactions: [], productiveUnits: [], supplyUsages: [], isLoading: true,
        addLot: emptyFunc, updateLot: emptyFunc, deleteLot: emptyFunc, addProductiveUnit: emptyFunc, updateProductiveUnit: emptyFunc, deleteProductiveUnit: emptyFunc, addStaff: emptyFunc, updateStaff: emptyFunc, deleteStaff: emptyFunc, addSupply: emptyFunc, updateSupply: emptyFunc, deleteSupply: emptyFunc, addTask: emptyFunc, updateTask: emptyFunc, deleteTask: emptyFunc, addTransaction: emptyFunc, updateTransaction: emptyFunc, deleteTransaction: emptyFunc, addSubLot: emptyFunc, updateSubLot: emptyFunc, deleteSubLot: emptyFunc,
        addSupplyUsage: emptySupplyFunc, deleteSupplyUsage: emptyFunc
      };
    }
    
    // Bind data dependencies to the functions that need them
    const boundCrudFunctions = {
      ...crudFunctions,
      updateTask: (data: Task) => crudFunctions.updateTask(data, tasks?.find(t => t.id === data.id)),
      addSupplyUsage: (taskId: string, supplyId: string, quantityUsed: number, date: string) => crudFunctions.addSupplyUsage(taskId, supplyId, quantityUsed, date, supplies || [], tasks || []),
      deleteSupplyUsage: (usage: SupplyUsage) => crudFunctions.deleteSupplyUsage(usage, tasks || []),
    };

    return { lots, tasks, staff, supplies, transactions, productiveUnits, supplyUsages, isLoading, ...boundCrudFunctions };
};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T {
  const memoized = useMemo(factory, deps);
  if(typeof memoized === 'object' && memoized !== null) {
    (memoized as any).__memo = true;
  }
  return memoized;
}

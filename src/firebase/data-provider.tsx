'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useUser, useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, setDoc, deleteDoc, getDocs, limit, writeBatch } from 'firebase/firestore';
import { Lot, Staff, Task, ProductiveUnit } from '@/lib/types';
import { getLocalItems, addLocalItem, updateLocalItem, deleteLocalItem, clearLocalCollection } from '@/lib/offline-store';
import { useToast } from '@/hooks/use-toast';
import { User } from 'firebase/auth';

interface DataContextState {
  lots: Lot[] | null;
  staff: Staff[] | null;
  tasks: Task[] | null;
  productiveUnit: ProductiveUnit | null;
  isLoading: boolean;
  addLot: (data: Omit<Lot, 'id' | 'userId'>) => Promise<void>;
  updateLot: (data: Lot) => Promise<void>;
  deleteLot: (id: string) => Promise<void>;
  addStaff: (data: Omit<Staff, 'id' | 'userId'>) => Promise<void>;
  updateStaff: (data: Staff) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;
  addTask: (data: Omit<Task, 'id' | 'userId'>) => Promise<void>;
  updateTask: (data: Task) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  updateProductiveUnit: (data: Partial<Omit<ProductiveUnit, 'id' | 'userId'>>) => Promise<void>;
}

const DataContext = createContext<DataContextState | undefined>(undefined);

async function syncLocalDataToFirebase(user: User, firestore: Firestore): Promise<number> {
  if (!user || !firestore) return 0;
  
  const idMap = new Map<string, string>();
  let totalSynced = 0;

  try {
    const productiveUnit = getLocalItems<ProductiveUnit>('productiveUnit')[0];
    if(productiveUnit) {
      const puQuery = query(collection(firestore, 'productiveUnits'), where('userId', '==', user.uid), limit(1));
      const existingPuSnap = await getDocs(puQuery);
      if (existingPuSnap.empty) {
        const newDocRef = doc(collection(firestore, 'productiveUnits'));
        await setDoc(newDocRef, { ...productiveUnit, id: newDocRef.id, userId: user.uid });
      } else {
        await setDoc(existingPuSnap.docs[0].ref, productiveUnit, { merge: true });
      }
      clearLocalCollection('productiveUnit');
      totalSynced++;
    }

    const localLots = getLocalItems<Lot>('lots');
    if (localLots.length > 0) {
      const lotsBatch = writeBatch(firestore);
      const lotsCol = collection(firestore, 'lots');
      localLots.forEach(lot => {
        const docRef = doc(lotsCol);
        idMap.set(lot.id, docRef.id);
        const { id, ...data } = lot;
        lotsBatch.set(docRef, { ...data, id: docRef.id, userId: user.uid });
      });
      await lotsBatch.commit();
      clearLocalCollection('lots');
      totalSynced += localLots.length;
    }

    const localStaff = getLocalItems<Staff>('staff');
    if (localStaff.length > 0) {
      const staffBatch = writeBatch(firestore);
      const staffCol = collection(firestore, 'staff');
      localStaff.forEach(person => {
        const docRef = doc(staffCol);
        idMap.set(person.id, docRef.id);
        const { id, ...data } = person;
        staffBatch.set(docRef, { ...data, id: docRef.id, userId: user.uid });
      });
      await staffBatch.commit();
      clearLocalCollection('staff');
      totalSynced += localStaff.length;
    }

    const localTasks = getLocalItems<Task>('tasks');
    if (localTasks.length > 0) {
      const tasksBatch = writeBatch(firestore);
      const tasksCol = collection(firestore, 'tasks');
      localTasks.forEach(task => {
        const docRef = doc(tasksCol);
        const { id, lotId, responsibleId, ...data } = task;
        
        const newLotId = idMap.get(lotId) || lotId;
        const newResponsibleId = idMap.get(responsibleId) || responsibleId;
        
        tasksBatch.set(docRef, { 
          ...data, 
          lotId: newLotId, 
          responsibleId: newResponsibleId, 
          id: docRef.id, 
          userId: user.uid 
        });
      });
      await tasksBatch.commit();
      clearLocalCollection('tasks');
      totalSynced += localTasks.length;
    }

    console.log(`Synced ${totalSynced} items from local storage to Firestore.`);
    return totalSynced;

  } catch (error) {
    console.error("Error syncing local data to Firebase:", error);
    return 0;
  }
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { user, firestore, isUserLoading } = useFirebase();
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);

  const [localLots, setLocalLots] = useState<Lot[]>([]);
  const [localStaff, setLocalStaff] = useState<Staff[]>([]);
  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  const [localProductiveUnit, setLocalProductiveUnit] = useState<ProductiveUnit | null>(null);
  const [isOfflineLoading, setOfflineLoading] = useState(true);

  const lotsQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'lots'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const staffQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'staff'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const tasksQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'tasks'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const productiveUnitQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'productiveUnits'), where('userId', '==', user.uid), limit(1)) : null, [firestore, user]);

  const { data: firestoreLots, isLoading: lotsLoading } = useCollection<Lot>(lotsQuery);
  const { data: firestoreStaff, isLoading: staffLoading } = useCollection<Staff>(staffQuery);
  const { data: firestoreTasks, isLoading: tasksLoading } = useCollection<Task>(tasksQuery);
  const { data: firestoreProductiveUnitCollection, isLoading: productiveUnitLoading } = useCollection<ProductiveUnit>(productiveUnitQuery);

  const firestoreProductiveUnit = useMemo(() => (firestoreProductiveUnitCollection?.[0]) || null, [firestoreProductiveUnitCollection]);
  
  useEffect(() => {
    if (isUserLoading) return;

    if (user && firestore) {
      setIsSyncing(true);
      syncLocalDataToFirebase(user, firestore).then(syncedCount => {
        if (syncedCount > 0) {
          toast({
            title: "Datos sincronizados",
            description: `${syncedCount} elementos locales han sido guardados en tu cuenta.`,
          });
        }
      }).catch(err => {
        console.error("Sync failed", err);
        toast({
          variant: "destructive",
          title: "Error de sincronización",
          description: "No se pudieron subir tus datos locales. Por favor, inténtalo de nuevo más tarde.",
        });
      }).finally(() => {
        setIsSyncing(false);
      });
    } else {
      setOfflineLoading(true);
      setLocalLots(getLocalItems<Lot>('lots'));
      setLocalStaff(getLocalItems<Staff>('staff'));
      setLocalTasks(getLocalItems<Task>('tasks'));
      setLocalProductiveUnit(getLocalItems<ProductiveUnit>('productiveUnit')[0] || null);
      setOfflineLoading(false);
    }
  }, [user, firestore, isUserLoading, toast]);

  const createMutations = <T extends { id: string, userId?: string }>(
    collectionName: 'lots' | 'staff' | 'tasks',
    localSetter: React.Dispatch<React.SetStateAction<T[]>>
  ) => {
    const addItem = async (data: Omit<T, 'id' | 'userId'>) => {
      if (user && firestore) {
        const newDocRef = doc(collection(firestore, collectionName));
        await setDoc(newDocRef, { ...data, id: newDocRef.id, userId: user.uid });
      } else {
        const newItem = addLocalItem<T>(collectionName, data);
        localSetter(prev => [...prev, newItem]);
      }
    };

    const updateItem = async (data: T) => {
      if (user && firestore) {
        if (!data.userId) data.userId = user.uid;
        const docRef = doc(firestore, collectionName, data.id);
        await setDoc(docRef, data, { merge: true });
      } else {
        updateLocalItem<T>(collectionName, data);
        localSetter(prev => prev.map(item => item.id === data.id ? data : item));
      }
    };

    const deleteItem = async (id: string) => {
      if (user && firestore) {
        await deleteDoc(doc(firestore, collectionName, id));
      } else {
        deleteLocalItem<T>(collectionName, id);
        localSetter(prev => prev.filter(item => item.id !== id));
      }
    };
    
    return { addItem, updateItem, deleteItem };
  };

  const { addItem: addLot, updateItem: updateLot, deleteItem: deleteLot } = createMutations<Lot>('lots', setLocalLots);
  const { addItem: addStaff, updateItem: updateStaff, deleteItem: deleteStaff } = createMutations<Staff>('staff', setLocalStaff);
  const { addItem: addTask, updateItem: updateTask, deleteItem: deleteTask } = createMutations<Task>('tasks', setLocalTasks);

  const updateProductiveUnit = async (data: Partial<Omit<ProductiveUnit, 'id' | 'userId'>>) => {
    if (user && firestore) {
      if (firestoreProductiveUnit) {
        const docRef = doc(firestore, 'productiveUnits', firestoreProductiveUnit.id);
        await setDoc(docRef, data, { merge: true });
      } else {
        const newDocRef = doc(collection(firestore, 'productiveUnits'));
        await setDoc(newDocRef, { ...data, id: newDocRef.id, userId: user.uid });
      }
    } else {
      const currentUnit = getLocalItems<ProductiveUnit>('productiveUnit')[0] || {};
      const updatedUnit = { ...currentUnit, ...data, id: currentUnit.id || `local_${crypto.randomUUID()}` } as ProductiveUnit;
      saveLocalItems('productiveUnit', [updatedUnit]);
      setLocalProductiveUnit(updatedUnit);
    }
  };

  const isLoading = isUserLoading || isSyncing || (user ? (lotsLoading || staffLoading || tasksLoading || productiveUnitLoading) : isOfflineLoading);

  const value: DataContextState = {
    lots: user ? firestoreLots : localLots,
    staff: user ? firestoreStaff : localStaff,
    tasks: user ? firestoreTasks : localTasks,
    productiveUnit: user ? firestoreProductiveUnit : localProductiveUnit,
    isLoading,
    addLot, updateLot, deleteLot,
    addStaff, updateStaff, deleteStaff,
    addTask, updateTask, deleteTask,
    updateProductiveUnit,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useAppData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useAppData must be used within a DataProvider');
  }
  return context;
};

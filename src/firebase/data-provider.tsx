'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useUser, useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { Lot, Staff, Task } from '@/lib/types';
import { getLocalItems, addLocalItem, updateLocalItem, deleteLocalItem } from '@/lib/offline-store';
import { syncLocalDataToFirebase } from '@/lib/data-sync';
import { useToast } from '@/hooks/use-toast';

interface DataContextState {
  lots: Lot[] | null;
  staff: Staff[] | null;
  tasks: Task[] | null;
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
}

const DataContext = createContext<DataContextState | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user, firestore, isUserLoading } = useFirebase();
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);

  // Local state for offline data
  const [localLots, setLocalLots] = useState<Lot[]>([]);
  const [localStaff, setLocalStaff] = useState<Staff[]>([]);
  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  const [isOfflineLoading, setOfflineLoading] = useState(true);

  // Firestore queries for online data
  const lotsQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'lots'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const staffQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'staff'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const tasksQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'tasks'), where('userId', '==', user.uid)) : null, [firestore, user]);

  const { data: firestoreLots, isLoading: lotsLoading } = useCollection<Lot>(lotsQuery);
  const { data: firestoreStaff, isLoading: staffLoading } = useCollection<Staff>(staffQuery);
  const { data: firestoreTasks, isLoading: tasksLoading } = useCollection<Task>(tasksQuery);
  
  // Effect to handle data loading and synchronization
  useEffect(() => {
    // If auth is still loading, do nothing yet.
    if (isUserLoading) return;

    if (user && firestore) {
      // User is logged in. Sync local data to Firestore.
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
      // User is not logged in. Load data from localStorage.
      setOfflineLoading(true);
      setLocalLots(getLocalItems<Lot>('lots'));
      setLocalStaff(getLocalItems<Staff>('staff'));
      setLocalTasks(getLocalItems<Task>('tasks'));
      setOfflineLoading(false);
    }
  }, [user, firestore, isUserLoading, toast]);


  // Generic factory for creating mutation functions (add, update, delete)
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
        if (!data.userId) data.userId = user.uid; // Ensure userId on updates
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

  const isLoading = isUserLoading || isSyncing || (user ? (lotsLoading || staffLoading || tasksLoading) : isOfflineLoading);

  const value: DataContextState = {
    lots: user ? firestoreLots : localLots,
    staff: user ? firestoreStaff : localStaff,
    tasks: user ? firestoreTasks : localTasks,
    isLoading,
    addLot, updateLot, deleteLot,
    addStaff, updateStaff, deleteStaff,
    addTask, updateTask, deleteTask
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

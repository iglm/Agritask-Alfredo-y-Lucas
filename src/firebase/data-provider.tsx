'use client';
import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useUser, useFirebase, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, setDoc, deleteDoc, getDocs, writeBatch } from 'firebase/firestore';
import { Lot, Staff, Task, ProductiveUnit, SubLot, Supply } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface DataContextState {
  lots: Lot[] | null;
  staff: Staff[] | null;
  tasks: Task[] | null;
  supplies: Supply[] | null;
  productiveUnit: ProductiveUnit | null;
  isLoading: boolean;
  addLot: (data: Omit<Lot, 'id' | 'userId'>) => Promise<void>;
  updateLot: (data: Lot) => Promise<void>;
  deleteLot: (id: string) => Promise<void>;
  addSubLot: (lotId: string, data: Omit<SubLot, 'id' | 'userId' | 'lotId'>) => Promise<void>;
  updateSubLot: (subLot: SubLot) => Promise<void>;
  deleteSubLot: (lotId: string, subLotId: string) => Promise<void>;
  addStaff: (data: Omit<Staff, 'id' | 'userId'>) => Promise<void>;
  updateStaff: (data: Staff) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;
  addTask: (data: Omit<Task, 'id' | 'userId'>) => Promise<void>;
  updateTask: (data: Task) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addSupply: (data: Omit<Supply, 'id' | 'userId'>) => Promise<void>;
  updateSupply: (data: Supply) => Promise<void>;
  deleteSupply: (id: string) => Promise<void>;
  updateProductiveUnit: (data: Partial<Omit<ProductiveUnit, 'id' | 'userId'>>) => Promise<void>;
}

const DataContext = createContext<DataContextState | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user, firestore, isUserLoading } = useFirebase();
  const { toast } = useToast();

  const lotsQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'lots'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const staffQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'staff'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const tasksQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'tasks'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const suppliesQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'supplies'), where('userId', '==', user.uid)) : null, [firestore, user]);
  
  // CORRECTED: Use useDoc for fetching a single document by its known ID.
  const productiveUnitDocRef = useMemoFirebase(() => user && firestore ? doc(firestore, 'productiveUnits', user.uid) : null, [firestore, user]);

  const { data: lots, isLoading: lotsLoading } = useCollection<Lot>(lotsQuery);
  const { data: staff, isLoading: staffLoading } = useCollection<Staff>(staffQuery);
  const { data: tasks, isLoading: tasksLoading } = useCollection<Task>(tasksQuery);
  const { data: supplies, isLoading: suppliesLoading } = useCollection<Supply>(suppliesQuery);
  const { data: productiveUnit, isLoading: productiveUnitLoading } = useDoc<ProductiveUnit>(productiveUnitDocRef);


  const ensureAuth = () => {
    if (!user || !firestore) {
        toast({ variant: 'destructive', title: 'Error de autenticación', description: 'Debes iniciar sesión para realizar esta acción.' });
        return false;
    }
    return true;
  }

  const addLot = async (data: Omit<Lot, 'id' | 'userId'>) => {
    if (!ensureAuth()) return;
    const newDocRef = doc(collection(firestore, 'lots'));
    await setDoc(newDocRef, { ...data, id: newDocRef.id, userId: user.uid });
  };

  const updateLot = async (data: Lot) => {
    if (!ensureAuth()) return;
    const docRef = doc(firestore, 'lots', data.id);
    await setDoc(docRef, { ...data, userId: user.uid }, { merge: true });
  };

  const deleteLot = async (id: string) => {
    if (!ensureAuth()) return;
    const lotRef = doc(firestore, 'lots', id);
    const sublotsQuery = query(collection(firestore, 'lots', id, 'sublots'));
    const tasksQuery = query(collection(firestore, 'tasks'), where('userId', '==', user.uid), where('lotId', '==', id));
    
    const batch = writeBatch(firestore);
    
    const sublotsSnapshot = await getDocs(sublotsQuery);
    sublotsSnapshot.forEach(doc => batch.delete(doc.ref));
    
    const tasksSnapshot = await getDocs(tasksQuery);
    tasksSnapshot.forEach(doc => batch.delete(doc.ref));
    
    batch.delete(lotRef);
    
    await batch.commit();
  };

  const addStaff = async (data: Omit<Staff, 'id' | 'userId'>) => {
    if (!ensureAuth()) return;
    const newDocRef = doc(collection(firestore, 'staff'));
    await setDoc(newDocRef, { ...data, id: newDocRef.id, userId: user.uid });
  }
  const updateStaff = async (data: Staff) => {
    if (!ensureAuth()) return;
    const docRef = doc(firestore, 'staff', data.id);
    await setDoc(docRef, { ...data, userId: user.uid }, { merge: true });
  }
  const deleteStaff = async (id: string) => {
    if (!ensureAuth()) return;
    await deleteDoc(doc(firestore, 'staff', id));
  }

  const addTask = async (data: Omit<Task, 'id' | 'userId'>) => {
    if (!ensureAuth()) return;
    const newDocRef = doc(collection(firestore, 'tasks'));
    await setDoc(newDocRef, { ...data, id: newDocRef.id, userId: user.uid });
  }
  const updateTask = async (data: Task) => {
    if (!ensureAuth()) return;
    const docRef = doc(firestore, 'tasks', data.id);
    await setDoc(docRef, { ...data, userId: user.uid }, { merge: true });
  }
  const deleteTask = async (id: string) => {
    if (!ensureAuth()) return;
    await deleteDoc(doc(firestore, 'tasks', id));
  }
  
  const addSupply = async (data: Omit<Supply, 'id' | 'userId'>) => {
    if (!ensureAuth()) return;
    const newDocRef = doc(collection(firestore, 'supplies'));
    await setDoc(newDocRef, { ...data, id: newDocRef.id, userId: user.uid });
  }
  const updateSupply = async (data: Supply) => {
    if (!ensureAuth()) return;
    const docRef = doc(firestore, 'supplies', data.id);
    await setDoc(docRef, { ...data, userId: user.uid }, { merge: true });
  }
  const deleteSupply = async (id: string) => {
    if (!ensureAuth()) return;
    await deleteDoc(doc(firestore, 'supplies', id));
  }

  const addSubLot = async (lotId: string, data: Omit<SubLot, 'id' | 'userId' | 'lotId'>) => {
    if (!ensureAuth()) return;
    const subLotRef = doc(collection(firestore, 'lots', lotId, 'sublots'));
    await setDoc(subLotRef, { ...data, id: subLotRef.id, userId: user.uid, lotId });
  };

  const updateSubLot = async (subLot: SubLot) => {
    if (!ensureAuth()) return;
    const subLotRef = doc(firestore, 'lots', subLot.lotId, 'sublots', subLot.id);
    await setDoc(subLotRef, { ...subLot, userId: user.uid }, { merge: true });
  };

  const deleteSubLot = async (lotId: string, subLotId: string) => {
    if (!ensureAuth()) return;
    await deleteDoc(doc(firestore, 'lots', lotId, 'sublots', subLotId));
  };

  const updateProductiveUnit = async (data: Partial<Omit<ProductiveUnit, 'id' | 'userId'>>) => {
    if (!ensureAuth()) return;
    // The document ID for the productive unit is the user's UID to ensure one per user.
    const docRef = doc(firestore, 'productiveUnits', user.uid);
    await setDoc(docRef, { ...data, id: user.uid, userId: user.uid }, { merge: true });
  };

  const isLoading = isUserLoading || lotsLoading || staffLoading || tasksLoading || suppliesLoading || productiveUnitLoading;

  const value: DataContextState = {
    lots,
    staff,
    tasks,
    supplies,
    productiveUnit,
    isLoading,
    addLot, updateLot, deleteLot,
    addSubLot, updateSubLot, deleteSubLot,
    addStaff, updateStaff, deleteStaff,
    addTask, updateTask, deleteTask,
    addSupply, updateSupply, deleteSupply,
    updateProductiveUnit,
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

'use client';
import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useUser, useFirebase, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, setDoc, deleteDoc, getDocs, writeBatch } from 'firebase/firestore';
import { Lot, Staff, Task, ProductiveUnit, SubLot, Supply } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from './error-emitter';
import { FirestorePermissionError } from './errors';

interface DataContextState {
  lots: Lot[] | null;
  staff: Staff[] | null;
  tasks: Task[] | null;
  supplies: Supply[] | null;
  productiveUnit: ProductiveUnit | null;
  isLoading: boolean;
  firestore: ReturnType<typeof useFirebase>['firestore'];
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

  const handleWriteError = (error: any, path: string, operation: 'create' | 'update' | 'delete', requestResourceData?: any) => {
    console.error(`DataProvider Error (${operation} on ${path}):`, error);
    errorEmitter.emit('permission-error', new FirestorePermissionError({ path, operation, requestResourceData }));
  };

  const addLot = async (data: Omit<Lot, 'id' | 'userId'>) => {
    if (!ensureAuth()) return;
    const newDocRef = doc(collection(firestore, 'lots'));
    try {
        await setDoc(newDocRef, { ...data, id: newDocRef.id, userId: user.uid });
    } catch (error) {
        handleWriteError(error, newDocRef.path, 'create', { ...data, id: newDocRef.id, userId: user.uid });
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
        const sublotsQuery = query(collection(firestore, 'lots', id, 'sublots'));
        const tasksQuery = query(collection(firestore, 'tasks'), where('userId', '==', user.uid), where('lotId', '==', id));
        
        const batch = writeBatch(firestore);
        
        const sublotsSnapshot = await getDocs(sublotsQuery);
        sublotsSnapshot.forEach(doc => batch.delete(doc.ref));
        
        const tasksSnapshot = await getDocs(tasksQuery);
        tasksSnapshot.forEach(doc => batch.delete(doc.ref));
        
        batch.delete(lotRef);
        
        await batch.commit();
    } catch (error) {
        handleWriteError(error, lotRef.path, 'delete');
    }
  };

  const addStaff = async (data: Omit<Staff, 'id' | 'userId'>) => {
    if (!ensureAuth()) return;
    const newDocRef = doc(collection(firestore, 'staff'));
    try {
        await setDoc(newDocRef, { ...data, id: newDocRef.id, userId: user.uid });
    } catch (error) {
        handleWriteError(error, newDocRef.path, 'create', { ...data, id: newDocRef.id, userId: user.uid });
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
        throw new Error(`Este miembro del personal está asignado a ${tasksSnapshot.size} labor(es) no finalizada(s). Reasigna o finaliza estas labores primero.`);
    }
    const docRef = doc(firestore, 'staff', id);
    try {
        await deleteDoc(docRef);
    } catch (error) {
        handleWriteError(error, docRef.path, 'delete');
    }
  };

  const addTask = async (data: Omit<Task, 'id' | 'userId'>) => {
    if (!ensureAuth()) return;
    const newDocRef = doc(collection(firestore, 'tasks'));
    try {
        await setDoc(newDocRef, { ...data, id: newDocRef.id, userId: user.uid });
    } catch (error) {
        handleWriteError(error, newDocRef.path, 'create', { ...data, id: newDocRef.id, userId: user.uid });
    }
  };

  const updateTask = async (data: Task) => {
    if (!ensureAuth()) return;
    const docRef = doc(firestore, 'tasks', data.id);
    try {
        await setDoc(docRef, { ...data, userId: user.uid }, { merge: true });
    } catch (error) {
        handleWriteError(error, docRef.path, 'update', { ...data, userId: user.uid });
    }
  };

  const deleteTask = async (id: string) => {
    if (!ensureAuth()) return;
    const docRef = doc(firestore, 'tasks', id);
    try {
        await deleteDoc(docRef);
    } catch (error) {
        handleWriteError(error, docRef.path, 'delete');
    }
  };
  
  const addSupply = async (data: Omit<Supply, 'id' | 'userId'>) => {
    if (!ensureAuth()) return;
    const newDocRef = doc(collection(firestore, 'supplies'));
    try {
        await setDoc(newDocRef, { ...data, id: newDocRef.id, userId: user.uid });
    } catch (error) {
        handleWriteError(error, newDocRef.path, 'create', { ...data, id: newDocRef.id, userId: user.uid });
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

  const addSubLot = async (lotId: string, data: Omit<SubLot, 'id' | 'userId' | 'lotId'>) => {
    if (!ensureAuth()) return;
    const subLotRef = doc(collection(firestore, 'lots', lotId, 'sublots'));
    try {
        await setDoc(subLotRef, { ...data, id: subLotRef.id, userId: user.uid, lotId });
    } catch (error) {
        handleWriteError(error, subLotRef.path, 'create', { ...data, id: subLotRef.id, userId: user.uid, lotId });
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

  const updateProductiveUnit = async (data: Partial<Omit<ProductiveUnit, 'id' | 'userId'>>) => {
    if (!ensureAuth()) return;
    const docRef = doc(firestore, 'productiveUnits', user.uid);
    try {
        await setDoc(docRef, { ...data, id: user.uid, userId: user.uid }, { merge: true });
    } catch (error) {
        handleWriteError(error, docRef.path, 'update', { ...data, id: user.uid, userId: user.uid });
    }
  };

  const isLoading = isUserLoading || lotsLoading || staffLoading || tasksLoading || suppliesLoading || productiveUnitLoading;

  const value: DataContextState = {
    lots,
    staff,
    tasks,
    supplies,
    productiveUnit,
    isLoading,
    firestore,
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

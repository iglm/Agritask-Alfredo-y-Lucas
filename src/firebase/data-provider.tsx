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
  addLot: (data: Omit<Lot, 'id' | 'userId'>) => void;
  updateLot: (data: Lot) => void;
  deleteLot: (id: string) => void;
  addSubLot: (lotId: string, data: Omit<SubLot, 'id' | 'userId' | 'lotId'>) => void;
  updateSubLot: (subLot: SubLot) => void;
  deleteSubLot: (lotId: string, subLotId: string) => void;
  addStaff: (data: Omit<Staff, 'id' | 'userId'>) => void;
  updateStaff: (data: Staff) => void;
  deleteStaff: (id: string) => void;
  addTask: (data: Omit<Task, 'id' | 'userId'>) => void;
  updateTask: (data: Task) => void;
  deleteTask: (id: string) => void;
  addSupply: (data: Omit<Supply, 'id' | 'userId'>) => void;
  updateSupply: (data: Supply) => void;
  deleteSupply: (id: string) => void;
  updateProductiveUnit: (data: Partial<Omit<ProductiveUnit, 'id' | 'userId'>>) => void;
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

  const addLot = (data: Omit<Lot, 'id' | 'userId'>) => {
    if (!ensureAuth()) return;
    const newDocRef = doc(collection(firestore, 'lots'));
    setDoc(newDocRef, { ...data, id: newDocRef.id, userId: user.uid }).catch(error => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: newDocRef.path, operation: 'create', requestResourceData: { ...data, id: newDocRef.id, userId: user.uid } }));
    });
  };

  const updateLot = (data: Lot) => {
    if (!ensureAuth()) return;
    const docRef = doc(firestore, 'lots', data.id);
    setDoc(docRef, { ...data, userId: user.uid }, { merge: true }).catch(error => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'update', requestResourceData: { ...data, userId: user.uid } }));
    });
  };

  const deleteLot = (id: string) => {
    if (!ensureAuth()) return;
    (async () => {
        const lotRef = doc(firestore, 'lots', id);
        const sublotsQuery = query(collection(firestore, 'lots', id, 'sublots'));
        const tasksQuery = query(collection(firestore, 'tasks'), where('userId', '==', user.uid), where('lotId', '==', id));
        
        const batch = writeBatch(firestore);
        
        const sublotsSnapshot = await getDocs(sublotsQuery);
        sublotsSnapshot.forEach(doc => batch.delete(doc.ref));
        
        const tasksSnapshot = await getDocs(tasksQuery);
        tasksSnapshot.forEach(doc => batch.delete(doc.ref));
        
        batch.delete(lotRef);
        
        batch.commit().catch(error => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: lotRef.path, operation: 'delete' }));
        });
    })();
  };

  const addStaff = (data: Omit<Staff, 'id' | 'userId'>) => {
    if (!ensureAuth()) return;
    const newDocRef = doc(collection(firestore, 'staff'));
    setDoc(newDocRef, { ...data, id: newDocRef.id, userId: user.uid }).catch(error => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: newDocRef.path, operation: 'create', requestResourceData: { ...data, id: newDocRef.id, userId: user.uid } }));
    });
  };

  const updateStaff = (data: Staff) => {
    if (!ensureAuth()) return;
    const docRef = doc(firestore, 'staff', data.id);
    setDoc(docRef, { ...data, userId: user.uid }, { merge: true }).catch(error => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'update', requestResourceData: { ...data, userId: user.uid } }));
    });
  };

  const deleteStaff = (id: string) => {
    if (!ensureAuth()) return;
    const docRef = doc(firestore, 'staff', id);
    deleteDoc(docRef).catch(error => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'delete' }));
    });
  };

  const addTask = (data: Omit<Task, 'id' | 'userId'>) => {
    if (!ensureAuth()) return;
    const newDocRef = doc(collection(firestore, 'tasks'));
    setDoc(newDocRef, { ...data, id: newDocRef.id, userId: user.uid }).catch(error => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: newDocRef.path, operation: 'create', requestResourceData: { ...data, id: newDocRef.id, userId: user.uid } }));
    });
  };

  const updateTask = (data: Task) => {
    if (!ensureAuth()) return;
    const docRef = doc(firestore, 'tasks', data.id);
    setDoc(docRef, { ...data, userId: user.uid }, { merge: true }).catch(error => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'update', requestResourceData: { ...data, userId: user.uid } }));
    });
  };

  const deleteTask = (id: string) => {
    if (!ensureAuth()) return;
    const docRef = doc(firestore, 'tasks', id);
    deleteDoc(docRef).catch(error => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'delete' }));
    });
  };
  
  const addSupply = (data: Omit<Supply, 'id' | 'userId'>) => {
    if (!ensureAuth()) return;
    const newDocRef = doc(collection(firestore, 'supplies'));
    setDoc(newDocRef, { ...data, id: newDocRef.id, userId: user.uid }).catch(error => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: newDocRef.path, operation: 'create', requestResourceData: { ...data, id: newDocRef.id, userId: user.uid } }));
    });
  };

  const updateSupply = (data: Supply) => {
    if (!ensureAuth()) return;
    const docRef = doc(firestore, 'supplies', data.id);
    setDoc(docRef, { ...data, userId: user.uid }, { merge: true }).catch(error => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'update', requestResourceData: { ...data, userId: user.uid } }));
    });
  };

  const deleteSupply = (id: string) => {
    if (!ensureAuth()) return;
    const docRef = doc(firestore, 'supplies', id);
    deleteDoc(docRef).catch(error => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'delete' }));
    });
  };

  const addSubLot = (lotId: string, data: Omit<SubLot, 'id' | 'userId' | 'lotId'>) => {
    if (!ensureAuth()) return;
    const subLotRef = doc(collection(firestore, 'lots', lotId, 'sublots'));
    setDoc(subLotRef, { ...data, id: subLotRef.id, userId: user.uid, lotId }).catch(error => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: subLotRef.path, operation: 'create', requestResourceData: { ...data, id: subLotRef.id, userId: user.uid, lotId } }));
    });
  };

  const updateSubLot = (subLot: SubLot) => {
    if (!ensureAuth()) return;
    const subLotRef = doc(firestore, 'lots', subLot.lotId, 'sublots', subLot.id);
    setDoc(subLotRef, { ...subLot, userId: user.uid }, { merge: true }).catch(error => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: subLotRef.path, operation: 'update', requestResourceData: { ...subLot, userId: user.uid } }));
    });
  };

  const deleteSubLot = (lotId: string, subLotId: string) => {
    if (!ensureAuth()) return;
    const docRef = doc(firestore, 'lots', lotId, 'sublots', subLotId);
    deleteDoc(docRef).catch(error => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'delete' }));
    });
  };

  const updateProductiveUnit = (data: Partial<Omit<ProductiveUnit, 'id' | 'userId'>>) => {
    if (!ensureAuth()) return;
    const docRef = doc(firestore, 'productiveUnits', user.uid);
    setDoc(docRef, { ...data, id: user.uid, userId: user.uid }, { merge: true }).catch(error => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'update', requestResourceData: { ...data, id: user.uid, userId: user.uid } }));
    });
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

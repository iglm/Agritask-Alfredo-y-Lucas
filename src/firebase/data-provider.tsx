'use client';
import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useUser, useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, setDoc, deleteDoc, getDocs, writeBatch, collectionGroup } from 'firebase/firestore';
import { ProductiveUnit, Lot, Transaction, SupplyUsage } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from './error-emitter';
import { FirestorePermissionError } from './errors';
import { User } from 'firebase/auth';

interface DataContextState {
  productiveUnits: ProductiveUnit[];
  supplyUsages: SupplyUsage[];
  user: User | null;
  isLoading: boolean;
  firestore: ReturnType<typeof useFirebase>['firestore'];
  addProductiveUnit: (data: Omit<ProductiveUnit, 'id' | 'userId'>) => Promise<ProductiveUnit>;
  updateProductiveUnit: (data: ProductiveUnit) => Promise<void>;
  deleteProductiveUnit: (id: string, lots: Lot[] | null) => Promise<void>;
}

const DataContext = createContext<DataContextState | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user, firestore, isUserLoading } = useFirebase();
  const { toast } = useToast();

  const productiveUnitsQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'productiveUnits'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const supplyUsagesQuery = useMemoFirebase(() => user && firestore ? query(collectionGroup(firestore, 'supplyUsages'), where('userId', '==', user.uid)) : null, [firestore, user]);

  const { data: productiveUnits, isLoading: productiveUnitsLoading } = useCollection<ProductiveUnit>(productiveUnitsQuery);
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

  const deleteProductiveUnit = async (id: string, lots: Lot[] | null) => {
    if (!ensureAuth()) throw new Error("Not authenticated");

    const unitRef = doc(firestore, 'productiveUnits', id);
    const associatedLots = lots?.filter(lot => lot.productiveUnitId === id) || [];

    try {
        const batch = writeBatch(firestore);

        for (const lot of associatedLots) {
            const lotRef = doc(firestore, 'lots', lot.id);
            
            const sublotsQuery = query(collection(firestore, 'lots', lot.id, 'sublots'));
            const sublotsSnapshot = await getDocs(sublotsQuery);
            sublotsSnapshot.forEach(doc => batch.delete(doc.ref));

            const tasksQuery = query(collection(firestore, 'tasks'), where('userId', '==', user.uid), where('lotId', '==', lot.id));
            const tasksSnapshot = await getDocs(tasksQuery);
            for (const taskDoc of tasksSnapshot.docs) {
                const usagesQuery = collection(firestore, 'tasks', taskDoc.id, 'supplyUsages');
                const usagesSnapshot = await getDocs(usagesQuery);
                usagesSnapshot.forEach(usageDoc => batch.delete(usageDoc.ref));
                batch.delete(taskDoc.ref);
            }

            const transactionsQuery = query(collection(firestore, 'transactions'), where('userId', '==', user.uid), where('lotId', '==', lot.id));
            const transactionsSnapshot = await getDocs(transactionsQuery);
            transactionsSnapshot.forEach(doc => batch.delete(doc.ref));
            
            batch.delete(lotRef);
        }

        batch.delete(unitRef);
        
        await batch.commit();

        toast({
            title: "Unidad Productiva eliminada",
            description: `La unidad y sus ${associatedLots.length} lotes asociados han sido eliminados.`,
        });

    } catch (error) {
      handleWriteError(error, unitRef.path, 'delete');
      throw error;
    }
  };

  const isLoading = isUserLoading || productiveUnitsLoading || supplyUsagesLoading;

  const value: DataContextState = {
    productiveUnits: productiveUnits || [],
    supplyUsages: supplyUsages || [],
    user,
    isLoading,
    firestore,
    addProductiveUnit, 
    updateProductiveUnit, 
    deleteProductiveUnit,
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

'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, Unsubscribe, doc, onSnapshot, collection, query, where, setDoc, deleteDoc, writeBatch, getDocs } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import type { UserProfile, Lot, Staff, Task, ProductiveUnit, Supply, Transaction, SubLot } from '@/lib/types';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { useCollection } from './firestore/use-collection';

// CRUD Operations
const createCRUDFunctions = (firestore: Firestore, user: User) => ({
  addLot: (data: Omit<Lot, 'id' | 'userId'>) => setDoc(doc(collection(firestore, 'lots')), { ...data, userId: user.uid }),
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
  addProductiveUnit: (data: Omit<ProductiveUnit, 'id' | 'userId'>) => setDoc(doc(collection(firestore, 'productiveUnits')), { ...data, userId: user.uid }),
  updateProductiveUnit: (data: ProductiveUnit) => setDoc(doc(firestore, 'productiveUnits', data.id), { ...data, userId: user.uid }, { merge: true }),
  deleteProductiveUnit: (id: string) => deleteDoc(doc(firestore, 'productiveUnits', id)),
  
  addStaff: (data: Omit<Staff, 'id' | 'userId'>) => setDoc(doc(collection(firestore, 'staff')), { ...data, id: doc(collection(firestore, 'staff')).id, userId: user.uid }),
  updateStaff: (data: Staff) => setDoc(doc(firestore, 'staff', data.id), { ...data, userId: user.uid }, { merge: true }),
  deleteStaff: (id: string) => deleteDoc(doc(firestore, 'staff', id)),
  
  addSupply: (data: Omit<Supply, 'id' | 'userId'>) => setDoc(doc(collection(firestore, 'supplies')), { ...data, id: doc(collection(firestore, 'supplies')).id, userId: user.uid }),
  updateSupply: (data: Supply) => setDoc(doc(firestore, 'supplies', data.id), { ...data, userId: user.uid }, { merge: true }),
  deleteSupply: (id: string) => deleteDoc(doc(firestore, 'supplies', id)),
  
  addTask: (data: Omit<Task, 'id' | 'userId'>) => setDoc(doc(collection(firestore, 'tasks')), { ...data, id: doc(collection(firestore, 'tasks')).id, userId: user.uid }),
  updateTask: (data: Task) => setDoc(doc(firestore, 'tasks', data.id), { ...data, userId: user.uid }, { merge: true }),
  deleteTask: (id: string) => deleteDoc(doc(firestore, 'tasks', id)),
  
  addTransaction: (data: Omit<Transaction, 'id' | 'userId'>) => setDoc(doc(collection(firestore, 'transactions')), { ...data, id: doc(collection(firestore, 'transactions')).id, userId: user.uid }),
  updateTransaction: (data: Transaction) => setDoc(doc(firestore, 'transactions', data.id), { ...data, userId: user.uid }, { merge: true }),
  deleteTransaction: (id: string) => deleteDoc(doc(firestore, 'transactions', id)),

  addSubLot: (lotId: string, data: Omit<SubLot, 'id' | 'userId' | 'lotId'>) => setDoc(doc(collection(firestore, 'lots', lotId, 'sublots')), { ...data, lotId, userId: user.uid }),
  updateSubLot: (data: SubLot) => setDoc(doc(firestore, 'lots', data.lotId, 'sublots', data.id), { ...data, userId: user.uid }, { merge: true }),
  deleteSubLot: (lotId: string, subLotId: string) => deleteDoc(doc(firestore, 'lots', lotId, 'sublots', subLotId)),
});

// Context State
interface AppDataContextState {
  lots: Lot[] | null;
  tasks: Task[] | null;
  staff: Staff[] | null;
  supplies: Supply[] | null;
  transactions: Transaction[] | null;
  productiveUnits: ProductiveUnit[] | null;
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

export interface AppDataHookResult extends Omit<AppDataContextState, 'crudFunctions'> {
  // Explicitly list functions for better intellisense
  addLot: (data: Omit<Lot, 'id' | 'userId'>) => Promise<void>;
  updateLot: (data: Lot) => Promise<void>;
  deleteLot: (id: string) => Promise<void>;
  addProductiveUnit: (data: Omit<ProductiveUnit, 'id' | 'userId'>) => Promise<void>;
  updateProductiveUnit: (data: ProductiveUnit) => Promise<void>;
  deleteProductiveUnit: (id: string) => Promise<void>;
  addStaff: (data: Omit<Staff, 'id' | 'userId'>) => Promise<void>;
  updateStaff: (data: Staff) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;
  addSupply: (data: Omit<Supply, 'id' | 'userId'>) => Promise<void>;
  updateSupply: (data: Supply) => Promise<void>;
  deleteSupply: (id: string) => Promise<void>;
  addTask: (data: Omit<Task, 'id' | 'userId'>) => Promise<void>;
  updateTask: (data: Task) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addTransaction: (data: Omit<Transaction, 'id' | 'userId'>) => Promise<void>;
  updateTransaction: (data: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addSubLot: (lotId: string, data: Omit<SubLot, 'id' | 'userId' | 'lotId'>) => Promise<void>;
  updateSubLot: (data: SubLot) => Promise<void>;
  deleteSubLot: (lotId: string, subLotId: string) => Promise<void>;
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

  const { data: lots, isLoading: lotsLoading } = useCollection<Lot>(lotsQuery);
  const { data: tasks, isLoading: tasksLoading } = useCollection<Task>(tasksQuery);
  const { data: staff, isLoading: staffLoading } = useCollection<Staff>(staffQuery);
  const { data: supplies, isLoading: suppliesLoading } = useCollection<Supply>(suppliesQuery);
  const { data: transactions, isLoading: transactionsLoading } = useCollection<Transaction>(transactionsQuery);
  const { data: productiveUnits, isLoading: unitsLoading } = useCollection<ProductiveUnit>(productiveUnitsQuery);

  const isDataLoading = lotsLoading || tasksLoading || staffLoading || suppliesLoading || transactionsLoading || unitsLoading;

  const crudFunctions = useMemo(() => {
    if (firestore && user) {
      return createCRUDFunctions(firestore, user);
    }
    return null;
  }, [firestore, user]);
  
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
    isLoading: isDataLoading,
    crudFunctions,
  }), [firebaseApp, firestore, auth, user, profile, isUserLoading, isProfileLoading, userError, lots, tasks, staff, supplies, transactions, productiveUnits, isDataLoading, crudFunctions]);

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
    const { lots, tasks, staff, supplies, transactions, productiveUnits, isLoading, crudFunctions } = useFirebase();
    if (!crudFunctions) {
      // This is a temporary state while user is logging in, so we return empty functions
      const emptyFunc = () => Promise.resolve();
      return {
        lots: [], tasks: [], staff: [], supplies: [], transactions: [], productiveUnits: [], isLoading: true,
        addLot: emptyFunc, updateLot: emptyFunc, deleteLot: emptyFunc, addProductiveUnit: emptyFunc, updateProductiveUnit: emptyFunc, deleteProductiveUnit: emptyFunc, addStaff: emptyFunc, updateStaff: emptyFunc, deleteStaff: emptyFunc, addSupply: emptyFunc, updateSupply: emptyFunc, deleteSupply: emptyFunc, addTask: emptyFunc, updateTask: emptyFunc, deleteTask: emptyFunc, addTransaction: emptyFunc, updateTransaction: emptyFunc, deleteTransaction: emptyFunc, addSubLot: emptyFunc, updateSubLot: emptyFunc, deleteSubLot: emptyFunc,
      };
    }
    return { lots, tasks, staff, supplies, transactions, productiveUnits, isLoading, ...crudFunctions };
};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (T & {__memo?: boolean}) {
  const memoized = useMemo(factory, deps);
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as T & {__memo?: boolean}).__memo = true;
  return memoized;
}

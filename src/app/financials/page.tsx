"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { useFirebase, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from "@/firebase";
import { Loader2, Trash2 } from "lucide-react";
import { Transaction, Lot, ProductiveUnit } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { TransactionsTable } from "@/components/financials/transactions-table";
import { TransactionForm } from "@/components/financials/transaction-form";
import { format, parseISO } from "date-fns";
import { collection, query, where, doc, setDoc, deleteDoc } from 'firebase/firestore';

export default function FinancialsPage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const transactionsQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'transactions'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const lotsQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'lots'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const productiveUnitsQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'productiveUnits'), where('userId', '==', user.uid)) : null, [firestore, user]);

  const { data: allTransactions, isLoading: transactionsLoading } = useCollection<Transaction>(transactionsQuery);
  const { data: lots, isLoading: lotsLoading } = useCollection<Lot>(lotsQuery);
  const { data: productiveUnits, isLoading: unitsLoading } = useCollection<ProductiveUnit>(productiveUnitsQuery);

  const isLoading = transactionsLoading || lotsLoading || unitsLoading;

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>(undefined);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleWriteError = (error: any, path: string, operation: 'create' | 'update' | 'delete', requestResourceData?: any) => {
    console.error(`FinancialsPage Error (${operation} on ${path}):`, error);
    errorEmitter.emit('permission-error', new FirestorePermissionError({ path, operation, requestResourceData }));
  };

  const addTransaction = async (data: Omit<Transaction, 'id' | 'userId'>): Promise<Transaction> => {
    if (!user || !firestore) throw new Error("Not authenticated");
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
    if (!user || !firestore) return;
    const docRef = doc(firestore, 'transactions', data.id);
    try {
      await setDoc(docRef, { ...data, userId: user.uid }, { merge: true });
    } catch (error) {
      handleWriteError(error, docRef.path, 'update', { ...data, userId: user.uid });
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!user || !firestore) return;
    const docRef = doc(firestore, 'transactions', id);
    try {
      await deleteDoc(docRef);
    } catch (error) {
      handleWriteError(error, docRef.path, 'delete');
    }
  };

  const sortedTransactions = useMemo(() => {
    if (!allTransactions) return [];
    return [...allTransactions].sort((a, b) => {
        try {
            return parseISO(b.date).getTime() - parseISO(a.date).getTime();
        } catch (e) {
            return 0; // Don't crash if dates are invalid
        }
    });
  }, [allTransactions]);

  const handleAddTransaction = () => {
    setEditingTransaction(undefined);
    setIsSheetOpen(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsSheetOpen(true);
  };

  const handleDeleteRequest = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!transactionToDelete) return;
    deleteTransaction(transactionToDelete.id);
    toast({
      title: "Transacción eliminada",
      description: `La transacción ha sido eliminada permanentemente.`,
    });
    setIsDeleteDialogOpen(false);
    setTransactionToDelete(null);
  };

  const handleFormSubmit = (values: Omit<Transaction, 'id' | 'userId'>) => {
    const dataToSubmit = {
      ...values,
      date: format(values.date as any, 'yyyy-MM-dd'),
    };
    if (editingTransaction) {
      updateTransaction({ ...dataToSubmit, id: editingTransaction.id, userId: editingTransaction.userId });
      toast({
        title: "¡Transacción actualizada!",
        description: "El registro financiero ha sido actualizado.",
      });
    } else {
      addTransaction(dataToSubmit);
      toast({
        title: "¡Transacción creada!",
        description: "El nuevo registro financiero ha sido guardado.",
      });
    }
    setIsSheetOpen(false);
    setEditingTransaction(undefined);
  };

  return (
    <div>
      <PageHeader title="Gestión Financiera" actionButtonText="Agregar Transacción" onActionButtonClick={handleAddTransaction} />
      
      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <TransactionsTable 
            transactions={sortedTransactions}
            lots={lots || []}
            onEdit={handleEditTransaction}
            onDelete={handleDeleteRequest}
            onAdd={handleAddTransaction}
        />
      )}

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{editingTransaction ? 'Editar Transacción' : 'Nueva Transacción'}</SheetTitle>
            <SheetDescription>
              {editingTransaction ? 'Actualiza los detalles de este registro financiero.' : 'Registra un nuevo ingreso o egreso.'}
            </SheetDescription>
          </SheetHeader>
          <TransactionForm 
            transaction={editingTransaction}
            lots={lots || []}
            productiveUnits={productiveUnits || []}
            onSubmit={handleFormSubmit}
          />
        </SheetContent>
      </Sheet>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente la transacción de <span className="font-bold">${transactionToDelete?.amount.toLocaleString()}</span>.
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

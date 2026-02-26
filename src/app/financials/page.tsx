"use client";

import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { useAppData } from "@/firebase";
import { Loader2, Trash2, Download } from "lucide-react";
import { Transaction } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { exportToCsv } from "@/lib/csv";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { TransactionsTable } from "@/components/financials/transactions-table";
import { TransactionForm } from "@/components/financials/transaction-form";
import { format, parseISO } from "date-fns";

export default function FinancialsPage() {
  const { transactions: allTransactions, lots, productiveUnits, isLoading, addTransaction, updateTransaction, deleteTransaction } = useAppData();
  const { toast } = useToast();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>(undefined);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const sortedTransactions = useMemo(() => {
    if (!allTransactions) return [];
    // Sort transactions by date in descending order (most recent first)
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

  const handleExport = () => {
    if (sortedTransactions && sortedTransactions.length > 0) {
      const dataToExport = sortedTransactions.map(transaction => ({
        ...transaction,
        lotName: transaction.lotId ? (lots?.find(l => l.id === transaction.lotId)?.name || 'N/A') : 'General',
      }));
      exportToCsv(`transacciones-${new Date().toISOString()}.csv`, dataToExport);
    } else {
      toast({
        title: "No hay datos para exportar",
      });
    }
  };

  return (
    <div>
      <PageHeader title="Gestión Financiera" actionButtonText="Agregar Transacción" onActionButtonClick={handleAddTransaction}>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" /> Exportar
            </Button>
        </div>
      </PageHeader>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <TransactionsTable 
            transactions={sortedTransactions || []}
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

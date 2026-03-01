"use client";

import { useState, useEffect } from "react";
import { SuppliesTable } from "@/components/supplies/supplies-table";
import { SupplyForm } from "@/components/supplies/supply-form";
import { PageHeader } from "@/components/page-header";
import { supplyUnits, type Supply } from "@/lib/types";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Loader2, Trash2 } from "lucide-react";
import { useFirebase, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { collection, query, where, doc, setDoc, deleteDoc } from 'firebase/firestore';

export default function SuppliesPage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const suppliesQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'supplies'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: allSupplies, isLoading } = useCollection<Supply>(suppliesQuery);

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [filteredSupplies, setFilteredSupplies] = useState<Supply[]>([]);
  const [editingSupply, setEditingSupply] = useState<Supply | undefined>(undefined);
  const [supplyToDelete, setSupplyToDelete] = useState<Supply | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    let suppliesToFilter = allSupplies || [];
    
    if (searchTerm) {
        suppliesToFilter = suppliesToFilter.filter(s => 
            s.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    setFilteredSupplies(suppliesToFilter);
  }, [allSupplies, searchTerm]);

  const handleWriteError = (error: any, path: string, operation: 'create' | 'update' | 'delete', requestResourceData?: any) => {
    console.error(`SuppliesPage Error (${operation} on ${path}):`, error);
    errorEmitter.emit('permission-error', new FirestorePermissionError({ path, operation, requestResourceData }));
    throw error;
  };

  const addSupply = async (data: Omit<Supply, 'id' | 'userId'>) => {
    if (!user || !firestore) throw new Error("Not authenticated");
    const newDocRef = doc(collection(firestore, 'supplies'));
    const newSupply: Supply = { ...data, id: newDocRef.id, userId: user.uid };
    setDoc(newDocRef, newSupply).catch(error => handleWriteError(error, newDocRef.path, 'create', newSupply));
  };

  const updateSupply = async (data: Supply) => {
    if (!user || !firestore) return;
    const docRef = doc(firestore, 'supplies', data.id);
    const payload = { ...data, userId: user.uid };
    setDoc(docRef, payload, { merge: true }).catch(error => handleWriteError(error, docRef.path, 'update', payload));
  };

  const deleteSupply = async (id: string) => {
    if (!user || !firestore) return;
    const docRef = doc(firestore, 'supplies', id);
    deleteDoc(docRef).catch(error => handleWriteError(error, docRef.path, 'delete'));
  };
  
  const handleAddSupply = () => {
    setEditingSupply(undefined);
    setIsSheetOpen(true);
  };
  
  const handleEditSupply = (supply: Supply) => {
    setEditingSupply(supply);
    setIsSheetOpen(true);
  };

  const handleDeleteRequest = (supply: Supply) => {
    setSupplyToDelete(supply);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!supplyToDelete) return;
    deleteSupply(supplyToDelete.id);
    toast({
      title: "Insumo eliminado",
      description: `El insumo "${supplyToDelete.name}" ha sido eliminado.`,
    });
    setIsDeleteDialogOpen(false);
    setSupplyToDelete(null);
  };

  const handleFormSubmit = (values: Omit<Supply, 'id' | 'userId'>) => {
    const isDuplicated = (allSupplies || []).some(s => 
      s.id !== editingSupply?.id &&
      s.name.toLowerCase().trim() === values.name.toLowerCase().trim()
    );

    if (isDuplicated) {
      toast({
        variant: "destructive",
        title: "Insumo duplicado",
        description: "Ya existe un insumo con este nombre.",
      });
      return;
    }
    
    if (editingSupply) {
      updateSupply({ ...values, id: editingSupply.id, userId: editingSupply.userId });
      toast({
        title: "¡Insumo actualizado!",
        description: "Los detalles del insumo han sido actualizados.",
      });
    } else {
      addSupply(values);
      toast({
        title: "¡Insumo creado!",
        description: "El nuevo insumo ha sido agregado al inventario.",
      });
    }
    setIsSheetOpen(false);
    setEditingSupply(undefined);
  };

  return (
    <div>
      <PageHeader title="Gestión de Insumos" actionButtonText="Agregar Insumo" onActionButtonClick={handleAddSupply}>
        <div className="flex items-center gap-2">
            <Input 
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-[200px]"
            />
        </div>
      </PageHeader>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <SuppliesTable supplies={filteredSupplies} onEdit={handleEditSupply} onDelete={handleDeleteRequest} onAdd={handleAddSupply} />
      )}

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editingSupply ? 'Editar Insumo' : 'Agregar Nuevo Insumo'}</SheetTitle>
            <SheetDescription>
              {editingSupply ? 'Actualiza los detalles de este insumo.' : 'Rellena los detalles para el nuevo insumo.'}
            </SheetDescription>
          </SheetHeader>
          <SupplyForm supply={editingSupply} onSubmit={handleFormSubmit} />
        </SheetContent>
      </Sheet>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el insumo <span className="font-bold">{supplyToDelete?.name}</span>.
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

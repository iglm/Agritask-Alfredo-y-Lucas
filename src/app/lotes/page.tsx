"use client";

import { useState, useMemo } from "react";
import { LotsTable } from "@/components/lots/lots-table";
import { LotForm } from "@/components/lots/lot-form";
import { ProductiveUnitForm } from "@/components/productive-unit/productive-unit-form";
import { PageHeader } from "@/components/page-header";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, Home, PlusCircle } from "lucide-react";
import { Lot, SubLot, ProductiveUnit, Task, Transaction, Staff } from "@/lib/types";
import { useFirebase, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { SubLotForm } from "@/components/lots/sub-lot-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { collection, doc, setDoc, deleteDoc, query, where, writeBatch, getDocs } from "firebase/firestore";


export default function LotsPage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const lotsQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'lots'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: allLots, isLoading: lotsLoading } = useCollection<Lot>(lotsQuery);
  const tasksQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'tasks'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: allTasks, isLoading: tasksLoading } = useCollection<Task>(tasksQuery);
  const transactionsQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'transactions'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: allTransactions, isLoading: transactionsLoading } = useCollection<Transaction>(transactionsQuery);
  const unitsQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'productiveUnits'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: allUnits, isLoading: unitsLoading } = useCollection<ProductiveUnit>(unitsQuery);
  const staffQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'staff'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: allStaff, isLoading: staffLoading } = useCollection<Staff>(staffQuery);

  const isLoading = lotsLoading || tasksLoading || transactionsLoading || unitsLoading || staffLoading;
  
  const [isLotSheetOpen, setIsLotSheetOpen] = useState(false);
  const [isSubLotSheetOpen, setIsSubLotSheetOpen] = useState(false);
  const [isUnitSheetOpen, setIsUnitSheetOpen] = useState(false);
  
  const [editingLot, setEditingLot] = useState<Lot | undefined>(undefined);
  const [editingSubLot, setEditingSubLot] = useState<SubLot | undefined>(undefined);
  const [editingUnit, setEditingUnit] = useState<ProductiveUnit | undefined>(undefined);
  
  const [currentLot, setCurrentLot] = useState<Lot | undefined>(undefined);
  const [currentUnitId, setCurrentUnitId] = useState<string | null>(null);

  const [lotToDelete, setLotToDelete] = useState<Lot | null>(null);
  const [subLotToDelete, setSubLotToDelete] = useState<{lotId: string, subLotId: string, name: string} | null>(null);
  const [unitToDelete, setUnitToDelete] = useState<ProductiveUnit | null>(null);

  const [isLotDeleteDialogOpen, setIsLotDeleteDialogOpen] = useState(false);
  const [isSubLotDeleteDialogOpen, setIsSubLotDeleteDialogOpen] = useState(false);
  const [isUnitDeleteDialogOpen, setIsUnitDeleteDialogOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');

  const { unitsWithLots, unassignedLots } = useMemo(() => {
    const lowerCaseSearch = searchTerm.toLowerCase();

    const filteredLots = (allLots || []).filter(lot => lot.name.toLowerCase().includes(lowerCaseSearch));
    const filteredUnitIds = new Set(filteredLots.map(lot => lot.productiveUnitId));
    
    const filteredUnits = (allUnits || []).filter(unit => 
        unit.farmName?.toLowerCase().includes(lowerCaseSearch) || filteredUnitIds.has(unit.id)
    );

    const unitsWithLots = filteredUnits.map(unit => ({
        ...unit,
        lots: filteredLots.filter(lot => lot.productiveUnitId === unit.id),
    }));

    const unassignedLots = filteredLots.filter(lot => !lot.productiveUnitId);

    return { unitsWithLots, unassignedLots };
  }, [allLots, allUnits, searchTerm]);

  const handleWriteError = (error: any, path: string, operation: 'create' | 'update' | 'delete', requestResourceData?: any) => {
    console.error(`LotsPage Error (${operation} on ${path}):`, error);
    errorEmitter.emit('permission-error', new FirestorePermissionError({ path, operation, requestResourceData }));
    throw error;
  };

  const addTask = async (data: Omit<Task, 'id' | 'userId'>) => {
    if (!user || !firestore) throw new Error("Not authenticated");
    const newDocRef = doc(collection(firestore, 'tasks'));
    const newTask: Task = { ...data, id: newDocRef.id, userId: user.uid };
    setDoc(newDocRef, newTask).catch(error => handleWriteError(error, newDocRef.path, 'create', newTask));
    return newTask;
  };

  // --- Unit Handlers ---
  const addProductiveUnit = async (data: Omit<ProductiveUnit, 'id' | 'userId'>) => {
    if (!user || !firestore) throw new Error("Not authenticated");
    const newDocRef = doc(collection(firestore, 'productiveUnits'));
    const newUnit: ProductiveUnit = { ...data, id: newDocRef.id, userId: user.uid };
    setDoc(newDocRef, newUnit).catch(error => handleWriteError(error, newDocRef.path, 'create', newUnit));
    return newUnit;
  };

  const updateProductiveUnit = async (data: ProductiveUnit) => {
    if (!user || !firestore) return;
    const docRef = doc(firestore, 'productiveUnits', data.id);
    const payload = { ...data, userId: user.uid };
    setDoc(docRef, payload, { merge: true }).catch(error => handleWriteError(error, docRef.path, 'update', payload));
  };

  const deleteProductiveUnit = async (id: string) => {
    if (!user || !firestore) throw new Error("Not authenticated");
    const unitRef = doc(firestore, 'productiveUnits', id);
    const associatedLots = (allLots || []).filter(lot => lot.productiveUnitId === id);

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
    
    batch.commit()
        .then(() => {
            toast({
                title: "Unidad Productiva eliminada",
                description: `La unidad y sus ${associatedLots.length} lotes asociados han sido eliminados.`,
            });
        })
        .catch(error => handleWriteError(error, unitRef.path, 'delete'));
  };

  const handleAddUnit = () => {
    setEditingUnit(undefined);
    setIsUnitSheetOpen(true);
  };
  const handleEditUnit = (unit: ProductiveUnit) => {
    setEditingUnit(unit);
    setIsUnitSheetOpen(true);
  };
  const handleDeleteUnitRequest = (unit: ProductiveUnit) => {
    setUnitToDelete(unit);
    setIsUnitDeleteDialogOpen(true);
  };
  const confirmDeleteUnit = async () => {
    if (!unitToDelete) return;
    await deleteProductiveUnit(unitToDelete.id);
    setIsUnitDeleteDialogOpen(false);
    setUnitToDelete(null);
  };
  const handleUnitFormSubmit = (values: Omit<ProductiveUnit, 'id' | 'userId'>) => {
    if (editingUnit) {
      updateProductiveUnit({ ...values, id: editingUnit.id, userId: editingUnit.userId });
      toast({ title: "¡Unidad actualizada!" });
    } else {
      addProductiveUnit(values);
      toast({ title: "¡Unidad creada!" });
    }
    setIsUnitSheetOpen(false);
    setEditingUnit(undefined);
  };

  // --- Lot Handlers ---
   const addLot = async (data: Omit<Lot, 'id' | 'userId'>) => {
    if (!user || !firestore) throw new Error("Not authenticated");
    const newDocRef = doc(collection(firestore, 'lots'));
    const newLot: Lot = { ...data, id: newDocRef.id, userId: user.uid };
    setDoc(newDocRef, newLot).catch(error => handleWriteError(error, newDocRef.path, 'create', newLot));
    return newLot;
  };

  const updateLot = async (data: Lot) => {
    if (!user || !firestore) return;
    const docRef = doc(firestore, 'lots', data.id);
    const payload = { ...data, userId: user.uid };
    setDoc(docRef, payload, { merge: true }).catch(error => handleWriteError(error, docRef.path, 'update', payload));
  };

  const deleteLot = async (id: string) => {
    if (!user || !firestore) throw new Error("Not authenticated");
    const lotRef = doc(firestore, 'lots', id);
    const batch = writeBatch(firestore);
    
    const sublotsQuery = query(collection(firestore, 'lots', id, 'sublots'));
    const sublotsSnapshot = await getDocs(sublotsQuery);
    sublotsSnapshot.forEach(doc => batch.delete(doc.ref));

    batch.delete(lotRef);
    batch.commit().catch(error => handleWriteError(error, lotRef.path, 'delete'));
  };

  const handleAddLot = (unitId: string) => {
    setCurrentUnitId(unitId);
    setEditingLot(undefined);
    setIsLotSheetOpen(true);
  };
  const handleEditLot = (lot: Lot) => {
    setCurrentUnitId(lot.productiveUnitId);
    setEditingLot(lot);
    setIsLotSheetOpen(true);
  }
  const handleDeleteLotRequest = (lot: Lot) => {
    setLotToDelete(lot);
    setIsLotDeleteDialogOpen(true);
  };
  const confirmDeleteLot = async () => {
    if (!lotToDelete) return;
    await deleteLot(lotToDelete.id);
    toast({ title: "Lote eliminado" });
    setIsLotDeleteDialogOpen(false);
    setLotToDelete(null);
  };
  const handleLotFormSubmit = async (values: Omit<Lot, 'id' | 'userId'>) => {
    if (editingLot) {
      await updateLot({ ...values, id: editingLot.id, userId: editingLot.userId });
      toast({ title: "¡Lote actualizado!" });
    } else {
      await addLot(values);
      toast({ title: "¡Lote creado!" });
    }
    setIsLotSheetOpen(false);
    setEditingLot(undefined);
  };
  
  // --- SubLot Handlers ---
  const addSubLot = async (lotId: string, data: Omit<SubLot, 'id' | 'userId' | 'lotId'>) => {
    if (!user || !firestore) throw new Error("Not authenticated");
    const newDocRef = doc(collection(firestore, 'lots', lotId, 'sublots'));
    const newSubLot: SubLot = { ...data, id: newDocRef.id, lotId, userId: user.uid };
    setDoc(newDocRef, newSubLot).catch(error => handleWriteError(error, newDocRef.path, 'create', newSubLot));
    return newSubLot;
  };

  const updateSubLot = async (data: SubLot) => {
    if (!user || !firestore) return;
    const docRef = doc(firestore, 'lots', data.lotId, 'sublots', data.id);
    const payload = { ...data, userId: user.uid };
    setDoc(docRef, payload, { merge: true }).catch(error => handleWriteError(error, docRef.path, 'update', payload));
  };

  const deleteSubLot = async (lotId: string, subLotId: string) => {
    if (!user || !firestore) throw new Error("Not authenticated");
    const subLotRef = doc(firestore, 'lots', lotId, 'sublots', subLotId);
    deleteDoc(subLotRef).catch(error => handleWriteError(error, subLotRef.path, 'delete'));
  };


  const handleAddSubLot = (lot: Lot) => {
    setCurrentLot(lot);
    setEditingSubLot(undefined);
    setIsSubLotSheetOpen(true);
  }
  const handleEditSubLot = (subLot: SubLot) => {
    const parentLot = allLots?.find(l => l.id === subLot.lotId);
    setCurrentLot(parentLot);
    setEditingSubLot(subLot);
    setIsSubLotSheetOpen(true);
  }
  const handleDeleteSubLotRequest = (lotId: string, subLotId: string, name: string) => {
    setSubLotToDelete({ lotId, subLotId, name });
    setIsSubLotDeleteDialogOpen(true);
  };
  const confirmDeleteSubLot = async () => {
    if (!subLotToDelete) return;
    await deleteSubLot(subLotToDelete.lotId, subLotToDelete.subLotId);
    toast({ title: "Sub-lote eliminado" });
    setIsSubLotDeleteDialogOpen(false);
    setSubLotToDelete(null);
  };
  const handleSubLotFormSubmit = async (values: Omit<SubLot, 'id' | 'userId' | 'lotId'>) => {
    if (!currentLot) return;
    if (editingSubLot) {
      await updateSubLot({ ...values, id: editingSubLot.id, lotId: currentLot.id, userId: editingSubLot.userId });
      toast({ title: "¡Sub-lote actualizado!" });
    } else {
      await addSubLot(currentLot.id, values);
      toast({ title: "¡Sub-lote creado!" });
    }
    setIsSubLotSheetOpen(false);
    setEditingSubLot(undefined);
    setCurrentLot(undefined);
  };

  return (
    <div>
      <PageHeader title="Gestión de Lotes" actionButtonText="Agregar Unidad Productiva" onActionButtonClick={handleAddUnit}>
        <div className="flex items-center gap-2">
            <Input 
              placeholder="Buscar finca o lote..."
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
        <div className="space-y-6">
          {unitsWithLots.length === 0 && unassignedLots.length === 0 && (
             <EmptyState
                icon={<Home className="h-10 w-10" />}
                title="Añade tu primera unidad productiva"
                description="Registra tus fincas o unidades de negocio para empezar a organizar tu operación."
                action={
                  <Button onClick={handleAddUnit}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Agregar Unidad
                  </Button>
                }
              />
          )}

          {unitsWithLots.map(unit => (
            <Card key={unit.id}>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>{unit.farmName}</CardTitle>
                <div className="flex gap-2">
                   <Button variant="outline" size="sm" onClick={() => handleAddLot(unit.id)}>
                      Añadir Lote
                   </Button>
                   <Button variant="ghost" size="sm" onClick={() => handleEditUnit(unit)}>Editar Unidad</Button>
                   <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteUnitRequest(unit)}>Eliminar Unidad</Button>
                </div>
              </CardHeader>
              <CardContent>
                <LotsTable 
                    lots={unit.lots} 
                    tasks={allTasks || []}
                    transactions={allTransactions || []}
                    staff={allStaff || []}
                    onEditLot={handleEditLot}
                    onDeleteLot={handleDeleteLotRequest}
                    onAddLot={() => handleAddLot(unit.id)}
                    onAddSubLot={handleAddSubLot}
                    onEditSubLot={handleEditSubLot}
                    onDeleteSubLot={handleDeleteSubLotRequest}
                    addTask={addTask}
                    isInsideCard={true}
                />
              </CardContent>
            </Card>
          ))}

          {unassignedLots.length > 0 && (
              <Card>
              <CardHeader>
                  <CardTitle>Lotes Sin Unidad Asignada</CardTitle>
              </CardHeader>
              <CardContent>
                  <LotsTable 
                    lots={unassignedLots}
                    tasks={allTasks || []}
                    transactions={allTransactions || []}
                    staff={allStaff || []}
                    onEditLot={handleEditLot}
                    onDeleteLot={handleDeleteLotRequest}
                    onAddLot={() => toast({variant: "destructive", title: "Acción no permitida", description: "Crea lotes desde una unidad productiva."})}
                    onAddSubLot={handleAddSubLot}
                    onEditSubLot={handleEditSubLot}
                    onDeleteSubLot={handleDeleteSubLotRequest}
                    addTask={addTask}
                    isInsideCard={true}
                   />
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Sheets and Dialogs */}
      <Sheet open={isUnitSheetOpen} onOpenChange={setIsUnitSheetOpen}>
        <SheetContent className="sm:max-w-2xl"><SheetHeader><SheetTitle>{editingUnit ? 'Editar Unidad' : 'Nueva Unidad'}</SheetTitle></SheetHeader><ProductiveUnitForm productiveUnit={editingUnit} onSubmit={handleUnitFormSubmit} /></SheetContent>
      </Sheet>
      <Sheet open={isLotSheetOpen} onOpenChange={setIsLotSheetOpen}>
        <SheetContent className="sm:max-w-2xl"><SheetHeader><SheetTitle>{editingLot ? 'Editar Lote' : 'Nuevo Lote'}</SheetTitle></SheetHeader><LotForm lot={editingLot} onSubmit={handleLotFormSubmit} productiveUnitId={currentUnitId} /></SheetContent>
      </Sheet>
      <Sheet open={isSubLotSheetOpen} onOpenChange={setIsSubLotSheetOpen}>
        <SheetContent><SheetHeader><SheetTitle>{editingSubLot ? 'Editar Sub-lote' : 'Nuevo Sub-lote'}</SheetTitle><SheetDescription>Añadiendo a {currentLot?.name}</SheetDescription></SheetHeader><SubLotForm subLot={editingSubLot} onSubmit={handleSubLotFormSubmit} /></SheetContent>
      </Sheet>
      
      {/* Deletion Dialogs */}
      <AlertDialog open={isUnitDeleteDialogOpen} onOpenChange={setIsUnitDeleteDialogOpen}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Seguro?</AlertDialogTitle><AlertDialogDescription>Se eliminará la unidad "{unitToDelete?.farmName}" y **todos** sus lotes, labores y finanzas asociados. Esta acción es irreversible.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteUnit} className="bg-destructive hover:bg-destructive/90">Eliminar Todo</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={isLotDeleteDialogOpen} onOpenChange={setIsLotDeleteDialogOpen}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Seguro?</AlertDialogTitle><AlertDialogDescription>Se eliminará el lote "{lotToDelete?.name}" y sus datos asociados (sub-lotes, labores, etc.).</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteLot} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={isSubLotDeleteDialogOpen} onOpenChange={setIsSubLotDeleteDialogOpen}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Seguro?</AlertDialogTitle><AlertDialogDescription>Se eliminará el sub-lote "{subLotToDelete?.name}".</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteSubLot} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import { LotsTable } from "@/components/lots/lots-table";
import { LotForm } from "@/components/lots/lot-form";
import { ProductiveUnitForm } from "@/components/productive-unit/productive-unit-form";
import { PageHeader } from "@/components/page-header";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { Lot, SubLot, ProductiveUnit } from "@/lib/types";
import { useAppData } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { SubLotForm } from "@/components/lots/sub-lot-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Home, PlusCircle } from "lucide-react";

export default function LotsPage() {
  const { lots: allLots, tasks: allTasks, transactions: allTransactions, productiveUnits: allUnits, isLoading, addLot, updateLot, deleteLot, addSubLot, updateSubLot, deleteSubLot, addProductiveUnit, updateProductiveUnit, deleteProductiveUnit } = useAppData();
  const { toast } = useToast();
  
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

  // --- Unit Handlers ---
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
    try {
      await deleteProductiveUnit(unitToDelete.id);
    } catch (error) {
        console.error("Failed to delete productive unit:", error);
    }
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
                    tasks={allTasks}
                    transactions={allTransactions}
                    onEditLot={handleEditLot}
                    onDeleteLot={handleDeleteLotRequest}
                    onAddLot={() => handleAddLot(unit.id)}
                    onAddSubLot={handleAddSubLot}
                    onEditSubLot={handleEditSubLot}
                    onDeleteSubLot={handleDeleteSubLotRequest}
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
                    tasks={allTasks}
                    transactions={allTransactions}
                    onEditLot={handleEditLot}
                    onDeleteLot={handleDeleteLotRequest}
                    onAddLot={() => toast({variant: "destructive", title: "Acción no permitida", description: "Crea lotes desde una unidad productiva."})}
                    onAddSubLot={handleAddSubLot}
                    onEditSubLot={handleEditSubLot}
                    onDeleteSubLot={handleDeleteSubLotRequest}
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
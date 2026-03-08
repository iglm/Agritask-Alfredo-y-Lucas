"use client";

import { useState, useMemo } from "react";
import { LotsTable } from "@/components/lots/lots-table";
import { LotForm } from "@/components/lots/lot-form";
import { PageHeader } from "@/components/page-header";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Trash2, Building } from "lucide-react";
import { Lot, SubLot, ProductiveUnit } from "@/lib/types";
import { useAppData } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { exportToCsv } from "@/lib/csv";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { SubLotForm } from "@/components/lots/sub-lot-form";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Tractor, PlusCircle } from 'lucide-react';


export default function LotsPage() {
  const { lots: allLots, tasks: allTasks, productiveUnits: allUnits, isLoading, addLot, updateLot, deleteLot, addSubLot, updateSubLot, deleteSubLot, addTransaction, addTask, staff, transactions } = useAppData();
  const { toast } = useToast();
  
  const [isLotSheetOpen, setIsLotSheetOpen] = useState(false);
  const [isSubLotSheetOpen, setIsSubLotSheetOpen] = useState(false);
  
  const [editingLot, setEditingLot] = useState<Lot | undefined>(undefined);
  const [editingSubLot, setEditingSubLot] = useState<SubLot | undefined>(undefined);
  const [currentLot, setCurrentLot] = useState<Lot | undefined>(undefined); // To know which lot to add the sublot to

  const [lotToDelete, setLotToDelete] = useState<Lot | null>(null);
  const [subLotToDelete, setSubLotToDelete] = useState<{lotId: string, subLotId: string, name: string} | null>(null);

  const [isLotDeleteDialogOpen, setIsLotDeleteDialogOpen] = useState(false);
  const [isSubLotDeleteDialogOpen, setIsSubLotDeleteDialogOpen] = useState(false);

  // Group lots by productive unit
  const { lotsByUnit, unassignedLots } = useMemo(() => {
    if (!allLots || !allUnits) return { lotsByUnit: [], unassignedLots: [] };
    
    const lotsByUnitMap = allUnits.map(unit => ({
      ...unit,
      lots: allLots.filter(lot => lot.productiveUnitId === unit.id)
    }));

    const assignedLotIds = new Set(lotsByUnitMap.flatMap(g => g.lots.map(l => l.id)));
    const unassignedLots = allLots.filter(lot => !lot.productiveUnitId || !allUnits.find(u => u.id === lot.productiveUnitId));

    return { lotsByUnit: lotsByUnitMap, unassignedLots };
  }, [allLots, allUnits]);


  // --- Lot Handlers ---
  const handleAddLot = async () => {
    setEditingLot(undefined);
    if (!allUnits || allUnits.length === 0) {
        toast({
            variant: "destructive",
            title: "Primero crea una Unidad Productiva",
            description: "Necesitas registrar al menos una finca antes de poder añadir un lote.",
        });
        return;
    }
    setIsLotSheetOpen(true);
  };
  
  const handleEditLot = (lot: Lot) => {
    setEditingLot(lot);
    setIsLotSheetOpen(true);
  }

  const handleDeleteLotRequest = (lot: Lot) => {
    setLotToDelete(lot);
    setIsLotDeleteDialogOpen(true);
  };

  const confirmDeleteLot = async () => {
    if (!lotToDelete) return;
    try {
      await deleteLot(lotToDelete.id);
      toast({
        title: "Lote eliminado",
        description: `El lote "${lotToDelete.name}" ha sido eliminado.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al eliminar",
        description: "No se pudo eliminar el lote. Inténtalo de nuevo.",
      });
    } finally {
      setIsLotDeleteDialogOpen(false);
      setLotToDelete(null);
    }
  };

  const handleLotFormSubmit = async (values: Omit<Lot, 'id' | 'userId'>) => {
    try {
      if (editingLot) {
        await updateLot({ ...values, id: editingLot.id, userId: editingLot.userId });
        toast({
          title: "¡Lote actualizado!",
          description: "Los detalles del lote han sido actualizados.",
        });
      } else {
        await addLot(values);
        toast({
          title: "¡Lote creado!",
          description: "El nuevo lote ha sido agregado a tu lista.",
        });
      }
      setIsLotSheetOpen(false);
      setEditingLot(undefined);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Uh oh! Algo salió mal.",
        description: error.message || "No se pudo guardar el lote. Por favor, inténtalo de nuevo.",
      });
    }
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
    try {
      await deleteSubLot(subLotToDelete.lotId, subLotToDelete.subLotId);
      toast({
        title: "Sub-lote eliminado",
        description: `El sub-lote "${subLotToDelete.name}" ha sido eliminado.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al eliminar",
        description: "No se pudo eliminar el sub-lote. Inténtalo de nuevo.",
      });
    } finally {
      setIsSubLotDeleteDialogOpen(false);
      setSubLotToDelete(null);
    }
  };
  
  const handleSubLotFormSubmit = async (values: Omit<SubLot, 'id' | 'userId' | 'lotId'>) => {
    if (!currentLot) return;
    try {
      if (editingSubLot) {
        await updateSubLot({ ...values, id: editingSubLot.id, lotId: currentLot.id, userId: editingSubLot.userId });
        toast({
          title: "¡Sub-lote actualizado!",
          description: "Los detalles del sub-lote han sido actualizados.",
        });
      } else {
        await addSubLot(currentLot.id, values);
        toast({
          title: "¡Sub-lote creado!",
          description: "El nuevo sub-lote ha sido agregado.",
        });
      }
      setIsSubLotSheetOpen(false);
      setEditingSubLot(undefined);
      setCurrentLot(undefined);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Uh oh! Algo salió mal.",
        description: error.message || "No se pudo guardar el sub-lote. Por favor, inténtalo de nuevo.",
      });
    }
  };


  const handleExport = () => {
    if (allLots && allLots.length > 0) {
      exportToCsv(`lotes-${new Date().toISOString()}.csv`, allLots);
    } else {
      toast({
        title: "No hay datos para exportar",
      })
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Gestión de Lotes" actionButtonText="Agregar Nuevo Lote" onActionButtonClick={handleAddLot}>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" /> Exportar
            </Button>
        </div>
      </PageHeader>
      
      {(!allLots || allLots.length === 0) ? (
         <EmptyState
          icon={<Tractor className="h-10 w-10" />}
          title="Crea tu primer lote"
          description="Empieza a organizar tu finca añadiendo tu primer lote de terreno."
          action={
            <Button onClick={handleAddLot}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Agregar Nuevo Lote
            </Button>
          }
        />
      ) : (
        <Accordion type="multiple" defaultValue={allUnits?.map(u => u.id) || ['unassigned']} className="w-full">
          {lotsByUnit.map(unitGroup => (
            <AccordionItem value={unitGroup.id} key={unitGroup.id}>
              <AccordionTrigger className="hover:bg-muted/50 px-4 rounded-md">
                <div className="flex items-center gap-3">
                  <Building className="h-5 w-5 text-muted-foreground" />
                  <span className="text-lg font-semibold">{unitGroup.farmName}</span>
                  <Badge variant="secondary">{unitGroup.lots.length} Lote(s)</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-0">
                <LotsTable 
                  lots={unitGroup.lots}
                  isInsideCard={true}
                  tasks={allTasks || []} 
                  transactions={transactions || []}
                  staff={staff || []}
                  productiveUnits={allUnits || []}
                  onEditLot={handleEditLot} 
                  onDeleteLot={handleDeleteLotRequest}
                  onAddLot={handleAddLot}
                  onAddSubLot={handleAddSubLot}
                  onEditSubLot={handleEditSubLot}
                  onDeleteSubLot={handleDeleteSubLotRequest}
                  addTask={addTask}
                />
              </AccordionContent>
            </AccordionItem>
          ))}
          {unassignedLots.length > 0 && (
             <AccordionItem value="unassigned">
              <AccordionTrigger className="hover:bg-muted/50 px-4 rounded-md text-amber-600">
                <div className="flex items-center gap-3">
                  <Building className="h-5 w-5" />
                  <span className="text-lg font-semibold">Lotes Sin Asignar</span>
                  <Badge variant="outline">{unassignedLots.length} Lote(s)</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-0">
                 <LotsTable 
                  lots={unassignedLots}
                  isInsideCard={true}
                  tasks={allTasks || []} 
                  transactions={transactions || []}
                  staff={staff || []}
                  productiveUnits={allUnits || []}
                  onEditLot={handleEditLot} 
                  onDeleteLot={handleDeleteLotRequest}
                  onAddLot={handleAddLot}
                  onAddSubLot={handleAddSubLot}
                  onEditSubLot={handleEditSubLot}
                  onDeleteSubLot={handleDeleteSubLotRequest}
                  addTask={addTask}
                />
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      )}

      <Sheet open={isLotSheetOpen} onOpenChange={setIsLotSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editingLot ? 'Editar Lote' : 'Crear un Nuevo Lote'}</SheetTitle>
            <SheetDescription>
              {editingLot ? 'Actualiza los detalles de este lote.' : 'Completa los detalles para el nuevo lote.'}
            </SheetDescription>
          </SheetHeader>
          <LotForm lot={editingLot} productiveUnits={allUnits || []} onSubmit={handleLotFormSubmit} />
        </SheetContent>
      </Sheet>
      
      <Sheet open={isSubLotSheetOpen} onOpenChange={(isOpen) => { setIsSubLotSheetOpen(isOpen); if (!isOpen) { setEditingSubLot(undefined); setCurrentLot(undefined); }}}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editingSubLot ? 'Editar Sub-lote' : 'Crear un Nuevo Sub-lote'}</SheetTitle>
            <SheetDescription>
              Añadiendo un sub-lote a <span className="font-semibold">{currentLot?.name}</span>.
            </SheetDescription>
          </SheetHeader>
          <SubLotForm subLot={editingSubLot} onSubmit={handleSubLotFormSubmit} />
        </SheetContent>
      </Sheet>

      <AlertDialog open={isLotDeleteDialogOpen} onOpenChange={setIsLotDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el lote
              <span className="font-bold"> {lotToDelete?.name} </span>
              y todos sus sub-lotes y labores asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteLot} className="bg-destructive hover:bg-destructive/90">
              <Trash2 className="mr-2 h-4 w-4" />
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

       <AlertDialog open={isSubLotDeleteDialogOpen} onOpenChange={setIsSubLotDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el sub-lote
              <span className="font-bold"> {subLotToDelete?.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteSubLot} className="bg-destructive hover:bg-destructive/90">
              <Trash2 className="mr-2 h-4 w-4" />
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

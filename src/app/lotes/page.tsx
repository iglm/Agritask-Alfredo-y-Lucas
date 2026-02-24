"use client";

import { useState, useEffect } from "react";
import { LotsTable } from "@/components/lots/lots-table";
import { LotForm } from "@/components/lots/lot-form";
import { PageHeader } from "@/components/page-header";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Trash2 } from "lucide-react";
import { Lot, SubLot } from "@/lib/types";
import { useAppData } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { exportToCsv } from "@/lib/csv";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { SubLotForm } from "@/components/lots/sub-lot-form";
import { format } from "date-fns";

export default function LotsPage() {
  const { lots: allLots, tasks: allTasks, isLoading, addLot, updateLot, deleteLot, addSubLot, updateSubLot, deleteSubLot } = useAppData();
  const { toast } = useToast();
  
  const [isLotSheetOpen, setIsLotSheetOpen] = useState(false);
  const [isSubLotSheetOpen, setIsSubLotSheetOpen] = useState(false);
  const [filteredLots, setFilteredLots] = useState<Lot[]>([]);
  
  const [editingLot, setEditingLot] = useState<Lot | undefined>(undefined);
  const [editingSubLot, setEditingSubLot] = useState<SubLot | undefined>(undefined);
  const [currentLot, setCurrentLot] = useState<Lot | undefined>(undefined); // To know which lot to add the sublot to

  const [lotToDelete, setLotToDelete] = useState<Lot | null>(null);
  const [subLotToDelete, setSubLotToDelete] = useState<{lotId: string, subLotId: string, name: string} | null>(null);

  const [isLotDeleteDialogOpen, setIsLotDeleteDialogOpen] = useState(false);
  const [isSubLotDeleteDialogOpen, setIsSubLotDeleteDialogOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (allLots) {
      const filtered = (allLots || []).filter(lot => 
        lot.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredLots(filtered);
    }
  }, [allLots, searchTerm]);

  // --- Lot Handlers ---
  const handleAddLot = () => {
    setEditingLot(undefined);
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

  const confirmDeleteLot = () => {
    if (!lotToDelete) return;
    deleteLot(lotToDelete.id);
    toast({
      title: "Lote eliminado",
      description: `El lote "${lotToDelete.name}" ha sido eliminado.`,
    });
    setIsLotDeleteDialogOpen(false);
    setLotToDelete(null);
  };

  const handleLotFormSubmit = (values: Omit<Lot, 'id' | 'userId'>) => {
    const dataToSubmit = {
      name: values.name,
      areaHectares: values.areaHectares,
      location: values.location,
      sowingDate: values.sowingDate ? format(values.sowingDate, 'yyyy-MM-dd') : undefined,
      sowingDensity: values.sowingDensity,
      distanceBetweenPlants: values.distanceBetweenPlants,
      distanceBetweenRows: values.distanceBetweenRows,
      totalTrees: values.totalTrees,
      technicalNotes: values.technicalNotes,
    };

    if (editingLot) {
      updateLot({ ...dataToSubmit, id: editingLot.id, userId: editingLot.userId });
      toast({
        title: "¡Lote actualizado!",
        description: "Los detalles del lote han sido actualizados.",
      });
    } else {
      addLot(dataToSubmit);
      toast({
        title: "¡Lote creado!",
        description: "El nuevo lote ha sido agregado a tu lista.",
      });
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

  const confirmDeleteSubLot = () => {
    if (!subLotToDelete) return;
    deleteSubLot(subLotToDelete.lotId, subLotToDelete.subLotId);
    toast({
      title: "Sub-lote eliminado",
      description: `El sub-lote "${subLotToDelete.name}" ha sido eliminado.`,
    });
    setIsSubLotDeleteDialogOpen(false);
    setSubLotToDelete(null);
  };
  
  const handleSubLotFormSubmit = (values: Omit<SubLot, 'id' | 'userId' | 'lotId'>) => {
    if (!currentLot) return;
    
    const dataToSubmit = {
      name: values.name,
      areaHectares: values.areaHectares,
      sowingDate: values.sowingDate ? format(values.sowingDate, 'yyyy-MM-dd') : undefined,
      sowingDensity: values.sowingDensity,
      distanceBetweenPlants: values.distanceBetweenPlants,
      distanceBetweenRows: values.distanceBetweenRows,
      totalTrees: values.totalTrees,
      technicalNotes: values.technicalNotes,
    };

    if (editingSubLot) {
      updateSubLot({ ...dataToSubmit, id: editingSubLot.id, lotId: currentLot.id, userId: editingSubLot.userId });
      toast({
        title: "¡Sub-lote actualizado!",
        description: "Los detalles del sub-lote han sido actualizados.",
      });
    } else {
      addSubLot(currentLot.id, dataToSubmit);
      toast({
        title: "¡Sub-lote creado!",
        description: "El nuevo sub-lote ha sido agregado.",
      });
    }
    setIsSubLotSheetOpen(false);
    setEditingSubLot(undefined);
    setCurrentLot(undefined);
  };

  const handleExport = () => {
    if (filteredLots.length > 0) {
      exportToCsv(`lotes-${new Date().toISOString()}.csv`, filteredLots);
    } else {
      toast({
        title: "No hay datos para exportar",
        description: "Filtra los datos que deseas exportar.",
      })
    }
  };


  return (
    <div>
      <PageHeader title="Gestión de Lotes" actionButtonText="Agregar Nuevo Lote" onActionButtonClick={handleAddLot}>
        <div className="flex items-center gap-2">
            <Input 
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-[200px]"
            />
            <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting}>
              {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Exportar
            </Button>
        </div>
      </PageHeader>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <LotsTable 
          lots={filteredLots}
          tasks={allTasks || []} 
          onEditLot={handleEditLot} 
          onDeleteLot={handleDeleteLotRequest}
          onAddLot={handleAddLot}
          onAddSubLot={handleAddSubLot}
          onEditSubLot={handleEditSubLot}
          onDeleteSubLot={handleDeleteSubLotRequest}
        />
      )}

      <Sheet open={isLotSheetOpen} onOpenChange={setIsLotSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editingLot ? 'Editar Lote' : 'Crear un Nuevo Lote'}</SheetTitle>
            <SheetDescription>
              {editingLot ? 'Actualiza los detalles de este lote.' : 'Completa los detalles para el nuevo lote.'}
            </SheetDescription>
          </SheetHeader>
          <LotForm lot={editingLot} onSubmit={handleLotFormSubmit} />
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

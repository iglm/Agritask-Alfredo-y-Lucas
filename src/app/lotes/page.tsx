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
import { collection, getDocs, query, where, collectionGroup } from "firebase/firestore";
import { format } from "date-fns";

export default function LotsPage() {
  const { lots: allLots, tasks: allTasks, transactions: allTransactions, productiveUnits: allUnits, isLoading, addLot, updateLot, deleteLot, addSubLot, updateSubLot, deleteSubLot, firestore, user } = useAppData();
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
  const [isExporting, setIsExporting] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (allLots) {
      const filtered = (allLots || []).filter(lot => 
        lot.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredLots(filtered);
    }
  }, [allLots, searchTerm]);

  // --- Lot Handlers ---
  const handleAddLot = async () => {
    if (!allUnits || allUnits.length === 0) {
        toast({
            variant: "destructive",
            title: "Primero crea una Unidad Productiva",
            description: "Necesitas registrar al menos una unidad productiva antes de poder añadir un lote.",
        });
        return;
    }
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

  const handleExport = async () => {
    if (!firestore || !user) {
      toast({ variant: "destructive", title: "Error de autenticación", description: "Inicia sesión para exportar." });
      return;
    }
    if (allLots && allLots.length > 0) {
      setIsExporting(true);
      try {
        const lotsToExport = allLots.map(lot => ({
            id: lot.id,
            nombre: lot.name,
            area_hectareas: lot.areaHectares,
            ubicacion: lot.location,
            fecha_siembra: lot.sowingDate,
            densidad_siembra: lot.sowingDensity,
            arboles_totales: lot.totalTrees,
            tipo: 'Lote Principal',
            lote_padre: ''
        }));
        
        // Efficiently fetch all sublots for the user in one go
        const allSublotsQuery = query(collectionGroup(firestore, 'sublots'), where('userId', '==', user.uid));
        const sublotsSnapshot = await getDocs(allSublotsQuery);
        const parentLotNames = new Map(allLots.map(lot => [lot.id, lot.name]));

        const sublotsToExport = sublotsSnapshot.docs.map(doc => {
            const subLot = doc.data() as SubLot;
            const parentLot = allLots.find(l => l.id === subLot.lotId);
            return {
                id: subLot.id,
                nombre: subLot.name,
                area_hectareas: subLot.areaHectares,
                ubicacion: parentLot?.location || 'N/A', // Inherits from parent
                fecha_siembra: subLot.sowingDate,
                densidad_siembra: subLot.sowingDensity,
                arboles_totales: subLot.totalTrees,
                tipo: 'Sub-Lote',
                lote_padre: parentLotNames.get(subLot.lotId) || ''
            };
        });

        const dataToExport = [...lotsToExport, ...sublotsToExport];
        if (dataToExport.length > 0) {
            exportToCsv(`lotes-y-sublotes-${new Date().toISOString()}.csv`, dataToExport);
        } else {
            toast({
                title: "No hay datos para exportar",
                description: "No se encontraron lotes ni sub-lotes.",
            });
        }
      } catch (error) {
        console.error("Error al exportar lotes:", error);
        toast({
            variant: "destructive",
            title: "Error al exportar",
            description: "No se pudieron obtener los datos para la exportación.",
        });
      } finally {
        setIsExporting(false);
      }
    } else {
        toast({
            title: "No hay datos para exportar",
            description: "No hay lotes para exportar.",
        });
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
          transactions={allTransactions || []}
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
          <LotForm lot={editingLot} onSubmit={handleLotFormSubmit} productiveUnits={allUnits || []} />
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
              Esta acción es irreversible. Se eliminará permanentemente el lote "{lotToDelete?.name}", junto con todos sus sub-lotes, labores y registros financieros asociados.
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

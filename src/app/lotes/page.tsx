"use client";

import { useState, useEffect } from "react";
import { LotsTable } from "@/components/lots/lots-table";
import { LotForm } from "@/components/lots/lot-form";
import { PageHeader } from "@/components/page-header";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Trash2 } from "lucide-react";
import { Lot, SubLot } from "@/lib/types";
import { useAppData, useFirebase } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { exportToCsv } from "@/lib/csv";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { SubLotForm } from "@/components/lots/sub-lot-form";
import { collection, getDocs } from "firebase/firestore";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function LotsPage() {
  const { lots: allLots, tasks: allTasks, isLoading, addLot, updateLot, deleteLot, addSubLot, updateSubLot, deleteSubLot } = useAppData();
  const { firestore, user } = useFirebase();
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

  useEffect(() => {
    if (allLots) {
      const filtered = (allLots || []).filter(lot => 
        lot.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredLots(filtered);
    }
  }, [allLots, searchTerm]);

  const ensureAuth = () => {
    if (!user || !firestore) {
        toast({ variant: 'destructive', title: 'Error de autenticación', description: 'Debes iniciar sesión para realizar esta acción.' });
        return false;
    }
    return true;
  }

  // --- Lot Handlers ---
  const handleAddLot = async () => {
    if (!ensureAuth()) return;
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
    if (!lotToDelete || !ensureAuth()) return;
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
    if (!ensureAuth()) return;
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
    if (!ensureAuth()) return;
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
    if (!subLotToDelete || !ensureAuth()) return;
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
    if (!currentLot || !ensureAuth()) return;
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
    if (!ensureAuth()) return;
    if (filteredLots.length === 0) {
      toast({
        title: "No hay datos para exportar",
        description: "No hay lotes en la vista actual para exportar.",
      });
      return;
    }

    toast({ title: "Preparando exportación...", description: "Esto puede tardar un momento si hay muchos sub-lotes." });

    const dataToExport = [];

    for (const lot of filteredLots) {
      dataToExport.push({
        id: lot.id,
        nombre: lot.name,
        tipo: 'Lote',
        lote_padre: '',
        area_hectareas: lot.areaHectares,
        ubicacion: lot.location || 'N/A',
        fecha_siembra: lot.sowingDate ? format(new Date(lot.sowingDate.replace(/-/g, '\/')), 'P', { locale: es }) : 'N/A',
        densidad_siembra: lot.sowingDensity || 'N/A',
        distancia_siembra: lot.sowingDistance || 'N/A',
        arboles_totales: lot.totalTrees || 0,
        notas_tecnicas: lot.technicalNotes || '',
      });

      const subLotsCollection = collection(firestore, 'lots', lot.id, 'sublots');
      const subLotsSnapshot = await getDocs(subLotsCollection);
      
      subLotsSnapshot.forEach(doc => {
        const subLot = doc.data() as SubLot;
        dataToExport.push({
          id: subLot.id,
          nombre: subLot.name,
          tipo: 'Sub-Lote',
          lote_padre: lot.name,
          area_hectareas: subLot.areaHectares,
          ubicacion: lot.location || 'N/A',
          fecha_siembra: subLot.sowingDate ? format(new Date(subLot.sowingDate.replace(/-/g, '\/')), 'P', { locale: es }) : 'N/A',
          densidad_siembra: subLot.sowingDensity || 'N/A',
          distancia_siembra: 'N/A',
          arboles_totales: subLot.totalTrees || 0,
          notas_tecnicas: subLot.technicalNotes || '',
        });
      });
    }

    exportToCsv(`lotes-y-sublotes-${new Date().toISOString().split('T')[0]}.csv`, dataToExport);
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

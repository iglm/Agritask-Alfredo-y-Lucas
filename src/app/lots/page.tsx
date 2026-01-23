"use client";

import { useState } from "react";
import { LotsTable } from "@/components/lots/lots-table";
import { LotForm } from "@/components/lots/lot-form";
import { PageHeader } from "@/components/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Download, Upload, Loader2, Trash2 } from "lucide-react";
import { Lot } from "@/lib/types";
import { useCollection, useFirebase, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where, doc, addDoc, setDoc, deleteDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { exportToCsv } from "@/lib/csv";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function LotsPage() {
  const { firestore } = useFirebase();
  const { user } = useUser();
  const { toast } = useToast();
  
  const lotsQuery = useMemoFirebase(() => 
    user ? query(collection(firestore, 'lots'), where('userId', '==', user.uid)) : null
  , [firestore, user]);
  const { data: allLots, isLoading } = useCollection<Lot>(lotsQuery);

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [filteredLots, setFilteredLots] = useState<Lot[]>([]);
  const [editingLot, setEditingLot] = useState<Lot | undefined>(undefined);
  const [lotToDelete, setLotToDelete] = useState<Lot | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const locations = [...new Set((allLots || []).map((lot) => lot.location))];

  useState(() => {
    setFilteredLots(allLots || []);
  });

  useState(() => {
    if (allLots) {
      setFilteredLots(allLots);
    }
  });

  const handleFilterByLocation = (location: string) => {
    if (location === "all") {
      setFilteredLots(allLots || []);
    } else {
      setFilteredLots((allLots || []).filter((lot) => lot.location === location));
    }
  };

  const handleAddLot = () => {
    setEditingLot(undefined);
    setIsSheetOpen(true);
  };
  
  const handleEditLot = (lot: Lot) => {
    setEditingLot(lot);
    setIsSheetOpen(true);
  }

  const handleDeleteRequest = (lot: Lot) => {
    setLotToDelete(lot);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!lotToDelete) return;
    try {
      await deleteDoc(doc(firestore, "lots", lotToDelete.id));
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
      setIsDeleteDialogOpen(false);
      setLotToDelete(null);
    }
  };

  const handleFormSubmit = async (values: Omit<Lot, 'id' | 'userId'>) => {
    if (!user) return;
  
    try {
      if (editingLot) {
        // Update existing lot
        const lotRef = doc(firestore, "lots", editingLot.id);
        await setDoc(lotRef, { ...values, userId: user.uid }, { merge: true });
        toast({
          title: "¡Lote actualizado!",
          description: "Los detalles del lote han sido actualizados.",
        });
      } else {
        // Create new lot
        const newDocRef = doc(collection(firestore, "lots"));
        await setDoc(newDocRef, { ...values, id: newDocRef.id, userId: user.uid });
        toast({
          title: "¡Lote creado!",
          description: "El nuevo lote ha sido agregado a tu lista.",
        });
      }
      setIsSheetOpen(false);
      setEditingLot(undefined);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Uh oh! Algo salió mal.",
        description: "No se pudo guardar el lote. Por favor, inténtalo de nuevo.",
      });
    }
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
            <Select onValueChange={handleFilterByLocation} defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por ubicación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las ubicaciones</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location} value={location}>{location}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => alert('La importación desde Google Sheets es una función planificada.')}>
              <Upload className="mr-2 h-4 w-4" /> Importar
            </Button>
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
        <LotsTable lots={filteredLots} onEdit={handleEditLot} onDelete={handleDeleteRequest} />
      )}

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editingLot ? 'Editar Lote' : 'Crear un Nuevo Lote'}</SheetTitle>
            <SheetDescription>
              {editingLot ? 'Actualiza los detalles de este lote.' : 'Completa los detalles para el nuevo lote.'}
            </SheetDescription>
          </SheetHeader>
          <LotForm lot={editingLot} onSubmit={handleFormSubmit} />
        </SheetContent>
      </Sheet>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el lote
              <span className="font-bold"> {lotToDelete?.name} </span>
              y todos los datos asociados.
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

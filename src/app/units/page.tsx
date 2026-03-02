"use client";

import { useState } from "react";
import { ProductiveUnit } from "@/lib/types";
import { useAppData } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/page-header";
import { Loader2, Trash2 } from "lucide-react";
import { ProductiveUnitForm } from "@/components/productive-unit/productive-unit-form";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ProductiveUnitTable } from "@/components/productive-unit/productive-unit-table";

export default function ProductiveUnitsPage() {
  const { productiveUnits: allUnits, lots, isLoading, addProductiveUnit, updateProductiveUnit, deleteProductiveUnit } = useAppData();
  const { toast } = useToast();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<ProductiveUnit | null>(null);
  const [unitToDelete, setUnitToDelete] = useState<ProductiveUnit | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleAddUnit = () => {
    if (allUnits && allUnits.length > 0) {
      toast({
        variant: "destructive",
        title: "Límite de Unidades Productivas alcanzado",
        description: "Solo se permite una unidad productiva por cuenta.",
      });
      return;
    }
    setEditingUnit(null);
    setIsSheetOpen(true);
  };

  const handleEditUnit = (unit: ProductiveUnit) => {
    setEditingUnit(unit);
    setIsSheetOpen(true);
  };

  const handleDeleteRequest = (unit: ProductiveUnit) => {
    const associatedLots = lots?.filter(lot => lot.productiveUnitId === unit.id);
    if (associatedLots && associatedLots.length > 0) {
      toast({
        variant: "destructive",
        title: "No se puede eliminar la unidad",
        description: `Esta unidad tiene ${associatedLots.length} lote(s) asociado(s). Debes eliminarlos o reasignarlos primero.`,
        duration: 6000,
      });
      return;
    }
    setUnitToDelete(unit);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!unitToDelete) return;
    try {
      await deleteProductiveUnit(unitToDelete.id);
      toast({
        title: "Unidad eliminada",
        description: `La unidad productiva "${unitToDelete.farmName}" ha sido eliminada.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error al eliminar",
        description: "No se pudo eliminar la unidad productiva.",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setUnitToDelete(null);
    }
  };

  const handleFormSubmit = async (values: Omit<ProductiveUnit, 'id' | 'userId'>) => {
    try {
      if (editingUnit) {
        await updateProductiveUnit({ ...values, id: editingUnit.id, userId: editingUnit.userId });
        toast({
          title: "¡Unidad actualizada!",
          description: "Los detalles de la unidad productiva han sido actualizados.",
        });
      } else {
        await addProductiveUnit(values);
        toast({
          title: "¡Unidad creada!",
          description: "La nueva unidad productiva ha sido agregada.",
        });
      }
      setIsSheetOpen(false);
      setEditingUnit(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Uh oh! Algo salió mal.",
        description: "No se pudo guardar la unidad productiva.",
      });
    }
  };

  return (
    <div>
      <PageHeader title="Unidades Productivas" actionButtonText="Agregar Unidad" onActionButtonClick={handleAddUnit} />
      
      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <ProductiveUnitTable 
          units={allUnits || []}
          onEdit={handleEditUnit}
          onDelete={handleDeleteRequest}
          onAdd={handleAddUnit}
        />
      )}

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editingUnit ? 'Editar Unidad Productiva' : 'Nueva Unidad Productiva'}</SheetTitle>
            <SheetDescription>
              {editingUnit ? 'Actualiza los detalles de tu finca.' : 'Registra una nueva finca o unidad productiva.'}
            </SheetDescription>
          </SheetHeader>
          <ProductiveUnitForm productiveUnit={editingUnit} onSubmit={handleFormSubmit} />
        </SheetContent>
      </Sheet>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente la unidad productiva <span className="font-bold">{unitToDelete?.farmName}</span>.
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

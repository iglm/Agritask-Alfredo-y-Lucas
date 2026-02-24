"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { ProductiveUnit } from "@/lib/types";
import { useAppData } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ProductiveUnitsTable } from "@/components/productive-unit/productive-units-table";
import { ProductiveUnitForm } from "@/components/productive-unit/productive-unit-form";

export default function ProductiveUnitsPage() {
  const { productiveUnits: allUnits, isLoading, addProductiveUnit, updateProductiveUnit, deleteProductiveUnit } = useAppData();
  const { toast } = useToast();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<ProductiveUnit | undefined>(undefined);
  const [unitToDelete, setUnitToDelete] = useState<ProductiveUnit | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleAddUnit = () => {
    setEditingUnit(undefined);
    setIsSheetOpen(true);
  };
  
  const handleEditUnit = (unit: ProductiveUnit) => {
    setEditingUnit(unit);
    setIsSheetOpen(true);
  };

  const handleDeleteRequest = (unit: ProductiveUnit) => {
    setUnitToDelete(unit);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!unitToDelete) return;
    try {
      await deleteProductiveUnit(unitToDelete.id);
       toast({
        title: "Unidad Productiva eliminada",
        description: "La unidad ha sido eliminada permanentemente.",
      });
    } catch (error) {
        // Error toast is handled by the provider, no need to show another one.
        console.error("Failed to delete productive unit:", error);
    }
    setIsDeleteDialogOpen(false);
    setUnitToDelete(null);
  };

  const handleFormSubmit = (values: Omit<ProductiveUnit, 'id' | 'userId'>) => {
    if (editingUnit) {
      updateProductiveUnit({ ...values, id: editingUnit.id, userId: editingUnit.userId });
      toast({
        title: "¡Unidad actualizada!",
        description: "Los detalles de la unidad productiva han sido actualizados.",
      });
    } else {
      addProductiveUnit(values);
      toast({
        title: "¡Unidad creada!",
        description: "La nueva unidad productiva ha sido agregada a tu lista.",
      });
    }
    setIsSheetOpen(false);
    setEditingUnit(undefined);
  };

  return (
    <div>
      <PageHeader title="Unidades Productivas" actionButtonText="Agregar Unidad" onActionButtonClick={handleAddUnit} />
      
      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <ProductiveUnitsTable units={allUnits || []} onEdit={handleEditUnit} onDelete={handleDeleteRequest} onAdd={handleAddUnit} />
      )}

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>{editingUnit ? 'Editar Unidad Productiva' : 'Crear Nueva Unidad'}</SheetTitle>
            <SheetDescription>
              {editingUnit ? 'Actualiza los detalles de esta unidad.' : 'Completa los detalles para la nueva unidad productiva.'}
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
              Esta acción eliminará permanentemente la unidad <span className="font-bold">{unitToDelete?.farmName}</span>.
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

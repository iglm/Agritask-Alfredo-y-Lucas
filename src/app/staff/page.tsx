"use client";

import { useState, useEffect } from "react";
import { StaffTable } from "@/components/staff/staff-table";
import { StaffForm } from "@/components/staff/staff-form";
import { PageHeader } from "@/components/page-header";
import { employmentTypes, type Staff } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Download, Upload, Loader2, Trash2 } from "lucide-react";
import { useUser, useAppData } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { exportToCsv } from "@/lib/csv";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { UpgradeDialog } from "@/components/subscriptions/upgrade-dialog";

const STAFF_LIMIT = 3;

export default function StaffPage() {
  const { profile } = useUser();
  const { staff: allStaff, isLoading, addStaff, updateStaff, deleteStaff } = useAppData();
  const { toast } = useToast();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [filteredStaff, setFilteredStaff] = useState<Staff[]>([]);
  const [editingStaff, setEditingStaff] = useState<Staff | undefined>(undefined);
  const [staffToDelete, setStaffToDelete] = useState<Staff | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);
  
  useEffect(() => {
    if (allStaff) {
      setFilteredStaff(allStaff);
    }
  }, [allStaff]);

  const handleFilterByType = (type: string) => {
    if (type === "all") {
      setFilteredStaff(allStaff || []);
    } else {
      setFilteredStaff((allStaff || []).filter((s) => s.employmentType === type));
    }
  };
  
  const handleAddStaff = () => {
    if (profile?.subscription === 'free' && allStaff && allStaff.length >= STAFF_LIMIT) {
      setIsUpgradeDialogOpen(true);
    } else {
      setEditingStaff(undefined);
      setIsSheetOpen(true);
    }
  };
  
  const handleEditStaff = (staffMember: Staff) => {
    setEditingStaff(staffMember);
    setIsSheetOpen(true);
  };

  const handleDeleteRequest = (staffMember: Staff) => {
    setStaffToDelete(staffMember);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!staffToDelete) return;
    try {
      await deleteStaff(staffToDelete.id);
      toast({
        title: "Personal eliminado",
        description: `El miembro del personal "${staffToDelete.name}" ha sido eliminado.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al eliminar",
        description: "No se pudo eliminar al miembro del personal. Inténtalo de nuevo.",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setStaffToDelete(null);
    }
  };

  const handleFormSubmit = async (values: Omit<Staff, 'id' | 'userId'>) => {
    try {
      if (editingStaff) {
        await updateStaff({ ...values, id: editingStaff.id, userId: editingStaff.userId });
        toast({
          title: "¡Personal actualizado!",
          description: "Los detalles del miembro del personal han sido actualizados.",
        });
      } else {
        await addStaff(values);
        toast({
          title: "¡Personal creado!",
          description: "El nuevo miembro del personal ha sido agregado.",
        });
      }
      setIsSheetOpen(false);
      setEditingStaff(undefined);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Uh oh! Algo salió mal.",
        description: "No se pudo guardar el miembro del personal. Por favor, inténtalo de nuevo.",
      });
    }
  };

  const handleExport = () => {
    if (filteredStaff.length > 0) {
      exportToCsv(`personal-${new Date().toISOString()}.csv`, filteredStaff);
    } else {
      toast({
        title: "No hay datos para exportar",
        description: "Filtra los datos que deseas exportar.",
      });
    }
  };

  return (
    <div>
      <PageHeader title="Manejo de Personal" actionButtonText="Agregar Personal" onActionButtonClick={handleAddStaff}>
        <div className="flex items-center gap-2">
            <Select onValueChange={handleFilterByType} defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {employmentTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
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
        <StaffTable staff={filteredStaff} onEdit={handleEditStaff} onDelete={handleDeleteRequest} onAdd={handleAddStaff} />
      )}

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editingStaff ? 'Editar Personal' : 'Crear Nuevo Personal'}</SheetTitle>
            <SheetDescription>
              {editingStaff ? 'Actualiza los detalles de este miembro del personal.' : 'Rellena los detalles para el nuevo miembro del personal.'}
            </SheetDescription>
          </SheetHeader>
          <StaffForm staffMember={editingStaff} onSubmit={handleFormSubmit} />
        </SheetContent>
      </Sheet>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente al miembro del personal <span className="font-bold">{staffToDelete?.name}</span>.
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

      <UpgradeDialog
        open={isUpgradeDialogOpen}
        onOpenChange={setIsUpgradeDialogOpen}
        featureName="personal"
        limit={STAFF_LIMIT}
      />
    </div>
  );
}

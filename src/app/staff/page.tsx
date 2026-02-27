"use client";

import { useState, useEffect } from "react";
import { StaffTable } from "@/components/staff/staff-table";
import { StaffForm } from "@/components/staff/staff-form";
import { PageHeader } from "@/components/page-header";
import { employmentTypes, type Staff } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Loader2, Trash2 } from "lucide-react";
import { useAppData } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";

export default function StaffPage() {
  const { staff: allStaff, isLoading, addStaff, updateStaff, deleteStaff } = useAppData();
  const { toast } = useToast();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [filteredStaff, setFilteredStaff] = useState<Staff[]>([]);
  const [editingStaff, setEditingStaff] = useState<Staff | undefined>(undefined);
  const [staffToDelete, setStaffToDelete] = useState<Staff | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    let staffToFilter = allStaff;
    
    if (filterType !== 'all') {
        staffToFilter = staffToFilter.filter(s => s.employmentType === filterType);
    }

    if (searchTerm) {
        staffToFilter = staffToFilter.filter(s => 
            s.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    setFilteredStaff(staffToFilter);
  }, [allStaff, filterType, searchTerm]);

  const handleFilterByType = (type: string) => {
    setFilterType(type);
  };
  
  const handleAddStaff = () => {
    setEditingStaff(undefined);
    setIsSheetOpen(true);
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
        title: "Colaborador eliminado",
        description: `El colaborador "${staffToDelete.name}" ha sido eliminado.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'No se puede eliminar al colaborador',
        description: error.message || 'Ocurrió un error al intentar eliminar al colaborador.',
        duration: 6000,
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setStaffToDelete(null);
    }
  };

  const handleFormSubmit = (values: Omit<Staff, 'id' | 'userId'>) => {
    const isDuplicated = allStaff.some(s => 
      s.id !== editingStaff?.id &&
      (s.name.toLowerCase().trim() === values.name.toLowerCase().trim() || s.contact.trim() === values.contact.trim())
    );

    if (isDuplicated) {
      toast({
        variant: "destructive",
        title: "Colaborador duplicado",
        description: "Ya existe un colaborador con este nombre o contacto.",
      });
      return;
    }
    
    if (editingStaff) {
      updateStaff({ ...values, id: editingStaff.id, userId: editingStaff.userId });
      toast({
        title: "¡Colaborador actualizado!",
        description: "Los detalles del colaborador han sido actualizados.",
      });
    } else {
      addStaff(values);
      toast({
        title: "¡Colaborador creado!",
        description: "El nuevo colaborador ha sido agregado.",
      });
    }
    setIsSheetOpen(false);
    setEditingStaff(undefined);
  };

  return (
    <div>
      <PageHeader title="Manejo de Colaboradores" actionButtonText="Agregar Colaborador" onActionButtonClick={handleAddStaff}>
        <div className="flex items-center gap-2">
            <Input 
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-[200px]"
            />
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
            <SheetTitle>{editingStaff ? 'Editar Colaborador' : 'Crear Nuevo Colaborador'}</SheetTitle>
            <SheetDescription>
              {editingStaff ? 'Actualiza los detalles de este colaborador.' : 'Rellena los detalles para el nuevo colaborador.'}
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
              Esta acción eliminará permanentemente al colaborador <span className="font-bold">{staffToDelete?.name}</span>.
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

    
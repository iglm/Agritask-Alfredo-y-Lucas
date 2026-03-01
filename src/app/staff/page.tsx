
"use client";

import { useState, useEffect } from "react";
import { StaffTable } from "@/components/staff/staff-table";
import { StaffForm } from "@/components/staff/staff-form";
import { PageHeader } from "@/components/page-header";
import { employmentTypes, type Staff, type Task } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Loader2, Trash2 } from "lucide-react";
import { useFirebase, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { collection, query, where, doc, setDoc, deleteDoc } from 'firebase/firestore';

export default function StaffPage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const staffQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'staff'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: allStaff, isLoading: isStaffLoading } = useCollection<Staff>(staffQuery);

  const tasksQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'tasks'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: allTasks, isLoading: isTasksLoading } = useCollection<Task>(tasksQuery);

  const isLoading = isStaffLoading || isTasksLoading;

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [filteredStaff, setFilteredStaff] = useState<Staff[]>([]);
  const [editingStaff, setEditingStaff] = useState<Staff | undefined>(undefined);
  const [staffToDelete, setStaffToDelete] = useState<Staff | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    let staffToFilter = allStaff || [];
    
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

  const handleWriteError = (error: any, path: string, operation: 'create' | 'update' | 'delete', requestResourceData?: any) => {
    console.error(`StaffPage Error (${operation} on ${path}):`, error);
    errorEmitter.emit('permission-error', new FirestorePermissionError({ path, operation, requestResourceData }));
    throw error;
  };

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
    if (!staffToDelete || !firestore) return;
    
    const assignedTasks = (allTasks || []).filter(task => task.responsibleId === staffToDelete.id && task.status !== 'Finalizado');
    if (assignedTasks.length > 0) {
        toast({
            variant: 'destructive',
            title: 'No se puede eliminar al colaborador',
            description: `Este colaborador está asignado a ${assignedTasks.length} labor(es) no finalizada(s). Reasigna o finaliza estas labores primero.`,
            duration: 6000,
        });
        setIsDeleteDialogOpen(false);
        setStaffToDelete(null);
        return;
    }

    const docRef = doc(firestore, 'staff', staffToDelete.id);
    deleteDoc(docRef)
        .then(() => {
            toast({
                title: "Colaborador eliminado",
                description: `El colaborador "${staffToDelete.name}" ha sido eliminado.`,
            });
        })
        .catch(error => {
            handleWriteError(error, docRef.path, 'delete');
            toast({
                variant: 'destructive',
                title: 'Error al eliminar',
                description: 'No se pudo eliminar al colaborador. Revisa los permisos e inténtalo de nuevo.',
            });
        });
        
    setIsDeleteDialogOpen(false);
    setStaffToDelete(null);
  };

  const handleFormSubmit = async (values: Omit<Staff, 'id' | 'userId'>) => {
    if (!firestore || !user) return;
    
    const isDuplicated = (allStaff || []).some(s => 
      s.id !== editingStaff?.id &&
      (s.name.toLowerCase().trim() === values.name.toLowerCase().trim() || s.contact?.trim() === values.contact?.trim())
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
      const docRef = doc(firestore, 'staff', editingStaff.id);
      const payload = { ...values, userId: user.uid };
      setDoc(docRef, payload, { merge: true })
        .then(() => {
          toast({ title: "¡Colaborador actualizado!", description: "Los detalles del colaborador han sido actualizados." });
        })
        .catch(error => handleWriteError(error, docRef.path, 'update', payload));
    } else {
      const collectionRef = collection(firestore, 'staff');
      const docRef = doc(collectionRef);
      const payload = { ...values, id: docRef.id, userId: user.uid };
      setDoc(docRef, payload)
        .then(() => {
          toast({ title: "¡Colaborador creado!", description: "El nuevo colaborador ha sido agregado." });
        })
        .catch(error => handleWriteError(error, docRef.path, 'create', payload));
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

    
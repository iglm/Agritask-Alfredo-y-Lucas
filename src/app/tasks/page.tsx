"use client";

import { useState, useEffect } from "react";
import { TasksTable } from "@/components/tasks/tasks-table";
import { TaskForm } from "@/components/tasks/task-form";
import { PageHeader } from "@/components/page-header";
import { taskCategories, type Task, type Staff, type Lot } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAppData } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";

export default function TasksPage() {
  const { tasks: allTasks, lots, staff, supplies, isLoading, addTask, updateTask, deleteTask } = useAppData();
  const { toast } = useToast();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let tasksToFilter = allTasks;

    if (filterCategory !== 'all') {
        tasksToFilter = tasksToFilter.filter(task => task.category === filterCategory);
    }

    if (searchTerm) {
        tasksToFilter = tasksToFilter.filter(task => 
            task.type.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    setFilteredTasks(tasksToFilter);
  }, [allTasks, filterCategory, searchTerm]);

  const handleFilterByCategory = (category: string) => {
    setFilterCategory(category);
  };

  const handleAddTask = () => {
    if (!lots || lots.length === 0) {
      toast({
        variant: "destructive",
        title: "Primero crea un lote",
        description: "Necesitas registrar al menos un lote antes de poder programar una labor.",
      });
      return;
    }

    if (!staff || staff.length === 0) {
      toast({
        variant: "destructive",
        title: "Primero crea un colaborador",
        description: "Necesitas registrar al menos un colaborador para poder asignar una labor.",
      });
      return;
    }
    setEditingTask(undefined);
    setIsSheetOpen(true);
  };
  
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsSheetOpen(true);
  };
  
  const handleDeleteRequest = (task: Task) => {
    setTaskToDelete(task);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!taskToDelete) return;
    deleteTask(taskToDelete.id);
    toast({
      title: "Labor eliminada",
      description: `La labor "${taskToDelete.type}" ha sido eliminada.`,
    });
    setIsDeleteDialogOpen(false);
    setTaskToDelete(null);
  };

  const handleFormSubmit = (values: Omit<Task, 'id' | 'userId'>) => {
    if (editingTask) {
      updateTask({ ...values, id: editingTask.id, userId: editingTask.userId });
      toast({
        title: "¡Labor actualizada!",
        description: "Los detalles de la labor han sido actualizados.",
      });
    } else {
      addTask(values);
      toast({
        title: "¡Labor creada!",
        description: "La nueva labor ha sido agregada a tu lista.",
      });
    }
    setIsSheetOpen(false);
    setEditingTask(undefined);
  };

  return (
    <div>
      <PageHeader title="Gestión de Labores" actionButtonText="Agregar Nueva Labor" onActionButtonClick={handleAddTask}>
        <div className="flex items-center gap-2">
          <Input 
              placeholder="Buscar por tipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-[200px]"
            />
          <Select onValueChange={handleFilterByCategory} defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las Categorías</SelectItem>
              {taskCategories.map((category) => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
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
        <TasksTable tasks={filteredTasks} allTasks={allTasks} lots={lots} staff={staff} onEdit={handleEditTask} onDelete={handleDeleteRequest} onAdd={handleAddTask} />
      )}


      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>{editingTask ? 'Editar Labor' : 'Crear una Nueva Labor'}</SheetTitle>
            <SheetDescription>
              {editingTask ? 'Actualiza los detalles de esta labor.' : 'Completa los detalles para la nueva labor.'}
            </SheetDescription>
          </SheetHeader>
          <TaskForm 
            task={editingTask} 
            onSubmit={handleFormSubmit} 
            lots={lots} 
            staff={staff} 
            tasks={allTasks}
            supplies={supplies}
          />
        </SheetContent>
      </Sheet>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente la labor <span className="font-bold">{taskToDelete?.type}</span>.
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

    
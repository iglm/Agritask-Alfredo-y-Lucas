"use client";

import { useState } from "react";
import { TasksTable } from "@/components/tasks/tasks-table";
import { TaskForm } from "@/components/tasks/task-form";
import { PageHeader } from "@/components/page-header";
import { tasks as allTasks } from "@/lib/data";
import { taskCategories, type Task } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export default function TasksPage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>(allTasks);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);

  const handleFilterByCategory = (category: string) => {
    if (category === "all") {
      setFilteredTasks(allTasks);
    } else {
      setFilteredTasks(allTasks.filter((task) => task.category === category));
    }
  };

  const handleAddTask = () => {
    setEditingTask(undefined);
    setIsSheetOpen(true);
  };
  
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsSheetOpen(true);
  };

  const handleFormSubmit = (task: Task) => {
    console.log("Form submitted for task:", task);
    setIsSheetOpen(false);
  };

  return (
    <div>
      <PageHeader title="Gestión de Labores" actionButtonText="Agregar Nueva Labor" onActionButtonClick={handleAddTask}>
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
      </PageHeader>
      
      <TasksTable tasks={filteredTasks} onEdit={handleEditTask} />

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>{editingTask ? 'Editar Labor' : 'Crear una Nueva Labor'}</SheetTitle>
            <SheetDescription>
              {editingTask ? 'Actualiza los detalles de esta labor.' : 'Completa los detalles para la nueva labor.'}
            </SheetDescription>
          </SheetHeader>
          <TaskForm task={editingTask} onSubmit={handleFormSubmit} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

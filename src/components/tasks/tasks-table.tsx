import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, SquarePen, Trash2 } from "lucide-react";
import { Task, Lot, Staff } from "@/lib/types";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "../ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";

type TasksTableProps = {
  tasks: Task[];
  lots: Lot[];
  staff: Staff[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
};

export function TasksTable({ tasks, lots, staff, onEdit, onDelete }: TasksTableProps) {
  const getLotName = (lotId: string) => lots.find(l => l.id === lotId)?.name || 'N/A';
  const getStaffName = (staffId: string) => staff.find(s => s.id === staffId)?.name || 'N/A';

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Labor</TableHead>
              <TableHead className="hidden lg:table-cell">Lote</TableHead>
              <TableHead className="hidden lg:table-cell">Responsable</TableHead>
              <TableHead className="hidden sm:table-cell">Categoría</TableHead>
              <TableHead>Progreso</TableHead>
              <TableHead className="text-right hidden md:table-cell">Costo (Real/Plan.)</TableHead>
              <TableHead className="w-[50px]"><span className="sr-only">Acciones</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.type}</TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">{getLotName(task.lotId)}</TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">{getStaffName(task.responsibleId)}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="secondary">{task.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={task.progress} className="w-20" />
                      <span className="text-xs text-muted-foreground">{task.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right hidden md:table-cell">
                    ${task.actualCost.toFixed(0)} / <span className="text-muted-foreground">${task.plannedCost.toFixed(0)}</span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menú</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(task)}>
                          <SquarePen className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(task)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No se encontraron labores. Comienza agregando una.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

import React from 'react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, SquarePen, Trash2, CheckSquare, PlusCircle, CircleDashed, Hourglass, CheckCircle2, CircleX, Lock, Tractor, Users } from "lucide-react";
import { Task, Lot, Staff } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "../ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { EmptyState } from "../ui/empty-state";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Progress } from '../ui/progress';

type TasksTableProps = {
  tasks: Task[];
  allTasks: Task[];
  lots: Lot[];
  staff: Staff[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onAdd: () => void;
};

const StatusBadge = ({ status }: { status: Task['status'] }) => {
  const statusConfig = {
    'Finalizado': { icon: <CheckCircle2 />, className: 'bg-[hsl(var(--chart-1))]/10 text-[hsl(var(--chart-1))] border-[hsl(var(--chart-1))]/20' },
    'En Proceso': { icon: <Hourglass />, className: 'bg-[hsl(var(--chart-3))]/10 text-[hsl(var(--chart-3))] border-[hsl(var(--chart-3))]/20' },
    'Pendiente': { icon: <CircleDashed />, className: 'bg-[hsl(var(--chart-2))]/10 text-[hsl(var(--chart-2))] border-[hsl(var(--chart-2))]/20' },
    'Por realizar': { icon: <CircleX />, className: 'bg-muted text-muted-foreground/80 border-border' },
  };

  const config = statusConfig[status] || statusConfig['Por realizar'];

  return (
    <Badge variant="outline" className={cn("gap-1.5 w-fit", config.className)}>
      {React.cloneElement(config.icon, {className: 'h-3 w-3'})}
      {status}
    </Badge>
  )
};

export function TasksTable({ tasks, allTasks, lots, staff, onEdit, onDelete, onAdd }: TasksTableProps) {
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
              <TableHead className="w-[180px]">Estado</TableHead>
              <TableHead className="text-right hidden md:table-cell">Costos (Actual vs Plan.)</TableHead>
              <TableHead className="w-[50px]"><span className="sr-only">Acciones</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.length > 0 ? (
              tasks.map((task) => {
                const dependency = task.dependsOn ? allTasks.find(t => t.id === task.dependsOn) : null;
                const isBlocked = dependency && dependency.status !== 'Finalizado';
                const totalPlannedCost = (task.plannedCost || 0) + (task.supplyCost || 0);

                return (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {isBlocked ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Lock className="h-4 w-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Bloqueada por: "{dependency?.type}"</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : null}
                        <span>{task.type}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">{getLotName(task.lotId)}</TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">{getStaffName(task.responsibleId)}</TableCell>
                    <TableCell className="w-[180px]">
                      <div className="flex flex-col gap-1.5">
                        <StatusBadge status={task.status} />
                        {task.status !== 'Finalizado' && (
                          <div className="flex items-center gap-2">
                            <Progress value={task.progress} className="h-2 flex-1" />
                            <span className="text-xs font-medium text-muted-foreground w-9 text-right">
                              {task.progress.toFixed(0)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right hidden md:table-cell">
                      <span className={cn(task.actualCost > totalPlannedCost && totalPlannedCost > 0 ? "text-destructive font-semibold" : "")}>
                        ${task.actualCost.toFixed(0)}
                      </span>
                      {' '}/ <span className="text-muted-foreground">${totalPlannedCost.toFixed(0)}</span>
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
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-96 p-0">
                   {lots.length === 0 ? (
                      <EmptyState
                        icon={<Tractor className="h-10 w-10" />}
                        title="Primero necesitas un lote"
                        description="Para poder programar una labor, primero debes registrar al menos un lote en tu finca."
                        action={
                          <Button asChild>
                            <Link href="/lotes">
                              <PlusCircle className="mr-2 h-4 w-4" />
                              Crear Lote
                            </Link>
                          </Button>
                        }
                      />
                   ) : staff.length === 0 ? (
                      <EmptyState
                        icon={<Users className="h-10 w-10" />}
                        title="Primero necesitas personal"
                        description="Para poder asignar una labor, primero debes registrar al menos un miembro del personal."
                        action={
                          <Button asChild>
                            <Link href="/staff">
                              <PlusCircle className="mr-2 h-4 w-4" />
                              Agregar Personal
                            </Link>
                          </Button>
                        }
                      />
                   ) : (
                      <EmptyState
                        icon={<CheckSquare className="h-10 w-10" />}
                        title="Programa tu primera labor"
                        description="Asigna tareas a tu personal y lotes para llevar un control detallado de las actividades de tu finca."
                        action={
                          <Button onClick={onAdd}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Agregar Nueva Labor
                          </Button>
                        }
                      />
                   )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

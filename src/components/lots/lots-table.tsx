import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, SquarePen, Trash2, Tractor, PlusCircle, ChevronDown, Loader2, Bot, BarChart } from "lucide-react";
import { Lot, SubLot, Task, Transaction } from "@/lib/types";
import { Card, CardContent } from "../ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { EmptyState } from "../ui/empty-state";
import { Progress } from "../ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { TaskPlanner } from './task-planner';
import { ProfitabilityReportDialog } from '../reports/profitability-report-dialog';

type LotsTableProps = {
  lots: Lot[];
  tasks: Task[];
  transactions: Transaction[];
  onEditLot: (lot: Lot) => void;
  onDeleteLot: (lot: Lot) => void;
  onAddLot: () => void;
  onAddSubLot: (lot: Lot) => void;
  onEditSubLot: (subLot: SubLot) => void;
  onDeleteSubLot: (lotId: string, subLotId: string, name: string) => void;
};

const SubLotsList: React.FC<{ 
  lot: Lot; 
  onAddSubLot: (lot: Lot) => void; 
  onEditSubLot: (subLot: SubLot) => void; 
  onDeleteSubLot: (lotId: string, subLotId: string, name: string) => void; 
}> = ({ lot, onAddSubLot, onEditSubLot, onDeleteSubLot }) => {
  const { firestore, user } = useFirebase();
  
  const subLotsQuery = useMemoFirebase(
    () => user && firestore ? collection(firestore, 'lots', lot.id, 'sublots') : null,
    [firestore, user, lot.id]
  );
  const { data: subLots, isLoading } = useCollection<SubLot>(subLotsQuery);

  return (
    <div className="p-4 bg-background">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-semibold text-sm">Sub-lotes de {lot.name}</h4>
        <Button size="sm" variant="outline" onClick={() => onAddSubLot(lot)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Agregar Sub-lote
        </Button>
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : subLots && subLots.length > 0 ? (
         <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Área (Ha)</TableHead>
              <TableHead># Árboles</TableHead>
              <TableHead><span className="sr-only">Acciones</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subLots.map(subLot => (
              <TableRow key={subLot.id}>
                <TableCell className="font-medium">{subLot.name}</TableCell>
                <TableCell>{subLot.areaHectares}</TableCell>
                <TableCell>{subLot.totalTrees || 0}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => onEditSubLot(subLot)}>
                        <SquarePen className="mr-2 h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => onDeleteSubLot(lot.id, subLot.id, subLot.name)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">Este lote no tiene sub-lotes.</p>
      )}
    </div>
  );
};


export function LotsTable({ lots, tasks, transactions, onEditLot, onDeleteLot, onAddLot, onAddSubLot, onEditSubLot, onDeleteSubLot }: LotsTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead className="hidden md:table-cell">Ubicación</TableHead>
              <TableHead className="hidden md:table-cell">Fecha siembra</TableHead>
              <TableHead>Progreso</TableHead>
              <TableHead className="hidden sm:table-cell text-right">Área (Ha)</TableHead>
              <TableHead className="text-right"># Árboles</TableHead>
              <TableHead className="w-[50px]"><span className="sr-only">Acciones</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lots.length > 0 ? (
              lots.map((lot) => {
                const lotTasks = tasks.filter(task => task.lotId === lot.id);
                const lotTransactions = transactions.filter(t => t.lotId === lot.id);
                const averageProgress = lotTasks.length > 0
                    ? lotTasks.reduce((sum, task) => sum + task.progress, 0) / lotTasks.length
                    : 0;
                
                return (
                  <Collapsible asChild key={lot.id}>
                    <>
                      <CollapsibleTrigger asChild>
                        <TableRow className="cursor-pointer">
                          <TableCell className="p-2">
                             <ChevronDown className="h-5 w-5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                          </TableCell>
                          <TableCell className="font-medium">{lot.name}</TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground">{lot.location || 'N/A'}</TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground">
                              {lot.sowingDate ? format(new Date(lot.sowingDate.replace(/-/g, '\/')), "dd MMM yyyy", { locale: es }) : 'N/A'}
                          </TableCell>
                          <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress value={averageProgress} className="h-2 flex-1 bg-secondary" />
                                <span className="text-xs font-medium text-muted-foreground w-10 text-right">{averageProgress.toFixed(0)}%</span>
                              </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-right">{lot.areaHectares}</TableCell>
                          <TableCell className="text-right">{lot.totalTrees || 0}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                                  <span className="sr-only">Abrir menú</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <ProfitabilityReportDialog lot={lot} tasks={lotTasks} transactions={lotTransactions}>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                        <BarChart className="mr-2 h-4 w-4" />
                                        Reporte de Rentabilidad
                                    </DropdownMenuItem>
                                </ProfitabilityReportDialog>
                                <TaskPlanner lot={lot}>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                        <Bot className="mr-2 h-4 w-4" />
                                        Agente Planificador
                                    </DropdownMenuItem>
                                </TaskPlanner>
                                <DropdownMenuItem onClick={() => onEditLot(lot)}>
                                  <SquarePen className="mr-2 h-4 w-4" />
                                  Editar Lote
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDeleteLot(lot)}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Eliminar Lote
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      </CollapsibleTrigger>
                      <CollapsibleContent asChild>
                        <TableRow>
                          <TableCell colSpan={8} className="p-0 border-b-0">
                            <div className="bg-muted/50">
                              <div className="p-4 border-b">
                                  <h4 className="font-semibold text-sm mb-2">Detalles Adicionales</h4>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-sm">
                                      <div>
                                          <p className="font-medium text-muted-foreground">Cultivo</p>
                                          <p className="text-foreground">{lot.crop || 'No especificado'}</p>
                                      </div>
                                      <div>
                                          <p className="font-medium text-muted-foreground">Tipo de Suelo</p>
                                          <p className="text-foreground">{lot.soilType || 'No especificado'}</p>
                                      </div>
                                      <div>
                                          <p className="font-medium text-muted-foreground">pH Promedio</p>
                                          <p className="text-foreground">{lot.phAverage !== undefined ? lot.phAverage : 'No especificado'}</p>
                                      </div>
                                  </div>
                              </div>
                              <SubLotsList 
                                lot={lot} 
                                onAddSubLot={onAddSubLot} 
                                onEditSubLot={onEditSubLot} 
                                onDeleteSubLot={onDeleteSubLot} 
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      </CollapsibleContent>
                    </>
                  </Collapsible>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="p-0 h-96">
                  <EmptyState
                    icon={<Tractor className="h-10 w-10" />}
                    title="Crea tu primer lote"
                    description="Empieza a organizar tu finca añadiendo tu primer lote de terreno."
                    action={
                      <Button onClick={onAddLot}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Agregar Nuevo Lote
                      </Button>
                    }
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, SquarePen, Trash2, Tractor, PlusCircle, Trees } from "lucide-react";
import { Lot } from "@/lib/types";
import { Card, CardContent } from "../ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { EmptyState } from "../ui/empty-state";

type LotsTableProps = {
  lots: Lot[];
  onEdit: (lot: Lot) => void;
  onDelete: (lot: Lot) => void;
  onAdd: () => void;
};

export function LotsTable({ lots, onEdit, onDelete, onAdd }: LotsTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead className="hidden md:table-cell">Ubicación</TableHead>
              <TableHead className="hidden sm:table-cell text-right">Área (Ha)</TableHead>
              <TableHead className="text-right"># Árboles</TableHead>
              <TableHead className="w-[50px]"><span className="sr-only">Acciones</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lots.length > 0 ? (
              lots.map((lot) => (
                <TableRow key={lot.id}>
                  <TableCell className="font-medium">{lot.name}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{lot.location}</TableCell>
                  <TableCell className="hidden sm:table-cell text-right">{lot.areaHectares}</TableCell>
                  <TableCell className="text-right">{lot.totalTrees || 0}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menú</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(lot)}>
                          <SquarePen className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(lot)}>
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
                <TableCell colSpan={5} className="p-0 h-96">
                  <EmptyState
                    icon={<Tractor className="h-10 w-10" />}
                    title="Crea tu primer lote"
                    description="Empieza a organizar tu finca añadiendo tu primer lote de terreno."
                    action={
                      <Button onClick={onAdd}>
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

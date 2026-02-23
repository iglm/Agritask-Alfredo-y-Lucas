import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, SquarePen, Trash2, SprayCan, PlusCircle } from "lucide-react";
import { Supply } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "../ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { EmptyState } from "../ui/empty-state";

type SuppliesTableProps = {
  supplies: Supply[];
  onEdit: (supply: Supply) => void;
  onDelete: (supply: Supply) => void;
  onAdd: () => void;
};

export function SuppliesTable({ supplies, onEdit, onDelete, onAdd }: SuppliesTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Unidad</TableHead>
              <TableHead className="hidden md:table-cell">Proveedor</TableHead>
              <TableHead className="text-right">Costo Unitario</TableHead>
              <TableHead className="text-right">Stock Actual</TableHead>
              <TableHead className="w-[50px]"><span className="sr-only">Acciones</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {supplies.length > 0 ? (
              supplies.map((supply) => (
                <TableRow key={supply.id}>
                  <TableCell className="font-medium">{supply.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{supply.unitOfMeasure}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{supply.supplier || 'N/A'}</TableCell>
                  <TableCell className="text-right">${supply.costPerUnit.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{supply.currentStock}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menú</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(supply)}>
                           <SquarePen className="mr-2 h-4 w-4" />
                           Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(supply)}>
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
                <TableCell colSpan={6} className="h-96 p-0">
                  <EmptyState
                    icon={<SprayCan className="h-10 w-10" />}
                    title="Añade tu primer insumo"
                    description="Registra tus fertilizantes, pesticidas y otros productos para controlar tu inventario y costos."
                    action={
                      <Button onClick={onAdd}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Agregar Insumo
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

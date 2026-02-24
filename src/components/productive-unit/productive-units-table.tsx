import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, SquarePen, Trash2, Home, PlusCircle } from "lucide-react";
import { ProductiveUnit } from "@/lib/types";
import { Card, CardContent } from "../ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { EmptyState } from "../ui/empty-state";

type ProductiveUnitsTableProps = {
  units: ProductiveUnit[];
  onEdit: (unit: ProductiveUnit) => void;
  onDelete: (unit: ProductiveUnit) => void;
  onAdd: () => void;
};

export function ProductiveUnitsTable({ units, onEdit, onDelete, onAdd }: ProductiveUnitsTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre Finca</TableHead>
              <TableHead className="hidden md:table-cell">Ubicación</TableHead>
              <TableHead className="hidden lg:table-cell">Cultivos</TableHead>
              <TableHead className="w-[50px]"><span className="sr-only">Acciones</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {units.length > 0 ? (
              units.map((unit) => (
                <TableRow key={unit.id}>
                  <TableCell className="font-medium">{unit.farmName || 'Sin nombre'}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{unit.municipality || 'N/A'}, {unit.department || 'N/A'}</TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">{unit.crops?.join(', ') || 'N/A'}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menú</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(unit)}>
                           <SquarePen className="mr-2 h-4 w-4" />
                           Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(unit)}>
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
                <TableCell colSpan={4} className="h-96 p-0">
                  <EmptyState
                    icon={<Home className="h-10 w-10" />}
                    title="Añade tu primera unidad productiva"
                    description="Registra tus fincas o unidades de negocio para empezar a organizar tu operación."
                    action={
                      <Button onClick={onAdd}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Agregar Unidad
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

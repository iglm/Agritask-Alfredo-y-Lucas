import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, SquarePen, Trash2, Users, PlusCircle } from "lucide-react";
import { Staff } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "../ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { EmptyState } from "../ui/empty-state";

type StaffTableProps = {
  staff: Staff[];
  onEdit: (staffMember: Staff) => void;
  onDelete: (staffMember: Staff) => void;
  onAdd: () => void;
};

export function StaffTable({ staff, onEdit, onDelete, onAdd }: StaffTableProps) {
  const getBadgeVariant = (type: Staff['employmentType']) => {
    switch (type) {
      case 'Permanente': return 'default';
      case 'Temporal': return 'secondary';
      case 'Contratista': return 'outline';
      default: return 'default';
    }
  };

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead className="hidden lg:table-cell">Contacto</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="hidden md:table-cell">Certificaciones</TableHead>
              <TableHead className="text-right">Tarifa Diaria</TableHead>
              <TableHead className="w-[50px]"><span className="sr-only">Acciones</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.length > 0 ? (
              staff.map((staffMember) => (
                <TableRow key={staffMember.id}>
                  <TableCell className="font-medium">{staffMember.name}</TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">{staffMember.contact}</TableCell>
                  <TableCell>
                    <Badge variant={getBadgeVariant(staffMember.employmentType)}>{staffMember.employmentType}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{staffMember.certifications || 'N/A'}</TableCell>
                  <TableCell className="text-right">${staffMember.baseDailyRate.toFixed(2)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menú</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(staffMember)}>
                           <SquarePen className="mr-2 h-4 w-4" />
                           Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(staffMember)}>
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
                    icon={<Users className="h-10 w-10" />}
                    title="Añade tu primer miembro del personal"
                    description="Registra a tus trabajadores para poder asignarles labores y llevar un control de costos."
                    action={
                      <Button onClick={onAdd}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Agregar Personal
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

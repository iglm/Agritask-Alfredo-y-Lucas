import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, SquarePen, Trash2 } from "lucide-react";
import { Staff } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "../ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";

type StaffTableProps = {
  staff: Staff[];
  onEdit: (staffMember: Staff) => void;
};

export function StaffTable({ staff, onEdit }: StaffTableProps) {
  const getBadgeVariant = (type: Staff['employmentType']) => {
    switch (type) {
      case 'Permanent': return 'default';
      case 'Temporal': return 'secondary';
      case 'Contractor': return 'outline';
      default: return 'default';
    }
  };

  return (
    <Card>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead className="hidden md:table-cell">Contacto</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Tarifa Diaria</TableHead>
              <TableHead className="w-[50px]"><span className="sr-only">Acciones</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.length > 0 ? (
              staff.map((staffMember) => (
                <TableRow key={staffMember.id}>
                  <TableCell className="font-medium">{staffMember.name}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{staffMember.contact}</TableCell>
                  <TableCell>
                    <Badge variant={getBadgeVariant(staffMember.employmentType)}>{staffMember.employmentType}</Badge>
                  </TableCell>
                  <TableCell className="text-right">${staffMember.dailyRate.toFixed(2)}</TableCell>
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
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => alert(`Eliminando miembro del personal ${staffMember.name}`)}>
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
                <TableCell colSpan={5} className="h-24 text-center">
                  No se encontraron miembros del personal.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

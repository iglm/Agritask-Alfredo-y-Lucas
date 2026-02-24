import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, SquarePen, Trash2, PlusCircle, Banknote } from "lucide-react";
import { Transaction, Lot } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "../ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { EmptyState } from "../ui/empty-state";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { es } from "date-fns/locale";

type TransactionsTableProps = {
  transactions: Transaction[];
  lots: Lot[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  onAdd: () => void;
};

export function TransactionsTable({ transactions, lots, onEdit, onDelete, onAdd }: TransactionsTableProps) {
  const getLotName = (lotId: string) => lots.find(l => l.id === lotId)?.name || 'N/A';
  
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="hidden md:table-cell">Categoría</TableHead>
              <TableHead className="hidden lg:table-cell">Lote</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead className="w-[50px]"><span className="sr-only">Acciones</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length > 0 ? (
              transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium text-muted-foreground">{format(new Date(transaction.date.replace(/-/g, '/')), 'dd MMM yyyy', {locale: es})}</TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell className="hidden md:table-cell"><Badge variant="outline">{transaction.category}</Badge></TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">{transaction.lotId ? getLotName(transaction.lotId) : 'General'}</TableCell>
                  <TableCell className={cn("text-right font-semibold", transaction.type === 'Ingreso' ? 'text-green-600' : 'text-red-600')}>
                    {transaction.type === 'Ingreso' ? '+' : '-'}${transaction.amount.toLocaleString()}
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
                        <DropdownMenuItem onClick={() => onEdit(transaction)}>
                           <SquarePen className="mr-2 h-4 w-4" />
                           Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(transaction)}>
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
                    icon={<Banknote className="h-10 w-10" />}
                    title="Registra tu primera transacción"
                    description="Añade un ingreso o un egreso para empezar a llevar un control de las finanzas de tu finca."
                    action={
                      <Button onClick={onAdd}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Agregar Transacción
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

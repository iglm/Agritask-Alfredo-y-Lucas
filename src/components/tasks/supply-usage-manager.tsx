"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppData, useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { Supply, SupplyUsage } from '@/lib/types';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { collection, query } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

interface SupplyUsageManagerProps {
  taskId: string;
  allSupplies: Supply[];
}

const addSupplySchema = z.object({
  supplyId: z.string().min(1, 'Debes seleccionar un insumo.'),
  quantityUsed: z.coerce.number().positive('La cantidad debe ser mayor que cero.'),
});

type AddSupplyFormValues = z.infer<typeof addSupplySchema>;

export function SupplyUsageManager({ taskId, allSupplies }: SupplyUsageManagerProps) {
  const { firestore } = useFirebase();
  const { addSupplyUsage, deleteSupplyUsage } = useAppData();
  const { toast } = useToast();
  
  const [isAdding, setIsAdding] = useState(false);

  const { control, handleSubmit, reset, watch } = useForm<AddSupplyFormValues>({
    resolver: zodResolver(addSupplySchema),
    defaultValues: { supplyId: '', quantityUsed: 0 },
  });

  const usagesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'tasks', taskId, 'supplyUsages')) : null, [firestore, taskId]);
  const { data: supplyUsages, isLoading: isLoadingUsages } = useCollection<SupplyUsage>(usagesQuery);
  
  const selectedSupplyId = watch('supplyId');
  const selectedSupply = allSupplies.find(s => s.id === selectedSupplyId);

  const onAddSupply = async (values: AddSupplyFormValues) => {
    setIsAdding(true);
    try {
      if (selectedSupply && values.quantityUsed > selectedSupply.currentStock) {
        toast({
          variant: 'destructive',
          title: 'Stock insuficiente',
          description: `Solo tienes ${selectedSupply.currentStock} ${selectedSupply.unitOfMeasure} de ${selectedSupply.name} en el inventario.`,
        });
        return;
      }
      await addSupplyUsage(taskId, values.supplyId, values.quantityUsed);
      reset({ supplyId: '', quantityUsed: 0 });
      toast({ title: 'Insumo añadido', description: 'El costo de la labor y el inventario han sido actualizados.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error al añadir insumo', description: error.message });
    } finally {
      setIsAdding(false);
    }
  };
  
  const onDeleteSupply = async (usage: SupplyUsage) => {
    try {
      await deleteSupplyUsage(usage);
      toast({ title: 'Insumo eliminado', description: 'El costo de la labor y el inventario han sido revertidos.' });
    } catch (error: any) {
       toast({ variant: 'destructive', title: 'Error al eliminar insumo', description: error.message });
    }
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <h3 className="font-medium">Gestor de Insumos</h3>
      <form onSubmit={handleSubmit(onAddSupply)} className="flex items-end gap-2">
        <div className="flex-1">
          <label className="text-sm font-medium">Insumo</label>
          <Controller
            name="supplyId"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  {allSupplies.map(supply => (
                    <SelectItem key={supply.id} value={supply.id}>{supply.name} ({supply.currentStock} {supply.unitOfMeasure} disp.)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="w-28">
           <label className="text-sm font-medium">Cantidad</label>
           <Controller
              name="quantityUsed"
              control={control}
              render={({ field }) => <Input type="number" step="any" {...field} placeholder={selectedSupply?.unitOfMeasure || 'Cant.'} />}
            />
        </div>
        <Button type="submit" size="sm" disabled={isAdding}>
          {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
          Añadir
        </Button>
      </form>
      
      <div className="space-y-2 pt-2">
         <h4 className="text-sm font-medium">Insumos Aplicados</h4>
         {isLoadingUsages ? (
            <div className="text-sm text-muted-foreground">Cargando...</div>
         ) : supplyUsages && supplyUsages.length > 0 ? (
            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Cantidad</TableHead>
                            <TableHead>Costo</TableHead>
                            <TableHead><span className="sr-only">Acciones</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {supplyUsages.map(usage => (
                            <TableRow key={usage.id}>
                                <TableCell>{usage.supplyName}</TableCell>
                                <TableCell>{usage.quantityUsed}</TableCell>
                                <TableCell>${usage.costAtTimeOfUse.toLocaleString()}</TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDeleteSupply(usage)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
         ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No se han añadido insumos a esta labor.</p>
         )}
      </div>
    </div>
  );
}

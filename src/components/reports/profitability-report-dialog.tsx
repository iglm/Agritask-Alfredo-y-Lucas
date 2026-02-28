'use client';

import { useMemo, useState } from "react";
import { Lot, Task, Transaction } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BarChart, DollarSign, Minus, Plus, Scale, ShoppingBag, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";
import { cn } from "@/lib/utils";
import { useLocalization } from "@/context/localization-context";

interface ProfitabilityReportDialogProps {
  lot: Lot;
  tasks: Task[];
  transactions: Transaction[];
  children: React.ReactNode;
}

const StatCard = ({ title, value, icon, className }: { title: string, value: string, icon: React.ReactNode, className?: string }) => (
    <div className="flex items-center space-x-4 rounded-md border p-4">
        <div className="flex-shrink-0">{icon}</div>
        <div className="flex-1 space-y-1">
            <p className="text-sm font-medium leading-none">{title}</p>
            <p className={cn("text-2xl font-bold", className)}>{value}</p>
        </div>
    </div>
);


export function ProfitabilityReportDialog({ lot, tasks, transactions, children }: ProfitabilityReportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { formatCurrency } = useLocalization();

  const report = useMemo(() => {
    if (!isOpen) return null;

    const totalRevenue = transactions
        .filter(t => t.type === 'Ingreso')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const taskCosts = tasks.reduce((sum, t) => sum + t.actualCost, 0);
    const expenseTransactions = transactions
        .filter(t => t.type === 'Egreso')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalCost = taskCosts + expenseTransactions;
    const totalHarvestKg = tasks
        .filter(t => t.category === 'Cosecha' && t.harvestedQuantity)
        .reduce((sum, t) => sum + t.harvestedQuantity!, 0);

    const netProfit = totalRevenue - totalCost;

    const costPerKg = totalHarvestKg > 0 ? totalCost / totalHarvestKg : 0;
    const revenuePerKg = totalHarvestKg > 0 ? totalRevenue / totalHarvestKg : 0;
    const profitPerKg = totalHarvestKg > 0 ? netProfit / totalHarvestKg : 0;
    
    return {
        totalRevenue,
        totalCost,
        totalHarvestKg,
        netProfit,
        costPerKg,
        revenuePerKg,
        profitPerKg,
    };

  }, [isOpen, lot, tasks, transactions]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart className="h-6 w-6 text-primary" />
            Reporte de Rentabilidad: {lot.name}
          </DialogTitle>
          <DialogDescription>
            Análisis financiero detallado para el lote seleccionado basado en los datos registrados.
          </DialogDescription>
        </DialogHeader>

        {report && (
            <div className="grid gap-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard 
                        title="Ingresos Totales" 
                        value={formatCurrency(report.totalRevenue)}
                        icon={<TrendingUp className="h-8 w-8 text-green-500" />}
                    />
                    <StatCard
                        title="Costos Totales"
                        value={formatCurrency(report.totalCost)}
                        icon={<TrendingDown className="h-8 w-8 text-red-500" />}
                    />
                    <StatCard
                        title="Rentabilidad Neta"
                        value={formatCurrency(report.netProfit)}
                        className={report.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}
                        icon={<DollarSign className="h-8 w-8 text-primary" />}
                    />
                </div>
                
                <Separator />

                <div className="space-y-4">
                     <div className="flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5 text-muted-foreground"/>
                        <h3 className="text-lg font-semibold">Análisis de Cosecha</h3>
                    </div>
                     <p className="text-sm text-muted-foreground">
                        Total Cosechado: <span className="font-bold text-foreground">{report.totalHarvestKg.toLocaleString()} Kg</span>
                    </p>
                    {report.totalHarvestKg > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <StatCard 
                                title="Ingreso por Kg" 
                                value={formatCurrency(report.revenuePerKg, { includeDecimals: true })}
                                icon={<Plus className="h-6 w-6 text-green-500" />}
                            />
                            <StatCard
                                title="Costo por Kg"
                                value={formatCurrency(report.costPerKg, { includeDecimals: true })}
                                icon={<Minus className="h-6 w-6 text-red-500" />}
                            />
                            <StatCard
                                title="Rentabilidad por Kg"
                                value={formatCurrency(report.profitPerKg, { includeDecimals: true })}
                                className={report.profitPerKg >= 0 ? 'text-green-600' : 'text-red-600'}
                                icon={<Scale className="h-6 w-6 text-primary" />}
                            />
                        </div>
                    ) : (
                        <div className="text-center py-8 px-4 border border-dashed rounded-lg">
                            <p className="text-muted-foreground">No se ha registrado ninguna cantidad cosechada para este lote.</p>
                            <p className="text-sm text-muted-foreground mt-1">Edita las labores de 'Cosecha' y añade la cantidad en Kg para ver el análisis.</p>
                        </div>
                    )}
                </div>
            </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

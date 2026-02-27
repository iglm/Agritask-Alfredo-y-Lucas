"use client";

import { KpiCard } from "@/components/dashboard/kpi-card";
import { useAppData } from "@/firebase";
import { Tractor, TrendingUp, TrendingDown, Scale, Download, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { UpcomingTasks } from "@/components/dashboard/upcoming-tasks";
import { Skeleton } from "@/components/ui/skeleton";
import { AnomalyDetector } from "@/components/dashboard/anomaly-detector";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { DataAuditor } from "@/components/dashboard/data-auditor";
import { ResourceOptimizer } from "@/components/dashboard/resource-optimizer";
import { handleExportAll } from "@/lib/export";

export default function DashboardPage() {
  const { lots, tasks, transactions, isLoading, staff, supplies, productiveUnits, firestore, user } = useAppData();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  
  const { 
    totalLots, 
    totalIncome, 
    totalExpenses, 
    netBalance 
  } = useMemo(() => {
    if (isLoading || !lots || !tasks || !transactions) {
      return { totalLots: 0, totalIncome: 0, totalExpenses: 0, netBalance: 0 };
    }
    
    const totalLotsCount = lots.length;

    const totalIncome = transactions
      .filter(t => t.type === 'Ingreso')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalTaskCost = tasks.reduce((sum, task) => sum + task.actualCost, 0);
    const totalExplicitExpenses = transactions
      .filter(t => t.type === 'Egreso')
      .reduce((sum, t) => sum + t.amount, 0);
    
    // El costo total es la suma de los costos de las labores (que ya incluyen insumos) y los egresos explícitos.
    const totalExpenses = totalTaskCost + totalExplicitExpenses;
    const netBalance = totalIncome - totalExpenses;

    return { totalLots: totalLotsCount, totalIncome, totalExpenses, netBalance };
  }, [lots, tasks, transactions, isLoading]);

  const onExport = async () => {
    if (!firestore || !user) {
      toast({ variant: "destructive", title: "Error", description: "No se puede conectar a la base de datos." });
      return;
    }
    
    setIsExporting(true);
    await handleExportAll(
      firestore, 
      user,
      { lots, staff, tasks, supplies, productiveUnits, transactions },
      toast as any
    );
    setIsExporting(false);
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-[108px]" />
          <Skeleton className="h-[108px]" />
          <Skeleton className="h-[108px]" />
          <Skeleton className="h-[108px]" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[380px]" />
          <Skeleton className="h-[380px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Panel Principal">
        <Button variant="outline" onClick={onExport} disabled={isExporting}>
          {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          Crear Respaldo Completo
        </Button>
      </PageHeader>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Lotes Totales"
          value={totalLots}
          icon={<Tractor className="h-6 w-6 text-primary" />}
          href="/lotes"
        />
        <KpiCard
          title="Ingresos Totales"
          value={`$${totalIncome.toLocaleString()}`}
          icon={<TrendingUp className="h-6 w-6 text-success" />}
          href="/financials"
        />
        <KpiCard
          title="Egresos Totales"
          value={`$${totalExpenses.toLocaleString()}`}
          icon={<TrendingDown className="h-6 w-6 text-destructive" />}
          href="/financials"
        />
        <KpiCard
          title="Balance Neto"
          value={`$${netBalance.toLocaleString()}`}
          icon={<Scale className="h-6 w-6 text-primary" />}
          href="/financials"
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <UpcomingTasks tasks={tasks} lots={lots} />
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <AnomalyDetector lots={lots} tasks={tasks} transactions={transactions} />
          <DataAuditor lots={lots} tasks={tasks} staff={staff} />
          <ResourceOptimizer tasks={tasks} staff={staff} supplies={supplies} />
      </div>
    </div>
  );
}

"use client";

import { KpiCard } from "@/components/dashboard/kpi-card";
import { useAppData } from "@/firebase";
import { Tractor, TrendingUp, TrendingDown, Scale, Download, Loader2, HardHat } from "lucide-react";
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
import { useLocalization } from "@/context/localization-context";

export default function DashboardPage() {
  const { lots, tasks, transactions, isLoading, staff, supplies, productiveUnits, firestore, user } = useAppData();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const { t, formatCurrency } = useLocalization();
  
  const { 
    totalLots, 
    totalIncome, 
    productiveCosts,
    supportCosts,
  } = useMemo(() => {
    if (isLoading || !lots || !tasks || !transactions) {
      return { totalLots: 0, totalIncome: 0, productiveCosts: 0, supportCosts: 0 };
    }
    
    const lotTypeMap = new Map(lots.map(lot => [lot.id, lot.type]));
    const totalLotsCount = lots.length;

    const totalIncome = transactions
      .filter(t => t.type === 'Ingreso')
      .reduce((sum, t) => sum + t.amount, 0);

    let productiveTaskCost = 0;
    let supportTaskCost = 0;

    tasks.forEach(task => {
        const lotType = lotTypeMap.get(task.lotId);
        if (lotType === 'Productivo') {
            productiveTaskCost += task.actualCost;
        } else { // Soporte o lotes sin tipo definido (antiguos) se consideran soporte
            supportTaskCost += task.actualCost;
        }
    });

    let productiveExplicitExpenses = 0;
    let supportExplicitExpenses = 0;
    let generalExplicitExpenses = 0;

    transactions
      .filter(t => t.type === 'Egreso')
      .forEach(exp => {
        if (exp.lotId) {
            const lotType = lotTypeMap.get(exp.lotId);
            if (lotType === 'Productivo') {
                productiveExplicitExpenses += exp.amount;
            } else { // Soporte o lotes sin tipo definido
                supportExplicitExpenses += exp.amount;
            }
        } else {
            // Los gastos generales/administrativos se consideran costos de soporte.
            generalExplicitExpenses += exp.amount;
        }
    });
    
    const finalProductiveCosts = productiveTaskCost + productiveExplicitExpenses;
    const finalSupportCosts = supportTaskCost + supportExplicitExpenses + generalExplicitExpenses;

    return { 
        totalLots: totalLotsCount, 
        totalIncome, 
        productiveCosts: finalProductiveCosts,
        supportCosts: finalSupportCosts,
    };
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
      toast
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
      <PageHeader title={t('dashboard.title')}>
        <Button variant="outline" onClick={onExport} disabled={isExporting}>
          {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          Crear Respaldo Completo
        </Button>
      </PageHeader>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title={t('dashboard.total_lots')}
          value={totalLots}
          icon={<Tractor className="h-6 w-6 text-primary" />}
          href="/lotes"
        />
        <KpiCard
          title={t('dashboard.total_income')}
          value={formatCurrency(totalIncome)}
          icon={<TrendingUp className="h-6 w-6 text-green-500" />}
          href="/financials"
        />
        <KpiCard
          title={t('dashboard.productive_costs')}
          value={formatCurrency(productiveCosts)}
          icon={<TrendingDown className="h-6 w-6 text-destructive" />}
          href="/financials"
        />
        <KpiCard
          title={t('dashboard.support_costs')}
          value={formatCurrency(supportCosts)}
          icon={<HardHat className="h-6 w-6 text-amber-600" />}
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

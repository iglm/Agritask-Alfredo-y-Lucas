"use client";

import { KpiCard } from "@/components/dashboard/kpi-card";
import { InvestmentChart } from "@/components/dashboard/investment-chart";
import { TasksDistributionChart } from "@/components/dashboard/tasks-distribution-chart";
import { useAppData } from "@/firebase";
import { Tractor, Percent, TrendingUp, TrendingDown, Scale } from "lucide-react";
import { useMemo } from "react";
import { UpcomingTasks } from "@/components/dashboard/upcoming-tasks";
import { Skeleton } from "@/components/ui/skeleton";
import { AnomalyDetector } from "@/components/dashboard/anomaly-detector";

export default function DashboardPage() {
  const { lots, tasks, transactions, isLoading } = useAppData();
  
  const { 
    totalLots, 
    overallEfficiency, 
    totalIncome, 
    totalExpenses, 
    netBalance 
  } = useMemo(() => {
    if (isLoading || !lots || !tasks || !transactions) {
      return { totalLots: 0, overallEfficiency: 0, totalIncome: 0, totalExpenses: 0, netBalance: 0 };
    }
    
    const totalLots = lots.length;
    
    const totalProgress = tasks.reduce((sum, task) => sum + task.progress, 0);
    const overallEfficiency = tasks.length > 0 ? totalProgress / tasks.length : 0;

    const totalIncome = transactions
      .filter(t => t.type === 'Ingreso')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalTaskCost = tasks.reduce((sum, task) => sum + task.actualCost, 0);
    const totalExplicitExpenses = transactions
      .filter(t => t.type === 'Egreso')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = totalTaskCost + totalExplicitExpenses;
    const netBalance = totalIncome - totalExpenses;

    return { totalLots, overallEfficiency, totalIncome, totalExpenses, netBalance };
  }, [lots, tasks, transactions, isLoading]);
  
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-[108px]" />
          <Skeleton className="h-[108px]" />
          <Skeleton className="h-[108px]" />
          <Skeleton className="h-[108px]" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <Skeleton className="lg:col-span-3 h-[380px]" />
          <Skeleton className="lg:col-span-2 h-[380px]" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
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
          icon={<TrendingUp className="h-6 w-6 text-green-600" />}
          href="/financials"
        />
        <KpiCard
          title="Egresos Totales"
          value={`$${totalExpenses.toLocaleString()}`}
          icon={<TrendingDown className="h-6 w-6 text-red-600" />}
          href="/financials"
        />
        <KpiCard
          title="Balance Neto"
          value={`$${netBalance.toLocaleString()}`}
          icon={<Scale className="h-6 w-6 text-primary" />}
          href="/financials"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <InvestmentChart lots={lots || []} tasks={tasks || []} />
        </div>
        <div className="lg:col-span-2">
          <TasksDistributionChart tasks={tasks || []} />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingTasks tasks={tasks || []} lots={lots || []} />
        <AnomalyDetector lots={lots || []} tasks={tasks || []} />
      </div>
    </div>
  );
}

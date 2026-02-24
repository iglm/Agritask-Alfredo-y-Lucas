"use client";

import { KpiCard } from "@/components/dashboard/kpi-card";
import { InvestmentChart } from "@/components/dashboard/investment-chart";
import { TasksDistributionChart } from "@/components/dashboard/tasks-distribution-chart";
import { useAppData } from "@/firebase";
import { DollarSign, Tractor, Percent, CheckSquare } from "lucide-react";
import { useMemo } from "react";
import { UpcomingTasks } from "@/components/dashboard/upcoming-tasks";
import { Skeleton } from "@/components/ui/skeleton";
import { AnomalyDetector } from "@/components/dashboard/anomaly-detector";

export default function DashboardPage() {
  const { lots, tasks, isLoading } = useAppData();
  
  const { totalLots, totalPlannedCost, totalActualCost, overallEfficiency } = useMemo(() => {
    if (!lots || !tasks) {
      return { totalLots: 0, totalPlannedCost: 0, totalActualCost: 0, overallEfficiency: 0 };
    }
    
    const totalLots = lots.length;
    const totalPlannedCost = tasks.reduce((sum, task) => sum + task.plannedCost + (task.supplyCost || 0), 0);
    const totalActualCost = tasks.reduce((sum, task) => sum + task.actualCost, 0);
    const totalProgress = tasks.reduce((sum, task) => sum + task.progress, 0);
    const overallEfficiency = tasks.length > 0 ? totalProgress / tasks.length : 0;

    return { totalLots, totalPlannedCost, totalActualCost, overallEfficiency };
  }, [lots, tasks]);
  
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
          title="Costo Planificado"
          value={`$${totalPlannedCost.toLocaleString()}`}
          icon={<DollarSign className="h-6 w-6 text-primary" />}
          href="/tasks"
        />
        <KpiCard
          title="Costo Real"
          value={`$${totalActualCost.toLocaleString()}`}
          icon={<CheckSquare className="h-6 w-6 text-primary" />}
          href="/tasks"
        />
        <KpiCard
          title="Eficiencia Prom."
          value={`${overallEfficiency.toFixed(1)}%`}
          icon={<Percent className="h-6 w-6 text-primary" />}
          href="/tasks"
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

"use client";

import { KpiCard } from "@/components/dashboard/kpi-card";
import { InvestmentChart } from "@/components/dashboard/investment-chart";
import { AnomalyDetector } from "@/components/dashboard/anomaly-detector";
import { TasksDistributionChart } from "@/components/dashboard/tasks-distribution-chart";
import { lots, tasks } from "@/lib/data";
import { DollarSign, Tractor, Percent, CheckSquare } from "lucide-react";
import { useMemo } from "react";

export default function DashboardPage() {
  const { totalLots, totalPlannedCost, totalActualCost, overallEfficiency } = useMemo(() => {
    const totalLots = lots.length;
    const totalPlannedCost = tasks.reduce((sum, task) => sum + task.plannedCost, 0);
    const totalActualCost = tasks.reduce((sum, task) => sum + task.actualCost, 0);
    const totalProgress = tasks.reduce((sum, task) => sum + task.progress, 0);
    const overallEfficiency = tasks.length > 0 ? totalProgress / tasks.length : 0;

    return { totalLots, totalPlannedCost, totalActualCost, overallEfficiency };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Lotes Totales"
          value={totalLots}
          icon={<Tractor className="h-6 w-6 text-primary" />}
        />
        <KpiCard
          title="Costo Planificado"
          value={`$${totalPlannedCost.toLocaleString()}`}
          icon={<DollarSign className="h-6 w-6 text-primary" />}
        />
        <KpiCard
          title="Costo Real"
          value={`$${totalActualCost.toLocaleString()}`}
          icon={<CheckSquare className="h-6 w-6 text-primary" />}
        />
        <KpiCard
          title="Eficiencia Prom."
          value={`${overallEfficiency.toFixed(1)}%`}
          icon={<Percent className="h-6 w-6 text-primary" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <InvestmentChart />
        </div>
        <div className="lg:col-span-2">
          <TasksDistributionChart />
        </div>
      </div>
      
      <div>
        <AnomalyDetector />
      </div>
    </div>
  );
}

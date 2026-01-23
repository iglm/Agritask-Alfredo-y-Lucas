"use client";

import { KpiCard } from "@/components/dashboard/kpi-card";
import { InvestmentChart } from "@/components/dashboard/investment-chart";
import { AnomalyDetector } from "@/components/dashboard/anomaly-detector";
import { TasksDistributionChart } from "@/components/dashboard/tasks-distribution-chart";
import { useCollection, useFirebase, useMemoFirebase, useUser } from "@/firebase";
import { Lot, Task } from "@/lib/types";
import { DollarSign, Tractor, Percent, CheckSquare, Loader2 } from "lucide-react";
import { useMemo } from "react";
import { collection, query, where } from "firebase/firestore";

export default function DashboardPage() {
  const { firestore } = useFirebase();
  const { user, isUserLoading: isUserLoading } = useUser();

  const lotsQuery = useMemoFirebase(() => 
    user ? query(collection(firestore, 'lots'), where('userId', '==', user.uid)) : null
  , [firestore, user]);
  const { data: lots, isLoading: isLotsLoading } = useCollection<Lot>(lotsQuery);

  const tasksQuery = useMemoFirebase(() =>
    user ? query(collection(firestore, 'tasks'), where('userId', '==', user.uid)) : null
  , [firestore, user]);
  const { data: tasks, isLoading: isTasksLoading } = useCollection<Task>(tasksQuery);
  
  const { totalLots, totalPlannedCost, totalActualCost, overallEfficiency } = useMemo(() => {
    if (!lots || !tasks) {
      return { totalLots: 0, totalPlannedCost: 0, totalActualCost: 0, overallEfficiency: 0 };
    }
    
    const totalLots = lots.length;
    const totalPlannedCost = tasks.reduce((sum, task) => sum + task.plannedCost, 0);
    const totalActualCost = tasks.reduce((sum, task) => sum + task.actualCost, 0);
    const totalProgress = tasks.reduce((sum, task) => sum + task.progress, 0);
    const overallEfficiency = tasks.length > 0 ? totalProgress / tasks.length : 0;

    return { totalLots, totalPlannedCost, totalActualCost, overallEfficiency };
  }, [lots, tasks]);
  
  const isLoading = isUserLoading || isLotsLoading || isTasksLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
          <InvestmentChart lots={lots || []} tasks={tasks || []} />
        </div>
        <div className="lg:col-span-2">
          <TasksDistributionChart tasks={tasks || []} />
        </div>
      </div>
      
      <div>
        <AnomalyDetector tasks={tasks || []} />
      </div>
    </div>
  );
}

"use client";

import { useAppData } from "@/firebase";
import { PageHeader } from "@/components/page-header";
import { FinancialTrendsChart } from "@/components/dashboard/FinancialTrendsChart";
import { ProfitabilityByLotChart } from "@/components/dashboard/ProfitabilityByLotChart";
import { WorkerPerformanceChart } from "@/components/dashboard/WorkerPerformanceChart";
import { InvestmentChart } from "@/components/dashboard/investment-chart";
import { TasksDistributionChart } from "@/components/dashboard/tasks-distribution-chart";
import { Skeleton } from "@/components/ui/skeleton";
import { SupplyConsumptionChart } from "@/components/dashboard/SupplyConsumptionChart";
import { SupplyUsageByLotReport } from "@/components/reports/SupplyUsageByLotReport";

export default function ReportsPage() {
  const { lots, tasks, transactions, staff, supplies, supplyUsages, isLoading } = useAppData();

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Reportes y Análisis" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[380px]" />
          <Skeleton className="h-[380px]" />
          <Skeleton className="h-[380px]" />
          <Skeleton className="h-[380px]" />
          <Skeleton className="h-[380px]" />
          <Skeleton className="h-[380px]" />
          <Skeleton className="h-[380px] lg:col-span-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Reportes y Análisis" />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <FinancialTrendsChart transactions={transactions} tasks={tasks} />
        <ProfitabilityByLotChart lots={lots} tasks={tasks} transactions={transactions} />
        <WorkerPerformanceChart staff={staff} tasks={tasks} />
        <InvestmentChart lots={lots} tasks={tasks} />
        <TasksDistributionChart tasks={tasks} />
        <SupplyConsumptionChart supplies={supplies} supplyUsages={supplyUsages} />
        <SupplyUsageByLotReport lots={lots} tasks={tasks} supplies={supplies} supplyUsages={supplyUsages} />
      </div>
    </div>
  );
}

"use client";

import { useAppData, useCollection, useFirebase, useMemoFirebase } from "@/firebase";
import { PageHeader } from "@/components/page-header";
import { FinancialTrendsChart } from "@/components/dashboard/FinancialTrendsChart";
import { ProfitabilityByLotChart } from "@/components/dashboard/ProfitabilityByLotChart";
import { WorkerPerformanceChart } from "@/components/dashboard/WorkerPerformanceChart";
import { InvestmentChart } from "@/components/dashboard/investment-chart";
import { TasksDistributionChart } from "@/components/dashboard/tasks-distribution-chart";
import { Skeleton } from "@/components/ui/skeleton";
import { SupplyConsumptionChart } from "@/components/dashboard/SupplyConsumptionChart";
import { SupplyUsageByLotReport } from "@/components/reports/SupplyUsageByLotReport";
import { SupportCostsBreakdownChart } from "@/components/dashboard/SupportCostsBreakdownChart";
import { SupplyUsage } from "@/lib/types";
import { collectionGroup, query, where } from "firebase/firestore";

export default function ReportsPage() {
  const { firestore, user } = useFirebase();
  const { lots, tasks, transactions, staff, supplies, isLoading: isAppDataLoading } = useAppData();

  const supplyUsagesQuery = useMemoFirebase(() => user && firestore ? query(collectionGroup(firestore, 'supplyUsages'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: supplyUsages, isLoading: supplyUsagesLoading } = useCollection<SupplyUsage>(supplyUsagesQuery);

  const isLoading = isAppDataLoading || supplyUsagesLoading;

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
        <FinancialTrendsChart transactions={transactions || []} tasks={tasks || []} lots={lots || []} />
        <ProfitabilityByLotChart lots={lots || []} tasks={tasks || []} transactions={transactions || []} />
        <WorkerPerformanceChart staff={staff || []} tasks={tasks || []} />
        <InvestmentChart lots={lots || []} tasks={tasks || []} supplies={supplies || []} />
        <TasksDistributionChart tasks={tasks || []} />
        <SupplyConsumptionChart supplies={supplies || []} supplyUsages={supplyUsages || []} />
        <SupportCostsBreakdownChart lots={lots || []} tasks={tasks || []} transactions={transactions || []} />
        <SupplyUsageByLotReport lots={lots || []} tasks={tasks || []} supplies={supplies || []} supplyUsages={supplyUsages || []} />
      </div>
    </div>
  );
}

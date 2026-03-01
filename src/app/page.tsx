"use client";

import { KpiCard } from "@/components/dashboard/kpi-card";
import { Tractor, TrendingUp, TrendingDown, Download, Loader2, HardHat } from "lucide-react";
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
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { Lot, Task, Transaction, Staff, Supply, ProductiveUnit } from "@/lib/types";
import { query, collection, where, doc, setDoc } from 'firebase/firestore';
import { format, addDays, addWeeks, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';

export default function DashboardPage() {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const { t, formatCurrency } = useLocalization();
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  
  const { firestore, user } = useFirebase();

  const lotsQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'lots'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: lots, isLoading: lotsLoading } = useCollection<Lot>(lotsQuery);

  const tasksQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'tasks'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: tasks, isLoading: tasksLoading } = useCollection<Task>(tasksQuery);

  const transactionsQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'transactions'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: transactions, isLoading: transactionsLoading } = useCollection<Transaction>(transactionsQuery);
  
  const staffQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'staff'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: staff, isLoading: staffLoading } = useCollection<Staff>(staffQuery);

  const suppliesQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'supplies'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: supplies, isLoading: suppliesLoading } = useCollection<Supply>(suppliesQuery);

  const productiveUnitsQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'productiveUnits'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: productiveUnits, isLoading: productiveUnitsLoading } = useCollection<ProductiveUnit>(productiveUnitsQuery);

  const isLoading = lotsLoading || tasksLoading || transactionsLoading || staffLoading || suppliesLoading || productiveUnitsLoading;

  const addTask = async (data: Omit<Task, 'id' | 'userId'>): Promise<Task> => {
    if (!user || !firestore) throw new Error("Not authenticated");
    const newDocRef = doc(collection(firestore, 'tasks'));
    const newTask: Task = { ...data, id: newDocRef.id, userId: user.uid };
    await setDoc(newDocRef, newTask);
    return newTask;
  };

  const updateTask = async (data: Task) => {
    if (!user || !firestore) return;
    const docRef = doc(firestore, 'tasks', data.id);
    const originalTask = tasks?.find(t => t.id === data.id);
    const isNowFinalized = data.status === 'Finalizado' && originalTask?.status !== 'Finalizado';

    await setDoc(docRef, { ...data, userId: user.uid }, { merge: true });

    if (isNowFinalized) {
        if (data.isRecurring && data.recurrenceFrequency && data.recurrenceInterval && data.recurrenceInterval > 0) {
            const baseDateString = data.endDate || data.startDate;
            const baseDateForRecurrence = new Date(baseDateString.replace(/-/g, '/'));
            let newStartDate: Date;

            switch (data.recurrenceFrequency) {
                case 'días': newStartDate = addDays(baseDateForRecurrence, data.recurrenceInterval); break;
                case 'semanas': newStartDate = addWeeks(baseDateForRecurrence, data.recurrenceInterval); break;
                case 'meses': newStartDate = addMonths(baseDateForRecurrence, data.recurrenceInterval); break;
                default: console.error("Invalid recurrence frequency"); return;
            }

            const { id, userId, endDate, status, progress, supplyCost, actualCost, ...restOfTaskData } = data;
            const nextTaskData: Omit<Task, 'id' | 'userId'> = { ...restOfTaskData, startDate: format(newStartDate, 'yyyy-MM-dd'), endDate: undefined, status: 'Por realizar', progress: 0, supplyCost: 0, actualCost: 0, observations: `Labor recurrente generada automáticamente.`, dependsOn: undefined, };
            await addTask(nextTaskData);
            toast({ title: 'Labor recurrente creada', description: `Se ha programado la siguiente labor "${data.type}" para el ${format(newStartDate, "PPP", { locale: es })}.` });
        }
    }
  };


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
      { lots: lots || [], staff: staff || [], tasks: tasks || [], supplies: supplies || [], productiveUnits: productiveUnits || [], transactions: transactions || [] },
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
        <UpcomingTasks tasks={tasks || []} lots={lots || []} />
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <AnomalyDetector
            title="Analista de Anomalías"
            description="Encuentra sobrecostos, retrasos o gastos inesperados en tu operación."
            lots={lots || []} 
            tasks={tasks || []} 
            transactions={transactions || []} 
            isAiProcessing={isAiProcessing}
            setIsAiProcessing={setIsAiProcessing}
          />
          <DataAuditor 
            title="Auditor de Planificación"
            description="Detecta inconsistencias lógicas, riesgos de cumplimiento y omisiones en tu planificación."
            lots={lots || []} 
            tasks={tasks || []} 
            staff={staff || []}
            isAiProcessing={isAiProcessing}
            setIsAiProcessing={setIsAiProcessing}
          />
          <ResourceOptimizer 
            title="Optimizador de Recursos"
            description="Analiza la carga de trabajo y el inventario de la próxima semana para sugerir mejoras."
            tasks={tasks || []} 
            staff={staff || []} 
            supplies={supplies || []}
            isAiProcessing={isAiProcessing}
            setIsAiProcessing={setIsAiProcessing}
            updateTask={updateTask}
          />
      </div>
    </div>
  );
}

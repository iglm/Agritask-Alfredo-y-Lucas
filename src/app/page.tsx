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
import { exportToCsv } from "@/lib/csv";
import { useToast } from "@/hooks/use-toast";
import { SubLot } from "@/lib/types";
import { collection, getDocs, query, where, collectionGroup } from "firebase/firestore";

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

  const handleExportAll = async () => {
    if (!firestore || !user) {
      toast({ variant: "destructive", title: "Error", description: "No se puede conectar a la base de datos." });
      return;
    }
    
    if ([lots, staff, tasks, supplies, productiveUnits, transactions].every(data => !data || data.length === 0)) {
        toast({
            variant: "destructive",
            title: "No hay datos para exportar",
            description: "No se encontró información en ninguna de las secciones para crear un respaldo.",
        });
        return;
    }

    setIsExporting(true);
    let exportedSomething = false;

    try {
      // 1. Productive Units
      if (productiveUnits && productiveUnits.length > 0) {
          exportToCsv(`unidades-productivas_respaldo.csv`, productiveUnits);
          exportedSomething = true;
      }

      // 2. Lots and Sublots
      if (lots && lots.length > 0) {
        const dataToExport = [];
        // Efficiently fetch all sublots for the user in one go
        const allSublotsQuery = query(collectionGroup(firestore, 'sublots'), where('userId', '==', user.uid));
        const sublotsSnapshot = await getDocs(allSublotsQuery);
        const sublotsByLotId = new Map<string, SubLot[]>();
        sublotsSnapshot.forEach(doc => {
            const subLot = doc.data() as SubLot;
            const sublots = sublotsByLotId.get(subLot.lotId) || [];
            sublots.push(subLot);
            sublotsByLotId.set(subLot.lotId, sublots);
        });

        for (const lot of lots) {
            dataToExport.push({
                id: lot.id,
                nombre: lot.name,
                area_hectareas: lot.areaHectares,
                ubicacion: lot.location,
                fecha_siembra: lot.sowingDate,
                densidad_siembra: lot.sowingDensity,
                arboles_totales: lot.totalTrees,
                tipo: 'Lote Principal',
                lote_padre: ''
            });

            const lotSublots = sublotsByLotId.get(lot.id) || [];
            for (const subLot of lotSublots) {
                 dataToExport.push({
                    id: subLot.id,
                    nombre: subLot.name,
                    area_hectareas: subLot.areaHectares,
                    ubicacion: lot.location, // Inherits from parent
                    fecha_siembra: subLot.sowingDate,
                    densidad_siembra: subLot.sowingDensity,
                    arboles_totales: subLot.totalTrees,
                    tipo: 'Sub-Lote',
                    lote_padre: lot.name
                });
            }
        }
        if (dataToExport.length > 0) {
          exportToCsv(`lotes-y-sublotes_respaldo.csv`, dataToExport);
          exportedSomething = true;
        }
      }

      // 3. Staff
      if (staff && staff.length > 0) {
          exportToCsv(`personal_respaldo.csv`, staff);
          exportedSomething = true;
      }

      // 4. Supplies
      if (supplies && supplies.length > 0) {
          exportToCsv(`insumos_respaldo.csv`, supplies);
          exportedSomething = true;
      }

      // 5. Tasks
      if (tasks && tasks.length > 0) {
        const dataToExport = tasks.map(task => ({
          ...task,
          lotName: lots?.find(l => l.id === task.lotId)?.name || 'N/A',
          responsibleName: staff?.find(s => s.id === task.responsibleId)?.name || 'N/A',
        }));
        exportToCsv(`labores_respaldo.csv`, dataToExport);
        exportedSomething = true;
      }

      // 6. Transactions
      if (transactions && transactions.length > 0) {
        const dataToExport = transactions.map(transaction => ({
          ...transaction,
          lotName: transaction.lotId ? (lots?.find(l => l.id === transaction.lotId)?.name || 'N/A') : 'General',
        }));
        exportToCsv(`transacciones_respaldo.csv`, dataToExport);
        exportedSomething = true;
      }

      if (exportedSomething) {
        toast({
            title: "Respaldo completo iniciado",
            description: "Se están descargando los archivos CSV para cada sección de la aplicación.",
        });
      } else {
          toast({
              variant: "destructive",
              title: "No hay datos para exportar",
              description: "No se encontró información en ninguna de las secciones.",
          });
      }
    } catch (error) {
        console.error("Error durante la exportación completa:", error);
        toast({
            variant: "destructive",
            title: "Error al exportar",
            description: "Ocurrió un error al generar el respaldo completo.",
        });
    } finally {
        setIsExporting(false);
    }
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
        <Button variant="outline" onClick={handleExportAll} disabled={isExporting}>
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

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UpcomingTasks tasks={tasks || []} lots={lots || []} />
          <AnomalyDetector lots={lots || []} tasks={tasks || []} transactions={transactions || []} />
      </div>
    </div>
  );
}

"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Lot, Supply, Task } from "@/lib/types"
import { useMemo } from "react"

type InvestmentChartProps = {
  lots: Lot[];
  tasks: Task[];
  supplies: Supply[];
};

export function InvestmentChart({ lots, tasks, supplies }: InvestmentChartProps) {
  const chartData = useMemo(() => {
    const dataByLot: { [key: string]: { 
        name: string, 
        plannedLabor: number, 
        plannedSupplies: number, 
        actualLabor: number, 
        actualSupplies: number 
    } } = {};

    const supplyPriceMap = new Map(supplies.map(s => [s.id, s.costPerUnit]));

    lots.forEach(lot => {
        dataByLot[lot.id] = { 
            name: lot.name, 
            plannedLabor: 0, 
            plannedSupplies: 0, 
            actualLabor: 0, 
            actualSupplies: 0 
        };
    });

    tasks.forEach(task => {
        if (dataByLot[task.lotId]) {
            const lotData = dataByLot[task.lotId];
            
            // Labor costs
            lotData.plannedLabor += task.plannedCost || 0;
            lotData.actualLabor += (task.plannedCost || 0) * (task.progress / 100);
            
            // Actual supplies cost
            lotData.actualSupplies += task.supplyCost || 0;

            // Planned supplies cost
            if (task.plannedSupplies) {
                task.plannedSupplies.forEach(planned => {
                    const price = supplyPriceMap.get(planned.supplyId) || 0;
                    lotData.plannedSupplies += price * planned.quantity;
                });
            }
        }
    });

    return Object.values(dataByLot)
      .filter(d => 
        d.plannedLabor > 0 || d.plannedSupplies > 0 || d.actualLabor > 0 || d.actualSupplies > 0
      );
  }, [lots, tasks, supplies]);
  
  if (chartData.length === 0) {
    return (
         <Card>
            <CardHeader>
                <CardTitle>Inversión por Lote</CardTitle>
                <CardDescription>Mano de Obra vs. Insumos (Planificado vs. Real)</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center items-center h-[300px]">
                <p className="text-muted-foreground">No hay costos registrados para mostrar.</p>
            </CardContent>
        </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inversión por Lote</CardTitle>
        <CardDescription>Mano de Obra vs. Insumos (Planificado vs. Real)</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis tickFormatter={(value) => `$${Number(value) / 1000}k`} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted))' }}
              contentStyle={{
                background: 'hsl(var(--background))',
                borderRadius: 'var(--radius)',
                border: '1px solid hsl(var(--border))'
              }}
              formatter={(value: number) => `$${value.toLocaleString()}`}
            />
            <Legend wrapperStyle={{fontSize: "14px"}}/>
            <Bar dataKey="plannedLabor" stackId="planned" name="Mano de Obra Plan." fill="hsl(var(--secondary))" />
            <Bar dataKey="plannedSupplies" stackId="planned" name="Insumos Plan." fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]}/>
            <Bar dataKey="actualLabor" stackId="actual" name="Mano de Obra Real" fill="hsl(var(--primary))" />
            <Bar dataKey="actualSupplies" stackId="actual" name="Insumos Real" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]}/>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

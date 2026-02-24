"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Lot, Task } from "@/lib/types"
import { useMemo } from "react"

type InvestmentChartProps = {
  lots: Lot[];
  tasks: Task[];
};

export function InvestmentChart({ lots, tasks }: InvestmentChartProps) {
  const chartData = useMemo(() => {
    const dataByLot: { [key: string]: { name: string, planned: number, actual: number } } = {};
    
    lots.forEach(lot => {
      dataByLot[lot.id] = { name: lot.name, planned: 0, actual: 0 };
    });

    tasks.forEach(task => {
      if (dataByLot[task.lotId]) {
        const totalPlanned = (task.plannedCost || 0) + (task.supplyCost || 0);
        dataByLot[task.lotId].planned += totalPlanned;
        dataByLot[task.lotId].actual += task.actualCost;
      }
    });

    return Object.values(dataByLot);
  }, [lots, tasks]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inversión por Lote</CardTitle>
        <CardDescription>Costos Planificados vs. Ejecutados</CardDescription>
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
            />
            <Legend wrapperStyle={{fontSize: "14px"}}/>
            <Bar dataKey="planned" fill="hsl(var(--secondary))" name="Planificado" radius={[4, 4, 0, 0]} />
            <Bar dataKey="actual" fill="hsl(var(--primary))" name="Real" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

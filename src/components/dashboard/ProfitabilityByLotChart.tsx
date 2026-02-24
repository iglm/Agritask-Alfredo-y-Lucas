"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Lot, Task, Transaction } from "@/lib/types"
import { useMemo } from "react"

type ProfitabilityByLotChartProps = {
  lots: Lot[];
  tasks: Task[];
  transactions: Transaction[];
};

export function ProfitabilityByLotChart({ lots, tasks, transactions }: ProfitabilityByLotChartProps) {
  const chartData = useMemo(() => {
    const dataByLot: { [key: string]: { name: string, profit: number } } = {};
    
    lots.forEach(lot => {
      dataByLot[lot.id] = { name: lot.name, profit: 0 };
    });

    transactions.forEach(t => {
      if (t.lotId && dataByLot[t.lotId]) {
        if (t.type === 'Ingreso') {
          dataByLot[t.lotId].profit += t.amount;
        } else {
          dataByLot[t.lotId].profit -= t.amount;
        }
      }
    });

    tasks.forEach(task => {
      if (task.lotId && dataByLot[task.lotId]) {
        dataByLot[task.lotId].profit -= task.actualCost;
      }
    });

    return Object.values(dataByLot).filter(d => d.profit !== 0).sort((a,b) => b.profit - a.profit);
  }, [lots, tasks, transactions]);
  
  if (chartData.length === 0) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Rentabilidad por Lote</CardTitle>
                <CardDescription>Análisis de ganancias o pérdidas para cada lote.</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center items-center h-[300px]">
                <p className="text-muted-foreground">No hay datos suficientes para mostrar el gráfico.</p>
            </CardContent>
        </Card>
    )
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle>Rentabilidad por Lote</CardTitle>
        <CardDescription>Análisis de ganancias o pérdidas para cada lote.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis tickFormatter={(value) => `$${Number(value) / 1000}k`} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted))' }}
              contentStyle={{
                background: 'hsl(var(--background))',
                borderRadius: 'var(--radius)',
                border: '1px solid hsl(var(--border))'
              }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, "Rentabilidad"]}
            />
            {chartData.map((entry, index) => (
              <Bar 
                key={`bar-${index}`} 
                dataKey="profit" 
                name="Rentabilidad" 
                fill={entry.profit >= 0 ? 'hsl(var(--chart-1))' : 'hsl(var(--chart-4))'} 
                radius={[4, 4, 0, 0]}
              >
                  {index === 0 && chartData.map((cellEntry, cellIndex) => (
                      <cell key={`cell-${cellIndex}`} fill={cellEntry.profit >= 0 ? 'hsl(var(--chart-1))' : 'hsl(var(--chart-4))'} />
                  ))}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

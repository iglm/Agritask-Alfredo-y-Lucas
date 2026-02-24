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

const CustomBar = (props: any) => {
    const { x, y, width, height, value } = props;
    const isNegative = value < 0;
    const color = isNegative ? 'hsl(var(--chart-4))' : 'hsl(var(--chart-1))';
    
    // For negative values, the y position needs to be the original y, and height is positive
    // For positive values, y needs to be shifted up by the height
    const rectY = isNegative ? y : y - height;
    const rectHeight = Math.abs(height);

    return <rect x={x} y={y} width={width} height={height} fill={color} />;
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
              formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, "Rentabilidad"]}
            />
            <Bar dataKey="profit" name="Rentabilidad" shape={<CustomBar />} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

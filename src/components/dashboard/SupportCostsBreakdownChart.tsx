"use client"

import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Lot, Task, Transaction } from "@/lib/types"
import { useMemo } from "react"

const COLORS = [
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-5))',
  'hsl(var(--chart-1))',
  'hsl(var(--chart-4))',
];

type SupportCostsBreakdownChartProps = {
  lots: Lot[];
  tasks: Task[];
  transactions: Transaction[];
};

export function SupportCostsBreakdownChart({ lots, tasks, transactions }: SupportCostsBreakdownChartProps) {
  const chartData = useMemo(() => {
    const costBySupportLot: { [key: string]: { name: string, value: number } } = {};
    let generalExpenses = 0;

    const supportLots = lots.filter(lot => lot.type === 'Soporte');
    
    supportLots.forEach(lot => {
        costBySupportLot[lot.id] = { name: lot.name, value: 0 };
    });
    
    tasks.forEach(task => {
        const lot = lots.find(l => l.id === task.lotId);
        if (lot && lot.type === 'Soporte' && costBySupportLot[task.lotId]) {
            costBySupportLot[task.lotId].value += task.actualCost;
        }
    });

    transactions.forEach(t => {
        if (t.type === 'Egreso') {
            if (t.lotId) {
                const lot = lots.find(l => l.id === t.lotId);
                if(lot && lot.type === 'Soporte' && costBySupportLot[t.lotId]){
                    costBySupportLot[t.lotId].value += t.amount;
                }
            } else {
                // This is a general expense
                generalExpenses += t.amount;
            }
        }
    });

    const results = Object.values(costBySupportLot).filter(item => item.value > 0);
    if (generalExpenses > 0) {
        results.push({ name: 'Gastos Generales', value: generalExpenses });
    }

    return results;
  }, [lots, tasks, transactions]);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Desglose de Costos de Soporte</CardTitle>
          <CardDescription>Distribución de costos en unidades no productivas.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-[300px]">
          <p className="text-muted-foreground">No hay costos de soporte registrados.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Desglose de Costos de Soporte</CardTitle>
        <CardDescription>Distribución de costos en unidades no productivas (Vías, Vivero, etc.).</CardDescription>
      </CardHeader>
      <CardContent>
        <>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                  const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                  const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                  return (
                    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                      {`${(percent * 100).toFixed(0)}%`}
                    </text>
                  );
                }}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--background))',
                  borderRadius: 'var(--radius)',
                  border: '1px solid hsl(var(--border))'
                }}
                formatter={(value: number) => `$${value.toLocaleString()}`}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm">
              {chartData.map((entry, index) => (
                <div key={`legend-${index}`} className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span>{entry.name}</span>
                </div>
              ))}
            </div>
        </>
      </CardContent>
    </Card>
  )
}

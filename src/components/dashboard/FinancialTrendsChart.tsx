"use client"

import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Transaction, Task, Lot } from "@/lib/types"
import { useMemo } from "react"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"

type FinancialTrendsChartProps = {
  transactions: Transaction[];
  tasks: Task[];
  lots: Lot[];
};

export function FinancialTrendsChart({ transactions, tasks, lots }: FinancialTrendsChartProps) {
  const chartData = useMemo(() => {
    const lotTypeMap = new Map(lots.map(lot => [lot.id, lot.type]));
    const monthlyData: { [key: string]: { month: string, ingresos: number, costosProductivos: number, costosSoporte: number } } = {};

    // Process transactions
    transactions.forEach(t => {
      const month = format(parseISO(t.date), 'yyyy-MM');
      if (!monthlyData[month]) {
        monthlyData[month] = { month: format(parseISO(t.date), 'MMM yyyy', {locale: es}), ingresos: 0, costosProductivos: 0, costosSoporte: 0 };
      }
      if (t.type === 'Ingreso') {
        monthlyData[month].ingresos += t.amount;
      } else { // Egreso
        if (t.lotId) {
            const lotType = lotTypeMap.get(t.lotId);
            if (lotType === 'Productivo') {
                monthlyData[month].costosProductivos += t.amount;
            } else { // Soporte or undefined lot
                monthlyData[month].costosSoporte += t.amount;
            }
        } else { // General expense
            monthlyData[month].costosSoporte += t.amount;
        }
      }
    });

    // Process task costs
    tasks.forEach(task => {
        const taskCost = task.actualCost;
        if(taskCost > 0) {
            const month = format(parseISO(task.startDate), 'yyyy-MM');
             if (!monthlyData[month]) {
                monthlyData[month] = { month: format(parseISO(task.startDate), 'MMM yyyy', {locale: es}), ingresos: 0, costosProductivos: 0, costosSoporte: 0 };
            }
            const lotType = lotTypeMap.get(task.lotId);
            if (lotType === 'Productivo') {
                monthlyData[month].costosProductivos += taskCost;
            } else { // Soporte or undefined
                monthlyData[month].costosSoporte += taskCost;
            }
        }
    });

    return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
  }, [transactions, tasks, lots]);

  if (chartData.length === 0) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Tendencias Financieras</CardTitle>
                <CardDescription>Ingresos vs. Egresos a lo largo del tiempo</CardDescription>
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
        <CardTitle>Tendencias Financieras</CardTitle>
        <CardDescription>Análisis mensual de ingresos vs. costos productivos y de soporte.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
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
            <Line type="monotone" dataKey="ingresos" name="Ingresos" stroke="hsl(var(--chart-1))" strokeWidth={2} />
            <Line type="monotone" dataKey="costosProductivos" name="Costos Productivos" stroke="hsl(var(--chart-4))" strokeWidth={2} />
            <Line type="monotone" dataKey="costosSoporte" name="Costos de Soporte" stroke="hsl(var(--chart-2))" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

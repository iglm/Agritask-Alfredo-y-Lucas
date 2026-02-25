"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Staff, Task } from "@/lib/types"
import { useMemo } from "react"

type WorkerPerformanceChartProps = {
  staff: Staff[];
  tasks: Task[];
};

export function WorkerPerformanceChart({ staff, tasks }: WorkerPerformanceChartProps) {
  const chartData = useMemo(() => {
    const dataByStaff: { [key: string]: { name: string, completedTasks: number } } = {};
    
    staff.forEach(person => {
      dataByStaff[person.id] = { name: person.name, completedTasks: 0 };
    });

    tasks.forEach(task => {
      if (task.status === 'Finalizado' && dataByStaff[task.responsibleId]) {
        dataByStaff[task.responsibleId].completedTasks += 1;
      }
    });

    return Object.values(dataByStaff).filter(s => s.completedTasks > 0).sort((a,b) => b.completedTasks - a.completedTasks);
  }, [staff, tasks]);

  if (chartData.length === 0) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Desempeño de Colaboradores</CardTitle>
                <CardDescription>Número de labores finalizadas por cada colaborador.</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center items-center h-[300px]">
                <p className="text-muted-foreground">No hay labores finalizadas para mostrar.</p>
            </CardContent>
        </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Desempeño de Colaboradores</CardTitle>
        <CardDescription>Número de labores finalizadas por cada colaborador.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
            <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted))' }}
              contentStyle={{
                background: 'hsl(var(--background))',
                borderRadius: 'var(--radius)',
                border: '1px solid hsl(var(--border))'
              }}
            />
            <Bar dataKey="completedTasks" name="Labores Finalizadas" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

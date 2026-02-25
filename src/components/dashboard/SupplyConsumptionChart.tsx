"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Supply, SupplyUsage } from "@/lib/types"
import { useMemo } from "react"

type SupplyConsumptionChartProps = {
  supplies: Supply[];
  supplyUsages: SupplyUsage[];
};

export function SupplyConsumptionChart({ supplies, supplyUsages }: SupplyConsumptionChartProps) {
  const chartData = useMemo(() => {
    if (supplyUsages.length === 0 || supplies.length === 0) {
        return [];
    }
    
    const usageBySupplyId = new Map<string, number>();

    supplyUsages.forEach(usage => {
      const currentUsage = usageBySupplyId.get(usage.supplyId) || 0;
      usageBySupplyId.set(usage.supplyId, currentUsage + usage.quantityUsed);
    });

    return Array.from(usageBySupplyId.entries()).map(([supplyId, totalUsed]) => {
        const supplyInfo = supplies.find(s => s.id === supplyId);
        return {
            name: supplyInfo?.name || 'Insumo Desconocido',
            unit: supplyInfo?.unitOfMeasure || '',
            totalUsed: totalUsed,
        }
    }).sort((a,b) => b.totalUsed - a.totalUsed);
    
  }, [supplies, supplyUsages]);

  if (chartData.length === 0) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Consumo de Insumos</CardTitle>
                <CardDescription>Total de insumos consumidos en todas las labores.</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center items-center h-[300px]">
                <p className="text-muted-foreground">No hay consumo de insumos registrado.</p>
            </CardContent>
        </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Consumo de Insumos</CardTitle>
        <CardDescription>Total de insumos consumidos en todas las labores.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted))' }}
              contentStyle={{
                background: 'hsl(var(--background))',
                borderRadius: 'var(--radius)',
                border: '1px solid hsl(var(--border))'
              }}
              formatter={(value: number, name: string, props) => [`${value.toLocaleString()} ${props.payload.unit}`, "Total Consumido"]}
            />
            <Bar dataKey="totalUsed" name="Total Consumido" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Lot, Supply, SupplyUsage, Task } from "@/lib/types";

interface Props {
    lots: Lot[];
    tasks: Task[];
    supplies: Supply[];
    supplyUsages: SupplyUsage[];
}

interface ReportRow {
    lotId: string;
    lotName: string;
    supplyId: string;
    supplyName: string;
    unit: string;
    totalUsed: number;
}

export function SupplyUsageByLotReport({ lots, tasks, supplies, supplyUsages }: Props) {

    const reportData = useMemo(() => {
        if (!supplyUsages.length || !tasks.length || !lots.length) return [];

        const usageMap = new Map<string, ReportRow>();
        const taskToLotMap = new Map(tasks.map(t => [t.id, t.lotId]));

        for (const usage of supplyUsages) {
            const lotId = taskToLotMap.get(usage.taskId);
            if (!lotId) continue;

            const key = `${lotId}-${usage.supplyId}`;
            const existing = usageMap.get(key);

            if (existing) {
                existing.totalUsed += usage.quantityUsed;
            } else {
                const lot = lots.find(l => l.id === lotId);
                const supply = supplies.find(s => s.id === usage.supplyId);
                if (lot && supply) {
                    usageMap.set(key, {
                        lotId: lot.id,
                        lotName: lot.name,
                        supplyId: supply.id,
                        supplyName: supply.name,
                        unit: supply.unitOfMeasure,
                        totalUsed: usage.quantityUsed,
                    });
                }
            }
        }
        return Array.from(usageMap.values()).sort((a,b) => a.lotName.localeCompare(b.lotName) || a.supplyName.localeCompare(b.supplyName));
    }, [lots, tasks, supplies, supplyUsages]);

    return (
        <Card className="col-span-1 xl:col-span-2">
            <CardHeader>
                <CardTitle>Consumo de Insumos por Lote</CardTitle>
                <CardDescription>Detalle de la cantidad de cada insumo utilizado en los diferentes lotes.</CardDescription>
            </CardHeader>
            <CardContent>
                {reportData.length > 0 ? (
                    <div className="border rounded-md max-h-96 overflow-y-auto">
                        <Table>
                            <TableHeader className="sticky top-0 bg-muted/50">
                                <TableRow>
                                    <TableHead>Lote</TableHead>
                                    <TableHead>Insumo</TableHead>
                                    <TableHead className="text-right">Cantidad Consumida</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reportData.map((row, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">{row.lotName}</TableCell>
                                        <TableCell>{row.supplyName}</TableCell>
                                        <TableCell className="text-right">{`${row.totalUsed.toLocaleString()} ${row.unit}`}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="flex justify-center items-center h-[300px]">
                        <p className="text-muted-foreground">No hay consumo de insumos registrado.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

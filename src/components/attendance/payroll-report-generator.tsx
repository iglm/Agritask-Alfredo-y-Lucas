"use client";

import { useState, useEffect, useMemo } from 'react';
import { DateRange } from 'react-day-picker';
import { addDays, format, isWithinInterval, startOfDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Staff, Task } from '@/lib/types';
import { Loader2, CalendarIcon, FileText, Download, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmptyState } from '../ui/empty-state';
import { useToast } from '@/hooks/use-toast';
import { exportToCsv } from '@/lib/csv';

interface Props {
  staff: Staff[];
  tasks: Task[];
}

interface PayrollRow {
  staffId: string;
  staffName: string;
  employmentType: Staff['employmentType'];
  journals: number;
  totalPay: number;
}

export function PayrollReportGenerator({ staff, tasks }: Props) {
  const { toast } = useToast();
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [reportData, setReportData] = useState<PayrollRow[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // Set initial date range on the client to avoid hydration errors
    setDateRange({
      from: startOfDay(addDays(new Date(), -7)),
      to: startOfDay(new Date()),
    });
  }, []);

  const handleGenerateReport = () => {
    if (!dateRange?.from || !dateRange?.to) {
      toast({ variant: "destructive", title: "Rango de fechas inválido" });
      return;
    }

    setIsGenerating(true);

    const completedTasksInRange = tasks.filter(task => {
        if (task.status !== 'Finalizado' || !task.endDate) return false;
        const endDate = parseISO(task.endDate);
        return isWithinInterval(endDate, { start: dateRange.from!, end: dateRange.to! });
    });

    const payrollMap = new Map<string, { journals: number; pay: number }>();

    for (const task of completedTasksInRange) {
        const staffMember = staff.find(s => s.id === task.responsibleId);
        if (!staffMember) continue;

        let currentData = payrollMap.get(staffMember.id) || { journals: 0, pay: 0 };
        
        if (staffMember.employmentType === 'Contratista') {
            // For contractors, sum the plannedCost of the task.
            currentData.pay += task.plannedCost;
            // Journals might not be as relevant, but we can still count them.
            currentData.journals += task.plannedJournals;
        } else {
            // For regular employees, calculate based on journals and daily rate.
            currentData.journals += task.plannedJournals;
            currentData.pay += task.plannedJournals * staffMember.baseDailyRate;
        }
        payrollMap.set(staffMember.id, currentData);
    }

    const finalReportData: PayrollRow[] = Array.from(payrollMap.entries()).map(([staffId, data]) => {
        const staffMember = staff.find(s => s.id === staffId)!;
        return {
            staffId: staffId,
            staffName: staffMember.name,
            employmentType: staffMember.employmentType,
            journals: data.journals,
            totalPay: data.pay
        }
    }).sort((a, b) => b.totalPay - a.totalPay);
    
    setReportData(finalReportData);
    setIsGenerating(false);
  };
  
  const handleExportReport = () => {
    if (!reportData || reportData.length === 0) {
      toast({
        variant: "destructive",
        title: "No hay datos para exportar",
        description: "Genera un reporte primero.",
      });
      return;
    }

    try {
        const dataToExport = reportData.map(record => ({
          colaborador: record.staffName,
          tipo_empleo: record.employmentType,
          jornales_trabajados: record.journals,
          pago_total: record.totalPay,
        }));
        
        exportToCsv(`reporte-prenomina-${format(dateRange!.from!, 'yyyy-MM-dd')}-a-${format(dateRange!.to!, 'yyyy-MM-dd')}.csv`, dataToExport);
    } catch(e) {
        console.error("Export error", e);
        toast({ variant: 'destructive', title: 'Error al exportar', description: 'No se pudo generar el archivo CSV.'});
    }
  }

  const totalPayroll = useMemo(() => reportData?.reduce((sum, row) => sum + row.totalPay, 0) || 0, [reportData]);

  if (staff.length === 0) {
    return (
      <Card>
        <CardHeader>
            <CardTitle>Generador de Reporte de Pre-Nómina</CardTitle>
            <CardDescription>Calcula los pagos para tus colaboradores basados en las labores finalizadas.</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<Users className="h-10 w-10" />}
            title="Añade colaboradores primero"
            description="Necesitas registrar colaboradores para poder generar reportes de pago."
            className='py-10'
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generador de Reporte de Pre-Nómina</CardTitle>
        <CardDescription>Calcula los pagos para tus colaboradores basados en las labores finalizadas en un rango de fechas.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="space-y-2 flex-1 w-full">
            <label className="text-sm font-medium">Rango de Fechas</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !dateRange && 'text-muted-foreground')}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>{format(dateRange.from, 'PPP', { locale: es })} - {format(dateRange.to, 'PPP', { locale: es })}</>
                    ) : (format(dateRange.from, 'PPP', { locale: es }))
                  ) : (<span>Elige un rango</span>)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  locale={es}
                  captionLayout="dropdown-buttons"
                  fromYear={new Date().getFullYear() - 5}
                  toYear={new Date().getFullYear()}
                />
              </PopoverContent>
            </Popover>
          </div>
          <Button onClick={handleGenerateReport} disabled={isGenerating}>
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
            Generar Reporte
          </Button>
        </div>

        {reportData && (
          <Card>
            <CardHeader>
               <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Resultados de Pre-Nómina</CardTitle>
                    <CardDescription>
                      Mostrando pagos para el periodo del {format(dateRange!.from!, 'PPP', { locale: es })} al {format(dateRange!.to!, 'PPP', { locale: es })}.
                    </CardDescription>
                  </div>
                  {reportData.length > 0 && (
                    <Button variant="outline" size="sm" onClick={handleExportReport}>
                      <Download className="mr-2 h-4 w-4" />
                      Exportar
                    </Button>
                  )}
                </div>
              <p className="pt-4 text-lg font-bold">Total a Pagar: <span className="text-primary">${totalPayroll.toLocaleString()}</span></p>
            </CardHeader>
            <CardContent>
              {reportData.length > 0 ? (
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Colaborador</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead className="text-right">Jornales</TableHead>
                            <TableHead className="text-right">Total a Pagar</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reportData.map(record => (
                            <TableRow key={record.staffId}>
                                <TableCell className="font-medium">{record.staffName}</TableCell>
                                <TableCell><span className="text-muted-foreground">{record.employmentType}</span></TableCell>
                                <TableCell className="text-right">{record.journals}</TableCell>
                                <TableCell className="text-right font-semibold">${record.totalPay.toLocaleString()}</TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
              ) : (
                 <EmptyState
                    icon={<FileText className="h-10 w-10" />}
                    title="Sin labores finalizadas"
                    description="No se encontraron labores finalizadas en este rango de fechas para generar el reporte de pago."
                    className="py-10"
                />
              )}
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { DateRange } from 'react-day-picker';
import { addDays, format, differenceInDays, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { Staff, StaffAttendance } from '@/lib/types';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Loader2, CalendarIcon, FileText, Download, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmptyState } from '../ui/empty-state';
import { useToast } from '@/hooks/use-toast';
import { exportToCsv } from '@/lib/csv';

interface Props {
  staff: Staff[];
}

export function AttendanceReportGenerator({ staff }: Props) {
  const { user, firestore } = useFirebase();
  const { toast } = useToast();
  
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfDay(addDays(new Date(), -30)),
    to: startOfDay(new Date()),
  });
  
  const [shouldFetch, setShouldFetch] = useState(false);
  const [reportData, setReportData] = useState<StaffAttendance[] | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const reportQuery = useMemoFirebase(() => {
    if (!shouldFetch || !firestore || !user || !selectedStaffId || !dateRange?.from || !dateRange?.to) {
      return null;
    }
    
    return query(
      collection(firestore, 'staffAttendance'),
      where('userId', '==', user.uid),
      where('staffId', '==', selectedStaffId),
      where('date', '>=', format(dateRange.from, 'yyyy-MM-dd')),
      where('date', '<=', format(dateRange.to, 'yyyy-MM-dd')),
      orderBy('date', 'asc')
    );
  }, [shouldFetch, firestore, user, selectedStaffId, dateRange]);

  const { data: attendanceData, isLoading, error } = useCollection<StaffAttendance>(reportQuery);

  useEffect(() => {
    if (shouldFetch && !isLoading) {
        setReportData(attendanceData);
        setShouldFetch(false); // Reset for next click
    }
  }, [shouldFetch, isLoading, attendanceData]);
  
  const handleGenerateReport = () => {
    if (!selectedStaffId || !dateRange?.from) {
        toast({
            variant: "destructive",
            title: "Faltan datos",
            description: "Por favor, selecciona un colaborador y un rango de fechas.",
        });
        return;
    }
    setReportData(null); // Clear old data before fetching new
    setShouldFetch(true);
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

    setIsExporting(true);
    try {
        const dataToExport = reportData.map(record => ({
          fecha: record.date, // Export as YYYY-MM-DD string directly
          nombre_empleado: selectedStaffName,
          estado: record.status,
          motivo_ausencia: record.reason || 'N/A',
        }));
        
        exportToCsv(`reporte-asistencia-${selectedStaffName}-${format(dateRange!.from!, 'yyyy-MM-dd')}-a-${format(dateRange!.to!, 'yyyy-MM-dd')}.csv`, dataToExport);
    } catch(e) {
        console.error("Export error", e);
        toast({ variant: 'destructive', title: 'Error al exportar', description: 'No se pudo generar el archivo CSV.'});
    } finally {
        setIsExporting(false);
    }
  }

  const totalDays = dateRange?.from && dateRange?.to ? differenceInDays(dateRange.to, dateRange.from) + 1 : 0;
  const presentDays = reportData?.filter(r => r.status === 'Presente').length || 0;
  const absentDays = reportData?.filter(r => r.status === 'Ausente').length || 0;
  const selectedStaffName = staff.find(s => s.id === selectedStaffId)?.name;

  if (staff.length === 0) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Generador de Reportes</CardTitle>
                <CardDescription>
                Selecciona un colaborador y un rango de fechas para ver su historial de asistencia.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <EmptyState
                    icon={<Users className="h-10 w-10" />}
                    title="Añade colaboradores primero"
                    description="Necesitas registrar colaboradores para poder generar reportes de asistencia."
                    className='py-10'
                />
            </CardContent>
        </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generador de Reportes</CardTitle>
        <CardDescription>
          Selecciona un colaborador y un rango de fechas para ver su historial de asistencia.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div className="space-y-2">
            <label className="text-sm font-medium">Colaborador</label>
            <Select onValueChange={setSelectedStaffId} disabled={staff.length === 0}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un colaborador" />
              </SelectTrigger>
              <SelectContent>
                {staff.map(person => (
                  <SelectItem key={person.id} value={person.id}>
                    {person.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Rango de Fechas</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn('w-full justify-start text-left font-normal', !dateRange && 'text-muted-foreground')}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, 'PPP', { locale: es })} -{' '}
                        {format(dateRange.to, 'PPP', { locale: es })}
                      </>
                    ) : (
                      format(dateRange.from, 'PPP', { locale: es })
                    )
                  ) : (
                    <span>Elige un rango</span>
                  )}
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
        </div>

        <Button onClick={handleGenerateReport} disabled={!selectedStaffId || isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Generar Reporte
        </Button>

        {error && <p className="text-destructive text-sm mt-4">Error al cargar el reporte: {error.message}. Es posible que se requiera un índice de Firestore.</p>}

        {reportData && (
          <Card>
            <CardHeader>
               <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Reporte para {selectedStaffName}</CardTitle>
                    <CardDescription>
                      Mostrando resultados para el periodo del {format(dateRange!.from!, 'PPP', { locale: es })} al {format(dateRange!.to!, 'PPP', { locale: es })}.
                    </CardDescription>
                  </div>
                  {reportData.length > 0 && (
                    <Button variant="outline" size="sm" onClick={handleExportReport} disabled={isExporting}>
                      {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                      Exportar
                    </Button>
                  )}
                </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 pt-4 text-sm font-medium">
                  <p>Días en rango: <span className="font-semibold">{totalDays}</span></p>
                  <p className="text-green-700 dark:text-green-400">Presente: <span className="font-semibold">{presentDays}</span></p>
                  <p className="text-red-700 dark:text-red-500">Ausente: <span className="font-semibold">{absentDays}</span></p>
              </div>
            </CardHeader>
            <CardContent>
              {reportData.length > 0 ? (
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Motivo de Ausencia</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reportData.map(record => (
                            <TableRow key={record.id}>
                                <TableCell>{format(new Date(record.date.replace(/-/g, '/')), 'PPP', { locale: es })}</TableCell>
                                <TableCell>
                                    <span className={cn(record.status === 'Presente' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-500')}>{record.status}</span>
                                </TableCell>
                                <TableCell>{record.reason || 'N/A'}</TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
              ) : (
                 <EmptyState
                    icon={<FileText className="h-10 w-10" />}
                    title="Sin registros"
                    description="No se encontraron registros de asistencia para este colaborador en el rango de fechas seleccionado."
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

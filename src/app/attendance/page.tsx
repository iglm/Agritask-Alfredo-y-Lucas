"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { useFirebase, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from "@/firebase";
import { collection, query, where, writeBatch, doc } from 'firebase/firestore';
import { Staff, ProductiveUnit, Task, StaffAttendance } from '@/lib/types';
import { Loader2, Printer } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { AttendanceList } from "@/components/attendance/attendance-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AttendanceReportGenerator } from "@/components/attendance/attendance-report-generator";
import { PrintableAttendanceSheet } from "@/components/attendance/printable-attendance-sheet";
import { PayrollReportGenerator } from "@/components/attendance/payroll-report-generator";
import { useToast } from "@/hooks/use-toast";

export default function AttendancePage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const staffQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'staff'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const unitsQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'productiveUnits'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const tasksQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'tasks'), where('userId', '==', user.uid)) : null, [firestore, user]);

  const { data: staff, isLoading: staffLoading } = useCollection<Staff>(staffQuery);
  const { data: productiveUnits, isLoading: unitsLoading } = useCollection<ProductiveUnit>(unitsQuery);
  const { data: tasks, isLoading: tasksLoading } = useCollection<Task>(tasksQuery);
  const isAppLoading = staffLoading || unitsLoading || tasksLoading;

  const [date, setDate] = useState<Date>();

  useEffect(() => {
    setDate(new Date());
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleWriteError = (error: any, path: string, operation: 'create' | 'update' | 'delete', requestResourceData?: any) => {
    console.error(`AttendancePage Error (${operation} on ${path}):`, error);
    errorEmitter.emit('permission-error', new FirestorePermissionError({ path, operation, requestResourceData }));
    throw error;
  };
  
  const saveAttendance = async (records: StaffAttendance[]) => {
    if (!firestore || !user) {
        toast({ variant: 'destructive', title: 'Funcionalidad no disponible sin conexión', description: 'Inicia sesión para registrar la asistencia.' });
        return;
    }
    
    try {
        const batch = writeBatch(firestore);
        const attendanceCol = collection(firestore, 'staffAttendance');

        for (const record of records) {
             const { id, ...data } = record;
             data.userId = user.uid;

            if (record.id.startsWith('temp-')) { // A temporary ID for new records
                const docRef = doc(attendanceCol);
                batch.set(docRef, { ...data, id: docRef.id });
            } else {
                const docRef = doc(firestore, 'staffAttendance', record.id);
                batch.update(docRef, data);
            }
        }

        await batch.commit();
        toast({ title: '¡Asistencia guardada!', description: `Se guardó la asistencia para el ${format(date!, "PPP", { locale: es })}.` });
    } catch (error: any) {
        handleWriteError(error, 'staffAttendance', 'write', records);
        toast({ variant: 'destructive', title: 'Error al guardar', description: 'No se pudo guardar la asistencia.' });
    }
  };


  const defaultUnit = productiveUnits && productiveUnits.length > 0 ? productiveUnits[0] : null;


  if (isAppLoading || !date) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="print:hidden">
        <PageHeader title="Control de Asistencia">
            <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Descargar Planilla
            </Button>
        </PageHeader>
        
        <Tabs defaultValue="daily-log" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="daily-log">Registro Diario</TabsTrigger>
            <TabsTrigger value="reports">Reportes</TabsTrigger>
            <TabsTrigger value="payroll">Pre-Nómina</TabsTrigger>
          </TabsList>
          <TabsContent value="daily-log" className="mt-6">
              <div className="flex justify-end mb-4">
                  <Popover>
                  <PopoverTrigger asChild>
                      <Button
                      variant={"outline"}
                      className={cn(
                          "w-full max-w-xs justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                      )}
                      >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP", { locale: es }) : <span>Elige una fecha</span>}
                      </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        modal={true}
                        mode="single"
                        selected={date}
                        onSelect={(newDate) => setDate(newDate || new Date())}
                        initialFocus
                        locale={es}
                        captionLayout="dropdown-buttons"
                        fromYear={new Date().getFullYear() - 5}
                        toYear={new Date().getFullYear()}
                      />
                  </PopoverContent>
                  </Popover>
              </div>
              <AttendanceList 
                  staff={staff || []}
                  selectedDate={date}
                  onSave={saveAttendance}
              />
          </TabsContent>
          <TabsContent value="reports" className="mt-6">
              <AttendanceReportGenerator staff={staff || []} />
          </TabsContent>
          <TabsContent value="payroll" className="mt-6">
            <PayrollReportGenerator staff={staff || []} tasks={tasks || []} />
          </TabsContent>
        </Tabs>
      </div>
      <div className="hidden print:block">
        <PrintableAttendanceSheet 
            staff={staff || []}
            date={date}
            productiveUnit={defaultUnit}
        />
      </div>
    </>
  );
}

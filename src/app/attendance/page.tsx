"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { useAppData } from "@/firebase";
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

export default function AttendancePage() {
  const { staff, productiveUnits, isLoading: isAppLoading } = useAppData();
  const [date, setDate] = useState<Date>(new Date());

  const handlePrint = () => {
    window.print();
  };

  const defaultUnit = productiveUnits && productiveUnits.length > 0 ? productiveUnits[0] : null;


  if (isAppLoading) {
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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="daily-log">Registro Diario</TabsTrigger>
            <TabsTrigger value="reports">Reportes</TabsTrigger>
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
              />
          </TabsContent>
          <TabsContent value="reports" className="mt-6">
              <AttendanceReportGenerator staff={staff || []} />
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

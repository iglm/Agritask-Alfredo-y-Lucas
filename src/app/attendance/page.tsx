"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { useAppData } from "@/firebase";
import { Loader2 } from "lucide-react";
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

export default function AttendancePage() {
  const { staff, isLoading: isAppLoading } = useAppData();
  const [date, setDate] = useState<Date>(new Date());

  if (isAppLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Control de Asistencia" />
      
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
                <PopoverContent className="w-auto p-0">
                    <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => setDate(newDate || new Date())}
                    initialFocus
                    locale={es}
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
  );
}

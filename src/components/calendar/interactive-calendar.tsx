"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import type { Task } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { isSameDay, parseISO, format } from "date-fns";
import { es } from "date-fns/locale";
import type { DayContentProps } from "react-day-picker";

type InteractiveCalendarProps = {
  tasks: Task[];
  onDateSelect: (date: Date | undefined) => void;
};

export function InteractiveCalendar({ tasks, onDateSelect }: InteractiveCalendarProps) {
  const [month, setMonth] = useState(new Date());

  const DayWithTasks = (props: DayContentProps) => {
    const tasksForDay = tasks.filter(task => isSameDay(parseISO(task.date), props.date));
    return (
      <>
        {props.date.getDate()}
        {tasksForDay.length > 0 && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
            {tasksForDay.slice(0, 3).map((task, index) => (
              <div key={index} className="h-1.5 w-1.5 rounded-full bg-primary" />
            ))}
          </div>
        )}
      </>
    );
  };
  
  const tasksForMonth = tasks.filter(task => 
    parseISO(task.date).getMonth() === month.getMonth() && 
    parseISO(task.date).getFullYear() === month.getFullYear()
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <Card>
          <CardContent className="p-2">
            <Calendar
              locale={es}
              mode="single"
              onSelect={onDateSelect}
              onMonthChange={setMonth}
              className="w-full"
              classNames={{
                day: "h-14 w-full text-base",
                day_selected: "rounded-md",
                head_cell: "w-full",
              }}
              components={{
                DayContent: DayWithTasks,
              }}
            />
          </CardContent>
        </Card>
      </div>
      <div className="md:col-span-1">
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-4">Labores para {format(month, 'MMMM yyyy', { locale: es })}</h3>
            <div className="space-y-3 max-h-[450px] overflow-y-auto">
              {tasksForMonth.length > 0 ? tasksForMonth
                .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map(task => (
                <div key={task.id} className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-semibold text-sm">{task.type}</p>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-muted-foreground">{format(parseISO(task.date), 'd MMM', { locale: es })}</p>
                    <Badge variant="outline">{task.category}</Badge>
                  </div>
                </div>
              )) : <p className="text-sm text-muted-foreground">No hay labores programadas para este mes.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

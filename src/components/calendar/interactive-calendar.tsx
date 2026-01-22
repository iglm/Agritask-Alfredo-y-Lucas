"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import type { Task } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { isSameDay, parseISO } from "date-fns";

type InteractiveCalendarProps = {
  tasks: Task[];
  onDateSelect: (date: Date | undefined) => void;
};

export function InteractiveCalendar({ tasks, onDateSelect }: InteractiveCalendarProps) {
  const [month, setMonth] = useState(new Date());

  const tasksByDay = tasks.reduce((acc, task) => {
    const day = task.date;
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  const DayWithTasks = ({ date, ...props }: { date: Date, displayMonth?: Date }) => {
    const tasksForDay = tasks.filter(task => isSameDay(parseISO(task.date), date));
    return (
      <div className="relative h-full">
        {props.children}
        {tasksForDay.length > 0 && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
            {tasksForDay.slice(0, 3).map((task, index) => (
              <div key={index} className="h-1.5 w-1.5 rounded-full bg-primary" />
            ))}
          </div>
        )}
      </div>
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
                Day: DayWithTasks,
              }}
            />
          </CardContent>
        </Card>
      </div>
      <div className="md:col-span-1">
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-4">Tasks for {format(month, 'MMMM yyyy')}</h3>
            <div className="space-y-3 max-h-[450px] overflow-y-auto">
              {tasksForMonth.length > 0 ? tasksForMonth
                .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map(task => (
                <div key={task.id} className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-semibold text-sm">{task.type}</p>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-muted-foreground">{format(parseISO(task.date), 'MMM d')}</p>
                    <Badge variant="outline">{task.category}</Badge>
                  </div>
                </div>
              )) : <p className="text-sm text-muted-foreground">No tasks scheduled for this month.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

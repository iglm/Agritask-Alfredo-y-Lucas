"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";
import { isSameDay, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type { DayContentProps } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";

type InteractiveCalendarProps = {
  tasks: Task[];
  onDateSelect: (date: Date | undefined) => void;
};

// Custom Day component to render tasks in a style similar to Google Calendar
const DayWithTasks = (props: DayContentProps & { tasks: Task[] }) => {
  const { date, activeModifiers } = props;
  const tasksForDay = props.tasks.filter(task => isSameDay(parseISO(task.date), date));
  const isOutside = !!activeModifiers.outside;

  return (
    <div className="flex flex-col h-full p-1 overflow-hidden">
      <span className={cn(
          "self-end text-sm w-7 h-7 flex items-center justify-center rounded-full mb-1", 
          activeModifiers.today && "bg-primary text-primary-foreground"
        )}>
        {date.getDate()}
      </span>
      <div className="flex-grow space-y-1">
        {tasksForDay.slice(0, 2).map(task => (
           <div 
            key={task.id} 
            className={cn(
              "text-xs rounded-md px-2 py-0.5 mx-0.5 truncate",
              isOutside 
                ? "bg-secondary text-secondary-foreground/50" 
                : "bg-primary text-primary-foreground"
            )}
            title={task.type}
          >
            {task.type}
          </div>
        ))}
        {tasksForDay.length > 2 && (
          <div className="text-xs text-muted-foreground mt-1 mx-1">+ {tasksForDay.length - 2} más</div>
        )}
      </div>
    </div>
  );
};


export function InteractiveCalendar({ tasks, onDateSelect }: InteractiveCalendarProps) {
  return (
    <Card className="h-full">
      <CardContent className="p-0 h-full">
        <Calendar
          locale={es}
          mode="single"
          onSelect={onDateSelect}
          className="w-full h-full [&_div.rdp-month]:h-full [&_div.rdp-table]:h-[calc(100%_-_57px)] [&_div.rdp-body]:h-full"
          classNames={{
            months: 'p-0 h-full flex flex-col',
            month: 'w-full space-y-0 h-full flex flex-col',
            table: 'w-full border-collapse h-full',
            body: 'h-full',
            head_row: 'flex w-full border-b',
            head_cell: 'flex-1 text-muted-foreground font-normal text-xs uppercase p-2 text-center',
            row: 'flex w-full flex-1',
            cell: 'flex-1 relative text-sm text-left align-top p-0 border-b border-r last:border-r-0',
            day: 'size-full p-0 hover:bg-accent/50 focus:bg-accent/50 transition-colors',
            day_selected: '!bg-accent !text-accent-foreground',
            day_today: '', // Remove default today styling to handle it in DayWithTasks
            day_outside: 'text-muted-foreground/50',
            caption: 'flex items-center justify-between px-4 py-2 border-b',
            caption_label: 'text-lg font-medium',
            nav: 'flex items-center gap-1',
            nav_button: 'h-8 w-8 p-0',
          }}
          components={{
            DayContent: (dayProps) => <DayWithTasks {...dayProps} tasks={tasks} />,
            IconLeft: () => <ChevronLeft className="h-5 w-5" />,
            IconRight: () => <ChevronRight className="h-5 w-5" />,
          }}
        />
      </CardContent>
    </Card>
  );
}

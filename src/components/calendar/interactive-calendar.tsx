"use client";

import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";
import { 
  eachDayOfInterval, 
  endOfMonth, 
  endOfWeek, 
  format, 
  isSameMonth, 
  isToday, 
  startOfMonth, 
  startOfWeek 
} from 'date-fns';
import { es } from "date-fns/locale";
import { Lock } from "lucide-react";

type InteractiveCalendarProps = {
  tasks: Task[];
  onDateSelect: (date: Date | undefined) => void;
  onTaskSelect: (task: Task) => void;
  onTaskDrop: (taskId: string, newDate: Date) => void;
  currentMonth: Date;
};

const getCategoryColor = (category: Task['category']) => {
  switch (category) {
    case 'Preparación':
      return 'bg-[hsl(var(--chart-1))]';
    case 'Siembra':
      return 'bg-[hsl(var(--chart-2))]';
    case 'Mantenimiento':
      return 'bg-[hsl(var(--chart-3))] text-secondary-foreground';
    case 'Cosecha':
      return 'bg-[hsl(var(--chart-4))]';
    case 'Post-Cosecha':
      return 'bg-[hsl(var(--chart-5))]';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function InteractiveCalendar({ tasks, onDateSelect, onTaskSelect, onTaskDrop, currentMonth }: InteractiveCalendarProps) {
  const firstDayOfMonth = startOfMonth(currentMonth);
  const lastDayOfMonth = endOfMonth(currentMonth);

  const daysInMonth = eachDayOfInterval({
    start: startOfWeek(firstDayOfMonth, { locale: es }),
    end: endOfWeek(lastDayOfMonth, { locale: es }),
  });

  const getTasksForDay = (day: Date) => {
    return tasks
      .filter(task => {
        const taskDate = new Date(task.startDate);
        const taskDateLocal = new Date(taskDate.valueOf() + taskDate.getTimezoneOffset() * 60 * 1000);
        return format(taskDateLocal, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
      })
      .sort((a, b) => a.type.localeCompare(b.type));
  };
  
  const handleDrop = (e: React.DragEvent, day: Date) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
        onTaskDrop(taskId, day);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const MAX_VISIBLE_TASKS = 2;

  return (
    <div className="h-full flex flex-col rounded-lg border bg-card text-card-foreground shadow-sm">
      {/* Header */}
      <div className="grid grid-cols-7 border-b">
        {daysOfWeek.map((day) => (
          <div key={day} className="py-2 text-center text-sm font-medium text-muted-foreground border-r last:border-r-0">
            {day}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 grid-rows-6 flex-1">
        {daysInMonth.map((day, index) => {
          const tasksForDay = getTasksForDay(day);
          const hiddenTasksCount = tasksForDay.length - MAX_VISIBLE_TASKS;

          return (
            <div
              key={index}
              onClick={() => onDateSelect(day)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, day)}
              className={cn(
                'relative p-1.5 border-r border-t cursor-pointer transition-colors hover:bg-muted/50 overflow-y-auto group',
                !isSameMonth(day, currentMonth) && 'bg-muted/30',
                (index + 1) % 7 === 0 && 'border-r-0'
              )}
            >
              <time
                dateTime={format(day, 'yyyy-MM-dd')}
                className={cn(
                  'flex items-center justify-center text-sm h-7 w-7 rounded-full ml-auto',
                  !isSameMonth(day, currentMonth) && 'text-muted-foreground',
                  isToday(day) && 'bg-primary text-primary-foreground',
                )}
              >
                {format(day, 'd')}
              </time>
              <div className="mt-1 space-y-1">
                {tasksForDay.slice(0, MAX_VISIBLE_TASKS).map(task => {
                   const dependency = tasks.find(t => t.id === task.dependsOn);
                   const isBlocked = dependency && dependency.status !== 'Finalizado';
                   return (
                    <div 
                      key={task.id}
                      draggable={!isBlocked}
                      onDragStart={(e) => e.dataTransfer.setData('taskId', task.id)}
                      onClick={(e) => {
                          e.stopPropagation();
                          onTaskSelect(task);
                      }}
                      className={cn(
                        "flex items-center gap-1 text-white text-xs font-semibold rounded px-1.5 py-0.5 truncate transition-transform hover:scale-105",
                        getCategoryColor(task.category),
                        isBlocked ? 'cursor-not-allowed opacity-75' : 'cursor-move'
                      )}
                    >
                      {isBlocked && <Lock className="h-3 w-3 shrink-0" />}
                      <span className="truncate">{task.type}</span>
                    </div>
                   )
                })}
                {hiddenTasksCount > 0 && (
                  <div className="text-xs text-muted-foreground font-semibold mt-0.5">
                    +{hiddenTasksCount} más
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

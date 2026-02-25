'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Task, Lot } from '@/lib/types';
import { CalendarClock, CheckSquare } from 'lucide-react';
import { format, isWithinInterval, addDays, startOfToday, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { EmptyState } from '../ui/empty-state';
import Link from 'next/link';
import { Button } from '../ui/button';

interface UpcomingTasksProps {
  tasks: Task[];
  lots: Lot[];
}

// A new type to hold the processed, display-ready task information.
type ProcessedUpcomingTask = {
  id: string;
  type: string;
  lotName: string;
  dayOfWeekLabel: string;
  shortDateLabel: string;
};

export function UpcomingTasks({ tasks, lots }: UpcomingTasksProps) {
  const [upcomingTasks, setUpcomingTasks] = useState<ProcessedUpcomingTask[]>([]);

  useEffect(() => {
    // This entire block of logic now runs only on the client, after hydration.
    try {
      const today = startOfToday();
      const nextSevenDays = {
        start: today,
        end: addDays(today, 7),
      };

      const lotNameMap = new Map(lots.map(lot => [lot.id, lot.name]));

      const processedTasks = (tasks || [])
        .map(task => {
          // --- Robust Date Parsing ---
          if (!task.startDate) {
            return null; // Ignore tasks without a start date.
          }
          const taskDate = parseISO(task.startDate); // Safely parse 'YYYY-MM-DD' string.
          if (!isValid(taskDate)) {
            console.warn(`Invalid date format encountered for task ${task.id}:`, task.startDate);
            return null; // Ignore tasks with invalid dates without crashing.
          }
          return { task, taskDate };
        })
        .filter(Boolean) // Remove null entries from parsing failures.
        .filter(({ task, taskDate }) => {
          return isWithinInterval(taskDate, nextSevenDays) && task.status !== 'Finalizado';
        })
        .sort((a, b) => a.taskDate.getTime() - b.taskDate.getTime())
        .slice(0, 5)
        .map(({ task, taskDate }) => {
          // --- Pre-calculating display labels ---
          // All string formatting happens here, not in the render method.
          return {
            id: task.id,
            type: task.type,
            lotName: lotNameMap.get(task.lotId) || 'N/A',
            dayOfWeekLabel: format(taskDate, "EEEE", { locale: es }),
            shortDateLabel: format(taskDate, "dd 'de' MMM", { locale: es }),
          };
        });
        
      setUpcomingTasks(processedTasks);
    } catch (error) {
      // Catch-all to prevent the component from crashing the entire app.
      console.error("An unexpected error occurred in UpcomingTasks:", error);
      // Optionally set an error state to render a message in the component itself.
    }
  }, [tasks, lots]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="h-6 w-6 text-primary" />
          <span>Próximas Labores (7 Días)</span>
        </CardTitle>
        <CardDescription>
          Un vistazo a las tareas no finalizadas para la próxima semana.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {upcomingTasks.length > 0 ? (
          <ul className="space-y-3">
            {upcomingTasks.map(task => (
              <li key={task.id} className="flex items-start justify-between gap-4 p-3 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <p className="font-semibold">{task.type}</p>
                  <p className="text-sm text-muted-foreground">Lote: {task.lotName}</p>
                </div>
                <div className="text-right">
                  {/* Render pre-formatted strings directly. No logic here. */}
                  <p className="text-sm font-medium capitalize">
                    {task.dayOfWeekLabel}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {task.shortDateLabel}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={<CheckSquare className="h-10 w-10" />}
            title="Semana tranquila"
            description="No hay labores pendientes programadas para los próximos 7 días."
            action={
              <Button asChild variant="outline">
                <Link href="/calendar">Ir al Calendario</Link>
              </Button>
            }
            className="py-10"
          />
        )}
      </CardContent>
    </Card>
  );
}

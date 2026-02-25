'use client';

import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Task, Lot } from '@/lib/types';
import { CalendarClock, CheckSquare } from 'lucide-react';
import { format, isWithinInterval, addDays, startOfToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { EmptyState } from '../ui/empty-state';
import Link from 'next/link';
import { Button } from '../ui/button';

interface UpcomingTasksProps {
  tasks: Task[];
  lots: Lot[];
}

export function UpcomingTasks({ tasks, lots }: UpcomingTasksProps) {
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);

  useEffect(() => {
    // This calculation is now safely running only on the client-side,
    // after the initial server render, preventing any hydration mismatch.
    const today = startOfToday();
    const nextSevenDays = {
      start: today,
      end: addDays(today, 7),
    };
    
    const filteredTasks = (tasks || [])
      .filter(task => {
        // Parse date as local to avoid timezone issues
        const taskDate = new Date(task.startDate.replace(/-/g, '\/'));
        return isWithinInterval(taskDate, nextSevenDays) && task.status !== 'Finalizado';
      })
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, 5); // Limit to 5 tasks to not clutter the dashboard
      
    setUpcomingTasks(filteredTasks);
  }, [tasks]);


  const getLotName = (lotId: string) => lots.find(l => l.id === lotId)?.name || 'N/A';

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
                  <p className="text-sm text-muted-foreground">Lote: {getLotName(task.lotId)}</p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-medium capitalize">
                        {format(new Date(task.startDate.replace(/-/g, '\/')), "EEEE", { locale: es })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {format(new Date(task.startDate.replace(/-/g, '\/')), "dd 'de' MMM", { locale: es })}
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

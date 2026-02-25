'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck, SlidersHorizontal, AlertTriangle } from 'lucide-react';
import { optimizeResources, ResourceOptimizerOutput } from '@/ai/flows/resource-optimizer-flow';
import { Task, Staff, Supply } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { addDays, startOfToday, isWithinInterval } from 'date-fns';

interface ResourceOptimizerProps {
  tasks: Task[];
  staff: Staff[];
  supplies: Supply[];
}

const categoryConfig = {
  'Carga de Trabajo': {
    icon: <SlidersHorizontal className="h-4 w-4 text-blue-600 dark:text-blue-500" />,
    badgeClass: 'border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-400',
  },
  'Inventario': {
    icon: <AlertTriangle className="h-4 w-4 text-destructive" />,
    badgeClass: 'border-destructive/50 bg-destructive/10 text-destructive',
  },
  'Planificación': {
    icon: <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />,
    badgeClass: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  }
};

const severityConfig = {
  Alta: 'border-destructive/50 bg-destructive/10 text-destructive',
  Media: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  Baja: 'border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-400',
};

export function ResourceOptimizer({ tasks, staff, supplies }: ResourceOptimizerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ResourceOptimizerOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleOptimization = async () => {
    if (staff.length === 0) {
      toast({
        title: 'Personal insuficiente',
        description: 'Se necesita al menos 1 colaborador para optimizar.',
      });
      return;
    }
    
    const today = startOfToday();
    const nextSevenDays = {
      start: today,
      end: addDays(today, 7),
    };
    const upcomingTasks = tasks.filter(task => {
        const taskDate = new Date(task.startDate.replace(/-/g, '\/'));
        return isWithinInterval(taskDate, nextSevenDays) && task.status !== 'Finalizado';
    });
    
    if (upcomingTasks.length === 0) {
      toast({
        title: 'No hay labores para optimizar',
        description: 'No hay labores programadas para los próximos 7 días.',
      });
      return;
    }
      
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await optimizeResources({
        jsonData: JSON.stringify({ tasks: upcomingTasks, staff, supplies }),
        workWeekJournals: 5, // Standard 5-day work week
      });
      setResult(response);
    } catch (e: any) {
      console.error('Error optimizing resources:', e);
      const errorMessage = e.message || 'El servicio de optimización no está disponible en este momento.';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Error del Agente Optimizador',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SlidersHorizontal className="h-6 w-6 text-primary" />
          <span>Agente Optimizador de Recursos</span>
        </CardTitle>
        <CardDescription>
          Analiza la carga de trabajo y el inventario para la próxima semana y sugiere acciones para mejorar la eficiencia.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleOptimization} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Optimizando...
            </>
          ) : (
            'Optimizar Próxima Semana'
          )}
        </Button>

        {error && <p className="text-sm text-center text-destructive">{error}</p>}

        {result && (
          <div className="space-y-3 pt-4">
            {result.suggestions.length > 0 ? (
              <ul className="space-y-2">
                {result.suggestions.map((suggestion, index) => {
                  const catConfig = categoryConfig[suggestion.category] || categoryConfig['Planificación'];
                  const sevConfig = severityConfig[suggestion.severity];
                  return (
                    <li
                      key={index}
                      className={cn(
                        'flex items-start gap-3 rounded-lg border p-3 text-sm',
                        sevConfig
                      )}
                    >
                      <div className="mt-0.5">{catConfig.icon}</div>
                      <div className="flex-1">
                        <p className="font-semibold">{suggestion.category}</p>
                        <p>{suggestion.suggestion}</p>
                        <Badge variant="outline" className={cn("mt-2", sevConfig)}>{suggestion.severity}</Badge>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-4 rounded-lg bg-muted/50">
                <ShieldCheck className="h-8 w-8 text-green-600 mb-2" />
                <p className="font-semibold text-foreground">¡Operación Optimizada!</p>
                <p className="text-sm text-muted-foreground">El agente no encontró desbalances significativos para la próxima semana.</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

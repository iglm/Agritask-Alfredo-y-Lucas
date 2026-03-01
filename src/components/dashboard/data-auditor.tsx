'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, SearchCheck, ShieldCheck, FileQuestion, AlertTriangle } from 'lucide-react';
import { auditData, DataAuditOutput } from '@/ai/flows/data-audit-flow';
import { Lot, Task, Staff } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';
import { format, startOfToday } from 'date-fns';
import { cn } from '@/lib/utils';

interface DataAuditorProps {
  title: string;
  description: string;
  lots: Lot[];
  tasks: Task[];
  staff: Staff[];
  isAiProcessing: boolean;
  setIsAiProcessing: (isProcessing: boolean) => void;
}

const severityConfig = {
  Alta: {
    icon: <AlertTriangle className="h-4 w-4 text-destructive" />,
    badgeClass: 'border-destructive/50 bg-destructive/10 text-destructive',
  },
  Media: {
    icon: <FileQuestion className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />,
    badgeClass: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  },
  Baja: {
    icon: <FileQuestion className="h-4 w-4 text-blue-600 dark:text-blue-500" />,
    badgeClass: 'border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-400',
  },
};

export function DataAuditor({ title, description, lots, tasks, staff, isAiProcessing, setIsAiProcessing }: DataAuditorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DataAuditOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAudit = async () => {
    if (lots.length === 0 && tasks.length === 0 && staff.length === 0) {
      toast({
        title: 'No hay datos suficientes para auditar',
        description: 'Registra lotes, labores y colaboradores para que el auditor pueda trabajar.',
      });
      return;
    }
      
    setIsLoading(true);
    setIsAiProcessing(true);
    setError(null);
    setResult(null);

    try {
      // Include all relevant fields for the audit
      const staffForAudit = staff.map(s => ({ id: s.id, eps: s.eps, employmentType: s.employmentType }));
      const tasksForAudit = tasks.map(t => ({ id: t.id, responsibleId: t.responsibleId, category: t.category, lotId: t.lotId }));
      const lotsForAudit = lots.map(l => ({ id: l.id, sowingDate: l.sowingDate }));

      const response = await auditData({
        jsonData: JSON.stringify({ lots: lotsForAudit, tasks: tasksForAudit, staff: staffForAudit }),
        currentDate: format(startOfToday(), 'yyyy-MM-dd'),
      });
      setResult(response);
    } catch (e: any) {
      console.error('Error auditing data:', e);
      const errorMessage = e.message || 'El servicio de auditoría no está disponible en este momento.';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Error del Agente Auditor',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
      setIsAiProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SearchCheck className="h-6 w-6 text-primary" />
          <span>{title}</span>
        </CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleAudit} disabled={isLoading || isAiProcessing} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Auditando Datos...
            </>
          ) : (
            'Ejecutar Auditoría'
          )}
        </Button>

        {error && <p className="text-sm text-center text-destructive">{error}</p>}

        {result && (
          <div className="space-y-3 pt-4">
            {result.observations.length > 0 ? (
              <ul className="space-y-2">
                {result.observations.map((obs, index) => {
                  const config = severityConfig[obs.severity];
                  return (
                    <li
                      key={index}
                      className={cn(
                        'flex items-start gap-3 rounded-lg border p-3 text-sm',
                        config.badgeClass
                      )}
                    >
                      <div className="mt-0.5">{config.icon}</div>
                      <div className="flex-1">
                        <p className="font-semibold">{obs.category}</p>
                        <p>{obs.description}</p>
                        <p className="mt-2 text-xs italic text-muted-foreground">Sugerencia: {obs.suggestion}</p>
                         <Badge variant="outline" className={cn("mt-2", config.badgeClass)}>{obs.severity}</Badge>
                      </div>
                    </li>
                )})}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-4 rounded-lg bg-muted/50">
                <ShieldCheck className="h-8 w-8 text-green-600 mb-2" />
                <p className="font-semibold text-foreground">¡Datos Coherentes!</p>
                <p className="text-sm text-muted-foreground">El auditor no encontró inconsistencias lógicas.</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

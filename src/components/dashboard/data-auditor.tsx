'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, SearchCheck, ShieldCheck, FileQuestion } from 'lucide-react';
import { auditData, DataAuditOutput } from '@/ai/flows/data-audit-flow';
import { Lot, Task, Staff } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';
import { format, startOfToday } from 'date-fns';

interface DataAuditorProps {
  lots: Lot[];
  tasks: Task[];
  staff: Staff[];
}

export function DataAuditor({ lots, tasks, staff }: DataAuditorProps) {
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
    setError(null);
    setResult(null);

    try {
      const response = await auditData({
        jsonData: JSON.stringify({ lots, tasks, staff }),
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
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SearchCheck className="h-6 w-6 text-primary" />
          <span>Agente Auditor de Datos</span>
        </CardTitle>
        <CardDescription>
          Detecta inconsistencias lógicas y oportunidades de mejora en la planificación de tu finca.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleAudit} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Auditando Datos...
            </>
          ) : (
            'Ejecutar Auditoría Ahora'
          )}
        </Button>

        {error && <p className="text-sm text-center text-destructive">{error}</p>}

        {result && (
          <div className="space-y-3 pt-4">
            {result.observations.length > 0 ? (
              <ul className="space-y-2">
                {result.observations.map((obs, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 rounded-lg border border-blue-500/50 bg-blue-500/10 p-3 text-sm"
                  >
                    <div className="mt-0.5"><FileQuestion className="h-4 w-4 text-blue-600 dark:text-blue-400" /></div>
                    <div className="flex-1">
                      <p className="font-semibold text-blue-800 dark:text-blue-300">{obs.category}</p>
                      <p className="text-blue-700 dark:text-blue-400">{obs.description}</p>
                      <p className="mt-2 text-xs italic text-muted-foreground">Sugerencia: {obs.suggestion}</p>
                    </div>
                  </li>
                ))}
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

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';
import { detectAnomalies, AnomalyDetectionOutput } from '@/ai/flows/anomaly-detection-flow';
import { Lot, Task } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';

interface AnomalyDetectorProps {
  lots: Lot[];
  tasks: Task[];
}

const severityConfig = {
  Alto: {
    icon: <AlertTriangle className="h-4 w-4 text-destructive" />,
    badgeClass: 'border-destructive/50 bg-destructive/10 text-destructive',
  },
  Medio: {
    icon: <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />,
    badgeClass: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  },
  Bajo: {
    icon: <AlertTriangle className="h-4 w-4 text-blue-600 dark:text-blue-500" />,
    badgeClass: 'border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-400',
  },
};

export function AnomalyDetector({ lots, tasks }: AnomalyDetectorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnomalyDetectionOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDetection = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await detectAnomalies({
        jsonData: JSON.stringify({ lots, tasks }),
      });
      setResult(response);
    } catch (e: any) {
      console.error('Error detecting anomalies:', e);
      setError('No se pudieron detectar anomalías. Inténtalo de nuevo más tarde.');
      toast({
        variant: 'destructive',
        title: 'Error de IA',
        description: 'El servicio de detección de anomalías no está disponible en este momento.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-primary" />
          <span>Asistente IA de Detección</span>
        </CardTitle>
        <CardDescription>
          Usa inteligencia artificial para encontrar posibles problemas o inconsistencias en tus datos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleDetection} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analizando...
            </>
          ) : (
            'Detectar Anomalías Ahora'
          )}
        </Button>

        {error && <p className="text-sm text-center text-destructive">{error}</p>}

        {result && (
          <div className="space-y-3 pt-4">
            {result.anomalies.length > 0 ? (
              <ul className="space-y-2">
                {result.anomalies.map((anomaly, index) => {
                  const config = severityConfig[anomaly.severity];
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
                        <p>{anomaly.description}</p>
                        <Badge variant="outline" className={cn("mt-2", config.badgeClass)}>{anomaly.severity}</Badge>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-4 rounded-lg bg-muted/50">
                <ShieldCheck className="h-8 w-8 text-green-600 mb-2" />
                <p className="font-semibold text-foreground">Todo en orden</p>
                <p className="text-sm text-muted-foreground">No se encontraron anomalías significativas.</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

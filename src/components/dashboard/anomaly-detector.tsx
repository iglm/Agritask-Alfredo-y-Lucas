"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { detectAnomalies, type AnomalyDetectionOutput } from "@/ai/flows/anomaly-detection";
import { tasks } from "@/lib/data";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { BrainCircuit, AlertTriangle, Loader2 } from "lucide-react";

export function AnomalyDetector() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnomalyDetectionOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDetectAnomalies = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const taskData = JSON.stringify(tasks);
      const detectionResult = await detectAnomalies({ taskData });
      setResult(detectionResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ocurrió un error desconocido.");
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityBadge = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high':
        return <Badge variant="destructive">Alta</Badge>;
      case 'medium':
        return <Badge variant="secondary">Media</Badge>;
      case 'low':
        return <Badge variant="outline">Baja</Badge>;
      default:
        return <Badge>{severity}</Badge>;
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BrainCircuit className="h-6 w-6 text-primary" />
          <span>Detección de Anomalías con IA</span>
        </CardTitle>
        <CardDescription>
          Usa IA para analizar los datos de las labores en busca de posibles retrasos, sobrecostos y otros problemas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <Button onClick={handleDetectAnomalies} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analizando...
              </>
            ) : "Detectar Anomalías"}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <div className="flex flex-col gap-3">
              <h3 className="font-semibold">Análisis Completo</h3>
              {result.anomalies.length > 0 ? (
                result.anomalies.map((anomaly, index) => (
                  <Alert key={index}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle className="flex justify-between items-center">
                      <span>Anomalía Encontrada (Labor {anomaly.taskId || 'N/A'})</span>
                      {getSeverityBadge(anomaly.severity)}
                    </AlertTitle>
                    <AlertDescription>{anomaly.description}</AlertDescription>
                  </Alert>
                ))
              ) : (
                <Alert>
                  <AlertTitle>No se Detectaron Anomalías</AlertTitle>
                  <AlertDescription>Todas las labores parecen estar en orden según los datos proporcionados.</AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

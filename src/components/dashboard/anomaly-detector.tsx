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
      setError(e instanceof Error ? e.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityBadge = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge>{severity}</Badge>;
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BrainCircuit className="h-6 w-6 text-primary" />
          <span>AI Anomaly Detection</span>
        </CardTitle>
        <CardDescription>
          Use AI to analyze task data for potential delays, budget overruns, and other issues.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <Button onClick={handleDetectAnomalies} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : "Detect Anomalies"}
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
              <h3 className="font-semibold">Analysis Complete</h3>
              {result.anomalies.length > 0 ? (
                result.anomalies.map((anomaly, index) => (
                  <Alert key={index}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle className="flex justify-between items-center">
                      <span>Anomaly Found (Task {anomaly.taskId || 'N/A'})</span>
                      {getSeverityBadge(anomaly.severity)}
                    </AlertTitle>
                    <AlertDescription>{anomaly.description}</AlertDescription>
                  </Alert>
                ))
              ) : (
                <Alert>
                  <AlertTitle>No Anomalies Detected</AlertTitle>
                  <AlertDescription>All tasks appear to be on track based on the provided data.</AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

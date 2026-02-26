'use client';

import { useState } from "react";
import { Lot } from "@/lib/types";
import { useAppData } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { generateTaskPlan, TaskPlannerOutput } from "@/ai/flows/task-planner-flow";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { Bot, Check, ClipboardCopy, Loader2, Sparkles, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { ScrollArea } from "../ui/scroll-area";
import { Badge } from "../ui/badge";

interface TaskPlannerProps {
  lot: Lot;
  children: React.ReactNode;
}

type ProposedTask = TaskPlannerOutput['plannedTasks'][0];

export function TaskPlanner({ lot, children }: TaskPlannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [plan, setPlan] = useState<ProposedTask[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { addTask, staff } = useAppData();
  const { toast } = useToast();

  const handleGeneratePlan = async () => {
    if (!lot.sowingDate) {
        setError("El lote debe tener una fecha de siembra para generar un plan.");
        toast({
            variant: "destructive",
            title: "Falta Fecha de Siembra",
            description: `Por favor, edita el lote '${lot.name}' y añade una fecha de siembra.`,
        });
        return;
    }
    if (!staff || staff.length === 0) {
        setError("Debes tener colaboradores registrados para generar un plan.");
        toast({
            variant: "destructive",
            title: "No hay Colaboradores",
            description: "Por favor, añade al menos un colaborador en la sección de Colaboradores.",
        });
        return;
    }

    setIsLoading(true);
    setError(null);
    setPlan(null);

    try {
        const response = await generateTaskPlan({
            crop: lot.crop,
            sowingDate: lot.sowingDate,
            areaHectares: lot.areaHectares,
        });
        setPlan(response.plannedTasks);
    } catch (e: any) {
        console.error("Error generating task plan:", e);
        const errorMessage = e.message || 'No se pudo obtener una respuesta del asistente de IA.';
        setError(`No se pudo generar el plan. ${errorMessage}`);
        toast({
            variant: 'destructive',
            title: 'Error del Agente Planificador',
            description: errorMessage,
        });
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleApproveAndCreate = async () => {
    if (!plan || !staff || staff.length === 0) return;
    
    setIsCreating(true);
    try {
        let createdCount = 0;
        for (const proposedTask of plan) {
            // Simple round-robin assignment of staff
            const responsible = staff[createdCount % staff.length];
            
            const taskData = {
                lotId: lot.id,
                category: proposedTask.category,
                type: proposedTask.type,
                responsibleId: responsible.id,
                startDate: proposedTask.startDate,
                status: 'Por realizar' as const,
                progress: 0,
                plannedJournals: proposedTask.plannedJournals,
                observations: proposedTask.observations,
                plannedCost: proposedTask.plannedJournals * responsible.baseDailyRate,
                supplyCost: 0,
                actualCost: 0,
            };
            await addTask(taskData);
            createdCount++;
        }
        toast({
            title: "¡Plan de Labores Creado!",
            description: `Se han añadido ${createdCount} nuevas labores al calendario para el lote ${lot.name}.`,
        });
        setIsOpen(false); // Close dialog on success
    } catch (error) {
        console.error("Error creating tasks from plan:", error);
        toast({
            variant: 'destructive',
            title: 'Error al Crear Labores',
            description: 'No se pudieron guardar las labores planificadas. Por favor, inténtalo de nuevo.',
        });
    } finally {
        setIsCreating(false);
    }
  };

  const onOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
        // Reset state when closing
        setPlan(null);
        setError(null);
        setIsLoading(false);
        setIsCreating(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            Agente Planificador para: {lot.name}
          </DialogTitle>
          <DialogDescription>
            Genera un plan de labores agronómicas para 12 meses basado en el cultivo de <span className="font-semibold">{lot.crop}</span> y su fecha de siembra.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
            {!plan && !isLoading && !error && (
                 <div className="flex flex-col items-center justify-center text-center p-8 rounded-lg bg-muted/50">
                    <Sparkles className="h-12 w-12 text-primary mb-4" />
                    <h3 className="text-lg font-semibold">Generar Plan Anual de Labores</h3>
                    <p className="mt-2 max-w-md text-sm text-muted-foreground">
                        El Agente Planificador usará IA para crear un cronograma de labores basado en las mejores prácticas para el cultivo de <span className="font-bold">{lot.crop}</span>, ajustado al área y fecha de siembra de tu lote.
                    </p>
                    <Button onClick={handleGeneratePlan} className="mt-6">
                        Generar Plan Ahora
                    </Button>
                </div>
            )}
            {isLoading && (
                <div className="flex flex-col items-center justify-center text-center p-8">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                    <p className="font-semibold">El Agente Planificador está pensando...</p>
                    <p className="text-sm text-muted-foreground">Esto puede tardar unos segundos.</p>
                </div>
            )}
            {error && (
                 <div className="flex flex-col items-center justify-center text-center p-8 rounded-lg bg-destructive/10 text-destructive">
                    <X className="h-10 w-10 mb-4" />
                    <p className="font-semibold">Error</p>
                    <p className="text-sm">{error}</p>
                </div>
            )}
            {plan && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Plan de Labores Propuesto</h3>
                    <ScrollArea className="h-72 border rounded-md">
                        <div className="p-4 space-y-3">
                            {plan.map((task, index) => (
                                <div key={index} className="p-3 bg-muted/50 rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <p className="font-semibold text-foreground">{task.type}</p>
                                        <Badge variant="secondary">{format(parseISO(task.startDate), "dd MMM yyyy", { locale: es })}</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">{task.observations}</p>
                                    <div className="flex gap-4 text-xs mt-2">
                                        <span>Categoría: <span className="font-medium">{task.category}</span></span>
                                        <span>Jornales: <span className="font-medium">{task.plannedJournals}</span></span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            )}
        </div>
        
        {plan && (
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="ghost">Cancelar</Button>
                </DialogClose>
                <Button onClick={handleApproveAndCreate} disabled={isCreating}>
                    {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                    Aprobar y Añadir {plan.length} Labores
                </Button>
            </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Bot, Check, FileJson, Loader2, Sparkles, Wand2, Wheat, X, Users, CheckSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { buildFarmFromDescription, FarmBuilderOutput } from '@/ai/flows/farm-builder-flow';
import { useFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { ProductiveUnit, Lot, Staff, Task } from '@/lib/types';
import { writeBatch, collection, doc, query, where, getDocs } from 'firebase/firestore';

export default function SetupPage() {
  const { firestore, user } = useFirebase();
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [plan, setPlan] = useState<FarmBuilderOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGeneratePlan = async () => {
    if (!description.trim()) {
      toast({ variant: 'destructive', title: 'La descripción está vacía.' });
      return;
    }
    setIsLoading(true);
    setError(null);
    setPlan(null);

    try {
      const response = await buildFarmFromDescription({ description });
      setPlan(response);
    } catch (e: any) {
      console.error('Error building farm:', e);
      const errorMessage = e.message || 'El servicio de IA no está disponible.';
      setError(errorMessage);
      toast({ variant: 'destructive', title: 'Error del Constructor IA', description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecutePlan = async () => {
    if (!plan || !firestore || !user) return;

    setIsCreating(true);
    const batch = writeBatch(firestore);

    try {
        // 1. Create Productive Unit
        const unitRef = doc(collection(firestore, 'productiveUnits'));
        const newUnit: ProductiveUnit = {
            ...plan.productiveUnit,
            farmName: plan.productiveUnit.farmName || 'Mi Finca',
            id: unitRef.id,
            userId: user.uid,
        };
        batch.set(unitRef, newUnit);

        // 2. Create Lots & map their names to their future IDs
        const createdLotMap = new Map<string, string>();
        if (plan.lots) {
            for (const lotData of plan.lots) {
                const lotRef = doc(collection(firestore, 'lots'));
                const newLot: Lot = {
                    ...lotData,
                    crop: lotData.crop || '',
                    id: lotRef.id,
                    userId: user.uid,
                    productiveUnitId: unitRef.id,
                    type: lotData.crop ? 'Productivo' : 'Soporte',
                };
                batch.set(lotRef, newLot);
                // Ensure lot name is not undefined before setting it in map
                if (lotData.name) {
                    createdLotMap.set(lotData.name, lotRef.id);
                }
            }
        }
        
        // 3. Create Staff & determine the default responsible for tasks
        let defaultResponsibleId: string | null = null;
        let defaultDailyRate: number = 50000;

        if (plan.staff && plan.staff.length > 0) {
            for (const [index, staffData] of plan.staff.entries()) {
                const staffRef = doc(collection(firestore, 'staff'));
                 const newStaff: Staff = {
                    ...staffData,
                    id: staffRef.id,
                    userId: user.uid,
                };
                batch.set(staffRef, newStaff);
                if (index === 0) {
                    defaultResponsibleId = staffRef.id;
                    defaultDailyRate = staffData.baseDailyRate;
                }
            }
        } else {
            const staffQuery = query(collection(firestore, 'staff'), where('userId', '==', user.uid));
            const existingStaffSnapshot = await getDocs(staffQuery);
            if (!existingStaffSnapshot.empty) {
                const firstStaffDoc = existingStaffSnapshot.docs[0];
                defaultResponsibleId = firstStaffDoc.id;
                defaultDailyRate = (firstStaffDoc.data() as Staff).baseDailyRate;
            }
        }
        
        if ((plan.tasks && plan.tasks.length > 0) && !defaultResponsibleId) {
            toast({ variant: 'destructive', title: 'No hay personal disponible', description: 'No se pueden crear labores sin colaboradores. Por favor, añádelos en tu descripción o regístralos manualmente.' });
            setIsCreating(false);
            return;
        }

        // 4. Create Tasks
        if (plan.tasks && defaultResponsibleId) {
            for (const taskData of plan.tasks) {
                const lotId = createdLotMap.get(taskData.lotName);
                if (!lotId) {
                    console.warn(`Could not find lot with name "${taskData.lotName}" to create a task. Skipping.`);
                    continue;
                }

                const taskRef = doc(collection(firestore, 'tasks'));
                const newTask: Omit<Task, 'id'| 'userId'> = {
                    lotId: lotId,
                    category: taskData.category,
                    type: taskData.type,
                    responsibleId: defaultResponsibleId,
                    startDate: taskData.startDate,
                    status: 'Por realizar',
                    progress: 0,
                    plannedJournals: taskData.plannedJournals,
                    observations: taskData.observations || '',
                    plannedCost: taskData.plannedJournals * defaultDailyRate,
                    supplyCost: 0,
                    actualCost: 0,
                    isRecurring: taskData.isRecurring,
                    recurrenceInterval: taskData.recurrenceInterval,
                    recurrenceFrequency: taskData.recurrenceFrequency,
                };
                batch.set(taskRef, newTask);
            }
        }

        await batch.commit();

        toast({
            title: "¡Operación Construida!",
            description: `Se crearon ${plan.lots?.length || 0} lotes, ${plan.staff?.length || 0} colaboradores y ${plan.tasks?.length || 0} labores.`,
        });
        setPlan(null);
        setDescription('');

    } catch (e: any) {
        console.error('Error executing plan:', e);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: `productiveUnits (batch operation)`,
          operation: 'write',
          requestResourceData: plan
        }));
        toast({ variant: 'destructive', title: 'Error al Crear la Operación', description: 'No se pudo guardar la información. Revisa los permisos de la base de datos.' });
    } finally {
        setIsCreating(false);
    }
  };
  

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Constructor IA" />
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span>Constructor de Fincas</span>
          </CardTitle>
          <CardDescription>
            Describe tu finca en lenguaje natural y la IA la creará por ti. Incluye detalles como nombre, ubicación, número y tipo de lotes, y número de trabajadores.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ej: Crea la finca 'La Manuela' en Jardín, Antioquia, con 50 hectáreas. Tiene 10 lotes de café de 5 hectáreas cada uno, sembrados hace 2 años. También registra a 15 trabajadores con un jornal de 50000..."
            className="flex-1 text-base"
            rows={8}
            disabled={isLoading || isCreating}
          />
           <Button onClick={handleGeneratePlan} disabled={isLoading || isCreating || !description.trim()} size="lg">
              {isLoading ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analizando Descripción...</>
              ) : (
                <><Wand2 className="mr-2 h-5 w-5" /> Generar Plan de Construcción</>
              )}
          </Button>

           {error && (
                <div className="flex flex-col items-center justify-center text-center p-4 rounded-lg bg-destructive/10 text-destructive">
                    <X className="h-8 w-8 mb-2" />
                    <p className="font-semibold">Error del Asistente</p>
                    <p className="text-sm">{error}</p>
                </div>
            )}

           {plan && (
             <Card className="bg-muted/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <FileJson className="h-5 w-5 text-primary" />
                        Plan de Construcción Propuesto
                    </CardTitle>
                     <CardDescription>
                        <Bot className="h-4 w-4 inline-block mr-2" />
                        {plan.summary}
                     </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                        <Wheat className="h-4 w-4 text-muted-foreground"/>
                        <span>Finca: <span className="font-semibold">{plan.productiveUnit.farmName || 'Mi Finca'}</span></span>
                    </div>
                     <div className="flex items-center gap-2">
                        <Tractor className="h-4 w-4 text-muted-foreground"/>
                        <span>Lotes a crear: <span className="font-semibold">{plan.lots?.length || 0}</span></span>
                    </div>
                     <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground"/>
                        <span>Personal a registrar: <span className="font-semibold">{plan.staff?.length || 0}</span></span>
                    </div>
                     <div className="flex items-center gap-2">
                        <CheckSquare className="h-4 w-4 text-muted-foreground"/>
                        <span>Labores a programar: <span className="font-semibold">{plan.tasks?.length || 0}</span></span>
                    </div>
                    <div className="flex gap-4 pt-4">
                        <Button onClick={handleExecutePlan} disabled={isCreating} className="w-full" size="lg">
                            {isCreating ? (
                                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Creando Finca...</>
                            ) : (
                                <><Check className="mr-2 h-5 w-5" /> Aprobar y Construir</>
                            )}
                        </Button>
                        <Button variant="ghost" onClick={() => setPlan(null)} disabled={isCreating}>
                            Cancelar
                        </Button>
                    </div>
                </CardContent>
             </Card>
           )}
        </CardContent>
      </Card>
    </div>
  );
}

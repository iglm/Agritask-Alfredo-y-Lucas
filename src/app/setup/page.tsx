"use client";

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Home, Users, Check, CalendarCheck, X, Tractor } from 'lucide-react';
import { buildFarmFromDescription, FarmBuilderOutput } from '@/ai/flows/farm-builder-flow';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase';
import { Lot, Staff, Task, ProductiveUnit } from '@/lib/types';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function SetupPage() {
  const [description, setDescription] = useState('');
  const [plan, setPlan] = useState<FarmBuilderOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const { firestore, user } = useFirebase();
  const router = useRouter();

  const addUnit = (batch: any, data: any) => {
    if (!user || !firestore) throw new Error("User or Firestore not available");
    const newDocRef = doc(collection(firestore, 'productiveUnits'));
    const newUnit = { ...data, id: newDocRef.id, userId: user.uid };
    batch.set(newDocRef, newUnit);
    return newUnit;
  };

  const addLot = (batch: any, unitId: string, data: any) => {
    if (!user || !firestore) throw new Error("User or Firestore not available");
    const newDocRef = doc(collection(firestore, 'lots'));
    const type = data.crop && data.crop.length > 0 ? 'Productivo' : 'Soporte';
    const newLot = { ...data, type, id: newDocRef.id, userId: user.uid, productiveUnitId: unitId };
    batch.set(newDocRef, newLot);
    return newLot;
  };
  
  const addStaff = (batch: any, data: any) => {
    if (!user || !firestore) throw new Error("User or Firestore not available");
    const newDocRef = doc(collection(firestore, 'staff'));
    const newStaff = { ...data, id: newDocRef.id, userId: user.uid };
    batch.set(newDocRef, newStaff);
    return newStaff;
  };

  const addTask = (batch: any, lotId: string, responsibleId: string, responsibleRate: number, data: any) => {
    if (!user || !firestore) throw new Error("User or Firestore not available");
    const newDocRef = doc(collection(firestore, 'tasks'));
    const taskData = {
        ...data,
        lotId,
        responsibleId,
        id: newDocRef.id,
        userId: user.uid,
        status: 'Por realizar' as const,
        progress: 0,
        plannedCost: (data.plannedJournals || 0) * responsibleRate,
        supplyCost: 0,
        actualCost: 0,
    };
    batch.set(newDocRef, taskData);
    return taskData;
  };


  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    
    setIsLoading(true);
    setPlan(null);
    try {
      const result = await buildFarmFromDescription({ description });
      setPlan(result);
    } catch (error: any) {
      console.error("Error generating farm plan:", error);
      toast({
        variant: "destructive",
        title: "Error del Constructor IA",
        description: error.message || "No se pudo generar el plan. Inténtalo de nuevo.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiscardPlan = () => {
    setPlan(null);
  };

  const handleApproveAndBuild = async () => {
    if (!plan || !firestore || !user) {
        toast({ variant: 'destructive', title: 'Error', description: 'No hay un plan para construir o no se ha iniciado sesión.' });
        return;
    }
    setIsCreating(true);
    try {
        const batch = writeBatch(firestore);

        // 1. Create Productive Unit
        const newUnit = addUnit(batch, plan.productiveUnit);

        // 2. Create Lots
        const createdLots: Lot[] = [];
        if (plan.lots) {
            plan.lots.forEach(lotData => {
                const newLot = addLot(batch, newUnit.id, lotData);
                createdLots.push(newLot);
            });
        }
        
        // 3. Create Staff
        const createdStaff: Staff[] = [];
        if (plan.staff) {
            plan.staff.forEach(staffData => {
                const newStaffMember = addStaff(batch, staffData);
                createdStaff.push(newStaffMember);
            });
        }
        
        // 4. Create Tasks
        if (plan.tasks && createdLots.length > 0 && createdStaff.length > 0) {
            plan.tasks.forEach((taskData, index) => {
                const targetLot = createdLots.find(l => l.name === taskData.lotName);
                if (targetLot) {
                    const responsible = createdStaff[index % createdStaff.length];
                    addTask(batch, targetLot.id, responsible.id, responsible.baseDailyRate, taskData);
                }
            });
        }

        await batch.commit();

        toast({
            title: '¡Construcción Exitosa!',
            description: `Se ha creado la finca ${newUnit.farmName} con todos sus componentes.`,
        });
        
        // Redirect to a relevant page after creation
        router.push('/lotes');

    } catch (error: any) {
        console.error("Error building farm:", error);
        toast({
            variant: "destructive",
            title: "Error en la Construcción",
            description: "No se pudo guardar la estructura de la finca. Revisa la consola para más detalles.",
        });
    } finally {
        setIsCreating(false);
    }
  };

  return (
    <div>
      <PageHeader title="Constructor IA de Fincas" />
      <Card>
        <CardHeader>
          <CardTitle>Describe tu Operación</CardTitle>
          <CardDescription>
            Usa lenguaje natural para describir tu finca. La IA generará un plan de construcción que podrás aprobar.
            Sé lo más detallado posible para obtener los mejores resultados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGeneratePlan} className="w-full space-y-4">
              <Textarea
                id="farm-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe tu finca. Por ejemplo: 'Crea una finca cafetera de 20 hectáreas en Jardín, Antioquia, con 8 lotes de 2.5 Ha cada uno, sembrados hace 3 años. Registra también 10 trabajadores y programa 3 fertilizaciones al año.'"
                className="min-h-[150px] text-base"
                rows={6}
                disabled={isLoading || isCreating}
              />
              <Button type="submit" className="w-full" disabled={!description.trim() || isLoading || isCreating}>
                {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Generando Plan...</>) : (<><Sparkles className="mr-2 h-4 w-4"/> Generar Plan</>)}
              </Button>
          </form>

          {plan && (
               <Card className="w-full bg-muted/50 mt-6">
                   <CardHeader>
                      <CardTitle>Plan Propuesto por la IA</CardTitle>
                      <CardDescription>{plan.summary}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                      <div className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-muted-foreground"/>
                          <span>Finca: <span className="font-semibold">{plan.productiveUnit.farmName || 'Finca Sin Nombre'}</span></span>
                      </div>
                       <div className="flex items-center gap-2">
                          <Tractor className="h-4 w-4 text-muted-foreground"/>
                          <span>Lotes a crear: <span className="font-semibold">{plan.lots?.length || 0}</span></span>
                      </div>
                       <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground"/>
                          <span>Colaboradores a registrar: <span className="font-semibold">{plan.staff?.length || 0}</span></span>
                      </div>
                      {plan.tasks && plan.tasks.length > 0 && (
                          <div className="flex items-center gap-2">
                              <CalendarCheck className="h-4 w-4 text-muted-foreground"/>
                              <span>Labores a programar: <span className="font-semibold">{plan.tasks.length}</span></span>
                          </div>
                      )}
                  </CardContent>
                  <CardFooter>
                       <div className="flex w-full gap-2">
                          <Button onClick={handleApproveAndBuild} className="flex-1" disabled={isCreating}>
                              {isCreating ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Construyendo... </>) : (<><Check className="mr-2 h-4 w-4"/> Aprobar y Construir</>)}
                          </Button>
                          <Button variant="ghost" onClick={handleDiscardPlan} disabled={isCreating}>
                            <X className="mr-2 h-4 w-4" />
                            Descartar
                          </Button>
                      </div>
                  </CardFooter>
              </Card>
          )}

        </CardContent>
      </Card>
    </div>
  );
}

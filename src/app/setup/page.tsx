"use client";

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Home, Users, Check, CalendarCheck, X, Tractor, SprayCan } from 'lucide-react';
import { buildFarmFromDescription, FarmBuilderOutput } from '@/ai/flows/farm-builder-flow';
import { useToast } from '@/hooks/use-toast';
import { useAppData } from '@/firebase';
import { Lot, Staff, Task } from '@/lib/types';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export default function SetupPage() {
  const [description, setDescription] = useState('');
  const [plan, setPlan] = useState<FarmBuilderOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const { firestore, user, productiveUnits, lots, staff, isLoading: appDataLoading } = useAppData();
  const router = useRouter();


  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    const existingUnit = productiveUnits && productiveUnits.length > 0 ? productiveUnits[0] : undefined;
    
    setIsLoading(true);
    setPlan(null);
    try {
      const result = await buildFarmFromDescription({ 
        description,
        existingUnit: existingUnit ? { id: existingUnit.id, farmName: existingUnit.farmName || 'Finca sin nombre' } : undefined,
       });
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

    // --- Helper functions defined inside the handler to ensure correct scope ---
    const addUnit = (batch: any, data: any) => {
      const newDocRef = doc(collection(firestore, 'productiveUnits'));
      const newUnit = { ...data, id: newDocRef.id, userId: user.uid };
      batch.set(newDocRef, newUnit);
      return newUnit;
    };

    const addLot = (batch: any, unitId: string, data: any) => {
      const newDocRef = doc(collection(firestore, 'lots'));
      const type = data.crop && data.crop.length > 0 ? 'Productivo' : 'Soporte';
      const newLot = { ...data, type, id: newDocRef.id, userId: user.uid, productiveUnitId: unitId };
      batch.set(newDocRef, newLot);
      return newLot;
    };
    
    const addStaff = (batch: any, data: any) => {
      const newDocRef = doc(collection(firestore, 'staff'));
      const newStaff = { ...data, id: newDocRef.id, userId: user.uid };
      batch.set(newDocRef, newStaff);
      return newStaff;
    };

    const addTask = (batch: any, lotId: string, responsibleId: string, responsibleRate: number, data: any) => {
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

    const addSupply = (batch: any, data: any) => {
      const newDocRef = doc(collection(firestore, 'supplies'));
      const newSupply = { ...data, id: newDocRef.id, userId: user.uid };
      batch.set(newDocRef, newSupply);
      return newSupply;
    };
    // --- End of helper functions ---


    const existingUnit = productiveUnits && productiveUnits.length > 0 ? productiveUnits[0] : undefined;

    if (existingUnit && plan.productiveUnit) {
      toast({
        variant: "destructive",
        title: "Conflicto en el Plan",
        description: "El plan intenta crear una nueva finca, pero ya tienes una. Ajusta tu descripción para solo añadir lotes o personal.",
      });
      return;
    }

    setIsCreating(true);
    try {
        const batch = writeBatch(firestore);
        let unitId: string;
        let unitName: string;

        if (existingUnit) {
            unitId = existingUnit.id;
            unitName = existingUnit.farmName || 'tu finca';
        } else if (plan.productiveUnit) {
            const newUnit = addUnit(batch, plan.productiveUnit);
            unitId = newUnit.id;
            unitName = newUnit.farmName || 'la nueva finca';
        } else {
             throw new Error("No hay una unidad productiva existente ni una nueva para construir. Por favor, describe la finca que quieres crear.");
        }

        const createdLots: Lot[] = [];
        if (plan.lots) {
            plan.lots.forEach(lotData => {
                const newLot = addLot(batch, unitId, lotData);
                createdLots.push(newLot);
            });
        }
        
        const createdStaff: Staff[] = [];
        if (plan.staff) {
            plan.staff.forEach(staffData => {
                const newStaffMember = addStaff(batch, staffData);
                createdStaff.push(newStaffMember);
            });
        }
        
        if (plan.supplies) {
            plan.supplies.forEach(supplyData => {
                addSupply(batch, supplyData);
            });
        }

        if (plan.tasks) {
            const allLotsForAssignment = [...createdLots, ...(lots || [])];
            const allStaffForAssignment = [...createdStaff, ...(staff || [])];

            if (allStaffForAssignment.length > 0) {
                plan.tasks.forEach((taskData, index) => {
                    const targetLot = allLotsForAssignment.find(l => l.name === taskData.lotName);
                    if (targetLot) {
                        const responsible = allStaffForAssignment[index % allStaffForAssignment.length];
                        addTask(batch, targetLot.id, responsible.id, responsible.baseDailyRate, taskData);
                    }
                });
            }
        }


        await batch.commit();

        toast({
            title: '¡Construcción Exitosa!',
            description: `Se han añadido los nuevos elementos a ${unitName}.`,
        });
        
        router.push('/lotes');

    } catch (error: any) {
        console.error("Error building farm:", error);
        toast({
            variant: "destructive",
            title: "Error en la Construcción",
            description: error.message || "No se pudo guardar la estructura de la finca. Revisa la consola para más detalles.",
        });
    } finally {
        setIsCreating(false);
    }
  };
  
  if (appDataLoading) {
      return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div>
      <PageHeader title="Constructor IA de Fincas" />
      <Card>
        <CardHeader>
          <CardTitle>Describe tu Operación</CardTitle>
          <CardDescription>
            Usa lenguaje natural para describir tu finca o para añadir nuevos lotes y personal. La IA generará un plan de construcción que podrás aprobar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGeneratePlan} className="w-full space-y-4">
              <Textarea
                id="farm-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  (productiveUnits && productiveUnits.length > 0) 
                  ? "Ya tienes una finca. Describe los lotes o trabajadores que quieres añadir. Ej: 'Añadir 5 lotes de café de 2 hectáreas cada uno y registrar 8 nuevos trabajadores.'" 
                  : "Describe tu finca. Por ejemplo: 'Crea una finca cafetera de 20 hectáreas en Jardín, Antioquia, con 8 lotes de 2.5 Ha cada uno, sembrados hace 3 años. Registra también 10 trabajadores y el insumo Urea.'"
                }
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
                      <CardTitle>Plan de Construcción Propuesto</CardTitle>
                      <CardDescription>{plan.summary}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="multiple" className="w-full space-y-2">
                        {plan.productiveUnit && (
                            <AccordionItem value="unit" className='bg-background/50 rounded-md border px-4'>
                            <AccordionTrigger className='py-3'>
                                <div className="flex items-center gap-3">
                                <Home className="h-5 w-5 text-muted-foreground" />
                                <span className='font-semibold'>Unidad Productiva</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className='pb-4'>
                                <p className="text-sm text-muted-foreground">Se creará la finca principal: <span className="font-semibold text-foreground">{plan.productiveUnit.farmName}</span>.</p>
                            </AccordionContent>
                            </AccordionItem>
                        )}
                        {plan.lots && plan.lots.length > 0 && (
                            <AccordionItem value="lots" className='bg-background/50 rounded-md border px-4'>
                            <AccordionTrigger className='py-3'>
                                <div className="flex items-center gap-3">
                                <Tractor className="h-5 w-5 text-muted-foreground" />
                                <span className='font-semibold'>Lotes a Crear</span>
                                <Badge variant="secondary">{plan.lots.length}</Badge>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className='pb-2'>
                                <ScrollArea className="h-40">
                                <div className="p-1 space-y-2">
                                    {plan.lots.map((lot, index) => (
                                    <div key={index} className="text-sm p-2 bg-muted/40 rounded">
                                        <span className="font-semibold text-foreground">{lot.name}:</span> <span className='text-muted-foreground'>{lot.areaHectares} Ha, Cultivo: {lot.crop || 'N/A'}.</span>
                                    </div>
                                    ))}
                                </div>
                                </ScrollArea>
                            </AccordionContent>
                            </AccordionItem>
                        )}
                        {plan.staff && plan.staff.length > 0 && (
                             <AccordionItem value="staff" className='bg-background/50 rounded-md border px-4'>
                             <AccordionTrigger className='py-3'>
                                 <div className="flex items-center gap-3">
                                 <Users className="h-5 w-5 text-muted-foreground" />
                                 <span className='font-semibold'>Colaboradores a Registrar</span>
                                 <Badge variant="secondary">{plan.staff.length}</Badge>
                                 </div>
                             </AccordionTrigger>
                             <AccordionContent className='pb-2'>
                                 <ScrollArea className="h-40">
                                 <div className="p-1 space-y-2">
                                     {plan.staff.map((s, index) => (
                                     <div key={index} className="text-sm p-2 bg-muted/40 rounded">
                                         <span className="font-semibold text-foreground">{s.name}:</span> <span className='text-muted-foreground'>Jornal: ${s.baseDailyRate.toLocaleString()}, Tipo: {s.employmentType}.</span>
                                     </div>
                                     ))}
                                 </div>
                                 </ScrollArea>
                             </AccordionContent>
                             </AccordionItem>
                        )}
                        {plan.supplies && plan.supplies.length > 0 && (
                             <AccordionItem value="supplies" className='bg-background/50 rounded-md border px-4'>
                             <AccordionTrigger className='py-3'>
                                 <div className="flex items-center gap-3">
                                 <SprayCan className="h-5 w-5 text-muted-foreground" />
                                 <span className='font-semibold'>Insumos a Crear</span>
                                 <Badge variant="secondary">{plan.supplies.length}</Badge>
                                 </div>
                             </AccordionTrigger>
                             <AccordionContent className='pb-2'>
                                 <ScrollArea className="h-40">
                                 <div className="p-1 space-y-2">
                                     {plan.supplies.map((s, index) => (
                                     <div key={index} className="text-sm p-2 bg-muted/40 rounded">
                                         <span className="font-semibold text-foreground">{s.name}:</span> <span className='text-muted-foreground'>Unidad: {s.unitOfMeasure}, Costo: ${s.costPerUnit.toLocaleString()}.</span>
                                     </div>
                                     ))}
                                 </div>
                                 </ScrollArea>
                             </AccordionContent>
                             </AccordionItem>
                        )}
                        {plan.tasks && plan.tasks.length > 0 && (
                             <AccordionItem value="tasks" className='bg-background/50 rounded-md border px-4'>
                             <AccordionTrigger className='py-3'>
                                 <div className="flex items-center gap-3">
                                 <CalendarCheck className="h-5 w-5 text-muted-foreground" />
                                 <span className='font-semibold'>Labores a Programar</span>
                                 <Badge variant="secondary">{plan.tasks.length}</Badge>
                                 </div>
                             </AccordionTrigger>
                             <AccordionContent className='pb-2'>
                                 <ScrollArea className="h-64">
                                 <div className="p-1 space-y-2">
                                     {plan.tasks.map((task, index) => (
                                     <div key={index} className="text-sm p-2 bg-muted/40 rounded">
                                         <div className="flex justify-between">
                                            <span className="font-semibold text-foreground">{task.type}</span>
                                            <Badge variant='outline'>{format(parseISO(task.startDate), "dd MMM yyyy", { locale: es })}</Badge>
                                         </div>
                                         <p className='text-muted-foreground'>Lote: {task.lotName}, Jornales: {task.plannedJournals}.</p>
                                     </div>
                                     ))}
                                 </div>
                                 </ScrollArea>
                             </AccordionContent>
                             </AccordionItem>
                        )}
                    </Accordion>
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

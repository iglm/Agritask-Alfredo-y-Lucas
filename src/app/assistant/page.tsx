
"use client";

import { useState, useRef, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Bot, Loader2, Send } from 'lucide-react';
import { dispatchAction, DispatcherOutput } from '@/ai/flows/assistant-flow';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { Lot, Staff, Task, ProductiveUnit, Supply, Transaction, SubLot } from '@/lib/types';
import { collection, query, where, doc, setDoc, writeBatch, getDocs, deleteDoc } from 'firebase/firestore';

type ExecutionLog = {
  id: string;
  type: 'summary' | 'action' | 'error';
  message: string;
};

export default function AssistantPage() {
  const [command, setCommand] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [executionLog, setExecutionLog] = useState<ExecutionLog[]>([]);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { firestore, user } = useFirebase();

  // Data queries for context
  const unitsQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'productiveUnits'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: units, isLoading: unitsLoading } = useCollection<ProductiveUnit>(unitsQuery);

  const lotsQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'lots'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: lots, isLoading: lotsLoading } = useCollection<Lot>(lotsQuery);

  const staffQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'staff'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: staff, isLoading: staffLoading } = useCollection<Staff>(staffQuery);
  
  const suppliesQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'supplies'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: supplies, isLoading: suppliesLoading } = useCollection<Supply>(suppliesQuery);
  
  const tasksQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'tasks'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: allTasks, isLoading: tasksLoading } = useCollection<Task>(tasksQuery);

  const isPageLoading = unitsLoading || lotsLoading || staffLoading || suppliesLoading || tasksLoading;

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [executionLog]);

  const logMessage = (type: ExecutionLog['type'], message: string) => {
    setExecutionLog(prev => [...prev, { id: Date.now().toString(), type, message }]);
  };
  
  // --- Action Handlers ---
  const addProductiveUnit = async (data: Omit<ProductiveUnit, 'id' | 'userId'>) => {
    if (!user || !firestore) throw new Error("Not authenticated");
    const newDocRef = doc(collection(firestore, 'productiveUnits'));
    const newUnit: ProductiveUnit = { ...data, id: newDocRef.id, userId: user.uid };
    await setDoc(newDocRef, newUnit);
    return newUnit;
  };
  
  const addLot = async (data: Omit<Lot, 'id' | 'userId'>) => {
    if (!user || !firestore) throw new Error("Not authenticated");
    const newDocRef = doc(collection(firestore, 'lots'));
    const type = data.crop && data.crop.length > 0 ? 'Productivo' : 'Soporte';
    const newLot: Lot = { ...data, type, id: newDocRef.id, userId: user.uid };
    await setDoc(newDocRef, newLot);
    return newLot;
  };

  const updateLot = async (id: string, updates: Partial<Lot>) => {
    if (!user || !firestore) throw new Error("Not authenticated");
    const docRef = doc(firestore, 'lots', id);
    await setDoc(docRef, updates, { merge: true });
    return { id, ...updates };
  };

  const deleteLot = async (id: string) => {
    if (!user || !firestore) throw new Error("Not authenticated");
    const lotRef = doc(firestore, 'lots', id);
    const batch = writeBatch(firestore);
    
    const sublotsQuery = query(collection(firestore, 'lots', id, 'sublots'));
    const sublotsSnapshot = await getDocs(sublotsQuery);
    sublotsSnapshot.forEach(doc => batch.delete(doc.ref));

    const tasksQuerySnapshot = await getDocs(query(collection(firestore, 'tasks'), where('userId', '==', user.uid), where('lotId', '==', id)));
    for (const taskDoc of tasksQuerySnapshot.docs) {
        const usagesSnapshot = await getDocs(collection(firestore, 'tasks', taskDoc.id, 'supplyUsages'));
        usagesSnapshot.forEach(usageDoc => batch.delete(usageDoc.ref));
        batch.delete(taskDoc.ref);
    }

    const transactionsQuerySnapshot = await getDocs(query(collection(firestore, 'transactions'), where('userId', '==', user.uid), where('lotId', '==', id)));
    transactionsQuerySnapshot.forEach(doc => batch.delete(doc.ref));
    
    batch.delete(lotRef);
    await batch.commit();
  };
  
  const addStaff = async (data: Omit<Staff, 'id' | 'userId'>) => {
    if (!user || !firestore) throw new Error("Not authenticated");
    const newDocRef = doc(collection(firestore, 'staff'));
    const newStaff: Staff = { ...data, id: newDocRef.id, userId: user.uid };
    await setDoc(newDocRef, newStaff);
    return newStaff;
  };

  const updateStaff = async (id: string, updates: Partial<Staff>) => {
    if (!user || !firestore) throw new Error("Not authenticated");
    const docRef = doc(firestore, 'staff', id);
    await setDoc(docRef, updates, { merge: true });
  };
  
  const addTask = async (data: Omit<Task, 'id' | 'userId'>) => {
    if (!user || !firestore) throw new Error("Not authenticated");
    const newDocRef = doc(collection(firestore, 'tasks'));
    const newTask: Task = { ...data, id: newDocRef.id, userId: user.uid };
    await setDoc(newDocRef, newTask);
    return newTask;
  };

  const addSupply = async (data: Omit<Supply, 'id' | 'userId'>) => {
    if (!user || !firestore) throw new Error("Not authenticated");
    const newDocRef = doc(collection(firestore, 'supplies'));
    const newSupply: Supply = { ...data, initialStock: data.currentStock, id: newDocRef.id, userId: user.uid };
    await setDoc(newDocRef, newSupply);
    return newSupply;
  };

  const addTransaction = async (data: Omit<Transaction, 'id' | 'userId'>) => {
    if (!user || !firestore) throw new Error("Not authenticated");
    const newDocRef = doc(collection(firestore, 'transactions'));
    const newTransaction: Transaction = { ...data, id: newDocRef.id, userId: user.uid };
    await setDoc(newDocRef, newTransaction);
    return newTransaction;
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || isLoading) return;

    setIsLoading(true);
    setExecutionLog([]);

    try {
      const context = JSON.stringify({
        productiveUnits: (units || []).map(u => ({ id: u.id, name: u.farmName })),
        lots: (lots || []).map(l => ({ id: l.id, name: l.name })),
        staff: (staff || []).map(s => ({ id: s.id, name: s.name })),
        supplies: (supplies || []).map(s => ({id: s.id, name: s.name})),
      });
      
      const result: DispatcherOutput = await dispatchAction({ command, context });
      
      if (result.summary) {
        logMessage('summary', result.summary);
      }

      for (const action of result.plan) {
        let systemMessageContent = '';

        switch(action.action) {
          case 'CREATE_PRODUCTIVE_UNIT':
            const newUnit = await addProductiveUnit(action.payload);
            systemMessageContent = `✅ Finca "${newUnit.farmName}" creada.`;
            break;

          case 'CREATE_LOT':
            const newLot = await addLot(action.payload);
            const parentUnitName = units?.find(u => u.id === newLot.productiveUnitId)?.farmName || 'Unidad desconocida';
            systemMessageContent = `✅ Lote "${newLot.name}" añadido a la finca "${parentUnitName}".`;
            break;
          
          case 'UPDATE_LOT':
            const { id: lotIdToUpdate, updates: lotUpdates } = action.payload;
            await updateLot(lotIdToUpdate, lotUpdates);
            const updatedLotFields = Object.keys(lotUpdates).join(', ');
            const updatedLotName = lots?.find(l => l.id === lotIdToUpdate)?.name || lotIdToUpdate;
            systemMessageContent = `✅ Lote "${updatedLotName}" actualizado. Campos modificados: ${updatedLotFields}.`;
            break;
            
          case 'DELETE_LOT':
            const { id: lotIdToDelete, name: lotNameToDelete } = action.payload;
            await deleteLot(lotIdToDelete);
            systemMessageContent = `✅ Lote "${lotNameToDelete}" y todos sus datos asociados han sido eliminados.`;
            break;

          case 'CREATE_STAFF':
            const newStaff = await addStaff(action.payload);
            systemMessageContent = `✅ Colaborador "${newStaff.name}" registrado con una tarifa de $${newStaff.baseDailyRate.toLocaleString()}.`;
            break;

          case 'UPDATE_STAFF':
            const { id: staffIdToUpdate, updates: staffUpdates } = action.payload;
            await updateStaff(staffIdToUpdate, staffUpdates);
            const updatedStaffFields = Object.keys(staffUpdates).join(', ');
            const updatedStaffName = staff?.find(s => s.id === staffIdToUpdate)?.name || staffIdToUpdate;
            systemMessageContent = `✅ Colaborador "${updatedStaffName}" actualizado. Campos modificados: ${updatedStaffFields}.`;
            break;
            
          case 'CREATE_TASK':
            {
              const { payload } = action;
              const responsible = staff?.find(s => s.id === payload.responsibleId);
              if (!responsible) throw new Error(`Responsable con ID '${payload.responsibleId}' no encontrado.`);

              let plannedSupplyCost = 0;
              if (payload.plannedSupplies) {
                for (const planned of payload.plannedSupplies) {
                    const supplyInfo = supplies?.find(s => s.id === planned.supplyId);
                    if (supplyInfo) {
                        plannedSupplyCost += (supplyInfo.costPerUnit || 0) * planned.quantity;
                    }
                }
              }

              const taskData = {
                ...payload,
                plannedCost: (payload.plannedJournals * responsible.baseDailyRate) + plannedSupplyCost,
                supplyCost: 0,
                actualCost: 0,
                progress: 0,
                status: 'Por realizar' as const,
              };
              await addTask(taskData);
              
              const lotName = lots?.find(l => l.id === payload.lotId)?.name || 'Desconocido';
              const formattedDate = format(new Date(payload.startDate.replace(/-/g, '/')), 'PPP', {locale: es});
              let supplyMessage = '';
              if (payload.plannedSupplies && payload.plannedSupplies.length > 0) {
                  supplyMessage = ` con ${payload.plannedSupplies.length} insumo(s) planificado(s).`
              }
              systemMessageContent = `✅ Labor "${payload.type}" creada para el lote '${lotName}' el ${formattedDate}${supplyMessage}`;
            }
            break;
          
          case 'CREATE_SUPPLY':
            const newSupply = await addSupply(action.payload);
            systemMessageContent = `✅ Insumo "${newSupply.name}" creado con un stock de ${newSupply.currentStock} ${newSupply.unitOfMeasure}.`;
            break;

          case 'CREATE_TRANSACTION':
            {
              const { payload: transPayload } = action;
              const newTransaction = await addTransaction({
                  ...transPayload,
                  date: format(new Date(transPayload.date.replace(/-/g, '/')), 'yyyy-MM-dd')
              });
              const lotName = newTransaction.lotId ? lots?.find(l => l.id === newTransaction.lotId)?.name : 'General';
              systemMessageContent = `✅ ${newTransaction.type} de $${newTransaction.amount.toLocaleString()} registrado: "${newTransaction.description}" (Lote: ${lotName}).`;
            }
            break;

          case 'INCOMPREHENSIBLE':
            logMessage('error', action.payload.reason || "No pude entender tu instrucción.");
            break;
        }

        if (systemMessageContent) {
            logMessage('action', systemMessageContent);
        }
      }

    } catch (error: any) {
      console.error('Error dispatching action:', error);
      const errorMessage = error.message || 'No se pudo procesar tu solicitud.';
      logMessage('error', errorMessage);
      toast({
        variant: 'destructive',
        title: 'Error de la Consola de IA',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isPageLoading) {
      return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Consola de IA" />
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle>Consola de IA</CardTitle>
          <CardDescription>
            Usa lenguaje natural para crear, modificar o eliminar registros. Describe una o varias acciones y la IA las ejecutará por ti.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
             <form onSubmit={handleSubmit} className="w-full flex flex-col gap-2">
                <Textarea
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    placeholder="Ej: 'Programa una guadañada en El Filo para mañana con Ana y corrige el área del lote El Mirador a 12 hectáreas.'"
                    disabled={isLoading || isPageLoading}
                    className="flex-1 text-base"
                    rows={4}
                />
                <Button type="submit" disabled={isLoading || isPageLoading || !command.trim()} className="self-end">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    <span className="ml-2">Enviar Comando</span>
                </Button>
            </form>
            <ScrollArea className="flex-1 border rounded-md p-4" ref={scrollAreaRef}>
                <div className="space-y-4">
                    {executionLog.length === 0 && (
                         <div className="flex flex-col items-center justify-center text-center h-full p-8 text-muted-foreground">
                            <Bot className="h-12 w-12 mb-4" />
                            <p className="font-medium">Esperando tus instrucciones</p>
                            <p className="text-sm">El resultado de tus comandos aparecerá aquí.</p>
                        </div>
                    )}
                    {executionLog.map((log) => (
                        <div key={log.id} className="text-sm">
                        {log.type === 'summary' && (
                            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                                <Bot className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                <p className="italic text-muted-foreground">{log.message}</p>
                            </div>
                        )}
                        {log.type === 'action' && (
                            <p className="font-mono text-green-600 dark:text-green-400">
                                <span className="font-bold mr-2">[ÉXITO]</span> {log.message}
                            </p>
                        )}
                        {log.type === 'error' && (
                            <p className="font-mono text-destructive">
                                 <span className="font-bold mr-2">[ERROR]</span> {log.message}
                            </p>
                        )}
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

    
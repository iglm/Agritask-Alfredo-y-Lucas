"use client";

import { useState, useRef, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Bot, Loader2, Send, User } from 'lucide-react';
import { dispatchAction, DispatcherOutput } from '@/ai/flows/assistant-flow';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { Lot, Staff, Task, ProductiveUnit, Supply, Transaction, employmentTypes } from '@/lib/types';
import { collection, query, where, doc, setDoc } from 'firebase/firestore';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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

  const isPageLoading = unitsLoading || lotsLoading || staffLoading || suppliesLoading;

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  // Action Handlers
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
  
  const addStaff = async (data: Omit<Staff, 'id' | 'userId'>) => {
    if (!user || !firestore) throw new Error("Not authenticated");
    const newDocRef = doc(collection(firestore, 'staff'));
    const newStaff: Staff = { ...data, id: newDocRef.id, userId: user.uid };
    await setDoc(newDocRef, newStaff);
    return newStaff;
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
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const context = JSON.stringify({
        productiveUnits: (units || []).map(u => ({ id: u.id, name: u.farmName })),
        lots: (lots || []).map(l => ({ id: l.id, name: l.name })),
        staff: (staff || []).map(s => ({ id: s.id, name: s.name })),
        supplies: (supplies || []).map(s => ({id: s.id, name: s.name})),
      });
      
      const result: DispatcherOutput = await dispatchAction({ command: input, context });
      
      if (result.summary) {
        const assistantSummaryMessage: ChatMessage = { id: Date.now().toString() + '-summary', role: 'assistant', content: result.summary };
        setMessages(prev => [...prev, assistantSummaryMessage]);
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
            
          case 'CREATE_STAFF':
            const newStaff = await addStaff(action.payload);
            systemMessageContent = `✅ Colaborador "${newStaff.name}" registrado con una tarifa de $${newStaff.baseDailyRate.toLocaleString()}.`;
            break;
            
          case 'CREATE_TASK':
            {
              const { payload } = action;
              const responsible = staff?.find(s => s.id === payload.responsibleId);
              if (!responsible) throw new Error(`Responsable con ID '${payload.responsibleId}' no encontrado.`);

              const taskData = {
                ...payload,
                plannedCost: payload.plannedJournals * responsible.baseDailyRate,
                supplyCost: 0,
                actualCost: 0,
                progress: 0,
                status: 'Por realizar' as const,
              };
              await addTask(taskData);
              
              const lotName = lots?.find(l => l.id === payload.lotId)?.name || 'Desconocido';
              const formattedDate = format(new Date(payload.startDate.replace(/-/g, '/')), 'PPP', {locale: es});
              systemMessageContent = `✅ Labor "${payload.type}" creada para el lote '${lotName}' el ${formattedDate}.`;
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
            const assistantMessage: ChatMessage = { id: Date.now().toString() + '-incomprehensible', role: 'assistant', content: action.payload.reason || "No pude entender tu instrucción." };
            setMessages(prev => [...prev, assistantMessage]);
            break;
        }

        if (systemMessageContent) {
            const systemMessage: ChatMessage = { id: Date.now().toString() + action.action, role: 'system', content: systemMessageContent };
            setMessages(prev => [...prev, systemMessage]);
        }
      }

    } catch (error: any) {
      console.error('Error dispatching action:', error);
      toast({
        variant: 'destructive',
        title: 'Error del Asistente',
        description: error.message || 'No se pudo procesar tu solicitud.',
      });
       const errorMessage: ChatMessage = { id: Date.now().toString() + '-error', role: 'assistant', content: "Ocurrió un error al procesar tu solicitud. Por favor, inténtalo de nuevo." };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isPageLoading) {
      return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Asistente de Comandos" />
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle>Asistente de Comandos</CardTitle>
          <CardDescription>
            Usa lenguaje natural para registrar datos rápidamente. Crea fincas, lotes, personal, labores y más.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full p-6" ref={scrollAreaRef}>
            <div className="space-y-6">
                <div className="flex items-start gap-3">
                    <Avatar className="h-9 w-9 border-2 border-primary">
                        <AvatarFallback className="bg-primary text-primary-foreground"><Bot className="h-5 w-5" /></AvatarFallback>
                    </Avatar>
                    <div className="rounded-lg bg-muted p-3">
                        <p className="text-sm">¡Hola! Soy tu Asistente de Comandos. Dime qué necesitas registrar y lo haré por ti.</p>
                    </div>
                </div>
              {messages.map((message) => (
                <div key={message.id} className={cn("flex items-start gap-3", message.role === 'user' && "justify-end")}>
                  {message.role === 'user' && (
                     <div className="rounded-lg bg-primary text-primary-foreground p-3 max-w-sm">
                        <p className="text-sm">{message.content}</p>
                    </div>
                  )}
                   <Avatar className={cn("h-9 w-9", message.role === 'user' ? 'bg-secondary' : 'border-2 border-primary')}>
                        <AvatarFallback className={cn(message.role === 'user' ? 'bg-secondary' : 'bg-primary text-primary-foreground')}>
                            {message.role === 'user' ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                        </AvatarFallback>
                    </Avatar>

                   {message.role === 'assistant' && (
                     <div className="rounded-lg bg-muted p-3 max-w-sm">
                        <p className="text-sm">{message.content}</p>
                    </div>
                  )}
                  {message.role === 'system' && (
                    <div className="w-full text-center text-xs text-green-600 font-semibold">
                      <p>{message.content}</p>
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start gap-3">
                    <Avatar className="h-9 w-9 border-2 border-primary">
                        <AvatarFallback className="bg-primary text-primary-foreground"><Bot className="h-5 w-5" /></AvatarFallback>
                    </Avatar>
                    <div className="rounded-lg bg-muted p-3">
                        <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="pt-6">
          <form onSubmit={handleSubmit} className="w-full flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu comando aquí..."
              disabled={isLoading || isPageLoading}
            />
            <Button type="submit" disabled={isLoading || isPageLoading || !input.trim()}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}

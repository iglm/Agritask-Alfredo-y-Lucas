"use client";

import { useState, useRef, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, Loader2, Send, User as UserIcon } from 'lucide-react';
import { useAppData } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { runAssistant, AssistantOutput } from '@/ai/flows/assistant-flow';
import { cn } from '@/lib/utils';
import { format, startOfToday } from 'date-fns';

type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  isPending?: boolean;
};

export default function AssistantPage() {
  const { toast } = useToast();
  const {
    lots,
    staff,
    productiveUnits,
    tasks,
    supplies,
    addProductiveUnit,
    addLot,
    addTask,
    addStaff,
    updateTask,
    updateStaff,
    deleteTask,
    deleteStaff,
    isLoading: isDataLoading,
  } = useAppData();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'initial',
      role: 'assistant',
      content: 'Hola, ¿en qué puedo ayudarte? Puedes darme órdenes como "Crea una finca llamada La Esperanza", "Marca la labor de fumigación como Finalizada" o "Crea un lote para aguacate, luego programa una labor de siembra para el 1 de agosto y planifica el uso de 100kg de abono".',
    },
  ]);
  const [input, setInput] = useState('');
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to the bottom when messages change
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isAssistantLoading || isDataLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages(prev => [...prev, userMessage, { id: 'pending', role: 'assistant', content: '', isPending: true }]);
    setInput('');

    setIsAssistantLoading(true);

    try {
      // Optimize context data to send only essential information
      const slimContext = {
        lots: lots?.map(l => ({ id: l.id, name: l.name, productiveUnitId: l.productiveUnitId })),
        staff: staff?.map(s => ({ id: s.id, name: s.name, baseDailyRate: s.baseDailyRate })),
        productiveUnits: productiveUnits?.map(u => ({ id: u.id, name: u.farmName })),
        tasks: tasks?.map(t => ({ id: t.id, type: t.type, status: t.status, lotId: t.lotId })),
        supplies: supplies?.map(s => ({ id: s.id, name: s.name, unitOfMeasure: s.unitOfMeasure })),
      };
      
      const contextData = JSON.stringify(slimContext);
      
      const result: AssistantOutput = await runAssistant({
        command: input,
        contextData: contextData,
        currentDate: format(startOfToday(), 'yyyy-MM-dd'),
      });

      // Handle response message immediately
      let responseMessage: Message = {
        id: Date.now().toString() + '-res',
        role: 'assistant',
        content: result.explanation, // Use the summary explanation
      };

      const singleAction = result.actions[0];
      if (result.actions.length === 1 && (singleAction.action === 'error' || singleAction.action === 'answer')) {
        if(singleAction.action === 'error') {
            responseMessage.content = singleAction.payload.message;
        }
        if(singleAction.action === 'answer') {
            responseMessage.content = singleAction.payload.text;
        }
      } else {
        // Execute the action sequence
        const newIdMap: { [key: string]: string } = {};

        // Helper function to recursively replace placeholders in an object
        const replacePlaceholders = (obj: any): any => {
          if (typeof obj !== 'object' || obj === null) return obj;

          for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
              if (typeof obj[key] === 'string' && obj[key].startsWith('__ID_')) {
                const placeholderId = obj[key];
                if (newIdMap[placeholderId]) {
                  obj[key] = newIdMap[placeholderId];
                } else {
                  console.warn(`Unresolved placeholder ID: ${placeholderId}`);
                }
              } else if (typeof obj[key] === 'object') {
                replacePlaceholders(obj[key]); // Recurse for nested objects
              }
            }
          }
          return obj;
        };

        let actionIndex = 0;
        for (const actionItem of result.actions) {
          const payloadWithIds = replacePlaceholders(JSON.parse(JSON.stringify(actionItem.payload)));
          let newEntity: any = null;

          switch (actionItem.action) {
            case 'addProductiveUnit':
              newEntity = await addProductiveUnit(payloadWithIds as any);
              break;
            case 'addLot':
              newEntity = await addLot(payloadWithIds as any);
              break;
            case 'addTask':
              newEntity = await addTask(payloadWithIds as any);
              break;
            case 'addStaff':
              newEntity = await addStaff(payloadWithIds as any);
              break;
            case 'updateTaskStatus': {
                const { taskId, status, progress } = payloadWithIds;
                const taskToUpdate = tasks?.find(t => t.id === taskId);
                if (taskToUpdate) {
                    await updateTask({ ...taskToUpdate, status, progress: progress ?? taskToUpdate.progress });
                } else {
                    console.error("Task to update not found:", taskId);
                    toast({ variant: 'destructive', title: 'Error', description: `La labor con ID ${taskId} no fue encontrada.`});
                }
                break;
            }
            case 'updateStaffRate': {
                const { staffId, newRate } = payloadWithIds;
                const staffToUpdate = staff?.find(s => s.id === staffId);
                if (staffToUpdate) {
                    await updateStaff({ ...staffToUpdate, baseDailyRate: newRate });
                } else {
                     console.error("Staff to update not found:", staffId);
                     toast({ variant: 'destructive', title: 'Error', description: `El colaborador con ID ${staffId} no fue encontrado.`});
                }
                break;
            }
            case 'deleteTask': {
                const { taskId } = payloadWithIds;
                await deleteTask(taskId);
                break;
            }
            case 'deleteStaff': {
                const { staffId } = payloadWithIds;
                await deleteStaff(staffId);
                break;
            }
          }

          if (newEntity && newEntity.id) {
            newIdMap[`__ID_${actionIndex}__`] = newEntity.id;
          }
          actionIndex++;
        }
      }
      
      setMessages(prev => prev.filter(m => m.id !== 'pending').concat(responseMessage));

    } catch (error: any) {
      console.error("Error running assistant:", error);
      const errorDescription = error.message || 'No se pudo obtener una respuesta del asistente.';
      const errorMessage: Message = {
        id: Date.now().toString() + '-err',
        role: 'system',
        content: `Hubo un error al procesar tu solicitud. ${errorDescription}`,
      };
      setMessages(prev => prev.filter(m => m.id !== 'pending').concat(errorMessage));
      toast({
        variant: 'destructive',
        title: 'Error del Asistente de IA',
        description: errorDescription,
      });
    } finally {
      setIsAssistantLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Asistente de Comandos IA" />
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        <ScrollArea className="flex-1 p-4 border rounded-lg bg-card" ref={scrollAreaRef}>
          <div className="space-y-6">
            {messages.map(m => (
              <div key={m.id} className={cn('flex items-start gap-4', m.role === 'user' && 'justify-end')}>
                {m.role !== 'user' && (
                  <Avatar className="h-9 w-9 border-2 border-primary">
                    <AvatarFallback className="bg-transparent text-primary"><Bot /></AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    'max-w-md rounded-lg p-3 text-sm',
                    m.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : m.role === 'system'
                      ? 'bg-destructive/10 border border-destructive/20 text-destructive'
                      : 'bg-muted'
                  )}
                >
                  {m.isPending ? (
                     <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Pensando...</span>
                    </div>
                  ) : (
                    m.content
                  )}
                </div>
                 {m.role === 'user' && (
                  <Avatar className="h-9 w-9">
                    <AvatarFallback><UserIcon /></AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ej: ¿Cuál es la tarifa de Juan Pérez?"
            disabled={isAssistantLoading || isDataLoading}
          />
          <Button type="submit" disabled={isAssistantLoading || isDataLoading || !input.trim()}>
            <Send className="mr-2 h-4 w-4" /> Enviar
          </Button>
        </form>
      </div>
    </div>
  );
}

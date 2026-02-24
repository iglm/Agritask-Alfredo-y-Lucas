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
import { format } from 'date-fns';

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
    addProductiveUnit,
    addLot,
    addTask,
    addStaff,
    updateTask,
    updateStaff,
    isLoading: isDataLoading,
  } = useAppData();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'initial',
      role: 'assistant',
      content: 'Hola, ¿en qué puedo ayudarte? Puedes darme órdenes como "Crea una finca llamada La Esperanza", "Marca la labor de fumigación como Finalizada" o preguntarme "¿Cuántos lotes tengo?".',
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
      };
      
      const contextData = JSON.stringify(slimContext);
      
      const result: AssistantOutput = await runAssistant({
        command: input,
        contextData: contextData,
        currentDate: format(new Date(), 'yyyy-MM-dd'),
      });

      let responseMessage: Message = {
        id: Date.now().toString() + '-res',
        role: 'assistant',
        content: result.explanation,
      };

      if (result.action.action === 'error') {
        responseMessage.content = result.action.payload.message;
      } else if (result.action.action === 'answer') {
        responseMessage.content = result.action.payload.text;
      } else {
        // Execute the action
        switch (result.action.action) {
          case 'addProductiveUnit':
            const { id: unitId, userId: unitUserId, ...unitPayload } = result.action.payload as any;
            await addProductiveUnit(unitPayload as any);
            break;
          case 'addLot':
            const { id, userId, ...lotPayload } = result.action.payload as any;
            await addLot(lotPayload as any);
            break;
          case 'addTask':
            const { id: taskId, userId: taskUserId, ...taskPayload } = result.action.payload as any;
            await addTask(taskPayload as any);
            break;
          case 'addStaff':
            const { id: staffId, userId: staffUserId, ...staffPayload } = result.action.payload as any;
             await addStaff(staffPayload as any);
            break;
          case 'updateTaskStatus': {
            const { taskId, status, progress } = result.action.payload;
            const taskToUpdate = tasks?.find(t => t.id === taskId);
            if (taskToUpdate) {
                await updateTask({ ...taskToUpdate, status, progress: progress ?? taskToUpdate.progress });
            } else {
                responseMessage.content = "Error: No pude encontrar la labor para actualizar.";
            }
            break;
          }
          case 'updateStaffRate': {
            const { staffId: sId, newRate } = result.action.payload;
            const staffToUpdate = staff?.find(s => s.id === sId);
            if (staffToUpdate) {
                await updateStaff({ ...staffToUpdate, baseDailyRate: newRate });
            } else {
                responseMessage.content = "Error: No pude encontrar al trabajador para actualizar.";
            }
            break;
          }
          case 'answer':
            // The content is already set in the 'answer' block above
            break;
          default:
            responseMessage.content = "No entendí esa acción, pero la he registrado.";
            console.warn("Unknown action from AI:", result.action);
        }
      }
      
      setMessages(prev => prev.filter(m => m.id !== 'pending').concat(responseMessage));

    } catch (error: any) {
      console.error("Error running assistant:", error);
      const errorMessage: Message = {
        id: Date.now().toString() + '-err',
        role: 'system',
        content: 'Hubo un error al procesar tu solicitud. Revisa la consola para más detalles.',
      };
      setMessages(prev => prev.filter(m => m.id !== 'pending').concat(errorMessage));
      toast({
        variant: 'destructive',
        title: 'Error del Asistente de IA',
        description: error.message || 'No se pudo obtener una respuesta del asistente.',
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

"use client";

import { useState, useRef, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Bot, Loader2, Send, User } from 'lucide-react';
import { useAppData } from '@/firebase';
import { dispatchAction, DispatcherOutput } from '@/ai/flows/assistant-flow';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { lots, staff, addTask } = useAppData();
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const context = JSON.stringify({
        lots: lots.map(l => ({ id: l.id, name: l.name })),
        staff: staff.map(s => ({ id: s.id, name: s.name })),
      });
      
      const result: DispatcherOutput = await dispatchAction({ command: input, context });
      
      if (result.action === 'CREATE_TASK') {
        const { payload } = result;
        const responsible = staff.find(s => s.id === payload.responsibleId);
        
        if (!responsible) throw new Error('Responsable no encontrado en el contexto.');

        const taskData = {
          ...payload,
          plannedCost: payload.plannedJournals * responsible.baseDailyRate,
          supplyCost: 0,
          actualCost: 0,
          progress: 0,
          status: 'Por realizar' as const,
        };

        await addTask(taskData);
        
        const lotName = lots.find(l => l.id === payload.lotId)?.name || 'Desconocido';
        const formattedDate = format(new Date(payload.startDate.replace(/-/g, '/')), 'PPP', {locale: es});
        
        const systemMessage: ChatMessage = {
          id: Date.now().toString() + '-system',
          role: 'system',
          content: `✅ Labor "${payload.type}" creada para el lote '${lotName}' el ${formattedDate}.`,
        };
        setMessages(prev => [...prev, systemMessage]);

      } else if (result.action === 'INCOMPREHENSIBLE') {
        const assistantMessage: ChatMessage = {
          id: Date.now().toString() + '-assistant',
          role: 'assistant',
          content: result.payload.reason || "No pude entender tu instrucción. Por favor, sé más específico. Asegúrate de incluir el nombre de la labor, el lote, el responsable y la fecha.",
        };
        setMessages(prev => [...prev, assistantMessage]);
      }

    } catch (error: any) {
      console.error('Error dispatching action:', error);
      toast({
        variant: 'destructive',
        title: 'Error del Asistente',
        description: error.message || 'No se pudo procesar tu solicitud.',
      });
       const errorMessage: ChatMessage = {
          id: Date.now().toString() + '-assistant',
          role: 'assistant',
          content: "Ocurrió un error al procesar tu solicitud. Por favor, inténtalo de nuevo.",
        };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Asistente de Comandos" />
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <p className="text-muted-foreground">
            Escribe comandos en lenguaje natural para realizar acciones. Empieza con la creación de labores, ej: <br />
            <span className="italic">"Programar fertilización en El Manantial para mañana con Carlos Pérez, 2 jornales"</span>
          </p>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full p-6" ref={scrollAreaRef}>
            <div className="space-y-6">
                <div className="flex items-start gap-3">
                    <Avatar className="h-9 w-9 border-2 border-primary">
                        <AvatarFallback className="bg-primary text-primary-foreground"><Bot className="h-5 w-5" /></AvatarFallback>
                    </Avatar>
                    <div className="rounded-lg bg-muted p-3">
                        <p className="text-sm">¡Hola! Soy tu asistente. ¿En qué puedo ayudarte hoy?</p>
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
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}

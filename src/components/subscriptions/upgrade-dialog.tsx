'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Star } from 'lucide-react';

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName: string;
  limit: number;
}

export function UpgradeDialog({ open, onOpenChange, featureName, limit }: UpgradeDialogProps) {
  const { toast } = useToast();

  const handleUpgrade = () => {
    toast({
      title: 'Función futura',
      description: 'La compra de suscripciones estará disponible pronto. ¡Gracias por tu interés!',
    });
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
            <Star className="h-6 w-6 text-primary" />
          </div>
          <AlertDialogTitle className="text-center">Límite del Plan Gratuito Alcanzado</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Has alcanzado el límite de {limit} {featureName} para el plan gratuito. Para añadir más, por favor,
            actualiza a nuestro plan Premium y desbloquea todas las funcionalidades sin límites.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center">
          <AlertDialogCancel>Quizás más tarde</AlertDialogCancel>
          <Button onClick={handleUpgrade}>
            <Star className="mr-2 h-4 w-4" /> Mejorar a Premium
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

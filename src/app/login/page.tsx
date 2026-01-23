"use client";

import { AuthForm } from "@/components/auth/auth-form";
import { Tractor, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function LoginPage() {
  const router = useRouter();

  const handleSkipLogin = () => {
    router.push("/");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center justify-center mb-6">
            <div className="p-2.5 rounded-lg bg-primary mb-4">
                <Tractor className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-primary">AgriTask</h1>
            <p className="text-muted-foreground mt-1">Tu asistente agrícola inteligente</p>
        </div>
        <AuthForm />

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-muted/40 px-2 text-muted-foreground">
              O
            </span>
          </div>
        </div>
        
        <div className="text-center">
          <Button variant="outline" className="w-full" onClick={handleSkipLogin}>
            Continuar en modo local
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="link" size="sm" className="text-muted-foreground mt-2 font-normal">
                <Info className="mr-2 h-4 w-4" />
                ¿Qué es el modo local?
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Modo Local (Sin Conexión)</AlertDialogTitle>
                <AlertDialogDescription>
                  <div className="space-y-4 text-left mt-4 text-card-foreground">
                    <p>
                      Si omites el inicio de sesión, trabajarás en <strong>Modo Local</strong>.
                    </p>
                    <p>
                      Tus datos (lotes, personal, labores) se guardarán de forma segura en este dispositivo y podrás usar la app sin internet.
                    </p>
                    <p>
                      Cuando decidas crear una cuenta o iniciar sesión, toda tu información local se subirá automáticamente a la nube, quedando asociada a tu cuenta para que puedas acceder a ella desde cualquier lugar.
                    </p>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogAction>¡Entendido!</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

      </div>
    </div>
  );
}

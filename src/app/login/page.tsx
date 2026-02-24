"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useAuth } from "@/firebase";
import { FirebaseError } from "firebase/app";
import { Loader2, Tractor } from "lucide-react";
import { createUserProfile } from "@/lib/user";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
  const loginImage = PlaceHolderImages.find(img => img.id === 'farm-landscape') || 
                     (PlaceHolderImages.length > 0 ? PlaceHolderImages[0] : null);

  const handleAuthError = (error: FirebaseError) => {
    let title = "Error de autenticación";
    let description = "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.";

    if (error.code === "auth/popup-closed-by-user") {
        title = "Inicio de sesión cancelado";
        description = "Has cancelado el proceso de inicio de sesión.";
    } else if (error.code === 'auth/unauthorized-domain') {
        title = "Dominio no autorizado";
        description = "Asegúrate de añadir 'localhost' a los dominios autorizados en la configuración de Firebase Authentication.";
    } else {
        console.error(error);
    }

    toast({ variant: "destructive", title, description });
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        await createUserProfile(result.user, { merge: true });
        toast({
            title: "¡Sesión iniciada con Google!",
            description: "Has iniciado sesión correctamente.",
        });
        // The AuthProvider will handle redirect
    } catch (error) {
        if (error instanceof FirebaseError) {
            handleAuthError(error);
        }
    } finally {
        setIsGoogleLoading(false);
    }
  };


  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
       <div className="hidden lg:block relative">
          <Image
              src={loginImage?.imageUrl || 'https://placehold.co/1200/600/388E3C/FFFFFF/png?text=Optimizador+de+Labores'}
              alt={loginImage?.description || 'Optimizador de Labores Agrícolas'}
              fill
              className="object-cover dark:brightness-[0.4]"
              priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
      </div>
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center justify-center mb-6 text-center">
              <div className="p-2.5 rounded-lg bg-primary mb-4">
                  <Tractor className="h-8 w-8 text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-bold text-primary">Optimizador de Labores</h1>
              <p className="text-balance text-muted-foreground mt-2">
                Tu asistente inteligente para la gestión agrícola
              </p>
          </div>
          
          <Card className="text-center border-0 shadow-none bg-transparent">
              <CardHeader>
                  <CardTitle>Bienvenido</CardTitle>
                  <CardDescription>Inicia sesión para acceder a la plataforma.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                  <div className="items-top flex space-x-2">
                      <Checkbox id="terms" checked={acceptedTerms} onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)} />
                      <div className="grid gap-1.5 leading-none">
                          <Label htmlFor="terms" className="text-sm font-normal text-muted-foreground">
                              Acepto la <Link href="/legal" className="underline hover:text-primary" target="_blank">política de privacidad y tratamiento de datos</Link>.
                          </Label>
                      </div>
                  </div>
                  <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isGoogleLoading || !acceptedTerms}>
                      {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <svg role="img" viewBox="0 0 24 24" className="mr-2 h-4 w-4"><path fill="currentColor" d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.6 1.62-4.88 1.62-4.48 0-8.12-3.64-8.12-8.12s3.64-8.12 8.12-8.12c2.48 0 4.3.92 5.24 1.88l2.52-2.52C18.44 2.12 15.48 1 12.48 1 5.8 1 1 5.8 1 12.48s4.8 11.48 11.48 11.48c6.68 0 11.48-4.8 11.48-11.48 0-.72-.08-1.44-.2-2.12H12.48z"></path></svg>}
                      Iniciar sesión con Google
                  </Button>
              </CardContent>
              <CardFooter className="flex-col gap-4 text-center">
                <div className="text-xs text-muted-foreground mt-4">
                    <p>
                        Una aplicación desarrollada por <span className="font-semibold">Lucas Mateo Tabares</span> y <span className="font-semibold">Alfredo García Llano</span>.
                    </p>
                    <p>Ofrecemos asesoría especializada para optimizar tu gestión agrícola.</p>
                    <p className="mt-2">&copy; {new Date().getFullYear()} Todos los derechos reservados.</p>
                </div>
              </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

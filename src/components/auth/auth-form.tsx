"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { useAuth } from "@/firebase";
import { FirebaseError } from "firebase/app";
import { Loader2 } from "lucide-react";
import { createUserProfile } from "@/lib/user";

const signupSchema = z.object({
  email: z.string().email({ message: "Por favor, introduce un correo electrónico válido." }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
});

const loginSchema = z.object({
  email: z.string().email({ message: "Por favor, introduce un correo electrónico válido." }),
  password: z.string().min(1, { message: "La contraseña es obligatoria." }),
});

type SignupFormValues = z.infer<typeof signupSchema>;
type LoginFormValues = z.infer<typeof loginSchema>;

export function AuthForm() {
  const { toast } = useToast();
  const auth = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const handleAuthError = (error: FirebaseError) => {
    let title = "Error de autenticación";
    let description = "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.";

    switch (error.code) {
      case "auth/email-already-in-use":
        title = "Correo ya en uso";
        description = "Este correo electrónico ya está registrado. Intenta iniciar sesión.";
        break;
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        title = "Credenciales incorrectas";
        description = "El correo electrónico o la contraseña no son válidos. Por favor, verifica tus datos.";
        break;
      case "auth/weak-password":
        title = "Contraseña débil";
        description = "La contraseña es demasiado débil. Debe tener al menos 6 caracteres.";
        break;
      default:
        console.error(error);
        break;
    }

    toast({ variant: "destructive", title, description });
  };

  const onSignup = async (data: SignupFormValues) => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      await createUserProfile(userCredential.user);
      toast({
        title: "¡Cuenta creada!",
        description: "Tu cuenta ha sido creada con éxito. Serás redirigido.",
      });
      // AuthProvider will handle redirect
    } catch (error) {
      if (error instanceof FirebaseError) {
        handleAuthError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onLogin = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast({
        title: "¡Sesión iniciada!",
        description: "Has iniciado sesión correctamente.",
      });
      // AuthProvider will handle redirect
    } catch (error) {
      if (error instanceof FirebaseError) {
        handleAuthError(error);
      }
    } finally {
      setIsLoading(false);
    }
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
    } catch (error) {
        if (error instanceof FirebaseError) {
            handleAuthError(error);
        }
    } finally {
        setIsGoogleLoading(false);
    }
  };

  return (
    <Tabs defaultValue="login" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
        <TabsTrigger value="signup">Registrarse</TabsTrigger>
      </TabsList>
      <TabsContent value="login">
        <Card>
          <CardHeader>
            <CardTitle>Iniciar Sesión</CardTitle>
            <CardDescription>Accede a tu cuenta para gestionar tu finca.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="login-email">Correo Electrónico</Label>
                    <Input id="login-email" type="email" placeholder="tu@email.com" {...loginForm.register("email")} />
                    {loginForm.formState.errors.email && <p className="text-xs text-destructive">{loginForm.formState.errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="login-password">Contraseña</Label>
                    <Input id="login-password" type="password" {...loginForm.register("password")} />
                    {loginForm.formState.errors.password && <p className="text-xs text-destructive">{loginForm.formState.errors.password.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Iniciar Sesión
                </Button>
            </form>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">O continuar con</span>
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isGoogleLoading || isLoading}>
                {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <svg role="img" viewBox="0 0 24 24" className="mr-2 h-4 w-4"><path fill="currentColor" d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.6 1.62-4.88 1.62-4.48 0-8.12-3.64-8.12-8.12s3.64-8.12 8.12-8.12c2.48 0 4.3.92 5.24 1.88l2.52-2.52C18.44 2.12 15.48 1 12.48 1 5.8 1 1 5.8 1 12.48s4.8 11.48 11.48 11.48c6.68 0 11.48-4.8 11.48-11.48 0-.72-.08-1.44-.2-2.12H12.48z"></path></svg>}
                Google
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="signup">
        <Card>
          <CardHeader>
            <CardTitle>Registrarse</CardTitle>
            <CardDescription>Crea una nueva cuenta para empezar a optimizar tu producción.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="signup-email">Correo Electrónico</Label>
                    <Input id="signup-email" type="email" placeholder="tu@email.com" {...signupForm.register("email")} />
                    {signupForm.formState.errors.email && <p className="text-xs text-destructive">{signupForm.formState.errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="signup-password">Contraseña</Label>
                    <Input id="signup-password" type="password" {...signupForm.register("password")} />
                    {signupForm.formState.errors.password && <p className="text-xs text-destructive">{signupForm.formState.errors.password.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Crear Cuenta
                </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

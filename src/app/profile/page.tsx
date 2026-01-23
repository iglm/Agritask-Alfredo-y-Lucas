'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useFirebase, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { doc, setDoc } from 'firebase/firestore';
import { Loader2, Star } from 'lucide-react';
import { useEffect } from 'react';
import { Badge } from '@/components/ui/badge';

const profileFormSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const { firestore } = useFirebase();
  const { user, profile, isUserLoading } = useUser();
  const { toast } = useToast();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: '',
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({ name: profile.name || '' });
    }
  }, [profile, form]);

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'Debes iniciar sesión.' });
      return;
    }

    const userRef = doc(firestore, 'users', user.uid);
    try {
      await setDoc(userRef, { name: data.name }, { merge: true });
      toast({ title: '¡Perfil actualizado!', description: 'Tu nombre ha sido actualizado correctamente.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar tu perfil.' });
    }
  };

  if (isUserLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Mi Perfil" />
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
              <CardDescription>Actualiza tu nombre para personalizar tu experiencia.</CardDescription>
            </CardHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                          <Input placeholder="Tu nombre" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormItem>
                    <FormLabel>Correo Electrónico</FormLabel>
                    <Input disabled value={user?.email || 'No disponible'} />
                  </FormItem>
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar Cambios
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </div>
        <div>
          <Card className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground">
            <CardHeader>
              <CardTitle>Estado de Suscripción</CardTitle>
              <CardDescription className="text-primary-foreground/80">Tu plan de AgriTask actual.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-bold">
                  {profile?.subscription === 'premium' ? 'Premium' : 'Gratuito'}
                </span>
                <Badge variant={profile?.subscription === 'premium' ? 'default' : 'secondary'}>
                  {profile?.subscription === 'premium' ? 'Activo' : 'Limitado'}
                </Badge>
              </div>
              <ul className="text-sm space-y-2 mb-6 text-primary-foreground/90">
                  <li className="flex items-start"><span className="mr-2 mt-1">✔️</span> <span>Acceso a todas las páginas</span></li>
                  <li className="flex items-start"><span className="mr-2 mt-1">✔️</span> <span>Datos guardados en la nube</span></li>
                  <li className="flex items-start"><span className="mr-2 mt-1">✔️</span> <span>{profile?.subscription === 'premium' ? 'Lotes, personal y labores ilimitados' : '1 lote, 3 de personal, 20 labores'}</span></li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                variant="secondary" 
                className="w-full"
                onClick={() => toast({ title: 'Función futura', description: 'La compra de suscripciones estará disponible pronto.'})}
              >
                <Star className="mr-2 h-4 w-4" />
                Mejorar a Premium
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

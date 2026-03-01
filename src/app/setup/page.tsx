"use client";

// This page is deprecated and is no longer reachable from the UI.
// The functionality has been merged into the new AI Console page.

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DeprecatedSetupPage() {
  return (
    <div>
        <PageHeader title="Constructor IA (Obsoleto)" />
        <Card>
            <CardHeader>
                <CardTitle>Página Descontinuada</CardTitle>
            </CardHeader>
            <CardContent>
                <Alert>
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>¡Esta sección ha evolucionado!</AlertTitle>
                    <AlertDescription>
                        El Constructor IA y el Asistente de Comandos se han fusionado en la nueva y más potente <span className="font-bold">Consola de IA</span>.
                        Desde allí puedes crear, modificar y eliminar cualquier registro de tu operación usando lenguaje natural.
                    </AlertDescription>
                </Alert>
                <Button asChild className="mt-6">
                    <Link href="/assistant">Ir a la Consola de IA</Link>
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}

    
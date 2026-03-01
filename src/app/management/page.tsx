"use client";

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Tractor, Users, CheckSquare, SprayCan, Banknote, CalendarCheck, ArrowRight } from 'lucide-react';

const managementItems = [
  {
    href: '/lotes',
    title: 'Gestión de Lotes',
    description: 'Administra tus fincas, lotes y sub-lotes.',
    icon: <Tractor className="h-8 w-8 text-primary" />,
  },
  {
    href: '/staff',
    title: 'Gestión de Colaboradores',
    description: 'Registra y actualiza la información de tu personal.',
    icon: <Users className="h-8 w-8 text-primary" />,
  },
  {
    href: '/tasks',
    title: 'Gestión de Labores',
    description: 'Visualiza y edita todas las labores programadas.',
    icon: <CheckSquare className="h-8 w-8 text-primary" />,
  },
  {
    href: '/supplies',
    title: 'Gestión de Insumos',
    description: 'Controla tu inventario de productos y materiales.',
    icon: <SprayCan className="h-8 w-8 text-primary" />,
  },
  {
    href: '/financials',
    title: 'Gestión Financiera',
    description: 'Revisa y administra todos los ingresos y egresos.',
    icon: <Banknote className="h-8 w-8 text-primary" />,
  },
  {
    href: '/attendance',
    title: 'Control de Asistencia',
    description: 'Lleva el registro diario de la asistencia del personal.',
    icon: <CalendarCheck className="h-8 w-8 text-primary" />,
  },
];

export default function ManagementPage() {
  return (
    <div>
      <PageHeader title="Centro de Gestión" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {managementItems.map((item) => (
          <Link href={item.href} key={item.href} className="group">
            <Card className="h-full flex flex-col transition-all duration-200 group-hover:border-primary group-hover:shadow-lg">
              <CardHeader className="flex-row items-center gap-4">
                {item.icon}
                <div>
                  <CardTitle>{item.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <CardDescription>{item.description}</CardDescription>
              </CardContent>
               <CardFooter>
                 <p className="text-sm font-medium text-primary flex items-center gap-2 transition-all duration-200 group-hover:gap-3">
                    Ir a la sección <ArrowRight className="h-4 w-4" />
                </p>
               </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

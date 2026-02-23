'use client';

import { useMemo } from 'react';
import { useAppData } from '@/firebase';
import { PageHeader } from '@/components/page-header';
import { ProductiveUnitForm } from '@/components/productive-unit/productive-unit-form';
import { Loader2, Tractor, Trees } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ProductiveUnit } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { KpiCard } from '@/components/dashboard/kpi-card';

export default function ProductiveUnitPage() {
  const { productiveUnit, lots, updateProductiveUnit, isLoading } = useAppData();
  const { toast } = useToast();

  const handleFormSubmit = async (values: Partial<ProductiveUnit>) => {
    try {
      await updateProductiveUnit(values);
      toast({
        title: "¡Unidad Productiva Actualizada!",
        description: "La información de tu finca ha sido guardada.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar la información.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalLots = lots?.length || 0;
  const totalTrees = useMemo(() => {
    if (!lots) return 0;
    return lots.reduce((sum, lot) => sum + (lot.totalTrees || 0), 0);
  }, [lots]);

  return (
    <div>
      <PageHeader title="Unidad Productiva" />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Información General de la Finca</CardTitle>
              <CardDescription>
                Mantén actualizada la información general de tu unidad productiva.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProductiveUnitForm
                productiveUnit={productiveUnit}
                onSubmit={handleFormSubmit}
              />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <KpiCard
            title="Número Total de Lotes"
            value={totalLots}
            icon={<Tractor className="h-6 w-6 text-primary" />}
            href="/lots"
          />
          <KpiCard
            title="Número Total de Árboles"
            value={totalTrees.toLocaleString()}
            icon={<Trees className="h-6 w-6 text-primary" />}
          />
        </div>
      </div>
    </div>
  );
}

    
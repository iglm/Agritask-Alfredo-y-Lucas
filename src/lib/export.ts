'use client';

import { Lot, Staff, Task, ProductiveUnit, SubLot, Supply, Transaction } from './types';
import { exportToCsv } from './csv';
import { Firestore, collection, getDocs, query, where, collectionGroup } from 'firebase/firestore';
import { User } from 'firebase/auth';

type ToastFunc = (props: {
  title: React.ReactNode;
  description?: React.ReactNode;
  variant?: 'default' | 'destructive';
}) => void;


export const handleExportAll = async (
  firestore: Firestore,
  user: User,
  data: {
      lots: Lot[] | null,
      staff: Staff[] | null,
      tasks: Task[] | null,
      supplies: Supply[] | null,
      productiveUnits: ProductiveUnit[] | null,
      transactions: Transaction[] | null,
  },
  toast: ToastFunc
) => {
    const { lots, staff, tasks, supplies, productiveUnits, transactions } = data;
    
    if ([lots, staff, tasks, supplies, productiveUnits, transactions].every(d => !d || d.length === 0)) {
        toast({
            variant: "destructive",
            title: "No hay datos para exportar",
            description: "No se encontró información en ninguna de las secciones para crear un respaldo.",
        });
        return;
    }

    let exportedSomething = false;

    try {
      // 1. Productive Units
      if (productiveUnits && productiveUnits.length > 0) {
          exportToCsv(`unidades-productivas_respaldo.csv`, productiveUnits);
          exportedSomething = true;
      }

      // 2. Lots and Sublots
      if (lots && lots.length > 0) {
        const dataToExport = [];
        const allSublotsQuery = query(collectionGroup(firestore, 'sublots'), where('userId', '==', user.uid));
        const sublotsSnapshot = await getDocs(allSublotsQuery);
        const sublotsByLotId = new Map<string, SubLot[]>();
        sublotsSnapshot.forEach(doc => {
            const subLot = doc.data() as SubLot;
            const sublots = sublotsByLotId.get(subLot.lotId) || [];
            sublots.push(subLot);
            sublotsByLotId.set(subLot.lotId, sublots);
        });

        for (const lot of lots) {
            dataToExport.push({
                id: lot.id,
                nombre: lot.name,
                area_hectareas: lot.areaHectares,
                ubicacion: lot.location,
                fecha_siembra: lot.sowingDate,
                densidad_siembra: lot.sowingDensity,
                arboles_totales: lot.totalTrees,
                tipo: 'Lote Principal',
                lote_padre: ''
            });

            const lotSublots = sublotsByLotId.get(lot.id) || [];
            for (const subLot of lotSublots) {
                 dataToExport.push({
                    id: subLot.id,
                    nombre: subLot.name,
                    area_hectareas: subLot.areaHectares,
                    ubicacion: lot.location,
                    fecha_siembra: subLot.sowingDate,
                    densidad_siembra: subLot.sowingDensity,
                    arboles_totales: subLot.totalTrees,
                    tipo: 'Sub-Lote',
                    lote_padre: lot.name
                });
            }
        }
        if (dataToExport.length > 0) {
          exportToCsv(`lotes-y-sublotes_respaldo.csv`, dataToExport);
          exportedSomething = true;
        }
      }

      // 3. Staff
      if (staff && staff.length > 0) {
          exportToCsv(`personal_respaldo.csv`, staff);
          exportedSomething = true;
      }

      // 4. Supplies
      if (supplies && supplies.length > 0) {
          exportToCsv(`insumos_respaldo.csv`, supplies);
          exportedSomething = true;
      }

      // 5. Tasks
      if (tasks && tasks.length > 0) {
        const dataToExport = tasks.map(task => ({
          ...task,
          lotName: lots?.find(l => l.id === task.lotId)?.name || 'N/A',
          responsibleName: staff?.find(s => s.id === task.responsibleId)?.name || 'N/A',
        }));
        exportToCsv(`labores_respaldo.csv`, dataToExport);
        exportedSomething = true;
      }

      // 6. Transactions
      if (transactions && transactions.length > 0) {
        const dataToExport = transactions.map(transaction => ({
          ...transaction,
          lotName: transaction.lotId ? (lots?.find(l => l.id === transaction.lotId)?.name || 'N/A') : 'General',
        }));
        exportToCsv(`transacciones_respaldo.csv`, dataToExport);
        exportedSomething = true;
      }

      if (exportedSomething) {
        toast({
            title: "Respaldo completo iniciado",
            description: "Se están descargando los archivos CSV para cada sección de la aplicación.",
        });
      } else {
          toast({
              variant: "destructive",
              title: "No hay datos para exportar",
              description: "No se encontró información en ninguna de las secciones.",
          });
      }
    } catch (error) {
        console.error("Error durante la exportación completa:", error);
        toast({
            variant: "destructive",
            title: "Error al exportar",
            description: "Ocurrió un error al generar el respaldo completo.",
        });
    }
};

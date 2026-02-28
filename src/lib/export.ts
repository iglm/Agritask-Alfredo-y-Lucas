'use client';

import { Lot, Staff, Task, ProductiveUnit, SubLot, Supply, Transaction } from './types';
import { exportToCsv } from './csv';
import { Firestore, collection, getDocs, query, where } from 'firebase/firestore';
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
          const dataToExport = productiveUnits.map(unit => ({
              id_unidad: unit.id,
              nombre_finca: unit.farmName || '',
              pais: unit.country || '',
              departamento: unit.department || '',
              municipio: unit.municipality || '',
              vereda: unit.vereda || '',
              cultivos: unit.crops?.join('; ') || '',
              variedades: unit.varieties?.join('; ') || '',
              rango_altitud: unit.altitudeRange || '',
              temperatura_promedio: unit.averageTemperature || '',
              fecha_inicio_proyecto: unit.projectStartDate || '',
              area_total_finca_ha: unit.totalFarmArea || '',
              area_cultivada_ha: unit.cultivatedArea || '',
          }));
          exportToCsv(`unidades-productivas_respaldo.csv`, dataToExport);
          exportedSomething = true;
      }

      // 2. Lots and Sublots
      if (lots && lots.length > 0) {
        const lotsAndSublotsData = [];

        for (const lot of lots) {
          // Add parent lot
          lotsAndSublotsData.push({
            id_entidad: lot.id,
            nombre: lot.name || '',
            tipo_entidad: 'Lote Principal',
            lote_padre_id: '',
            lote_padre_nombre: '',
            area_hectareas: lot.areaHectares || 0,
            ubicacion: lot.location || '',
            fecha_siembra: lot.sowingDate || '',
            densidad_siembra: lot.sowingDensity || '',
            arboles_totales: lot.totalTrees || '',
            cultivo: lot.crop || 'N/A',
            variedad: lot.variety || 'N/A',
          });

          // Fetch and add sublots for this lot - this is the core fix
          const sublotsQuery = query(collection(firestore, 'lots', lot.id, 'sublots'));
          const sublotsSnapshot = await getDocs(sublotsQuery);
          
          sublotsSnapshot.forEach(doc => {
            const subLot = doc.data() as SubLot;
            lotsAndSublotsData.push({
              id_entidad: subLot.id,
              nombre: subLot.name || '',
              tipo_entidad: 'Sub-Lote',
              lote_padre_id: lot.id,
              lote_padre_nombre: lot.name || '',
              area_hectareas: subLot.areaHectares || 0,
              ubicacion: lot.location || '', // Inherit location from parent for context
              fecha_siembra: subLot.sowingDate || '',
              densidad_siembra: subLot.sowingDensity || '',
              arboles_totales: subLot.totalTrees || '',
              cultivo: lot.crop || 'N/A', // Inherit crop from parent
              variedad: lot.variety || 'N/A', // Inherit variety from parent
            });
          });
        }
        
        if (lotsAndSublotsData.length > 0) {
          exportToCsv(`lotes-y-sublotes_respaldo.csv`, lotsAndSublotsData);
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
        const dataToExport = tasks.map(task => {
            const { plannedSupplies, ...restOfTask } = task; // Exclude complex object
            return {
              ...restOfTask,
              nombre_lote: lots?.find(l => l.id === task.lotId)?.name || 'N/A',
              nombre_responsable: staff?.find(s => s.id === task.responsibleId)?.name || 'N/A',
              insumos_planificados: plannedSupplies?.map(p => `${supplies?.find(s => s.id === p.supplyId)?.name || 'ID:'+p.supplyId} (${p.quantity})`).join('; ') || ''
            };
        });
        exportToCsv(`labores_respaldo.csv`, dataToExport);
        exportedSomething = true;
      }

      // 6. Transactions
      if (transactions && transactions.length > 0) {
        const dataToExport = transactions.map(transaction => ({
          ...transaction,
          nombre_lote: transaction.lotId ? (lots?.find(l => l.id === transaction.lotId)?.name || 'N/A') : 'General',
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

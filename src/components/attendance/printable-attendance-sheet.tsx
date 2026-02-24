"use client";

import { ProductiveUnit, Staff } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Tractor } from 'lucide-react';

interface PrintableAttendanceSheetProps {
  staff: Staff[];
  date: Date;
  productiveUnit: ProductiveUnit | null | undefined;
}

export function PrintableAttendanceSheet({ staff, date, productiveUnit }: PrintableAttendanceSheetProps) {
  return (
    <div className="p-8 font-sans bg-white text-black">
      <header className="flex items-center justify-between mb-8 pb-4 border-b-2 border-black">
        <div>
          <h1 className="text-3xl font-bold">Planilla de Asistencia Diaria</h1>
          <p className="text-lg">
            Finca: <span className="font-semibold">{productiveUnit?.farmName || '____________________'}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg">
            Fecha: <span className="font-semibold capitalize">{format(date, 'EEEE, dd MMMM yyyy', { locale: es })}</span>
          </p>
        </div>
      </header>

      <main>
        <table className="w-full border-collapse border border-gray-400 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 p-2 w-1/3 text-left">Nombre del Trabajador</th>
              <th className="border border-gray-400 p-2 w-[100px]">Presente (P)</th>
              <th className="border border-gray-400 p-2 w-[100px]">Ausente (A)</th>
              <th className="border border-gray-400 p-2 text-left">Motivo / Observaciones</th>
              <th className="border border-gray-400 p-2 w-1/4 text-left">Firma</th>
            </tr>
          </thead>
          <tbody>
            {(staff.length > 0 ? staff : Array.from({ length: 10 }).map((_, i) => ({id: `placeholder-${i}`, name: ''}))).map((person) => (
              <tr key={person.id}>
                <td className="border border-gray-400 p-2 font-medium h-12">{person.name}</td>
                <td className="border border-gray-400 p-2 h-12"></td>
                <td className="border border-gray-400 p-2 h-12"></td>
                <td className="border border-gray-400 p-2 h-12"></td>
                <td className="border border-gray-400 p-2 h-12"></td>
              </tr>
            ))}
            {/* Add extra rows if staff list is short */}
            {staff.length < 10 && Array.from({ length: 10 - staff.length }).map((_, i) => (
               <tr key={`extra-${i}`}>
                <td className="border border-gray-400 p-2 h-12"></td>
                <td className="border border-gray-400 p-2 h-12"></td>
                <td className="border border-gray-400 p-2 h-12"></td>
                <td className="border border-gray-400 p-2 h-12"></td>
                <td className="border border-gray-400 p-2 h-12"></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-8">
            <h2 className="text-lg font-semibold mb-2">Observaciones Generales:</h2>
            <div className="w-full h-32 border border-dashed border-gray-400 rounded p-2"></div>
        </div>
      </main>

      <footer className="mt-12 text-center text-xs text-gray-500">
        <p className="flex items-center justify-center gap-2">
            <Tractor className="h-4 w-4" />
            <span>Generado por Optimizador de Labores Agrícolas</span>
        </p>
      </footer>
    </div>
  );
}

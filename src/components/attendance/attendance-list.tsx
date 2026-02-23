"use client";

import { useState, useEffect } from "react";
import { useCollection, useFirebase, useMemoFirebase } from "@/firebase";
import type { Staff, StaffAttendance } from "@/lib/types";
import { collection, query, where, writeBatch, doc } from "firebase/firestore";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Users } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { EmptyState } from "../ui/empty-state";

type AttendanceRecord = {
  staffId: string;
  staffName: string;
  status: 'Presente' | 'Ausente';
  reason: string;
  docId?: string; // Existing document ID in Firestore
};

type AttendanceListProps = {
  staff: Staff[];
  selectedDate: Date;
};

export function AttendanceList({ staff, selectedDate }: AttendanceListProps) {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const dateString = format(selectedDate, "yyyy-MM-dd");

  const attendanceQuery = useMemoFirebase(
    () => user && firestore ? query(
      collection(firestore, 'staffAttendance'),
      where('userId', '==', user.uid),
      where('date', '==', dateString)
    ) : null,
    [firestore, user, dateString]
  );

  const { data: existingAttendance, isLoading } = useCollection<StaffAttendance>(attendanceQuery);

  useEffect(() => {
    if (isLoading) return;

    const records = staff.map(person => {
      const existingRecord = existingAttendance?.find(a => a.staffId === person.id);
      return {
        staffId: person.id,
        staffName: person.name,
        status: existingRecord?.status || 'Presente',
        reason: existingRecord?.reason || '',
        docId: existingRecord?.id,
      };
    });
    setAttendanceRecords(records);
  }, [staff, existingAttendance, isLoading]);

  const handleStatusChange = (staffId: string, status: 'Presente' | 'Ausente') => {
    setAttendanceRecords(prev =>
      prev.map(rec =>
        rec.staffId === staffId ? { ...rec, status, reason: status === 'Presente' ? '' : rec.reason } : rec
      )
    );
  };

  const handleReasonChange = (staffId: string, reason: string) => {
    setAttendanceRecords(prev =>
      prev.map(rec => (rec.staffId === staffId ? { ...rec, reason } : rec))
    );
  };

  const handleSaveChanges = async () => {
    if (!firestore || !user) {
        toast({ variant: 'destructive', title: 'Funcionalidad no disponible sin conexión', description: 'Inicia sesión para registrar la asistencia.' });
        return;
    }
    setIsSaving(true);
    
    try {
        const batch = writeBatch(firestore);
        const attendanceCol = collection(firestore, 'staffAttendance');

        for (const record of attendanceRecords) {
             const data: Omit<StaffAttendance, 'id' | 'userId'> & { userId?: string } = {
                staffId: record.staffId,
                date: dateString,
                status: record.status,
                reason: record.reason,
            };

            if (record.docId) {
                const docRef = doc(firestore, 'staffAttendance', record.docId);
                batch.update(docRef, data);
            } else {
                const docRef = doc(attendanceCol);
                data.userId = user.uid;
                batch.set(docRef, { ...data, id: docRef.id });
            }
        }

        await batch.commit();
        toast({ title: '¡Asistencia guardada!', description: `Se guardó la asistencia para el ${format(selectedDate, "PPP", { locale: es })}.` });
    } catch (error) {
        console.error("Error saving attendance:", error);
        toast({ variant: 'destructive', title: 'Error al guardar', description: 'No se pudo guardar la asistencia.' });
    } finally {
        setIsSaving(false);
    }
  };

  const handleMarkAllPresent = () => {
    setAttendanceRecords(prev =>
      prev.map(rec => ({ ...rec, status: 'Presente', reason: '' }))
    );
  };
  
  if (staff.length === 0) {
    return (
        <EmptyState
            icon={<Users className="h-10 w-10" />}
            title="Añade personal primero"
            description="Necesitas registrar miembros del personal para poder tomar asistencia."
        />
    )
  }

  if (isLoading) {
    return <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <Card>
      <CardContent className="p-4 md:p-6 space-y-6">
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={handleMarkAllPresent}>
            Marcar Todos Como Presente
          </Button>
        </div>
        <div className="space-y-4">
            {attendanceRecords.map(record => (
            <div key={record.staffId} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border rounded-lg">
                <p className="font-medium flex-1">{record.staffName}</p>
                <RadioGroup
                    value={record.status}
                    onValueChange={(status: 'Presente' | 'Ausente') => handleStatusChange(record.staffId, status)}
                    className="flex items-center gap-6"
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Presente" id={`presente-${record.staffId}`} />
                        <Label htmlFor={`presente-${record.staffId}`}>Presente</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Ausente" id={`ausente-${record.staffId}`} />
                        <Label htmlFor={`ausente-${record.staffId}`}>Ausente</Label>
                    </div>
                </RadioGroup>
                {record.status === 'Ausente' && (
                    <Input
                        placeholder="Motivo de la ausencia..."
                        value={record.reason}
                        onChange={e => handleReasonChange(record.staffId, e.target.value)}
                        className="sm:w-64"
                    />
                )}
            </div>
            ))}
        </div>

        <Button onClick={handleSaveChanges} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar Cambios
        </Button>
      </CardContent>
    </Card>
  );
}

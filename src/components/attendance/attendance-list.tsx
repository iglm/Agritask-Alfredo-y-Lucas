"use client";

import { useState, useEffect } from "react";
import { useCollection, useFirebase, useMemoFirebase } from "@/firebase";
import type { Staff, StaffAttendance } from "@/lib/types";
import { collection, query, where } from "firebase/firestore";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Users } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { EmptyState } from "../ui/empty-state";

type AttendanceRecord = {
  staffId: string;
  staffName: string;
  status: 'Presente' | 'Ausente';
  reason: string;
  id: string; // Existing document ID in Firestore or temporary ID
};

type AttendanceListProps = {
  staff: Staff[];
  selectedDate: Date;
  onSave: (records: StaffAttendance[]) => Promise<void>;
};

export function AttendanceList({ staff, selectedDate, onSave }: AttendanceListProps) {
  const { user, firestore } = useFirebase();
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

    const records = staff.map((person, index) => {
      const existingRecord = existingAttendance?.find(a => a.staffId === person.id);
      return {
        staffId: person.id,
        staffName: person.name,
        status: existingRecord?.status || 'Presente',
        reason: existingRecord?.reason || '',
        id: existingRecord?.id || `temp-${index}`, // Use real ID or a temp one
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
    setIsSaving(true);
    // Transform AttendanceRecord[] to StaffAttendance[] for saving
    const recordsToSave = attendanceRecords.map(rec => ({
      id: rec.id,
      staffId: rec.staffId,
      date: dateString,
      status: rec.status,
      reason: rec.reason,
    }));
    await onSave(recordsToSave);
    setIsSaving(false);
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
            title="Añade colaboradores primero"
            description="Necesitas registrar colaboradores para poder tomar asistencia."
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

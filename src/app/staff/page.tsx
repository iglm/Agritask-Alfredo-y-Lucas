"use client";

import { useState } from "react";
import { StaffTable } from "@/components/staff/staff-table";
import { StaffForm } from "@/components/staff/staff-form";
import { PageHeader } from "@/components/page-header";
import { staff as allStaff } from "@/lib/data";
import { employmentTypes, type Staff } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Download, Upload } from "lucide-react";

export default function StaffPage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [filteredStaff, setFilteredStaff] = useState<Staff[]>(allStaff);
  const [editingStaff, setEditingStaff] = useState<Staff | undefined>(undefined);

  const handleFilterByType = (type: string) => {
    if (type === "all") {
      setFilteredStaff(allStaff);
    } else {
      setFilteredStaff(allStaff.filter((s) => s.employmentType === type));
    }
  };
  
  const handleAddStaff = () => {
    setEditingStaff(undefined);
    setIsSheetOpen(true);
  };
  
  const handleEditStaff = (staffMember: Staff) => {
    setEditingStaff(staffMember);
    setIsSheetOpen(true);
  };

  const handleFormSubmit = (staffMember: Staff) => {
    console.log("Form submitted for staff member:", staffMember);
    setIsSheetOpen(false);
  };

  return (
    <div>
      <PageHeader title="Manejo de Personal" actionButtonText="Agregar Personal" onActionButtonClick={handleAddStaff}>
        <div className="flex items-center gap-2">
            <Select onValueChange={handleFilterByType} defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {employmentTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => alert('La importación desde Google Sheets es una función planificada.')}>
              <Upload className="mr-2 h-4 w-4" /> Importar
            </Button>
            <Button variant="outline" size="sm" onClick={() => alert('La exportación a CSV es una función planificada.')}>
              <Download className="mr-2 h-4 w-4" /> Exportar
            </Button>
        </div>
      </PageHeader>
      
      <StaffTable staff={filteredStaff} onEdit={handleEditStaff} />

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editingStaff ? 'Editar Personal' : 'Crear Nuevo Personal'}</SheetTitle>
            <SheetDescription>
              {editingStaff ? 'Actualiza los detalles de este miembro del personal.' : 'Rellena los detalles para el nuevo miembro del personal.'}
            </SheetDescription>
          </SheetHeader>
          <StaffForm staffMember={editingStaff} onSubmit={handleFormSubmit} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

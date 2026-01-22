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
      <PageHeader title="Staff Management" actionButtonText="Add New Staff" onActionButtonClick={handleAddStaff}>
        <div className="flex items-center gap-2">
            <Select onValueChange={handleFilterByType} defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {employmentTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => alert('Import from Google Sheets is a planned feature.')}>
              <Upload className="mr-2 h-4 w-4" /> Import
            </Button>
            <Button variant="outline" size="sm" onClick={() => alert('Export to CSV is a planned feature.')}>
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
        </div>
      </PageHeader>
      
      <StaffTable staff={filteredStaff} onEdit={handleEditStaff} />

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editingStaff ? 'Edit Staff Member' : 'Create a New Staff Member'}</SheetTitle>
            <SheetDescription>
              {editingStaff ? 'Update the details for this staff member.' : 'Fill in the details for the new staff member.'}
            </SheetDescription>
          </SheetHeader>
          <StaffForm staffMember={editingStaff} onSubmit={handleFormSubmit} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

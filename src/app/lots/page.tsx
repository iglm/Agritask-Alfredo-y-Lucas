"use client";

import { useState } from "react";
import { LotsTable } from "@/components/lots/lots-table";
import { LotForm } from "@/components/lots/lot-form";
import { PageHeader } from "@/components/page-header";
import { lots as allLots } from "@/lib/data";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Download, Upload } from "lucide-react";
import { Lot } from "@/lib/types";

export default function LotsPage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [filteredLots, setFilteredLots] = useState<Lot[]>(allLots);
  const [editingLot, setEditingLot] = useState<Lot | undefined>(undefined);

  const locations = [...new Set(allLots.map((lot) => lot.location))];

  const handleFilterByLocation = (location: string) => {
    if (location === "all") {
      setFilteredLots(allLots);
    } else {
      setFilteredLots(allLots.filter((lot) => lot.location === location));
    }
  };

  const handleAddLot = () => {
    setEditingLot(undefined);
    setIsSheetOpen(true);
  };
  
  const handleEditLot = (lot: Lot) => {
    setEditingLot(lot);
    setIsSheetOpen(true);
  }

  const handleFormSubmit = (lot: Lot) => {
    // This is where you would handle API calls to save the data
    console.log("Form submitted for lot:", lot);
    // For now, we just close the sheet
    setIsSheetOpen(false);
  }

  return (
    <div>
      <PageHeader title="Lot Management" actionButtonText="Add New Lot" onActionButtonClick={handleAddLot}>
        <div className="flex items-center gap-2">
            <Select onValueChange={handleFilterByLocation} defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location} value={location}>{location}</SelectItem>
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
      
      <LotsTable lots={filteredLots} onEdit={handleEditLot} />

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editingLot ? 'Edit Lot' : 'Create a New Lot'}</SheetTitle>
            <SheetDescription>
              {editingLot ? 'Update the details for this lot.' : 'Fill in the details for the new lot.'}
            </SheetDescription>
          </SheetHeader>
          <LotForm lot={editingLot} onSubmit={handleFormSubmit} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

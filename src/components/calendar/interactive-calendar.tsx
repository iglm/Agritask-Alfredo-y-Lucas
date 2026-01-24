"use client";

import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import type { Task } from "@/lib/types";
import { es } from "date-fns/locale";

type InteractiveCalendarProps = {
  tasks: Task[];
  onDateSelect: (date: Date | undefined) => void;
};

export function InteractiveCalendar({ tasks, onDateSelect }: InteractiveCalendarProps) {
  // The 'tasks' prop is not used for now to keep it simple and fix the main issue.
  // This will render the default, functional calendar from shadcn/ui inside a card.
  return (
    <Card className="w-fit">
      <Calendar
        locale={es}
        mode="single"
        onSelect={onDateSelect}
        className="p-3"
      />
    </Card>
  );
}

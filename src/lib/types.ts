export type Lot = {
  id: string;
  name: string;
  area: number;
  location: string;
  notes?: string;
};

export type Staff = {
  id: string;
  name: string;
  contact: string;
  employmentType: "Permanente" | "Temporal" | "Contratista";
  dailyRate: number;
};

export type Task = {
  id: string;
  lotId: string;
  category: "Preparación" | "Siembra" | "Mantenimiento" | "Cosecha" | "Post-Cosecha";
  type: string;
  responsibleId: string;
  date: string;
  plannedJournals: number;
  progress: number;
  plannedCost: number;
  actualCost: number;
};

export const taskCategories: Task['category'][] = ["Preparación", "Siembra", "Mantenimiento", "Cosecha", "Post-Cosecha"];
export const employmentTypes: Staff['employmentType'][] = ["Permanente", "Temporal", "Contratista"];

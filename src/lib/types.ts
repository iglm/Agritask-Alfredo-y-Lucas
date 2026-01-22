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
  employmentType: "Permanent" | "Temporal" | "Contractor";
  dailyRate: number;
};

export type Task = {
  id: string;
  lotId: string;
  category: "Preparation" | "Planting" | "Maintenance" | "Harvest" | "Post-Harvest";
  type: string;
  responsibleId: string;
  date: string;
  plannedJournals: number;
  progress: number;
  plannedCost: number;
  actualCost: number;
};

export const taskCategories: Task['category'][] = ["Preparation", "Planting", "Maintenance", "Harvest", "Post-Harvest"];
export const employmentTypes: Staff['employmentType'][] = ["Permanent", "Temporal", "Contractor"];

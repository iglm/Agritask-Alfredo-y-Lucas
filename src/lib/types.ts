export type UserProfile = {
  uid: string;
  email: string;
  name?: string;
  subscription: 'free' | 'premium';
};

export type Lot = {
  id: string;
  userId?: string;
  name: string;
  areaHectares: number;
  location: string;
  technicalNotes?: string;
};

export type Staff = {
  id: string;
  userId?: string;
  name: string;
  contact: string;
  employmentType: "Permanente" | "Temporal" | "Contratista";
  baseDailyRate: number;
};

export type Task = {
  id: string;
  userId?: string;
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

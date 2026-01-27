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
  location?: string;
  technicalNotes?: string;
  sowingDate?: string;
  sowingDensity?: number;
  sowingDistance?: number;
  totalTrees?: number;
};

export type SubLot = {
  id: string;
  userId: string;
  lotId: string;
  name: string;
  areaHectares: number;
  sowingDate?: string;
  sowingDensity?: number;
  totalTrees?: number;
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
  startDate: string;
  endDate?: string;
  reentryDate?: string;
  status: 'Por realizar' | 'En Proceso' | 'Pendiente' | 'Finalizado';
  progress: number;
  plannedJournals: number;
  plannedCost: number;
  actualCost: number;
  downtimeMinutes?: number;
  observations?: string;
};

export type ProductiveUnit = {
  id: string;
  userId?: string;
  farmName?: string;
  country?: string;
  department?: string;
  municipality?: string;
  vereda?: string;
  shareGps?: boolean;
  crop?: string;
  variety?: string;
  altitudeRange?: string;
  averageTemperature?: number;
  projectStartDate?: string;
  totalFarmArea?: number;
  cultivatedArea?: number;
  sowingDensity?: number;
  sowingDistance?: number;
  totalTrees?: number;
};

export const taskCategories: Task['category'][] = ["Preparación", "Siembra", "Mantenimiento", "Cosecha", "Post-Cosecha"];
export const employmentTypes: Staff['employmentType'][] = ["Permanente", "Temporal", "Contratista"];
export const taskStatuses: Task['status'][] = ['Por realizar', 'En Proceso', 'Pendiente', 'Finalizado'];

    
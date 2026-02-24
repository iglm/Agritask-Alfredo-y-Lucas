export type UserProfile = {
  uid: string;
  email: string;
  name?: string;
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
  distanceBetweenPlants?: number;
  distanceBetweenRows?: number;
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
  distanceBetweenPlants?: number;
  distanceBetweenRows?: number;
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
  dependsOn?: string;
  startDate: string;
  endDate?: string;
  reentryDate?: string;
  status: 'Por realizar' | 'En Proceso' | 'Pendiente' | 'Finalizado';
  progress: number;
  plannedJournals: number;
  plannedCost: number;
  supplyCost: number;
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
  distanceBetweenPlants?: number;
  distanceBetweenRows?: number;
};

export type StaffAttendance = {
  id: string;
  userId?: string;
  staffId: string;
  date: string; // YYYY-MM-DD
  status: 'Presente' | 'Ausente';
  reason?: string;
};

export type Supply = {
  id: string;
  userId?: string;
  name: string;
  unitOfMeasure: 'Kg' | 'Lt' | 'Unidad' | 'Bulto' | 'Galón' | 'Caja';
  costPerUnit: number;
  initialStock: number;
  currentStock: number;
  supplier?: string;
};

export type SupplyUsage = {
  id: string;
  userId?: string;
  taskId: string;
  supplyId: string;
  supplyName: string;
  quantityUsed: number;
  costAtTimeOfUse: number; // Snapshot of costPerUnit * quantityUsed
};

export const taskCategories: Task['category'][] = ["Preparación", "Siembra", "Mantenimiento", "Cosecha", "Post-Cosecha"];
export const employmentTypes: Staff['employmentType'][] = ["Permanente", "Temporal", "Contratista"];
export const taskStatuses: Task['status'][] = ['Por realizar', 'En Proceso', 'Pendiente', 'Finalizado'];
export const staffAttendanceStatuses: StaffAttendance['status'][] = ['Presente', 'Ausente'];
export const supplyUnits: Supply['unitOfMeasure'][] = ['Kg', 'Lt', 'Unidad', 'Bulto', 'Galón', 'Caja'];

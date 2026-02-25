export type UserProfile = {
  uid: string;
  email: string;
  name?: string;
};

export type Lot = {
  id: string;
  userId?: string;
  productiveUnitId: string;
  name: string;
  crop: string;
  areaHectares: number;
  location?: string;
  technicalNotes?: string;
  sowingDate?: string;
  sowingDensity?: number;
  distanceBetweenPlants?: number;
  distanceBetweenRows?: number;
  totalTrees?: number;
  soilType?: string;
  phAverage?: number;
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
  eps?: string;
  certifications?: string;
};

export type PlannedSupply = {
  supplyId: string;
  quantity: number;
};

export type Task = {
  id: string;
  userId?: string;
  lotId: string;
  category: "Preparación" | "Siembra" | "Mantenimiento" | "Cosecha" | "Post-Cosecha" | "Otro";
  type: string;
  responsibleId: string;
  dependsOn?: string;
  startDate: string;
  endDate?: string;
  isRecurring?: boolean;
  recurrenceFrequency?: 'días' | 'semanas' | 'meses';
  recurrenceInterval?: number;
  status: 'Por realizar' | 'En Proceso' | 'Pendiente' | 'Finalizado';
  progress: number;
  plannedJournals: number;
  plannedCost: number;
  supplyCost: number;
  actualCost: number;
  downtimeMinutes?: number;
  harvestedQuantity?: number;
  observations?: string;
  plannedSupplies?: PlannedSupply[];
};

export type ProductiveUnit = {
  id: string;
  userId?: string;
  farmName?: string;
  country?: string;
  department?: string;
  municipality?: string;
  vereda?: string;
  crops?: string[];
  varieties?: string[];
  altitudeRange?: string;
  averageTemperature?: number;
  projectStartDate?: string;
  totalFarmArea?: number;
  cultivatedArea?: number;
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
  unitOfMeasure: 'Kg' | 'gr' | 'Lt' | 'ml / cc' | 'Unidad' | 'Bulto' | 'Galón' | 'Caja';
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
  date: string; // YYYY-MM-DD
};

export type Transaction = {
  id: string;
  userId?: string;
  type: 'Ingreso' | 'Egreso';
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
  category: string;
  lotId?: string;
};

export const taskCategories: Task['category'][] = ["Preparación", "Siembra", "Mantenimiento", "Cosecha", "Post-Cosecha", "Otro"];
export const employmentTypes: Staff['employmentType'][] = ["Permanente", "Temporal", "Contratista"];
export const taskStatuses: Task['status'][] = ['Por realizar', 'En Proceso', 'Pendiente', 'Finalizado'];
export const staffAttendanceStatuses: StaffAttendance['status'][] = ['Presente', 'Ausente'];
export const supplyUnits: Supply['unitOfMeasure'][] = ['Kg', 'gr', 'Lt', 'ml / cc', 'Unidad', 'Bulto', 'Galón', 'Caja'];
export const recurrenceFrequencies: NonNullable<Task['recurrenceFrequency']>[] = ['días', 'semanas', 'meses'];
export const transactionTypes: Transaction['type'][] = ['Ingreso', 'Egreso'];
export const incomeCategories = [
  "Venta de Cosecha",
  "Venta de Subproductos",
  "Servicios a Terceros",
  "Subsidios/Apoyos",
  "Otro Ingreso"
];
export const expenseCategories = [
  "Arrendamiento",
  "Servicios Públicos",
  "Transporte",
  "Impuestos y Licencias",
  "Reparaciones",
  "Gastos Administrativos",
  "Otro Egreso"
];

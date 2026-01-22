import type { Lot, Staff, Task } from "./types";

export const lots: Lot[] = [
  { id: "L001", name: "El Manantial", area: 15, location: "Vereda El Placer" },
  { id: "L002", name: "La Esperanza", area: 22, location: "Vereda La Cumbre" },
  { id: "L003", name: "Bellavista", area: 8, location: "Sector El Mirador" },
  { id: "L004", name: "Guayacanes", area: 30, location: "Vereda El Placer" },
];

export const staff: Staff[] = [
  { id: "S001", name: "Carlos Perez", contact: "3101234567", employmentType: "Permanent", dailyRate: 50 },
  { id: "S002", name: "Maria Rodriguez", contact: "3117654321", employmentType: "Temporal", dailyRate: 45 },
  { id: "S003", name: "Juan Gonzalez", contact: "3208765432", employmentType: "Contractor", dailyRate: 55 },
  { id: "S004", name: "Ana Martinez", contact: "3152345678", employmentType: "Permanent", dailyRate: 52 },
];

const calculateCosts = (plannedJournals: number, progress: number, dailyRate: number) => {
  const plannedCost = plannedJournals * dailyRate;
  const actualCost = plannedCost * (progress / 100);
  return { plannedCost, actualCost };
};

export const tasks: Task[] = [
  {
    id: "T001",
    lotId: "L001",
    category: "Preparation",
    type: "Soil Plowing",
    responsibleId: "S001",
    date: "2024-07-10",
    plannedJournals: 5,
    progress: 100,
    ...calculateCosts(5, 100, 50),
  },
  {
    id: "T002",
    lotId: "L002",
    category: "Planting",
    type: "Coffee Planting",
    responsibleId: "S002",
    date: "2024-07-15",
    plannedJournals: 10,
    progress: 80,
    ...calculateCosts(10, 80, 45),
  },
  {
    id: "T003",
    lotId: "L001",
    category: "Maintenance",
    type: "Weed Control",
    responsibleId: "S004",
    date: "2024-08-01",
    plannedJournals: 3,
    progress: 50,
    ...calculateCosts(3, 50, 52),
  },
  {
    id: "T004",
    lotId: "L003",
    category: "Harvest",
    type: "Fruit Picking",
    responsibleId: "S003",
    date: "2024-08-20",
    plannedJournals: 15,
    progress: 25,
    ...calculateCosts(15, 25, 55),
  },
  {
    id: "T005",
    lotId: "L004",
    category: "Post-Harvest",
    type: "Drying and Storage",
    responsibleId: "S001",
    date: "2024-09-05",
    plannedJournals: 8,
    progress: 0,
    ...calculateCosts(8, 0, 50),
  },
  {
    id: "T006",
    lotId: "L002",
    category: "Maintenance",
    type: "Fertilization",
    responsibleId: "S004",
    date: "2024-07-25",
    plannedJournals: 4,
    progress: 100,
    ...calculateCosts(4, 100, 52),
  },
];

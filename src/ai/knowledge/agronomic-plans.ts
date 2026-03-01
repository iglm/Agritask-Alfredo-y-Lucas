/**
 * @fileOverview Agronomic knowledge base for different crops.
 * This file serves as the single source of truth for the Task Planner AI Agent.
 *
 * Each plan consists of a series of tasks with:
 * - timing: When the task should occur relative to the sowing date.
 * - category: The general category of the task.
 * - type: A specific name for the task.
 * - baseJournalsPerHa: Estimated man-days per hectare for this task.
 * - observations: Agronomic justification for the task.
 */

export const cultivationPlans = {
  café: {
    crop: "Café",
    plan: [
      {
        timing: "week 4",
        category: "Mantenimiento",
        type: "Control de Malezas Manual/Químico Inicial",
        baseJournalsPerHa: 3,
        observations: "Evita la competencia por nutrientes en la etapa de establecimiento del cultivo."
      },
      {
        timing: "week 8",
        category: "Mantenimiento",
        type: "Primera Fertilización de Crecimiento (NPK)",
        baseJournalsPerHa: 2,
        observations: "Aporte clave de nutrientes para el desarrollo vegetativo inicial. Usar una fórmula rica en Nitrógeno."
      },
      {
        timing: "week 16",
        category: "Mantenimiento",
        type: "Control de Hormiga Arriera",
        baseJournalsPerHa: 1,
        observations: "Previene la defoliación severa en plantas jóvenes, que puede causar la muerte o un retraso significativo."
      },
      {
        timing: "week 20",
        category: "Mantenimiento",
        type: "Segunda Fertilización de Crecimiento",
        baseJournalsPerHa: 2,
        observations: "Refuerzo nutricional para asegurar un buen desarrollo de ramas y estructura de la planta."
      },
      {
        timing: "week 30",
        category: "Mantenimiento",
        type: "Monitoreo y Control de Broca",
        baseJournalsPerHa: 2,
        observations: "Detección temprana y manejo de la broca del café para evitar su establecimiento en el lote."
      },
      {
        timing: "week 40",
        category: "Mantenimiento",
        type: "Fertilización de Pre-producción",
        baseJournalsPerHa: 2.5,
        observations: "Preparación de la planta para la primera floración con una fórmula balanceada."
      },
      {
        timing: "week 52",
        category: "Cosecha",
        type: "Cosecha Principal / Traviesa (Según Zona)",
        baseJournalsPerHa: 15,
        observations: "Recolección de los granos maduros. La intensidad varía según la región y la edad del cultivo."
      }
    ]
  },
  plátano: {
    crop: "Plátano",
    plan: [
       {
        timing: "week 6",
        category: "Mantenimiento",
        type: "Deshoje y Deshije Inicial",
        baseJournalsPerHa: 3,
        observations: "Eliminación de hojas secas y selección del primer hijo para mejorar la ventilación y el vigor."
      },
      {
        timing: "week 10",
        category: "Mantenimiento",
        type: "Primera Fertilización (Urea/NPK)",
        baseJournalsPerHa: 2,
        observations: "Aporte de nitrógeno esencial para el rápido desarrollo foliar del cultivo."
      },
      {
        timing: "week 18",
        category: "Mantenimiento",
        type: "Control de Malezas y Plateo",
        baseJournalsPerHa: 3,
        observations: "Mantiene el área alrededor de la planta libre de competencia por agua y nutrientes."
      },
       {
        timing: "week 24",
        category: "Mantenimiento",
        type: "Manejo de Sigatoka Negra",
        baseJournalsPerHa: 2.5,
        observations: "Aplicación preventiva o curativa para controlar la principal enfermedad foliar del plátano."
      },
       {
        timing: "week 30",
        category: "Mantenimiento",
        type: "Fertilización de Producción",
        baseJournalsPerHa: 2,
        observations: "Aporte rico en Potasio para el llenado del racimo y la calidad de la fruta."
      },
      {
        timing: "week 36",
        category: "Post-Cosecha",
        type: "Embolsado de Racimos",
        baseJournalsPerHa: 3,
        observations: "Protege los frutos de plagas, rozaduras y mejora la calidad y apariencia para la venta."
      },
      {
        timing: "week 44",
        category: "Cosecha",
        type: "Inicio de Cosecha Semanal",
        baseJournalsPerHa: 5,
        observations: "La cosecha del plátano es continua. Se establece un ciclo semanal o quincenal de recolección."
      }
    ]
  },
  default: {
      crop: "Cultivo Genérico",
      plan: [
           {
            timing: "week 8",
            category: "Mantenimiento",
            type: "Fertilización Genérica",
            baseJournalsPerHa: 2,
            observations: "Plan base. Edita esta labor con los requerimientos específicos de tu cultivo."
          }
      ]
  }
};

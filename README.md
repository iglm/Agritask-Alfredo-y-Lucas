# 🌿 AgriTask Master: Optimizador de Labores Agrícolas

## 1. Descripción General

**AgriTask Master** es un ERP (Planificación de Recursos Empresariales) de nivel profesional, reinventado para el sector agrícola. Su misión es simple: reemplazar la complejidad de los formularios y las hojas de cálculo por la simplicidad de una conversación.

Construido como una **Aplicación Web Progresiva (PWA)**, funciona en cualquier navegador y puede instalarse en dispositivos móviles para una experiencia nativa, garantizando el acceso a los datos y la funcionalidad incluso **sin conexión a internet** gracias a la persistencia local de Firestore.

La plataforma centraliza toda la operación de la finca, desde la planificación agronómica y la gestión de personal hasta el control financiero y el análisis de rentabilidad, todo ello impulsado por una suite de asistentes de Inteligencia Artificial.

---

## 2. Filosofía Central: El ERP Conversacional

La principal innovación de AgriTask Master es su **interfaz conversacional**. En lugar de navegar por menús y llenar campos, el usuario gestiona su finca dando órdenes en lenguaje natural, como si estuviera hablando con un asistente experto.

-   **Entrada de Datos sin Fricción:** Olvídate de los formularios. Comandos como `"Programa una guadañada en El Filo para mañana con Ana"` o `"Registra un gasto de 150.000 en transporte"` son procesados instantáneamente por la IA.
-   **Creación Masiva Inteligente:** El **Constructor IA** permite configurar una finca completa (lotes, personal, plan de labores) a partir de una única descripción en lenguaje natural.
-   **Análisis a Petición:** Los **Agentes de IA** en el panel principal analizan la operación en tiempo real para encontrar anomalías, inconsistencias y oportunidades de optimización con solo un clic.

---

## 3. Módulos y Funcionalidades Detalladas

### ✨ Constructor IA (El Inicio Mágico)

Es la herramienta para empezar de cero. Permite al usuario describir su finca con sus propias palabras, y la IA genera un plan de construcción completo.

-   **Función:** Transforma una descripción textual en una estructura de datos completa y lista para usar.
-   **Ejemplo de Comando:** `"Crea la finca 'La Esmeralda' en Jardín, Antioquia. Tiene 20 hectáreas con 8 lotes de café de 2.5 hectáreas cada uno, sembrados hace 3 años. También registra a 10 trabajadores y programa 3 fertilizaciones al año para los lotes de café."`
-   **Proceso:**
    1.  El usuario introduce la descripción.
    2.  La IA genera un **plan de construcción** que incluye la unidad productiva, los lotes, el personal y un plan de labores agronómicas estándar basado en el tipo de cultivo y la fecha de siembra.
    3.  El usuario revisa un resumen del plan.
    4.  Al aprobar, la aplicación crea todas las entidades en la base de datos en una sola operación.

### 🤖 Asistente de Comandos por IA (La Consola Diaria)

El motor de la gestión diaria. Permite ejecutar múltiples acciones de creación, actualización o eliminación con un solo comando.

-   **Función:** Interpreta lenguaje natural y lo traduce en acciones estructuradas en la base de datos.
-   **Capacidades:**
    -   **Crear Labores:** `"Programar fertilización en El Manantial para mañana con Carlos Pérez, 2 jornales y usar 5 bultos de urea."`
    -   **Registrar Finanzas:** `"Añade un ingreso de 1.200.000 por venta de café y un gasto de 80.000 en gasolina."`
    -   **Gestionar Insumos:** `"Registra el insumo 'Glifosato' en Litros con un costo de 35.000."`
    -   **Actualizar Entidades:** `"Corrige el área del lote El Mirador a 15 hectáreas."`
    -   **Eliminar Entidades:** `"Borra el lote La Zanja."`
-   **Contexto Inteligente:** Utiliza los datos existentes (nombres de lotes, personal, insumos) para asociar correctamente las nuevas acciones a los IDs correspondientes.

### 📊 Panel Principal (Dashboard)

El centro de mando que ofrece una visión de 360 grados de la operación.

-   **KPIs (Indicadores Clave):**
    -   `Lotes Totales`: Conteo total de lotes registrados.
    -   `Ingresos Totales`: Suma de todas las transacciones de tipo "Ingreso".
    -   `Costos Productivos`: Suma de todos los costos (mano de obra e insumos) asociados a lotes de tipo "Productivo".
    -   `Costos de Soporte`: Suma de costos de lotes de "Soporte" y gastos generales no asociados a un lote.
-   **Próximas Labores:** Una lista de las tareas no finalizadas programadas para los próximos 7 días.
-   **Suite de Agentes de IA:**
    -   **Analista de Anomalías:** Busca sobrecostos en labores (>15%), gastos inesperados, retrasos críticos (especialmente en siembra y cosecha) y concentración de problemas en lotes específicos.
    -   **Auditor de Planificación:** Detecta inconsistencias lógicas como riesgos de seguridad (trabajador sin EPS asignado a una tarea), omisiones en planes de cosecha para cultivos perennes, y falta de planificación en lotes recién sembrados.
    -   **Optimizador de Recursos:** Analiza la carga de trabajo de la próxima semana y sugiere reasignaciones si un colaborador está sobrecargado.
-   **Respaldo Completo:** Un botón para exportar **toda la información** (unidades, lotes, sub-lotes, personal, labores, transacciones, etc.) a archivos CSV descargables.

### 🗂️ Gestión de Lotes

El esqueleto de la finca. Permite una administración detallada de todos los terrenos.

-   **Tipos de Lote:**
    -   `Productivo`: Para cultivos que generan ingresos (Café, Aguacate). Los costos asociados se imputan directamente a la producción.
    -   `Soporte`: Para infraestructura (Vías, Acueducto, Vivero). Los costos asociados son indirectos.
-   **Datos Técnicos Avanzados:** Campos para `Variedad`, `Tipo de Suelo`, `pH Promedio`, `Fecha de Siembra`, `Densidad de Siembra`, `Mortalidad Acumulada`, etc.
-   **Sub-Lotes:** Capacidad de subdividir un lote principal para un manejo más granular.
-   **Acciones Inteligentes por Lote:**
    -   **Reporte de Rentabilidad:** Calcula ingresos, costos y rentabilidad neta por lote. Si se registran datos de cosecha, calcula el costo y beneficio por Kg.
    -   **Agente Planificador (IA):** Genera un plan de labores agronómicas para 12 meses basado en el tipo de cultivo y la fecha de siembra del lote, utilizando una base de conocimiento experta.

### 🚜 Gestión de Labores (Tareas)

El corazón operativo de la aplicación.

-   **Planificación Detallada:** Permite crear labores con categoría, responsable, fechas, estado (`Por realizar`, `En Proceso`, etc.), y dependencias de otras tareas.
-   **Recurrencia Automática:** Al finalizar una labor marcada como recurrente (ej. fertilización cada 3 meses), el sistema **crea y programa automáticamente la siguiente ocurrencia** de esa labor.
-   **Gestión de Insumos Integrada:**
    -   **Planificación:** Permite asignar qué insumos y qué cantidad se planea usar en una labor.
    -   **Consumo Real:** Un gestor dedicado permite registrar el consumo real de insumos durante la labor. Esto **actualiza automáticamente el costo real de la tarea**.
-   **Métricas de Eficiencia:** Campos específicos para `Cantidad Cosechada (Kg)` y `Tiempo de Inactividad (minutos)` para análisis de rendimiento.

### 📦 Gestión de Insumos

Control sobre los recursos materiales.

-   **Registro de Productos:** Permite registrar insumos con unidad de medida y costo unitario para ser utilizados en las labores.
-   **Cálculo de Costos Automático:** El costo de los insumos consumidos se suma automáticamente al costo total de la labor.

### 💰 Gestión Financiera

Seguimiento de cada peso que entra y sale.

-   **Registro de Transacciones:** Creación manual de `Ingresos` y `Egresos` con categoría y asociación opcional a un lote.
-   **Cierre Financiero Automático:** Al finalizar una labor, el sistema puede generar automáticamente un **egreso** por el costo de la mano de obra, asegurando que todos los costos queden registrados y atribuidos correctamente.

### 👥 Gestión de Colaboradores y Asistencia

-   **Registro de Personal:** Administración de información de colaboradores, incluyendo tipo de empleo (`Permanente`, `Temporal`, `Contratista`), tarifa diaria y EPS.
-   **Registro de Asistencia Diario:** Interfaz para marcar la asistencia (`Presente`/`Ausente`) y registrar el motivo.
-   **Generador de Pre-Nómina:** Calcula automáticamente el pago a realizar a cada colaborador en un periodo, basándose en las **labores finalizadas**. Diferencia el cálculo para contratistas (pago por labor) y empleados (pago por jornal). Permite exportar el reporte.

### 📆 Calendario Interactivo

Una vista cronológica y visual de las operaciones.

-   **Arrastrar y Soltar (Drag & Drop):** Permite reprogramar labores simplemente arrastrándolas a una nueva fecha.
-   **Creación Rápida:** Posibilidad de crear nuevas labores directamente haciendo clic en un día.
-   **Visualización de Dependencias:** Las labores bloqueadas por dependencias no cumplidas se muestran visualmente.

### 📈 Reportes y Análisis

Página dedicada a la visualización de datos a través de gráficos interactivos.

-   **Tendencias Financieras:** Ingresos vs. Costos Productivos vs. Costos de Soporte a lo largo del tiempo.
-   **Rentabilidad por Lote:** Gráfico de barras comparando ganancias o pérdidas para cada lote.
-   **Desempeño de Colaboradores:** Ranking de labores finalizadas por cada persona.
-   **Desglose de Inversión:** Gráfico que detalla la inversión por lote en Mano de Obra e Insumos, comparando lo planificado vs. lo real.
-   **Distribución y Consumo:** Gráficos de pastel y barras para entender la distribución de labores por categoría y el consumo total de cada insumo.
-   **Desglose de Costos de Soporte:** Identifica en qué unidades no productivas (Vías, Vivero, etc.) se concentran los costos indirectos.

### 🏠 Gestión de Unidades Productivas

-   **Función:** Permite al usuario registrar y mantener un perfil detallado de su finca o unidad productiva, que actúa como el contenedor principal para todos los demás datos (lotes, personal, etc.). Múltiples unidades pueden ser gestionadas.

### 🌐 Autenticación y Modo Sin Conexión

-   **Función:** Gestiona el acceso del usuario y la persistencia de los datos.
-   **Detalle de Funcionalidades:**
    -   **Inicio de Sesión con Google:** Acceso seguro y rápido.
    -   **Modo Offline:** La aplicación es funcional sin conexión. Los datos se guardan en el caché local de Firestore y se sincronizan automáticamente al recuperar la conexión. Un indicador visual muestra el estado de la conexión en tiempo real.

---

## 4. Análisis Técnico Detallado (Análisis de IA del Código Fuente)

Esta es una descripción técnica y funcional detallada de la aplicación, basada en el análisis de su código fuente y arquitectura, incluyendo módulos críticos que no suelen estar detallados en un README estándar:

### 4.1. Propósito y Arquitectura Core
Agritask es una plataforma de gestión agrícola (SaaS) diseñada para la optimización de granjas. Está construida con Next.js, TypeScript y Firebase. Su arquitectura destaca por eliminar el manejo manual de estados offline en favor de la persistencia nativa de Firestore, centralizando la lógica en un `DataProvider` para usuarios autenticados.

### 4.2. El Motor de Inteligencia Artificial (Genkit)
La aplicación integra Google Genkit con el modelo Gemini 2.5 Flash, configurado específicamente para optimizar costos y velocidad. El sistema utiliza "Flows" (flujos de trabajo de IA) para automatizar tareas complejas:

-   **Constructor de Fincas (Farm Builder):** Permite configurar una finca completa (lotes, personal, insumos y tareas) a partir de una descripción en lenguaje natural. No solo crea las entidades, sino que genera automáticamente un plan agronómico de 12 meses basado en una base de conocimientos integrada.
-   **Optimizador de Recursos:** Analiza la carga de trabajo del personal. Si detecta desequilibrios (un trabajador con >1.5x la carga de otro) o tiempos muertos excesivos en labores como fumigación, sugiere reasignaciones de tareas específicas.
-   **Detector de Anomalías:** Monitorea discrepancias financieras (sobrecostos >15%), retrasos críticos en siembras o cosechas, e inconsistencias en los datos (como fechas de fin anteriores a las de inicio).
-   **Planificador Agronómico:** Genera planes deterministas basados en el tipo de cultivo, calculando fechas de inicio y jornales necesarios según el área del lote.

### 4.3. Modelo de Datos y Entidades
El sistema utiliza un esquema de tipos riguroso que define la operación:

-   **Lotes (Lots) y Sub-lotes:** Distingue entre lotes "Productivos" y de "Soporte". Almacena datos técnicos como densidad de siembra, distancia entre plantas, mortalidad acumulada y pH del suelo.
-   **Personal (Staff):** Clasifica por tipo de contrato (Permanente, Temporal, Contratista) y gestiona el costo base del jornal.
-   **Labores (Tasks):** Es el eje operativo. Gestiona categorías (Preparación, Siembra, Mantenimiento, Cosecha, Post-Cosecha), estados de progreso, costos planeados vs. reales, y recurrencia.
-   **Insumos (Supplies):** Controla el inventario por unidades (Kg, Lt, Bultos, etc.) y rastrea el costo exacto al momento de su uso en una labor.
-   **Finanzas (Transactions):** Categoriza ingresos (ventas, subsidios) y egresos (mano de obra, insumos, administración).

### 4.4. Funcionalidades de Gestión Avanzada

-   **Gestión de Asistencia:** Sistema para registrar la presencia o ausencia del personal con motivos específicos.
-   **Sistema de Logs y Diagnóstico:** Incluye un `SystemLog` que captura errores con "huellas digitales" (fingerprints), severidad y un diagnóstico automático por IA para facilitar la resolución de problemas técnicos.
-   **Internacionalización (i18n):** Soporte completo para español e inglés, localizado en archivos JSON que cubren desde la navegación hasta indicadores del panel.

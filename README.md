# Optimizador de Labores Agrícolas

## 1. Título de la Obra
Optimizador de Labores Agrícolas

## 2. Descripción General
Software de tipo ERP (Planificación de Recursos Empresariales) diseñado específicamente para la gestión y optimización de fincas agrícolas. La aplicación funciona como una **Aplicación Web Progresiva (PWA)**, lo que le permite ser accesible desde cualquier navegador web y ser instalada en dispositivos móviles para una experiencia similar a una aplicación nativa, incluyendo la capacidad de funcionar sin conexión a internet gracias a la persistencia de datos de Firestore.

Su objetivo principal es centralizar la información de la finca, facilitar la planificación de actividades, controlar costos y mejorar la toma de decisiones a través de la visualización de datos y el análisis con un conjunto de agentes de inteligencia artificial.

## 3. Módulos y Funcionalidades Detalladas

### Panel Principal (Dashboard)
- **Función:** Proporciona una vista general y resumida del estado operativo y financiero de la finca. Es la primera pantalla que ve el usuario al ingresar.
- **Detalle de Funcionalidades:**
    - **Indicadores Clave de Rendimiento (KPIs):** Cuatro tarjetas interactivas con datos vitales: `Lotes Totales`, `Ingresos Totales`, `Costos Productivos` (gastos directos en lotes productivos) y `Costos de Soporte` (gastos en infraestructura, administración y lotes no productivos).
    - **Próximas Labores:** Una lista de las tareas no finalizadas programadas para los próximos 7 días, permitiendo una planificación semanal rápida.
    - **Suite de Agentes IA:** Tres asistentes especializados para el análisis de datos:
        - **Asistente de Detección:** Busca anomalías como sobrecostos, retrasos o gastos inesperados.
        - **Agente Auditor de Datos:** Detecta inconsistencias lógicas en la planificación, como riesgos de seguridad laboral (falta de EPS), omisiones en cosechas o colaboradores inactivos.
        - **Agente Optimizador de Recursos:** Analiza la carga de trabajo y el inventario de la próxima semana para sugerir reasignaciones de tareas o alertar sobre la falta de insumos.
    - **Respaldo Completo:** Un botón para exportar todos los datos de la aplicación (lotes, personal, labores, finanzas, etc.) a archivos CSV con un solo clic.

### Unidad Productiva
- **Función:** Permite al usuario registrar y mantener un perfil detallado de su finca o unidad productiva. Múltiples unidades pueden ser gestionadas.

### Gestión de Lotes
- **Función:** Módulo para la administración de todos los terrenos de la finca, tanto productivos como de apoyo.
- **Detalle de Funcionalidades:**
    - **Tipos de Lote:** Permite crear lotes de tipo `Productivo` (ej. Café, Aguacate) o de `Soporte` (ej. Vías, Vivero, Acueducto), asegurando que los costos indirectos se separen de los costos de producción.
    - **Datos Técnicos Avanzados:** Registro de `Variedad`, `Tipo de Suelo`, `pH Promedio` y `Mortalidad Acumulada` para análisis agronómicos detallados.
    - **Gestión de Sub-Lotes:** Capacidad de subdividir un lote principal en sub-lotes con sus propias características.
    - **Acciones Inteligentes por Lote:**
        - **Reporte de Rentabilidad:** Diálogo emergente que calcula ingresos, costos y rentabilidad neta por lote, incluyendo el costo y beneficio por Kg si se han registrado datos de cosecha.
        - **Agente Planificador:** Un asistente IA que genera un plan de labores para 12 meses basado en el tipo de cultivo y la fecha de siembra del lote.

### Gestión de Colaboradores
- **Función:** Administra la información de los colaboradores de la finca.
- **Detalle de Funcionalidades:**
    - **Registro y Edición:** Permite añadir o actualizar información de los colaboradores (nombre, contacto, tipo de empleo, tarifa diaria, EPS).
    - **Filtros y Búsqueda:** Facilita la búsqueda por nombre y el filtrado por tipo de empleo.

### Gestión de Labores (Tareas)
- **Función:** Módulo para planificar, asignar y seguir el progreso de todas las actividades agrícolas.
- **Detalle de Funcionalidades:**
    - **Planificación Detallada:** Creación de labores con categoría, responsable, fechas, dependencia de otras tareas y estado (`Por realizar`, `En Proceso`, `Finalizado`, etc.).
    - **Labores Recurrentes:** Al finalizar una labor marcada como recurrente (ej. fertilización cada 3 meses), el sistema crea automáticamente la siguiente tarea en el calendario.
    - **Planificación y Control de Insumos:** Permite planificar qué insumos se usarán en una labor y luego registrar el consumo real, descontando automáticamente del inventario y actualizando los costos.
    - **Registro de Cosecha y Tiempos Muertos:** Campos específicos para `Cantidad Cosechada (Kg)` y `Tiempo de Inactividad (minutos)` para análisis de rendimiento y eficiencia.

### Gestión de Insumos (Inventario)
- **Función:** Controla el inventario de fertilizantes, pesticidas, herramientas y otros productos.
- **Detalle de Funcionalidades:**
    - **Registro de Productos:** Permite registrar insumos con unidad de medida, costo unitario, stock inicial y proveedor.
    - **Control de Stock Automático:** El stock se actualiza automáticamente cuando se registran consumos en las labores.

### Gestión Financiera
- **Función:** Módulo para el seguimiento de todos los movimientos de dinero.
- **Detalle de Funcionalidades:**
    - **Registro de Transacciones:** Permite crear `Ingresos` y `Egresos`, categorizarlos y asociarlos a un lote específico o a gastos generales.
    - **Cierre Financiero Automático:** Al finalizar una labor, el sistema puede generar automáticamente un egreso por el costo de la mano de obra, asegurando que todos los costos queden registrados.

### Asistencia y Pre-Nómina
- **Función:** Módulo dedicado a la gestión de la asistencia del personal y el cálculo de pagos.
- **Detalle de Funcionalidades:**
    - **Registro de Asistencia Diario:** Interfaz para marcar la asistencia (`Presente`/`Ausente`) y registrar el motivo de la ausencia para cada colaborador.
    - **Reportes de Asistencia:** Genera y exporta historiales de asistencia por colaborador y rango de fechas.
    - **Generador de Pre-Nómina:** Calcula automáticamente el pago a realizar a cada colaborador en un periodo, diferenciando entre personal fijo y contratistas y permitiendo exportar el reporte.

### Calendario
- **Función:** Proporciona una vista cronológica de las labores programadas.
- **Detalle de Funcionalidades:**
    - **Vista Interactiva:** Muestra un calendario mensual donde se pueden arrastrar y soltar las labores para reprogramarlas.
    - **Creación Rápida:** Permite crear nuevas labores directamente desde esta vista.

### Reportes y Análisis
- **Función:** Página dedicada a la visualización de datos y KPIs a través de gráficos interactivos.
- **Detalle de Funcionalidades:**
    - **Tendencias Financieras:** Ingresos vs. Costos Productivos vs. Costos de Soporte a lo largo del tiempo.
    - **Rentabilidad por Lote:** Comparativa de ganancias o pérdidas para cada lote productivo.
    - **Desempeño de Colaboradores:** Ranking de labores finalizadas por cada persona.
    - **Desglose de Inversión:** Gráfico que detalla la inversión por lote en Mano de Obra (plan vs. real) e Insumos (plan vs. real).
    - **Distribución y Consumo:** Gráficos de pastel y barras para entender la distribución de labores y el consumo total de insumos.
    - **Desglose de Costos de Soporte:** Identifica en qué unidades no productivas (Vías, Vivero, etc.) se concentran los costos indirectos.

### Autenticación y Modo Sin Conexión
- **Función:** Gestiona el acceso del usuario y la persistencia de los datos.
- **Detalle de Funcionalidades:**
    - **Inicio de Sesión con Google:** Acceso seguro y rápido.
    - **Modo Offline:** La aplicación es funcional sin conexión. Los datos se guardan en el caché local de Firestore y se sincronizan automáticamente al recuperar la conexión. Un indicador visual muestra el estado de la conexión en tiempo real.

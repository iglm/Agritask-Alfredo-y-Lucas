# Optimizador de Labores Agrícolas

## 1. Título de la Obra
Optimizador de Labores Agrícolas

## 2. Descripción General
Software de tipo ERP (Planificación de Recursos Empresariales) diseñado específicamente para la gestión y optimización de fincas agrícolas. La aplicación funciona como una **Aplicación Web Progresiva (PWA)**, lo que le permite ser accesible desde cualquier navegador web y ser instalada en dispositivos móviles para una experiencia similar a una aplicación nativa, incluyendo la capacidad de funcionar sin conexión a internet gracias a la persistencia de datos de Firestore.

Su objetivo principal es centralizar la información de la finca, facilitar la planificación de actividades, controlar costos y mejorar la toma de decisiones a través de la visualización de datos y el análisis con un conjunto de agentes de inteligencia artificial.

## 3. Módulos y Funcionalidades Detalladas

### Asistente de Comandos por IA
- **Función:** Permite al usuario interactuar con la aplicación usando lenguaje natural para automatizar el ingreso de datos, eliminando la necesidad de llenar formularios manualmente. Es la forma más rápida y eficiente de gestionar la operación.
- **Detalle de Funcionalidades:**
    - **Creación de Labores:** El usuario puede dictar o escribir una orden completa, y la IA se encarga de crear la labor con todos sus detalles.
    - **Ejemplo de Comando:** `"Programar fertilización en El Manantial para mañana con Carlos Pérez, 2 jornales"`.
    - **Procesamiento Inteligente:** La IA interpreta el comando, identifica el lote, el responsable, la fecha y los jornales, y crea la labor correspondiente en el sistema.

### Panel Principal (Dashboard)
- **Función:** Proporciona una vista general y resumida del estado operativo y financiero de la finca. Es la primera pantalla que ve el usuario al ingresar.
- **Detalle de Funcionalidades:**
    - **Indicadores Clave de Rendimiento (KPIs):** Cuatro tarjetas interactivas con datos vitales: `Lotes Totales`, `Ingresos Totales`, `Costos Productivos` (gastos directos en lotes productivos) y `Costos de Soporte` (gastos en infraestructura, administración y lotes no productivos).
    - **Próximas Labores:** Una lista de las tareas no finalizadas programadas para los próximos 7 días, permitiendo una planificación semanal rápida.
    - **Suite de Agentes IA (Analistas):** Tres asistentes especializados para el análisis de datos. A diferencia del Asistente de Comandos (que ejecuta órdenes), estos agentes analizan la información y entregan reportes:
        - **Analista de Anomalías:** Busca sobrecostos, retrasos o gastos inesperados.
        - **Auditor de Planificación:** Detecta inconsistencias lógicas, riesgos de seguridad laboral y omisiones en la planificación.
        - **Optimizador de Recursos:** Analiza la carga de trabajo y el inventario para sugerir reasignaciones o alertar sobre falta de insumos.
    - **Respaldo Completo:** Un botón para exportar todos los datos de la aplicación (unidades, lotes, sub-lotes, personal, labores, finanzas, etc.) a archivos CSV con un solo clic. **Esta es la póliza de seguridad del usuario**, permitiéndole tener una copia local de toda su información para tranquilidad y portabilidad.

### Gestión de Lotes (Unificado)
- **Función:** Módulo centralizado para la administración de todas las unidades productivas (fincas) y sus respectivos terrenos (lotes y sub-lotes), presentando la información en una vista jerárquica e intuitiva.
- **Detalle de Funcionalidades:**
    - **Gestión de Unidades Productivas:** Permite crear, editar y eliminar las fincas o centros de negocio del usuario.
    - **Gestión de Lotes por Unidad:** Cada lote se crea y visualiza dentro de su unidad productiva correspondiente.
    - **Tipos de Lote:** Permite crear lotes de tipo `Productivo` (ej. Café, Aguacate) o de `Soporte` (ej. Vías, Vivero, Acueducto), asegurando que los costos indirectos se separen de los de producción.
    - **Datos Técnicos Avanzados:** Registro de `Variedad`, `Tipo de Suelo`, `pH Promedio` y `Mortalidad Acumulada` para análisis agronómicos.
    - **Gestión de Sub-Lotes:** Capacidad de subdividir un lote principal en sub-lotes con sus propias características.
    - **Acciones Inteligentes por Lote:**
        - **Reporte de Rentabilidad:** Diálogo que calcula ingresos, costos y rentabilidad neta por lote.
        - **Agente Planificador:** Un asistente IA que genera un plan de labores para 12 meses basado en el tipo de cultivo y la fecha de siembra, consultando una base de conocimiento agronómico interna para garantizar recomendaciones profesionales y no improvisadas.

### Gestión de Colaboradores
- **Función:** Administra la información de los colaboradores de la finca.

### Gestión de Labores (Tareas)
- **Función:** Módulo para planificar, asignar y seguir el progreso de todas las actividades agrícolas.
- **Detalle de Funcionalidades:**
    - **Labores Recurrentes:** Al finalizar una labor marcada como recurrente, el sistema crea automáticamente la siguiente tarea en el calendario.
    - **Gestión de Insumos:** Permite planificar qué insumos se usarán y registrar el consumo real, descontando automáticamente del inventario.

### Gestión de Insumos (Inventario)
- **Función:** Controla el inventario de fertilizantes, pesticidas, herramientas y otros productos.

### Gestión Financiera
- **Función:** Módulo para el seguimiento de todos los movimientos de dinero.
- **Detalle de Funcionalidades:**
    - **Cierre Financiero Automático:** Al finalizar una labor, el sistema puede generar automáticamente un egreso por el costo de la mano de obra.

### Asistencia y Pre-Nómina
- **Función:** Módulo para la gestión de la asistencia del personal y el cálculo de pagos.
- **Detalle de Funcionalidades:**
    - **Generador de Pre-Nómina:** Calcula automáticamente el pago a realizar a cada colaborador basado en las labores finalizadas en un periodo.

### Calendario
- **Función:** Proporciona una vista cronológica de las labores programadas.

### Reportes y Análisis
- **Función:** Página dedicada a la visualización de datos y KPIs a través de gráficos interactivos.

### Autenticación y Seguridad de Datos
- **Función:** Gestiona el acceso del usuario y la persistencia de los datos.
- **Detalle de Funcionalidades:**
    - **Inicio de Sesión con Google:** Acceso seguro y rápido.
    - **Persistencia en la Nube:** Todos los datos se guardan de forma segura en Firestore, la base de datos en la nube de Google. La información está asociada al `userId` del usuario, no directamente a su email, garantizando que los datos son recuperables incluso si el usuario pierde acceso a su cuenta de correo.
    - **Modo Offline
# Optimizador de Labores Agrícolas

## 1. Título de la Obra
Optimizador de Labores Agrícolas

## 2. Descripción General
Software de tipo ERP (Planificación de Recursos Empresariales) diseñado específicamente para la gestión y optimización de fincas agrícolas. La aplicación funciona como una **Aplicación Web Progresiva (PWA)**, lo que le permite ser accesible desde cualquier navegador web y ser instalada en dispositivos móviles para una experiencia similar a una aplicación nativa, incluyendo la capacidad de funcionar sin conexión a internet.

Su objetivo principal es centralizar la información de la finca, facilitar la planificación de actividades, controlar costos y mejorar la toma de decisiones a través de la visualización de datos y análisis con inteligencia artificial.

## 3. Módulos y Funcionalidades Detalladas

### Panel Principal (Dashboard)
- **Función:** Proporciona una vista general y resumida del estado operativo y financiero de la finca. Es la primera pantalla que ve el usuario al ingresar.
- **Detalle de Funcionalidades:**
    - **Indicadores Clave de Rendimiento (KPIs):** Presenta cuatro tarjetas interactivas con datos vitales que se actualizan en tiempo real: `Lotes Totales`, `Costo Planificado`, `Costo Real` y `Eficiencia Promedio`.
    - **Gráfico de Inversión por Lote:** Un gráfico de barras que compara visualmente los costos planificados contra los costos reales para cada lote registrado, permitiendo identificar rápidamente desviaciones del presupuesto.
    - **Gráfico de Distribución de Labores:** Un gráfico de pastel que desglosa el número total de labores por categoría (Preparación, Siembra, Mantenimiento, Cosecha, Post-Cosecha).
    - **Detección de Anomalías con IA:** Una herramienta que utiliza IA (Gemini de Google) para analizar los datos de las labores en busca de sobrecostos, retrasos o ineficiencias, clasificando cada anomalía por severidad (Alta, Media, Baja).

### Unidad Productiva
- **Función:** Permite al usuario registrar y mantener un perfil detallado de su finca.
- **Detalle de Funcionalidades:** A través de un formulario, el usuario puede registrar datos maestros de la finca, incluyendo: nombre, ubicación, tipo de cultivo, variedad, condiciones ambientales, fechas clave y parámetros generales de siembra.

### Gestión de Lotes
- **Función:** Módulo para la administración de los terrenos de la finca.
- **Detalle de Funcionalidades:**
    - **Creación y Edición de Lotes:** Permite registrar lotes con información como nombre, área, fecha de siembra, densidad, distancia de siembra y notas técnicas.
    - **Gestión de Sub-Lotes:** Permite subdividir un lote principal en "sub-lotes" para manejar áreas no homogéneas, cada uno con sus propias características. La interfaz permite gestionar estos sub-lotes de forma anidada dentro de cada lote principal.
    - **Validación de Capacidad:** El sistema valida que el número de árboles no supere la capacidad máxima teórica del lote (Área x Densidad).
    - **Visualización y Búsqueda:** La tabla principal muestra datos clave y permite al usuario buscar lotes por su nombre.

### Gestión de Personal
- **Función:** Administra la información de los empleados de la finca.
- **Detalle de Funcionalidades:**
    - **Registro y Edición de Personal:** Permite añadir o actualizar información de los trabajadores (nombre, contacto, tipo de empleo, tarifa diaria).
    - **Detección de Duplicados:** El sistema previene la duplicidad de datos al verificar si ya existe un empleado con el mismo nombre o contacto.
    - **Filtro:** Permite filtrar la lista de personal por su tipo de empleo.

### Gestión de Labores (Tareas)
- **Función:** Módulo para planificar, asignar y seguir el progreso de todas las actividades agrícolas.
- **Detalle de Funcionalidades:**
    - **Programación de Labores:** Permite crear labores especificando tipo, categoría, lote, responsable, fechas de inicio/fin, y una "Fecha de Reingreso" para planificación recurrente.
    - **Cálculo Automático de Costos y Progreso:** El sistema calcula el `costo planificado` y el `costo real` se actualiza automáticamente según el estado de la labor.
    - **Estado Visual:** La tabla de labores utiliza insignias con colores e iconos para mostrar de forma clara el estado de cada tarea.

### Calendario
- **Función:** Proporciona una vista cronológica de las labores programadas.
- **Detalle de Funcionalidades:** Muestra un calendario mensual donde cada día resalta las labores asignadas. Permite la navegación entre meses y la creación de nuevas labores directamente desde esta vista.

### Autenticación y Modo Sin Conexión
- **Función:** Gestiona el acceso del usuario y la persistencia de los datos.
- **Detalle de Funcionalidades:**
    - **Inicio de Sesión y Perfil:** Permite el acceso con cuenta de Google y la gestión de un perfil de usuario.
    - **Modo Offline:** La aplicación es completamente funcional sin conexión. Los datos se guardan en el almacenamiento local del dispositivo.
    - **Sincronización Automática:** Al iniciar sesión, la aplicación detecta los datos locales y los sincroniza automáticamente con la cuenta del usuario en la nube (Firestore).

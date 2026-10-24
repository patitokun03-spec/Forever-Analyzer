# Historial de Cambios (Changelog)

Todos los cambios notables de TBC Duck Analyzer se documentan aquí.

## [2.0.0] - 2026-05-30

### ✨ Migración Full-Stack y Arquitectura
- **Backend en Node.js y Express** - Migración completa a un entorno backend con Node.js (`server.js`), reemplazando la estructura original de solo HTML estático.
- **Caché en SQLite** - Integración de base de datos local SQLite para guardar de forma segura y rápida las peticiones a WarcraftLogs. Esto reduce los tiempos de carga a cero y ahorra cuota de la API.
- **Variables de Entorno** - Las credenciales de WCL ahora se guardan de forma segura en el archivo `.env` del servidor en lugar de en el navegador del usuario.

### 🎨 Nuevas Funcionalidades e Interfaz
- **Uptime y Líneas de Tiempo (Timelines)** - Añadido un nuevo módulo altamente interactivo para trackear "Casts y Uptime".
- **Buffs Previos al Combate** - Nuevo analizador personalizado para el evento `combatantinfo` que inyecta los buffs previos al combate (ej. Battle Shout, Tótems) directamente en la línea de tiempo.
- **Sunder Armor y Devastate** - Implementado seguimiento detallado del debuff de armadura rota de los Guerreros y su recuento de casteos.
- **Windfury y Tótems** - Seguimiento optimizado para todos los rangos del Windfury Totem y contabilización exacta del uso del Rango 1.
- **Ingeniería** - Añadido seguimiento robusto para Dense Dynamite, Fel Iron Bombs, Sappers y Adamantite Grenades.
- **Limpieza Inteligente de Datos** - El sistema ahora borra los segmentos genéricos de "Raid" o "Environment" en la línea de tiempo cuando detecta objetivos reales, haciendo que la gráfica sea súper limpia.

---

## [1.2.1] - 2026-05-23

### 🐛 Solución de Errores y Mejoras
- **Seguimiento en encuentros con RP** - Ampliada la ventana de búsqueda de buffs iniciales hasta 3 minutos antes del comienzo. Soluciona un error crítico en peleas con mucho "Roleplay" inicial (ej. Kael'thas) donde se perdían los buffs.
- **Consumibles en Medio del Combate** - Ahora se trackean las Super Pociones de Maná, Sanación, Inyectores y todos los Tambores (Battle, Restoration, Speed, etc.) para asegurar que aparecen en la lista si se usan a mitad del boss.
- **Ordenación de Jugadores** - Mejorado el algoritmo que ordena a los jugadores en la interfaz: Primero por **Clase**, luego por **Especialización**, y finalmente de forma **Alfabética**.

---

## [1.2.0] - 2026-04-14

### ✨ Migración y Arquitectura
- **Proxy Local de Iconos** - El servidor ahora intercepta, descarga y guarda en caché los iconos de Wowhead para reducir drásticamente los tiempos de carga y el ancho de banda.
- **Soporte Docker** - Añadido `Dockerfile` y `docker-compose.yml` para poder desplegar fácilmente el proyecto en la nube o en red local.

### 🐛 Inspector de Equipo y Lógica
- **Validación Estricta de Encantamientos** - Reescrito el sistema que comprueba encantamientos para evitar falsos positivos de advertencia en cuello, camisa, cintura, anillos, abalorios y armas a distancia.
- **Prioridad de Encantamientos** - Ahora el cartel de "❌ Slacking" respeta si tienes un enchant permanente y no te obliga a tener piedras de afilar o aceites.

---

## [1.1.0] - 2026-04-06

### ✨ Rediseño de la Interfaz y del Inspector
- **Rediseño Completo del Inspector de Equipo** - Nuevo layout con un formato limpio de 2 columnas.
- **Traducción de Encantamientos** - Ahora los IDs de enchant se traducen al nombre real del encantamiento y se muestran sus estadísticas locales.
- **Optimización de Tooltips** - Los tooltips de Wowhead ya no bloquean la página al cargar.
- **Atajos de Teclado** - Añadido atajo con la tecla `Escape` para cerrar cualquier ventana emergente (modal) de forma rápida.

---

## [1.0.0] - 2026-04-05 - Lanzamiento Oficial

### ✨ Funciones iniciales
- **Análisis de Logs** - Analiza logs de combate de Warcraft Logs (TBC).
- **Consumibles** - Seguimiento de pociones, sappers, comida y encantamientos de armas.
- **Interrupciones** - Detección automática de cortes en combate.
- **Habilidades Raciales** - Rastrea usos de Arcane Torrent, Stoneform, War Stomp, etc.
- **Detección Automática de Specs** - Identifica la especialización de cada jugador.
- **Diseño Oscuro** - Interfaz moderna y adaptable.

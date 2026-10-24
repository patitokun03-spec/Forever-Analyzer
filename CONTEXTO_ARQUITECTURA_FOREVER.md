# 🛡️ WoW Forever Log Analyzer — Memoria Técnica y Arquitectura del Proyecto

Este documento resume el estado técnico, la arquitectura y las decisiones de diseño del proyecto **WoW Forever Log Analyzer**, adaptado desde la versión previa de TBC para el nuevo **World of Warcraft: Forever** (Classic+ Nivel 60, Beta Build 1.60).

---

## 📁 1. Estructura de Directorios

```
FOREVER/
├── database/
│   ├── schema.sql              # Definición de tablas SQLite
│   ├── seed_data.sql           # Dump SQL de datos base (habilidades, consumibles, enchants en inglés)
│   ├── seed.py / seed.js       # Scripts para regenerar la BD
│   └── build_pure_forever_catalog.py # Generador de datos y demo log
├── public/
│   ├── assets/
│   │   ├── icons/              # Caché local de iconos de Wowhead (JPG)
│   │   └── images/             # Fondo de pantalla WoW Forever (forever_bg.jpg)
│   ├── css/
│   │   └── styles.css          # Estilos globales (Tema Dark Fantasy, cache-busting v=3.1.0)
│   ├── images/
│   │   ├── forever_crest.jpg   # Blasón real de portada (dragón, grifo, corona)
│   │   ├── raid_summary.jpg    # Estandarte de guerra con hachas para Raid Summary
│   │   ├── log_chronicle.jpg   # Tomo de combate para crónicas
│   │   └── raid_roster.jpg     # Sello heráldico de banda
│   ├── js/
│   │   ├── main.js             # Punto de entrada único (ES Module)
│   │   ├── state.js            # Estado reactivo global de la aplicación
│   │   ├── api.js              # Llamadas al backend (/api/audit, /api/dps, etc.)
│   │   ├── gameData.js         # Consumo asíncrono del catálogo desde la API (/api/data/*) y TIMELINE_SPELLS
│   │   ├── utils.js            # Funciones auxiliares de formato y tiempo
│   │   ├── processor/          # Lógica de parseo y cálculo de combates modularizada
│   │   │   ├── index.js        # Re-exporta processPlayerData()
│   │   │   ├── combatantParser.js # Equipo, gemas, enchants y pre-pots (sin inyección espuria al timeline)
│   │   │   ├── deathTracker.js # Muertes y resurrecciones
│   │   │   ├── abilityTracker.js  # Habilidades, consumibles, sappers, kicks/interrupts (cast vs cut)
│   │   │   ├── timelineTracker.js # Cooldowns y procs limpios, deduplicados y aislados por jugador
│   │   │   └── classTracker.js # Habilidades por clase, debuffs, tótems y uptimes
│   │   └── ui/                 # Componentes visuales modularizados
│   │       ├── mainContent.js  # Orquestador y despachador de vistas
│   │       ├── playerView.js   # Vista individual detallada del jugador
│   │       ├── raidSummary.js  # Resumen general de banda ("All Players")
│   │       ├── sidebar.js      # Barras laterales de combates y lista de jugadores
│   │       ├── gearInspector.js# Modal e inspección de equipo
│   │       ├── castsDebuffPanel.js # Panel de lanzamientos y uptimes de debuffs
│   │       ├── timelinePanel.js    # Panel de líneas de tiempo unificado (sin hacks de Mongoose)
│   │       ├── discordModal.js # Modal de exportación a Discord Webhook
│   │       └── compareView.js  # Comparador de logs (desactivado por ahora)
│   ├── demo_log.json           # Log de prueba con 19 jugadores (2 por clase, 3 paladines) y 8500+ eventos
│   └── index.html              # HTML principal con cache-busting v=3.1.0 y stubs contra clics tempranos
├── scratch/
│   ├── build_rich_demo.py      # Script generador del log de prueba completo
│   └── test_timeline.py        # Suite de pruebas automatizadas del Fight Timeline
├── server.py                   # Servidor backend Python estándar (puerto 3000)
├── forever.sqlite              # Base de datos SQLite local
└── INICIAR_APP.bat             # Script de un solo clic para lanzar el servidor y abrir navegador
```

---

## ⚡ 2. Decisiones Clave y Estado de Módulos

### 1. Eliminación de `data.js`
- Ya no existe ningún archivo JS con catálogos estáticos en el cliente.
- Todo proviene de SQLite (`forever.sqlite`) a través de los endpoints `/api/data/classes`, `/api/data/abilities`, `/api/data/consumables`, `/api/data/enchants` y `/api/data/encounters`.
- Todos los nombres de habilidades, consumibles y clases están en **inglés**.

### 2. Sistema de Encantamientos (Verde / Amarillo / Rojo)
- Si una pieza no lleva encantamiento y puede llevarlo: **`Slacking`** en rojo.
- En la base de datos (`enchants`), las columnas `optimal_specs_best` y `optimal_specs_alt` almacenan arrays JSON de especializaciones.
- Como actualmente están vacíos, **todos los encantamientos se evalúan por defecto como "no óptimos / malos" y salen en rojo**, tal como solicitó el usuario. Cuando se configuren en el futuro, se pondrán en verde (`#4caf50`) o amarillo (`#f4b400`) automáticamente.

### 3. Icono de Thunderfury
- Actualizado a **`inv_sword_39`** en `demo_log.json` y en los generadores de datos. Cacheado en `public/assets/icons/inv_sword_39.jpg`.

### 4. Diferenciación de Cortes vs Casteos (Kick, Pummel, etc.)
- `abilityTracker.js` separa los eventos `cast` (lanzamiento de la habilidad) de los eventos `interrupt` (corte efectivo).
- En la vista individual: `x10 (7 cuts)` con tooltip explicativo.
- En el resumen de banda: ratio compacto `7/10` en color cian con tooltip descriptivo.

### 5. Identidad Visual y Limpieza de UI
- **Sin cajas anidadas:** Eliminado el marco exterior de clase en el resumen de raid; se conservan solo las tarjetas de jugador individuales y se eliminaron los recuadros en iconos de consumibles.
- **Sin expansión en hover:** Los nombres de consumibles y habilidades no se expanden pisando al icono contiguo ni oscurecen el fondo; usan tooltips nativos del navegador.
- **Identidad de 3 iconos diferenciados:**
  - `FOREVER LOGS` (barra lateral izquierda): Símbolo de infinito vectorial dorado (`∞`) con brillo ámbar.
  - `RAID SUMMARY` (cabecera central): Estandarte de guerra de banda (`raid_summary.jpg`).
  - `ALL` (lista de jugadores derecha): Icono clásico de banda de WoW (`spell_holy_prayerofspirit.jpg`).
  - Portada: Gran blasón heráldico con dragón y grifo (`forever_crest.jpg`).

### 6. Sistema de Fight Timeline (Totalmente Rehecho y Corregido)
- **Aislamiento estricto por jugador:** `timelineTracker.js` filtra estrictamente que el evento involucre al jugador (`ev.sourceID === player.id || ev.targetID === player.id`). Se eliminó al 100% la fuga entre jugadores (e.g. ya no aparece Death Wish ni Adrenaline Rush en el timeline de Anduin).
- **Eliminación de frascos y elixires pasivos:** Se retiraron de `TIMELINE_SPELLS` los frascos de 2 horas (Titans, Supreme Power, Distilled Wisdom, Chromatic Resist) y elixires de 1 hora (Mongoose, Giants, Greater Arcane, etc.). Además, se eliminó la inyección de auras de `combatantinfo` en `combatantParser.js`. La línea de tiempo está reservada exclusivamente para cooldowns de combate, abalorios activos y CDs externos.
- **Eliminación de barras dobles y barras infinitas:**
  - Se sincronizan los eventos `cast` y `applybuff` dentro de una ventana de 1000 ms, fusionándose en un solo intervalo.
  - Si un log no registra el evento `removebuff`, el intervalo queda acotado a la duración real del hechizo (`duration`) en lugar de estirarse al final de todo el combate.
  - Si el jugador muere durante el efecto, la barra se corta en el timestamp de su muerte.
- **Eliminación total del hack de Mongoose (28093):**
  - Se eliminaron las 45 líneas de código residual de TBC en `timelinePanel.js` que manejaban el doble proc de Mongoose y el overlay azul `#0055cc`.
  - La ID `28093` se restauró a su valor real de Vanilla Level 60: el abalorio *Eye of Diminution* de Kel'Thuzad (Naxxramas).
  - El apilamiento de barras cuando hay procs simultáneos ahora usa un algoritmo limpio y uniforme para todas las habilidades.
- **Soporte para CDs externos:**
  - Receptor: Muestra quién se lo otorgó, e.g. `Innervate (Broll)`, `Power Infusion (Anduin)`.
  - Lanzador: Muestra a quién se lo otorgó, e.g. `Power Infusion (Jaina)`.
- **Habilidades instantáneas:** Tienen una duración configurada de 5000 ms para renderizarse de forma visible como marcadores de activación en lugar de ser invisibles con 0 ms de ancho.

---

## 📌 3. Para Continuar en Próximas Sesiones
- Mantener siempre la separación de datos en SQLite / SQL.
- Si se reactiva el comparador de logs ("Compare Logs"), rediseñarlo desde cero para que sea intuitivo y consuma los nuevos módulos.
- Para marcar encantamientos óptimos por spec, actualizar la tabla `enchants` en SQLite (`optimal_specs_best` y `optimal_specs_alt`).
- Para nuevas habilidades en el timeline, añadirlas únicamente a `TIMELINE_SPELLS` en `public/js/gameData.js` indicando su duración en milisegundos (`duration`).

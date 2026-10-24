# 🔍 WoW Forever Log Analyzer (ES)

Una herramienta profesional para analizar logs de combate de **World of Warcraft Classic / Forever (Classic+)** desde **WarcraftLogs**. Proporciona una vista exhaustiva e interactiva de los consumibles, buffs, interrupciones, uptime de debuffs, equipo y habilidades por jugador.

![Version](https://img.shields.io/badge/Version-3.1.0-blue)
![Python](https://img.shields.io/badge/Python-3.10+-yellow)
![Database](https://img.shields.io/badge/SQLite-Native-green)

## ✨ Características

- 📊 **Análisis detallado de logs** - Visualiza consumibles, frascos, elixires, comida y encantamientos de armas.
- ⏱️ **Líneas de tiempo interactivas** - Ve exactamente en qué milisegundo los jugadores usaron sus CDs principales, abalorios, raciales y consumibles en combate.
- 🎯 **Seguimiento de Uptime** - Tracking preciso de buffs vitales de raid (Tótems, Battle Shout) y debuffs cruciales en el boss (Sunder Armor, Faerie Fire, Curses, Sentencias).
- ⚡ **Registro de Interrupciones** - Detecta automáticamente cuándo cada jugador lanzó e interrumpió casteos enemigos.
- 🔍 **Inspector de Equipo y Encantamientos** - Revisa el equipo exacto (incluyendo equipo custom de WoW Forever) y audita encantamientos permanentes y temporales.
- 💾 **Backend Python + SQLite Nativo** - Utiliza `server.py` (librería estándar de Python) con catálogo relacional y caché en `forever.sqlite`.

## 🚀 Inicio Rápido

1. Asegúrate de tener instalado [Python 3.10+](https://www.python.org/).
2. Copia `.env.example` a `.env` e introduce tus credenciales de Warcraft Logs API v2:
   ```env
   WCL_CLIENT_ID=tu_client_id_aqui
   WCL_CLIENT_SECRET=tu_client_secret_aqui
   PORT=3000
   ```
3. Inicializa la base de datos local desde `database/seed_data.sql`:
   ```bash
   python database/seed.py
   ```
4. Arranca el servidor ejecutando `python server.py` (o haciendo doble clic en `INICIAR_APP.bat`).
5. Abre `http://localhost:3000` en tu navegador web.

## 📚 Documentación adicional

- [SETUP.md](SETUP.md) - Guía detallada de configuración e instalación.
- [Investigación de Habilidades y Consumibles](../research_spells_consumibles.md) - Referencia completa de Spell IDs e Item IDs por rol, clase y spec en WoW Forever.
- [CHANGELOG.md](../../CHANGELOG.md) - Historial de versiones del proyecto.

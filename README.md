# 🛡️ WoW Forever Log Analyzer

**High-performance combat log analyzer for World of Warcraft: Forever (Classic+ Level 60). Track consumables, cooldown timelines, rotational casts, raid-wide boss debuffs, interrupts, and gear enchants per player with a zero-dependency Python 3 + SQLite backend.**

---

## 📚 Documentation

- **[Logical Architecture & Modules](docs/LOGICAL_ARCHITECTURE_AND_MODULES.md)** — Authoritative technical specification
- **[Arquitectura y Contexto (ES)](CONTEXTO_ARQUITECTURA_FOREVER.md)** — Memoria técnica en español
- **[English Docs](docs/en/README.md)** | **[Setup Guide](docs/en/SETUP.md)**
- **[Documentación en Español](docs/es/README.md)** | **[Guía de Instalación](docs/es/SETUP.md)**
- **[Changelog](CHANGELOG.md)** — Version history

---

## ✨ Key Features

- 📊 **Detailed Log Analysis:** Extracts combat events from Warcraft Logs v2 GraphQL API with local SQLite caching (`forever.sqlite`).
- ⚡ **Zero-Dependency Native Backend:** Standard library Python 3 HTTP server (`server.py`) with native `sqlite3` catalog & cache.
- 🎯 **Consumables & Buffs Compliance:** Audits Flasks, Battle/Guardian Elixirs, Food buffs, Weapon Oils/Stones, Potions, Healthstones, and Engineering explosives.
- ⏱️ **Isolated Fight Timelines:** Gantt chart of personal cooldowns, active trinket procs, and external cooldowns (`Innervate`, `Power Infusion`, `Blessing of Protection`, `Bloodlust`).
- 🛡️ **Casts & Raid Support Uptime:** Rotational cast counter with low-rank detection, per-target debuff uptimes, and raid-wide boss debuff / party buff tracking.
- 🔍 **Gear Inspector:** 16-slot equipment inspector with 3-tier enchant validation.

---

## 🚀 Quick Start

1. Clone this repository.
2. Initialize the local SQLite database from the SQL seed:
   ```bash
   python database/seed.py
   ```
3. Copy `.env.example` to `.env` and add your Warcraft Logs v2 API credentials (`WCL_CLIENT_ID` and `WCL_CLIENT_SECRET`).
4. Start the server:
   ```bash
   python server.py
   ```
   *(On Windows, you can also double-click `INICIAR_APP.bat`)*
5. Open `http://localhost:3000` in your browser.

---

## 📝 License

MIT License - See [LICENSE](LICENSE)

# 🔍 WoW Forever Log Analyzer (EN)

A professional tool to analyze **World of Warcraft Classic / Forever (Classic+)** combat logs from **WarcraftLogs**. It provides a comprehensive, interactive view of consumables, buffs, interrupts, debuff uptimes, gear, and abilities per player.

![Version](https://img.shields.io/badge/Version-3.1.0-blue)
![Python](https://img.shields.io/badge/Python-3.10+-yellow)
![Database](https://img.shields.io/badge/SQLite-Native-green)

## ✨ Features

- 📊 **Detailed Log Analysis** - View consumables, flasks, elixirs, food, and weapon enchants.
- ⏱️ **Interactive Timelines** - See exactly when players used their major cooldowns, trinkets, racials, and in-combat consumables.
- 🎯 **Uptime Tracking** - Precise tracking of vital raid buffs (Totems, Battle Shout) and boss debuffs (Sunder Armor, Faerie Fire, Curses, Judgements).
- ⚡ **Interrupts Tracking** - Automatically detects when players cast and landed interrupts on enemy spellcasts.
- 🔍 **Gear & Enchant Inspector** - View the exact gear (including WoW Forever custom items) and audit permanent and temporary enchants.
- 💾 **Native Python + SQLite Backend** - Powered by `server.py` (Python standard library) with relational catalog and log caching in `forever.sqlite`.

## 🚀 Quick Start

1. Ensure you have [Python 3.10+](https://www.python.org/) installed.
2. Copy `.env.example` to `.env` and insert your Warcraft Logs API v2 credentials:
   ```env
   WCL_CLIENT_ID=your_client_id_here
   WCL_CLIENT_SECRET=your_client_secret_here
   PORT=3000
   ```
3. Initialize the local SQLite database from `database/seed_data.sql`:
   ```bash
   python database/seed.py
   ```
4. Start the server by running `python server.py` (or double-clicking `INICIAR_APP.bat`).
5. Open `http://localhost:3000` in your web browser.

## 📚 Documentation

- [SETUP.md](SETUP.md) - Detailed setup and installation guide.
- [Abilities & Consumables Research (ES)](../research_spells_consumibles.md) - Complete reference of Spell IDs and Item IDs per role, class, and spec in WoW Forever.
- [CHANGELOG.md](../../CHANGELOG.md) - Project version history.

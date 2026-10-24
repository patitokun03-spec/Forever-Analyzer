# Forever Analyzer

Combat log analyzer for World of Warcraft Classic (1.12) and WoW Forever (Classic+). It connects to the Warcraft Logs v2 GraphQL API to inspect raid consumables, buff uptimes, cooldown timelines, interrupts, dispels, deaths, and player gear.

## Features

- Consumable and pre-buff tracking (flasks, elixirs, potions, healthstones, runes, weapon buffs, engineering items).
- Class and spec ability tracking, including custom WoW Forever spells and tier set bonuses.
- Boss debuff and raid buff uptime timelines.
- Interrupt, dispel, and resurrection tracking per fight or across the full report.
- Gear and enchant inspector based on `CombatantInfo` events.
- Local SQLite database (`forever.sqlite`) for catalog data and report caching, served by `server.py`.

## Quick Start

1. Install Python 3.10 or newer.
2. Copy `.env.example` to `.env` and set your Warcraft Logs v2 client credentials:
   ```env
   WCL_CLIENT_ID=your_client_id_here
   WCL_CLIENT_SECRET=your_client_secret_here
   PORT=3000
   ```
3. Initialize the SQLite database:
   ```bash
   python database/seed.py
   ```
4. Start the server:
   ```bash
   python server.py
   ```
5. Open `http://localhost:3000` in your browser.

## Documentation

- [SETUP.md](SETUP.md) - Installation and configuration guide.
- [CHANGELOG.md](CHANGELOG.md) - Version history.
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines.

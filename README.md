# Forever Analyzer

Combat log analyzer for World of Warcraft Classic (1.12) and WoW Forever (Classic+). It connects to the Warcraft Logs v2 GraphQL API and provides an interface to inspect raid consumables, buff uptimes, cooldown timelines, interrupts, dispels, deaths, and player equipment.

## Project Status

This project is built on top of my earlier [TBC Duck Analyzer](https://github.com/patitokun03-spec/TBC-Duck-Analyzer) and has been adapted to run on a local Python + SQLite stack for Classic 60 and WoW Forever.

Please keep in mind that this version is still a work in progress:
- Since it was migrated and reworked from the previous analyzer, you may still run into occasional bugs or edge cases during log parsing.
- The project is not yet complete because a significant portion of WoW Forever's final game data (custom spells, talent changes, item IDs, and raid mechanics) is still undocumented or subject to change. As more information from the game becomes available, the database catalog and class trackers will be updated accordingly.

## Features

- Consumable and pre-buff tracking (flasks, battle/guardian elixirs, potions, healthstones, runes, weapon buffs, engineering items).
- Class and spec ability tracking, including known custom WoW Forever spells and tier set bonuses.
- Boss debuff and raid buff uptime timelines.
- Interrupt, dispel, and resurrection breakdown per fight or across an entire raid report.
- Gear and enchant inspector based on `CombatantInfo` events.
- Local SQLite database (`forever.sqlite`) for game catalog data and report caching, served by a lightweight Python HTTP server with no external dependencies.

## Requirements

- Python 3.10 or newer
- Warcraft Logs API v2 client credentials (`Client ID` and `Client Secret` from [warcraftlogs.com/api/clients](https://www.warcraftlogs.com/api/clients))

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/patitokun03-spec/Forever-Analyzer.git
   cd Forever-Analyzer
   ```

2. Copy `.env.example` to `.env` and add your Warcraft Logs API credentials:
   ```env
   WCL_CLIENT_ID=your_client_id_here
   WCL_CLIENT_SECRET=your_client_secret_here
   PORT=3000
   ```

3. Initialize the local SQLite database from `database/seed_data.sql`:
   ```bash
   python database/seed.py
   ```

4. Start the local server:
   ```bash
   python server.py
   ```
   On Windows, you can also run `start_server.bat`.

5. Open `http://localhost:3000` in your browser. If you want to test the interface without API credentials, enter `demo` in the report search bar.

## Project Structure

```text
Forever-Analyzer/
├── server.py                # Local HTTP server and Warcraft Logs GraphQL v2 proxy
├── start_server.bat         # Windows startup script
├── database/
│   ├── schema.sql           # SQLite relational schema
│   ├── seed_data.sql        # Catalog dump (classes, specs, spells, items, enchants, raids)
│   └── seed.py              # Script to build forever.sqlite from seed_data.sql
├── public/
│   ├── index.html           # Main single-page application
│   ├── demo_log.json        # Sample raid report for offline testing
│   ├── css/styles.css       # Stylesheet
│   ├── js/                  # Frontend parser, trackers, and UI modules
│   └── assets/icons/        # Cached spell and item icons
└── docs/                    # Setup and architecture notes
```

## License

MIT License. See [LICENSE](LICENSE) for details.

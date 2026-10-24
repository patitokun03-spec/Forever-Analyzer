# Changelog

## [3.1.0] - 2026-10-24

### Added
- Imported official Wowhead Forever (`wowhead.com/forever`) catalog into `database/seed_data.sql` (`1,533` abilities, `1,046` consumables, `331` enchants, `1,031` equipment items, `11` raid zones).
- Added support for custom WoW Forever spells (`1210000+`), backported class abilities (`Holy Strike`, `Hand of Reckoning`, `Seal of Fury`, `Intervene`, `Shadow Word: Death`, `Totemic Recall`, `Revive`, `Call of the Elements`, `Carve`, `Lacerate`, `Earth Shield`, `Ice Lance`, `Incinerate`, `Unstable Affliction`, `Seed of Corruption`, `Mangle`), and custom Forever potions, elixirs, food, and engineering explosives.
- Added `start_server.bat` to automatically initialize `forever.sqlite` from `database/seed_data.sql` when missing.

### Changed
- Cleaned foreign key references in `abilities` (`class_id`) and ensured every catalog entry has a valid icon.
- Resolved ID collisions between low-level consumable items and class spell IDs in `BUFF_DB`.

---

## [3.0.0] - 2026-03-19

### Added
- Native Python HTTP backend (`server.py`) with SQLite relational catalog (`forever.sqlite`) and Warcraft Logs GraphQL v2 caching.
- Boss debuff and party/raid buff uptime tracker (`raidDebuffTracker.js` and `raidSupportPanel.js`).
- Per-target debuff uptime timelines and rotational cast counters (`classTracker.js` and `castsDebuffPanel.js`).
- Side-by-side player and report comparison view (`compareView.js`).
- Offline demo mode (`public/demo_log.json`).

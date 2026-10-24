# Changelog

All notable changes to TBC Duck Analyzer are documented here.

## [2.0.0] - 2026-05-30

### ✨ Full-Stack Migration & Architecture
- **Node.js Express Backend** - Migrated to a Node.js express backend (`server.js`) replacing pure static HTML structure.
- **SQLite Caching** - Integrated local SQLite database to securely cache GraphQL WCL requests, drastically reducing load times and API quota usage.
- **Environment Variables** - WCL credentials securely handled via `.env` files instead of client-side local storage.

### 🎨 Features & UI
- **Uptime & Timelines** - Added highly interactive Casts & Uptime tracking module.
- **Pre-Combat Buff Tracking** - Custom `combatantinfo` parser injects pre-combat buffs (e.g. Battle Shout, Totems) seamlessly into the timelines.
- **Sunder Armor & Devastate** - Implemented detailed tracking for Warrior armor debuffs and cast counts.
- **Windfury & Totem Tracking** - Combined Windfury ranks for clean timeline tracking, and enabled exact Rank 1 cast counting.
- **Engineering Tracking** - Added robust tracking for Dense Dynamite, Fel Iron Bombs, Sappers, and Adamantite Grenades.
- **Dynamic Fallbacks** - Smart fallback handling removes generic "Raid" or "Environment" timeline segments when real application events exist.

---

## [1.2.1] - 2026-05-23

### 🐛 Bug Fixes & Improvements
- **RP Encounter Buff Tracking** - Expanded the `combatantinfo` search window up to 3 minutes prior to combat start. Fixes a critical issue where long RP fights (e.g., Kael'thas) would discard all initial buffs and gear data on wipes.
- **In-Combat Consumables Tracker** - Added tracking for Super Mana Potions, Super Healing Potions, Injectors, and all types of Drums (Battle, Restoration, Speed, War, Panic) to ensure they appear under Consumables & Buffs when used mid-fight (especially post-resurrection).
- **Player Sorting Logic** - Upgraded the player sorting algorithm in the UI. Characters are now cleanly grouped by **Class**, then by **Specialization**, and finally sorted **Alphabetically**.

---

## [1.2.0] - 2026-04-14

### ✨ Full-Stack Migration & Architecture
- **Local Proxy for Assets** - Server now intelligently intercepts, caches, and serves Wowhead icons via `/api/icon/` endpoints to radically reduce load times and bandwidth.
- **Docker Support** - Packaged backend application using `Dockerfile` and `docker-compose.yml` for unified, consistent local testing and cloud environment rollouts.

### 🐛 Gear Inspector & Logic Fixes
- **Strict Enchant Validation Matrix** - Re-engineered enchantment tracking matrix. Prevents false-negative warnings on Neck, Shirt, Waist, Rings, Trinkets, and Ranged.
- **Enchant Priority Logic** - "❌ Slacking" warning now accurately respects the precedence of permanent enchants over temporary enchantments like oils or stones.
- **Off-hand Weapon Validation** - Reworked rules conditionally targeting item sub-types. Enchants strictly validated only when dealing with genuine shields or standard weapons.
- **UI Grid Perfection** - Addressed flexbox margin desyncs linking paperdoll spacing cleanly with armor container titles.

---

## [1.1.0] - 2026-04-06

### ✨ UI & Gear Inspector Redesign
- **Complete Gear Inspector Overhaul** - Expanded layout with a clean 2-column grid.
- **TBC Enchantment Details** - Automatic mapping of TBC Enchant IDs to readable names + localized stats.
- **Weapon Enchant Grouping** - Permanent enchants strictly excluded from consumables tracker.
- **Optimized Tooltips** - Deferred Wowhead tooltip loading (0 lag spike on inspect), strict CSS clipping, and prevented accidental hover on text.
- **Refined Paperdoll** - Responsive 2D stickman SVG mathematically bound to exact slot coordinates.
- **Hotkeys** - Added `Escape` key listener to seamlessly close all active overlays/modals.

---

## [1.0.0] - 2026-04-05 - Official Release

### ✨ Features
- **Log Analysis** - Analyze World of Warcraft TBC combat logs from Warcraft Logs
- **Consumables Tracking** - Track potions, sappers, food buffs, and weapon enchants per player
- **Interrupt Detection** - Automatically detect interrupt abilities used in combat
- **Racial Abilities** - Track racial ability usage (Arcane Torrent, Stoneform, War Stomp, etc.)
- **Auto Spec Detection** - Automatically identify player specialization
- **Interactive UI** - Dark theme with modern, responsive design

---

## Versioning Format

This project follows [Semantic Versioning](https://semver.org/)

- **MAJOR** - Incompatible changes (new API, structure)
- **MINOR** - New features (backwards compatible)
- **PATCH** - Bugs and fixes

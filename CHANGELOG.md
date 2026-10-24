# Changelog

All notable changes to WoW Forever Log Analyzer are documented here.

## [3.2.0] - 2026-09-20

### 🛡️ Raid Support, Debuff Tracking & Flat UI Redesign
- **Raid Support Tracker (`raidDebuffTracker.js`)** - Tracks 18 Classic 60 boss debuffs across the entire raid (Sunder Armor, Faerie Fire, Curses, Judgements, Scorch, Winter's Chill, Shadow Weaving, Stormstrike, Nightfall, Annihilator) and 16 party/raid buffs (Blessings, Auras, Shaman Totems, Fortitude, MotW, AI, Bloodlust).
- **Raid Support Panel (`raidSupportPanel.js`)** - Integrated dual sub-tabs `[ 🎯 Personal Uptime ]` and `[ 🛡️ Raid Support ]` in the Casts/Uptime view. Allows viewing all boss debuffs applied by the raid, along with uptime percentages, application counts, and contributing players.
- **Encounter Debuffs Overview** - Added compact `🛡️ Active Boss Debuffs` bar to the Raid Summary view for single-encounter fights.
- **Sidebar & Container Flat Styling** - Removed heavy box borders and backgrounds from `.fight-item` and `.player-item` (transparent by default, subtle hover, and golden left accent border on active).
- **Subtle Border Radii** - Replaced excessive rounded corners (8px/10px/12px) with clean, minimal 2px to 4px across UI containers, buttons, and chips.
- **Raid Encounter Grouping** - Grouped boss encounters in the left sidebar by raid instance (Molten Core, Onyxia, Blackwing Lair, Zul'Gurub, Temple of Ahn'Qiraj, Ruins of Ahn'Qiraj, Naxxramas).

## [3.1.0] - 2026-09-20

### ⏱️ Fight Timeline Complete Overhaul
- **Strict Player Event Ownership** - Cooldowns and active procs are now filtered strictly by player participation (`ev.sourceID === player.id || ev.targetID === player.id`). Completely resolved cross-player cooldown bleeding (e.g. Priests no longer see Warrior Death Wish or Rogue Adrenaline Rush).
- **Consumable Segregation** - Removed 2-hour Flasks and 1-hour Elixirs from `TIMELINE_SPELLS` and removed spurious `combatantinfo` aura injection. Consumables remain tracked in the Consumables & Buffs panel.
- **Double & Infinite Bar Fix** - Deduplicated `cast` and `applybuff` events occurring within 1000ms. Capped unclosed buff intervals to the ability's actual duration (`duration`) rather than stretching to the full fight duration.
- **Mongoose TBC Hack Purge** - Removed 45 lines of legacy TBC Mongoose double-proc stacking and `#0055cc` overlay logic. Restored spell `28093` as Classic Naxxramas trinket *Eye of Diminution*.
- **External Cooldown Labeling** - Dynamic labeling for external cooldowns: recipients see caster name (e.g. `Innervate (Broll)`), casters see recipient name (e.g. `Power Infusion (Jaina)`).
- **Expanded Demo Log** - Generated rich 19-player raid demo (`demo_log.json`) with rotations, interrupts, and cooldowns across all 9 classes.

## [3.0.0] - 2026-09-19

### 🛡️ Full Migration to WoW Forever (Classic Level 60)
- **Database-Driven Architecture** - Replaced static client-side `data.js` with local SQLite database (`forever.sqlite`) and SQL dump (`seed_data.sql`), served via `/api/data/*`.
- **Modular Processor & UI** - Split monolithic `processor.js` (729 lines) and `mainContent.js` (667 lines) into clean, specialized ES modules under `public/js/processor/` and `public/js/ui/`.
- **Visual Identity & Theme** - Replaced TBC duck branding with WoW Forever dark fantasy aesthetic: vector infinity brand mark (`∞`), War Standard for Raid Summary, and high-res crest.
- **Kick & Interrupt Ratio** - Differentiated ability casts from actual successful interrupts (`x10 (7 cuts)` and `7/10`).
- **Enchants Evaluation** - Configured 3-tier enchant auditing system (defaulting to red until spec preferences are populated in SQLite).

## [2.1.0] - 2026-06-14

### ✨ Compare Logs & UI Improvements
- **Compare Logs Module** - Implemented a new "Compare Logs" functionality allowing side-by-side comparison of two logs.
- **Collapsible Sections** - Comparison table sections (Consumables, Buffs, Abilities & Spells) can now be collapsed for cleaner viewing.
- **Smart Spell Grouping** - Abilities in the comparison view are now intelligently sorted: Trinkets first, then Totems/Heroism, then Shocks, and finally remaining spells alphabetically.
- **Accurate Role Filtering** - Fixed an issue where the role filter (e.g. "Healer") incorrectly matched all players of certain classes regardless of their actual talent spec.
- **Curse Uptime Mapping** - Added normalization logic to correctly match WCL's "Curse Elements" and "Curse Recklessness" with internal database names to accurately calculate debuff uptime.
- **Sapper Tracking** - Reclassified TBC Sappers from generic "Abilities" into the "Consumables" section for better logical grouping.
- **Timeline UI Tweaks** - Improved the timeline visuals by removing background boxes to make them blend seamlessly, and implemented synchronized scrolling logic for side-by-side comparison.


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

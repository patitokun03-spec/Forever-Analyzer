# WoW Forever Log Analyzer — Logical Architecture & Module Specification

> [!IMPORTANT]
> This document is the **authoritative reference** for the logical behavior, data flow, and design goals of the **WoW Forever Log Analyzer** (World of Warcraft: Forever, Classic+ Level 60).
> 
> Future AI assistants and developers: **Do NOT assume existing code is intended behavior if it contradicts this document.** Any code deviating from the specifications below is a bug to be fixed, not a legacy design to preserve.

---

## 1. Project Mission & Core Philosophy

**WoW Forever Log Analyzer** is a high-performance, browser-based combat log analyzer built specifically for **World of Warcraft: Forever** (Classic+ Level 60).

### Key Architectural Principles:
1. **Classic 60 & Forever Focused**:
   - All spell IDs, talent calculations, abilities, consumables, and enchants reflect Classic 1.12 and WoW Forever (Classic+ Level 60).
   - Non-Classic expansion mechanics and spell ranks are excluded.
2. **English-Only Catalog & Code**:
   - All code, comments, documentation, and database entries are strictly in **English**.
3. **Zero-Build Native Architecture**:
   - Backend: Python 3 Standard Library server (`server.py`) on port 3000 with SQLite (`forever.sqlite`). No Node.js or npm dependencies required.
   - Frontend: Native ES6 JavaScript modules with clean modular separation.
4. **Data Isolation & Correctness**:
   - Player timelines and stats are strictly isolated per player. Cross-player bleeding (such as showing another player's procs or raid-wide buffs on an individual timeline) is considered a critical bug.

---

## 2. System Architecture & Component Map

```
┌────────────────────────────────────────────────────────────────────────┐
│                          Backend (Python 3)                            │
│  server.py (Port 3000)                                                 │
│  ├── /api/data        -> Queries forever.sqlite (Spells, Buffs, Items) │
│  ├── /api/dps         -> Fetches player DPS from WCL GraphQL           │
│  ├── /api/report      -> Fetches full report data & events from WCL    │
│  └── /api/icon/<name> -> Serves / caches icons from Wowhead            │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ HTTP / JSON
┌──────────────────────────────────▼─────────────────────────────────────┐
│                          Frontend (ES6 Modules)                        │
│                                                                        │
│  public/js/main.js (Application Bootstrap & Global Routing)            │
│  ├── state.js (Reactive Global State)                                  │
│  ├── gameData.js (Catalog & Configuration Constants)                   │
│  │                                                                     │
│  ├── processor/ (Combat Data Processing Engine)                        │
│  │   ├── index.js           -> Coordinates player parsing & caching    │
│  │   ├── combatantParser.js -> Gear, Enchants, Gems, Temp Enchants     │
│  │   ├── abilityTracker.js  -> Tracked abilities, damage, interrupts   │
│  │   ├── timelineTracker.js -> Major cooldowns & procs timeline       │
│  │   ├── classTracker.js    -> Spammable casts & per-target debuffs    │
│  │   └── deathTracker.js    -> Death and resurrection timestamps       │
│  │                                                                     │
│  └── ui/ (View Components)                                             │
│      ├── mainContent.js      -> Orchestrates active view rendering     │
│      ├── raidSummary.js      -> All Players view & role filters        │
│      ├── playerView.js       -> Player overview, buffs & ability grid  │
│      ├── gearViewer.js       -> Inspect Gear (16 equipment slots)      │
│      ├── timelineViewer.js   -> Fight Timeline (buff/proc windows)     │
│      ├── castsDebuffPanel.js -> Cast Counts & Target Debuff Uptimes    │
│      └── compareView.js      -> Side-by-side log comparison            │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Processing Layer (`public/js/processor/`)

The processor parses raw Warcraft Logs (WCL) event streams into structured player data. To maintain high performance, `processPlayerData` caches results in `state.processedPlayerCache[fightId_playerId]`.

### 3.1. `index.js`
- Entry point for combat log analysis.
- Maps actor IDs to names using `state.currentActors` and `report.masterData.actors`.
- Resolves player spec and executes each sub-tracker sequentially.

### 3.2. `combatantParser.js`
- Parses `combatantinfo` events to extract:
  - **Gear & Enchants**: 16 equipment slots (Head, Neck, Shoulders, Back, Chest, Wrists, Hands, Waist, Legs, Feet, Ring 1, Ring 2, Trinket 1, Trinket 2, Main Hand, Off Hand/Ranged).
  - **Temporary Enchants**: Windfury, Sharpening Stones, Mana Oils, Wizard Oils.
  - **Active Auras**: Initial buffs present at combat start.

### 3.3. `abilityTracker.js`
- Analyzes `cast` and `damage` events to record:
  - Cast count, hit count, critical strike count, and total damage.
  - **Interrupts**: Successful counterspells/pummels/kicks are tracked and displayed (e.g. `x4 (3 cuts)`).

### 3.4. `deathTracker.js`
- Analyzes `death` and resurrection events (`cast` / `applybuff` for Rebirth, Soulstone, etc.).
- Computes relative timestamps (`death at 1:45`) and resurrection types.

### 3.5. `timelineTracker.js` (Fight Timeline)
- **Purpose**: Tracks active uptime windows of major temporary boosts:
  1. **Major Personal Cooldowns**: Death Wish, Recklessness, Shield Wall, Arcane Power, Adrenaline Rush, Blade Flurry, Bestial Wrath, etc.
  2. **Active Trinkets & Procs**: Slayer's Crest, Kiss of the Spider, Earthstrike, Badge of the Swarmguard, Diamond Flask, Mind Quickening Gem, etc.
  3. **Potions**: Limited Invulnerability Potion (LIP), Mighty Rage Potion, Free Action Potion (FAP), Major Mana Potion, etc.
  4. **External Cooldowns Given to the Player**: Power Infusion, Innervate, Blessing of Protection, Bloodlust/Heroism.
- **Strict Isolation Rules**:
  - Only events where `targetID === player.id` (or personal self-buffs cast by `sourceID === player.id`) are included.
  - **Never** include static or permanent raid buffs (Flask of the Titans, Elixir of the Mongoose, Arcane Brilliance, Mark of the Wild). Those belong exclusively in the "Consumables & Buffs" header section.

### 3.6. `classTracker.js` (Casts & Debuff Uptime)
- **Purpose**: Tracks rotational spammable casts and debuff/buff uptimes across targets.
- **Cast Counts**:
  - Counts rotational abilities **without cooldown** (e.g., Heroic Strike, Cleave, Sunder Armor, Backstab, Sinister Strike, Shadow Bolt, Frostbolt, Fireball, Shred, etc.).
  - Abilities with cooldowns are tracked in `abilityTracker.js` and displayed in the main Abilities grid.
  - Detects and warns about sub-optimal spell ranks (e.g., using Rank 1 Frostbolt instead of max rank).
- **Per-Target Debuff/Buff Uptime**:
  - **Friendly Buffs**: Short-duration buffs applied by the player to self or allies (e.g. Battle Shout, Slice and Dice).
  - **Enemy Debuffs**: Debuffs applied to enemies (e.g. Sunder Armor, Demoralizing Shout, Thunder Clap, Faerie Fire, Rupture, Corruption, Curse of Elements/Shadow/Recklessness, Winter's Chill, Improved Scorch).
  - **Target Lifespans & Death Markers**:
    - Calculates target lifespan based on combat start, first event, and death timestamp.
    - Accurately trims debuff uptime when the target dies.
    - Generates target death events for visual rendering.

### 3.7. `raidDebuffTracker.js` (Raid Support Tracker)
- **Purpose**: Tracks raid-wide boss debuffs applied across the entire raid and party/raid buffs received.
- **Tracked Boss Debuffs**:
  - Armor Reduction: Sunder Armor, Faerie Fire, Curse of Recklessness, Expose Armor, Annihilator.
  - Spell Vulnerability: Curse of the Elements, Curse of Shadow, Improved Scorch, Winter's Chill, Shadow Weaving, Stormstrike, Nightfall.
  - Paladin Judgements: Judgement of Wisdom, Judgement of Light, Judgement of the Crusader.
  - Mitigation: Demoralizing Shout, Demoralizing Roar, Thunder Clap.
- **Tracked Party & Raid Buffs**:
  - Paladin Blessings: Might, Kings, Salvation, Wisdom, Light.
  - Auras: Leader of the Pack, Trueshot Aura, Moonkin Aura, Battle Shout.
  - Shaman Totems: Windfury Totem, Grace of Air Totem.
  - Raid Buffs: Power Word: Fortitude, Mark of the Wild, Arcane Intellect, Shadow Protection, Bloodlust.
- **Aggregation & Metrics**:
  - Merges overlapping uptime segments across multiple appliers.
  - Computes total applications and per-source contribution breakdown.

---

## 4. UI Layer & Component Specifications (`public/js/ui/`)

### 4.1. Header & Navigation Controls
- **Fight Selector (Left Sidebar)**:
  - Boss encounters grouped under raid instance headers (Molten Core, Onyxia, Blackwing Lair, Zul'Gurub, Temple of Ahn'Qiraj, Ruins of Ahn'Qiraj, Naxxramas).
  - Includes an **"Overall"** fight option aggregating combat across all encounters.
- **Player Selector (Right Sidebar)**:
  - Lists raid members grouped by class with class color styling.
  - Top entry is **"All Players"** for raid summary.
- **Role Filters**:
  - Filter pills: `All`, `Tanks`, `Healers`, `Melee DPS`, `Ranged DPS`.
  - **Feral Druid Handling**: Feral Druids (e.g., Malfurion) dynamically qualify as **both Tank and Melee DPS** based on bear/cat form usage, gear, and abilities. They must never disappear when filtering by Tank or Melee DPS.

### 4.2. Raid Summary (`raidSummary.js`)
- Rendered when `playerName === '__ALL__'`.
- Shows a comprehensive table of all raid members in the fight.
- Columns: Player, Role, DPS, Consumable compliance (Flasks, Elixirs, Food, Weapon oils/stones), Deaths, and Key Cooldowns.
- In encounter view, includes an **Active Boss Debuffs** summary bar showing debuff chips with uptime percentages and applier tooltips.

### 4.3. Player View (`playerView.js`)
- Rendered when an individual player is selected.
- **Header**: Player name (class colored), spec icon, boss icon, DPS readout, and chronological death/resurrection pills.
- **Consumables & Buffs**: Grid of active consumables, world buffs, and raid buffs.
- **Abilities Grid**: List of all abilities used, cast counts, damage, and interrupt statistics.
- **Action Buttons**:
  - `Inspect Gear`: Toggles `inlineGearContainer`.
  - `Timeline`: Toggles `inlineTimelineContainer` (available in encounter views).
  - `Casts/Uptime`: Toggles `inlineCastsContainer` (available in encounter views and when cast/debuff data is present).

### 4.4. Inspect Gear (`gearViewer.js`)
- Renders 16 equipment slots in authentic WoW character pane layout.
- Displays item icon, name, item quality color, enchant name, and gem slots.
- Highlights missing or suboptimal enchants with warning indicators.

### 4.5. Fight Timeline (`timelineViewer.js`)
- Renders an interactive horizontal Gantt chart.
- Each row represents a major cooldown, trinket proc, or external buff.
- Bars show exact start time and duration.
- Includes a proportional time axis (0:00 to fight end).

### 4.6. Casts & Debuff Uptime Panel (`castsDebuffPanel.js`)
- Contains sub-tab switching: `[ Personal Uptime ]` and `[ Raid Support ]`.
- **Personal Uptime**:
  - Section 1: Spammable rotational ability cast counts and low-rank warnings.
  - Section 2: Personal debuff / buff uptimes per target with target death lines and dead zone shading.
- **Raid Support** (`raidSupportPanel.js`):
  - Boss Debuffs: Raid-wide debuff uptimes on the boss, application counts, and contributing players.
  - Party & Raid Buffs: Buff uptimes received by the player, showing coverage and providers.

### 4.7. UI Visual Design & Styling Principles
- **Flat Dark Fantasy Aesthetic**:
  - Transparent list items: `.fight-item` and `.player-item` are transparent by default (no visible nested box backgrounds or borders), illuminating only on hover (`rgba(255, 255, 255, 0.05)`) and active selection (`rgba(245, 197, 66, 0.12)` + `border-left: 3px solid var(--gold-primary)`).
  - Minimal border radius: Subtle `2px` to `4px` across UI containers, buttons, and chips. No excessive rounded corners (8px/10px/12px are prohibited).
  - Clean structure without heavy nested boxes or high-contrast box borders.

---

## 5. Database & Asset Architecture

### 5.1. SQLite Database (`forever.sqlite`)
- Populated via `database/seed_data.sql`.
- Tables:
  - `classes`: Class definitions, colors, armor types.
  - `specs`: Talent specs, roles, default icons.
  - `abilities`: Spells, categories (1=Buff, 2=Consumable, 3=Ability, etc.), icons, CD durations.
  - `items`: Equipment catalog with slot types, item IDs, and icons.
  - `enchants`: Optimal enchants and allowable slot mappings.
  - `icon_cache`: Caches mapping from icon name to download status and file path.

### 5.2. Icon Fetching & Storage
- Icons are stored as JPEG/PNG in `public/assets/icons/` and served via `/api/icon/<name>.jpg`.
- If an icon is missing locally:
  - The server automatically attempts to download it from Wowhead CDN (`https://wow.zamimg.com/images/wow/icons/large/<name>.jpg`).
  - Successfully downloaded icons are persisted to disk and cached in SQLite.
  - If Wowhead does not have the icon, `/assets/icons/inv_misc_questionmark.jpg` is returned as a fallback.

---

## 6. Testing & Quality Assurance

All modifications to combat processing must be verified against `public/demo_log.json` using the automated test suite in `scratch/test_casts_and_timeline.py` and `scratch/test_roles_and_filters.py`.

### Minimum Verification Criteria:
1. **Zero Console Errors**: No unhandled JavaScript exceptions in browser runtime.
2. **Player Isolation**: Ensure no player timeline displays abilities or buffs belonging to another player.
3. **Target Death Accuracy**: Target death markers must align with the exact `death` event timestamp.
4. **Clean Role Filtering**: No valid raid member is dropped or hidden by role filters unless explicitly excluded by that role.

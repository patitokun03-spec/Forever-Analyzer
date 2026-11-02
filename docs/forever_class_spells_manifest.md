# Canonical Class & Specialization Spells Manifest — WoW: Forever (Beta 1.60 / Classic+)

This document is the canonical reference for all rotational abilities, DoTs/debuffs, major cooldowns, interrupts, dispels, and custom **WoW: Forever (Beta 1.60 / Classic+)** spells tracked by **Forever Analyzer** across `forever.sqlite` (`database/seed_data.sql`), `public/js/gameData.js` (`CLASS_ABILITY_TRACKING`), and `public/js/processor/raidDebuffTracker.js`.

---

## 1. Wowhead Forever (`domain: 'forever'`) & Warcraft Logs API Verification

### 1.1 Wowhead Tooltip Engine (`WH.dataEnv.CLASSICPLUS = 16`)
- **Live Status**: Verified active in `https://wow.zamimg.com/js/tooltips.js`.
- **Internal Mapping**: `[WH.dataEnv.CLASSICPLUS]: "forever"` (`dataEnv = 16`).
- **Tooltip JSON Endpoint**: `https://nether.wowhead.com/tooltip/{spell|item|enchant}/{id}?dataEnv=16`
  - Example verified payload (`spell=1240193`, Forever custom *Slam*):
    `{"name":"Slam","icon":"ability_warrior_decisivestrike","tooltip":".../forever/spell=1240193/slam..."}`
- **Frontend Integration**:
  - `public/index.html` configures `const whTooltips = { colorLinks: true, iconizeLinks: true, renameLinks: true, domain: 'forever' };`.
  - `public/js/ui/gearInspector.js` attaches `data-wowhead="item=${item.id}&pcs=${allGearIds}&ench=${rawEnchant}&domain=forever"` to all equipped gear slots.

### 1.2 Warcraft Logs v2 `combatantinfo` & `events` Structure
- **`combatantinfo` Snapshot**: Emitted at encounter start (`ENCOUNTER_START`) for each raid member (`sourceID`):
  - `auras`: Array of `{ ability: <SpellID>, source: <ActorID>, icon: "..." }` used by `combatantParser.js` to audit pre-pull Flasks, Battle/Guardian Elixirs, Food, Alcohol, and World Buffs.
  - `gear`: 19-slot array containing `{ id: <ItemID>, quality: <0-5>, icon: "...", permanentEnchant: <EnchantID>, temporaryEnchant: <TempEnchantID> }` used by `gearInspector.js` and `combatantParser.js`.
  - `talents`: 3-element array `[tree1, tree2, tree3]` used by `detectPlayerSpec()` in `utils.js`.
- **`events.data` Stream**: Filtered server-side in `server.py` (`get_wcl_filter_spell_ids()`) for `cast`, `applybuff`, `refreshbuff`, `removebuff`, `applydebuff`, `refreshdebuff`, `removedebuff`, `interrupt`, `dispel`, `death`, and `resurrect`.

---

## 2. Class & Specialization Ability Manifest (9 Classes / 27 Specs)

### 2.1 Warrior (`Warrior`)

| Specialization | Category | Ability Name | Canonical Spell IDs (Vanilla 1.12 + Forever Custom) | Notes / Uptime Duration |
| :--- | :--- | :--- | :--- | :--- |
| **Fury** (`Warrior-Fury`) | Rotational | Bloodthirst | `23881, 23892, 23893, 23894` | Core 6s CD spender |
| **Fury** (`Warrior-Fury`) | Rotational | Whirlwind | `1680` | Core AoE / single-target rotational |
| **Fury** (`Warrior-Fury`) | Rotational | Heroic Strike | `78, 284, 285, 1608, 11564, 11565, 11566, 11567, 25286` | Next-melee rage dump |
| **Fury** (`Warrior-Fury`) | Rotational | Cleave | `845, 7369, 11608, 11609, 20569` | Multi-target rage dump |
| **Fury** (`Warrior-Fury`) | Rotational | Execute | `5308, 20658, 20660, 20661, 20662` | `<20%` HP finisher |
| **Fury** (`Warrior-Fury`) | Rotational | Slam | `1464, 8820, 11604, 11605`, **`1240193`** *(Forever)* | Includes Forever custom Slam (`1240193`) |
| **Fury** (`Warrior-Fury`) | Rotational | Sunder Armor | `7386, 7405, 8380, 11596, 11597, 25225` | 30s armor debuff |
| **Fury** (`Warrior-Fury`) | Rotational | Hamstring | `1715, 7372, 7373` | Windfury / Flurry fishing |
| **Arms** (`Warrior-Arms`) | Rotational | Mortal Strike | `12294, 21551, 21552, 21553, 25248` | Core 6s CD 2H strike |
| **Arms** (`Warrior-Arms`) | Rotational | Overpower | `7384, 7887, 11584, 11585` | Dodge-reactive strike |
| **Arms** (`Warrior-Arms`) | Rotational | Slam | `1464, 8820, 11604, 11605`, **`1240193`** *(Forever)* | 2H swing-timer weaver |
| **Arms** (`Warrior-Arms`) | Debuff | Rend | `772, 6546, 6547, 6548, 11572, 11573, 11574` | `21000ms` bleed |
| **Protection** (`Warrior-Protection`) | Rotational | Shield Slam | `23922, 23923, 23924, 23925` | Highest snap threat |
| **Protection** (`Warrior-Protection`) | Rotational | Revenge | `6572, 6574, 7379, 11600, 11601, 25288` | Defensive stance proc |
| **Protection** (`Warrior-Protection`) | Rotational | Sunder Armor | `7386, 7405, 8380, 11596, 11597, 25225` | Primary threat filler |
| **Protection** (`Warrior-Protection`) | Rotational | Taunt / Mocking Blow / Intervene | `355` / `694, 7400, 7402, 20559, 20560` / `25275` | Fixates & party peel |
| **All Warrior Specs** | Buff / Debuff | Battle Shout / Demo Shout / Thunder Clap | `6673..25289` (`120s`) / `1160..25202` (`30s`) / `6343..11581` (`30s`) | Tracked in personal & raid support |
| **All Warrior Specs** | Cooldowns | Death Wish / Recklessness / Shield Wall / Last Stand / Sweeping Strikes / Retaliation / Challenging Shout / Shield Block / Bloodrage / Berserker Rage | `12328` / `1719` / `871` / `12975` / `12292` / `20230` / `1161` / `2565` / `2687` / `18499` | Category 2 (Timeline) |
| **All Warrior Specs** | Interrupts | Pummel / Shield Bash | `6552, 6554` / `72, 1671, 1672` | Category 4 (`is_interrupt = 1`) |

---

### 2.2 Paladin (`Paladin`)

| Specialization | Category | Ability Name | Canonical Spell IDs (Vanilla 1.12 + Forever Custom) | Notes / Uptime Duration |
| :--- | :--- | :--- | :--- | :--- |
| **Holy** (`Paladin-Holy`) | Rotational | Flash of Light | `19750, 19939, 19940, 19941, 19942, 19943` | Primary efficient heal |
| **Holy** (`Paladin-Holy`) | Rotational | Holy Light | `635, 639, 647, 1026, 1042, 3472, 10328, 10329, 25292` | High-throughput tank heal |
| **Holy** (`Paladin-Holy`) | Rotational | Holy Shock | `20473, 20929, 20930` | Instant heal/damage |
| **Holy / All** | Rotational | Holy Strike | `679, 678, 1866`, **`1211818, 1211819, 1211820`** *(Forever)* | Forever custom melee strike |
| **Protection** (`Paladin-Protection`) | Rotational | Holy Shield | `20925, 20927, 20928` | Mitigation + block threat |
| **Protection** (`Paladin-Protection`) | Rotational | Consecration | `26573` *(removed TBC)* -> `2657, 20116, 20922, 20923, 20924` | AoE threat ground effect |
| **Protection** (`Paladin-Protection`) | Rotational | Seal of Fury | **`1311649, 1311656`** *(Forever)* | Forever tank threat seal |
| **Protection** (`Paladin-Protection`) | Rotational | Hand of Reckoning | **`1214135`** *(Forever)* | Forever single-target taunt |
| **Retribution** (`Paladin-Retribution`) | Rotational | Crusader Strike | **`1279886`** *(Forever)* | Forever Retribution core strike |
| **Retribution** (`Paladin-Retribution`) | Rotational | Judgement / Exorcism / Hammer of Wrath | `20271` / `879, 5614, 5615, 10312, 10313, 10314` / `24275, 24274, 24239` | Core rotational spenders |
| **All Paladin Specs** | Debuffs | Judgement of Light / Judgement of Wisdom / Judgement of the Crusader | `20185, 20344..20346` / `20186, 20354, 20355` / `21183, 20300..20303` | `10000ms` (refreshed on melee/ranged hit) |
| **All Paladin Specs** | Cooldowns | Avenging Wrath / Divine Favor / Divine Shield / Blessing of Protection / Lay on Hands / Divine Intervention | **`1214142`** *(Forever)* / `20216` / `642, 1020` / `1022, 5599, 10278` / `633, 2800, 10310, 20235` / `19752` | Category 2 (Timeline) |
| **All Paladin Specs** | Interrupt / Dispel | Hammer of Justice / Cleanse / Purify | `853, 5588, 5589, 10308` / `4987` / `1152` | Crowd control & dispels |

---

### 2.3 Hunter (`Hunter`)

| Specialization | Category | Ability Name | Canonical Spell IDs (Vanilla 1.12 + Forever Custom) | Notes / Uptime Duration |
| :--- | :--- | :--- | :--- | :--- |
| **Beast Mastery** (`Hunter-BeastMastery`) | Rotational | Auto Shot / Multi-Shot / Arcane Shot | `75` / `2643, 14288, 14289, 14290, 25294` / `3044, 14281..14287` | Core ranged rotation |
| **Marksmanship** (`Hunter-Marksmanship`) | Rotational | Aimed Shot / Multi-Shot / Auto Shot | `19434, 20900..20904` / `2643, 14288..25294` / `75` | Clipped Auto Shot rotation |
| **Survival** (`Hunter-Survival`) | Rotational | Carve / Lacerate / Raptor Strike / Mongoose Bite | **`1218219`** *(Forever)* / **`1218221`** *(Forever)* / `2973, 14267, 14268` / `1495, 14269, 14270` | Forever melee/hybrid Survival kit |
| **All Hunter Specs** | Debuffs | Hunter's Mark / Serpent Sting | `1130, 14323, 14324, 14325` (`120s`) / `1978, 13549..13555, 25295` (`15s`) | Target debuffs |
| **All Hunter Specs** | Utility / Cooldowns | Tranquilizing Shot / Rapid Fire / Bestial Wrath / Deterrence / Feign Death | `19801` / `3045` / `19574` / `19263` / `5384` | Frenzy dispel & major CDs |

---

### 2.4 Rogue (`Rogue`)

| Specialization | Category | Ability Name | Canonical Spell IDs (Vanilla 1.12 + Forever Custom) | Notes / Uptime Duration |
| :--- | :--- | :--- | :--- | :--- |
| **Combat** (`Rogue-Combat`) | Rotational | Sinister Strike / Eviscerate / Slice and Dice / Feint | `1752, 1757..1760, 8621, 11293, 11294` / `2098, 6760..6762, 8623, 8624, 11299, 11300, 31016` / `5171, 6774` / `1966..25302` | Sword/Mace/Fist Combat rotation |
| **Assassination** (`Rogue-Assassination`) | Rotational | Backstab / Sinister Strike / Eviscerate / Slice and Dice | `53, 2589..2591, 8721, 11279..11281, 25300` / `1752..11294` / `2098..31016` / `5171, 6774` | Dagger & poison rotation |
| **Subtlety** (`Rogue-Subtlety`) | Rotational | Backstab / Ambush / Garrote / Hemorrhage / Eviscerate | `53..25300` / `8676, 8724, 8725, 11267..11269` / `703, 8631..11290` / `16511, 17347, 17348` / `2098..31016` | Opener & bleed/combo builder |
| **All Rogue Specs** | Buff / Debuffs | Slice and Dice / Rupture / Expose Armor | `5171, 6774` (`30s` buff) / `1943, 8639, 8640, 11273..11275` (`16s`) / `8647, 8649, 8650, 11197, 11198` (`30s`) | Tracked in Casts/Uptime |
| **All Rogue Specs** | Cooldowns | Blade Flurry / Adrenaline Rush / Cold Blood / Vanish / Evasion / Sprint / Preparation | `13877` / `13750` / `14177` / `1856, 1857` / `5277` / `2983, 8696, 11305` / `14185` | Category 2 (Timeline) |
| **All Rogue Specs** | Interrupt | Kick | `1766, 1767, 1768, 1769` | Category 4 (`is_interrupt = 1`) |

---

### 2.5 Priest (`Priest`)

| Specialization | Category | Ability Name | Canonical Spell IDs (Vanilla 1.12 + Forever Custom) | Notes / Uptime Duration |
| :--- | :--- | :--- | :--- | :--- |
| **Shadow** (`Priest-Shadow`) | Rotational | Mind Flay / Mind Blast / Dark Sacrifice / Chastise | `15407, 17311..17314, 18807` / `8092, 8102..8106, 10945..10947` / **`1277324`** *(Forever)* / **`1277331`** *(Forever)* | Forever custom Shadow spells included |
| **Shadow** (`Priest-Shadow`) | Debuffs | Shadow Word: Pain / Vampiric Embrace / Devouring Plague / Shadow Weaving | `589, 594, 970, 992, 2767, 10892..10894` (`18s`) / `15286` (`60s`) / `2944, 19276..19280` (`24s`) / `15257..15334` | Personal & raid spell vulnerability |
| **Holy** (`Priest-Holy`) | Rotational | Flash Heal / Greater Heal / Prayer of Healing / Renew / Heal | `2061, 9472..10917` / `2060, 10963..10965, 25314` / `596, 996, 10960, 10961, 25316` / `139, 6074..10929, 25315` / `2054..6064` | Core raid & tank healing |
| **Discipline** (`Priest-Discipline`) | Rotational | Power Word: Shield / Flash Heal / Greater Heal / Renew | `17, 592, 600, 3747, 6065, 6066, 10898..10901` / `2061..10917` / `2060..25314` / `139..25315` | Mitigation & external support |
| **All Priest Specs** | Cooldowns & Dispels | Power Infusion / Inner Focus / Fear Ward / Silence / Dispel Magic / Abolish Disease | `10060` / `14751` / `6346` / `15487` (Interrupt) / `527, 988` / `552` | Category 2 & Utility |

---

### 2.6 Mage (`Mage`)

| Specialization | Category | Ability Name | Canonical Spell IDs (Vanilla 1.12 + Forever Custom) | Notes / Uptime Duration |
| :--- | :--- | :--- | :--- | :--- |
| **Fire** (`Mage-Fire`) | Rotational | Fireball / Scorch / Fire Blast / Pyroblast | `133, 143, 145, 3140, 8400..8402, 10148..10151, 25306` / `2948, 8444..10207` / `2136..2138, 8412, 8413, 10197, 10199` / `11366, 12505, 12522..12526, 18809` | Full Classic rank coverage |
| **Fire** (`Mage-Fire`) | Debuffs | Improved Scorch / Ignite | `22959` (`30000ms` Fire Vulnerability) / `12654, 12846..12849` (`4000ms`) | Raid Fire debuff & rolling DoT |
| **Frost** (`Mage-Frost`) | Rotational | Frostbolt / Ice Lance / Cone of Cold / Blizzard | `116, 205, 837, 7322, 8406..8408, 10179..10181, 25304` / **`1213895`** *(Forever)* / `120, 8492, 10159..10161` / `10, 6141, 8427, 10185..10187` | Includes Forever custom *Ice Lance* (`1213895`) |
| **Frost** (`Mage-Frost`) | Debuff | Winter's Chill | `12579, 28592..28595` | `15000ms` Frost crit debuff |
| **Arcane** (`Mage-Arcane`) | Rotational | Arcane Missiles / Arcane Blast / Arcane Explosion / Scorch | `5143..5145, 8416, 8417, 10211, 10212` / **`1214029`** *(Forever)* / `1449, 8437..10202` / `2948..10207` | Includes Forever custom *Arcane Blast* (`1214029`) |
| **All Mage Specs** | Cooldowns & Interrupts | Arcane Power / Combustion / Icy Veins / Presence of Mind / Cold Snap / Evocation / Ice Block / Counterspell / Remove Lesser Curse | `12042` / `11129` / `12472` / `12043` / `11958` / `12051` / `11958, 27619` / `2139` (`is_interrupt = 1`) / `475` | Category 2, 4 & Dispel |

---

### 2.7 Warlock (`Warlock`)

| Specialization | Category | Ability Name | Canonical Spell IDs (Vanilla 1.12 + Forever Custom) | Notes / Uptime Duration |
| :--- | :--- | :--- | :--- | :--- |
| **Affliction** (`Warlock-Affliction`) | Rotational | Shadow Bolt / Unstable Affliction / Seed of Corruption / Life Tap / Drain Life | `686, 695, 705, 1088, 1106, 7641, 11659..11661, 25307` / **`1213158`** *(Forever)* / **`1213182`** *(Forever)* / `1454..11689` / `689..11700` | Includes Forever *Unstable Affliction* & *Seed of Corruption* |
| **Destruction** (`Warlock-Destruction`) | Rotational | Shadow Bolt / Incinerate / Searing Pain / Shadowburn / Conflagrate / Life Tap | `686..25307` / **`1213167`** *(Forever)* / `5676, 17919..17923` / `17877, 18867..18871` / `17962, 18930..18932` / `1454..11689` | Includes Forever *Incinerate* (`1213167`) |
| **Demonology** (`Warlock-Demonology`) | Rotational | Shadow Bolt / Life Tap / Drain Life / Banish | `686..25307` / `1454..11689` / `689..11700` / `710, 18647` | Demonic Sacrifice / Master Demonologist |
| **All Warlock Specs** | Debuffs | Corruption / Curse of Agony / Immolate / Unstable Affliction / Curse of the Elements / Curse of Shadow / Curse of Recklessness | `172..25311` (`18s`) / `980..11713` (`24s`) / `348..25309` (`15s`) / **`1213158`** (`18s`) / `1490, 11721, 11722` (`300s`) / `17862, 17937` (`300s`) / `704, 7658, 7659, 11717` (`120s`) | Personal DoTs & Raid Curses |
| **All Warlock Specs** | Cooldowns, Res & Interrupt | Death Coil / Amplify Curse / Soulstone Resurrection / Spell Lock | `6789, 17925, 17926` / `18288` / `20707, 20762, 20749, 20750, 20758` (`is_res = 1`) / `19244, 19647` (`is_interrupt = 1`) | Category 2 & 4 |

---

### 2.8 Druid (`Druid`)

| Specialization | Category | Ability Name | Canonical Spell IDs (Vanilla 1.12 + Forever Custom) | Notes / Uptime Duration |
| :--- | :--- | :--- | :--- | :--- |
| **Balance** (`Druid-Balance`) | Rotational | Starfire / Wrath / Moonfire | `2912, 8949..8951, 9875, 9876, 25298` / `5176..5180, 6780, 8905, 9912` / `8921, 8924..8929, 9833..9835` | Moonkin Aura (`24907`) |
| **Balance / Resto** | Debuffs | Faerie Fire / Moonfire / Insect Swarm | `770, 778, 9749, 9907` (`40s`) / `8921..9835` (`12s`) / `5570, 24974..24977` (`12s`) | Armor reduction & Nature/Arcane DoTs |
| **Feral** (`Druid-Feral`) | Rotational (Cat & Bear) | Shred / Mangle / Claw / Ferocious Bite / Maul / Swipe / Bash | `5221, 6800, 8992, 9829, 9830` / **`1213301, 1213310`** *(Forever)* / `1082..9850` / `22568..31018` / `6807..9881` / `779..9908` / `5211..8983` | Dual-role (`Tank` & `Melee DPS` filter match) |
| **Feral** (`Druid-Feral`) | Debuffs | Faerie Fire (Feral) / Demoralizing Roar / Rip / Rake | `16857, 17390..17392` (`40s`) / `99, 1735, 9490, 9747, 9898` (`30s`) / `1079, 9492..9896` (`12s`) / `1822..9904` (`9s`) | Bear mitigation & Cat bleeds |
| **Restoration** (`Druid-Restoration`) | Rotational | Healing Touch / Regrowth / Rejuvenation / Swiftmend / Efflorescence / Tranquility | `5185..25297` / `8936..9858` / `774..25299` / `18562` / **`1213290`** *(Forever)* / `740, 8918, 9862, 9863` | Includes Forever *Efflorescence* (`1213290`) |
| **All Druid Specs** | Cooldowns, Res & Interrupt | Innervate / Barkskin / Nature's Swiftness / Tiger's Fury / Frenzied Regeneration / Challenging Roar / Rebirth / Feral Charge / Remove Curse / Abolish Poison | `29166` / `22812` / `17116` / `5217, 6793, 9845, 9846` / `22842..22896` / `5209` / `20484, 20739, 20742, 20747, 20748` (`is_res = 1`) / `16979` (`is_interrupt = 1`) / `2782` / `2893` | Full utility kit |

---

### 2.9 Shaman (`Shaman`)

| Specialization | Category | Ability Name | Canonical Spell IDs (Vanilla 1.12 + Forever Custom) | Notes / Uptime Duration |
| :--- | :--- | :--- | :--- | :--- |
| **Elemental** (`Shaman-Elemental`) | Rotational | Lightning Bolt / Chain Lightning / Earth Shock | `403, 529, 548, 915, 943, 6041, 10391, 10392, 15207, 15208` / `421, 930, 2860, 10605` / `8042, 8044..8046, 10412..10414` | Core caster rotation |
| **Enhancement** (`Shaman-Enhancement`) | Rotational | Stormstrike / Earth Shock | `17364` / `8042, 8044..8046, 10412..10414` | Dual Wield / 2H Windfury (`1213860`) |
| **Elemental / Enh** | Debuff | Flame Shock | `8050, 8052, 8053, 10447, 10448, 29228` | `12000ms` Fire DoT |
| **Restoration** (`Shaman-Restoration`) | Rotational | Chain Heal / Healing Wave / Lesser Healing Wave / Earth Shield | `1064, 10622, 10623` / `331, 332, 547, 913, 939, 959, 8005, 10395, 10396, 25357` / `8004, 8008, 8010, 10466..10468` / **`1213870`** *(Forever)* | Includes Forever *Earth Shield* (`1213870`) |
| **All Shaman Specs** | Cooldowns, Res & Interrupt | Bloodlust / Elemental Mastery / Nature's Swiftness / Mana Tide Totem / Reincarnation (Ankh) / Earth Shock / Cure Poison / Cure Disease / Purge | `2825` / `16166` / `16188` / `16190, 17354, 17359` / `20608` (`is_res = 1`) / `8042..10414` (`is_interrupt = 1`) / `526` / `2870` / `370, 8012` | Shared party CDs & totems |

---

## 3. Raid-Wide Boss Debuffs & Party Buffs (`raidDebuffTracker.js`)

| Type | Category | Name | Tracked Spell IDs |
| :--- | :--- | :--- | :--- |
| **Boss Debuff** | Armor Reduction | Sunder Armor | `7386, 7405, 8380, 11596, 11597, 25225` |
| **Boss Debuff** | Armor Reduction | Faerie Fire / Faerie Fire (Feral) | `770, 778, 9749, 9907, 16857, 17390, 17391, 17392` |
| **Boss Debuff** | Armor Reduction | Curse of Recklessness | `704, 7658, 7659, 11717` |
| **Boss Debuff** | Armor Reduction | Expose Armor | `8647, 8649, 8650, 11197, 11198` |
| **Boss Debuff** | Armor Reduction | Annihilator | `16928` |
| **Boss Debuff** | Spell Vulnerability | Curse of the Elements | `1490, 11721, 11722` |
| **Boss Debuff** | Spell Vulnerability | Curse of Shadow | `17862, 17937` |
| **Boss Debuff** | Spell Vulnerability | Improved Scorch | `22959` |
| **Boss Debuff** | Spell Vulnerability | Winter's Chill | `12579, 28592, 28593, 28594, 28595` |
| **Boss Debuff** | Spell Vulnerability | Shadow Weaving | `15257, 15258, 15331, 15332, 15333, 15334` |
| **Boss Debuff** | Spell Vulnerability | Stormstrike | `17364` |
| **Boss Debuff** | Spell Vulnerability | Nightfall (Spell Vulnerability) | `23605` |
| **Boss Debuff** | Paladin Judgements | Judgement of Wisdom | `20186, 20354, 20355` |
| **Boss Debuff** | Paladin Judgements | Judgement of Light | `20185, 20344, 20345, 20346` |
| **Boss Debuff** | Paladin Judgements | Judgement of the Crusader | `21183, 20300, 20301, 20302, 20303` |
| **Boss Debuff** | Mitigation | Demoralizing Shout | `1160, 6190, 11554, 11555, 11556, 25202` |
| **Boss Debuff** | Mitigation | Demoralizing Roar | `99, 1735, 9490, 9747, 9898` |
| **Boss Debuff** | Mitigation | Thunder Clap | `6343, 8198, 8204, 8205, 11580, 11581` |
| **Raid Buff** | Paladin Blessings | Blessing of Might | `19740, 19834, 19835, 19836, 19837, 19838, 25291, 25782, 25916` |
| **Raid Buff** | Paladin Blessings | Blessing of Kings | `20217, 25898` |
| **Raid Buff** | Paladin Blessings | Blessing of Salvation | `1038, 25895` |
| **Raid Buff** | Paladin Blessings | Blessing of Wisdom | `19742, 19850, 19852, 19853, 19854, 25894, 25918` |
| **Raid Buff** | Paladin Blessings | Blessing of Light | `19977, 19978, 19979, 25890` |
| **Raid Buff** | Party Auras | Leader of the Pack / Trueshot Aura / Moonkin Aura / Battle Shout | `17007` / `19506, 20905, 20906` / `24907` / `6673, 5242, 6192, 11549, 11550, 11551, 25289` |
| **Raid Buff** | Shaman Totems | Windfury Totem / Grace of Air Totem | `8512, 10613, 10614` / `8835, 10627, 25359` |
| **Raid Buff** | Raid Buffs | Power Word: Fortitude / Mark of the Wild / Arcane Intellect / Shadow Protection / Bloodlust | `1243..21564` / `1126..21850` / `1459..23028` / `976..27683` / `2825` |

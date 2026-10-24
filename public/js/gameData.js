// gameData.js — Central Game Data Module for WoW Forever Log Analyzer
// Fetches all catalog data from SQLite via server.py API at startup.
// Replaces the old data.js global script.

// ═══════════════════════════════════════════════════════════════════════════
// DATA STORES — populated by initGameData(), used by all modules
// ═══════════════════════════════════════════════════════════════════════════

export const CLASSES = [];
export const CLASS_COLORS = {};
export const SPEC_ICONS = {
    // Fallback defaults so the app doesn't crash before API loads
    "Warrior": "ability_warrior_innerrage",
    "Warrior-Arms": "ability_warrior_savageblow",
    "Warrior-Fury": "ability_warrior_innerrage",
    "Warrior-Protection": "inv_shield_06",
    "Paladin": "spell_holy_holybolt",
    "Paladin-Holy": "spell_holy_holybolt",
    "Paladin-Protection": "spell_holy_avengersshield",
    "Paladin-Retribution": "spell_holy_auraoflight",
    "Hunter": "ability_hunter_beasttaming",
    "Hunter-BeastMastery": "ability_hunter_beasttaming",
    "Hunter-Marksmanship": "ability_marksmanship",
    "Hunter-Survival": "ability_hunter_swiftstrike",
    "Rogue": "ability_rogue_eviscerate",
    "Rogue-Combat": "ability_backstab",
    "Rogue-Assassination": "ability_rogue_eviscerate",
    "Rogue-Subtlety": "ability_stealth",
    "Priest": "spell_holy_wordfortitude",
    "Priest-Holy": "spell_holy_holybolt",
    "Priest-Discipline": "spell_holy_powerwordshield",
    "Priest-Shadow": "spell_shadow_shadowwordpain",
    "Shaman": "spell_nature_bloodlust",
    "Shaman-Elemental": "spell_nature_lightning",
    "Shaman-Enhancement": "spell_nature_lightningshield",
    "Shaman-Restoration": "spell_nature_magicimmunity",
    "Mage": "spell_frost_frostbolt",
    "Mage-Arcane": "spell_holy_magicalsentry",
    "Mage-Fire": "spell_fire_firebolt02",
    "Mage-Frost": "spell_frost_frostbolt02",
    "Warlock": "spell_shadow_metamorphosis",
    "Warlock-Affliction": "spell_shadow_deathcoil",
    "Warlock-Demonology": "spell_shadow_metamorphosis",
    "Warlock-Destruction": "spell_shadow_rainoffire",
    "Druid": "ability_druid_catform",
    "Druid-Balance": "spell_nature_starfall",
    "Druid-Feral": "ability_racial_bearform",
    "Druid-Restoration": "spell_nature_healingtouch",
};
export const SPEC_ROLES = {
    // Fallback defaults so the app doesn't break before API loads
    "Warrior-Arms": "Melee DPS",
    "Warrior-Fury": "Melee DPS",
    "Warrior-Protection": "Tank",
    "Paladin-Holy": "Healer",
    "Paladin-Protection": "Tank",
    "Paladin-Retribution": "Melee DPS",
    "Hunter-BeastMastery": "Ranged DPS",
    "Hunter-Beast Mastery": "Ranged DPS",
    "Hunter-Marksmanship": "Ranged DPS",
    "Hunter-Survival": "Ranged DPS",
    "Rogue-Combat": "Melee DPS",
    "Rogue-Assassination": "Melee DPS",
    "Rogue-Subtlety": "Melee DPS",
    "Priest-Holy": "Healer",
    "Priest-Discipline": "Healer",
    "Priest-Shadow": "Ranged DPS",
    "Shaman-Elemental": "Ranged DPS",
    "Shaman-Enhancement": "Melee DPS",
    "Shaman-Restoration": "Healer",
    "Mage-Arcane": "Ranged DPS",
    "Mage-Fire": "Ranged DPS",
    "Mage-Frost": "Ranged DPS",
    "Warlock-Affliction": "Ranged DPS",
    "Warlock-Demonology": "Ranged DPS",
    "Warlock-Destruction": "Ranged DPS",
    "Druid-Balance": "Ranged DPS",
    "Druid-Feral": "Melee DPS",
    "Druid-Restoration": "Healer",
};

export const CLASS_DEFAULT_ROLES = {
    "Warrior": "Melee DPS",
    "Paladin": "Healer",
    "Hunter": "Ranged DPS",
    "Rogue": "Melee DPS",
    "Priest": "Healer",
    "Shaman": "Healer",
    "Mage": "Ranged DPS",
    "Warlock": "Ranged DPS",
    "Druid": "Melee DPS",
};

export function getPlayerRole(spec, className) {
    if (spec && SPEC_ROLES[spec]) return SPEC_ROLES[spec];
    if (spec && SPEC_ROLES[spec.replace(/\s+/g, '')]) return SPEC_ROLES[spec.replace(/\s+/g, '')];
    if (className && CLASS_DEFAULT_ROLES[className]) return CLASS_DEFAULT_ROLES[className];
    return 'Unknown';
}

export const SPELL_DB = {};
export const BUFF_DB = {};
export const ENCHANT_DB = {};
export const OPTIMAL_ENCHANTS = {};

// ═══════════════════════════════════════════════════════════════════════════
// TIMELINE SPELLS — Configuration for buff/proc timeline visualization
// These are UI config, not catalog data, so they stay in JS.
// ═══════════════════════════════════════════════════════════════════════════

export const TIMELINE_SPELLS = {
    // Trinket procs / Active Trinket CDs (duration in ms)
    23720: { name: "Blessing of the Blackfang",  icon: "inv_misc_monsterclaw_03", color: "#c0392b", duration: 10000 },
    23723: { name: "Mind Quickening",            icon: "inv_misc_gem_sapphire_01", color: "#2980b9", duration: 20000 },
    23724: { name: "Chromatic Infusion",         icon: "inv_misc_gem_variety_02",  color: "#8e44ad", duration: 15000 },
    23726: { name: "Glyph of Chromatic Warding", icon: "inv_misc_gem_opal_01",     color: "#f39c12", duration: 15000 },
    27672: { name: "Jom Gabbar",                 icon: "inv_misc_enggizmos_19",    color: "#e67e22", duration: 20000 },
    23688: { name: "Slayer's Crest",             icon: "inv_trinket_naxxramas01",  color: "#c0392b", duration: 20000 },
    28093: { name: "Eye of Diminution",          icon: "inv_trinket_naxxramas02",  color: "#2ecc71", duration: 20000 },
    28866: { name: "Kiss of the Spider",         icon: "inv_trinket_naxxramas03",  color: "#1abc9c", duration: 15000 },
    23046: { name: "Diamond Flask",              icon: "inv_misc_gem_diamond_01",  color: "#f1c40f", duration: 60000 },
    18401: { name: "Earthstrike",                icon: "spell_nature_abolishmagic", color: "#e67e22", duration: 20000 },
    24601: { name: "Ephemeral Power",            icon: "inv_misc_gem_pearl_04",    color: "#9b59b6", duration: 15000 },
    24663: { name: "Restless Strength",          icon: "inv_jewelry_necklace_13",  color: "#e74c3c", duration: 20000 },
    26480: { name: "Badge of the Swarmguard",    icon: "inv_misc_ahnqirajtrinket_04", color: "#e67e22", duration: 30000 },
    24140: { name: "Restrained Essence",         icon: "inv_misc_gem_sapphire_02", color: "#3da5d9", duration: 20000 },

    // Class Cooldowns & Externals
    12292: { name: "Death Wish",          icon: "spell_shadow_deathpact",    color: "#c0392b", duration: 30000 },
    1719:  { name: "Recklessness",        icon: "ability_criticalstrike",         color: "#e74c3c", duration: 15000 },
    871:   { name: "Shield Wall",         icon: "ability_warrior_shieldwall",     color: "#3498db", duration: 10000 },
    12975: { name: "Last Stand",          icon: "spell_holy_ashestoashes",        color: "#2ecc71", duration: 20000 },
    12328: { name: "Sweeping Strikes",    icon: "ability_rogue_slicedice",        color: "#f39c12", duration: 10000 },
    13750: { name: "Adrenaline Rush",     icon: "spell_shadow_shadowworddominate", color: "#e74c3c", duration: 15000 },
    13877: { name: "Blade Flurry",        icon: "ability_warrior_punishingblow",   color: "#e67e22", duration: 15000 },
    14177: { name: "Cold Blood",          icon: "spell_ice_lament",          color: "#1abc9c", duration: 5000 },
    12042: { name: "Arcane Power",        icon: "spell_nature_lightning",    color: "#2980b9", duration: 15000 },
    12043: { name: "Presence of Mind",    icon: "spell_nature_enchantarmor", color: "#3498db", duration: 5000 },
    11129: { name: "Combustion",          icon: "spell_fire_sealoffire",     color: "#e74c3c", duration: 15000 },
    11958: { name: "Ice Block",           icon: "spell_frost_frost",         color: "#3498db", duration: 10000 },
    12051: { name: "Evocation",           icon: "spell_nature_purge",        color: "#9b59b6", duration: 8000 },
    19574: { name: "Bestial Wrath",       icon: "ability_druid_ferociousbite",     color: "#c0392b", duration: 18000 },
    3045:  { name: "Rapid Fire",          icon: "ability_hunter_runningshot",      color: "#f39c12", duration: 15000 },
    29166: { name: "Innervate",           icon: "spell_nature_lightning",          color: "#2ecc71", duration: 20000 },
    10060: { name: "Power Infusion",      icon: "spell_holy_powerinfusion",        color: "#f1c40f", duration: 15000 },
    1022:  { name: "Blessing of Protection", icon: "spell_holy_sealofprotection", color: "#f1c40f", duration: 10000 },
    642:   { name: "Divine Shield",       icon: "spell_holy_divineintervention",  color: "#f1c40f", duration: 12000 },
    20216: { name: "Divine Favor",        icon: "spell_holy_heal",                color: "#f1c40f", duration: 5000 },
    17116: { name: "Nature's Swiftness (D)", icon: "spell_nature_ravenform",      color: "#27ae60", duration: 5000 },
    16188: { name: "Nature's Swiftness (S)", icon: "spell_nature_ravenform",      color: "#27ae60", duration: 5000 },
    16166: { name: "Elemental Mastery",   icon: "spell_nature_wispheal",          color: "#f39c12", duration: 5000 },
    16190: { name: "Mana Tide Totem",     icon: "spell_frost_summonwaterelemental", color: "#3da5d9", duration: 12000 },
    2825:  { name: "Bloodlust",           icon: "spell_nature_bloodlust",          color: "#c0392b", duration: 40000 },
};

// ═══════════════════════════════════════════════════════════════════════════
// CLASS ABILITY TRACKING — Per-spec ability monitoring configuration
// ═══════════════════════════════════════════════════════════════════════════

export const CLASS_ABILITY_TRACKING = {
    "Warrior-Fury": {
        casts: [
            { ids: [78, 284, 285, 1608, 11564, 11565, 11566, 11567, 25286], name: "Heroic Strike" },
            { ids: [845, 7369, 11608, 11609, 20569], name: "Cleave" },
            { ids: [23881, 23892, 23893, 23894], name: "Bloodthirst" },
            { ids: [1680], name: "Whirlwind" },
            { ids: [7386, 7405, 8380, 11596, 11597, 25225], name: "Sunder Armor" },
            { ids: [5308, 20658, 20660, 20661, 20662], name: "Execute" },
            { ids: [1464, 8820, 11604, 11605], name: "Slam" },
            { ids: [1715, 7372, 7373], name: "Hamstring" },
        ],
        debuffs: [
            { ids: [6673, 5242, 6192, 11549, 11550, 11551, 25289], name: "Battle Shout", isBuff: true, duration: 120000, color: "#f5c542" },
            { ids: [7386, 7405, 8380, 11596, 11597, 25225], name: "Sunder Armor", duration: 30000, color: "#e67e22" },
            { ids: [1160, 6190, 11554, 11555, 11556, 25202], name: "Demoralizing Shout", duration: 30000, color: "#e74c3c" },
        ]
    },
    "Warrior-Arms": {
        casts: [
            { ids: [78, 284, 285, 1608, 11564, 11565, 11566, 11567, 25286], name: "Heroic Strike" },
            { ids: [845, 7369, 11608, 11609, 20569], name: "Cleave" },
            { ids: [12294, 21551, 21552, 21553], name: "Mortal Strike" },
            { ids: [1680], name: "Whirlwind" },
            { ids: [7384, 7887, 11584, 11585], name: "Overpower" },
            { ids: [7386, 7405, 8380, 11596, 11597, 25225], name: "Sunder Armor" },
            { ids: [5308, 20658, 20660, 20661, 20662], name: "Execute" },
            { ids: [1464, 8820, 11604, 11605], name: "Slam" },
            { ids: [1715, 7372, 7373], name: "Hamstring" },
        ],
        debuffs: [
            { ids: [6673, 5242, 6192, 11549, 11550, 11551, 25289], name: "Battle Shout", isBuff: true, duration: 120000, color: "#f5c542" },
            { ids: [7386, 7405, 8380, 11596, 11597, 25225], name: "Sunder Armor", duration: 30000, color: "#e67e22" },
            { ids: [1160, 6190, 11554, 11555, 11556, 25202], name: "Demoralizing Shout", duration: 30000, color: "#e74c3c" },
            { ids: [772, 6546, 6547, 6548, 11572, 11573, 11574], name: "Rend", duration: 21000, color: "#c0392b" },
        ]
    },
    "Warrior-Protection": {
        casts: [
            { ids: [7386, 7405, 8380, 11596, 11597, 25225], name: "Sunder Armor" },
            { ids: [78, 284, 285, 1608, 11564, 11565, 11566, 11567, 25286], name: "Heroic Strike" },
            { ids: [23922, 23923, 23924, 23925], name: "Shield Slam" },
            { ids: [6572, 6574, 7379, 11600, 11601, 25288], name: "Revenge" },
            { ids: [845, 7369, 11608, 11609, 20569], name: "Cleave" },
            { ids: [355], name: "Taunt" },
            { ids: [694, 7400, 7402, 20559, 20560], name: "Mocking Blow" },
            { ids: [25275], name: "Intervene" },
        ],
        debuffs: [
            { ids: [6673, 5242, 6192, 11549, 11550, 11551, 25289], name: "Battle Shout", isBuff: true, duration: 120000, color: "#f5c542" },
            { ids: [7386, 7405, 8380, 11596, 11597, 25225], name: "Sunder Armor", duration: 30000, color: "#e67e22" },
            { ids: [1160, 6190, 11554, 11555, 11556, 25202], name: "Demoralizing Shout", duration: 30000, color: "#e74c3c" },
            { ids: [6343, 8198, 8204, 8205, 11580, 11581], name: "Thunder Clap", duration: 30000, color: "#3498db" },
        ]
    },
    "Paladin-Holy": {
        casts: [
            { ids: [19750, 19939, 19940, 19941, 19942, 19943], name: "Flash of Light" },
            { ids: [635, 639, 647, 1026, 1042, 3472, 10328, 10329, 25292], name: "Holy Light" },
            { ids: [20473, 20929, 20930], name: "Holy Shock" },
            { ids: [679, 678, 1866, 1211818, 1211819, 1211820], name: "Holy Strike" },
            { ids: [20271], name: "Judgement" },
        ],
        debuffs: [
            { ids: [20185, 20344, 20345, 20346], name: "Judgement of Light", duration: 10000, color: "#f1c40f" },
            { ids: [20186, 20354, 20355], name: "Judgement of Wisdom", duration: 10000, color: "#3da5d9" },
        ]
    },
    "Paladin-Protection": {
        casts: [
            { ids: [20925, 20927, 20928], name: "Holy Shield" },
            { ids: [2657, 20116, 20922, 20923, 20924], name: "Consecration" },
            { ids: [679, 678, 1866, 1211818, 1211819, 1211820], name: "Holy Strike" },
            { ids: [1311649, 1311656], name: "Seal of Fury" },
            { ids: [1214135], name: "Hand of Reckoning" },
            { ids: [20271], name: "Judgement" },
            { ids: [879, 5614, 5615, 10312, 10313, 10314], name: "Exorcism" },
        ],
        debuffs: [
            { ids: [20185, 20344, 20345, 20346], name: "Judgement of Light", duration: 10000, color: "#f1c40f" },
            { ids: [20186, 20354, 20355], name: "Judgement of Wisdom", duration: 10000, color: "#3da5d9" },
        ]
    },
    "Paladin-Retribution": {
        casts: [
            { ids: [679, 678, 1866, 1211818, 1211819, 1211820], name: "Holy Strike" },
            { ids: [20271], name: "Judgement" },
            { ids: [2657, 20116, 20922, 20923, 20924], name: "Consecration" },
            { ids: [879, 5614, 5615, 10312, 10313, 10314], name: "Exorcism" },
            { ids: [24275, 24274, 24239], name: "Hammer of Wrath" },
        ],
        debuffs: [
            { ids: [20185, 20344, 20345, 20346], name: "Judgement of Light", duration: 10000, color: "#f1c40f" },
            { ids: [20186, 20354, 20355], name: "Judgement of Wisdom", duration: 10000, color: "#3da5d9" },
        ]
    },
    "Hunter-BeastMastery": {
        casts: [
            { ids: [75], name: "Auto Shot" },
            { ids: [3044, 14281, 14282, 14283, 14284, 14285, 14286, 14287], name: "Arcane Shot" },
            { ids: [2643, 14288, 14289, 14290, 25294], name: "Multi-Shot" },
            { ids: [19801], name: "Tranquilizing Shot" },
        ],
        debuffs: [
            { ids: [1130, 14323, 14324, 14325], name: "Hunter's Mark", duration: 120000, color: "#e67e22" },
            { ids: [1978, 13549, 13550, 13551, 13552, 13553, 13554, 13555, 25295], name: "Serpent Sting", duration: 15000, color: "#27ae60" },
        ]
    },
    "Hunter-Marksmanship": {
        casts: [
            { ids: [75], name: "Auto Shot" },
            { ids: [19434, 20900, 20901, 20902, 20903, 20904], name: "Aimed Shot" },
            { ids: [2643, 14288, 14289, 14290, 25294], name: "Multi-Shot" },
            { ids: [3044, 14281, 14282, 14283, 14284, 14285, 14286, 14287], name: "Arcane Shot" },
            { ids: [19801], name: "Tranquilizing Shot" },
        ],
        debuffs: [
            { ids: [1130, 14323, 14324, 14325], name: "Hunter's Mark", duration: 120000, color: "#e67e22" },
            { ids: [1978, 13549, 13550, 13551, 13552, 13553, 13554, 13555, 25295], name: "Serpent Sting", duration: 15000, color: "#27ae60" },
        ]
    },
    "Hunter-Survival": {
        casts: [
            { ids: [75], name: "Auto Shot" },
            { ids: [2643, 14288, 14289, 14290, 25294], name: "Multi-Shot" },
            { ids: [3044, 14281, 14282, 14283, 14284, 14285, 14286, 14287], name: "Arcane Shot" },
            { ids: [2973, 14267, 14268], name: "Raptor Strike" },
            { ids: [1495, 14269, 14270], name: "Mongoose Bite" },
            { ids: [1218219], name: "Carve" },
            { ids: [1218221], name: "Lacerate" },
            { ids: [19801], name: "Tranquilizing Shot" },
        ],
        debuffs: [
            { ids: [1130, 14323, 14324, 14325], name: "Hunter's Mark", duration: 120000, color: "#e67e22" },
            { ids: [1978, 13549, 13550, 13551, 13552, 13553, 13554, 13555, 25295], name: "Serpent Sting", duration: 15000, color: "#27ae60" },
        ]
    },
    "Rogue-Combat": {
        casts: [
            { ids: [1752, 1757, 1758, 1759, 1760, 8621, 11293, 11294], name: "Sinister Strike" },
            { ids: [2098, 6760, 6761, 6762, 8623, 8624, 11299, 11300, 31016], name: "Eviscerate" },
            { ids: [5171, 6774], name: "Slice and Dice" },
            { ids: [1966, 6768, 8637, 11303, 25302], name: "Feint" },
        ],
        debuffs: [
            { ids: [5171, 6774], name: "Slice and Dice", isBuff: true, duration: 30000, color: "#f1c40f" },
            { ids: [1943, 8639, 8640, 11273, 11274, 11275], name: "Rupture", duration: 16000, color: "#e74c3c" },
            { ids: [8647, 8649, 8650, 11197, 11198], name: "Expose Armor", duration: 30000, color: "#e67e22" },
        ]
    },
    "Rogue-Assassination": {
        casts: [
            { ids: [53, 2589, 2590, 2591, 8721, 11279, 11280, 11281, 25300], name: "Backstab" },
            { ids: [1752, 1757, 1758, 1759, 1760, 8621, 11293, 11294], name: "Sinister Strike" },
            { ids: [2098, 6760, 6761, 6762, 8623, 8624, 11299, 11300, 31016], name: "Eviscerate" },
            { ids: [5171, 6774], name: "Slice and Dice" },
        ],
        debuffs: [
            { ids: [5171, 6774], name: "Slice and Dice", isBuff: true, duration: 30000, color: "#f1c40f" },
            { ids: [1943, 8639, 8640, 11273, 11274, 11275], name: "Rupture", duration: 16000, color: "#e74c3c" },
            { ids: [8647, 8649, 8650, 11197, 11198], name: "Expose Armor", duration: 30000, color: "#e67e22" },
        ]
    },
    "Rogue-Subtlety": {
        casts: [
            { ids: [53, 2589, 2590, 2591, 8721, 11279, 11280, 11281, 25300], name: "Backstab" },
            { ids: [1752, 1757, 1758, 1759, 1760, 8621, 11293, 11294], name: "Sinister Strike" },
            { ids: [2098, 6760, 6761, 6762, 8623, 8624, 11299, 11300, 31016], name: "Eviscerate" },
            { ids: [5171, 6774], name: "Slice and Dice" },
            { ids: [8676, 8724, 8725, 11267, 11268, 11269], name: "Ambush" },
            { ids: [703, 8631, 8632, 8633, 11289, 11290], name: "Garrote" },
        ],
        debuffs: [
            { ids: [5171, 6774], name: "Slice and Dice", isBuff: true, duration: 30000, color: "#f1c40f" },
            { ids: [1943, 8639, 8640, 11273, 11274, 11275], name: "Rupture", duration: 16000, color: "#e74c3c" },
        ]
    },
    "Priest-Shadow": {
        casts: [
            { ids: [15407, 17311, 17312, 17313, 17314, 18807], name: "Mind Flay" },
            { ids: [8092, 8102, 8103, 8104, 8105, 8106, 10945, 10946, 10947], name: "Mind Blast" },
            { ids: [32379], name: "Shadow Word: Death" },
        ],
        debuffs: [
            { ids: [589, 594, 970, 992, 2767, 10892, 10893, 10894], name: "Shadow Word: Pain", duration: 18000, color: "#8e44ad" },
            { ids: [15286], name: "Vampiric Embrace", duration: 60000, color: "#c0392b" },
            { ids: [2944, 19276, 19277, 19278, 19279, 19280], name: "Devouring Plague", duration: 24000, color: "#8e44ad" },
        ]
    },
    "Priest-Holy": {
        casts: [
            { ids: [2061, 9472, 9473, 9474, 10915, 10916, 10917], name: "Flash Heal" },
            { ids: [2060, 10963, 10964, 10965, 25314], name: "Greater Heal" },
            { ids: [596, 996, 10960, 10961, 25316], name: "Prayer of Healing" },
            { ids: [139, 6074, 6075, 6076, 6077, 6078, 10927, 10928, 10929, 25315], name: "Renew" },
        ],
        debuffs: []
    },
    "Priest-Discipline": {
        casts: [
            { ids: [2061, 9472, 9473, 9474, 10915, 10916, 10917], name: "Flash Heal" },
            { ids: [2060, 10963, 10964, 10965, 25314], name: "Greater Heal" },
            { ids: [17, 592, 600, 3747, 6065, 6066, 10898, 10899, 10900, 10901], name: "Power Word: Shield" },
            { ids: [139, 6074, 6075, 6076, 6077, 6078, 10927, 10928, 10929, 25315], name: "Renew" },
        ],
        debuffs: []
    },
    "Mage-Fire": {
        casts: [
            { ids: [133, 143, 145, 3155, 8412, 8413, 10144, 10145, 10148, 10149, 10150, 10151, 25306], name: "Fireball" },
            { ids: [2948, 8444, 8445, 8446, 10205, 10206, 10207], name: "Scorch" },
            { ids: [2136, 2137, 2138, 8414, 10197, 10199, 10200], name: "Fire Blast" },
            { ids: [11366, 12505, 12522, 12523, 12524, 12525, 12526, 12527], name: "Pyroblast" },
        ],
        debuffs: [
            { ids: [22959], name: "Improved Scorch", duration: 30000, color: "#e67e22" },
            { ids: [12654, 12846, 12847, 12848, 12849], name: "Ignite", duration: 4000, color: "#e74c3c" },
        ]
    },
    "Mage-Frost": {
        casts: [
            { ids: [116, 205, 837, 7322, 8406, 8407, 8408, 10179, 10180, 10181, 25304], name: "Frostbolt" },
            { ids: [1213895], name: "Ice Lance" },
            { ids: [120, 8492, 10159, 10160, 10161], name: "Cone of Cold" },
            { ids: [10, 6141, 8427, 10185, 10186, 10187], name: "Blizzard" },
            { ids: [1449, 8437, 8438, 8439, 10201, 10202], name: "Arcane Explosion" },
        ],
        debuffs: [
            { ids: [12579], name: "Winter's Chill", duration: 15000, color: "#3498db" },
        ]
    },
    "Mage-Arcane": {
        casts: [
            { ids: [5143, 5144, 5145, 8416, 8417, 10211, 10212], name: "Arcane Missiles" },
            { ids: [1449, 8437, 8438, 8439, 10201, 10202], name: "Arcane Explosion" },
            { ids: [2948, 8444, 8445, 8446, 10205, 10206, 10207], name: "Scorch" },
        ],
        debuffs: []
    },
    "Warlock-Affliction": {
        casts: [
            { ids: [686, 695, 705, 1088, 1106, 7641, 11659, 11660, 11661, 25307], name: "Shadow Bolt" },
            { ids: [1213158], name: "Unstable Affliction" },
            { ids: [1213182], name: "Seed of Corruption" },
            { ids: [1454, 1455, 1456, 11687, 11688, 11689], name: "Life Tap" },
            { ids: [689, 699, 709, 7651, 11699, 11700], name: "Drain Life" },
            { ids: [710, 18647], name: "Banish" },
        ],
        debuffs: [
            { ids: [172, 6222, 6223, 7648, 11671, 11672, 25311], name: "Corruption", duration: 18000, color: "#27ae60" },
            { ids: [980, 1014, 6215, 11711, 11712, 11713], name: "Curse of Agony", duration: 24000, color: "#d35400" },
            { ids: [1213158], name: "Unstable Affliction", duration: 18000, color: "#e67e22" },
            { ids: [1490, 11721, 11722], name: "Curse of the Elements", duration: 300000, color: "#9b59b6" },
            { ids: [17937, 17938], name: "Curse of Shadow", duration: 300000, color: "#8e44ad" },
            { ids: [704, 7658, 7659, 11717], name: "Curse of Recklessness", duration: 120000, color: "#e74c3c" },
        ]
    },
    "Warlock-Destruction": {
        casts: [
            { ids: [686, 695, 705, 1088, 1106, 7641, 11659, 11660, 11661, 25307], name: "Shadow Bolt" },
            { ids: [1213167], name: "Incinerate" },
            { ids: [5676, 17919, 17920, 17921, 17922, 17923], name: "Searing Pain" },
            { ids: [17877, 17927, 17928, 17929, 17930], name: "Shadowburn" },
            { ids: [17962, 18930, 18931, 18932], name: "Conflagrate" },
            { ids: [1454, 1455, 1456, 11687, 11688, 11689], name: "Life Tap" },
            { ids: [710, 18647], name: "Banish" },
        ],
        debuffs: [
            { ids: [348, 707, 1094, 2941, 11665, 11667, 11668, 25309], name: "Immolate", duration: 15000, color: "#e67e22" },
            { ids: [172, 6222, 6223, 7648, 11671, 11672, 25311], name: "Corruption", duration: 18000, color: "#27ae60" },
            { ids: [1490, 11721, 11722], name: "Curse of the Elements", duration: 300000, color: "#9b59b6" },
            { ids: [17937, 17938], name: "Curse of Shadow", duration: 300000, color: "#8e44ad" },
            { ids: [704, 7658, 7659, 11717], name: "Curse of Recklessness", duration: 120000, color: "#e74c3c" },
        ]
    },
    "Warlock-Demonology": {
        casts: [
            { ids: [686, 695, 705, 1088, 1106, 7641, 11659, 11660, 11661, 25307], name: "Shadow Bolt" },
            { ids: [1454, 1455, 1456, 11687, 11688, 11689], name: "Life Tap" },
            { ids: [689, 699, 709, 7651, 11699, 11700], name: "Drain Life" },
            { ids: [710, 18647], name: "Banish" },
        ],
        debuffs: [
            { ids: [172, 6222, 6223, 7648, 11671, 11672, 25311], name: "Corruption", duration: 18000, color: "#27ae60" },
            { ids: [980, 1014, 6215, 11711, 11712, 11713], name: "Curse of Agony", duration: 24000, color: "#d35400" },
            { ids: [1490, 11721, 11722], name: "Curse of the Elements", duration: 300000, color: "#9b59b6" },
            { ids: [17937, 17938], name: "Curse of Shadow", duration: 300000, color: "#8e44ad" },
            { ids: [704, 7658, 7659, 11717], name: "Curse of Recklessness", duration: 120000, color: "#e74c3c" },
        ]
    },
    "Druid-Balance": {
        casts: [
            { ids: [2912, 8949, 8950, 8951, 9875, 9876, 25298], name: "Starfire" },
            { ids: [5176, 5177, 5178, 5179, 5180, 6780, 8905, 9912], name: "Wrath" },
            { ids: [8921, 8924, 8925, 8926, 8927, 8928, 8929, 9833, 9834, 9835], name: "Moonfire" },
        ],
        debuffs: [
            { ids: [770, 778, 9749, 9907], name: "Faerie Fire", duration: 40000, color: "#9b59b6" },
            { ids: [8921, 8924, 8925, 8926, 8927, 8928, 8929, 9833, 9834, 9835], name: "Moonfire", duration: 12000, color: "#2980b9" },
            { ids: [5570, 24974, 24975, 24976, 24977], name: "Insect Swarm", duration: 12000, color: "#27ae60" },
        ]
    },
    "Druid-Feral": {
        casts: [
            { ids: [5221, 6800, 8992, 9829, 9830], name: "Shred" },
            { ids: [1213301, 1213310], name: "Mangle" },
            { ids: [1082, 3029, 5201, 9849, 9850], name: "Claw" },
            { ids: [22568, 22827, 22828, 22829, 31018], name: "Ferocious Bite" },
            { ids: [6807, 6808, 6809, 8972, 9745, 9880, 9881], name: "Maul" },
            { ids: [779, 780, 769, 9754, 9908], name: "Swipe" },
            { ids: [5211, 6798, 8983], name: "Bash" },
        ],
        debuffs: [
            { ids: [16857, 17390, 17391, 17392], name: "Faerie Fire (Feral)", duration: 40000, color: "#9b59b6" },
            { ids: [99, 1735, 9490, 9747, 9898], name: "Demoralizing Roar", duration: 30000, color: "#e74c3c" },
            { ids: [1079, 9492, 9493, 9752, 9894, 9896], name: "Rip", duration: 12000, color: "#c0392b" },
            { ids: [1822, 1823, 1824, 9904], name: "Rake", duration: 9000, color: "#d35400" },
        ]
    },
    "Druid-Restoration": {
        casts: [
            { ids: [5185, 5186, 5187, 5188, 5189, 6778, 8903, 9758, 9888, 9889, 25297], name: "Healing Touch" },
            { ids: [8936, 8938, 8939, 8940, 8941, 9750, 9856, 9857, 9858], name: "Regrowth" },
            { ids: [774, 1058, 1430, 2090, 2091, 3627, 8910, 9839, 9840, 9841, 25299], name: "Rejuvenation" },
            { ids: [740, 8918, 9862, 9863], name: "Tranquility" },
        ],
        debuffs: [
            { ids: [770, 778, 9749, 9907], name: "Faerie Fire", duration: 40000, color: "#9b59b6" },
        ]
    },
    "Shaman-Elemental": {
        casts: [
            { ids: [403, 529, 548, 915, 943, 6041, 10391, 10392, 15207, 15208], name: "Lightning Bolt" },
            { ids: [421, 930, 2860, 10605], name: "Chain Lightning" },
            { ids: [8042, 8044, 8045, 8046, 10412, 10413, 10414], name: "Earth Shock" },
        ],
        debuffs: [
            { ids: [8050, 8052, 8053, 10447, 10448], name: "Flame Shock", duration: 12000, color: "#e67e22" },
        ]
    },
    "Shaman-Enhancement": {
        casts: [
            { ids: [17364], name: "Stormstrike" },
            { ids: [8042, 8044, 8045, 8046, 10412, 10413, 10414], name: "Earth Shock" },
        ],
        debuffs: [
            { ids: [8050, 8052, 8053, 10447, 10448], name: "Flame Shock", duration: 12000, color: "#e67e22" },
        ]
    },
    "Shaman-Restoration": {
        casts: [
            { ids: [1064, 10622, 10623], name: "Chain Heal" },
            { ids: [331, 332, 547, 913, 939, 959, 8005, 10395, 10396, 25357], name: "Healing Wave" },
            { ids: [8004, 8008, 8010, 10466, 10467, 10468], name: "Lesser Healing Wave" },
            { ids: [1213870], name: "Earth Shield" },
        ],
        debuffs: []
    },
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

const TRINKET_NAMES = new Set([
    "Slayer's Crest", "Jom Gabbar", "Kiss of the Spider", "Eye of Diminution",
    "Diamond Flask", "Earthstrike", "Badge of the Swarmguard",
    "Zandalarian Hero Charm", "Lifegiving Gem", "Styleen's Impeding Scarab",
    "Abacus of Violent Odds", "Mark of the Champion", "Scarab Brooch",
    "Loatheb's Reflection", "The Eye of the Dead",
]);

export function isTrinket(name) {
    if (!name) return false;
    return TRINKET_NAMES.has(name) || name.includes("Use:") || name.includes("Equip:");
}

export function getSpellSortCategory(name, spellId) {
    if (!name) return 99;
    const n = name.toLowerCase();
    // Primary rotational
    if (n.includes("strike") || n.includes("bolt") || n.includes("shot") || n.includes("blast")) return 1;
    // Secondary rotational
    if (n.includes("seal") || n.includes("sting") || n.includes("curse")) return 2;
    // AoE
    if (n.includes("whirlwind") || n.includes("cleave") || n.includes("nova") || n.includes("volley")) return 3;
    // Cooldowns
    if (n.includes("shield wall") || n.includes("recklessness") || n.includes("death wish")) return 4;
    // Consumables
    if (BUFF_DB[spellId] && BUFF_DB[spellId].category === 5) return 5;
    return 10;
}

// ═══════════════════════════════════════════════════════════════════════════
// INITIALIZATION — Fetches all data from server.py API
// ═══════════════════════════════════════════════════════════════════════════

export async function initGameData() {
    try {
        const [classesRes, abilitiesRes, consumablesRes, enchantsRes] = await Promise.all([
            fetch('/api/data/classes').then(r => r.json()),
            fetch('/api/data/abilities').then(r => r.json()),
            fetch('/api/data/consumables').then(r => r.json()),
            fetch('/api/data/enchants').then(r => r.json()),
        ]);

        // ── Build CLASSES, CLASS_COLORS, SPEC_ICONS, SPEC_ROLES ──
        CLASSES.length = 0;
        classesRes.forEach(cls => {
            CLASSES.push(cls.id || cls.name);
            CLASS_COLORS[cls.id || cls.name] = cls.color || '#888888';

            // Class-level icon (fallback to first spec icon)
            if (cls.icon) {
                SPEC_ICONS[cls.id || cls.name] = cls.icon;
            }

            if (cls.specs) {
                cls.specs.forEach(spec => {
                    const specKey = `${cls.id || cls.name}-${spec.name}`;
                    const spacelessKey = specKey.replace(/\s+/g, '');
                    let role = spec.role;
                    if (role === 'Melee') role = 'Melee DPS';
                    if (role === 'Ranged') role = 'Ranged DPS';

                    if (spec.icon) {
                        SPEC_ICONS[specKey] = spec.icon;
                        SPEC_ICONS[spacelessKey] = spec.icon;
                    }
                    if (role) {
                        SPEC_ROLES[specKey] = role;
                        SPEC_ROLES[spacelessKey] = role;
                    }
                });
            }
        });

        // ── Build SPELL_DB ──
        abilitiesRes.forEach(ability => {
            SPELL_DB[ability.spell_id] = {
                name: ability.name,
                icon: ability.icon,
                category: ability.category || 1,
                isInterrupt: !!ability.is_interrupt,
                isMechanic: !!ability.is_mechanic,
                isRes: !!ability.is_res,
            };
        });

        // ── Build BUFF_DB ──
        consumablesRes.forEach(item => {
            BUFF_DB[item.item_id] = {
                name: item.name,
                icon: item.icon,
                order: item.order_priority || 99,
                category: item.is_in_combat ? 5 : undefined,
            };
        });

        // ── Build ENCHANT_DB & OPTIMAL_ENCHANTS ──
        enchantsRes.forEach(ench => {
            ENCHANT_DB[ench.enchant_id] = {
                name: ench.name,
                icon: ench.icon || undefined,
            };
            // Build optimal enchants per spec
            if (ench.optimal_specs_best) {
                let bestSpecs;
                try { bestSpecs = typeof ench.optimal_specs_best === 'string' ? JSON.parse(ench.optimal_specs_best) : ench.optimal_specs_best; } catch(e) { bestSpecs = []; }
                bestSpecs.forEach(specKey => {
                    if (!OPTIMAL_ENCHANTS[specKey]) OPTIMAL_ENCHANTS[specKey] = { best: [], alt: [] };
                    OPTIMAL_ENCHANTS[specKey].best.push(ench.enchant_id);
                });
            }
            if (ench.optimal_specs_alt) {
                let altSpecs;
                try { altSpecs = typeof ench.optimal_specs_alt === 'string' ? JSON.parse(ench.optimal_specs_alt) : ench.optimal_specs_alt; } catch(e) { altSpecs = []; }
                altSpecs.forEach(specKey => {
                    if (!OPTIMAL_ENCHANTS[specKey]) OPTIMAL_ENCHANTS[specKey] = { best: [], alt: [] };
                    OPTIMAL_ENCHANTS[specKey].alt.push(ench.enchant_id);
                });
            }
        });

        console.log(`[gameData] Loaded: ${CLASSES.length} classes, ${Object.keys(SPELL_DB).length} spells, ${Object.keys(BUFF_DB).length} buffs, ${Object.keys(ENCHANT_DB).length} enchants`);

    } catch (err) {
        console.error('[gameData] Failed to load game data from API:', err);
        // App can still work with the hardcoded SPEC_ICONS defaults above
    }
}

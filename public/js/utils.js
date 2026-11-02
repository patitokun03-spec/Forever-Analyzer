import { CLASSES, SPEC_ICONS } from './gameData.js';

const SPEC_ALIASES = {
    "Druid-Guardian": "Druid-Feral",
    "Druid-Feral Combat": "Druid-Feral",
    "Warlock-Curses": "Warlock-Affliction",
    "Paladin-Justicar": "Paladin-Protection",
};

const CLASS_SPEC_DEFAULTS = {
    "Warrior": "Warrior-Fury",
    "Paladin": "Paladin-Holy",
    "Hunter": "Hunter-BeastMastery",
    "Rogue": "Rogue-Combat",
    "Priest": "Priest-Holy",
    "Shaman": "Shaman-Restoration",
    "Mage": "Mage-Fire",
    "Warlock": "Warlock-Destruction",
    "Druid": "Druid-Balance",
};

export function detectPlayerSpec(player, combatantInfo) {
    if (!player) return "Unknown";
    if (player.icon) {
        const iconStr = player.icon.toLowerCase();
        const classNames = (CLASSES || []).map(c => c.toLowerCase());
        if (iconStr.includes('-') || classNames.includes(iconStr)) {
            const parts = iconStr.split('-');
            if (parts.length >= 2) {
                const normalized = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('-');
                if (SPEC_ALIASES[normalized]) return SPEC_ALIASES[normalized];
                if (SPEC_ICONS && SPEC_ICONS[normalized]) return normalized;
                // Handle WCL generic icons like "Warrior-Warrior" or "Mage-DPS"
                const baseClass = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
                if (CLASSES && CLASSES.includes(baseClass)) {
                    return inferSpecFromStats(baseClass, combatantInfo);
                }
            } else if (parts.length === 1) {
                const normalized = iconStr.charAt(0).toUpperCase() + iconStr.slice(1);
                if (CLASSES && CLASSES.includes(normalized)) {
                    return inferSpecFromStats(normalized, combatantInfo);
                }
            }
        }
        return player.icon;
    }
    if (player.subType && CLASSES && CLASSES.includes(player.subType)) {
        return inferSpecFromStats(player.subType, combatantInfo);
    }
    return player.subType || "Unknown";
}

export function inferSpecFromStats(className, info) {
    if (!info) return CLASS_SPEC_DEFAULTS[className] || className;

    // 1. Primary detection: WCL CombatantInfo talent tree point distribution [tree0, tree1, tree2]
    if (Array.isArray(info.talents) && info.talents.length >= 3) {
        const t0 = info.talents[0]?.id || 0;
        const t1 = info.talents[1]?.id || 0;
        const t2 = info.talents[2]?.id || 0;
        const totalPts = t0 + t1 + t2;
        const auraIds = new Set((info.auras || []).map(a => a.ability));

        if (totalPts > 0) {
            switch (className) {
                case "Warrior":
                    // Fury-Prot (e.g. 0/32/19) or Deep Prot (e.g. 11/5/35) or Defensive Stance aura (71) with Prot pts
                    if (t2 >= 15 || (auraIds.has(71) && t2 >= 11)) return "Warrior-Protection";
                    if (t0 > t1 && t0 >= 20) return "Warrior-Arms";
                    return "Warrior-Fury";
                case "Paladin":
                    if (t1 >= 15 || (auraIds.has(25780) && t1 >= 11)) return "Paladin-Protection";
                    if (t2 > t0 && t2 >= 20) return "Paladin-Retribution";
                    return "Paladin-Holy";
                case "Hunter":
                    if (t0 >= t1 && t0 >= t2) return "Hunter-BeastMastery";
                    if (t2 > t1 && t2 > t0) return "Hunter-Survival";
                    return "Hunter-Marksmanship";
                case "Rogue":
                    if (t0 > t1 && t0 >= t2) return "Rogue-Assassination";
                    if (t2 > t1 && t2 > t0) return "Rogue-Subtlety";
                    return "Rogue-Combat";
                case "Priest":
                    if (t2 >= 20 || (t2 > t0 && t2 > t1)) return "Priest-Shadow";
                    if (t0 > t1 && t0 >= 26) return "Priest-Discipline";
                    return "Priest-Holy";
                case "Shaman":
                    if (t0 >= t1 && t0 >= t2 && t0 >= 20) return "Shaman-Elemental";
                    if (t1 > t0 && t1 >= t2 && t1 >= 20) return "Shaman-Enhancement";
                    return "Shaman-Restoration";
                case "Mage":
                    if (t1 >= 20 && t1 >= t2) return "Mage-Fire";
                    if (t2 >= 18) return "Mage-Frost";
                    if (t0 > t1 && t0 > t2) return "Mage-Arcane";
                    return "Mage-Frost";
                case "Warlock":
                    if (t0 > t2 && t0 >= 21) return "Warlock-Affliction";
                    if (t1 > t0 && t1 > t2 && t1 >= 25) return "Warlock-Demonology";
                    return "Warlock-Destruction";
                case "Druid":
                    if (t1 >= 25 || auraIds.has(9634)) return "Druid-Feral";
                    if (t2 >= 21) return "Druid-Restoration";
                    if (t0 >= 25) return "Druid-Balance";
                    return t1 > t2 ? "Druid-Feral" : "Druid-Restoration";
            }
        }
    }

    // 2. Secondary fallback: combatant stats heuristics
    const agi = info.agility || 0;
    const intel = info.intellect || 0;
    const str = info.strength || 0;
    const armor = info.armor || 0;
    const hitSpell = info.hitSpell || 0;
    const hitMelee = info.hitMelee || 0;
    const critSpell = info.critSpell || 0;
    const block = info.block || 0;

    switch (className) {
        case "Paladin":
            if (armor > 12000 || block > 15) return "Paladin-Protection";
            if (str > intel && str > 250 && hitMelee > 0) return "Paladin-Retribution";
            return "Paladin-Holy";
        case "Warrior":
            if (armor > 12000 || block > 15) return "Warrior-Protection";
            return "Warrior-Fury";
        case "Druid":
            if ((agi > 300 || armor > 15000) && hitMelee > hitSpell) return "Druid-Feral";
            if (hitSpell > 50 && critSpell > 50) return "Druid-Balance";
            if (intel > 300 && hitSpell <= 50 && hitMelee <= 30) return "Druid-Restoration";
            return agi > intel ? "Druid-Feral" : "Druid-Balance";
        case "Priest":
            if (hitSpell > 50 && critSpell > 50) return "Priest-Shadow";
            return "Priest-Holy";
        case "Shaman":
            if (agi > 300 && hitMelee > 30) return "Shaman-Enhancement";
            if (hitSpell > 50 && critSpell > 50) return "Shaman-Elemental";
            return "Shaman-Restoration";
        default:
            return CLASS_SPEC_DEFAULTS[className] || className;
    }
}

export function parseLogId(input) {
    if (!input) return "";
    let val = input.trim();
    if (val.includes("warcraftlogs.com/reports/")) {
        val = val.split("/reports/")[1].split(/[#?\/]/)[0];
    }
    return val;
}

export function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function formatDuration(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

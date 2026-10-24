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
    const agi = info.agility || 0;
    const intel = info.intellect || 0;
    const str = info.strength || 0;
    const armor = info.armor || 0;
    const hitSpell = info.hitSpell || 0;
    const hitMelee = info.hitMelee || 0;
    const critSpell = info.critSpell || 0;
    const block = info.block || 0;
    // const dodge = info.dodge || 0; // Unused in original code

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

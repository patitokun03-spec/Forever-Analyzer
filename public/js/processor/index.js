// public/js/processor/index.js
// Main entry point for combat log parsing and player data processing.
// Orchestrates modular sub-trackers and caches results for high performance.

import { state } from '../state.js';
import { SPELL_DB } from '../gameData.js';
import { parseCombatantInfo } from './combatantParser.js';
import { trackDeaths } from './deathTracker.js';
import { trackAbilities } from './abilityTracker.js';
import { trackTimeline } from './timelineTracker.js';
import { trackClassAbilities } from './classTracker.js';

const SEAL_TO_TYPE = {
    // Seal of Righteousness
    20154: 'Righteousness', 21084: 'Righteousness', 20287: 'Righteousness',
    20288: 'Righteousness', 20289: 'Righteousness', 20290: 'Righteousness',
    20291: 'Righteousness', 20292: 'Righteousness', 20293: 'Righteousness',
    25742: 'Righteousness', 25740: 'Righteousness', 25739: 'Righteousness',
    25738: 'Righteousness', 25737: 'Righteousness', 25736: 'Righteousness',
    25735: 'Righteousness', 25713: 'Righteousness',
    // Seal of the Crusader
    21082: 'Crusader', 20162: 'Crusader', 20305: 'Crusader', 20306: 'Crusader',
    20307: 'Crusader', 20308: 'Crusader',
    // Seal of Justice
    20164: 'Justice',
    // Seal of Light
    20165: 'Light', 20347: 'Light', 20348: 'Light', 20349: 'Light',
    // Seal of Wisdom
    20166: 'Wisdom', 20356: 'Wisdom', 20357: 'Wisdom',
    // Seal of Command
    20375: 'Command', 20915: 'Command', 20918: 'Command',
    20919: 'Command', 20920: 'Command',
    // Seal of Fury (WoW Forever Tank Taunt Seal)
    1311649: 'Fury', 1311656: 'Fury'
};

export function processPlayerData(fightId, fightEvents, player) {
    // Check in-memory memoization cache first to eliminate redundant CPU passes
    const cacheKey = `${fightId}_${player.id}`;
    if (state.processedPlayerCache && state.processedPlayerCache[cacheKey]) {
        return state.processedPlayerCache[cacheKey];
    }

    const ctx = {
        combatantInfos: [],
        lastCiTimestamp: 0,
        tempEnchants: [],
        spells: {},
        timelineEvents: {},
        deaths: [],
        rebirths: [],
        activeSeal: null,
        itemCasts: {},
        prePots: {},
        targetLifespans: {},
        actorNameMap: {},
        castCounts: {},
        debuffTimeline: {}
    };

    const allActorsSrc = state.allActors && state.allActors.length > 0
        ? state.allActors
        : (state.currentReport && state.currentReport.masterData && state.currentReport.masterData.actors) || [];
    allActorsSrc.forEach(a => { ctx.actorNameMap[a.id] = a.name; });
    if (state.currentActors) {
        state.currentActors.forEach(a => { if (!ctx.actorNameMap[a.id]) ctx.actorNameMap[a.id] = a.name; });
    }

    ctx.spec = state.detectedSpecs[player.name] || player.subType;

    parseCombatantInfo(fightId, fightEvents, player, ctx, SEAL_TO_TYPE);
    trackDeaths(fightEvents, player, ctx);
    trackAbilities(fightEvents, player, ctx, SEAL_TO_TYPE);
    trackTimeline(fightEvents, player, ctx);
    trackClassAbilities(fightEvents, player, ctx);

    Object.keys(ctx.itemCasts).forEach(id => {
        if (id === '_lastTimestamp') return;
        if (SPELL_DB[id] && SPELL_DB[id].category === 5) {
            if (ctx.spells[id]) {
                ctx.spells[id].count += ctx.itemCasts[id];
            }
        }
    });

    const result = {
        combatantInfos: ctx.combatantInfos,
        tempEnchants: ctx.tempEnchants,
        spells: ctx.spells,
        timelineEvents: ctx.timelineEvents,
        deaths: ctx.deaths,
        rebirths: ctx.rebirths,
        itemCasts: ctx.itemCasts,
        prePots: ctx.prePots,
        castCounts: ctx.castCounts,
        debuffTimeline: ctx.debuffTimeline,
        targetLifespans: ctx.targetLifespans,
        spec: ctx.spec
    };

    if (!state.processedPlayerCache) state.processedPlayerCache = {};
    state.processedPlayerCache[cacheKey] = result;

    return result;
}

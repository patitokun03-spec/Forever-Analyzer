import { TIMELINE_SPELLS } from '../gameData.js';

/**
 * Tracks combat cooldowns, active trinket procs, and external buffs for the player.
 * Deduplicates cast and applybuff events and avoids cross-player bleed.
 */
export function trackTimeline(fightEvents, player, ctx) {
    fightEvents.forEach(ev => {
        const isTarget = ev.targetID === player.id;
        const isSource = ev.sourceID === player.id;
        if (!isTarget && !isSource) return;

        const spellId = ev.abilityGameID;
        const spellConfig = TIMELINE_SPELLS[spellId];
        if (!spellConfig) return;

        const defaultDuration = spellConfig.duration || 0;

        // Generate key for timeline (supports external buffs like Innervate, Power Infusion, BoP)
        let timelineKey = String(spellId);
        if ([29166, 10060, 1022].includes(spellId)) {
            if (isTarget && ev.sourceID && ev.sourceID !== player.id) {
                const sourceName = ctx.actorNameMap[ev.sourceID] || 'Unknown';
                timelineKey = `${spellId}-${sourceName}`;
            } else if (isSource && ev.targetID && ev.targetID !== player.id) {
                const targetName = ctx.actorNameMap[ev.targetID] || 'Target';
                timelineKey = `${spellId}-${targetName}`;
            }
        }

        if (!ctx.timelineEvents[timelineKey]) ctx.timelineEvents[timelineKey] = [];
        const list = ctx.timelineEvents[timelineKey];

        if (ev.type === 'cast' && isSource) {
            // Check if already created recently (e.g. within 1s)
            let existing = list.find(t => Math.abs(t.start - ev.timestamp) <= 1000);
            if (!existing) {
                const expectedEnd = defaultDuration > 0 ? ev.timestamp + defaultDuration : null;
                list.push({ start: ev.timestamp, end: expectedEnd, open: defaultDuration > 0 });
            }
        } else if (['applybuff', 'applybuffstack', 'refreshbuff'].includes(ev.type) && isTarget) {
            // Buff applied/refreshed on player
            let existing = list.find(t => Math.abs(t.start - ev.timestamp) <= 1000);
            if (!existing) {
                const expectedEnd = defaultDuration > 0 ? ev.timestamp + defaultDuration : null;
                list.push({ start: ev.timestamp, end: expectedEnd, open: true });
            } else {
                existing.open = true;
            }
        } else if (ev.type === 'removebuff' && isTarget) {
            // Buff removed from player
            let openEv = list.slice().reverse().find(t => t.open || (t.start <= ev.timestamp && (t.end === null || t.end >= ev.timestamp)));
            if (openEv) {
                openEv.end = ev.timestamp;
                openEv.open = false;
            }
        }
    });

    const fightEndTl = fightEvents.length > 0 ? fightEvents[fightEvents.length - 1].timestamp : 0;
    const playerLife = ctx.targetLifespans[player.name];
    const playerDeaths = (playerLife && playerLife.deaths) ? playerLife.deaths.slice().sort((a, b) => a - b) : [];

    Object.keys(ctx.timelineEvents).forEach(key => {
        const list = ctx.timelineEvents[key];
        list.forEach(ev => {
            let deathEnd = playerDeaths.find(d => d > ev.start);

            if (ev.end === null) {
                ev.end = deathEnd !== undefined ? deathEnd : fightEndTl;
            } else {
                if (deathEnd !== undefined && ev.end > deathEnd) {
                    ev.end = deathEnd;
                }
                if (ev.end > fightEndTl) {
                    ev.end = fightEndTl;
                }
            }
            delete ev.open;
        });

        // Filter out zero/negative duration intervals and sort chronologically
        ctx.timelineEvents[key] = list.filter(ev => ev.end > ev.start).sort((a, b) => a.start - b.start);
        if (ctx.timelineEvents[key].length === 0) {
            delete ctx.timelineEvents[key];
        }
    });
}

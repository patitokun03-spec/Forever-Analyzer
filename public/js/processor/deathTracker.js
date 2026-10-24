export function trackDeaths(fightEvents, player, ctx) {
    fightEvents.forEach(ev => {
        const checkActor = (id, ts) => {
            if (!id) return;
            const name = ctx.actorNameMap[id] || `#${id}`;
            if (!ctx.targetLifespans[name]) ctx.targetLifespans[name] = { firstSeen: ts, deaths: [], rebirths: [] };
            else if (ts < ctx.targetLifespans[name].firstSeen) ctx.targetLifespans[name].firstSeen = ts;
        };
        checkActor(ev.sourceID, ev.timestamp);
        checkActor(ev.targetID, ev.timestamp);

        if (ev.type === 'death') {
            const deathId = ev.targetID || ev.sourceID;
            if (deathId) {
                const name = ctx.actorNameMap[deathId] || `#${deathId}`;
                if (!ctx.targetLifespans[name]) ctx.targetLifespans[name] = { firstSeen: ev.timestamp, deaths: [], rebirths: [] };
                if (!ctx.targetLifespans[name].deaths.some(d => Math.abs(d - ev.timestamp) < 5000)) {
                    ctx.targetLifespans[name].deaths.push(ev.timestamp);
                }
            }
        }

        if (ev.type === 'death' && (ev.targetID === player.id || (!ev.targetID && ev.sourceID === player.id))) {
            if (!ctx.deaths.some(d => Math.abs(d - ev.timestamp) < 5000)) {
                ctx.deaths.push(ev.timestamp);
            }
        }

        const isRebirth = (ev.abilityGameID === 20484 || ev.abilityGameID === 20739 || ev.abilityGameID === 20742 || ev.abilityGameID === 20747 || ev.abilityGameID === 20748 || ev.abilityGameID === 26994);
        const isAnkh = (ev.abilityGameID === 20608);
        const isSoulstone = (ev.abilityGameID === 20707 || ev.abilityGameID === 20762 || ev.abilityGameID === 20749 || ev.abilityGameID === 20750 || ev.abilityGameID === 20758 || ev.abilityGameID === 27239);

        const playerIsTarget = (ev.targetID === player.id);
        const playerIsSource = (ev.sourceID === player.id);

        if (ctx.deaths.length > 0 && ctx.deaths.some(d => d < ev.timestamp)) {
            const hasRecentRes = ctx.rebirths.some(r => Math.abs(r.timestamp - ev.timestamp) < 2000);
            if (!hasRecentRes) {
                if ((ev.type === 'cast' || ev.type === 'resurrect' || ev.type === 'applybuff') && isRebirth && playerIsTarget) {
                    ctx.rebirths.push({ timestamp: ev.timestamp, type: 'Combat Res', icon: '🌿' });
                }
                else if (isAnkh && (playerIsTarget || playerIsSource)) {
                    if (ev.type === 'cast' || ev.type === 'applybuff' || ev.type === 'resurrect') {
                        ctx.rebirths.push({ timestamp: ev.timestamp, type: 'Ankh', icon: '⚡' });
                    }
                }
                else if ((ev.type === 'cast' || ev.type === 'applybuff' || ev.type === 'resurrect') && isSoulstone && playerIsTarget) {
                    ctx.rebirths.push({ timestamp: ev.timestamp, type: 'Soulstone', icon: '💎' });
                }
            }
        }

        if ((ev.type === 'cast' || ev.type === 'resurrect' || ev.type === 'applybuff') && isRebirth && ev.targetID) {
            const name = ctx.actorNameMap[ev.targetID] || `#${ev.targetID}`;
            if (ctx.targetLifespans[name]) {
                if (!ctx.targetLifespans[name].rebirths) ctx.targetLifespans[name].rebirths = [];
                ctx.targetLifespans[name].rebirths.push(ev.timestamp);
            }
        }
        else if (isAnkh && ev.sourceID && (ev.type === 'cast' || ev.type === 'applybuff' || ev.type === 'resurrect')) {
            const name = ctx.actorNameMap[ev.sourceID] || `#${ev.sourceID}`;
            if (ctx.targetLifespans[name]) {
                if (!ctx.targetLifespans[name].rebirths) ctx.targetLifespans[name].rebirths = [];
                ctx.targetLifespans[name].rebirths.push(ev.timestamp);
            }
        }
        else if ((ev.type === 'cast' || ev.type === 'applybuff' || ev.type === 'resurrect') && isSoulstone && ev.targetID) {
            const name = ctx.actorNameMap[ev.targetID] || `#${ev.targetID}`;
            if (ctx.targetLifespans[name]) {
                if (!ctx.targetLifespans[name].rebirths) ctx.targetLifespans[name].rebirths = [];
                ctx.targetLifespans[name].rebirths.push(ev.timestamp);
            }
        }
    });

    if (player.subType === 'Shaman' && ctx.deaths.length > 0) {
        ctx.deaths.forEach(deathTs => {
            const alreadyCovered = ctx.rebirths.some(r => r.timestamp > deathTs && r.timestamp < deathTs + 120000);
            if (alreadyCovered) return;

            const ANKH_MAX_WINDOW_MS = 30000;
            const firstCastAfterDeath = fightEvents.find(ev =>
                ev.type === 'cast' &&
                ev.sourceID === player.id &&
                ev.timestamp > deathTs &&
                ev.timestamp <= deathTs + ANKH_MAX_WINDOW_MS
            );

            if (firstCastAfterDeath) {
                ctx.rebirths.push({
                    timestamp: firstCastAfterDeath.timestamp,
                    type: 'Ankh',
                    icon: '⚡'
                });
            }
        });
    }
}

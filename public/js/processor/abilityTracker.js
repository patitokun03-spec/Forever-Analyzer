import { BUFF_DB, SPELL_DB } from '../gameData.js';

export function trackAbilities(fightEvents, player, ctx, SEAL_TO_TYPE) {
    fightEvents.forEach(ev => {
        let playerId = ev.sourceID;
        if (ev.type === 'damage' && ev.abilityGameID === 13241) playerId = ev.targetID;
        if (['applybuff', 'applybuffstack', 'refreshbuff', 'removebuff'].includes(ev.type)) playerId = ev.targetID;
        if (playerId !== player.id) return;

        let spellId = ev.abilityGameID;

        if (ev.type === 'cast' && spellId === 20424) return;

        let isBuffOrCast = ev.type === 'cast' || (ev.type === 'applybuff' && ev.sourceID === player.id);
        
        if (isBuffOrCast) {
            if (!ctx.itemCasts._lastTimestamp) ctx.itemCasts._lastTimestamp = {};
            
            let lastTs = ctx.itemCasts._lastTimestamp[spellId];
            let timeSinceLast = lastTs === undefined ? 999999 : (ev.timestamp - lastTs);
            if (timeSinceLast > 5000) {
                let counted = false;
                if (BUFF_DB[spellId]) {
                    ctx.itemCasts[spellId] = (ctx.itemCasts[spellId] || 0) + 1;
                    counted = true;
                    ctx.itemCasts._lastTimestamp[spellId] = ev.timestamp;
                }
                if (!counted && SPELL_DB[spellId] && SPELL_DB[spellId].category === 5) {
                    ctx.itemCasts[spellId] = (ctx.itemCasts[spellId] || 0) + 1;
                    counted = true;
                    ctx.itemCasts._lastTimestamp[spellId] = ev.timestamp;
                }
                
                if (!counted && SPELL_DB[spellId] && !SEAL_TO_TYPE[spellId] && !SPELL_DB[spellId].isInterrupt && !SPELL_DB[spellId].isMechanic && !SPELL_DB[spellId].isRes && SPELL_DB[spellId].category !== 5) {
                    if (spellId !== 13241) {
                        if (!ctx.spells[spellId]) ctx.spells[spellId] = { count: 0, damage: 0 };
                        ctx.spells[spellId].count += 1;
                        ctx.itemCasts._lastTimestamp[spellId] = ev.timestamp;
                    }
                }
            }
        }

        if (ev.type === 'applybuff' && !isBuffOrCast && SPELL_DB[spellId] && SPELL_DB[spellId].category === 3) {
            if (!ctx.itemCasts._lastTimestamp) ctx.itemCasts._lastTimestamp = {};
            let lastTs = ctx.itemCasts._lastTimestamp[spellId];
            let timeSinceLast = lastTs === undefined ? 999999 : (ev.timestamp - lastTs);
            if (timeSinceLast > 5000) {
                if (!ctx.spells[spellId]) ctx.spells[spellId] = { count: 0, damage: 0 };
                ctx.spells[spellId].count += 1;
                ctx.itemCasts._lastTimestamp[spellId] = ev.timestamp;
            }
        }

        // Track interrupt ability casts (Kick, Pummel, Counterspell, etc.)
        if (ev.type === 'cast' && SPELL_DB[spellId] && SPELL_DB[spellId].isInterrupt) {
            if (!ctx.spells[spellId]) ctx.spells[spellId] = { count: 0, interrupts: 0, damage: 0 };
            ctx.spells[spellId].count += 1;
        }

        if (ev.type === 'interrupt' && SPELL_DB[spellId]) {
            if (!ctx.spells[spellId]) ctx.spells[spellId] = { count: 0, interrupts: 0, damage: 0 };
            ctx.spells[spellId].interrupts = (ctx.spells[spellId].interrupts || 0) + 1;
            ctx.spells[spellId].count = Math.max(ctx.spells[spellId].count, ctx.spells[spellId].interrupts);
        }
        else if (ev.type === 'damage' && (spellId === 13241 || spellId === 13240 || spellId === 10646 || spellId === 23063 || spellId === 19769 || spellId === 19784 || spellId === 19821)) {
            let mapId = spellId === 13241 ? 10646 : spellId;
            if (!ctx.spells[mapId]) ctx.spells[mapId] = { count: 0, damage: 0 };
            ctx.spells[mapId].damage += (ev.amount || 0) + (ev.absorbed || 0);
            
            if (!ctx.itemCasts._lastTimestamp) ctx.itemCasts._lastTimestamp = {};
            let lastTs = ctx.itemCasts._lastTimestamp[mapId];
            let timeSinceLast = lastTs === undefined ? 999999 : (ev.timestamp - lastTs);
            if (timeSinceLast > 5000) {
                ctx.itemCasts[mapId] = (ctx.itemCasts[mapId] || 0) + 1;
                ctx.itemCasts._lastTimestamp[mapId] = ev.timestamp;
            }
        }
    });
}
